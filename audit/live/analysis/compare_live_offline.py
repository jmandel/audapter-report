"""Compare a live run with the offline runFrame reference for the same input.
usage: compare_live_offline.py <live_prefix> <offline_prefix> [nT nLPC]"""
import sys, numpy as np
from common import load, kv, cols, xalign
lp, op = sys.argv[1], sys.argv[2]
nT, nLPC = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (4, 15)
ls, os_ = load(lp, 'sig'), load(op, 'sig'); ld, od = load(lp, 'data'), load(op, 'data')
hw = load(lp, 'hw'); ro = load(op, 'runframe_out'); ro = None if ro is None else ro.ravel()
meta = kv(lp + '_meta.txt'); N = int(meta.get('framesize', 96)); fl = N // 3
print(f"live rows {ls.shape[0]}  offline rows {os_.shape[0]}  (frame {N} dev samples, {fl} internal)")
# 1. recorded input (signalIn): alignment and equality
L, c = xalign(os_[:, 0], ls[:, 0], 8 * fl)
n = min(len(os_) , len(ls) - L)
dIn = np.max(np.abs(ls[L:L+n, 0] - os_[:n, 0])); dOut = np.max(np.abs(ls[L:L+n, 1] - os_[:n, 1]))
print(f"signalIn: live lags offline by {L} samples @16k ({L/fl:.2f} frames), corr {c:.6f}; max|diff| in {dIn:.3g}, out {dOut:.3g}")
if ld is not None and od is not None:
    fr = L // fl
    m = min(len(od), len(ld) - fr)
    C = cols(nT, nLPC); D = np.abs(ld[fr:fr+m] - od[:m]); D[np.isnan(D)] = 0
    for k in ['rms', 'fmts', 'sfmts', 'ost_stat', 'pitchShiftRatio']:
        j = C[k]; print(f"  data.{k:16s} max|live-offline| = {D[:, j].max():.3g}")
    print(f"  data (all {ld.shape[1]} columns) max|diff| = {D[:, 1:].max():.3g}   [column 0 'intervals' is frame-time]")
# 2. what the participant heard (hardware output, L channel) vs offline runFrame output
if hw is not None and ro is not None:
    Lh, ch = xalign(ro, hw[:, 0], 4 * N)
    n = min(len(ro), len(hw) - Lh)
    d = hw[Lh:Lh+n, 0] - ro[:n]
    print(f"heard (hw L) vs offline runFrame output: lag {Lh} dev samples ({Lh/48:.2f} ms), corr {ch:.6f}, max|diff| {np.max(np.abs(d)):.3g}, rms diff {np.sqrt(np.mean(d**2)):.3g}")
    print(f"  right channel max|R| = {np.max(np.abs(hw[:, 1])):.3g}  (stereoMode default 1 => L==R: max|L-R| {np.max(np.abs(hw[:,0]-hw[:,1])):.3g})")
    if ld is not None and od is not None:
        bad = np.where(D[:, 1:].max(axis=0) > 0)[0] + 1
        print(f"  data columns that differ: {list(bad)}")
