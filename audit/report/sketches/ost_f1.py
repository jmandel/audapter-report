"""OST-F1 in a mixed "shift the first word" design with catch trials (report_ost_f1.m): expected vs observed panels."""
import math, os
import measure as M
from sketches import evlib

FIG_TRIALS = 5          # the figure shows trials 1-5; the table covers all 8


def _words(d, k):
    g1, w1, p12, w2 = d["g1"], d["w1"][k], d["p12"], d["w2"]
    return [(g1, g1 + w1), (g1 + w1 + p12, g1 + w1 + p12 + w2)]


def _pct(o, i):
    return None if not (o == o and i == i and i) else 100 * (o / i - 1)


def _f(x):
    return "n/a" if x is None else f"{x:+.0f} %".replace("+0 %", "0 %").replace("-0 %", "0 %")


def measured(d):
    """Per-word F1 in (input) and out (expected, observed), measured on the WAVs in out/report/ost-f1/meas/."""
    md = os.path.join(d["_dir"], "meas"); out = {}
    for k in range(len(d["w1"])):
        for j, (a, b) in enumerate(_words(d, k)):
            fi = M.span(os.path.join(md, f"leak_t{k+1}_in.wav"), a, b, "F1")
            fe = M.span(os.path.join(md, f"leak_t{k+1}_exp.wav"), a, b, "F1")
            fo = M.span(os.path.join(md, f"leak_t{k+1}_obs.wav"), a, b, "F1")
            out[(k, j)] = (fi, fe, fo)
    return out


def _num(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else x


def spec(d):
    m = measured(d); L = d["leak"]; trials = []
    for k in range(FIG_TRIALS):
        ws = _words(d, k); catch = d["catch"][k]
        tr = {"n": k + 1, "tag": "catch" if catch else "shift", "dur": d["trial_s"][k], "hl": k == 2,
              "words": [(a, b, f"word {j+1}") for j, (a, b) in enumerate(ws)]}
        for key, on, off, t3 in (("exp", L["on_exp"], L["off_exp"], L["t3_exp"]), ("obs", L["on_obs"], L["off_obs"], L["t3_obs"])):
            P = {"vals": [_f(_pct(m[(k, j)][1 if key == "exp" else 2], m[(k, j)][0])) for j in range(2)],
                 "none": "no shift (catch)" if catch else "none"}
            a, b = _num(on[k]), _num(off[k])
            P["pert"] = [] if a is None else [(a, b, "+125 mel")]
            t = _num(t3[k]); P["marks"] = [(t, "offset")] if t is not None else [(None, "never detected")]
            tr[key] = P
        e, o = _num(L["off_exp"][k]), _num(L["off_obs"][k])
        if e is not None and o is not None and o > e + 0.05:
            tr["obs"]["diff"] = [(e, o)]
        trials.append(tr)
    return {"sid": "sk-ost-f1", "trials": trials, "gap": 0.35,
            "rows": {"words": "Speech", "pert": "F1 +125 mel", "marks": "Offset detected", "vals": "F1 heard vs spoken"},
            "callout": "After the long catch trial 3, the shift runs on through word 2 in trials 4 and 5",
            "callout_anchor": "end"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    m = measured(d); L, S = d["leak"], d["safe"]; v = {}
    for k in range(len(d["w1"])):
        for j in range(2):
            fi, fe, fo = m[(k, j)]
            v[f"t{k+1}w{j+1}_in"] = fi; v[f"t{k+1}w{j+1}_exp"] = fe; v[f"t{k+1}w{j+1}_obs"] = fo
            v[f"t{k+1}w{j+1}_exp_pct"] = _f(_pct(fe, fi)); v[f"t{k+1}w{j+1}_obs_pct"] = _f(_pct(fo, fi))
    t = lambda x: "never" if _num(x) is None else f"{x:.2f} s"
    for k in range(len(d["w1"])):
        v[f"t{k+1}_off_exp"] = t(L["t3_exp"][k]); v[f"t{k+1}_off_obs"] = t(L["t3_obs"][k])
        v[f"t{k+1}_word1_end"] = d["g1"] + d["w1"][k]
    v["t4_extra_s"] = L["off_obs"][3] - L["off_exp"][3]
    v["t5_extra_s"] = L["off_obs"][4] - L["off_exp"][4]
    v["n_never"] = sum(1 for k, x in enumerate(L["t3_obs"]) if _num(x) is None and not d["catch"][k])
    v["n_pert"] = sum(1 for c in d["catch"] if not c)
    v["n_late"] = sum(1 for k in range(len(d["w1"])) if not d["catch"][k] and (_num(L["t3_obs"][k]) is None or L["t3_obs"][k] > L["t3_exp"][k] + 0.05))
    v["safe_same"] = all(abs(a - b) < 1e-9 for a, b in zip(S["t3_obs"], S["t3_exp"]) if _num(a) is not None)
    v["safe_after_w1"] = max(S["t3_exp"][k] - (d["g1"] + d["w1"][k]) for k in range(len(d["w1"])))
    sm = d["same_t3"]; w2on = d["g1"] + d["w1"][0] + d["p12"]
    v["same_first"], v["same_step_ms"] = sm[0], 1000 * (sm[7] - sm[0]) / 7
    v["same_w2_trial"] = next((k + 1 for k, x in enumerate(sm) if _num(x) is None or x > w2on), "none of the 10")
    v["same_last"] = t(sm[-1])
    rl = d.get("reload_t3", [])
    v["reload_never"] = sum(1 for k, x in enumerate(rl) if _num(x) is None and not d["catch"][k])
    v["reload_first"] = t(rl[0]) if rl else "n/a"
    return v
