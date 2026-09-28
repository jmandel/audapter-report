#!/bin/bash
# Run several plans in parallel (default 6 at a time) and print one status line per plan.
#   tools/runall.sh plans/a.m plans/b.m ...
L=$(cd "$(dirname "$0")/.." && pwd); J=${LR_JOBS:-6}
run1() { local p=$1 n=$(basename "$1" .m) d=$(dirname "$(dirname "$(realpath "$1")")")/results/$(basename "$1" .m)
  "$L/labrun" "$p" > /dev/null 2>&1
  local st=$(grep -o '"status":"[a-z]*"' "$d/run.json" 2>/dev/null | cut -d'"' -f4)
  local er=$(grep -o '"error":"[^"]*"' "$d/run.json" 2>/dev/null | cut -d'"' -f4 | cut -c1-120)
  local at=$(grep -o '"errstack":\["[^"]*"' "$d/run.json" 2>/dev/null | cut -d'"' -f4 | sed 's#.*/repos/##')
  local tr=$(grep -o '"ntrials_started":[0-9]*' "$d/run.json" 2>/dev/null | cut -d: -f2)
  printf '%-28s %-10s trials=%-4s %s %s\n' "$n" "${st:-none}" "$tr" "$er" "$at"; }
export -f run1; export L
printf '%s\n' "$@" | xargs -P "$J" -I{} bash -c 'run1 {}'
