"""A small horizontal dot/interval plot on the shared sketch classes: rows of labelled values on one axis."""
import html
import sketchlib as SL
E = html.escape


def plot(sid, rows, lo, hi, ticks, axlab, band=None, legend=None, desc=""):
    """rows: [(label, [(value, kind, title)], right_text)], kind in g0 (solid) | g1 (hollow) | g2 (grey) | exp (ink)."""
    W = 480 if SL.NARROW else 960; X0 = 8 if SL.NARROW else 260; X1 = W - (16 if SL.NARROW else 150)
    x = lambda v: X0 + (min(max(v, lo), hi) - lo) / (hi - lo) * (X1 - X0); out, y = [], 8
    h = len(rows) * (44 if SL.NARROW else 30)
    if band:
        out.append(f'<rect class="sk-jnd" x="{x(band[0]):.1f}" y="{y}" width="{x(band[1]) - x(band[0]):.1f}" height="{h}"/>')
    for lab, pts, right in rows:
        if SL.NARROW:
            out.append(f'<text class="sk-lab" x="{X0}" y="{y + 12}">{E(lab)}</text>')
            if right: out.append(f'<text class="sk-val" x="{X1}" y="{y + 12}" text-anchor="end">{E(right)}</text>')
            y += 16
        else:
            out.append(f'<text class="sk-lab" x="{X0 - 10}" y="{y + 16}" text-anchor="end">{E(lab)}</text>')
            if right: out.append(f'<text class="sk-val" x="{W - 4}" y="{y + 16}" text-anchor="end">{E(right)}</text>')
        for v, kind, t in pts:
            cls = {"g0": "sk-dot-g0", "g1": "sk-dot-g1", "g2": "sk-dot-g2", "exp": "sk-dot-g1"}[kind]
            out.append(f'<circle class="{cls}" cx="{x(v):.1f}" cy="{y + 11}" r="5"><title>{E(t)}</title></circle>')
        y += 28
    for t in ticks:
        out.append(f'<text class="sk-tick" x="{x(t):.1f}" y="{y + 14}" text-anchor="middle">{t:g}</text>')
    out.append(f'<line class="sk-axis" x1="{X0}" x2="{X1}" y1="{y}" y2="{y}"/>')
    out.append(f'<text class="sk-axlab" x="{X1}" y="{y + 30}" text-anchor="end">{E(axlab)}</text>'); y += 36
    if legend:
        for i, (kind, text) in enumerate(legend):
            cls = {"g0": "sk-dot-g0", "g1": "sk-dot-g1", "g2": "sk-dot-g2", "exp": "sk-dot-g1"}[kind]; yy = y + 8 + i * 18
            out.append(f'<circle class="{cls}" cx="{X0 + 6}" cy="{yy}" r="5"/><text class="sk-in" x="{X0 + 18}" y="{yy + 4}">{E(text)}</text>')
        y += 12 + 18 * len(legend)
    sfx = "-n" if SL.NARROW else ""
    return f'<svg class="sketch sk-{SL.LAYOUT}" id="{sid}{sfx}" viewBox="0 0 {W} {y}" role="img" aria-label="{E(desc)}">{"".join(out)}</svg>'
