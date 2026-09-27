#!/bin/bash
# Runs inside the audapter-formal container. For every frameLen F in FLIST and every
# property block, run CBMC; print one line per (F, group, block) with PASS/FAIL.
# Usage: sweep.sh "F1 F2 ..." [jobs]
FLIST=${1:-"$(seq 1 960)"}; JOBS=${2:-8}
one() {
  F=$1
  for s in 1 2 3 4 5 6 7 8; do
    r=$(cbmc ring.c -DGROUP_PASS -DBM_ASSERT -DACC_ASSERT -DFCONST=$F -DSEL=$s --bounds-check --pointer-check \
        --signed-overflow-check --unwind 6 --unwinding-assertions 2>&1 | grep -c "VERIFICATION SUCCESSFUL")
    echo "F=$F PASS sel=$s $([ $r = 1 ] && echo OK || echo FAIL)"
  done
  for s in 1 2 3 4 5 6 7 8 9; do
    r=$(cbmc ring.c -DGROUP_EXACT -DFCONST=$F -DSEL=$s --signed-overflow-check --unwind 6 --unwinding-assertions 2>&1 | grep -c "VERIFICATION SUCCESSFUL")
    echo "F=$F EXACT sel=$s $([ $r = 1 ] && echo OK || echo FAIL)"
  done
}
export -f one
echo $FLIST | tr ' ' '\n' | xargs -P $JOBS -I{} bash -c 'one {}'
