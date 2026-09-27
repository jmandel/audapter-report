"""Consequences of missed callbacks (xruns) on what is logged vs what happened in real time.
usage: xrun.py <live_prefix> [trace-nT nLPC]"""
import sys, numpy as np
from common import load, kv, cols
p = sys.argv[1]
cb = load(p, 'cb'); hw = kv(p + '_hw.txt'); B = int(hw['bufsize']); d = load(p, 'data'); sig = load(p, 'sig')
per = cb[:, 0].astype(int); start = cb[:, 1] / 1e6; dur = cb[:, 2] / 1e3
P = B / 48.0  # ms
late = start - per * P
skips = np.diff(per) - 1
print(f"{p.split('/')[-1]}: {len(per)} callbacks over {per[-1]+1} hardware periods -> {per[-1]+1-len(per)} periods never processed "
      f"({int((skips>0).sum())} xrun events, largest {skips.max()} periods = {skips.max()*P:.1f} ms)")
print(f"  callback wake-up lateness: median {np.median(late):.3f} ms, p99 {np.percentile(late,99):.2f} ms, max {late.max():.2f} ms; callback cost max {dur.max():.0f} us")
# Audapter frame j is callback j; its time axis (data.intervals, signalIn) assumes frame j happened at j*P
drift = (per - np.arange(len(per))) * P
print(f"  logged time axis vs hardware time: behind by {drift[-1]:.1f} ms at the end (max {drift.max():.1f} ms)")
if d is not None:
    C = cols(); st = d[:, C['ost_stat']]
    on = np.where(np.diff(st) > 0)[0] + 1
    if len(on):
        j = on  # data row == frame (nWin=1)
        print("  OST state increases at logged t = " + ", ".join(f"{x*P/1000:.3f}" for x in j[:8]) + " s;  hardware t = " +
              ", ".join(f"{per[min(x, len(per)-1)]*P/1000:.3f}" for x in j[:8]) + " s")
