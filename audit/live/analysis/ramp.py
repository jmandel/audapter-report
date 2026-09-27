"""Onset/offset ramp (trialLen>0, rampLen>0): offline (mono) vs live (stereo interleaved) gain.
usage: ramp.py <live_prefix> <offline_prefix(lead-aligned)> <out_png>"""
import sys, numpy as np
from common import load
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
lp, op, png = sys.argv[1:4]
hw = load(lp, 'hw'); ro = load(op, 'runframe_out').ravel()
# offline output of the same (lead-aligned) input with ramps disabled gives the un-ramped reference
ref = load(op.replace('ramp', 'noramp'), 'runframe_out').ravel()
D = 96  # output of callback k is heard one period later (fake ASIO model)
n = min(len(ro), len(hw) - D)
heardL, heardR = hw[D:D+n, 0], hw[D:D+n, 1]
m = np.abs(ref[:n]) > 1e-3
t = np.arange(n) / 48000
gOff = np.full(n, np.nan); gL = np.full(n, np.nan); gR = np.full(n, np.nan)
gOff[m] = ro[:n][m] / ref[:n][m]; gL[m] = heardL[m] / ref[:n][m]; gR[m] = heardR[m] / ref[:n][m]
for name, a, b in [('onset', 0.0, 0.07), ('offset', 1.53, 1.62)]:
    s = (t >= a) & (t < b) & m
    print(f"{name} ramp {a:.2f}-{b:.2f}s: max|gain_live_L - gain_offline| = {np.nanmax(np.abs(gL[s]-gOff[s])):.3f}, "
          f"max|gain_L - gain_R| = {np.nanmax(np.abs(gL[s]-gR[s])):.3f}, min gain offline {np.nanmin(gOff[s]):.3f} live L {np.nanmin(gL[s]):.3f}")
fig, ax = plt.subplots(1, 2, figsize=(11, 3.6))
for a, (lo, hi) in zip(ax, [(0, 0.07), (1.53, 1.62)]):
    s = (t >= lo) & (t < hi)
    a.plot(t[s], gOff[s], '.', ms=1.5, label='offline (runFrame)'); a.plot(t[s], gL[s], '.', ms=1.5, label='live L'); a.plot(t[s], gR[s], '.', ms=1.5, label='live R')
    a.set_xlabel('time (s)'); a.set_ylabel('applied gain'); a.set_ylim(-0.3, 1.3)
ax[0].legend(markerscale=6); ax[0].set_title('onset ramp'); ax[1].set_title('offset ramp (trialLen 1.6 s)')
fig.tight_layout(); fig.savefig(png, dpi=110)
