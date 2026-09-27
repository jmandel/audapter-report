#!/usr/bin/env python3
"""Render the audit report from findings.yaml + harness exports.

  python3 build.py            # render prototype/index.html from existing exports
  python3 build.py --export   # first re-run the harness export scripts (docker), then render
  python3 build.py --single   # also write prototype/index.single.html with audio inlined as data URIs

Inputs:  findings.yaml, ../FINDINGS-LOG.md (id check), ../harness/logs-summary.txt (test results),
         ../harness/oct/out/report/<asset_dir>/<build>/{*.wav,data.json}, pinned git SHAs (code excerpts).
Outputs: prototype/index.html, prototype/assets/<asset_dir>/..., prototype/build-manifest.json
"""
import base64, html, json, os, re, shutil, subprocess, sys
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.dirname(HERE)
HARNESS = os.path.join(AUDIT, "harness")
EXPORTS = os.path.join(HARNESS, "oct", "out", "report")
OUT = os.path.join(HERE, "prototype")
E = html.escape

EXPORT_CMDS = [
    ["./run-oct.sh", "report_ost_f1.m"],
    ["env", "VARIANT=upstream", "./run-oct.sh", "report_ost_f1.m", "build-upstream", "upstream/audapter_matlab"],
    ["./run-oct.sh", "report_i01.m"],
    ["env", "VARIANT=upstream", "./run-oct.sh", "report_i01.m", "build-upstream", "upstream/audapter_matlab"],
    ["./run-oct.sh", "report_pt5.m"],
]

# ----------------------------------------------------------------------------------------------- checks
def fail(msg):
    sys.exit("build.py: " + msg)

def check_log_ids(ids):
    log = open(os.path.join(AUDIT, "FINDINGS-LOG.md")).read()
    for i in ids:
        if not re.search(r"\*\*[^*]*\b" + re.escape(i) + r"\b[^*]*\*\*", log):
            fail(f"finding id {i} not found in FINDINGS-LOG.md")

def test_results():
    res = {}
    p = os.path.join(HARNESS, "logs-summary.txt")
    for line in open(p):
        m = re.match(r"\[(\S+)\] (PASS|FAIL)\s+(.*?)(?:\s{2,}(.*))?$", line.rstrip())
        if m:
            res[(m.group(1) + ".m", m.group(3).strip())] = (m.group(2), (m.group(4) or "").strip())
    return res

# ----------------------------------------------------------------------------------------------- code refs
def excerpt(repos, ref):
    r = repos[ref["repo"]]
    local = os.path.expanduser(r["local"])
    try:
        src = subprocess.run(["git", "-C", local, "show", f'{r["sha"]}:{ref["path"]}'],
                             capture_output=True, text=True, check=True).stdout.split("\n")
    except subprocess.CalledProcessError as e:
        fail(f"git show failed for {ref}: {e.stderr}")
    a, b = ref["lines"]
    lines = src[a - 1:b]
    if ref.get("expect") and not any(ref["expect"] in l for l in lines):
        fail(f'{ref["path"]}:{a}-{b} at {r["sha"][:7]} does not contain {ref["expect"]!r} (line drift?)')
    anchor = f"#L{a}" if a == b else f"#L{a}-L{b}"
    url = f'{r["url"]}/blob/{r["sha"]}/{ref["path"]}{anchor}'
    return lines, url

def dedent(lines):
    exp = [l.expandtabs(4) for l in lines]
    ind = min((len(l) - len(l.lstrip()) for l in exp if l.strip()), default=0)
    return [l[ind:] for l in exp]

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


