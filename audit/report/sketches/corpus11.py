from sketchlib import *
import math


def sketch(d, up):
    r, m = d["ratio"], d["mel"]; t = r["t"]; T = t[-1]
    lg = lambda v: [None if (x or 0) <= 0 else math.log10(x) for x in v]
    s = Sketch("sk-corpus-11", 0, T, "Shifted F1 target in ratio mode (today's MATLAB default) and in mel mode (as in 2008)")
    y, sy = s.lines("F1 (log scale)", [(t, lg(m["F1"]), "expected"), (m["t"], lg(m["sF1"]), "expected"), (t, lg(r["sF1"]), "observed")],
                    2, 5.3, [(math.log10(300), "300 Hz"), (3, "1 kHz"), (4, "10 kHz"), (5, "100 kHz")], "", h=180, sub="thin: tracked and mel")
    ny = math.log10(d["sr"] / 2)
    s.parts.append(f'<line class="sk-guide" x1="{s.x(0):.1f}" x2="{s.x(T):.1f}" y1="{sy(ny):.1f}" y2="{sy(ny):.1f}"/>'
                   f'<text class="sk-note" x="{s.x(T)-4:.1f}" y="{sy(ny)-5:.1f}" text-anchor="end">Nyquist, {d["sr"]/2000:g} kHz: no formant can exist above this line</text>')
    s.parts.append(f'<text class="sk-note" x="{s.x(0.12*T):.1f}" y="{sy(4.5):.1f}">ratio mode: F1 × {r["ratio_F1"]:.0f}, targets up to {r["max_sF1_hz"]/1000:.0f} kHz</text>')
    s.axis([round(x, 1) for x in [0, 0.5, 1.0, 1.5, 2.0, 2.5] if x <= T], "{:g} s")
    return s.svg("With the 2008 parameters under today's ratio default, the shifted F1 target is about 100 times the tracked F1, far above the Nyquist "
                 "frequency; under mel mode it is about 1.2 times, as the 2008 session logged.")


def derive(d, up):
    return {"mel_r": d["mel"]["ratio_F1"], "ratio_r": d["ratio"]["ratio_F1"], "ratio_max": d["ratio"]["max_sF1_hz"], "online_r": d["online_ratio_F1"],
            "ratio_gain": d["ratio"]["gain_db"], "ratio_peak": d["ratio"]["peak"], "nyq": d["sr"] / 2}
