"""A per-vowel 2-D patch sent without its bounds (report_pitfalls2.m patch): expected = with F1Min..F2Max = patch, observed = without."""
import math
from sketches import vsa


def _rows(d):
    ex, ob = d["exp"], d["obs"]; out = []
    for k, (e, o) in enumerate(zip(ex, ob)):
        out.append({"vowel": "eh", "label": f"{k+1}", "prod_hz": e["prod_hz"], "prod_mel": e["prod_mel"], "intended_hz": e["heard_hz"], "intended_mel": e["heard_mel"],
                    "heard_hz": o["heard_hz"], "heard_mel": o["heard_mel"]})
    return out


def sketch(d, up):
    rows = _rows(d); c = d["centre_mel"]; cen = [(math.exp(x / 1127.01048) - 1) * 700 for x in c]
    return vsa.figure("sk-fmt-patch", [("Five /ɛ/ tokens: 1–3 inside the ±90 mel patch, 4–5 outside", rows, None)], cen,
                      "Tokens inside are moved half-way to the centre in both runs; outside, the bounded patch leaves them alone and the unbounded one shifts them by the edge cell.",
                      "Orange: tokens 4 and 5 lie outside the patch; without the bounds they get the edge cell's shift, a fixed amount not tied to their own position.",
                      obs_title="patch sent without F1Min..F2Max")


def derive(d, up):
    v = {}
    for k in (3, 4):
        e, o = d["exp"][k], d["obs"][k]
        v[f"t{k+1}_exp"] = math.hypot(e["heard_mel"][0] - e["prod_mel"][0], e["heard_mel"][1] - e["prod_mel"][1])
        v[f"t{k+1}_obs"] = math.hypot(o["heard_mel"][0] - o["prod_mel"][0], o["heard_mel"][1] - o["prod_mel"][1])
    return v
