#!/bin/bash
# Build the real Audapter MEX for Octave inside docker.
# Usage: ./build-oct.sh [src-root rel to repo root] [outdir] [extra flags]
SRC=${1:-blab/audapter_mex}; OUT=${2:-build-oct}; EXTRA=${3:--O2}
cd "$(dirname "$0")"; ./prep-src.sh "$SRC" "$OUT/src"
docker run --rm -u $(id -u):$(id -g) -v $PWD:/h -w /h/$OUT audapter-octave bash -c "
S=src
mkoctfile --mex -o Audapter.mex -I/h/compat -include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept \
  -std=gnu++14 -fpermissive -w -g $EXTRA \
  \$S/Audapter.cpp \$S/mexLibrary.cpp \$S/ost.cpp \$S/pcf.cpp \$S/utils.cpp \$S/lpc_formant.cpp \
  \$S/DSPF.cpp \$S/phase_vocoder.cpp \$S/time_domain_shifter.cpp \$S/version.cpp 2>&1 | grep -E 'error|undefined' | head -40
ls -la Audapter.mex"
