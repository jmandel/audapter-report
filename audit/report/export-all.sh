#!/bin/bash
# Regenerate every report asset from the harness (docker, audapter-octave image) and the live-path results.
# Run from anywhere: audit/report/export-all.sh   (build.py --export calls it). Order matters where noted.
set -euo pipefail
R=$(cd "$(dirname "$0")" && pwd); H=$R/../harness
cd "$H"
rm -rf oct/out/report/{ost-f1,coord-1,ost-f5,vsa-centralize,vsa-generalize,vsa-fb4}/blab oct/out/report/{ost-f1,coord-1,ost-f5,i-01,pt-5,ost-f2}/meas oct/out/report/vsa-meas   # rewritten exports: no stale files
mkdir -p oct/out/report/{ost-f1,ost-f2,i-01,pt-5,ost-f4,fmt-f1,i-04,ost-f8,i-02,i-03,f6,corpus-8,corpus-10,corpus-11,coord-1,ost-f5,labscripts,carryover}   # some scripts write at <id>/ level before report_outdir runs
UP="build-upstream upstream/audapter_matlab"
run()  { echo "export: $*"; ./run-oct.sh "$@" > /dev/null; }
runu() { echo "export (upstream): $1"; VARIANT=upstream ./run-oct.sh "$1" $UP > /dev/null; }
# OST-F1: expected trials each run in a fresh process (the first trial after the MEX loads), then the observed session
for d in safe leak; do for k in 1 2 3 4 5 6 7 8; do SCEN="fresh $d $k" ./run-oct.sh report_ost_f1.m > /dev/null; done; done
SCEN=same ./run-oct.sh report_ost_f1.m > /dev/null
for d in safe leak; do for k in 1 2 3 4 5 6 7 8; do SCEN="real fresh $d $k" ./run-oct.sh report_ost_f1.m > /dev/null; done; done
SCEN=real ./run-oct.sh report_ost_f1.m > /dev/null   # real-voice session (figure and main clips)
run report_ost_f1.m
run report_ost_f5.m
run report_vsa.m                                    # lab-script cards LAB-1..3 (public VSA runners)
run report_i01_session.m; runu report_i01_session.m
# section prose numbers: the lab's public VSA scripts (EXP-4/5) and blab's real switching methods (EXP-6)
echo "export: exp_vsa_field.m, exp_mixed.m S1 S2"; ./run-oct.sh exp_vsa_field.m > oct/out/report/labscripts/exp_vsa_field.log 2>&1 || true
(SCEN=S1 ./run-oct.sh exp_mixed.m; SCEN=S2 ./run-oct.sh exp_mixed.m) 2>&1 | grep -v "Set param" > oct/out/report/carryover/exp_mixed.log || true
run report_ost_f2.m;  runu report_ost_f2.m
run report_i01.m;     runu report_i01.m
SCEN=cereb ./run-oct.sh report_pt5.m > /dev/null     # cerebTypicalProduction settings, fresh process
SCEN=timewrap ./run-oct.sh report_pt5.m > /dev/null  # timeWrap / cerebTimeAdapt settings, fresh process
run report_pt5.m
mkdir -p oct/out/report/ost-f4
./run-oct.sh report_ost_f4.m build-asan > oct/out/report/ost-f4/asan.log 2>&1 || true   # ASan aborts at the first bad read
run report_ost_f4.m
mkdir -p oct/out/report/fmt-f1/asan
./run-oct.sh report_fmt_f1.m build-asan > oct/out/report/fmt-f1/asan/asan.log 2>&1 || true
run report_fmt_f1.m;  runu report_fmt_f1.m
run report_i04.m
run report_ost_f8.m
run report_i02.m
run report_i03.m;     runu report_i03.m
run report_f6.m;      runu report_f6.m;  run report_f6.m     # blab, upstream, blab again (plays both at one gain)
# ---- real speech (audit/corpus). corpus_report.m's PT-5 part reads out/corpus_shift.csv and the CORPUS-8 merge reads
# logs/corpus_shift.log: both come from the corpus suite (./run-corpus.sh, about an hour); run it first if missing.
[ -f oct/out/corpus_shift.csv ] && [ -f logs/corpus_shift.log ] || ./run-corpus.sh
run corpus_report.m;  runu corpus_report.m          # out/report/<id>/real/ (F6 has an upstream half)
SCEN="32 5" ./run-oct.sh report_corpus8.m > /dev/null; SCEN="64 7" ./run-oct.sh report_corpus8.m > /dev/null; echo "export: report_corpus8.m (2 configs)"
python3 "$R/corpus/merge_corpus8.py"
run report_corpus11.m
run report_coord1.m                                 # COORD-1: stale PCF across init (synthetic and real)
oct/report_corpus10.sh 60                           # the hang: killed after 60 s without progress
if [ -x "$R/live/export.sh" ]; then "$R/live/export.sh"; elif [ -f "$R/live/export_live.py" ]; then python3 "$R/live/export_live.py"; fi
