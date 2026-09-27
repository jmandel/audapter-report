#!/bin/bash
# Report asset export for CORPUS-10 (runFrame hang). Runs corpus_tdshang.m (SCEN=vocadito_4 VARIANT=after32) in a named
# container, time-stamps its progress lines, samples the container's CPU while it stalls, and kills it after STALL seconds
# without progress. Also runs the fresh-session control (no preceding frameLen-32 trial), which completes.
# Usage: audit/harness/oct/report_corpus10.sh [STALL=60]      Output: oct/out/report/corpus-10/blab/data.json
set -uo pipefail
H=$(cd "$(dirname "$0")/.." && pwd); ROOT=$(cd "$H/../.." && pwd); OUT=$H/oct/out/report/corpus-10/blab; mkdir -p "$OUT"
STALL=${1:-60}
run() {  # $1 = variant, $2 = log
  local name=aud-hang-$$-$1
  docker run --rm --name "$name" -e SCEN=vocadito_4 -e VARIANT=$1 -u $(id -u):$(id -g) -v "$ROOT":/a:ro -v "$H":/h -w /h/oct audapter-octave \
    bash -c "octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); BUILD='/h/build-oct'; MCODE='/a/blab/audapter_matlab/mcode'; addpath(BUILD); addpath(MCODE); addpath('/h/oct'); run('corpus_tdshang.m')\"" 2>&1 |
  while IFS= read -r l; do printf '%s\t%s\n' "$(date +%s.%N)" "$l"; done > "$2" &
  local pid=$! last=$(date +%s) n0=0
  : > "$2.cpu"
  while kill -0 $pid 2>/dev/null; do
    sleep 2
    local n=$(wc -l < "$2"); [ "$n" != "$n0" ] && { n0=$n; last=$(date +%s); }
    docker stats --no-stream --format '{{.CPUPerc}}' "$name" 2>/dev/null | sed "s/^/$(date +%s.%N)\t/" >> "$2.cpu"
    if [ $(( $(date +%s) - last )) -ge "$STALL" ]; then docker kill "$name" >/dev/null 2>&1; echo "KILLED after ${STALL}s without progress" >> "$2.kill"; break; fi
  done
  wait $pid 2>/dev/null
}
rm -f "$OUT"/*.log*
run after32 "$OUT/after32.log"
run none "$OUT/fresh.log"
python3 - "$OUT" "$STALL" <<'PY'
import json, sys, os, re
out, stall = sys.argv[1], int(sys.argv[2])
def parse(f):
    L = [l.rstrip("\n").split("\t", 1) for l in open(os.path.join(out, f)) if "\t" in l]
    t0 = float(L[0][0]) if L else 0
    prog = [(float(t) - t0, int(m.group(1))) for t, s in L for m in [re.match(r"frame (\d+)", s)] if m]
    cpu = []
    if os.path.exists(os.path.join(out, f + ".cpu")):
        for l in open(os.path.join(out, f + ".cpu")):
            t, c = l.split("\t"); cpu.append((float(t) - t0, float(c.strip().rstrip("%") or 0)))
    return {"progress": prog, "cpu": cpu, "done": any("DONE" in s for _, s in L), "trial32_done": any("frameLen 32 done" in s for _, s in L),
            "killed": os.path.exists(os.path.join(out, f + ".kill")), "t_end": (float(L[-1][0]) - t0) if L else 0}
r = {"clip": "vocadito_4", "stall_s": stall, "after32": parse("after32.log"), "fresh": parse("fresh.log"), "frame_n": 192, "frame_s": 192 / 48000}
json.dump(r, open(os.path.join(out, "data.json"), "w"))
a = r["after32"]
print("after32: last frame", a["progress"][-1] if a["progress"] else None, "killed", a["killed"], "cpu samples", len(a["cpu"]), "fresh done", r["fresh"]["done"])
PY
