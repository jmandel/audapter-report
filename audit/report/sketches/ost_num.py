"""OST rule numbering (report_pitfalls2.m ostnum): three trials, random delay after the detected onset, 0.2 s F1 shift."""
import os, math
import measure as M
from sketches import evlib


def _n(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else x


def spec(d):
    trials = []
    for k, dl in enumerate(d["delays"]):
        tr = {"n": k + 1, "tag": f"delay {1000 * dl:.0f} ms", "dur": d["trial_s"], "words": [(d["v_on"], d["v_off"], "vowel")]}
        for key in ("exp", "obs"):
            a, b = _n(d[key]["on"][k]), _n(d[key]["off"][k])
            covered = 0 if a is None else max(0.0, min(b, d["v_off"]) - a)
            tr[key] = {"pert": [] if a is None else [(a, b, "F1 +125 mel")], "none": "shift misses the vowel",
                       "marks": [(d[key]["detect"][k], "onset")], "vals": [f"{1000 * covered:.0f} ms shifted"]}
        a, b = _n(d["exp"]["on"][k]), _n(d["obs"]["on"][k])
        if a is not None:
            tr["obs"]["diff"] = [(a, min(b if b is not None else d["v_off"], d["v_off"]))]
        trials.append(tr)
    return {"sid": "sk-ost-num", "trials": trials, "gap": 0.3,
            "rows": {"words": "Speech", "pert": "Perturbation", "marks": "Onset detected", "vals": "Vowel time shifted"},
            "heads": {"exp": "rules numbered by the states they use (ELAPSED_TIME advances one state)", "obs": "every rule numbered two apart"},
            "callout": "The doubled delay pushes the shift past a short vowel", "callout_anchor": "end"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    v = {}
    for k in range(3):
        for key in ("exp", "obs"):
            a = _n(d[key]["on"][k]); v[f"{key}_on{k+1}"] = "never" if a is None else f"{a - d['exp']['detect'][k]:.2f} s"
            b = _n(d[key]["off"][k]); v[f"{key}_cov{k+1}"] = 0 if a is None else 1000 * max(0.0, min(b, d["v_off"]) - a)
        v[f"exp_state{k+1}"] = d["exp"]["shiftstate_s"][k]; v[f"obs_state{k+1}"] = d["obs"]["shiftstate_s"][k]
    v["vowel_ms"] = 1000 * (d["v_off"] - d["v_on"])
    return v
