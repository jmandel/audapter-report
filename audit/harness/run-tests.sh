#!/bin/bash
# Run the whole headless Audapter test suite. Usage: ./run-tests.sh [--rebuild]
cd "$(dirname "$0")"
[[ $1 == --rebuild ]] && ./build-all.sh
mkdir -p oct/out logs
VARIANT=blab ./run-oct.sh diff_run.m build-oct > logs/diff_blab.log 2>&1
VARIANT=upstream ./run-oct.sh diff_run.m build-upstream upstream/audapter_matlab > logs/diff_upstream.log 2>&1
for t in t_track t_repeat t_inplace t_fmt_shift t_ost t_pitch t_pcf_persist t_diff; do
  ./run-oct.sh $t.m build-oct > logs/$t.log 2>&1
  grep -E '^(PASS|FAIL)' logs/$t.log | sed "s/^/[$t] /"
  grep -qE '^error: [^i]' logs/$t.log && echo "[$t] ERROR: $(grep -E '^error: [^i]' logs/$t.log | head -1)"
done
echo "--- sanitizer scenarios (build-asan)"
for s in pcf_short clamp_short pert_short long pitch; do
  SCEN=$s ./run-oct.sh t_mem.m build-asan > logs/mem_$s.log 2>&1
  n=$(grep -cE 'ERROR: AddressSanitizer|runtime error' logs/mem_$s.log)
  first=$(grep -E 'SUMMARY|runtime error' logs/mem_$s.log | sort -u | head -2 | tr '\n' ' ')
  if [[ $n -gt 0 ]]; then echo "SANITIZER  [$s] $first"; else echo "CLEAN      [$s]"; fi
done
