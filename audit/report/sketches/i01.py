"""I-01 in blab's simonSingleWord v2 masking phase (report_i01_session.m, both builds): expected = blab before b2.4
(buffer 230400, babble truncated to it, seamless), observed = current blab (buffer 480000, 16 ms silence every 9.98 s)."""
import json, os
import measure as M
from sketchlib import rows2
from sketches import evlib

FIG = [5, 6, 7]


def _sess(d, tag):
    s = json.load(open(os.path.join(d["_dir"], "meas", f"session_{tag}.json")))
    s["gaps"] = rows2(s.get("gaps") or [])
    return s


def measured(d):
    """Silent runs (exact zeros, >= 2 ms) found on each build's WAV of every trial, independently of the export's own scan."""
    md = os.path.join(d["_dir"], "meas"); out = {}
    for tag in ("blab", "upstream"):
        n = _sess(d, tag)["n_trials"]
        out[tag] = {k: M.silent_runs(os.path.join(md, f"{tag}_t{k}.wav"), 0, 1.8) for k in range(1, n + 1)}
    return out


def spec(d):
    m = measured(d); S = _sess(d, "blab"); T = S["trial_s"]; trials = []
    for k in FIG:
        tr = {"n": k, "tag": "fb 2", "dur": T, "hl": bool(m["blab"][k]), "words": []}
        tr["exp"] = {"pert": [(0, T, "babble")], "vals_at": [(a + 0.4, "no silence") for a, b in m["blab"][k]] or [(T / 2, "")]}
        gaps = m["blab"][k]; segs, t0 = [], 0
        for a, b in gaps:
            segs.append((t0, a, "babble")); t0 = b
        segs.append((t0, T, "babble"))
        tr["obs"] = {"pert": segs, "vals_at": [(a + 0.4, f"{(b - a) * 1000:.0f} ms silent") for a, b in gaps]}
        if gaps:
            tr["obs"]["diff"] = [(a - 0.03, b + 0.03) for a, b in gaps]
        trials.append(tr)
    return {"sid": "sk-i-01", "trials": trials, "gap": 0.3, "t_session0": (FIG[0] - 1) * (T + 0.3),
            "rows": {"words": None, "pert": "Masking babble", "vals": "Silence in the output"},
            "heads": {"exp": "blab before b2.4 (buffer 230,400 samples): the babble loops seamlessly",
                      "obs": "blab since b2.4 (buffer 480,000 samples): what Audapter plays now"},
            "callout": "16 ms of silence in trial 6: the participant's voice is unmasked", "callout_t": 1.8 + 0.3 + 1.0, "callout_anchor": "start"}


def sketch(d, up):
    return evlib.render(spec(d))


def derive(d, up):
    m = measured(d); S, U = _sess(d, "blab"), _sess(d, "upstream")
    for x in (d, up):
        if x and "gaps" in x: x["gaps"] = rows2(x["gaps"])
    g = [(k, a, b) for k, runs in m["blab"].items() for a, b in runs]
    v = {"n_gaps": len(g), "n_trials": S["n_trials"], "trial_s": S["trial_s"], "gap_trials": ", ".join(str(k) for k, a, b in g),
         "gap_times": ", ".join(f"{a:.2f} s" for k, a, b in g), "gap_ms_min": min((b - a) * 1000 for k, a, b in g) if g else 0,
         "gap_ms_max": max((b - a) * 1000 for k, a, b in g) if g else 0,
         "up_gaps": sum(len(r) for r in m["upstream"].values()), "maxpb": S["maxPBLen"], "up_maxpb": U["maxPBLen"],
         "noise_len": S["noise_len"], "up_noise_len": U["noise_len"], "every_s": S["maxPBLen"] / 48000 * 1.0,
         "one_in": (S["maxPBLen"] / 48000) / S["trial_s"]}
    fmt = lambda gg: ", ".join(f"{a:.2f}–{b:.2f} s" for a, b in gg) if gg else "none"
    v["gaps_text"] = fmt(d.get("gaps", []))
    return v
