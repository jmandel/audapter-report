from sketchlib import *


def _ivs(t, st, kind, T1, db_):
    return [(a, b, f"state 2 · +{db_:g} dB" if l == "state 2" else l, k) for a, b, l, k in state_ivs(t, st, kind, T1)]


def sketch(d, up):
    t, T1, g = d["t"], 1.2, d["int_db"]
    s = Sketch("sk-ost-f8", 0, T1, "INTENSITY_AND_RATIO_ABOVE_THRESH with the hold in field 5 (0.05) vs the documented {}")
    s.envelope("Input", t, db(d["rms"]), -60, -10, sub='"sa"', marks=[(d["s_on"] + 0.01, "/s/"), (d["s_off"] + 0.01, "/a/")])
    s.intervals("OST state", _ivs(t, d["stat_hold"], "expected", T1, g), sub="field 5 = %g" % d["hold_s"])
    s.gap(16)
    y = s.intervals("OST state", _ivs(t, d["stat_braces"], "observed", T1, g), sub="field 5 = {}")
    a, b = d["braces_state2_s"], d["hold_state2_s"]
    s.band(a, b, y, y + 30, f"state 2 begins {1000 * (b - a):.0f} ms early: the {1000 * d['hold_s']:.0f} ms hold is 0", anchor="start", ty=y - 5)
    s.gap(18)
    s.envelope("Input", t, db(d["rms_click"]), -60, -10, sub='click + "sa"', marks=[(d["click_on"] - 0.04, "click"), (d["s_on"] + 0.01, "/s/"), (d["s_off"] + 0.01, "/a/")])
    s.intervals("OST state", _ivs(t, d["stat_click_hold"], "expected", T1, g), sub="field 5 = %g" % d["hold_s"])
    s.gap(16)
    y2 = s.intervals("OST state", _ivs(t, d["stat_click_braces"], "observed", T1, g), sub="field 5 = {}")
    a, b = d["click_braces_state2_s"], d["click_hold_state2_s"]
    s.band(a, b, y2, y2 + 30, f"the {1000 * d['click_dur']:.0f} ms click alone triggers state 2, {d['s_on'] - a:.2f} s before the /s/", anchor="start", ty=y2 - 5)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2])
    return s.svg("With the hold written in field 5, state 2 begins at %.3f s, %.0f ms into the /s/. With the documented {} in field 5 it begins "
                 "at %.3f s. With a %.0f ms click 0.3 s before the word, {} lets the click trigger state 2 at %.3f s; with the hold the click "
                 "enters state 1 and falls back." % (d["hold_state2_s"], d["hold_delay_ms"], d["braces_state2_s"], 1000 * d["click_dur"],
                                                     d["click_braces_state2_s"]))


def derive(d, up):
    return {"early_ms": d["hold_delay_ms"] - d["braces_delay_ms"], "click_ms": 1000 * d["click_dur"],
            "click_lead_s": d["s_on"] - d["click_braces_state2_s"], "hold_ms": 1000 * d["hold_s"],
            "hold_frames_ms": 1000 * d["hold_frames"] * d["frame_s"], "braces_frames_ms": 1000 * d["braces_frames"] * d["frame_s"]}
