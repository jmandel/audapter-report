#!/bin/bash
# Re-check every formal result in audit/formal.  Usage:
#   ./run.sh           quick: snippet hashes, OLA gain, Lean proofs, CBMC for frameLen 32 and 7, locateF1
#   ./run.sh sweep     additionally the CBMC sweep over frameLen 1..120 + common larger values (~hours;
#                      2 CBMC processes, ~3.5 GB each)
# Needs docker; Lean via elan (~/.elan).  Exit status is non-zero on any unexpected result.
set -u
cd "$(dirname "$0")"
FAIL=0
say() { printf '%-60s %s\n' "$1" "$2"; }

docker image inspect audapter-formal >/dev/null 2>&1 || docker build -t audapter-formal docker
D="docker run --rm --memory=6g -v $PWD/cbmc:/w -w /w audapter-formal"

# 1. snippets unchanged since the proofs were written
if python3 cbmc/extract.py >/dev/null; then say "snippet hashes (Audapter.cpp @169cadf)" OK; else say "snippet hashes" CHANGED; FAIL=1; fi

# 2. phase-vocoder OLA gain (exact) and the empirical check with the real phase_vocoder.cpp
python3 ola/ola_exact.py | grep -q "VERIFIED" && say "OLA gain = 3/2 for all R>=3 (exact)" OK || { say "OLA exact" FAIL; FAIL=1; }
T=../../blab/audapter_mex/TransShiftMex
mkdir -p ../scratch/formal
if g++ -O2 -std=c++11 -include cstring -I$T -I../scratch/pitch-time/stub -o ../scratch/formal/pv_gain ola/pv_gain.cpp $T/phase_vocoder.cpp $T/DSPF.cpp 2>/dev/null; then
  ../scratch/formal/pv_gain > results/pv-gain-empirical.txt
  grep -q "R=4 200Hz    rms gain 1.5000" results/pv-gain-empirical.txt && say "OLA gain, real phase_vocoder.cpp" OK || { say "OLA empirical" FAIL; FAIL=1; }
else say "OLA empirical (build)" SKIPPED; fi

# 3. Lean: OST model, main theorem, counterexamples (no sorry; standard axioms only)
if (cd lean && PATH=$HOME/.elan/bin:$PATH lake build >/dev/null 2>&1 && PATH=$HOME/.elan/bin:$PATH lake env lean Check.lean > ../results/lean-axioms.txt 2>&1) \
   && ! grep -q sorryAx results/lean-axioms.txt && ! grep -q "sorry" lean/Ost.lean lean/OstCex.lean; then
  say "Lean OST: trial_independent + counterexamples" OK
else say "Lean OST" FAIL; FAIL=1; fi

# 4. CBMC ring buffers, two representative frameLens (32 divides everything; 7 divides nothing)
for F in 32 7; do
  for s in 1 2 3 4 5 6 7 8; do
    $D cbmc ring.c -DGROUP_PASS -DBM_ASSERT -DACC_ASSERT -DFCONST=$F -DSEL=$s --bounds-check --pointer-check \
      --signed-overflow-check --unwind 6 --unwinding-assertions 2>&1 | grep -q "VERIFICATION SUCCESSFUL" \
      || { say "CBMC PASS F=$F block $s" FAIL; FAIL=1; }
  done
  for s in 1 2 3 4 5 6 7 8 9; do
    $D cbmc ring.c -DGROUP_EXACT -DFCONST=$F -DSEL=$s --signed-overflow-check --unwind 6 --unwinding-assertions 2>&1 \
      | grep -q "VERIFICATION SUCCESSFUL" || { say "CBMC EXACT F=$F block $s" FAIL; FAIL=1; }
  done
  say "CBMC ring/recorder, frameLen=$F (17 property blocks)" done
done
# expected counterexamples: original back zeroing and DAF read, full parameter domain
for s in 1 2; do
  $D cbmc ring.c -DDEMO_FAIL -DACC_ASSERT -DFCONST=32 -DSEL=$s --bounds-check --pointer-check --unwind 6 2>&1 | grep -q "VERIFICATION FAILED" \
    && say "CBMC original code OOB found (demo $s)" "OK (expected FAIL)" || { say "CBMC demo $s" "UNEXPECTED PASS"; FAIL=1; }
done

# 5. CBMC locateF1 (floating point, verbatim)
for P in PROP_NAN_EXACT PROP_SORTED PROP_NAN_WHEN; do
  $D cbmc locate.c -D$P --bounds-check --unwind 260 --unwinding-assertions 2>&1 | grep -q "VERIFICATION SUCCESSFUL" \
    && say "CBMC locateF1 $P" OK || { say "CBMC locateF1 $P" FAIL; FAIL=1; }
done

# 6. optional full sweep
if [ "${1:-}" = sweep ]; then
  FL="$(seq 1 120 | tr '\n' ' ') 128 160 192 256 320 512"
  $D ./sweep.sh "$FL" 2 > results/cbmc-sweep.txt
  grep -q FAIL results/cbmc-sweep.txt && { say "CBMC sweep" FAIL; FAIL=1; } || say "CBMC sweep ($(wc -l < results/cbmc-sweep.txt) runs)" OK
fi
exit $FAIL
