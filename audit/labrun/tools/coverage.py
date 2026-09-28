#!/usr/bin/env python3
"""Coverage and speed tables (markdown) from results/*/run.json.  usage: tools/coverage.py RESULTS_DIR"""
import json, os, sys, glob
D = sys.argv[1]
rows = []
for f in sorted(glob.glob(os.path.join(D, '*', 'run.json'))):
    n = os.path.basename(os.path.dirname(f)); d = json.load(open(f))
    tr = os.path.join(os.path.dirname(f), 'transforms.tsv'); si = os.path.join(os.path.dirname(f), 'stand-ins.tsv')
    nt = max(0, sum(1 for _ in open(tr)) - 1) if os.path.exists(tr) else 0
    kinds = {}
    if os.path.exists(si):
        for l in list(open(si))[1:]:
            k = l.split('\t')[0]; kinds[k] = kinds.get(k, 0) + 1
    rows.append((n, d, nt, kinds))
print('| run | status | device trials (audio) | virtual s | audio s | wall s | x real time (virtual / audio) | transformed lines | stand-ins |')
print('|---|---|---|---|---|---|---|---|---|')
for n, d, nt, k in rows:
    st = d['status'] + ('' if d['status'] == 'completed' else ': ' + d['error'][:100].replace('|', '/'))
    ks = ', '.join(f'{v} {a}' for a, v in sorted(k.items()))
    print(f"| {n} | {st} | {d['ntrials_started']} ({d['ntrials_proc']}) | {d['virtual_s']:.0f} | {d['audio_s']:.0f} | {d['wall_s']:.0f} | "
          f"{d['speed_virtual_per_wall']:.1f} / {d['speed_audio_per_wall']:.1f} | {nt} | {ks} |")
