#!/bin/bash
# Capture the Playground's report test cases: run each card's export script (audit/harness/oct/report_*.m) against the
# real Octave MEX through the recording shim in audit/playground/capture, which logs the exact command stream of the
# marked sections (case_mark) - every setParam, OST/PCF text, reset and trial input. Output: audit/playground/capture/out/<ID>/.
# Needs docker and the harness image/build (audit/harness/build.sh). Runs the full export, so it also refreshes
# audit/harness/oct/out/report/<id>/ with identical numbers.
# Usage: audit/playground/tools/capture-cases.sh [ID ...]     (default: all)
set -euo pipefail
P=$(cd "$(dirname "$0")/.." && pwd); ROOT=$(cd "$P/../.." && pwd); H="$ROOT/audit/harness"
declare -A SCRIPT=( [OST-F1]=report_ost_f1.m [OST-F2]=report_ost_f2.m [OST-F5]=report_ost_f5.m [COORD-1]=report_coord1.m
                    [I-01]=report_i01.m [LAB-1]=report_vsa.m [F6]=report_f6.m [OST-F8]=report_ost_f8.m [CORPUS-11]=report_corpus11.m
                    [CORPUS-8-32]=report_corpus8.m [CORPUS-8-64]=report_corpus8.m [I-02]=report_i02.m [PT-5]=report_pt5.m )
declare -A SCENV=( [CORPUS-8-32]="32 5" [CORPUS-8-64]="64 7" )
IDS=${@:-OST-F1 OST-F2 OST-F5 COORD-1 I-01 LAB-1 F6 OST-F8 CORPUS-11 CORPUS-8-32 CORPUS-8-64 I-02 PT-5}
mkdir -p "$P/capture/tmp" "$P/capture/out"
cp "$H/build-oct/Audapter.mex" "$P/capture/tmp/AudapterReal.mex"
for id in $IDS; do
  s=${SCRIPT[$id]}
  echo "== $id ($s)"
  docker run --rm -e CASE_SCRIPT="$s" -e CASE_ID="$id" -e SCEN="${SCENV[$id]:-}" -u $(id -u):$(id -g) -v "$ROOT":/a:ro -v "$H":/h -v "$P/capture":/c -w /h/oct audapter-octave bash -c \
    "octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); BUILD='/h/build-oct'; MCODE='/a/blab/audapter_matlab/mcode'; addpath(BUILD); addpath(MCODE); addpath('/h/oct'); addpath('/c/tmp'); addpath('/c'); cd('/h/oct'); capture\"" 2>&1 | grep -v "^warning" | tail -4
done
