"""COORD-1 with blab's session structure (report_coord1.m): measureFormants calibration, then a field-mode experiment,
with (expected) and without (observed) the runner's two clear lines. Expected-vs-observed panels."""
import os, math
import measure as M
from sketches import evlib


def _pct(o, i):
    return None if not (o == o and i == i and i) else 100 * (o / i - 1)


def _f(x):
    return "n/a" if x is None else ("0 %" if abs(x) < 0.5 else f"{x:+.0f} %")


def measured(d):
    md = os.path.join(d["_dir"], "meas"); a, b = d["g1"], d["g1"] + d["wd"]; out = {}
    for k in range(len(d["sequence"])):
        fi = M.span(os.path.join(md, f"t{k+1}_in.wav"), a, b, "F1")
        out[k] = (fi, M.span(os.path.join(md, f"exp_t{k+1}_out.wav"), a, b, "F1"), M.span(os.path.join(md, f"obs_t{k+1}_out.wav"), a, b, "F1"))
    return out


def _n(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else x


def spec(d):
    m = measured(d); trials = []; a, b = d["g1"], d["g1"] + d["wd"]
    for k, tag in enumerate(d["sequence"]):
        tr = {"n": k + 1, "tag": tag, "dur": d["trial_s"], "words": [(a, b, "head")]}
        for key in ("exp", "obs"):
            on, off = _n(d[key]["on"][k]), _n(d[key]["off"][k])
            tr[key] = {"pert": [] if on is None else [(on, off, "+125 mel")], "vals": [_f(_pct(m[k][1 if key == "exp" else 2], m[k][0]))],
                       "none": "none" if tag != "calibration" else "none (calibration)"}
        if tag == "shift" and not d["obs"]["shift_s"][k]:
            tr["obs"]["diff"] = [(a, b)]
        trials.append(tr)
    return {"sid": "sk-coord-1", "trials": trials, "gap": 0.35,
            "rows": {"words": "Speech", "pert": "F1 +125 mel", "vals": "F1 heard vs spoken"},
            "between_exp": {2: "runner clears OST and PCF, then AudapterIO('init')"},
            "between_obs": {2: "AudapterIO('init') only: the clear lines are missing"},
            "callout": "The measureFormants PCF is still loaded and overrides the field: no shift on either shift trial",
            "callout_anchor": "end"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    m = measured(d); v = {}
    for k in range(len(d["sequence"])):
        v[f"t{k+1}_in"], v[f"t{k+1}_exp"], v[f"t{k+1}_obs"] = m[k]
        v[f"t{k+1}_exp_pct"] = _f(_pct(m[k][1], m[k][0])); v[f"t{k+1}_obs_pct"] = _f(_pct(m[k][2], m[k][0]))
    v["exp_shift_s"] = d["exp"]["shift_s"][2]; v["obs_shift_s"] = d["obs"]["shift_s"][2]
    v["simon_nc_s"] = d["simon"]["not_cleared"]["shift_s"]; v["simon_nc_mel"] = d["simon"]["not_cleared"]["dF1mel"]
    v["simon_c_s"] = d["simon"]["cleared"]["shift_s"]
    return v