def sketch_ost_f1(d, up):
    t, T1 = d["t"], 2.0
    s = Sketch("sk-ost-f1", 0, T1, "OST state timeline for trial B, as the first trial and right after trial A")
    s.envelope("Trial A input", t, db(d["rms_A"]), -60, -10, h=34, sub="previous trial", marks=[(0.06, "one vowel, 0.04–1.60 s")])
    ya = s.intervals("Trial A state", state_ivs(t, d["stat_A"], "context", T1), h=26)
    s.gap(10)
    s.envelope("Trial B input", t, db(d["rms_B"]), -60, -10, marks=[(0.06, "word 1"), (0.62, "word 2")])
    s.intervals("OST state", state_ivs(t, d["stat_B_fresh"], "expected", T1), sub="first trial")
    s.gap(16)
    yo = s.intervals("OST state", state_ivs(t, d["stat_B_after_A"], "observed", T1), sub="after trial A")
    shf = runs(t, d["sF1_B_fresh"], lambda v: v > 0)
    sha = runs(t, d["sF1_B_after_A"], lambda v: v > 0)
    s.gap(4)
    s.intervals("F1 +30 % applied", [(a, b, "shifted", "expected") for a, b in shf], h=26, sub="first trial")
    yp = s.intervals("F1 +30 % applied", [(a, b, "shifted", "observed") for a, b in sha], h=26, sub="after trial A")
    a, b = d["state2_B_fresh_s"], d["state2_B_after_A_s"]
    s.band(a, b, yo, yp + 26, f"state 1 runs {b - a:.2f} s too long, so word 2 is shifted", anchor="start", ty=yo - 6)
    s.guide(d["state2_A_s"], ya - 2, yo + 30)
    s.parts.append(f'<text class="sk-note" x="{s.x(d["state2_A_s"]) - 6:.1f}" y="{ya + 44}" text-anchor="end">trial A reached state 2 at {d["state2_A_s"]:.2f} s</text>')
    s.axis([0, 0.4, 0.8, 1.2, 1.6, 2.0])
    return s.svg("Trial B's state 2 begins at %.2f s as the first trial, but at %.2f s after trial A, whose own state 2 began at %.2f s. "
                 "The F1 shift therefore also covers word 2." % (d["state2_B_fresh_s"], d["state2_B_after_A_s"], d["state2_A_s"]))


def sketch_i01(d, up):
    d["gaps"] = rows2(d["gaps"])
    dt, T1 = d["env_dt"], 12.0
    t = [i * dt for i in range(len(d["env_out"]))]
    s = Sketch("sk-i-01", 0, T1, "Masking noise over a 12 s trial: expected loop, blab output, upstream output")
    s.envelope("Input", t, d["env_in"], -60, -10, h=26, sub="vowels")
    L = d["noise_len_samples"] / d["fs_device"]
    exp = []; a = 0; k = 1
    while a < T1:
        exp.append((a, min(a + L, T1), f"noise, pass {k}", "expected")); a += L; k += 1
    s.intervals("Noise, 5 s file", exp, sub="expected")
    on = runs(t, d["noise_on"], lambda v: v > 0)
    yo = s.intervals("blab b2.5", [(a, b, "noise", "observed") for a, b in on], sub="observed")
    for g0, g1 in d["gaps"]:
        s.band(g0, g1, yo, yo + 26, f"no noise for {g1-g0:.1f} s: voice unmasked", ty=yo + 17)
    if up:
        Lu = up["maxPBLen"] / up["fs_device"]; ivs = []; a = 0
        while a < T1:
            ivs.append((a, min(a + Lu, T1), "noise", "observed")); a += Lu
        s.intervals("upstream 2.1.5", ivs, sub="same script")
    s.envelope("Output", t, d["env_out"], -60, -10, h=34, cls="sk-output", sub="what is heard")
    s.axis([0, 2, 4, 6, 8, 10, 12])
    main = s.svg("With a 5 s noise file, blab output has noise from 0 to 5 s and from 10 s on; nothing from 5 to 10 s. "
                 "Upstream 2.1.5, whose buffer is 4.8 s, loops without a gap.")
    # inset: bundled babble dropout
    z, t0, zdt = d["babble_zoom"], d["babble_zoom_t0"], d["babble_zoom_dt"]
    zi = Sketch("sk-i-01-zoom", t0, t0 + len(z) * zdt, "Bundled babble around 9.98 s")
    y = zi.y; h = 60; zi.label(y, h, "Bundled babble", "fb 2, 9.90–10.06 s"); zi.frame(y, h)
    pk = max(abs(v) for v in z) or 1
    pts = " L".join(f"{zi.x(t0 + i*zdt):.1f},{y + h/2 - v/pk*(h/2-3):.1f}" for i, v in enumerate(z))
    zi.parts.append(f'<path class="sk-line-wave" d="M{pts}"/>')
    b0, b1 = d["babble_dropout"]
    zi.band(b0, b1 + 1/16000, y, y + h, f"{(b1-b0)*1000+1/16:.0f} ms of silence", anchor="start", ty=y + 12)
    zi.y += h + 8
    zi.axis([9.90, 9.94, 9.98, 10.02, 10.06], "{:.2f} s")
    inset = zi.svg("The full-length bundled babble (479230 samples) plays silence from 9.984 to 10.000 s before wrapping.")
    return main + inset


