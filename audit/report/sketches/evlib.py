"""Expected-vs-observed figures (PLAN.md section 14), shared by the trial/session cards.

Two aligned panels drawn with the same tiers and the same time scale: "Expected (what the design should do)" and
"Observed (what Audapter did)". Tiers are minimal: the trial label, the input as word boxes, the perturbation per word
as a block with its size, and (only when it explains the difference) one marker row such as "offset detected".
Per-word values measured independently on the WAV files (report/measure.py) sit under the word boxes, so what you see
matches the clip labels. The only visual difference between the panels is the finding, marked by an orange band and
a one-line callout.

Layouts: wide (desktop) = trials end to end on one session axis with reset() rules; narrow (phones) = one row block per
trial on a shared trial-time axis ("wrapped" session), so nothing is squeezed. Every trial is a <g class="ev-trial">
carrying its time range and pixel box, so the page's playhead can be drawn on the right trial of the right panel.

spec = {
  "sid": "sk-ost-f1",
  "trials": [{"n": 1, "tag": "shift", "dur": 1.5,
              "words": [[a, b, "word 1"], ...],
              "exp": {"pert": [[a, b, "+125 mel"]], "vals": ["+20 %", "0 %"], "marks": [[t, "offset"]]},
              "obs": {... same keys ..., "diff": [[a, b]]}}, ...],
  "rows": {"words": "Speech", "pert": "F1 shift", "vals": "F1 heard vs spoken", "marks": "Offset detected"},
  "between": {2: "AudapterIO('init')"},   # optional extra event text before trial index (0-based), besides reset()
  "callout": "one line for the orange band", "gap": 0.35 (s drawn between trials in the wide layout)
}
"""
import html
import sketchlib as SL
E = html.escape

PANELS = (("exp", "Expected", "what the design should do"), ("obs", "Observed", "what Audapter did"))


def _layout(spec):
    """Session start time of every trial (wide layout): trials end to end with a small drawn gap for reset()."""
    t, out = 0.0, []
    for tr in spec["trials"]:
        out.append(t)
        t += tr["dur"] + spec.get("gap", 0.3)
    return out, t - spec.get("gap", 0.3)


def _text(s, x, y, text, cls="sk-in", anchor="middle"):
    s.parts.append(f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}">{E(text)}</text>')


def _block(s, xa, xb, y, h, kind, label, title):
    s.parts.append(f'<rect class="sk-{kind}" x="{xa + 0.5:.1f}" y="{y:.1f}" width="{max(xb - xa - 1, 1.5):.1f}" height="{h}" rx="2"><title>{E(title)}</title></rect>')
    if label and xb - xa > SL.CH * len(label) + 6:
        _text(s, (xa + xb) / 2, y + h / 2 + 4.5, label, "sk-in sk-in-observed" if kind == "observed" else "sk-in")


def _vals(tr, key):
    """(time, text) of the measured values: under each word, or at explicit times (vals_at)."""
    if tr[key].get("vals_at"):
        return [(t, v) for t, v in tr[key]["vals_at"] if v]
    return [((a + b) / 2, v) for (a, b, _), v in zip(tr["words"], tr[key].get("vals", [])) if v]


def _between(spec, key):
    return spec.get("between_" + key) or spec.get("between") or {}


