"""OST-F5 in a mixed pitch design (report_ost_f5.m): catch trials made by clearing the PCF after a trial that ended while
shifted (observed) vs by loading an all-zero PCF (expected). Expected-vs-observed panels; values are F0 in cents."""
import os, math
import measure as M
from sketches import evlib


def _span(d, k):
    return (d["g1"], d["g1"] + (d["vp"] if d["sequence"][k] == "shift" else d["vc"]))


def measured(d):
    md = os.path.join(d["_dir"], "meas"); out = {}
    for k in range(len(d["sequence"])):
        a, b = _span(d, k)
        fi = M.span(os.path.join(md, f"t{k+1}_in.wav"), a + 0.1, b, "F0")
        out[k] = tuple(1200 * math.log2(M.span(os.path.join(md, f"{arm}_t{k+1}_out.wav"), a + 0.1, b, "F0") / fi) for arm in ("exp", "obs"))
    return out


def _c(x):
    return "0 cents" if abs(x) < 5 else f"{x:+.0f} cents"


def spec(d):
    m = measured(d); trials = []
    for k, tag in enumerate(d["sequence"]):
        a, b = _span(d, k); dur = d["trial_s"][k]
        tr = {"n": k + 1, "tag": tag, "dur": dur, "words": [(a, b, "vowel" + (", voicing at stop" if tag == "shift" else ""))]}
        for j, key in enumerate(("exp", "obs")):
            if tag == "shift":
                on = d[key]["st2_on"][k]
                pert = [(on, dur, "+2 st")]
            elif key == "obs":
                pert = [(0, dur, "+2 st left over")]
            else:
                pert = []
            tr[key] = {"pert": pert, "vals": [_c(m[k][j])], "none": "none (catch)"}
        if tag == "catch":
            tr["obs"]["diff"] = [(a, b)]
        trials.append(tr)
    return {"sid": "sk-ost-f5", "trials": trials, "gap": 0.35,
            "rows": {"words": "Speech", "pert": "Pitch shift", "vals": "F0 heard vs spoken"},
            "between_exp": {1: "catch trials: an all-zero PCF is loaded"}, "between_obs": {1: "catch trials: Audapter('pcf', '', 0) clears the PCF"},
            "callout": "Every catch trial is heard 2 semitones up", "callout_anchor": "end"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    m = measured(d); v = {}
    for k in range(len(d["sequence"])):
        v[f"t{k+1}_exp_c"], v[f"t{k+1}_obs_c"] = m[k]
        v[f"t{k+1}_exp_txt"], v[f"t{k+1}_obs_txt"] = _c(m[k][0]), _c(m[k][1])
    v["obs_ratio"] = d["obs"]["ratio_logged"][1]; v["exp_ratio"] = d["exp"]["ratio_logged"][1]
    v["reinit_catch"] = max(abs(x) for i, x in enumerate(d["reinit_cents"]) if d["sequence"][i] == "catch")
    return v
