"""Pitch-shifting noise-like segments with the phase vocoder (report_pitfalls2.m pvocnoise): level re 0 st per shift."""
import os
import numpy as np
import measure as M
from sketches import dotplot


def _act(path):
    fs, x = M.load(path); w = int(0.02 * fs); n = len(x) // w; b = x[:n*w].reshape(n, w); r = np.sqrt((b ** 2).mean(1))
    a = b[r > 0.01 * r.max()]; return 20 * np.log10(np.sqrt((a ** 2).mean()))


def levels(d, lv=M.dba_active):
    """Level of each shifted segment re 0 st, measured on the WAVs: dBA (A-weighted active-block RMS, as in the loudness table);
    lv=_act gives the plain RMS difference (evidence only)."""
    md = os.path.join(d["_dir"], "meas"); out = {}
    for key in ("sh_real", "s_noise", "voiced"):
        z = lv(os.path.join(md, f"{key}_st+0.wav")); out[key] = [lv(os.path.join(md, f"{key}_st{st:+d}.wav")) - z for st in d["st"]]
    return out


def sketch(d, up):
    d = dict(d); d.update(levels(d))
    rows = [(f"{st:+d} st", [(d["voiced"][i], "g2", "voiced stretch"), (d["sh_real"][i], "g0", "real /ʃ/"), (d["s_noise"][i], "g1", "noise band")],
              f'{d["voiced"][i]:+.1f}, {d["sh_real"][i]:+.1f}, {d["s_noise"][i]:+.1f} dBA') for i, st in enumerate(d["st"]) if st != 0]
    return dotplot.plot("sk-pvoc-noise", rows, -20, 2, [-20, -16, -12, -8, -4, 0], "heard level re the same segment at 0 st, dBA (grey band: ±1 dB)", band=(-1, 1),
                        legend=[("g2", "voiced stretch after it (/i t ɚ/), for comparison"), ("g0", "real /ʃ/ (ARCTIC slt a0036)"), ("g1", "/s/-like noise band, 3.5-9 kHz")],
                        desc="Level of pitch-shifted fricatives and of voiced speech")


def derive(d, up):
    d = dict(d); d.update(levels(d))
    a = [v for s, v in zip(d["st"], d["sh_real"]) if s != 0]; b = [v for s, v in zip(d["st"], d["s_noise"]) if s != 0]
    c = [v for s, v in zip(d["st"], d["voiced"]) if s != 0]
    return {"sh_min": min(a), "sh_max": max(a), "nz_min": min(b), "nz_max": max(b), "vo_min": min(c), "vo_max": max(c),
            "sh_m4": d["sh_real"][0], "nz_m4": d["s_noise"][0], "vo_m4": d["voiced"][0],
            "rms_sh_m4": levels(d, _act)["sh_real"][0]}