def sketch_pt5(d, up):
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

SKETCHES = {"ost_f1": sketch_ost_f1, "i01": sketch_i01, "pt5": sketch_pt5}

# ----------------------------------------------------------------------------------------------- derived values
def rows2(g):
    """Octave's jsonencode flattens a 1x2 matrix to [a, b]; normalise to [[a, b], ...]."""
    if not g: return []
    return [g] if not isinstance(g[0], list) else g

def derive(card, d, up):
    for x in (d, up):
        if x and "gaps" in x: x["gaps"] = rows2(x["gaps"])
    v = dict(d)
    if card["id"] == "OST-F1":
        v["overrun"] = d["state2_B_after_A_s"] - d["state2_B_fresh_s"]
        r = [a / b for a, b, t in zip(d["sF1_B_after_A"], d["F1_B"], d["t"]) if 0.75 <= t <= 1.15 and b > 0]
        v["logged_ratio"] = sum(r) / len(r)
    if card["id"] == "I-01":
        fmt = lambda g: ", ".join(f"{a:.2f}–{b:.2f} s" for a, b in g) if g else "none"
        v["gaps_text"] = fmt(d["gaps"]); v["up_maxPBLen"] = up["maxPBLen"] if up else "?"
        v["up_gaps_text"] = fmt(up["gaps"]) if up else "not run"
    if card["id"] == "PT-5":
        import math
        v["f0_cents"] = 1200 * math.log2(d["f0_after"] / d["f0_in"])
        steps = [r["gain2_db"] - r["gain0_db"] for r in d["sweep"]]
        v["sweep_min"], v["sweep_max"] = -max(steps), -min(steps)
        v["ampnorm_text"] = "; ".join(f'{a["name"]}: {a["result"].replace("Audapter: ", "")}' for a in d["ampnorm"])
    return v

# ----------------------------------------------------------------------------------------------- html
SEV = {"high": ("High", "sev-high"), "med": ("Medium", "sev-med"), "low": ("Low", "sev-low")}
ORIGIN = {"upstream": "Inherited from upstream", "blab": "Blab-only", "blab-amplified": "Blab-amplified", "both": "Both"}
KIND = {"H": "Harness", "D": "Driver", "R": "Reading", "F": "Formal"}
ROLE = {"input": "Input", "expected": "Expected", "observed": "Observed"}

def code_block(repos, ref, compact=False):
    lines, url = excerpt(repos, ref)
    a, b = ref["lines"]; r = repos[ref["repo"]]
    loc = f'{ref["path"].split("/")[-1]}:{a}' + (f"–{b}" if b != a else "")
    who = {"blab-mex": "blab", "blab-matlab": "blab MATLAB", "upstream-mex": "upstream"}[ref["repo"]]
    if compact:
        return f'<a class="permalink" href="{url}">{E(who)} {E(loc)} @{r["sha"][:7]}</a>'
    hl = set(ref.get("hl", []))
    rows = "".join(f'<span class="ln{" hl" if a+i in hl else ""}"><span class="no" aria-hidden="true">{a+i}</span>{E(l) or " "}</span>'
                   for i, l in enumerate(dedent(lines)))
    return (f'<figure class="code"><figcaption><a class="permalink" href="{url}">{E(who)} · {E(ref["path"])} lines {a}'
            f'{"–"+str(b) if b != a else ""} @{r["sha"][:7]}</a></figcaption><pre><code>{rows}</code></pre>'
            f'<p class="code-note">{ref.get("note", "")}</p></figure>')

