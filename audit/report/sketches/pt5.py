"""PT-5 at blab's timeAdapt settings (report_pt5.m, warp session): control trials with a zero-length warp row (expected,
as blab's timeWrap experiment does) vs control trials without a warp section (observed). Values: heard level re input in dBA
(A-weighted level difference, measured on the exported WAVs)."""
import os
import measure as M
from sketches import evlib


def measured(d):
    md = os.path.join(d["_dir"], "meas"); dur = d["warp"]["dur_s"]
    lin = M.span(os.path.join(md, "warp_in.wav"), 0.1, dur, "levelA", inner=1.0)
    out = {}
    for arm in ("exp", "obs"):
        for k in range(len(d["warp"]["sequence"])):
            out[(arm, k)] = M.span(os.path.join(md, f"warp_{arm}_t{k+1}_out.wav"), 0.1, dur, "levelA", inner=1.0) - lin
    out["ref"] = M.span(os.path.join(md, "warp_ref_out.wav"), 0.1, dur, "levelA", inner=1.0) - lin
    return out


def _db(x):
    return "0.0 dBA" if abs(x) < 0.05 else f"{x:+.1f} dBA"


def spec(d):
    m = measured(d); W = d["warp"]; trials = []
    for k, tag in enumerate(W["sequence"]):
        tr = {"n": k + 1, "tag": tag, "dur": W["dur_s"], "words": [(0.12, W["dur_s"] - 0.1, "“There was a change now.”")]}
        for key in ("exp", "obs"):
            if tag == "warp":
                pert = [(0.40, 0.70, "warp")]
            elif key == "exp":
                pert = [(0.40, 0.43, "")]
            else:
                pert = []
            tr[key] = {"pert": pert, "vals": [_db(m[(key, k)])],
                       "none": "zero-length warp row" if key == "exp" else "no warp section"}
        if tag == "control" and abs(m[("obs", k)] - m[("exp", k)]) > 1:
            tr["obs"]["diff"] = [(0.12, W["dur_s"] - 0.1)]
        trials.append(tr)
    for tr in trials:
        if tr["tag"] == "control":
            tr["exp"]["pert"] = []
    return {"sid": "sk-pt-5", "trials": trials, "gap": 0.3,
            "rows": {"words": "Speech", "pert": "Time warp", "vals": "Heard level, dBA"},
            "heads": {"exp": "control trials keep a zero-length warp row, as blab's timeWrap experiment does",
                      "obs": "control trials drop the warp section"},
            "callout": f"Control trials play {m[('obs', 0)] - m[('obs', 1)]:.0f} dBA louder than warp trials: a loudness cue to the condition", "callout_anchor": "end"}


def cereb_spec(d):
    md = os.path.join(d["_dir"], "meas"); dur = d["warp"]["dur_s"]
    lin = M.span(os.path.join(md, "cereb_in.wav"), 0.1, dur, "levelA", inner=1.0)
    lv = {b: M.span(os.path.join(md, f"cereb_b{b}_out.wav"), 0.1, dur, "levelA", inner=1.0) - lin for b in (0, 1)}
    trials = []
    for n, (tag, b) in enumerate((("baseline", 0), ("later phases", 1))):
        tr = {"n": n + 1, "tag": tag, "dur": dur, "words": [(0.12, dur - 0.1, "“There was a change now.”")]}
        tr["exp"] = {"pert": [], "none": "same level in every phase", "vals": ["0.0 dBA"]}
        tr["obs"] = {"pert": [(0.02, dur - 0.02, "vocoder on, 0 st")] if b else [], "none": "vocoder off (bPitchShift 0)", "vals": [_db(lv[b])]}
        if b and abs(lv[1]) > 1:
            tr["obs"]["diff"] = [(0.12, dur - 0.1)]
        trials.append(tr)
    return {"sid": "sk-pt-5c", "trials": trials, "gap": 0.4,
            "rows": {"words": "Speech", "pert": "Phase vocoder", "vals": "Heard level, dBA"},
            "heads": {"exp": "the participant hears their voice at the same level in every phase",
                      "obs": "bPitchShift 0 in the baseline, 1 afterwards, no PCF"},
            "between": {1: "phase change"}, "callout": f"From the first vocoder phase on, the voice is played {lv[1] - lv[0]:.1f} dBA louder", "callout_anchor": "end"}


def tw_levels(d):
    md = os.path.join(d["_dir"], "meas"); dur = d["warp"]["dur_s"]
    lin = M.span(os.path.join(md, "tw_in.wav"), 0.1, dur, "levelA", inner=1.0)
    return {k: M.span(os.path.join(md, f"tw_{f}_out.wav"), 0.1, dur, "levelA", inner=1.0) - lin for k, f in (("pre", "pre"), ("later", "later"), ("warp", "later_warp"))}


