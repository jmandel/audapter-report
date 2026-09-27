"""Lab-script cards (EXP-4): expected vs observed vowel-space shifts in an F1-F2 diagram (PLAN.md section 14, adapted).

Axes follow the phonetic convention: F2 decreasing to the right, F1 increasing downward, in Hz. Grey dots are the produced
vowels (the lab's default corner vowels plus /I/ and /E/), + is the vowel-space centre of calc_pertField. Expected panel:
the shift the design intends (hollow ink arrows, produced -> intended heard vowel). Observed panel: the shift Audapter
logged with the committed wiring (solid blue arrows, produced -> heard); where it misses the intended point by more than
15 mel, an orange dashed line joins the heard point to the intended one and the tip is ringed in orange."""
import html, math
import sketchlib as SL
E = html.escape
IPA = {"iy": "i", "ae": "æ", "aa": "ɑ", "uw": "u", "ih": "ɪ", "eh": "ɛ"}
F2R, F1R = (3000, 800), (280, 820)
hz2mel = lambda f: 1127.01048 * math.log(1 + f / 700)


def real_rows(d, key, tag):
    """The real PVQD vowels as rows in the same format as the synthetic ones (mel fields derived from Hz)."""
    out = []
    for nm, vk in (("i", "iy"), ("a", "aa")):
        e = dict(d["real"][key][tag][nm]); e["vowel"] = vk
        for f in ("prod", "heard", "intended"):
            e[f + "_mel"] = [hz2mel(x) for x in e[f + "_hz"]]
        out.append(e)
    return out


def toward(e, cen):
    p, h = e["prod_mel"], e["heard_mel"]; c = [cen[0] - p[0], cen[1] - p[1]]; g = [h[0] - p[0], h[1] - p[1]]
    n = c[0] ** 2 + c[1] ** 2
    return (g[0] * c[0] + g[1] * c[1]) / n if n else 0.0


def miss_mel(e):
    return math.hypot(e["heard_mel"][0] - e["intended_mel"][0], e["heard_mel"][1] - e["intended_mel"][1])


def _panel(x0, y0, w, h, rows, cen_hz, kind, title, note=None, mid=""):
    sx = lambda f2: x0 + 36 + (F2R[0] - f2) / (F2R[0] - F2R[1]) * (w - 48)
    sy = lambda f1: y0 + 26 + (f1 - F1R[0]) / (F1R[1] - F1R[0]) * (h - 60)
    out = [f'<text class="sk-lab" x="{x0}" y="{y0 + 14}">{E(title)}</text>',
           f'<rect class="sk-frame" x="{x0 + 36}" y="{y0 + 26}" width="{w - 48}" height="{h - 60}"/>']
    for f2 in (1000, 1500, 2000, 2500):
        out.append(f'<line class="sk-grid" x1="{sx(f2):.1f}" x2="{sx(f2):.1f}" y1="{y0 + 26}" y2="{y0 + h - 34}"/>'
                   f'<text class="sk-tick" x="{sx(f2):.1f}" y="{y0 + h - 20}" text-anchor="middle">{f2}</text>')
    for f1 in (300, 500, 700):
        out.append(f'<line class="sk-grid" x1="{x0 + 36}" x2="{x0 + w - 12}" y1="{sy(f1):.1f}" y2="{sy(f1):.1f}"/>'
                   f'<text class="sk-tick" x="{x0 + 32}" y="{sy(f1) + 4:.1f}" text-anchor="end">{f1}</text>')
    out.append(f'<text class="sk-axlab" x="{x0 + w - 12}" y="{y0 + h - 6}" text-anchor="end">F2 (Hz), high to low</text>'
               f'<text class="sk-axlab" x="{x0 + 10}" y="{y0 + h / 2:.1f}" text-anchor="middle" transform="rotate(-90 {x0 + 10} {y0 + h / 2:.1f})">F1 (Hz)</text>')
    cx, cy = sx(cen_hz[1]), sy(cen_hz[0])
    out.append(f'<path class="sk-cen" d="M{cx - 6:.1f},{cy:.1f} h12 M{cx:.1f},{cy - 6:.1f} v12"><title>vowel-space centre</title></path>')
    for e in rows:
        px, py = sx(e["prod_hz"][1]), sy(e["prod_hz"][0])
        tgt = e["intended_hz"] if kind == "expected" else e["heard_hz"]
        tx, ty = sx(tgt[1]), sy(tgt[0])
        if kind == "observed" and miss_mel(e) > 15:
            ix, iy = sx(e["intended_hz"][1]), sy(e["intended_hz"][0])
            out.append(f'<line class="sk-miss" x1="{tx:.1f}" y1="{ty:.1f}" x2="{ix:.1f}" y2="{iy:.1f}"/>'
                       f'<circle class="sk-disc" cx="{tx:.1f}" cy="{ty:.1f}" r="9"/>')
        if math.hypot(tx - px, ty - py) > 3:
            cls = "sk-arrow-e" if kind == "expected" else "sk-arrow-o"
            out.append(f'<line class="{cls}" x1="{px:.1f}" y1="{py:.1f}" x2="{tx:.1f}" y2="{ty:.1f}" marker-end="url(#ah-{kind}{mid})">'
                       f'<title>/{IPA[e["vowel"]]}/: {e["prod_hz"][0]:.0f}/{e["prod_hz"][1]:.0f} Hz to {tgt[0]:.0f}/{tgt[1]:.0f} Hz</title></line>')
        out.append(f'<circle class="sk-vdot" cx="{px:.1f}" cy="{py:.1f}" r="4"/>'
                   f'<text class="sk-in" x="{px + 6:.1f}" y="{py - 6:.1f}">{IPA[e["vowel"]]}</text>')
    if note:
        out.append(f'<text class="sk-sub" x="{x0 + w - 18:.1f}" y="{y0 + 44:.1f}" text-anchor="end">{E(note)}</text>')
    return "".join(out)


