"""Shared sketch primitives: TextGrid-style tiers on one time axis (see PLAN.md, visual language)."""
import html
E = html.escape

# ----------------------------------------------------------------------------------------------- sketches
# One visual language for every finding (see PLAN.md, "Visual language"):
#   tiers stacked on one shared time axis, Praat-TextGrid style; label column on the left.
#   input  = grey area            expected = hollow outlined interval / thin ink line
#   observed = solid blue          discrepancy = orange band spanning the deviation, labelled in ink
# Two layouts, rendered side by side and switched by CSS: "wide" (label column on the left) for desktop and
# "narrow" (labels above each row, larger type in user units) for phones. build.py sets SKETCH_LAYOUT and reloads.
import os
LAYOUT = os.environ.get("SKETCH_LAYOUT", "wide")
NARROW = LAYOUT == "narrow"
if NARROW:
    W, LX, X0, X1, CH, LH = 480, 8, 8, 472, 9.0, 20      # CH: approx. width of one character of in-figure text (user units)
else:
    W, LX, X0, X1, CH, LH = 960, 176, 186, 944, 7.0, 0   # LH: extra height reserved for a label above a row

def wrap(text, maxw):
    """Split text into lines of at most maxw user units (approximate)."""
    words, lines, cur = str(text).split(), [], ""
    n = max(8, int(maxw / CH))
    for w_ in words:
        if cur and len(cur) + 1 + len(w_) > n:
            lines.append(cur); cur = w_
        else:
            cur = (cur + " " + w_).strip()
    if cur: lines.append(cur)
    return lines or [""]

