"""Time-warp magnitude at frameLen 48 (report_pitfalls2.m warp48): delivered extra lag over time, frameLen 32 vs 48."""
import sketchlib as SL
from sketchlib import Sketch


def sketch(d, up):
    s = Sketch("sk-warp-48", 0.1, 1.4, "Delivered lag of a programmed 60 ms time warp at frameLen 32 and 48 (24 kHz)")
    prog = lambda t: 0 if t < 0.30 else (60 * (t - 0.30) / 0.12 if t < 0.42 else (60 if t < 0.72 else max(0, 60 - 60 * (t - 0.72) / 0.03)))
    for fl in (32, 48):
        e = d[f"fl{fl}_w1"]; t = e["t"]; base = e["pre_ms"]
        s.lines(f"frameLen {fl}", [(t, [prog(x) for x in t], "expected"), (t, [v - base for v in e["lag_ms"]], "observed")], -10, 75, [0, 30, 60], " ms",
                h=80, sub=f"delivered {d[f'fl{fl}']['lag_ms']:.0f} ms of 60")
    s.lane([(0.30, "thin line: the programmed lag (slow to ×0.5 for 0.12 s, hold, catch up); thick: what Audapter delivered", "start")])
    s.axis([0.2, 0.4, 0.6, 0.8, 1.0, 1.2], label="time in trial (s)")
    return s.svg(f"Programmed 60 ms; delivered {d['fl32']['lag_ms']:.0f} ms at frameLen 32 and {d['fl48']['lag_ms']:.0f} ms at frameLen 48.")


def derive(d, up):
    return {"lag32": d["fl32"]["lag_ms"], "lag48": d["fl48"]["lag_ms"], "prog": d["programmed_ms"], "pct48": 100 * d["fl48"]["lag_ms"] / d["programmed_ms"],
            "pct32": 100 * d["fl32"]["lag_ms"] / d["programmed_ms"]}
