#!/bin/bash
# Build native/replay.cpp against the same prepped sources + C API as the WASM build, with glibc (audapter-octave
# image, g++) and musl (alpine, g++), replay every testdata scenario, and write results for test/cmpdirs.mjs.
# Usage: native/build-run.sh  -> ~/hobby/audapter/audit/scratch/wasm/native-{glibc,musl}/<scen>/
set -e
W=$(cd "$(dirname "$0")/.." && pwd); H=$W/../harness; S=~/hobby/audapter/audit/scratch/wasm
[ -d "$W/build/full/src" ] || { echo "run wasm/build.sh full first (prepped sources)" >&2; exit 1; }
for s in $(ls "$W/testdata"); do node "$W/test/cmds2txt.mjs" "$W/testdata/$s/meta.json" "$W/testdata/$s/cmds.txt"; done
CXX_FLAGS="-O2 -std=gnu++14 -fpermissive -w -I/w/compat -I/h/compat -I/w/build/full/src -include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept"
SRCS="/w/build/full/src/Audapter.cpp /w/build/full/src/ost.cpp /w/build/full/src/pcf.cpp /w/build/full/src/utils.cpp /w/build/full/src/lpc_formant.cpp /w/build/full/src/DSPF.cpp /w/build/full/src/phase_vocoder.cpp /w/build/full/src/time_domain_shifter.cpp /w/build/full/src/version.cpp /w/src/audapter_c.cpp /w/native/replay.cpp"
RUN='mkdir -p /tmp/aud; for s in $(ls /w/testdata); do mkdir -p /o/$s; /tmp/aud/replay /w/testdata/$s/cmds.txt /w/testdata/$s/in.f64 /o/$s; done'
mkdir -p "$S/native-glibc" "$S/native-musl"
docker run --rm -u $(id -u):$(id -g) -v "$W:/w:ro" -v "$H:/h:ro" -v "$S/native-glibc:/o" audapter-octave bash -c \
  "mkdir -p /tmp/aud && g++ --version | head -1 && g++ $CXX_FLAGS $SRCS -o /tmp/aud/replay && $RUN"
docker run --rm -v "$W:/w:ro" -v "$H:/h:ro" -v "$S/native-musl:/o" alpine:3.20 sh -c \
  "apk add -q g++ >/dev/null && g++ --version | head -1 && mkdir -p /tmp/aud && g++ $CXX_FLAGS $SRCS -o /tmp/aud/replay && $RUN && chown -R $(id -u):$(id -g) /o"
