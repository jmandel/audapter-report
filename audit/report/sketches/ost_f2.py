from sketchlib import *


def _lab(ivs):
    return [(a, b, "state 3" if l == "state 3" else l, k) for a, b, l, k in ivs]


def sketch(d, up):
    t, TT = d["t"], 1.4                     # each trial is 1.4 s; three trials in one session
    off = lambda k: [x + k * TT for x in t]
    s = Sketch("sk-ost-f2", 0, 3 * TT, "One session with three trials and the OST loaded once, against the intended timing")
    s.header("Session: OST loaded once, three trials with reset() between them")
    s.lane([(k * TT, "reset()", "start") for k in (1, 2)])
    y0 = s.y
    s.envelope("Input", off(0) + off(1) + off(2), db(d["rms"]) * 3, -60, -10, h=30, marks=[(k * TT + 0.03, f"trial {k + 1}") for k in range(3)])
    ys = s.intervals("OST state", sum([_lab(state_ivs(off(k), d[f"stat_{k + 1}"], "observed", (k + 1) * TT)) for k in range(3)], []))
    sh = sum([[(a + k * TT, b + k * TT, "F1 +30 %", "observed") for a, b in runs(t, d[f"sF1_{k + 1}"], lambda v: v > 0)] for k in range(3)], [])
    yf = s.intervals("F1 +30 % applied", sh)
    for k in (1, 2):
        s.event(k * TT, y0 - 20, yf + 30, "")
    c = d["ctrl_shift_on_s"]
    for k in range(3):
        s.guide(k * TT + d["ctrl_state2_s"], ys, ys + 30, dashed=True)
        o = d["shift_on_s"][k]
        s.band(k * TT + min(o, c), k * TT + max(o, c), yf, yf + 30, "")
    s.lane([(k * TT + d["state2_s"][k], f"timeout at {d['state2_s'][k]:.2f} s", "start") for k in range(3)])
    s.header("Intended timing, the same in every trial")
    sc = runs(t, d["sF1_ctrl"], lambda v: v > 0)
    s.intervals("OST state", sum([_lab(state_ivs(off(k), d["stat_ctrl"], "expected", (k + 1) * TT)) for k in range(3)], []))
    s.intervals("F1 +30 % applied", [(a + k * TT, b + k * TT, "F1 +30 %", "expected") for k in range(3) for a, b in sc])
    s.lane([(d["ctrl_state2_s"], f"timeout at {d['ctrl_state2_s']:.2f} s (dashed lines), shift from {c:.2f} s, in every trial", "start")])
    s.axis([0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2], label="time in the session (s); trials start at 0, 1.4 and 2.8 s")
    return s.svg("Intended: in every trial the timeout moves to state 2 at %.2f s and the F1 shift starts at %.2f s. With the OST loaded once, "
                 "state 2 lasts %.0f ms instead of %.0f ms, and the timeout fires at %.2f, %.2f and %.2f s into trials 1, 2 and 3."
                 % (d["ctrl_state2_s"], c, 1000 * d["held_s"][0], 1000 * (d["ctrl_state3_s"] - d["ctrl_state2_s"]), *d["state2_s"]))


def derive(d, up):
    c = d["ctrl_shift_on_s"]
    return {"early": c - d["shift_on_s"][0], "late2": d["shift_on_s"][1] - c, "late3": d["shift_on_s"][2] - c,
            "held_ms": [1000 * h for h in d["held_s"]], "held1_ms": 1000 * d["held_s"][0], "held_ctrl_ms": 1000 * (d["ctrl_state3_s"] - d["ctrl_state2_s"]),
            "s2_1": d["state2_s"][0], "s2_2": d["state2_s"][1], "s2_3": d["state2_s"][2],
            "on_1": d["shift_on_s"][0], "on_2": d["shift_on_s"][1], "on_3": d["shift_on_s"][2]}


def derive_real(rd):
    nr = [t for t in rd["trials"] if t["mode"] == "no_reload"]
    rl = [t for t in rd["trials"] if t["mode"] == "reload"]
    return {"nr_list": " / ".join(f'{t["state2_s"]:.3f}' for t in nr), "rl_s": rl[0]["state2_s"], "n_tr": len(nr),
            "held_ms": max(t["held_s"] for t in rd["trials"]) * 1000}
