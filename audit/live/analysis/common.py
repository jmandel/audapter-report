import numpy as np, os, re
def load(pfx, what):
    fn = f"{pfx}_{what}.npy"
    return np.load(fn) if os.path.exists(fn) else None
def kv(fn):
    d = {}
    if os.path.exists(fn):
        for line in open(fn):
            p = line.split()
            if len(p) >= 2: d[p[0]] = p[1]
    return d
def cols(nT=4, nLPC=15):
    # 0-based column indices of getData's dataMat (see AudapterIO.m 'getData')
    c = dict(intervals=0, rms=1, fmts=4, rads=4+nT, dfmts=4+2*nT, sfmts=4+2*nT+2)
    o = 4 + 2*nT + 4 + nLPC + 1
    c.update(rms_slope=o, ost_stat=o+1, pitchShiftRatio=o+2, pitchHz=o+3, shiftedPitchHz=o+4)
    return c
def xalign(ref, x, maxlag):
    """lag L (samples) such that x[n] ~ ref[n-L]; searched in [0, maxlag]"""
    best, bl = -1, 0
    n = min(len(ref), len(x)) - maxlag
    for L in range(0, maxlag + 1):
        a = ref[:n]; b = x[L:L+n]
        c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-30)
        if c > best: best, bl = c, L
    return bl, best
