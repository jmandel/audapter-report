#!/bin/bash
# Build the real blab Audapter core (TransShiftMex) to WebAssembly with Emscripten in docker.
# Usage: wasm/build.sh [variant ...]        (default: full lite patched)
#   full          shipped buffer sizes (Audapter object ~266 MB, recorders 30 s), no fixes -> bit-faithful reference
#   lite          recorders shrunk to 10 s (AUDAPTER_MAX_REC_SIZE/DATA_SIZE=160000, ~141 MB), no fixes; DSP identical
#   patched       lite + all patches in patches/fixes/*.patch (OST-F1, OST-F2, I-01)
#   patched-full  full sizes + fixes
# Outputs per variant:
#   dist/audapter-<v>.mjs + .wasm   ES module factory (node, browser, AudioWorklet via wasmModule)
#   lib/audapter-<v>.js             single classic <script> (wasm inlined; works from file://), registers
#                                   globalThis.Audapter.factories['<v>'] + the JS API (web/audapter-api.mjs)
# Sources are prepped with harness/prep-src.sh (same MSVC->GCC portability edits as the native harness), then
# patches/build/*.patch (compile-time size flags, defaults unchanged) and, for patched variants, patches/fixes/*.patch.
set -e
W=$(cd "$(dirname "$0")" && pwd); H=$W/../harness
SRC=${AUDAPTER_SRC:-blab/audapter_mex}
EMSDK_IMAGE=${EMSDK_IMAGE:-emscripten/emsdk:latest}
mkdir -p "$W/dist" "$W/build" "$W/lib"
VARIANTS=${@:-full lite patched}

node "$W/tools/gen-defaults.mjs"   # web/audapter-defaults.mjs from testdata/defaults_*/defaults.json

build_one() {
  local v=$1 B=$W/build/$1 DEFS="" FIXES=""
  case $v in
    full) ;;
    lite) DEFS="-DAUDAPTER_MAX_REC_SIZE=160000 -DAUDAPTER_MAX_DATA_SIZE=160000";;
    patched) DEFS="-DAUDAPTER_MAX_REC_SIZE=160000 -DAUDAPTER_MAX_DATA_SIZE=160000"; FIXES=1;;
    patched-full) FIXES=1;;
    *) echo "unknown variant $v" >&2; exit 1;;
  esac
  "$H/prep-src.sh" "$SRC" "$B/src"
  # clang (unlike MSVC and GCC -fpermissive) rejects extra qualification of members inside the class body.
  sed -i 's/\([ \t*]\)Audapter::\([A-Za-z0-9_]*(\)/\1\2/' "$B/src/Audapter.h"
  if grep -n '[ \t*]Audapter::[A-Za-z0-9_]*(' "$B/src/Audapter.h"; then echo "qualification patch incomplete" >&2; exit 1; fi
  for p in "$W"/patches/build/*.patch; do patch -s -p1 -d "$B/src" < "$p"; done
  local applied=""
  if [ -n "$FIXES" ]; then
    for p in "$W"/patches/fixes/*.patch; do patch -s -p1 -d "$B/src" < "$p"; applied="$applied${applied:+,}$(basename "$p" .patch)"; done
  fi
  DEFS="$DEFS -DAUDAPTER_VARIANT=\\\"$v\\\" -DAUDAPTER_PATCHES=\\\"$applied\\\""
  local EXPORTS=_malloc,_free,_aud_create,_aud_reset,_aud_set_param,_aud_get_param,_aud_load_ost,_aud_load_pcf,_aud_frame_size,_aud_process,_aud_process_block,_aud_process_f32,_aud_get_signal,_aud_get_data,_aud_get_latest,_aud_last_error,_aud_set_verbose,_aud_sizeof_audapter,_aud_variant,_aud_patches,_aud_max_rec_size
  local LINK="-sMODULARIZE=1 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sMAXIMUM_MEMORY=2GB -sSTACK_SIZE=1MB -sFILESYSTEM=1 -sEXIT_RUNTIME=0 -fwasm-exceptions \
    -sEXPORTED_FUNCTIONS=$EXPORTS -sEXPORTED_RUNTIME_METHODS=stringToNewUTF8,UTF8ToString,HEAPF64,HEAPF32,HEAP32,HEAPU32,wasmMemory"
  local CF="-O2 -std=gnu++14 -fpermissive -w -fwasm-exceptions $DEFS -I/w/compat -I/h/compat -Isrc -include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept"
  docker run --rm -u $(id -u):$(id -g) -e HOME=/tmp -v "$W:/w" -v "$H:/h:ro" -w /w/build/$v "$EMSDK_IMAGE" bash -c "
set -e
em++ --version | head -1
rm -rf obj; mkdir -p obj
for f in Audapter ost pcf utils lpc_formant DSPF phase_vocoder time_domain_shifter version; do em++ $CF -c src/\$f.cpp -o obj/\$f.o & done
em++ $CF -c /w/src/audapter_c.cpp -o obj/audapter_c.o &
wait
ls obj/*.o | wc -l | grep -qx 10
em++ -O2 obj/*.o $LINK -sEXPORT_ES6=1 -sEXPORT_NAME=createAudapter -sENVIRONMENT=web,worker,node,shell -o /w/dist/audapter-$v.mjs
em++ -O2 obj/*.o $LINK -sSINGLE_FILE=1 -sEXPORT_NAME=__audapterFactory -sENVIRONMENT=web,worker,node -o obj/glue-single.js
"
  node "$W/tools/make-bundle.mjs" "$v" "$B/obj/glue-single.js" "$W/lib/audapter-$v.js"
  printf '%-13s wasm %7d B (gzip -9 %6d B) | lib/audapter-%s.js %7d B (gzip -9 %6d B) | patches: %s\n' "$v" \
    $(stat -c%s "$W/dist/audapter-$v.wasm") $(gzip -9c "$W/dist/audapter-$v.wasm" | wc -c) "$v" \
    $(stat -c%s "$W/lib/audapter-$v.js") $(gzip -9c "$W/lib/audapter-$v.js" | wc -c) "${applied:-none}"
}
for v in $VARIANTS; do build_one "$v"; done
