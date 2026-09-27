from sketchlib import *


def _lab(ivs):
    return [(a, b, "state 3 · F1 +30 %" if l == "state 3" else l, k) for a, b, l, k in ivs]


def sketch(d, up):
    t, T1 = d["t"], 1.4
    s = Sketch("sk-ost-f2", 0, T1, "OST state timeline: maxIOI fallback and ELAPSED_TIME, intended vs three trials without reloading the OST")
    s.envelope("Input", t, db(d["rms"]), -60, -10, marks=[(0.07, "soft /a/, below the onset threshold (same in every trial)")])
    yc = s.intervals("OST state", _lab(state_ivs(t, d["stat_ctrl"], "expected", T1)), sub="intended timing")
    c = d["ctrl_shift_on_s"]
    y = yc
    for k in (1, 2, 3):
        s.gap(16)
        y = s.intervals("OST state", _lab(state_ivs(t, d[f"stat_{k}"], "observed", T1)),
                        sub="trial 1, OST loaded" if k == 1 else f"trial {k}, no reload")
        o, s2 = d["shift_on_s"][k - 1], d["state2_s"][k - 1]
        a, b = min(o, c), max(o, c)
        if k == 1:
            txt = f"F1 shift starts {c - o:.2f} s early: state 2 (ELAPSED_TIME {d['elapsed_s']:g} s) lasted {1000 * d['held_s'][0]:.0f} ms"
        else:
            txt = f"timeout at {s2:.2f} s instead of {d['state2_s'][0]:.2f} s; F1 shift starts {o - c:.2f} s late"
        s.band(a, b, y, y + 30, txt, anchor="start", ty=y - 5)
    s.guide(c, yc, y + 30)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4])
    return s.svg("Intended: state 2 at %.2f s (maxIOI timeout), state 3 and the F1 shift at %.2f s. Trial 1: state 2 at %.2f s but "
                 "ELAPSED_TIME fires after %.3f s, so the shift starts at %.2f s. Trials 2 and 3 without reloading the OST: the "
                 "timeout fires at %.2f s and %.2f s." % (d["ctrl_state2_s"], c, d["state2_s"][0], d["held_s"][0], d["shift_on_s"][0],
                                                          d["state2_s"][1], d["state2_s"][2]))


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
