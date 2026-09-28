#!/usr/bin/env python3
"""Level and loudness of the report's expected-vs-observed pairs.

Reported quantities (reader-facing):
  - dBA: the A-weighted level difference, 20 log10 of the ratio of A-weighted active RMS (a_weight + active_rms below:
    IEC 61672 A-weighting, then RMS over the 20 ms blocks within 40 dB of the loudest block). The report's main level number.
  - phon (ISO 532-1): the loudness-level difference from ISO 532-1:2017 (Zwicker), time-varying (mosqito 1.2.1 loudness_zwtv,
    free field), statistic N5 (loudness exceeded 5 % of the time, i.e. the 95th percentile of the loudness-vs-time trace) over the
    whole clip, converted to loudness level (LN = 40 + 10 log2 N for N >= 1 sone), at presentation levels 60, 70, 80 and 85 dB SPL;
    reported as the range over those levels.
  - rms_db: the plain (unweighted) RMS level difference, kept for evidence sections only.
Calibration: diotic headphone presentation with a flat response is assumed. The EXPECTED clip is scaled so that its A-weighted RMS
over active 20 ms blocks equals L dB SPL (L = 60, 70, 80, 85); the OBSERVED clip gets the same scale factor, so level differences
are preserved. Normal hearing is assumed (the model's reference listener). mosqito is pinned (pip install mosqito==1.2.1).

  python3 loudness.py            # writes harness/oct/out/report/loudness.json (run with the venv interpreter)
"""
import json, math, os, sys, hashlib
import numpy as np
from scipy import signal as sg
HERE = os.path.dirname(os.path.abspath(__file__))
EXP = os.path.join(HERE, "..", "harness", "oct", "out", "report")
sys.path.insert(0, HERE)
import measure as M
LEVELS = (60, 70, 80, 85)
P0 = 20e-6

def a_weight(x, fs):
    f1, f2, f3, f4 = 20.598997, 107.65265, 737.86223, 12194.217
    z = [0, 0, 0, 0]; p = [-2*math.pi*f4, -2*math.pi*f4, -2*math.pi*f1, -2*math.pi*f1, -2*math.pi*f3, -2*math.pi*f2]
    k = (2*math.pi*f4) ** 2 * 10 ** (1.9997 / 20)
    zd, pd, kd = sg.bilinear_zpk(z, p, k, fs)
    return sg.sosfilt(sg.zpk2sos(zd, pd, kd), x)

def active_rms(x, fs):
    w = int(0.02 * fs); n = len(x) // w
    b = x[:n*w].reshape(n, w); r = np.sqrt((b ** 2).mean(1))
    a = b[r > 10 ** (-40/20) * r.max()]
    return float(np.sqrt((a ** 2).mean()))

def load48(path, a=None, b=None):
    fs, x = M.load(path)
    if a is not None:
        x = x[int(a*fs):int(b*fs) if b else None]
    return sg.resample_poly(x, 48000, fs) if fs != 48000 else x.copy()

def zw_n5(x):
    from mosqito.sq_metrics import loudness_zwtv
    N = loudness_zwtv(x, 48000, field_type="free")[0]
    return float(np.percentile(N, 95))

def phon(n):
    return 40 + 10 * math.log2(n) if n >= 1 else 40 * (n + 0.0005) ** 0.35

def dba_db(o, e, fs=48000):
    """A-weighted level difference (dBA) of o re e: ratio of A-weighted active RMS."""
    return 20 * math.log10(active_rms(a_weight(o, fs), fs) / active_rms(a_weight(e, fs), fs))

def pair(e, o, levels=LEVELS):
    """e, o: 48 kHz float arrays (full scale). Returns the dBA and RMS level differences and the loudness level per presentation level."""
    d_rms = 20 * math.log10(active_rms(o, 48000) / active_rms(e, 48000))
    ea = active_rms(a_weight(e, 48000), 48000); out = {"rms_db": d_rms, "dba_db": dba_db(o, e), "levels": []}
    for L in levels:
        g = P0 * 10 ** (L / 20) / ea
        ne, no = zw_n5(g * e), zw_n5(g * o)
        out["levels"].append({"spl": L, "zw_exp_sone": ne, "zw_obs_sone": no, "zw_ratio": no / ne, "zw_dphon": phon(no) - phon(ne)})
    return out

