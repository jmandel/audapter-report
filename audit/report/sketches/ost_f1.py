from sketchlib import *


def sketch(d, up):
    t, TT = d["t"], 2.0                     # each trial is 2.0 s; the session is trial A then trial B
    tb = [x + TT for x in t]
    a2, bf, ba = d["state2_A_s"], d["state2_B_fresh_s"], d["state2_B_after_A_s"]
    s = Sketch("sk-ost-f1", 0, 2 * TT, "One session: trial A, reset(), trial B; below, trial B in a session of its own")
    s.header("Session 1: trial A, then reset(), then trial B")
    s.lane([(TT, "reset(): OST state not cleared", "start")])
    y0 = s.y
    s.envelope("Input", t + tb, db(d["rms_A"]) + db(d["rms_B"]), -60, -10, h=34, marks=[(0.03, "A: one vowel"), (TT + 0.03, "B: word 1, word 2")])
    yst = s.intervals("OST state", state_ivs(t, d["stat_A"], "context", TT) + state_ivs(tb, d["stat_B_after_A"], "observed", 2 * TT))
    shA = runs(t, d.get("sF1_A", [0] * len(t)), lambda v: v > 0)   # trial A is shifted in its own state 1, as intended
    sha = runs(t, d["sF1_B_after_A"], lambda v: v > 0)
    ysh = s.intervals("F1 +30 % applied", [(a, b, "shifted", "context") for a, b in shA] +
                      [(a + TT, b + TT, "shifted", "observed") for a, b in sha])
    s.band(TT + bf, TT + ba, yst, ysh + 30, "")
    s.event(TT, y0 - 20, ysh + 30, "")
    s.guide(a2, yst, yst + 30)
    s.guide(TT + a2, yst, ysh + 30, dashed=True)
    s.lane([(a2, f"A reaches state 2 at {a2:.2f} s", "end"),
            (TT + bf, f"B reaches state 2 only at +{ba:.2f} s, the same frame count as A (dashed): word 2 is shifted", "start")])
    s.header("Session 2: trial B on its own, drawn under trial B")
    y2 = s.intervals("OST state", [(0, TT, "", "none")] + state_ivs(tb, d["stat_B_fresh"], "expected", 2 * TT))
    shf = runs(t, d["sF1_B_fresh"], lambda v: v > 0)
    s.intervals("F1 +30 % applied", [(a + TT, b + TT, "shifted", "expected") for a, b in shf])
    s.lane([(TT + bf, f"state 2 at +{bf:.2f} s, right after word 1", "start")])
    s.axis([0, 1, 2, 3, 4], label="time in the session (s); trial B starts at 2 s")
    return s.svg(f"Session 1: trial A, one long vowel, reaches state 2 at {a2:.2f} s. After reset(), trial B's offset is only detected "
                 f"{ba:.2f} s into trial B, so the F1 shift also covers word 2. In a fresh session, trial B reaches state 2 at {bf:.2f} s.")


def derive(d, up):
    v = {"overrun": d["state2_B_after_A_s"] - d["state2_B_fresh_s"]}
    r = [a / b for a, b, t in zip(d["sF1_B_after_A"], d["F1_B"], d["t"]) if 0.75 <= t <= 1.15 and b > 0]
    v["logged_ratio"] = sum(r) / len(r)
    return v


def derive_real(rd):
    P = rd["pairs"]
    ch = [p for p in P if p["fall_fresh_s"] != p["fall_afterA_s"]]
    late = sorted(p["fall_afterA_s"] - p["fall_fresh_s"] for p in ch if p["fall_afterA_s"] is not None and p["fall_fresh_s"] is not None)
    return {"n_pairs": len(P), "n_changed": len(ch), "late_min": min(late), "late_max": max(late),
            "n_never": sum(1 for p in ch if p["fall_afterA_s"] is None)}