def card_html(repos, card, tests, data, up, asset_rel):
    v = derive(card, data, up)
    sev, sevc = SEV[card["severity"]]
    eff = card["effect"]
    nums = "".join(f"<tr><th scope=row>{E(k)}</th><td>{E(val.format(**v))}</td></tr>" for k, val in eff["numbers"])
    badges = "".join(f'<li class="vk vk-{k}"><span class="vk-l">{k}</span> {KIND[k]}</li>' for k in card["status"])
    audio = []
    for a in card["audio"]:
        m = next(x for x in data["audio"] if x["file"] == a["file"])
        warn = f'<p class="warn"><span aria-hidden="true">!</span> {E(m["warn"])}</p>' if m.get("warn") else ""
        audio.append(f'<li class="clip role-{a["role"]}"><span class="swatch" aria-hidden="true"></span>'
                     f'<div><p class="clip-l" data-file="{a["file"]}"><strong>{ROLE[a["role"]]}.</strong> {E(re.sub(r"^(Input|Output):\s*", "", m["label"]))} <span class="dur">{m["dur_s"]:.1f} s</span></p>'
                     f'<audio controls preload="none" src="{asset_rel}/{a["file"]}" data-sketch="sk-{card["id"].lower()}" data-offset="{a.get("offset", 0)}"></audio>{warn}</div></li>')
    refs = "".join(code_block(repos, r) for r in card["cause"]["refs"])
    uprefs = ", ".join(code_block(repos, r, compact=True) for r in card["cause"].get("upstream_refs", []))
    ver = []
    for x in card["verify"]:
        res = ""
        if x.get("test"):
            st, det = tests.get((x["name"], x["test"]), ("?", "not in logs-summary.txt"))
            res = f' <span class="res res-{st.lower()}">{st}</span> <span class="res-d">“{E(x["test"])}”: {E(det)}</span>'
        elif x.get("detail"):
            res = f' <span class="res-d">{E(x["detail"])}</span>'
        cls = " pending" if x.get("pending") else ""
        ver.append(f'<li class="{cls.strip()}"><span class="vk-l">{x["kind"]}</span> {E(x["what"])}: <code>{E(x["name"])}</code>{res}</li>')
    sketch = SKETCHES[card["sketch"]](data, up)
    return f'''
<article class="card" id="{card["id"]}" aria-labelledby="{card["id"]}-h">
  <aside class="rail">
    <p class="fid">{card["id"]}</p>
    <p class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev} severity</p>
    <p class="origin">{ORIGIN[card["origin"]]}</p>
    <ul class="vks" aria-label="Verification">{badges}</ul>
    <p class="railnote"><a href="../../{card["notes"]}">Audit notes</a><br><a href="../../FINDINGS-LOG.md">Findings log</a></p>
  </aside>
  <div class="main">
    <h3 id="{card["id"]}-h">{E(card["headline"])}</h3>
    <p class="setup">{eff["setup"]}</p>
    <dl class="eo">
      <div class="eo-e"><dt>Expected</dt><dd>{E(eff["expected"].format(**v))}</dd></div>
      <div class="eo-o"><dt>Observed</dt><dd>{E(eff["observed"].format(**v))}</dd></div>
      <div class="eo-m"><dt>Why it matters</dt><dd>{eff["matters"]}</dd></div>
    </dl>
    <figure class="fig">{sketch}
      <details class="data"><summary>Numbers behind this figure</summary><table>{nums}</table>
      <p>Source: <a href="{asset_rel}/data.json">data.json</a>, written by the export script from the harness run.</p></details>
    </figure>
    <section class="listen" aria-label="Audio">
      <h4>Listen</h4>
      <ul class="clips">{"".join(audio)}</ul>
      <p class="norm">All clips in this card share one playback gain, so level differences you hear are real. 16 kHz, 16-bit, as recorded by Audapter (<code>signalIn</code>, <code>signalOut</code>).</p>
    </section>
    {interactive_html(card, repos)}
    <section class="cause" aria-label="Cause">
      <h4>Cause</h4>
      <p>{card["cause"]["summary"]}</p>
      {refs}
      <p class="upstream">Upstream 2.1.5: {uprefs}.</p>
      <p class="origin-note"><strong>Origin.</strong> {E(card["origin_note"])}</p>
      <p class="fix"><strong>Suggested fix.</strong> {card["cause"]["fix"]}</p>
    </section>
    <section class="verify" aria-label="Verification">
      <h4>How we know</h4>
      <ul>{"".join(ver)}</ul>
      <p class="repro"><span>Reproduce</span> <code>{E(card["reproduce"])}</code></p>
    </section>
  </div>
</article>'''