def _panel_wide(spec, key, head, sub):
    starts, T = _layout(spec)
    s = SL.Sketch(f'{spec["sid"]}-{key}', 0, T, f'{head}: {sub}')
    rows = spec["rows"]; kind = "expected" if key == "exp" else "observed"
    y0 = s.y
    # trial labels
    yl = s._row(); s.label(yl, 16, "Trial")
    for tr, ts in zip(spec["trials"], starts):
        _text(s, s.x(ts + tr["dur"] / 2), yl + 13, f'{tr["n"]} · {tr["tag"]}', "sk-lab" if tr.get("hl") else "sk-in")
    s.y += 22
    # words
    yw = s._row() if rows.get("words") else s.y
    if rows.get("words"):
        h = 24; s.label(yw, h, rows["words"]); s.frame(yw, h)
        for tr, ts in zip(spec["trials"], starts):
            for a, b, lab in tr["words"]:
                _block(s, s.x(ts + a), s.x(ts + b), yw + 3, h - 6, "input", lab if s.x(ts + b) - s.x(ts + a) > SL.CH * len(lab) + 8 else "", f'trial {tr["n"]}: {lab} {a:.2f}-{b:.2f} s')
        s.y += h + 6
    # perturbation
    yp = s._row(); h = 24; s.label(yp, h, rows["pert"]); s.frame(yp, h)
    for tr, ts in zip(spec["trials"], starts):
        for a, b, lab in tr[key].get("pert", []):
            _block(s, s.x(ts + a), s.x(ts + b), yp + 3, h - 6, kind, lab, f'trial {tr["n"]}: {lab} from {a:.2f} to {b:.2f} s')
        if not tr[key].get("pert"):
            _text(s, s.x(ts + tr["dur"] / 2), yp + h / 2 + 4.5, tr[key].get("none", "none"), "sk-sub")
    s.y += h + 6
    # optional marker row
    ym = None
    if rows.get("marks"):
        ym = s._row(); h = 18; s.label(ym, h, rows["marks"]); s.frame(ym, h)
        for tr, ts in zip(spec["trials"], starts):
            mk = tr[key].get("marks", [])
            for t, lab in mk:
                if t is None:
                    _text(s, s.x(ts + tr["dur"] - 0.02), ym + 13, lab, "sk-note", "end")
                else:
                    x = s.x(ts + t)
                    s.parts.append(f'<path class="sk-mark" d="M{x:.1f},{ym + 3} l5,12 h-10 z"><title>trial {tr["n"]}: {E(lab)} at {t:.3f} s</title></path>')
        s.y += h + 6
    # measured values under the words
    yv = s._row(); s.label(yv, 16, rows["vals"])
    for tr, ts in zip(spec["trials"], starts):
        for t, v in _vals(tr, key):
            _text(s, s.x(ts + t), yv + 13, v, "sk-val")
    s.y += 22
    y1 = s.y
    # discrepancy bands (observed panel only) span the words and perturbation rows
    for tr, ts in zip(spec["trials"], starts):
        for a, b in tr[key].get("diff", []):
            s.band(ts + a, ts + b, yw - 2, yv + 18, "")
    # reset() rules between trials, and the trial groups for the playhead
    for i, (tr, ts) in enumerate(zip(spec["trials"], starts)):
        if i:
            xm = s.x(ts - spec.get("gap", 0.3) / 2)
            s.parts.append(f'<line class="sk-event" x1="{xm:.1f}" x2="{xm:.1f}" y1="{yw - 4}" y2="{y1 - 4}"/>')
        s.parts.append(f'<g class="ev-trial" data-trial="{tr["n"]}" data-t0="0" data-t1="{tr["dur"]:.4f}" data-x0="{s.x(ts):.1f}" '
                       f'data-x1="{s.x(ts + tr["dur"]):.1f}" data-y0="{y0}" data-y1="{y1}"></g>')
    notes = []
    if _between(spec, key):
        for i, text in _between(spec, key).items():
            notes.append((starts[int(i)] - spec.get("gap", 0.3) / 2, text, "start"))
    if notes:
        s.lane(notes)
    if key == "obs" and spec.get("callout"):      # its own lane, so it never collides with the event notes
        s.lane([(spec.get("callout_t", starts[-1]), spec["callout"], spec.get("callout_anchor", "end"))])
    off = spec.get("t_session0", 0); step = 2 if T > 10 else 1
    import math
    ticks = [k - off for k in range(math.ceil(off), math.floor(off + T) + 1) if k % step == 0]
    s.axis(ticks, "{:g}", label="time in the session (s), trials drawn end to end; dashed rules = reset()",
           tickfmt=lambda t: f"{t + off:g}")
    return s.svg(_desc(spec, key, head, sub))


