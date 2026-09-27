"""OST-F2 (maxIOI timeout) as a session of three trials, real soft voice (report_ost_f2.m real arm): expected = the intended
timing (timeout at 0.2 s, shift 0.1 s later) on every trial; observed = the maxIOI OST loaded once."""
import os
import measure as M
from sketches import evlib

WIN = ((0.21, 0.30), (0.42, 0.60))
POS = (0.16, 0.62)   # where the two values are printed (centres of text), kept apart for legibility


def measured(d):
    md = os.path.join(d["_dir"], "meas"); out = {}
    f = lambda n, a, b: M.span(os.path.join(md, n), a, b, "F1", 1.0, 1e-4)
    for k in range(3):
        for j, (a, b) in enumerate(WIN):
            fi = f("real_in.wav", a, b)
            out[(k, j)] = (fi, f(f"real_exp_t{k+1}.wav", a, b), f(f"real_obs_t{k+1}.wav", a, b))
    return out


def _p(o, i):
    x = 100 * (o / i - 1)
    return "0 %" if abs(x) < 2 else f"{x:+.0f} %"


def spec(d):
    R = d["real"]; m = measured(d); trials = []
    for k in range(3):
        tr = {"n": k + 1, "tag": "soft /a/", "dur": R["trial_s"], "words": [(R["v_on"], R["v_off"], "soft /a/ (real voice)")]}
        tr["exp"] = {"pert": [(R["exp_on"][k], R["v_off"], "F1 +30 %")], "marks": [(d["ctrl_state2_s"], "timeout")],
                     "vals_at": [(POS[j], _p(m[(k, j)][1], m[(k, j)][0])) for j in range(2)]}
        tr["obs"] = {"pert": [(R["obs_on"][k], R["v_off"], "F1 +30 %")], "marks": [(R["obs_s2"][k], "timeout")],
                     "vals_at": [(POS[j], _p(m[(k, j)][2], m[(k, j)][0])) for j in range(2)]}
        a, b = sorted((R["exp_on"][k], R["obs_on"][k]))
        if b - a > 0.01:
            tr["obs"]["diff"] = [(a, b)]
        trials.append(tr)
    return {"sid": "sk-ost-f2", "trials": trials, "gap": 0.35,
            "rows": {"words": "Speech", "pert": "Perturbation", "marks": "Timeout fires", "vals": "F1 heard vs spoken"},
            "heads": {"exp": "the intended timing on every trial: timeout at 0.2 s, shift 0.1 s later", "obs": "the OST loaded once, reset() between trials"},
            "callout": "Trial 1 starts the shift 0.1 s early; after that the timeout drifts 0.2 s later on every trial", "callout_anchor": "end"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    c = d["ctrl_shift_on_s"]; R = d["real"]; m = measured(d)
    v = {"early": c - d["shift_on_s"][0], "late2": d["shift_on_s"][1] - c, "late3": d["shift_on_s"][2] - c,
         "held1_ms": 1000 * d["held_s"][0], "held_ctrl_ms": 1000 * (d["ctrl_state3_s"] - d["ctrl_state2_s"]),
         "s2_1": d["state2_s"][0], "s2_2": d["state2_s"][1], "s2_3": d["state2_s"][2],
         "on_1": d["shift_on_s"][0], "on_2": d["shift_on_s"][1], "on_3": d["shift_on_s"][2],
         "r_on1": R["obs_on"][0], "r_on2": R["obs_on"][1], "r_on3": R["obs_on"][2], "r_exp_on": R["exp_on"][0]}
    for k in range(3):
        for j in range(2):
            v[f"t{k+1}w{j+1}_exp"] = _p(m[(k, j)][1], m[(k, j)][0]); v[f"t{k+1}w{j+1}_obs"] = _p(m[(k, j)][2], m[(k, j)][0])
    return v


def derive_real(rd):
    nr = [t for t in rd["trials"] if t["mode"] == "no_reload"]
    rl = [t for t in rd["trials"] if t["mode"] == "reload"]
    return {"nr_list": " / ".join(f'{t["state2_s"]:.3f}' for t in nr), "rl_s": rl[0]["state2_s"], "n_tr": len(nr),
            "held_ms": max(t["held_s"] for t in rd["trials"]) * 1000}