def summary(r):
    p = [l["zw_dphon"] for l in r["levels"]]; q = [l["zw_ratio"] for l in r["levels"]]
    r["dphon_min"], r["dphon_max"] = min(p), max(p); r["ratio_min"], r["ratio_max"] = min(q), max(q)
    return r

def sanity():
    """Equal-RMS pitch shifts of a sine and of a harmonic complex: +2 st should sound slightly louder at low F0 (equal-loudness
    contours slope down towards ~1-4 kHz)."""
    fs = 48000; t = np.arange(int(1.0 * fs)) / fs; out = {}
    def hc(f0):
        y = sum((1 / k) * np.sin(2 * np.pi * k * f0 * t) for k in range(1, int(4000 / f0) + 1)); return y / np.sqrt(np.mean(y ** 2)) * 0.05
    for name, e, o in (("sine 150 -> 168.4 Hz", 0.05 * np.sin(2 * np.pi * 150 * t), 0.05 * np.sin(2 * np.pi * 150 * 2 ** (2 / 12) * t)),
                       ("harmonic complex F0 120 -> 134.7 Hz", hc(120), hc(120 * 2 ** (2 / 12))),
                       ("sine 1000 -> 1122 Hz", 0.05 * np.sin(2 * np.pi * 1000 * t), 0.05 * np.sin(2 * np.pi * 1000 * 2 ** (2 / 12) * t))):
        out[name] = summary(pair(e, o, (70,)))
    return out

def clip(rel, a=None, b=None):
    return load48(os.path.join(EXP, rel), a, b)

PAIRS = {
    # id: (expected, observed), both (path under out/report, start s, end s)
    "PT-5 A timeWrap/cerebTimeAdapt pre vs later phase": (("pt-5/meas/tw_pre_out.wav",), ("pt-5/meas/tw_later_out.wav",)),
    "PT-5 B timeAdapt control: zero-length warp row vs none": (("pt-5/meas/warp_exp_t1_out.wav",), ("pt-5/meas/warp_obs_t1_out.wav",)),
    "PT-5 B timeAdapt warp trial vs no-warp control": (("pt-5/meas/warp_obs_t2_out.wav",), ("pt-5/meas/warp_obs_t1_out.wav",)),
    "PT-5 C no-PCF design: vocoder off vs on": (("pt-5/meas/cereb_b0_out.wav",), ("pt-5/meas/cereb_b1_out.wav",)),
    "PT-5 pitch onset: 0 st vs +2 st (synthetic /a/, F0 120 Hz)": (("pt-5/blab/output_pitch_step.wav", 0.25, 0.55), ("pt-5/blab/output_pitch_step.wav", 0.80, 1.10)),
    "PT-5 vocoder on at 0 st vs off (synthetic /a/)": (("pt-5/blab/output_bypass.wav", 0.25, 0.55), ("pt-5/blab/output_pitch_step.wav", 0.25, 0.55)),
    "CORPUS-7 bus noise alone: vocoder off vs on": (("corpus-7/meas/noise_b0.wav",), ("corpus-7/meas/noise_b1.wav",)),
    "CORPUS-7 noisy speech: vocoder off vs on": (("corpus-7/meas/noisy_b0.wav",), ("corpus-7/meas/noisy_b1.wav",)),
    "I-02 fb 5 output: closedLoopGain 15 vs 21 dB": (("i-02/blab/output_fb5_clg15.wav",), ("i-02/blab/output_fb5_clg21.wav",)),
    "LAB-3 fb 4 noise: 0.98 (intended) vs default": (("vsa-meas/fb4_real_intended.wav",), ("vsa-meas/fb4_real_committed.wav",)),
}

