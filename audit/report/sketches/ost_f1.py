from sketchlib import *

def sketch(d, up):
    t, T1 = d["t"], 2.0
    s = Sketch("sk-ost-f1", 0, T1, "OST state timeline for trial B, as the first trial and right after trial A")
    s.envelope("Trial A input", t, db(d["rms_A"]), -60, -10, h=34, sub="previous trial", marks=[(0.06, "one vowel, 0.04–1.60 s")])
    ya = s.intervals("Trial A state", state_ivs(t, d["stat_A"], "context", T1), h=26)
    s.gap(10)
    s.envelope("Trial B input", t, db(d["rms_B"]), -60, -10, marks=[(0.06, "word 1"), (0.62, "word 2")])
    s.intervals("OST state", state_ivs(t, d["stat_B_fresh"], "expected", T1), sub="first trial")
    s.gap(16)
    yo = s.intervals("OST state", state_ivs(t, d["stat_B_after_A"], "observed", T1), sub="after trial A")
    shf = runs(t, d["sF1_B_fresh"], lambda v: v > 0)
    sha = runs(t, d["sF1_B_after_A"], lambda v: v > 0)
    s.gap(4)
    s.intervals("F1 +30 % applied", [(a, b, "shifted", "expected") for a, b in shf], h=26, sub="first trial")
    yp = s.intervals("F1 +30 % applied", [(a, b, "shifted", "observed") for a, b in sha], h=26, sub="after trial A")
    a, b = d["state2_B_fresh_s"], d["state2_B_after_A_s"]
    s.band(a, b, yo, yp + 26, f"state 1 runs {b - a:.2f} s too long, so word 2 is shifted", anchor="start", ty=yo - 6)
    s.guide(d["state2_A_s"], ya - 2, yo + 30)
    s.parts.append(f'<text class="sk-note" x="{s.x(d["state2_A_s"]) - 6:.1f}" y="{ya + 44}" text-anchor="end">trial A reached state 2 at {d["state2_A_s"]:.2f} s</text>')
    s.axis([0, 0.4, 0.8, 1.2, 1.6, 2.0])
    return s.svg("Trial B's state 2 begins at %.2f s as the first trial, but at %.2f s after trial A, whose own state 2 began at %.2f s. "
                 "The F1 shift therefore also covers word 2." % (d["state2_B_fresh_s"], d["state2_B_after_A_s"], d["state2_A_s"]))


def derive(d, up):
    v = {"overrun": d["state2_B_after_A_s"] - d["state2_B_fresh_s"]}
    r = [a / b for a, b, t in zip(d["sF1_B_after_A"], d["F1_B"], d["t"]) if 0.75 <= t <= 1.15 and b > 0]
    v["logged_ratio"] = sum(r) / len(r)
    return v