def table_html(rows):
    out = []
    for r in rows:
        sev, sevc = SEV[r["sev"]]
        idc = f'<a href="#{r["id"]}">{r["id"]}</a>' if r.get("card") else r["id"]
        out.append(f'<tr><td class="t-id">{idc}</td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                   f'<td>{E(r["text"])}</td><td>{ORIGIN[r["origin"]]}</td><td><span class="vk-l">{r["status"]}</span></td></tr>')
    return "".join(out)

def fonts_css():
    """Charis SIL (OFL, a Charter derivative), Latin subset, inlined so the report renders the same offline."""
    out = []
    for w in (400, 700):
        for st in ("normal", "italic"):
            p = os.path.join(HERE, "templates", "fonts", f"charis-{w}-{st}.woff2")
            b = base64.b64encode(open(p, "rb").read()).decode()
            out.append(f'@font-face{{font-family:"Charis SIL";font-weight:{w};font-style:{st};font-display:swap;'
                       f'src:url(data:font/woff2;base64,{b}) format("woff2");}}')
    return "\n".join(out) + "\n"

def write_wasm_bundles(y):
    """Classic-script bundles for the optional in-browser panels (loaded on click; work from file://)."""
    wd = os.path.join(OUT, "wasm")
    if not os.path.exists(os.path.join(wd, "audapter-buggy.wasm")):
        print("note: no WASM variants (run report/wasm/build-variants.sh); interactive panels will say so"); return
    b = {"build": json.load(open(os.path.join(wd, "build-info.json")))}
    for v in ("buggy", "patched"):
        # Blob-imported modules have a blob: import.meta.url that cannot resolve relative URLs; the binary is
        # passed in as wasmBinary, so point the (unused) default location at a harmless absolute URL.
        b[v] = {"mjs": open(os.path.join(wd, f"audapter-{v}.mjs")).read().replace(
                    'new URL("audapter-' + v + '.wasm",import.meta.url)', 'new URL("audapter-' + v + '.wasm","https://example.invalid/")'),
                "wasm": base64.b64encode(open(os.path.join(wd, f"audapter-{v}.wasm"), "rb").read()).decode()}
    open(os.path.join(wd, "audapter-variants.js"), "w").write("window.AUDAPTER_WASM = " + json.dumps(b) + ";\n")
    src = os.path.join(EXPORTS, "ost-f1", "blab")
    d = {"init": json.load(open(os.path.join(HERE, "wasm", "init-ost-f1.json"))),
         "trialA": base64.b64encode(open(os.path.join(src, "dev_trialA_48k.wav"), "rb").read()).decode(),
         "trialB": base64.b64encode(open(os.path.join(src, "dev_trialB_48k.wav"), "rb").read()).decode()}
    open(os.path.join(OUT, "assets", "ost-f1", "widget-data.js"), "w").write(
        "window.AUDAPTER_WIDGETS = window.AUDAPTER_WIDGETS || {};\nwindow.AUDAPTER_WIDGETS['ost-f1'] = " + json.dumps(d) + ";\n")

def interactive_html(card, repos):
    w = card.get("interactive")
    if not w:
        return ""
    if w.get("status") == "planned":
        return (f'<section class="interactive planned" aria-label="Interactive panel (planned)"><h4>Run it in your browser</h4>'
                f'<p>Planned: {w["plan"]}</p></section>')
    patch = open(os.path.join(HERE, "patches", w["patch"])).read()
    added = [l[1:] for l in patch.splitlines() if l.startswith("+") and not l.startswith("+++")]
    return f'''<section class="interactive" data-widget="{w["id"]}" aria-label="Interactive panel">
      <h4>Run it in your browser</h4>
      <p>{w["text"]}</p>
      <p class="ipatch">The fix, from <code>report/patches/{E(w["patch"])}</code>, applied after <code>stat = 0;</code> in <code>Audapter::reset()</code>:</p>
      <pre class="ipatch-code"><code>{E(chr(10).join(l.expandtabs(4).strip() for l in added))}</code></pre>
      <p><button type="button" class="run">Run trials B, A, B on both builds</button> <span class="istatus" role="status"></span></p>
      <div class="iresult"></div>
    </section>'''

def diff_html(tests):
    rows = []
    for (f, name), (st, det) in tests.items():
        if f == "t_diff.m":
            sc = name.split(": ", 1)[-1]
            rows.append(f'<tr><td><code>{E(sc)}</code></td><td><span class="res res-{st.lower()}">{st}</span></td><td>{E(det) or "bit-identical output and logged data"}</td></tr>')
    return "".join(rows)

def main():
    args = set(sys.argv[1:])
    if "--export" in args:
        for c in EXPORT_CMDS:
            print("export:", " ".join(c)); subprocess.run(c, cwd=HARNESS, check=True)
    y = yaml.safe_load(open(os.path.join(HERE, "findings.yaml")))
    repos = y["repos"]
    check_log_ids([c["log"] for c in y["cards"]] + [r["id"] for r in y["table"]])
    tests = test_results()
    os.makedirs(OUT, exist_ok=True)
    cards, manifest = [], {"cards": {}}
    for c in y["cards"]:
        src = os.path.join(EXPORTS, c["asset_dir"], "blab")
        if not os.path.exists(os.path.join(src, "data.json")):
            fail(f"missing export for {c['id']}: run build.py --export")
        dst = os.path.join(OUT, "assets", c["asset_dir"]); os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src):
            shutil.copy2(os.path.join(src, f), dst)
        data = json.load(open(os.path.join(src, "data.json")))
        upf = os.path.join(EXPORTS, c["asset_dir"], "upstream", "data.json")
        up = json.load(open(upf)) if os.path.exists(upf) else None
        cards.append(card_html(repos, c, tests, data, up, f"assets/{c['asset_dir']}"))
        manifest["cards"][c["id"]] = {"assets": sorted(os.listdir(dst)), "upstream_export": bool(up)}
    tpl = open(os.path.join(HERE, "templates", "page.html")).read()
    css = fonts_css() + open(os.path.join(HERE, "templates", "style.css")).read()
    js = "\n".join(open(os.path.join(HERE, "templates", p)).read()
                   for p in ("page.js", "widgets/ost-f1-core.js", "widgets/ost-f1-widget.js"))
    write_wasm_bundles(y)
    shas = {k: v["sha"][:7] for k, v in repos.items()}
    page = (tpl.replace("{{CSS}}", css).replace("{{JS}}", js).replace("{{TITLE}}", E(y["report"]["title"]))
               .replace("{{DATE}}", y["report"]["date"]).replace("{{TABLE}}", table_html(y["table"]))
               .replace("{{CARDS}}", "\n".join(cards)).replace("{{DIFF}}", diff_html(tests)))
    for k, s in shas.items():
        page = page.replace("{{SHA:" + k + "}}", s).replace("{{URL:" + k + "}}", f'{repos[k]["url"]}/tree/{repos[k]["sha"]}')
    page = re.sub(r"(?<=\d) %", "\u00a0%", page)
    open(os.path.join(OUT, "index.html"), "w").write(page)
    if "--single" in args:
        def inline(m):
            p = os.path.join(OUT, m.group(1))
            return 'src="data:audio/wav;base64,' + base64.b64encode(open(p, "rb").read()).decode() + '"'
        open(os.path.join(OUT, "index.single.html"), "w").write(re.sub(r'src="(assets/[^"]+\.wav)"', inline, page))
    json.dump(manifest, open(os.path.join(OUT, "build-manifest.json"), "w"), indent=1)
    print("wrote", os.path.join(OUT, "index.html"))

if __name__ == "__main__":
    main()
