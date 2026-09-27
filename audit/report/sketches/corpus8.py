from sketchlib import *


def sketch(d, up):
    a, b = d["cfg32"], d["cfg64"]
    F = [r["f0"] for r in a["sweep"]]
    s = Sketch("sk-corpus-8", 80, 260, "Logged pitchHz against the true F0 of synthetic vowels, default and longer analysis window")
    y, sy = s.lines("Logged pitchHz", [(F, F, "expected"), ([r["f0"] for r in b["sweep"]], [r["median_hz"] for r in b["sweep"]], "expected"),
                                       (F, [r["median_hz"] for r in a["sweep"]], "observed")], 60, 260, [100, 150, 200, 250], " Hz", h=200,
                    sub="median over the vowel")
    bad = [r["f0"] for r in a["sweep"] if r["within5"] < 0.5]
    if bad:
        s.band(min(bad) - 3, max(bad) + 5, y, y + 200, f"default window: wrong below {max(bad) + 10} Hz", anchor="end", ty=y + 190)
    for r in a["sweep"]:
        s.parts.append(f'<circle class="sk-dot-a" cx="{s.x(r["f0"]):.1f}" cy="{sy(r["median_hz"]):.1f}" r="4"><title>F0 {r["f0"]} Hz: logged {r["median_hz"]:.0f} Hz, {100*r["within5"]:.0f} % of frames within 5 %</title></circle>')
    s.parts.append(f'<text class="sk-note" x="{s.x(200):.1f}" y="{sy(250):.1f}">frameLen {b["frameLen"]} / nDelay {b["nDelay"]} and the true F0 (ink lines) coincide</text>')
    s.lines("Frames within 5 %", [([r["f0"] for r in b["sweep"]], [100 * r["within5"] for r in b["sweep"]], "expected"),
                                  (F, [100 * r["within5"] for r in a["sweep"]], "observed")], 0, 105, [0, 50, 100], " %", h=90)
    s.axis([80, 100, 120, 140, 160, 180, 200, 220, 240, 260], "{:g} Hz")
    return s.svg("With the default frameLen 32 / nDelay 5 the logged pitch is right from about 140 Hz up and wrong below: 90 Hz is logged as about 229 Hz. "
                 "With frameLen 64 / nDelay 7 it follows the true F0 everywhere tested.")


def derive(d, up):
    a = {r["f0"]: r for r in d["cfg32"]["sweep"]}; b = {r["f0"]: r for r in d["cfg64"]["sweep"]}
    ok = [f for f, r in a.items() if r["within5"] >= 0.7]
    return {"w32_ms": d["cfg32"]["window_ms"], "w64_ms": d["cfg64"]["window_ms"], "ok_from": min(ok),
            "m90": a[90]["median_hz"], "m110": a[110]["median_hz"], "m130": a[130]["median_hz"],
            "p90": 100 * a[90]["within5"], "b_min": 100 * min(r["within5"] for r in b.values())}


def derive_real(d):
    a, b = d["real"]["tdsdef"], d["real"]["tdsdemo"]
    return {"r_m": a["adult_M"]["within5"], "n_m": a["adult_M"]["n"], "r_f": a["adult_F"]["within5"], "r_c": a["child"]["within5"],
            "q_m": b["adult_M"]["within5"], "q_f": b["adult_F"]["within5"]}
