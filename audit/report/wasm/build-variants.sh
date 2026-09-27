#!/bin/bash
# Build the report's WebAssembly variants (report/wasm/variants.yaml) into report/prototype/wasm/audapter-<v>.js:
# single classic-script bundles (wasm inlined, work from file://) made with the wasm line's own tools
# (audit/wasm/src/audapter_c.cpp, compat/, tools/make-bundle.mjs, patches/build/size-flags.patch).
# Also writes report/prototype/wasm/<v>.build.json: source SHA, patches (sha256), compile defines, buffer sizes.
# Usage: audit/report/wasm/build-variants.sh [variant ...]      (default: all)
set -euo pipefail
R=$(cd "$(dirname "$0")/.." && pwd); A=$(cd "$R/.." && pwd); ROOT=$(cd "$A/.." && pwd); W=$A/wasm; H=$A/harness
EMSDK_IMAGE=${EMSDK_IMAGE:-emscripten/emsdk:latest}
B=$R/build/wasm; OUT=$R/prototype/wasm
mkdir -p "$B" "$OUT"
SHA=$(python3 -c "import yaml;print(yaml.safe_load(open('$R/wasm/variants.yaml'))['sha'])")
VARS=${*:-$(python3 -c "import yaml;print(' '.join(yaml.safe_load(open('$R/wasm/variants.yaml'))['variants']))")}
rm -rf "$B/tree"; mkdir -p "$B/tree"
git -C "$ROOT/blab/audapter_mex" archive "$SHA" TransShiftMex | tar -x -C "$B/tree"
for v in $VARS; do
  read -r SIZES PATCHES < <(python3 -c "
import yaml; c=yaml.safe_load(open('$R/wasm/variants.yaml'))['variants']['$v']; print(c['sizes'], ','.join(c['patches']) or '-')")
  D=$B/$v; rm -rf "$D"; mkdir -p "$D"
  "$H/prep-src.sh" "${B#$ROOT/}/tree" "$D/src"
  sed -i 's/\([ \t*]\)Audapter::\([A-Za-z0-9_]*(\)/\1\2/' "$D/src/Audapter.h"
  patch -s -p1 -d "$D/src" < "$W/patches/build/size-flags.patch"
  if [ "$PATCHES" != "-" ]; then for p in ${PATCHES//,/ }; do patch -s -p1 -d "$D/src" < "$R/patches/$p"; done; fi
  DEFS=""; [ "$SIZES" = lite ] && DEFS="-DAUDAPTER_MAX_REC_SIZE=160000 -DAUDAPTER_MAX_DATA_SIZE=160000"
  DEFS="$DEFS -DAUDAPTER_VARIANT=\\\"$v\\\" -DAUDAPTER_PATCHES=\\\"${PATCHES//-/}\\\""
  CF="-O2 -std=gnu++14 -fpermissive -w -fwasm-exceptions $DEFS -I/w/compat -I/h/compat -Isrc -include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept"
  EXPORTS=_malloc,_free,_aud_create,_aud_reset,_aud_set_param,_aud_get_param,_aud_load_ost,_aud_load_pcf,_aud_frame_size,_aud_process,_aud_process_block,_aud_process_f32,_aud_get_signal,_aud_get_data,_aud_get_latest,_aud_last_error,_aud_set_verbose,_aud_sizeof_audapter,_aud_variant,_aud_patches,_aud_max_rec_size
  LINK="-sMODULARIZE=1 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sMAXIMUM_MEMORY=2GB -sSTACK_SIZE=1MB -sFILESYSTEM=1 -sEXIT_RUNTIME=0 -fwasm-exceptions -sEXPORTED_FUNCTIONS=$EXPORTS -sEXPORTED_RUNTIME_METHODS=stringToNewUTF8,UTF8ToString,HEAPF64,HEAPF32,HEAP32,HEAPU32,wasmMemory"
  docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$D:/d" -v "$W:/w:ro" -v "$H:/h:ro" -w /d "$EMSDK_IMAGE" bash -c "
set -e; mkdir -p obj
for f in Audapter ost pcf utils lpc_formant DSPF phase_vocoder time_domain_shifter version; do em++ $CF -c src/\$f.cpp -o obj/\$f.o & done
em++ $CF -c /w/src/audapter_c.cpp -o obj/audapter_c.o &
wait; [ \$(ls obj/*.o | wc -l) = 10 ]
em++ -O2 obj/*.o $LINK -sSINGLE_FILE=1 -sEXPORT_NAME=__audapterFactory -sENVIRONMENT=web,worker,node -o obj/glue-single.js"
  node "$W/tools/make-bundle.mjs" "$v" "$D/obj/glue-single.js" "$OUT/audapter-$v.js"
  PB=$(grep -o 'maxPBSize = [0-9]*' "$D/src/Audapter.h" | grep -o '[0-9]*$')
  REC=$([ "$SIZES" = lite ] && echo 160000 || grep -o 'define AUDAPTER_MAX_REC_SIZE [0-9]*' "$D/src/Audapter.h" | grep -o '[0-9]*$')
  PJSON=$(for p in ${PATCHES//,/ }; do [ "$p" = - ] || printf '{"file":"%s","sha256":"%s"},' "$p" "$(sha256sum "$R/patches/$p" | cut -c1-64)"; done)
  printf '{"variant":"%s","source":"blab-lab/audapter_mex","sha":"%s","sizes":"%s","maxPBSize":%s,"maxRecSize":%s,"patches":[%s],"bytes":%s}\n' \
    "$v" "$SHA" "$SIZES" "$PB" "$REC" "${PJSON%,}" "$(stat -c%s "$OUT/audapter-$v.js")" > "$OUT/$v.build.json"
  echo "built $v: $(cat "$OUT/$v.build.json")"
done
