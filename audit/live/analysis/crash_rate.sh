#!/bin/bash
# Estimate the per-reload crash probability of reloading an OST or PCF while audio runs.
# usage (inside container): crash_rate.sh <op: pcf|ost> <runs> <secs> <gap>
OP=$1; RUNS=$2; SECS=$3; GAP=$4
for r in $(seq $RUNS); do
  out=$(build/asio/live_driver hammer trace=work/in/trace_f1up.txt in=work/in/vowel_a.wav ost=work/in/onset.ost pcf=work/in/f1up_s2.pcf op=$OP secs=$SECS gap=$GAP 2>&1)
  if echo "$out" | grep -q "signal 11"; then echo "run $r: CRASH after $(echo "$out" | grep -o 'iteration [0-9]*' | awk '{print $2}') reloads"
  else echo "run $r: survived $(echo "$out" | grep -o '[0-9]* iterations' | awk '{print $1}') reloads"; fi
done
