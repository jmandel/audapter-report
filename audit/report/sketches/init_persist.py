"""Optional fields persist across AudapterIO('init') (report_pitfalls2.m persist): block 2 built without p.bPitchShift."""
import os
import measure as M
from sketches import evlib


def lv(d, f):
    md = os.path.join(d["_dir"], "meas"); lin = M.span(os.path.join(md, "in.wav"), 0.1, 1.7, "level", inner=1.0)
    return M.span(os.path.join(md, f), 0.1, 1.7, "level", inner=1.0) - lin


def sketch(d, up):
    e, o = lv(d, "expected.wav"), lv(d, "observed.wav"); dur = 1.7; trials = []
    for n, (tag, key) in enumerate((("block 1: pitch", "b1"), ("block 2: formant", "b2"))):
        tr = {"n": n + 1, "tag": tag, "dur": dur, "words": [(0.1, dur - 0.1, "“I had faith in them.”")]}
        if key == "b1":
            tr["exp"] = tr["obs"] = {"pert": [(0.02, dur - 0.02, "vocoder on (p.bPitchShift 1)")], "vals": ["as designed"]}
        else:
            tr["exp"] = {"pert": [], "none": "vocoder off (field absent from p)", "vals": [f"{e:+.1f} dB"]}
            tr["obs"] = {"pert": [(0.02, dur - 0.02, "vocoder still on")], "vals": [f"{o:+.1f} dB"], "diff": [(0.1, dur - 0.1)]}
        trials.append(tr)
    return evlib.render({"sid": "sk-init-persist", "trials": trials, "gap": 0.4,
                         "rows": {"words": "Speech", "pert": "Phase vocoder", "vals": "Level heard vs spoken"},
                         "between": {1: "AudapterIO('init', p) with a p that has no bPitchShift field"},
                         "callout": "Block 2 keeps block 1's vocoder: the voice is 3.5 dB louder", "callout_anchor": "end"})


def derive(d, up):
    return {"exp_db": lv(d, "expected.wav"), "obs_db": lv(d, "observed.wav"), "bps": d["bpitchshift_after"]}
