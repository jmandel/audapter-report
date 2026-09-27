#!/bin/bash
# Build the report's in-browser Audapter variants from the PINNED blab SHA (not a working tree):
#   buggy   = git archive of blab-lab/audapter_mex @SHA, portability patches only (harness/prep-src.sh)
#   patched = buggy + report/patches/*.patch (small, reviewable fixes, one per finding)
# Uses a vendored snapshot of the WASM line of work's C API (report/wasm/vendor, copied from audit/wasm/{src,compat})
# and its em++ flags,
# but writes to report/build/ and report/prototype/wasm/ so it never touches audit/wasm/dist.
# Variant "lite" buffer sizes (10 s recorders) as in audit/wasm/build.sh; NOT valid for buffer-size findings (I-01, I-03).
# Usage: report/wasm/build-variants.sh
set -e
R=$(cd "$(dirname "$0")/.." && pwd); A=$(cd "$R/.." && pwd); W=$A/wasm; H=$A/harness
SHA=169cadffef4c2d82a33939b840245b8a8a9db0de
EMSDK_IMAGE=${EMSDK_IMAGE:-emscripten/emsdk:latest}
B=$R/build; OUT=$R/prototype/wasm
rm -rf "$B"; mkdir -p "$B" "$OUT"
for v in buggy patched; do
  mkdir -p "$B/tree-$v"
  git -C ~/hobby/audapter/blab/audapter_mex archive "$SHA" TransShiftMex | tar -x -C "$B/tree-$v"
done
for p in "$R"/patches/*.patch; do (cd "$B/tree-patched" && patch -p1 --forward < "$p"); done
for v in buggy patched; do
  "$H/prep-src.sh" "audit/report/build/tree-$v" "$B/$v/src"
  sed -i 's/\([ \t*]\)Audapter::\([A-Za-z0-9_]*(\)/\1\2/' "$B/$v/src/Audapter.h"
  sed -i -e 's/maxRecSize = 480000;/maxRecSize = 160000;/' -e 's/maxDataSize = 480000;/maxDataSize = 160000;/' \
         -e 's/maxPBSize = 480000;/maxPBSize = 160000;/' -e 's/maxToneSeqRecLen = 480000;/maxToneSeqRecLen = 48000;/' "$B/$v/src/Audapter.h"
  docker run --rm -u $(id -u):$(id -g) -e HOME=/tmp -v "$B:/b" -v "$R/wasm/vendor:/w:ro" -v "$H:/h:ro" -v "$OUT:/o" -w /b/$v "$EMSDK_IMAGE" bash -c "
set -e
S=src
em++ -O2 -std=gnu++14 -DAUDAPTER_VARIANT=\\\"lite-$v\\\" -fpermissive -w -g0 -fwasm-exceptions \
  -I/w/compat -I/h/compat -Isrc -include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept \
  \$S/Audapter.cpp \$S/ost.cpp \$S/pcf.cpp \$S/utils.cpp \$S/lpc_formant.cpp \$S/DSPF.cpp \
  \$S/phase_vocoder.cpp \$S/time_domain_shifter.cpp \$S/version.cpp /w/src/audapter_c.cpp \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createAudapter -sENVIRONMENT=web,node,shell \
  -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sMAXIMUM_MEMORY=1GB -sSTACK_SIZE=1MB \
  -sFILESYSTEM=1 -sEXIT_RUNTIME=0 \
  -sEXPORTED_FUNCTIONS=_malloc,_free,_aud_create,_aud_reset,_aud_set_param,_aud_get_param,_aud_load_ost,_aud_load_pcf,_aud_frame_size,_aud_process,_aud_process_f32,_aud_get_signal,_aud_get_data,_aud_get_latest,_aud_last_error,_aud_set_verbose,_aud_sizeof_audapter,_aud_variant \
  -sEXPORTED_RUNTIME_METHODS=stringToNewUTF8,UTF8ToString,HEAPF64,HEAPF32,HEAP32,HEAPU32,wasmMemory \
  -o /o/audapter-$v.mjs
"
done
( cd "$R/patches" && sha256sum *.patch ) > "$OUT/patches.sha256"
printf '{"source":"blab-lab/audapter_mex","sha":"%s","variant":"lite","patches":"patches.sha256","built":"%s"}\n' "$SHA" "$(date -Iseconds)" > "$OUT/build-info.json"
ls -la "$OUT"
