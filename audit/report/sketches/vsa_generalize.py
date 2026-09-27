"""vsaGeneralize (EXP-4c): the runner scales only the all-zero 1-D pertAmp and re-sends Hz grids, while bShift2D = 1 and the
full-strength 2-D field stay on: every fb 3 trial, including strength 0, is perturbed."""
import os
import measure as M
from sketches import vsa


def sketch(d, up):
    r0, r5 = d["gen"]["s00"], d["gen"]["s05"]
    rr = vsa.real_rows(d, "gen", "s00")
    return vsa.figure("sk-vsa-generalize", [("Real voice (PVQD speaker LA9015, /i/ and /ɑ/), strength 0 (baseline training)", rr, "no shift intended"),
                                            ("Synthetic vowels, strength 0 (baseline-training trials)", r0, "no shift intended"),
                                            ("Strength 0.5 (training trials)", r5, None)], d["centre_hz"],
                      "Strength 0, expected: no shift. Observed: " + vsa.describe(r0, "obs") + ". Strength 0.5, expected: " + vsa.describe(r5, "exp") + ".",
                      "Orange: at strength 0 every vowel is shifted, with F2 raised by several hundred hertz; at strength 0.5 the shifts are the same, not scaled.")


def derive(d, up):
    import math
    r0, r5, cen = d["gen"]["s00"], d["gen"]["s05"], d["centre_mel"]; v = {}
    mag = [math.hypot(e["heard_mel"][0] - e["prod_mel"][0], e["heard_mel"][1] - e["prod_mel"][1]) for e in r0]
    v["s0_min"], v["s0_max"] = min(mag), max(mag)
    v["same"] = all(abs(a["heard_mel"][0] - b["heard_mel"][0]) < 1e-6 and abs(a["heard_mel"][1] - b["heard_mel"][1]) < 1e-6 for a, b in zip(r0, r5))
    v["same_txt"] = "identical shifts: the strength is never applied" if v["same"] else "different"
    tw = [vsa.toward(e, cen) for e in r5]; v["n_away"] = sum(1 for t in tw if t < 0); v["n"] = len(r5)
    uw = next(e for e in r0 if e["vowel"] == "uw")
    v["uw_prod"] = f'{uw["prod_hz"][0]:.0f}/{uw["prod_hz"][1]:.0f} Hz'; v["uw_heard"] = f'{uw["heard_hz"][0]:.0f}/{uw["heard_hz"][1]:.0f} Hz'
    md = os.path.join(d["_dir"], "..", "vsa-meas")
    mm = lambda f: (M.span(os.path.join(md, f), 0.1, 1.2, "F1"), M.span(os.path.join(md, f), 0.1, 1.2, "F2"))
    RV = "i" if "gen" == "cent" else "a"; tg = "s05" if "gen" == "cent" else "s00"
    for k, f in (("in", f"real_in_{RV}.wav"), ("exp", f"real_sent_{tg}_{RV}_out.wav"), ("obs", f"real_gen_{tg}_{RV}_out.wav")):
        a, b = mm(f); v[f"r_{k}"] = f"F1 {a:.0f} Hz, F2 {b:.0f} Hz"; v[f"r_{k}_f2"] = b; v[f"r_{k}_f1"] = a
    v["r_obs_df2"] = v["r_obs_f2"] - v["r_in_f2"]; v["r_exp_df2"] = v["r_exp_f2"] - v["r_in_f2"]
    m = lambda f: (M.span(os.path.join(md, f), 0.2, 0.65, "F1"), M.span(os.path.join(md, f), 0.2, 0.65, "F2"))
    for k, f in (("in", "in_uw.wav"), ("exp", "sent_s00_uw_out.wav"), ("obs", "gen_s00_uw_out.wav")):
        a, b = m(f); v[f"m_{k}"] = f"F1 {a:.0f} Hz, F2 {b:.0f} Hz"; v[f"m_{k}_f2"] = b
    v["m_obs_df2"] = v["m_obs_f2"] - v["m_in_f2"]
    v["grid"] = "{:.0f}–{:.0f} / {:.0f}–{:.0f}".format(*d["gen"]["grid"])
    return v
