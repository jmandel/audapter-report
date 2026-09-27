#!/bin/bash
# Run an Octave script (in oct/) against a built MEX.
# Usage: run-oct.sh script.m [builddir] [mcode-root rel to repo root]
# Script sees BUILD and MCODE variables. builddir containing "asan" preloads libasan/libubsan.
cd "$(dirname "$0")"; ROOT=$(cd ../.. && pwd)
B=${2:-build-oct}; M=${3:-blab/audapter_matlab}
PRE=""
if [[ $B == *asan* ]]; then PRE='LD_PRELOAD=$(g++ -print-file-name=libasan.so):$(g++ -print-file-name=libubsan.so) ASAN_OPTIONS=detect_leaks=0:abort_on_error=1 UBSAN_OPTIONS=print_stacktrace=0:report_error_type=1'; fi
docker run --rm -e VARIANT -e SCEN -u $(id -u):$(id -g) -v "$ROOT":/a:ro -v $PWD:/h -w /h/oct audapter-octave bash -c \
  "env $PRE octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); BUILD='/h/$B'; MCODE='/a/$M/mcode'; addpath(BUILD); addpath(MCODE); addpath('/h/oct'); run('$1')\""
