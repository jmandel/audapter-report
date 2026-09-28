#!/bin/bash
# Run plans with voice-bank participants: every plan x every talker, in parallel (LR_JOBS, default 6).
#   LR_TALKERS="marin coral ..." tools/runvoices.sh plans/a.m plans/b.m:full ...
# A ":full" suffix runs the full session (LR_FULL=1) into results/<plan>_full_voices/<talker>; otherwise the output is
# results/<plan>_voices/<talker> (with LR_LPCCHECK=rule, the virtual experimenter runs the LPC check by the scripted rule:
# results/<plan>_voices_lpccheck/<talker>), with talker.json (name, kind, note). The lab's saved files (labdata/) are removed after
# each run unless LR_KEEP_LABDATA=1; with LR_KEEP_TRIALS=0 the per-trial records (trials/) are removed too (after the summary).
L=$(cd "$(dirname "$0")/.." && pwd); J=${LR_JOBS:-6}
[[ -n "$LR_TALKERS" ]] || { echo "set LR_TALKERS" >&2; exit 2; }
run1() { local spec=$1 tk=$2 p=${1%%:full} full=; [[ "$spec" == *:full ]] && full=1
  local sfx=; [[ "${LR_LPCCHECK:-}" == rule ]] && sfx=_lpccheck
  local n=$(basename "$p" .m); local d=$(dirname "$(dirname "$(realpath "$p")")")/results/$n${full:+_full}_voices$sfx/$tk
  mkdir -p "$d"; LR_FULL=$full LR_VOICE=$tk "$L/labrun" "$p" "$d" > /dev/null 2>&1
  local g=$(awk -F'\t' -v t="$tk" 'NR>1 && $5==t {print $6; exit}' "$L/voices/bank.tsv")
  printf '{"name": "%s", "kind": "AI-generated", "note": "OpenAI gpt-audio-1.5 voice '"'"'%s'"'"', perceived %s"}\n' "$tk" "$tk" \
    "$([[ $g == M ]] && echo male || echo female)" > "$d/talker.json"
  [[ "${LR_KEEP_LABDATA:-0}" == 1 ]] || rm -rf "$d/labdata"
  [[ "${LR_KEEP_TRIALS:-1}" == 1 ]] || rm -rf "$d/trials"
  local st=$(grep -o '"status":"[a-z]*"' "$d/run.json" 2>/dev/null | cut -d'"' -f4)
  local er=$(grep -o '"error":"[^"]*"' "$d/run.json" 2>/dev/null | cut -d'"' -f4 | cut -c1-100)
  local tr=$(grep -o '"ntrials_started":[0-9]*' "$d/run.json" 2>/dev/null | cut -d: -f2)
  local fb=$(grep -c 'FALLBACK' "$d/summary.tsv" 2>/dev/null)
  printf '%-34s %-8s %-10s trials=%-4s fallback=%-3s %s\n' "$n${full:+_full}" "$tk" "${st:-none}" "$tr" "${fb:-?}" "$er"; }
export -f run1; export L
for s in "$@"; do for t in $LR_TALKERS; do printf '%s %s\n' "$s" "$t"; done; done | xargs -P "$J" -L 1 bash -c 'run1 "$0" "$1"'
