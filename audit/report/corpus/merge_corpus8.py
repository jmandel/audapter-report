#!/usr/bin/env python3
"""CORPUS-8 report data: merge the two synthetic sweeps (harness/oct/report_corpus8.m, frameLen 32 and 64) and the
real-speech group numbers from harness/logs/corpus_shift.log (made by harness/run-corpus.sh / corpus_shift.m).
Writes harness/oct/out/report/corpus-8/blab/data.json."""
import json, os, re
A = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(A, "harness", "oct", "out", "report", "corpus-8", "blab")
r = {"cfg32": json.load(open(os.path.join(D, "data_32.json"))), "cfg64": json.load(open(os.path.join(D, "data_64.json"))), "real": {}}
log = os.path.join(A, "harness", "logs", "corpus_shift.log")
for l in open(log):
    m = re.match(r"\s+(tdsdef|tdsdemo)\s+(\S+)\s+n=\s*(\d+).*tracker/ref ([\d.]+), within5%\s+(\d+)%", l)
    if m:
        r["real"].setdefault(m.group(1), {})[m.group(2)] = {"n": int(m.group(3)), "ratio": float(m.group(4)), "within5": int(m.group(5))}
json.dump(r, open(os.path.join(D, "data.json"), "w"))
print("corpus-8:", {k: {g: v["within5"] for g, v in x.items() if g in ("adult_M", "adult_F", "child")} for k, x in r["real"].items()})