def tw_spec(d):
    lv = tw_levels(d); dur = d["warp"]["dur_s"]; trials = []
    for n, (tag, key) in enumerate((("pre phase", "pre"), ("later phases", "later"))):
        tr = {"n": n + 1, "tag": tag, "dur": dur, "words": [(0.12, dur - 0.1, "“There was a change now.”")]}
        tr["exp"] = {"pert": [], "none": "same level in every phase", "vals": ["0.0 dBA"]}
        tr["obs"] = {"pert": [(0.02, dur - 0.02, "vocoder in warp mode")] if key == "later" else [], "none": "vocoder off (bPitchShift 0)", "vals": [_db(lv[key])]}
        if key == "later" and abs(lv[key]) > 1:
            tr["obs"]["diff"] = [(0.12, dur - 0.1)]
        trials.append(tr)
    return {"sid": "sk-pt-5t", "trials": trials, "gap": 0.4,
            "rows": {"words": "Speech", "pert": "Phase vocoder", "vals": "Heard level, dBA"},
            "heads": {"exp": "the participant hears their voice at the same level in every phase",
                      "obs": "timeWrap / cerebTimeAdapt settings: bPitchShift 0 in the pre phase; bPitchShift 1 and a warp-row PCF afterwards"},
            "between": {1: "phase change"}, "callout": f"From the first phase after pre onward the voice is played {lv['pre'] - lv['later']:.1f} dBA quieter, and {d['timewrap']['lat_later_ms'] - d['timewrap']['lat_pre_ms']:.0f} ms later", "callout_anchor": "end"}


def sketch(d, up):
    import sketchlib as SL, html
    h = lambda t: f'<p class="ev-sub">{html.escape(t)}</p>'
    return (h("A. blab's timeWrap and cerebTimeAdapt: pre phase with the vocoder off, later phases in warp mode (24 kHz, frameLen 32, nDelay 3)") + evlib.render(tw_spec(d))
            + h("B. Time-warp designs at timeAdapt settings (24 kHz, frameLen 48): control trials with and without a warp section") + evlib.render(spec(d))
            + h("C. A plausible design: vocoder switched on, without a PCF, after a baseline phase (24 kHz, frameLen 32, nDelay 3)") + evlib.render(cereb_spec(d)))


def derive(d, up):
    import math
    m = measured(d); v = {}
    W = d["warp"]
    for arm in ("exp", "obs"):
        for k in range(len(W["sequence"])):
            v[f"{arm}_t{k+1}_db"] = m[(arm, k)]; v[f"{arm}_t{k+1}_txt"] = _db(m[(arm, k)])
    cs = cereb_spec(d); v["cereb_b0"] = cs["trials"][0]["obs"]["vals"][0]; v["cereb_b1"] = cs["trials"][1]["obs"]["vals"][0]
    v["cereb_json_b1"] = d["cereb"]["b1_db"]
    tl = tw_levels(d); v["tw_pre"], v["tw_later"], v["tw_warp"] = _db(tl["pre"]), _db(tl["later"]), _db(tl["warp"])
    v["tw_later_db"] = tl["later"]; v["tw_lat_pre"] = d["timewrap"]["lat_pre_ms"]; v["tw_lat_later"] = d["timewrap"]["lat_later_ms"]
    v["tw_lat_step"] = d["timewrap"]["lat_later_ms"] - d["timewrap"]["lat_pre_ms"]
    v["ref_db"] = m["ref"]; v["cue_db"] = m[("obs", 0)] - m[("obs", 1)]
    v["w16_none"], v["w16_zero"], v["w16_warp"] = d["warp16"]["none_dba"], d["warp16"]["zero_dba"], d["warp16"]["warp_dba"]
    v["w16_cue"] = d["warp16"]["none_dba"] - d["warp16"]["warp_dba"]
    tv = [x["later_dba"] - x["pre_dba"] for x in d["timewrap"]["voices"]]
    v["tw_v_n"], v["tw_v_lo"], v["tw_v_hi"] = len(tv), min(tv), max(tv); v["tw_q_lo"], v["tw_q_hi"] = -max(tv), -min(tv)
    v["cereb_b1_after_warp"] = d["cereb"]["b1_after_warp_dba"]; v["cereb_b1_db"] = d["cereb"]["b1_dba"]
    steps = [r["gain2_dba"] - r["gain0_dba"] for r in d["sweep"]]
    v.update({"f0_cents": 1200 * math.log2(d["f0_after"] / d["f0_in"]), "sweep_min": -max(steps), "sweep_max": -min(steps),
              "ampnorm_text": "; ".join(f'{a["name"]}: {a["result"].replace("Audapter: ", "")}' for a in d["ampnorm"])})
    return v


def derive_real(rd):
    import statistics as st
    clean = [c for c in rd["steady"]["per_clip"] if not c["id"].startswith("vbd_")]
    grp = lambda pre: [c["gp2_a"] - c["g0_a"] for c in clean if c["group"].startswith(pre)]
    h = [s["heard_step_dba"] for s in rd["in_utterance"]]
    S = rd["steady"]
    return {"n_clean": len(clean), "g0_lo": S["gain0_dba_range"][0], "g0_hi": S["gain0_dba_range"][1],
            "st_lo": -S["step_0_to_up2_dba_range"][1], "st_hi": -S["step_0_to_up2_dba_range"][0],
            "med_m": -st.median(grp("adult_M")), "med_f": -st.median(grp("adult_F")), "med_c": -st.median(grp("child")),
            "n_utt": len(h), "on_lo": -max(h), "on_hi": -min(h), "on_med": -st.median(h)}
