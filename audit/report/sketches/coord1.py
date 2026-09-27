from sketchlib import *


def sketch(d, up):
    t = d["t"]; T = t[-1] + (t[1] - t[0])
    s = Sketch("sk-coord-1", 0, T, "Frames shifted by the same field experiment, fresh and after an earlier PCF experiment")
    s.envelope("Input", t, db(d["rms"]), -60, -10, h=30, sub="synthetic /a/")
    on0 = runs(t, d["sh0"], lambda v: v > 0); on1 = runs(t, d["sh1"], lambda v: v > 0)
    s.intervals("Fresh session", [(a, b, "F1 +20 %", "expected") for a, b in on0], sub=f'{d["fresh"]} frames shifted')
    yo = s.intervals("After a PCF experiment", [(a, b, "F1 +20 %", "observed") for a, b in on1] or [(0, T, "", "none")],
                     sub=f'{d["after"]} frames shifted')
    if on0 and not on1:
        s.band(on0[0][0], on0[-1][1], yo, yo + 30, "no frame shifted: the stale PCF (no formant rows) overrides the field", anchor="start", ty=yo + 19)
    s.axis([round(x, 1) for x in [0, 0.2, 0.4, 0.6, 0.8, 1.0] if x <= T], "{:g} s")
    return s.svg(f'The field experiment shifts {d["fresh"]} frames in a fresh session and {d["after"]} after an earlier PCF experiment followed by AudapterIO(init).')


def derive_real(rd):
    return {}
