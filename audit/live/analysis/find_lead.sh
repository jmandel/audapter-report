#!/bin/bash
# Find the offline lead (in whole device periods) that reproduces a live run bit-for-bit.
# usage: find_lead.sh <driver> <live_prefix> <offline_prefix_base> <quant> <trace> <in> [ost] [pcf]
DRV=$1; LP=$2; OB=$3; Q=$4; TR=$5; IN=$6; OST=${7:+ost=$7}; PCF=${8:+pcf=$8}
N=$(awk '/framesize/{print $2}' ${LP}_meta.txt)
for k in 0 1 2 3 4 5 6; do
  $DRV offline trace=$TR in=$IN $OST $PCF out=${OB}_k$k lead=$((k*N)) quant=$Q >/dev/null
  r=$(cd /live/analysis && python3 -c "
import numpy as np
l=np.load('${LP}_sig.npy'); o=np.load('${OB}_k${k}_sig.npy'); m=min(len(l),len(o))
print(float(np.max(np.abs(l[:m,0]-o[:m,0]))))")
  echo "lead $k periods: max|signalIn live-offline| = $r"
  if [ "$r" = "0.0" ]; then echo "MATCH lead=$k"; exit 0; fi
done
exit 1