class Sketch:
    def __init__(self, sid, t0, t1, title):
        self.sid, self.t0, self.t1, self.title = sid, t0, t1, title
        self.y = 8; self.parts = []; self.bands = []; self.desc = []; self.pending = []

    def x(self, t):
        return X0 + (t - self.t0) / (self.t1 - self.t0) * (X1 - X0)

    def _flush(self):
        """Band annotations are collected and drawn in their own lane below the rows they mark."""
        if self.pending:
            p, self.pending = self.pending, []
            self.lane(p)

    def _row(self):
        """Reserve space for a label above the row in the narrow layout; return the row's top y."""
        self._flush()
        self.y += LH
        return self.y

    def note(self, x, y, text, anchor="start", cls="sk-note"):
        """Annotation text, wrapped and kept inside the plot area."""
        if anchor == "start":
            maxw = X1 - x
            if maxw < 160: x, maxw = max(X0, X1 - 160), 160
        elif anchor == "end":
            maxw = x - X0
            if maxw < 160: x, maxw = min(X1, X0 + 160), 160
        else:
            maxw = 2 * min(x - X0, X1 - x)
            if maxw < 200: x, anchor, maxw = max(X0, min(x - 100, X1 - 200)), "start", 200
        lines = wrap(text, maxw)
        ts = "".join(f'<tspan x="{x:.1f}" dy="{0 if i == 0 else 1.15:.2f}em">{E(l)}</tspan>' for i, l in enumerate(lines))
        self.parts.append(f'<text class="{cls}" x="{x:.1f}" y="{y}" text-anchor="{anchor}">{ts}</text>')
        return len(lines)

    def lane(self, items):
        """A row of annotations on their own vertical space (never over data). items: (t, text, anchor).
        'start' notes wrap before the next note to their right; 'end' notes wrap after the previous one."""
        y = self.y + 14 + (4 if NARROW else 0)
        n = 1
        xs = sorted(self.x(t) for t, _, _ in items)
        for t, text, anchor in items:
            x = self.x(t)
            right = min([v for v in xs if v > x + 1] + [X1]) - 8
            left = max([v for v in xs if v < x - 1] + [X0]) + 8
            if anchor == "start":
                lines = wrap(text, max(right - x - 4, 110)); xx = min(x + 4, X1 - 110)
            elif anchor == "end":
                lines = wrap(text, max(x - 4 - left, 110)); xx = max(x - 4, X0 + 110)
            else:
                lines = wrap(text, 200); xx = x
            ts = "".join(f'<tspan x="{xx:.1f}" dy="{0 if i == 0 else 1.15:.2f}em">{E(l)}</tspan>' for i, l in enumerate(lines))
            self.parts.append(f'<text class="sk-note" x="{xx:.1f}" y="{y}" text-anchor="{anchor}">{ts}</text>')
            n = max(n, len(lines))
        self.y += 8 + n * (18 if NARROW else 16)

    def label(self, y, h, text, sub=None):
        if NARROW:
            t = E(text) + (f' <tspan class="sk-sub">({E(sub)})</tspan>' if sub else "")
            self.parts.append(f'<text class="sk-lab" x="{X0}" y="{y - 5}">{t}</text>')
            return
        if sub:
            self.parts.append(f'<text class="sk-lab" x="{LX}" y="{y + h/2 - 2:.1f}" text-anchor="end">{E(text)}</text>'
                              f'<text class="sk-sub" x="{LX}" y="{y + h/2 + 11:.1f}" text-anchor="end">{E(sub)}</text>')
        else:
            self.parts.append(f'<text class="sk-lab" x="{LX}" y="{y + h/2 + 4:.1f}" text-anchor="end">{E(text)}</text>')

    def frame(self, y, h):
        self.parts.append(f'<rect class="sk-frame" x="{X0}" y="{y}" width="{X1-X0}" height="{h}"/>')

    def envelope(self, text, t, v, lo, hi, h=38, cls="sk-input", sub=None, marks=()):
        y = self._row() if text or sub else self.y; self.label(y, h, text, sub); self.frame(y, h)
        top = 16 if marks else 4
        pts = [(self.x(tt), y + h - (min(max(vv, lo), hi) - lo) / (hi - lo) * (h - top))
               for tt, vv in zip(t, v) if self.t0 <= tt <= self.t1 and vv is not None]
        if pts:
            d = f"M{pts[0][0]:.1f},{y+h} " + " ".join(f"L{px:.1f},{py:.1f}" for px, py in pts) + f" L{pts[-1][0]:.1f},{y+h} Z"
            self.parts.append(f'<path class="{cls}" d="{d}"><title>{E(text)}</title></path>')
        for (tm, s) in marks:
            self.parts.append(f'<text class="sk-in" x="{self.x(tm):.1f}" y="{y+12}" text-anchor="start">{E(s)}</text>')
        self.y += h + 8; return y

    def intervals(self, text, ivs, h=30, sub=None):
        """ivs: (a, b, label, kind) with kind in expected|observed|context|none."""
        y = self._row() if text or sub else self.y; self.label(y, h, text, sub); self.frame(y, h)
        for a, b, s, kind in ivs:
            xa, xb = self.x(max(a, self.t0)), self.x(min(b, self.t1))
            if kind != "none":
                self.parts.append(f'<rect class="sk-{kind}" x="{xa+1:.1f}" y="{y+3}" width="{max(xb-xa-2,1):.1f}" height="{h-6}" rx="2">'
                                  f'<title>{E(text)}: {E(s)} from {a:.3f} to {b:.3f} s</title></rect>')
            if s and xb - xa > CH * len(s) + 8:
                self.parts.append(f'<text class="sk-in sk-in-{kind}" x="{(xa+xb)/2:.1f}" y="{y+h/2+4:.1f}" text-anchor="middle">{E(s)}</text>')
        for a, b, s, kind in ivs:  # TextGrid-style boundaries
            for tb in (a, b):
                if self.t0 < tb < self.t1:
                    self.parts.append(f'<line class="sk-bound" x1="{self.x(tb):.1f}" x2="{self.x(tb):.1f}" y1="{y}" y2="{y+h}"/>')
        self.y += h + 8; return y

    def lines(self, text, series, lo, hi, grid, unit, h=90, sub=None):
        """series: (t, v, kind) with kind expected|observed."""
        y = self._row() if text or sub else self.y; self.label(y, 18, text, sub); self.frame(y, h)
        sy = lambda v: y + h - 4 - (min(max(v, lo), hi) - lo) / (hi - lo) * (h - 8)
        for g in grid:
            g, lab = g if isinstance(g, tuple) else (g, f"{g:g}{unit}")
            self.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{sy(g):.1f}" y2="{sy(g):.1f}"/>'
                              f'<text class="sk-tick" x="{X0+4}" y="{sy(g)-3:.1f}">{lab}</text>')
        for t, v, kind in series:
            segs, cur = [], []
            for tt, vv in zip(t, v):
                if vv is None or not (self.t0 <= tt <= self.t1):
                    if cur: segs.append(cur); cur = []
                else:
                    cur.append((self.x(tt), sy(vv)))
            if cur: segs.append(cur)
            for sg in segs:
                d = "M" + " L".join(f"{px:.1f},{py:.1f}" for px, py in sg)
                self.parts.append(f'<path class="sk-line-{kind}" d="{d}"/>')
        self.y += h + 8; return y, sy

    def band(self, a, b, y0, y1, text, anchor="middle", ty=None):
        xa, xb = self.x(a), self.x(b)
        self.bands.append(f'<rect class="sk-disc" x="{xa:.1f}" y="{y0}" width="{xb-xa:.1f}" height="{y1-y0}"><title>{E(text)}</title></rect>')
        tx = {"middle": (xa + xb) / 2, "start": xa + 4, "end": xb - 4}[anchor]
        if text:
            self.pending.append((b if anchor == "end" else a, text, "end" if anchor == "end" else "start"))

    def guide(self, t, y0, y1, text=None, dashed=False):
        self.parts.append(f'<line class="sk-guide{" sk-dash" if dashed else ""}" x1="{self.x(t):.1f}" x2="{self.x(t):.1f}" y1="{y0}" y2="{y1}"/>')
        if text:
            self.note(self.x(t) + 4, y0 + 12, text)

    def gap(self, n=10):
        self.y += n

    def header(self, text):
        """A group header with a rule above it: separates trials or sessions drawn one below another."""
        self._flush()
        self.y += 10
        x0 = X0 if NARROW else 0
        self.parts.append(f'<line class="sk-sep" x1="{x0}" x2="{X1}" y1="{self.y}" y2="{self.y}"/>')
        lines = wrap(text, (X1 - x0) * (0.85 if NARROW else 1.0))
        for i, l in enumerate(lines):
            self.y += 18
            self.parts.append(f'<text class="sk-head" x="{x0}" y="{self.y}">{E(l)}</text>')
        self.y += 10 if NARROW else 6

    def event(self, t, y0, y1, text):
        """A vertical rule marking an event between trials (e.g. reset()), labelled at the top."""
        x = self.x(t)
        self.parts.append(f'<line class="sk-event" x1="{x:.1f}" x2="{x:.1f}" y1="{y0}" y2="{y1}"/>')
        self.note(x + 4, y0 + 12, text)

    def axis(self, ticks, fmt="{:g} s", label=None, tickfmt=None):
        if label is None:
            label = "time in trial (s)" if fmt.endswith(" s") else ""
        self._flush()
        y = self.y
        self.parts.append(f'<line class="sk-axis" x1="{X0}" x2="{X1}" y1="{y}" y2="{y}"/>')
        for t in ticks:
            x = self.x(t)
            anc = "start" if x < X0 + 12 else "end" if x > X1 - 12 else "middle"
            self.parts.append(f'<line class="sk-axis" x1="{x:.1f}" x2="{x:.1f}" y1="{y}" y2="{y+4}"/>'
                              f'<text class="sk-tick" x="{x:.1f}" y="{y+16}" text-anchor="{anc}">{(tickfmt(t) if tickfmt else fmt.format(t))}</text>')
        self.y += 22
        if label:
            self.parts.append(f'<text class="sk-axlab" x="{X1}" y="{self.y + 8}" text-anchor="end">{E(label)}</text>')
            self.y += 14

    def svg(self, desc):
        self._flush()
        h = self.y + 4
        body = "".join(self.bands) + "".join(self.parts)
        sid = self.sid + ("-n" if NARROW else "")
        return (f'<svg class="sketch sk-{LAYOUT}" id="{sid}" viewBox="0 0 {W} {h}" role="img" aria-labelledby="{sid}-t {sid}-d" '
                f'data-t0="{self.t0}" data-t1="{self.t1}" data-x0="{X0}" data-x1="{X1}" data-w="{W}">'
                f'<title id="{sid}-t">{E(self.title)}</title><desc id="{sid}-d">{E(desc)}</desc>{body}'
                f'<line class="sk-playhead" x1="{X0}" x2="{X0}" y1="0" y2="{h-22}" visibility="hidden"/></svg>')


def runs(t, v, pred):
    """Contiguous runs of pred(v) -> [(t_start, t_end)] using sample times t (end = next sample time)."""
    out, start = [], None
    dt = t[1] - t[0]
    for i, vv in enumerate(v):
        on = pred(vv)
        if on and start is None: start = t[i]
        if not on and start is not None: out.append((start, t[i])); start = None
    if start is not None: out.append((start, t[-1] + dt))
    return out

def state_ivs(t, st, kind, t_end):
    out, cur, a = [], st[0], t[0]
    for tt, s in zip(t, st):
        if s != cur:
            out.append((a, tt, f"state {cur}", kind)); cur, a = s, tt
    out.append((a, t_end, f"state {cur}", kind))
    return out

def db(v, floor=-60):
    import math
    return [None if x is None else (20 * math.log10(x) if x > 0 else floor) for x in v]



def rows2(g):
    """Octave's jsonencode flattens a 1x2 matrix to [a, b]; normalise to [[a, b], ...]."""
    if not g: return []
    return [g] if not isinstance(g[0], list) else g