def figure(sid, blocks, cen_hz, desc, callout):
    """blocks: [(heading, rows, exp_note)] ; each block = Expected and Observed panels (side by side wide, stacked narrow)."""
    narrow = SL.NARROW
    W = 480 if narrow else 960; pw, ph = (W, 330) if narrow else (470, 330)
    parts, y = [], 4
    mid = "-" + sid + ("-n" if narrow else "")
    defs = (f'<defs><marker id="ah-expected{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path class="sk-ah-e" d="M0,0 L10,5 L0,10 z"/></marker>' f'<marker id="ah-observed{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            'markerHeight="7" orient="auto-start-reverse"><path class="sk-ah-o" d="M0,0 L10,5 L0,10 z"/></marker></defs>')
    for head, rows, note in blocks:
        if head:
            for l in SL.wrap(head, W * (0.8 if narrow else 1.0)):
                parts.append(f'<text class="sk-head" x="0" y="{y + 16}">{E(l)}</text>'); y += 20
            y += 8
        if narrow:
            parts.append(_panel(0, y, pw, ph, rows, cen_hz, "expected", "Expected: what the design intends", note, mid=mid)); y += ph + 8
            parts.append(_panel(0, y, pw, ph, rows, cen_hz, "observed", "Observed: the committed wiring", mid=mid)); y += ph + 8
        else:
            parts.append(_panel(0, y, pw, ph, rows, cen_hz, "expected", "Expected: what the design intends", note, mid=mid))
            parts.append(_panel(pw + 20, y, pw, ph, rows, cen_hz, "observed", "Observed: the committed wiring", mid=mid)); y += ph + 10
    lines = SL.wrap(callout, W * (0.95 if narrow else 0.9))
    for i, l in enumerate(lines):
        parts.append(f'<text class="sk-note" x="0" y="{y + 16 + i * 18}">{E(l)}</text>')
    y += 22 + 18 * len(lines)
    sfx = "-n" if narrow else ""
    return (f'<svg class="sketch sk-{SL.LAYOUT}" id="{sid}{sfx}" viewBox="0 0 {W} {y}" role="img" aria-labelledby="{sid}{sfx}-t {sid}{sfx}-d">'
            f'<title id="{sid}{sfx}-t">{E(blocks[0][0] or "Vowel space")}</title><desc id="{sid}{sfx}-d">{E(desc)}</desc>{defs}{"".join(parts)}</svg>')


def describe(rows, kind):
    k = "intended_hz" if kind == "exp" else "heard_hz"
    return "; ".join(f'/{IPA[e["vowel"]]}/ {e["prod_hz"][0]:.0f}/{e["prod_hz"][1]:.0f} to {e[k][0]:.0f}/{e[k][1]:.0f} Hz' for e in rows)
