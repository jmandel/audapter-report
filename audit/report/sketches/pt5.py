from sketchlib import *

def sketch(d, up):
    dt = d["dt"]; n = len(d["level_step"]); t = [i * dt + dt / 2 for i in range(n)]
    lat = d["latency_s"]
    keep = [0.14 <= tt <= 1.26 for tt in t]
    msk = lambda v: [vv if k else None for vv, k in zip(v, keep)]
    s = Sketch("sk-pt-5", 0, 1.4, "Output level and F0 across a 0 to +2 semitone pitch-shift onset")
    s.envelope("Input", t, [None if not k else 0 for k in keep], -1, 1, h=18, sub="/a/, F0 120 Hz")
    on = d["ost_onset_s"]
    s.intervals("OST state", [(0, on, "state 0: 0 st", "context"), (on, 1.4, "state 1: +2 st", "context")], h=22)
    f_in = d["f0_in"]
    exp_f0 = [f_in if tt < on + lat else f_in * 2 ** (2 / 12) for tt in t]
    y1, sy1 = s.lines("F0 (Hz)", [(t, msk(exp_f0), "expected"), (t, msk(d["f0_out"]), "observed")], 110, 145, [120, 135], "", h=60)
    s.parts.append(f'<text class="sk-note" x="{s.x(0.95):.1f}" y="{sy1(135)-8:.1f}" text-anchor="middle">F0 step: {1200*__import__("math").log2(d["f0_after"]/f_in):.0f} cents, as commanded</text>')
    rel = [None if a is None or b is None else a - b for a, b in zip(d["level_step"], d["level_bypass"])]
    y2, sy2 = s.lines("Output level", [(t, msk([0.0] * n), "expected"), (t, msk(rel), "observed")],
                      -1.5, 5.5, [0, 2, 4], " dB", h=120, sub="re bPitchShift = 0")
    pre = [r for r, tt in zip(rel, t) if r is not None and 0.2 <= tt <= on - 0.02]
    post = [r for r, tt in zip(rel, t) if r is not None and on + 0.1 <= tt <= 1.2]
    mpre, mpost = sum(pre) / len(pre), sum(post) / len(post)
    s.band(0.14, on, sy2(mpre), sy2(0), f"{mpre:+.1f} dB at 0 st", anchor="start", ty=sy2(5.0))
    s.band(on, 1.26, sy2(mpost), sy2(0), f"after onset: mean {mpost:+.1f} dB, ranging {min(post):+.1f} to {max(post):+.1f}", anchor="start", ty=sy2(5.0))
    s.guide(on, y1 - 30, y2 + 120)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4])
    main = s.svg("F0 steps from 120 to %.1f Hz at %.2f s as commanded. The output level is %+.1f dB relative to the input before the step and "
                 "averages %+.1f dB after it, varying from block to block; with the phase vocoder off it is 0 dB." %
                 (d["f0_after"], on, d["gain_before_db"], d["gain_after_db"]))
    # sweep: level change at +2 st relative to 0 st, by F0, two vowels (shape + colour + direct label)
    sw = d["sweep"]; xs = sorted({r["f0"] for r in sw})
    Wd, Hd, L, R, Tp, B = 960, 190, 186, 944, 34, 170
    sx = lambda f: L + (f - 90) / (270 - 90) * (R - L)
    syy = lambda v: Tp + (0 - v) / 10 * (B - Tp)
    parts = [f'<text class="sk-lab" x="{LX}" y="{Tp+20}" text-anchor="end">Level change</text>',
             f'<text class="sk-sub" x="{LX}" y="{Tp+36}" text-anchor="end">+2 st vs 0 st,</text>',
             f'<text class="sk-sub" x="{LX}" y="{Tp+51}" text-anchor="end">constant ratio</text>',
             f'<circle class="sk-dot-a" cx="{R-90}" cy="{Tp-18}" r="5"/><text class="sk-in" x="{R-80}" y="{Tp-14}">/a/</text>',
             f'<rect class="sk-dot-i" x="{R-44.5}" y="{Tp-22.5}" width="9" height="9"/><text class="sk-in" x="{R-30}" y="{Tp-14}">/i/</text>']
    for g in (0, -2, -4, -6, -8, -10):
        parts.append(f'<line class="sk-grid" x1="{L}" x2="{R}" y1="{syy(g):.1f}" y2="{syy(g):.1f}"/><text class="sk-tick" x="{L+4}" y="{syy(g)-3:.1f}">{g} dB</text>')
    for f in xs:
        parts.append(f'<text class="sk-tick" x="{sx(f):.1f}" y="{B+18}" text-anchor="middle">{f} Hz</text>')
    parts.append(f'<text class="sk-tick" x="{(L+R)/2:.1f}" y="{B+34}" text-anchor="middle">F0 of the synthetic vowel</text>')
    for vw, cls, dx in (("a", "sk-dot-a", -5), ("i", "sk-dot-i", 5)):
        pts = sorted((r["f0"], r["gain2_db"] - r["gain0_db"]) for r in sw if r["vowel"] == vw)
        parts.append(f'<path class="{cls}-line" d="M' + " L".join(f"{sx(f)+dx:.1f},{syy(v):.1f}" for f, v in pts) + '"/>')
        for f, v in pts:
            mk = (f'<circle class="{cls}" cx="{sx(f)+dx:.1f}" cy="{syy(v):.1f}" r="5"/>' if vw == "a" else
                  f'<rect class="{cls}" x="{sx(f)+dx-4.5:.1f}" y="{syy(v)-4.5:.1f}" width="9" height="9"/>')
            parts.append(f'<g>{mk}<title>/{vw}/, F0 {f} Hz: {v:+.2f} dB</title></g>')
        f, v = pts[-1]
        parts.append(f'<text class="sk-note" x="{sx(f)+dx+10:.1f}" y="{syy(v)+4:.1f}">/{vw}/</text>')
    sweep = (f'<svg class="sketch" id="sk-pt-5-sweep" viewBox="0 0 {Wd} {B+42}" role="img" aria-labelledby="sk-pt-5-sweep-t">'
             f'<title id="sk-pt-5-sweep-t">Level change from 0 to +2 semitones by F0 and vowel</title>{"".join(parts)}</svg>')
    return main + sweep


def derive(d, up):
    import math
    steps = [r["gain2_db"] - r["gain0_db"] for r in d["sweep"]]
    return {"f0_cents": 1200 * math.log2(d["f0_after"] / d["f0_in"]), "sweep_min": -max(steps), "sweep_max": -min(steps),
            "ampnorm_text": "; ".join(f'{a["name"]}: {a["result"].replace("Audapter: ", "")}' for a in d["ampnorm"])}
