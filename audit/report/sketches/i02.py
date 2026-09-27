from sketchlib import *


def _runs(t, v):
    """Contiguous runs of non-None values -> [(i0, i1)] (inclusive indices)."""
    out, a = [], None
    for i, x in enumerate(v):
        if x is not None and a is None: a = i
        if x is None and a is not None: out.append((a, i - 1)); a = None
    if a is not None: out.append((a, len(v) - 1))
    return out


def sketch(d, up):
    dt = d["env_dt"]; n = len(d["env_in"]); t = [i * dt + dt / 2 for i in range(n)]
    ds, clg = d["dScale"], d["closedLoopGain_db"]
    s = Sketch("sk-i-02", 0, n * dt, "fb 5: level of the speech-modulated component relative to the playback component, at two closedLoopGain settings")
    s.envelope("Input", t, d["env_in"], -60, -5, h=30, sub="three vowels")
    lo, hi = -12, 12
    # drop the first 3 blocks (60 ms) of each vowel: rms_fb is still rising there and the ratio is tens of dB below the plot
    keep = [False] * n
    for a, b in _runs(t, d["ratio_ref"]):
        for i in range(a + 3, b + 1): keep[i] = True
    msk = lambda v: [x if k else None for x, k in zip(v, keep)]
    for tag, i, lab in (("A", 1, "−"), ("B", 2, "+")):
        ref, obs = msk(d["ratio_ref"]), msk(d["ratio_" + tag])
        y, sy = s.lines(f"Mix at {clg[i-1]} dB", [(t, ref, "expected"), (t, obs, "observed")], lo, hi, [-6, 0, 6], " dB", h=96,
                        sub=f"dScale {ds[i]:.3f}")
        shift = d[f"shift_{tag}_db"]
        for k, (a, b) in enumerate(_runs(t, ref)):
            me = sum(ref[a:b+1]) / (b - a + 1); mo = sum(obs[a:b+1]) / (b - a + 1)
            s.band(t[a] - dt / 2, t[b] + dt / 2, min(sy(me), sy(mo)), max(sy(me), sy(mo)),
                   f"{shift:+.1f} dB" if k == 0 else "", anchor="start", ty=y + 14)
    s.parts.append(f'<text class="sk-note" x="{s.x(n*dt) - 6:.1f}" y="{s.y - 8}" text-anchor="end">'
                   f'thin line: the same run at dScale 1, where once or twice is the same</text>')
    s.axis([0, 1, 2, 3, 4])
    main = s.svg(f"With the same input and parameters, the speech-modulated component sits {d['shift_A_db']:+.1f} dB off the intended mix at "
                 f"closedLoopGain {clg[0]} dB and {d['shift_B_db']:+.1f} dB off at {clg[1]} dB: the mix moves by {d['shift_AB_db']:.1f} dB.")
    # level change of each component when closedLoopGain goes 15 -> 21 dB
    Wd, L, R, Tp = 960, 186, 944, 30
    sx = lambda v: L + v / 20 * (R - L)
    rows = [("Playback", d["play_step_db"]), ("Speech-modulated", d["speech_step_db"])]
    exp = d["clg_step_db"]
    parts = [f'<text class="sk-lab" x="{LX}" y="{Tp - 12}" text-anchor="end">Level change</text>',
             f'<text class="sk-sub" x="{LX}" y="{Tp + 2}" text-anchor="end">closedLoopGain {clg[0]} → {clg[1]} dB</text>',
             f'<text class="sk-note" x="{R}" y="{Tp - 12}" text-anchor="end">mix: speech-modulated re playback, dB, 20 ms blocks during the vowels</text>']
    for g in (0, 4, 8, 12, 16, 20):
        parts.append(f'<line class="sk-grid" x1="{sx(g):.1f}" x2="{sx(g):.1f}" y1="{Tp + 6}" y2="{Tp + 6 + 2 * 34}"/>'
                     f'<text class="sk-tick" x="{sx(g):.1f}" y="{Tp + 6 + 2 * 34 + 14}" text-anchor="middle">{g:+d} dB</text>')
    bands = []
    for k, (name, v) in enumerate(rows):
        y = Tp + 6 + k * 34
        parts.append(f'<text class="sk-lab" x="{LX}" y="{y + 21}" text-anchor="end">{E(name)}</text>')
        if abs(v - exp) > 0.05:
            bands.append(f'<rect class="sk-disc" x="{sx(exp):.1f}" y="{y + 3}" width="{sx(v) - sx(exp):.1f}" height="26"><title>{v - exp:+.1f} dB more than everything else</title></rect>')
            parts.append(f'<text class="sk-note" x="{sx(v) + 8:.1f}" y="{y + 21}">{v:+.1f} dB: twice the change in dScale</text>')
        else:
            parts.append(f'<text class="sk-note" x="{sx(v) + 8:.1f}" y="{y + 21}">{v:+.1f} dB, as dScale</text>')
        parts.append(f'<rect class="sk-observed" x="{sx(0):.1f}" y="{y + 9}" width="{sx(v) - sx(0):.1f}" height="14" rx="2"><title>{E(name)}: {v:+.2f} dB</title></rect>'
                     f'<line class="sk-line-expected" x1="{sx(exp):.1f}" x2="{sx(exp):.1f}" y1="{y + 3}" y2="{y + 29}"/>')
    Hd = Tp + 6 + 2 * 34 + 22
    bar = (f'<svg class="sketch" id="sk-i-02-step" viewBox="0 0 {Wd} {Hd}" role="img" aria-labelledby="sk-i-02-step-t">'
           f'<title id="sk-i-02-step-t">Raising closedLoopGain by {exp} dB raises the playback component by {rows[0][1]:.1f} dB and the '
           f'speech-modulated component by {rows[1][1]:.1f} dB (thin line: the {exp} dB every other part of the output moves)</title>{"".join(bands)}{"".join(parts)}</svg>')
    return main + bar


def derive(d, up):
    return {"dsA": d["dScale"][1], "dsB": d["dScale"][2], "clgA": d["closedLoopGain_db"][0], "clgB": d["closedLoopGain_db"][1]}


def derive_real(rd):
    c = rd["dScale_conditions"]; ref = c[0]["speech_minus_playback_db"]
    return {"d_lo": c[1]["speech_minus_playback_db"] - ref, "d_hi": c[2]["speech_minus_playback_db"] - ref,
            "ds_lo": c[1]["dScale"], "ds_hi": c[2]["dScale"]}
