"""Shared sketch primitives: TextGrid-style tiers on one time axis (see PLAN.md, visual language)."""
import html
E = html.escape

# ----------------------------------------------------------------------------------------------- sketches
# One visual language for every finding (see PLAN.md, "Visual language"):
#   tiers stacked on one shared time axis, Praat-TextGrid style; label column on the left.
#   input  = grey area            expected = hollow outlined interval / thin ink line
#   observed = solid blue          discrepancy = orange band spanning the deviation, labelled in ink
W, LX, X0, X1 = 960, 176, 186, 944

class Sketch:
    def __init__(self, sid, t0, t1, title):
        self.sid, self.t0, self.t1, self.title = sid, t0, t1, title
        self.y = 8; self.parts = []; self.bands = []; self.desc = []

    def x(self, t):
        return X0 + (t - self.t0) / (self.t1 - self.t0) * (X1 - X0)

    def label(self, y, h, text, sub=None):
        if sub:
            self.parts.append(f'<text class="sk-lab" x="{LX}" y="{y + h/2 - 2:.1f}" text-anchor="end">{E(text)}</text>'
                              f'<text class="sk-sub" x="{LX}" y="{y + h/2 + 11:.1f}" text-anchor="end">{E(sub)}</text>')
        else:
            self.parts.append(f'<text class="sk-lab" x="{LX}" y="{y + h/2 + 4:.1f}" text-anchor="end">{E(text)}</text>')

    def frame(self, y, h):
        self.parts.append(f'<rect class="sk-frame" x="{X0}" y="{y}" width="{X1-X0}" height="{h}"/>')

    def envelope(self, text, t, v, lo, hi, h=38, cls="sk-input", sub=None, marks=()):
        y = self.y; self.label(y, h, text, sub); self.frame(y, h)
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
        y = self.y; self.label(y, h, text, sub); self.frame(y, h)
        for a, b, s, kind in ivs:
            xa, xb = self.x(max(a, self.t0)), self.x(min(b, self.t1))
            if kind != "none":
                self.parts.append(f'<rect class="sk-{kind}" x="{xa+1:.1f}" y="{y+3}" width="{max(xb-xa-2,1):.1f}" height="{h-6}" rx="2">'
                                  f'<title>{E(text)}: {E(s)} from {a:.3f} to {b:.3f} s</title></rect>')
            if s and xb - xa > 8 * len(s) + 8:
                self.parts.append(f'<text class="sk-in sk-in-{kind}" x="{(xa+xb)/2:.1f}" y="{y+h/2+4:.1f}" text-anchor="middle">{E(s)}</text>')
        for a, b, s, kind in ivs:  # TextGrid-style boundaries
            for tb in (a, b):
                if self.t0 < tb < self.t1:
                    self.parts.append(f'<line class="sk-bound" x1="{self.x(tb):.1f}" x2="{self.x(tb):.1f}" y1="{y}" y2="{y+h}"/>')
        self.y += h + 8; return y

    def lines(self, text, series, lo, hi, grid, unit, h=90, sub=None):
        """series: (t, v, kind) with kind expected|observed."""
        y = self.y; self.label(y, 18, text, sub); self.frame(y, h)
        sy = lambda v: y + h - 4 - (min(max(v, lo), hi) - lo) / (hi - lo) * (h - 8)
        for g in grid:
            self.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{sy(g):.1f}" y2="{sy(g):.1f}"/>'
                              f'<text class="sk-tick" x="{X0+4}" y="{sy(g)-3:.1f}">{g:g}{unit}</text>')
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
        ty = ty if ty is not None else y0 - 4
        self.parts.append(f'<text class="sk-note" x="{tx:.1f}" y="{ty}" text-anchor="{anchor}">{E(text)}</text>')

    def guide(self, t, y0, y1, text=None):
        self.parts.append(f'<line class="sk-guide" x1="{self.x(t):.1f}" x2="{self.x(t):.1f}" y1="{y0}" y2="{y1}"/>')
        if text:
            self.parts.append(f'<text class="sk-note" x="{self.x(t)+4:.1f}" y="{y0+10}">{E(text)}</text>')

    def gap(self, n=10):
        self.y += n

    def axis(self, ticks, fmt="{:g} s"):
        y = self.y
        self.parts.append(f'<line class="sk-axis" x1="{X0}" x2="{X1}" y1="{y}" y2="{y}"/>')
        for t in ticks:
            self.parts.append(f'<line class="sk-axis" x1="{self.x(t):.1f}" x2="{self.x(t):.1f}" y1="{y}" y2="{y+4}"/>'
                              f'<text class="sk-tick" x="{self.x(t):.1f}" y="{y+16}" text-anchor="middle">{fmt.format(t)}</text>')
        self.y += 22

    def svg(self, desc):
        h = self.y + 4
        body = "".join(self.bands) + "".join(self.parts)
        return (f'<svg class="sketch" id="{self.sid}" viewBox="0 0 {W} {h}" role="img" aria-labelledby="{self.sid}-t {self.sid}-d" '
                f'data-t0="{self.t0}" data-t1="{self.t1}" data-x0="{X0}" data-x1="{X1}" data-w="{W}">'
                f'<title id="{self.sid}-t">{E(self.title)}</title><desc id="{self.sid}-d">{E(desc)}</desc>{body}'
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
