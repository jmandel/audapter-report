"""vsaCentralize (EXP-4b): the public runner re-sends the Hz grids after init, so the mel field is looked up in the wrong place."""
import os
import measure as M
from sketches import vsa


def sketch(d, up):
    rows = d["cent"]["s05"]
    rr = vsa.real_rows(d, "cent", "s05")
    return vsa.figure("sk-vsa-centralize", [("Real voice (PVQD speaker LA9015, sustained /i/ and /ɑ/), strength 0.5", rr, None),
                                            ("Synthetic vowels at the lab's default means, strength 0.5 (hold phase)", rows, None)], d["centre_hz"],
                      "Expected: " + vsa.describe(rows, "exp") + ". Observed: " + vsa.describe(rows, "obs") + ".",
                      "Orange: the heard vowel misses the intended one; for /i/, /æ/, /ɪ/ and /ɛ/ it moves away from the centre (F2 up instead of down).",
                      obs_title="the unused public runner")


def derive(d, up):
    rows, cen = d["cent"]["s05"], d["centre_mel"]; v = {}
    tw = [vsa.toward(e, cen) for e in rows]
    v["n_away"] = sum(1 for t in tw if t < 0); v["n"] = len(rows)
    v["away_list"] = ", ".join("/" + vsa.IPA[e["vowel"]] + "/" for e, t in zip(rows, tw) if t < 0)
    v["tw_min"], v["tw_max"] = min(tw), max(tw)
    v["miss_min"] = min(vsa.miss_mel(e) for e in rows); v["miss_max"] = max(vsa.miss_mel(e) for e in rows)
    ref = [vsa.toward(e, cen) for e in d["sent"]["s05"]]; v["ref_min"], v["ref_max"] = min(ref), max(ref)
    iy = next(e for e in rows if e["vowel"] == "iy"); iys = next(e for e in d["sent"]["s05"] if e["vowel"] == "iy")
    v["iy_prod"] = f'{iy["prod_hz"][0]:.0f}/{iy["prod_hz"][1]:.0f} Hz'; v["iy_int"] = f'{iy["intended_hz"][0]:.0f}/{iy["intended_hz"][1]:.0f} Hz'
    v["iy_heard"] = f'{iy["heard_hz"][0]:.0f}/{iy["heard_hz"][1]:.0f} Hz'
    md = os.path.join(d["_dir"], "..", "vsa-meas")
    mm = lambda f: (M.span(os.path.join(md, f), 0.1, 1.2, "F1"), M.span(os.path.join(md, f), 0.1, 1.2, "F2"))
    RV = "i" if "cent" == "cent" else "a"; tg = "s05" if "cent" == "cent" else "s00"
    for k, f in (("in", f"real_in_{RV}.wav"), ("exp", f"real_sent_{tg}_{RV}_out.wav"), ("obs", f"real_cent_{tg}_{RV}_out.wav")):
        a, b = mm(f); v[f"r_{k}"] = f"F1 {a:.0f} Hz, F2 {b:.0f} Hz"; v[f"r_{k}_f2"] = b; v[f"r_{k}_f1"] = a
    v["r_obs_df2"] = v["r_obs_f2"] - v["r_in_f2"]; v["r_exp_df2"] = v["r_exp_f2"] - v["r_in_f2"]
    m = lambda f: (M.span(os.path.join(md, f), 0.2, 0.65, "F1"), M.span(os.path.join(md, f), 0.2, 0.65, "F2"))
    for k, f in (("in", "in_iy.wav"), ("exp", "sent_s05_iy_out.wav"), ("obs", "cent_s05_iy_out.wav")):
        a, b = m(f); v[f"m_{k}"] = f"F1 {a:.0f} Hz, F2 {b:.0f} Hz"; v[f"m_{k}_f2"] = b
    v["m_exp_df2"] = v["m_exp_f2"] - v["m_in_f2"]; v["m_obs_df2"] = v["m_obs_f2"] - v["m_in_f2"]
    v["grid"] = "{:.0f}–{:.0f} / {:.0f}–{:.0f}".format(*d["cent"]["grid"]); v["field"] = "{F1Min:.0f}–{F1Max:.0f} / {F2Min:.0f}–{F2Max:.0f} mel".format(**d["field"])
    return v
