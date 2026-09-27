#!/bin/bash
# Real-speech (corpus) test suite. Needs the committed corpus in ../corpus; corpus_hillenbrand additionally
# needs ../corpus/fetch_restricted.sh to have been run (it SKIPs otherwise). Logs in logs/corpus_*.log.
cd "$(dirname "$0")"; mkdir -p oct/out logs
for t in corpus_track corpus_hillenbrand corpus_shift corpus_ost corpus_regress; do
  ./run-oct.sh $t.m build-oct > logs/$t.log 2>&1
  grep -E '^(PASS|FAIL|SKIP)' logs/$t.log | sed "s/^/[$t] /"
  grep -qE '^error: [^i]' logs/$t.log && echo "[$t] ERROR: $(grep -E '^error: [^i]' logs/$t.log | head -1)"
done
rm -f oct/out/corpus_diff_params.mat
VARIANT=blab ./run-oct.sh corpus_diff_run.m build-oct > logs/corpus_diff_blab.log 2>&1
VARIANT=upstream ./run-oct.sh corpus_diff_run.m build-upstream upstream/audapter_matlab > logs/corpus_diff_upstream.log 2>&1
./run-oct.sh corpus_diff.m > logs/corpus_diff.log 2>&1; grep -E '^(PASS|FAIL)' logs/corpus_diff.log | sed "s/^/[corpus_diff] /"
VARIANT=asan SCEN=noost ./run-oct.sh corpus_diff_run.m build-asan > logs/corpus_asan.log 2>&1
n=$(grep -cE 'ERROR: AddressSanitizer' logs/corpus_asan.log); u=$(grep -E 'runtime error' logs/corpus_asan.log | sed 's/:[0-9]*:[0-9]*: runtime error/: runtime error/' | sort -u | wc -l)
grep -q '^DONE asan' logs/corpus_asan.log && d=completed || d='DID NOT COMPLETE'
echo "[corpus_asan] sweep $d; ASan errors: $n; distinct UBSan sites: $u (see logs/corpus_asan.log)"
