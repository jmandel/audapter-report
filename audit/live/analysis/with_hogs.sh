#!/bin/bash
# Run a command while N busy-loop "CPU hog" processes compete for the same CPU(s).
# usage: with_hogs.sh <N> <command...>
N=$1; shift
for i in $(seq $N); do ( while :; do :; done ) & done
"$@"; RC=$?
kill $(jobs -p) 2>/dev/null; wait 2>/dev/null
exit $RC