for spk in ("bdl_a0005", "clb_a0030"):
    for nm, tag in (("F1 +125 mel", "F1up125mel"), ("F1 -125 mel", "F1down125mel"), ("F1 +20 %", "F1up20"), ("F1 -20 %", "F1down20"), ("2-D centralization 0.5", "2downDcentralizationstrength05")):
        for g in (0, 1):
            if g == 1 and "125" not in tag and "2down" not in tag:
                continue
            PAIRS[f"FMT level {spk} {nm} bGainAdapt {g}"] = ((f"loudcues/{spk}_unshifted_g{g}.wav",), (f"loudcues/{spk}_{tag}_g{g}.wav",))

PAIRS.update({
    "PVOC-NOISE real /S/: 0 st vs -4 st": (("pvoc-noise/meas/sh_real_st+0.wav",), ("pvoc-noise/meas/sh_real_st-4.wav",)),
    "PVOC-NOISE real /S/: 0 st vs +2 st": (("pvoc-noise/meas/sh_real_st+0.wav",), ("pvoc-noise/meas/sh_real_st+2.wav",)),
    "PVOC-NOISE /s/-like noise: 0 st vs -4 st": (("pvoc-noise/meas/s_noise_st+0.wav",), ("pvoc-noise/meas/s_noise_st-4.wav",)),
    "INIT-PERSIST block 2: vocoder off (intended) vs left on": (("init-persist/meas/expected.wav",), ("init-persist/meas/observed.wav",)),
})

def line(k, r):
    return (f'{k}: {r["dba_db"]:+.2f} dBA | {r["dphon_min"]:+.2f}..{r["dphon_max"]:+.2f} phon (ISO 532-1, 60-85 dB SPL) | '
            f'RMS {r["rms_db"]:+.2f} dB | ratio {r["ratio_min"]:.3f}..{r["ratio_max"]:.3f}')

def main():
    only = sys.argv[1:]
    if only:   # compute only these pairs (id prefixes) and merge into the existing loudness.json
        res = json.load(open(os.path.join(EXP, "loudness.json")))
        for k, (e, o) in PAIRS.items():
            if any(k.startswith(x) for x in only):
                r = summary(pair(clip(*e), clip(*o))); r["files"] = [e, o]
                r["sha"] = [hashlib.sha256(open(os.path.join(EXP, f[0]), "rb").read()).hexdigest()[:16] for f in (e, o)]
                res["pairs"][k] = r; print(line(k, r))
        json.dump(res, open(os.path.join(EXP, "loudness.json"), "w"), indent=1); return
    res = {"model": "ISO 532-1 Zwicker time-varying (mosqito loudness_zwtv, free field), N5; loudness-level difference in phon",
           "level": "dba_db: A-weighted level difference (IEC 61672 A-weighting, active 20 ms blocks within 40 dB of the loudest); rms_db: unweighted",
           "mosqito": __import__("mosqito").__version__, "levels_db_spl_A": LEVELS,
           "calibration": "expected clip's A-weighted active RMS set to each level; observed clip scaled identically; diotic headphones, flat response; normal hearing",
           "pairs": {}, "sanity": sanity()}
    for k, (e, o) in PAIRS.items():
        pe = os.path.join(EXP, e[0])
        if not os.path.exists(pe) or not os.path.exists(os.path.join(EXP, o[0])):
            print("skip (missing)", k); continue
        r = summary(pair(clip(*e), clip(*o)))
        r["files"] = [e, o]
        r["sha"] = [hashlib.sha256(open(os.path.join(EXP, f[0]), "rb").read()).hexdigest()[:16] for f in (e, o)]
        res["pairs"][k] = r; print(line(k, r))
    for k, r in res["sanity"].items():
        print(f'sanity {k}: RMS {r["rms_db"]:+.2f} dB, {r["dba_db"]:+.2f} dBA, Zwicker {r["dphon_min"]:+.2f} phon')
    json.dump(res, open(os.path.join(EXP, "loudness.json"), "w"), indent=1)

if __name__ == "__main__":
    main()
