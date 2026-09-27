#!/bin/bash
# Export native (Octave MEX) reference runs for the WASM equivalence test.
# Usage: wasm/export.sh [scen ...]   -> wasm/testdata/<scen>/
W=$(cd "$(dirname "$0")" && pwd); H=$W/../harness
SCENS=${@:-passthru fmtshift fmtshift2d pcf pvoc tdshift defaults_female defaults_male}
cp "$H/build-oct/Audapter.mex" "$W/octshim/AudapterReal.mex"
mkdir -p "$W/testdata"
for s in $SCENS; do
  docker run --rm -e SCEN=$s -e OUTDIR=/wt -e SHIM=/a/audit/wasm/octshim -u $(id -u):$(id -g) \
    -v "$(cd "$W/../.." && pwd)":/a:ro -v "$H:/h:ro" -v "$W/testdata:/wt" -w /h/oct audapter-octave bash -c \
    "octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); BUILD='/h/build-oct'; addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode'); addpath('/h/oct'); run('wasm_export.m')\"" &
done
wait
