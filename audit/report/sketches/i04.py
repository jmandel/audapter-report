from sketchlib import *

def sketch(d, up):
    t, T1 = d["t"], 1.3
    nz = lambda v: [x if x > 0 else None for x in v]
    s = Sketch("sk-i-04", 0, T1, "Condition 2 (F1 -20 %) run on fresh frames vs on the sigInCell already used for condition 1 (F1 +20 %)")
    s.envelope("Input", t, db(d["rms_in"]), -60, -10, h=30, sub="stored /a/ recording")
    yf, _ = s.lines("F1 tracked", [(t, nz(d["F1_fresh"]), "expected"), (t, nz(d["F1_reused"]), "observed")], 500, 1000, [600, 900], " Hz", h=90,
                    sub="condition 2, fmts")
    ys, sy = s.lines("F1 target", [(t, nz(d["sF1_fresh"]), "expected"), (t, nz(d["sF1_reused"]), "observed")], 500, 1000, [600, 900], " Hz", h=90,
                     sub="condition 2, sfmts")
    a, b = 0.35, 0.85
    s.band(a, b, ys, ys + 80, "")
    s.lane([(0.12, f"target from the reused frames: {d['logged_sF1_c2_reused_hz']:.0f} Hz (blue); from fresh frames: {d['logged_sF1_c2_fresh_hz']:.0f} Hz (thin line). The tracker sees condition 1's raised F1.", "start")])
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2])
    return s.svg("Run on the reused cell array, condition 2 tracks F1 at %.0f Hz (condition 1's output) instead of %.0f Hz and targets %.0f Hz instead of %.0f Hz; "
                 "the heard F1 is %.0f Hz, close to the unshifted input (%.0f Hz), instead of %.0f Hz."
                 % (d["logged_F1_c2_reused_hz"], d["logged_F1_c2_fresh_hz"], d["logged_sF1_c2_reused_hz"], d["logged_sF1_c2_fresh_hz"],
                    d["F1_c2_reused_hz"], d["F1_in_hz"], d["F1_c2_fresh_hz"]))


def derive(d, up):
    return {"r_c1": d["F1_c1_hz"] / d["F1_in_hz"], "r_fresh": d["F1_c2_fresh_hz"] / d["F1_in_hz"], "r_reused": d["F1_c2_reused_hz"] / d["F1_in_hz"],
            "c1_same": "bit-identical" if d["c1_identical"] else "different"}