def _panel_narrow(spec, key, head, sub):
    T = max(tr["dur"] for tr in spec["trials"])
    s = SL.Sketch(f'{spec["sid"]}-{key}', 0, T, f'{head}: {sub}')
    kind = "expected" if key == "exp" else "observed"
    for i, tr in enumerate(spec["trials"]):
        y0 = s.y
        extra = _between(spec, key).get(i) or _between(spec, key).get(str(i))
        _text(s, SL.X0, s.y + 15, f'Trial {tr["n"]} · {tr["tag"]}' + (f'  (after {extra})' if extra else ("  (after reset())" if i else "")), "sk-lab", "start")
        s.y += 22
        yw = s.y; hw = 20; s.frame(yw, hw + 20)
        for a, b, lab in (tr["words"] if spec["rows"].get("words") else []):
            _block(s, s.x(a), s.x(b), yw + 2, hw - 4, "input", lab if s.x(b) - s.x(a) > SL.CH * len(lab) + 8 else "", f'{lab} {a:.2f}-{b:.2f} s')
        for a, b, lab in tr[key].get("pert", []):
            _block(s, s.x(a), s.x(b), yw + hw, 18, kind, lab, f'{lab} from {a:.2f} to {b:.2f} s')
        if not tr[key].get("pert"):
            _text(s, s.x(T / 2), yw + hw + 14, tr[key].get("none", "none"), "sk-sub")
        for t, lab in tr[key].get("marks", []):
            if t is None:
                _text(s, SL.X1 - 4, yw + 15, lab, "sk-note", "end")
            else:
                x = s.x(t)
                s.parts.append(f'<path class="sk-mark" d="M{x:.1f},{yw + 2} l5,12 h-10 z"><title>{E(lab)} at {t:.3f} s</title></path>')
        s.y = yw + hw + 20 + 4
        for t, v in _vals(tr, key):
            _text(s, s.x(t), s.y + 14, v, "sk-val")
        s.y += 22
        for a, b in tr[key].get("diff", []):
            s.band(a, b, yw - 2, s.y - 4, "")
        s.parts.append(f'<g class="ev-trial" data-trial="{tr["n"]}" data-t0="0" data-t1="{tr["dur"]:.4f}" data-x0="{s.x(0):.1f}" '
                       f'data-x1="{s.x(tr["dur"]):.1f}" data-y0="{y0}" data-y1="{s.y}"></g>')
        s.y += 6
    if key == "obs" and spec.get("callout"):
        s.lane([(0, spec["callout"], "start")])
    s.axis([x / 2 for x in range(0, int(T * 2) + 1)], "{:g}", label="time in each trial (s)")
    return s.svg(_desc(spec, key, head, sub))


def _desc(spec, key, head, sub):
    parts = []
    for tr in spec["trials"]:
        p = "; ".join(f'{lab} {a:.2f}-{b:.2f} s' for a, b, lab in tr[key].get("pert", [])) or tr[key].get("none", "none")
        v = ", ".join(x for x in tr[key].get("vals", []) if x)
        parts.append(f'trial {tr["n"]} ({tr["tag"]}): {spec["rows"]["pert"]} {p}' + (f'; {spec["rows"]["vals"]} {v}' if v else ""))
    return f'{head} ({sub}). ' + ". ".join(parts) + "."


def render(spec):
    """HTML for both panels in the current layout (sketchlib.LAYOUT)."""
    out = []
    for key, head, sub in PANELS:
        sub = spec.get("heads", {}).get(key, sub)
        svg = _panel_narrow(spec, key, head, sub) if SL.NARROW else _panel_wide(spec, key, head, sub)
        out.append(f'<div class="ev-panel ev-{key}"><p class="ev-head"><span class="ev-h">{head}</span> {E(sub)}</p>{svg}</div>')
    return "".join(out)
