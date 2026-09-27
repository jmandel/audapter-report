"""Per-callback cost distribution and xruns from fake-ASIO runs.
usage: cb_stats.py <live_prefix> [...]"""
import sys, numpy as np
from common import load, kv
print(f"{'run':28s} {'buf':>4s} {'ncb':>6s} {'med us':>7s} {'p99 us':>7s} {'p99.9':>7s} {'max us':>8s} {'budget':>7s} {'xruns':>6s} {'>50%':>5s}")
for p in sys.argv[1:]:
    cb = load(p, 'cb'); hw = kv(p + '_hw.txt'); B = int(hw['bufsize'])
    if cb is None: continue
    d = cb[:, 2] / 1e3; budget = B / 48.0 * 1e3 / 1e3 * 1000 / 1000  # us
    budget = B / 48000 * 1e6
    q = np.percentile(d, [50, 99, 99.9])
    print(f"{p.split('/')[-1]:28s} {B:4d} {len(d):6d} {q[0]:7.1f} {q[1]:7.1f} {q[2]:7.1f} {d.max():8.1f} {budget:7.0f} {int(hw['xruns']):6d} {np.sum(d > budget/2):5d}")
