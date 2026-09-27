from sketchlib import *


def sketch(d, up):
    t = d["t"]; TT = t[-1] + (t[1] - t[0]); tb = [x + TT for x in t]
    s = Sketch("sk-coord-1", 0, 2 * TT, "A PCF experiment, then AudapterIO('init') and a field experiment in the same session; below, the field experiment in a fresh session")
    s.header("Session 1: a PCF experiment, then the field experiment")
    s.lane([(0, "PCF experiment (pitch_pert.pcf loaded)", "start"), (TT, "AudapterIO('init'): OST and PCF stay loaded", "start")])
    y0 = s.y
    s.envelope("Input", t + tb, db(d["rms"]) * 2, -60, -10, h=30)
    on1 = runs(t, d["sh1"], lambda v: v > 0); on0 = runs(t, d["sh0"], lambda v: v > 0)
    yo = s.intervals("F1 +20 % applied", [(0, TT, "pitch experiment, no formant shift", "context")] + [(a + TT, b + TT, "F1 +20 %", "observed") for a, b in on1])
    s.event(TT, y0 - 20, yo + 30, "")
    if on0 and not on1:
        s.band(TT + on0[0][0], TT + on0[-1][1], yo, yo + 30, "")
    s.lane([(TT + (on0[0][0] if on0 else 0), f'{d["after"]} frames shifted: the field experiment is silently unperturbed', "start")])
    s.header("Session 2: the field experiment in a fresh session, drawn under it")
    s.intervals("F1 +20 % applied", [(a + TT, b + TT, "F1 +20 %", "expected") for a, b in on0] or [(0, 0, "", "none")])
    s.lane([(TT + (on0[0][0] if on0 else 0), f'{d["fresh"]} frames shifted', "start")])
    s.axis([0, 0.5, 1, 1.5, 2], label="time in the session (s); the field experiment starts at 1 s")
    return s.svg(f'After a PCF experiment and AudapterIO(init), the field experiment shifts {d["after"]} frames; in a fresh session it shifts {d["fresh"]}.')


def derive_real(rd):
    return {}
