"""Formant shifts change the output level (report_loudcues.m): per perturbation, the level of the shifted output re the unshifted
output of the same input over the perturbed span, one dot per voice; solid = bGainAdapt 0 (as blab runs), hollow = 1."""
import html, math, statistics as st
import sketchlib as SL
E = html.escape
PERTS = ["F1 +125 mel", "F1 -125 mel", "F1 +20 %", "F1 -20 %", "2-D centralization, strength 0.5"]


def rows(d):
    R = d["rows"] if isinstance(d["rows"], list) else [d["rows"]]
    return [r for r in R if r["level_db"] is not None and r["level_db"] == r["level_db"]]


def sketch(d, up):
    R = rows(d); W = 480 if SL.NARROW else 960; X0 = 8 if SL.NARROW else 250; X1 = W - (16 if SL.NARROW else 150)
    lo, hi = -12, 10; x = lambda v: X0 + (min(max(v, lo), hi) - lo) / (hi - lo) * (X1 - X0)
    out, y = [], 8
    out.append(f'<rect class="sk-jnd" x="{x(-1):.1f}" y="{y}" width="{x(1) - x(-1):.1f}" height="{len(PERTS) * (64 if SL.NARROW else 44)}"/>')
    for p in PERTS:
        g0 = [r["level_db"] for r in R if r["pert"] == p and r["gainadapt"] == 0]; g1 = [r["level_db"] for r in R if r["pert"] == p and r["gainadapt"] == 1]
        if SL.NARROW:
            out.append(f'<text class="sk-lab" x="{X0}" y="{y + 14}">{E(p.replace(" -", " −"))}</text>'); y += 20
        else:
            out.append(f'<text class="sk-lab" x="{X0 - 10}" y="{y + 22}" text-anchor="end">{E(p.replace(" -", " −"))}</text>')
        for v in g1:
            out.append(f'<circle class="sk-dot-g1" cx="{x(v):.1f}" cy="{y + 12}" r="4.5"><title>bGainAdapt 1: {v:+.1f} dB</title></circle>')
        for v in g0:
            out.append(f'<circle class="sk-dot-g0" cx="{x(v):.1f}" cy="{y + 28}" r="4.5"><title>bGainAdapt 0: {v:+.1f} dB</title></circle>')
        if g0:
            if SL.NARROW:
                out.append(f'<text class="sk-val" x="{X1}" y="{y - 6}" text-anchor="end">{min(g0):+.1f} to {max(g0):+.1f} dB</text>')
            else:
                out.append(f'<text class="sk-val" x="{W - 4}" y="{y + 32}" text-anchor="end">{min(g0):+.1f} to {max(g0):+.1f} dB</text>')
        y += 40 if not SL.NARROW else 44
    out.append(f'<line class="sk-axis" x1="{x(0):.1f}" x2="{x(0):.1f}" y1="4" y2="{y}"/>')
    for t in (-12, -8, -4, 0, 4, 8):
        out.append(f'<text class="sk-tick" x="{x(t):.1f}" y="{y + 16}" text-anchor="middle">{t:+d}</text>')
    out.append(f'<text class="sk-axlab" x="{X1}" y="{y + 32}" text-anchor="end">level of the shifted output re unshifted, dB (grey band: ±1 dB)</text>')
    y += 38
    out.append(f'<circle class="sk-dot-g0" cx="{X0 + 6}" cy="{y + 6}" r="4.5"/><text class="sk-in" x="{X0 + 16}" y="{y + 10}">bGainAdapt 0 (as blab runs)</text>'
               f'<circle class="sk-dot-g1" cx="{X0 + (200 if not SL.NARROW else 6)}" cy="{y + 6 + (0 if not SL.NARROW else 18)}" r="4.5"/>'
               f'<text class="sk-in" x="{X0 + (210 if not SL.NARROW else 16)}" y="{y + 10 + (0 if not SL.NARROW else 18)}">bGainAdapt 1 (C++ default)</text>')
    y += 20 + (18 if SL.NARROW else 0)
    sfx = "-n" if SL.NARROW else ""
    return (f'<svg class="sketch sk-{SL.LAYOUT}" id="sk-fmt-level{sfx}" viewBox="0 0 {W} {y}" role="img" aria-label="Level change caused by '
            f'formant shifts on eight real voices, with gain adaptation off and on">{"".join(out)}</svg>')


def derive(d, up):
    R = rows(d); v = {}
    for p, key in zip(PERTS, ("up125", "dn125", "up20", "dn20", "c2d")):
        for g in (0, 1):
            L = [r["level_db"] for r in R if r["pert"] == p and r["gainadapt"] == g]
            if L:
                v[f"{key}_g{g}_min"], v[f"{key}_g{g}_max"], v[f"{key}_g{g}_med"] = min(L), max(L), st.median(L)
    v["n_voices"] = len({r["clip"] for r in R}); G = d["gainstate"]; v["gs_n"] = G["n_diff"]
    ex = [r for r in R if r["clip"] == "arctic_bdl_a0005" and r["gainadapt"] == 0]
    for r in ex:
        v["bdl_" + {"F1 +125 mel": "up125", "F1 -125 mel": "dn125", "F1 +20 %": "up20", "F1 -20 %": "dn20"}.get(r["pert"], "c2d")] = r["level_db"]
    return v
