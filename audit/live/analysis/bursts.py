"""Find output bursts (clicks) in the hardware output of a live run, relative to a clean reference run.
usage: bursts.py <live_prefix> <reference_prefix> <n_ops>"""
import sys, numpy as np
from common import load
x = load(sys.argv[1], 'hw')[:, 0]; ref = load(sys.argv[2], 'hw')[:, 0]; nops = int(sys.argv[3])
pk = np.max(np.abs(ref)); thr = 2 * pk
blk = 96; e = np.abs(x[: len(x) // blk * blk]).reshape(-1, blk).max(axis=1)
ev = np.where(e > thr)[0]; groups = np.split(ev, np.where(np.diff(ev) > 5)[0] + 1) if len(ev) else []
peaks = [e[g].max() for g in groups]
print(f"reference peak {pk:.3f}; bursts (> 2x reference peak, i.e. > {20*np.log10(2):.0f} dB over the loudest normal sample): {len(groups)} "
      f"in {nops} operations ({100*len(groups)/max(nops,1):.1f} %)")
if peaks:
    p = np.array(peaks)
    print(f"  burst peak: median {np.median(p):.2f} ({20*np.log10(np.median(p)/pk):+.1f} dB re normal peak), max {p.max():.2f} ({20*np.log10(p.max()/pk):+.1f} dB); "
          f"{int(np.sum(p > 1))} exceed digital full scale (clip/wrap at the DAC)")
    print(f"  NaN/Inf samples: {int(np.sum(~np.isfinite(x)))}")
