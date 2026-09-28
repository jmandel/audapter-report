#!/usr/bin/env python3
"""Review page for the simulated LPC check: per talker, the formant tracks Audapter produces on the pretest tokens at
every LPC order (10-20) against an independent Praat track, the documented selection rule's scores (reimplemented here
from audit/labrun/README.md, "Participant setup: the LPC check"), and the order it picks versus the gender preset.

Inputs per talker: a labrun result dir (pretest trials, talker.json) and the per-order tracks written by
audit/harness/oct/lpc_orders.m (SCEN='<run dir>|lpc/<talker>'). Praat tracks come from the voice bank.
Usage: python3 audit/lpc-review/build.py <run_dir> [<run_dir> ...]   (tracks read from audit/harness/oct/out/lpc/<talker>/)
Writes audit/lpc-review/dist/ (staged to docs/lpc-review/ by audit/publish/stage.sh).
"""
import csv, html, json, os, re, sys
import numpy as np
import scipy.io as sio
import scipy.io.wavfile as wavfile
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
VOICES = os.path.join(ROOT, "audit", "labrun", "voices")
TRACKS = os.path.join(ROOT, "audit", "harness", "oct", "out", "lpc")
OUT = os.path.join(HERE, "dist")
E = html.escape
ORDERS = list(range(10, 21))
W_A, W_B, W_C, MARGIN = 0.5, 0.25, 0.25, 0.85          # the documented rule
JUMP_F1, JUMP_F2 = 100.0, 200.0
FMAX = 3500


def mel(f):
    return 1127.01048 * np.log(1 + np.asarray(f, float) / 700)


def praat_track(tok):
    t, f1, f2 = [], [], []
    with open(os.path.join(VOICES, "audio", "tracks", tok + ".tsv")) as f:
        for row in csv.DictReader(f, delimiter="\t"):
            try: a, b = float(row["F1"]), float(row["F2"])
            except ValueError: a = b = np.nan
            t.append(float(row["t"])); f1.append(a); f2.append(b)
    return np.array(t), np.array(f1), np.array(f2)


def load_tokens(run, talker):
    """Pretest trials with their per-order Audapter tracks, the Praat reference and the vowel nucleus (trial time)."""
    res = sio.loadmat(os.path.join(TRACKS, talker, "orders.mat"), squeeze_me=True, struct_as_record=False)["res"]
    toks = {}
    for r in np.atleast_1d(res):
        k = int(r.k); d = str(r.desc)
        if k not in toks:
            m = dict(re.findall(r"(\w+)=([\w.\-]+)", d)); v0, v1 = map(float, m["vowel"].split("-"))
            rec = sio.loadmat(os.path.join(run, "trials", f"{k:04d}.mat"), squeeze_me=True, struct_as_record=False)["rec"]
            pt, p1, p2 = praat_track(m["tok"]); on = float(m["onset"])
            toks[k] = dict(k=k, word=str(r.word), tok=m["tok"], sr=int(r.sr), fl=int(r.fl), nucleus=(v0, v1),
                           praat=(pt + on, p1, p2), x=np.asarray(rec.signalIn, float), logged=np.asarray(rec.dataMat, float)[:, 4:6],
                           nlpc_run=int(rec.nLPC), tracks={})
        toks[k]["tracks"][int(r.order)] = np.asarray(r.fmts, float)
    return [toks[k] for k in sorted(toks)]


def frame_times(tok, n):
    return (np.arange(n) + 0.5) * tok["fl"] / tok["sr"]


def mid_half(tok):
    a, b = tok["nucleus"]; q = (b - a) / 4
    return a + q, b - q


def per_trial(tok, order):
    """Audapter median F1/F2 over the middle half of the nucleus, the Praat medians over the same span, and the
    nucleus frames (for continuity)."""
    F = tok["tracks"][order]; t = frame_times(tok, len(F)); a, b = mid_half(tok)
    sel = (t >= a) & (t <= b) & (F[:, 0] > 0)
    nuc = (t >= tok["nucleus"][0]) & (t <= tok["nucleus"][1]) & (F[:, 0] > 0)
    pt, p1, p2 = tok["praat"]; ps = (pt >= a) & (pt <= b) & np.isfinite(p1) & np.isfinite(p2)
    if sel.sum() < 2 or ps.sum() < 2: return None
    return dict(aud=(np.median(F[sel, 0]), np.median(F[sel, 1])), ref=(np.median(p1[ps]), np.median(p2[ps])), nuc=F[nuc])


def score(toks, order):
    pts = [(tok["word"], per_trial(tok, order)) for tok in toks]; pts = [(w, p) for w, p in pts if p]
    A = 100 * np.median([np.mean([abs(np.log(p["aud"][i] / p["ref"][i])) for i in (0, 1)]) for _, p in pts])
    steps = jumps = 0
    for _, p in pts:
        d = np.abs(np.diff(p["nuc"], axis=0)); steps += len(d); jumps += int(np.sum((d[:, 0] > JUMP_F1) | (d[:, 1] > JUMP_F2)))
    B = 100 * jumps / max(steps, 1)
    by = {}
    for w, p in pts: by.setdefault(w, []).append(mel(p["aud"]))
    by = {w: np.array(v) for w, v in by.items() if len(v) >= 2}
    if len(by) >= 2:
        cent = {w: v.mean(0) for w, v in by.items()}
        spread = np.sqrt(np.mean(np.concatenate([np.sum((v - cent[w]) ** 2, 1) for w, v in by.items()])))
        ws = list(cent); between = np.mean([np.linalg.norm(cent[a] - cent[b]) for i, a in enumerate(ws) for b in ws[i+1:]])
        C = 100 * spread / between; wA, wB, wC = W_A, W_B, W_C
    else:
        C = None; s = W_A + W_B; wA, wB, wC = W_A / s, W_B / s, 0.0
    cost = wA * A + wB * B + (wC * C if C is not None else 0)
    return dict(A=A, B=B, C=C, cost=cost, parts=(wA * A, wB * B, wC * C if C is not None else 0),
                scatter=[(w, float(p["aud"][0]), float(p["aud"][1])) for w, p in pts])


def choose(scores, preset):
    best = min(ORDERS, key=lambda o: (round(scores[o]["cost"], 9), abs(o - preset)))
    chosen = best if scores[best]["cost"] <= MARGIN * scores[preset]["cost"] else preset
    return best, chosen


# ---------------------------------------------------------------------------------------------------- figures
def spectro_png(tok, path):
    x, sr = tok["x"], tok["sr"]; a, b = tok["nucleus"]; t0, t1 = max(0, a - 0.12), min(len(x) / sr, b + 0.12)
    seg = x[int(t0 * sr):int(t1 * sr)]
    fig = plt.figure(figsize=(3.2, 2.2), dpi=120); ax = fig.add_axes([0, 0, 1, 1])
    vmax = 20 * np.log10(max(np.abs(seg).max(), 1e-6))
    ax.specgram(seg + 1e-7, NFFT=int(0.025 * sr), Fs=sr, noverlap=int(0.021 * sr), cmap="Greys", vmin=vmax - 95, vmax=vmax - 20)
    ax.set_ylim(0, FMAX); ax.set_xlim(0, t1 - t0); ax.axis("off")
    fig.savefig(path); plt.close(fig)
    return t0, t1


def score_svg(scores, preset, chosen, best):
    W, H, X0, Y0 = 720, 230, 46, 16; n = len(ORDERS); bw = (W - X0 - 10) / n
    # scale to the orders that matter: cap at 4x the default's cost; taller bars are cut and marked
    top = min(max(s["cost"] for s in scores.values()), 4 * scores[preset]["cost"]) * 1.12
    y = lambda v: Y0 + (H - Y0 - 40) * (1 - min(v, top) / top)
    out = []
    for g in np.linspace(0, top, 5)[1:]:
        out.append(f'<line class="sk-grid" x1="{X0}" x2="{W-10}" y1="{y(g):.1f}" y2="{y(g):.1f}"/><text class="sk-tick" x="{X0-6}" y="{y(g)+4:.1f}" text-anchor="end">{g:.1f}</text>')
    thr = MARGIN * scores[preset]["cost"]
    out.append(f'<line class="sk-thr" x1="{X0}" x2="{W-10}" y1="{y(thr):.1f}" y2="{y(thr):.1f}"/>'
               f'<text class="sk-tick" x="{W-12}" y="{Y0-4}" text-anchor="end">dotted line: the cost an order must beat to replace the default (0.85 × default)</text>')
    for i, o in enumerate(ORDERS):
        s = scores[o]; x0 = X0 + i * bw + 4; acc = 0
        for part, cls in zip(s["parts"], ("sk-pA", "sk-pB", "sk-pC")):
            if part <= 0: continue
            out.append(f'<rect class="{cls}" x="{x0:.1f}" y="{y(acc + part):.1f}" width="{bw-8:.1f}" height="{y(acc) - y(acc + part):.1f}"/>'); acc += part
        if s["cost"] > top: out.append(f'<text class="sk-tick" x="{x0 + (bw-8)/2:.1f}" y="{Y0+10}" text-anchor="middle">▲ {s["cost"]:.0f}</text>')
        cls = "sk-chosen" if o == chosen else ("sk-preset" if o == preset else "")
        if cls: out.append(f'<rect class="{cls}" x="{x0-2:.1f}" y="{y(acc)-2:.1f}" width="{bw-4:.1f}" height="{y(0)-y(acc)+4:.1f}" rx="2"/>')
        out.append(f'<text class="sk-tick" x="{x0 + (bw-8)/2:.1f}" y="{H-24}" text-anchor="middle">{o}</text>')
        tag = "used" if o == chosen else ("default" if o == preset else ("best" if o == best else ""))
        if o == chosen and o == preset: tag = "default, kept"
        if tag: out.append(f'<text class="sk-tag{" on" if o == chosen else ""}" x="{x0 + (bw-8)/2:.1f}" y="{H-8}" text-anchor="middle">{tag}</text>')
    out.append(f'<text class="sk-axlab" x="{X0}" y="{Y0-4}">cost (lower is better)</text>')
    return f'<svg class="sketch" viewBox="0 0 {W} {H}" role="img" aria-label="Cost of each LPC order">{"".join(out)}</svg>'


# ---------------------------------------------------------------------------------------------------- page
def build(runs):
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    tabs, sections, summary, data = [], [], [], {}
    for ti, run in enumerate(runs):
        run = os.path.normpath(run); talker = os.path.basename(run)
        meta = json.load(open(os.path.join(run, "talker.json"))) if os.path.exists(os.path.join(run, "talker.json")) else {}
        toks = load_tokens(run, talker)
        preset = toks[0]["nlpc_run"]
        # the preset run must reproduce the recorded trial exactly (validates the re-run)
        dev = max(float(np.max(np.abs(t["tracks"][preset][:len(t["logged"])] - t["logged"][:len(t["tracks"][preset])]))) for t in toks)
        scores = {o: score(toks, o) for o in ORDERS}; best, chosen = choose(scores, preset)
        gain = 100 * (1 - scores[best]["cost"] / scores[preset]["cost"])
        tid = f"t{ti}"; td = dict(orders=ORDERS, preset=preset, chosen=chosen, tokens=[], scatter={})
        for tok in toks:
            base = f"{tid}_{tok['k']:04d}"; t0, t1 = spectro_png(tok, os.path.join(OUT, "assets", base + ".png"))
            wavfile.write(os.path.join(OUT, "assets", base + ".wav"), tok["sr"], (np.clip(tok["x"], -1, 1) * 32767).astype(np.int16))
            pt, p1, p2 = tok["praat"]; ps = (pt >= t0) & (pt <= t1)
            trk = {}
            for o in ORDERS:
                F = tok["tracks"][o]; tf = frame_times(tok, len(F)); m = (tf >= t0) & (tf <= t1)
                trk[o] = [[round(float(a - t0), 4), round(float(f1), 1) if f1 > 0 else None, round(float(f2), 1) if f1 > 0 else None]
                          for a, f1, f2 in zip(tf[m], F[m, 0], F[m, 1])]
            td["tokens"].append(dict(img=f"assets/{base}.png", wav=f"assets/{base}.wav", word=tok["word"], trial=tok["k"], dur=t1 - t0,
                                     nucleus=[tok["nucleus"][0] - t0, tok["nucleus"][1] - t0], mid=[m_ - t0 for m_ in mid_half(tok)],
                                     praat=[[round(float(a - t0), 4), None if np.isnan(b) else round(float(b), 1), None if np.isnan(c) else round(float(c), 1)]
                                            for a, b, c in zip(pt[ps], p1[ps], p2[ps])], tracks=trk))
        for o in ORDERS: td["scatter"][o] = scores[o]["scatter"]
        data[tid] = td
        rows = "".join(f'<tr class="{"chosen" if o == chosen else ""}{" preset" if o == preset else ""}"><td>{o}</td><td>{s["A"]:.1f}</td><td>{s["B"]:.1f}</td>'
                       f'<td>{"–" if s["C"] is None else f"{s["C"]:.1f}"}</td><td>{s["cost"]:.1f}</td></tr>' for o, s in scores.items())
        g = (re.search(r"perceived (female|male)", meta.get("note", "")) or [None, ""])[1]
        dname = f"the {g} default ({preset})" if g else f"the default ({preset})"
        verdict = (f"Keeps {dname}: order {best} scores {gain:.0f}% better, short of the 15% needed to switch." if chosen == preset and best != preset
                   else f"Keeps {dname}: it is already the best order." if chosen == preset
                   else f"Switches from {dname} to order {chosen}, which scores {gain:.0f}% better.")
        summary.append(f'<tr><td>{E(meta.get("name", talker))}</td><td>{E(str(meta.get("gender") or (re.search(r"perceived (female|male)", meta.get("note", "")) or [None, ""])[1]))}</td><td>{preset}</td><td>{best}</td>'
                       f'<td><b>{chosen}</b></td><td>{gain:.0f}%</td><td>{"yes" if chosen != preset else "no"}</td></tr>')
        tabs.append(f'<button type="button" data-t="{tid}"{" class=on" if not tabs else ""}>{E(meta.get("name", talker))}</button>')
        sections.append(f"""<section id="{tid}" class="talker"{'' if not sections else ' hidden'}>
<p class="who"><b>{E(meta.get('name', talker))}</b> · {E(meta.get('kind', ''))}. {E(meta.get('note', ''))}</p>
<p class="verdict">{E(verdict)}</p>
<h2>Why this order</h2>
<p>Each bar is one LPC order; its height is the rule's cost, built from three parts (legend below). The outlined bar
is the order used.</p>
{score_svg(scores, preset, chosen, best)}
<p class="legend"><span class="lg pA"></span>tracking error against Praat (×0.5)
<span class="lg pB"></span>track jumps (×0.25) <span class="lg pC"></span>vowel-cluster spread (×0.25)
<span class="lg chosen"></span>used <span class="lg preset"></span>default (from the male/female setting)</p>
<details><summary>Scores by order</summary><table class="scores"><tr><th>order</th><th>A, error %</th><th>B, jumps %</th><th>C, spread %</th><th>cost</th></tr>{rows}</table></details>
<h2>What each order does to the tracks</h2>
<div class="orders" data-t="{tid}">{''.join(f'<button type="button" data-o="{o}" class="{"on" if o == chosen else ""}">{o}{" · default" if o == preset else ""}{" · used" if o == chosen else ""}</button>' for o in ORDERS)}</div>
<p class="legend"><span class="lg trk"></span>Audapter's F1, F2 at the selected order <span class="lg dft"></span>at the default order
<span class="lg ref"></span>Praat (independent reference)
<span class="lg nuc"></span>middle of the vowel (where accuracy is scored)</p>
<div class="tokens" id="{tid}-tokens"></div>
<h3>Vowel clusters at the selected order</h3>
<div class="scatter" id="{tid}-scatter"></div>
<p class="note">Re-running the default order reproduces the tracks Audapter logged in the experiment to within {dev:.2g} Hz.</p>
</section>""")
    page = (TEMPLATE.replace("{{TABS}}", "".join(tabs)).replace("{{SECTIONS}}", "\n".join(sections))
            .replace("{{SUMMARY}}", "".join(summary)).replace("{{DATA}}", json.dumps(data, separators=(",", ":"))))
    open(os.path.join(OUT, "index.html"), "w").write(page)
    print(f"lpc-review: {len(sections)} talkers -> {OUT}")


TEMPLATE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>How the LPC order was chosen · Audapter report</title>
<style>
:root { --paper:#fff; --ink:#1d2530; --ink-2:#4a5563; --ink-3:#6f7985; --rule:#dde2e7; --observed:#2a78d6; --context:#e8ebee; --disc:#eb6834;
  --pA:#4a5563; --pB:#8a939d; --pC:#c3cad2; --serif: "Charis SIL", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif; }
@media (prefers-color-scheme: dark) { :root { --paper:#15181c; --ink:#e7eaee; --ink-2:#b9c1ca; --ink-3:#8f99a4; --rule:#2e353d; --observed:#3987e5;
  --context:#2a3037; --pA:#b9c1ca; --pB:#7d8792; --pC:#4a535d; } }
body { font: 17px/1.55 var(--serif); color: var(--ink); background: var(--paper); max-width: 860px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.55em; line-height: 1.2; margin: .3em 0; } h2 { font-size: 1.15em; margin: 1.6em 0 .4em; } h3 { font-size: 1em; margin: 1.2em 0 .3em; }
a { color: var(--observed); } p { margin: .5em 0; } .lede { color: var(--ink-2); }
nav.talkers, .orders { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 6px; }
nav.talkers { position: sticky; top: 0; z-index: 2; background: var(--paper); padding: 8px 0; border-bottom: 1px solid var(--rule); }
nav.talkers button, .orders button { font: inherit; font-size: .85em; padding: 3px 10px; border: 1px solid var(--rule); background: transparent; color: var(--ink); border-radius: 14px; cursor: pointer; }
nav.talkers button.on, .orders button.on { background: var(--observed); color: #fff; border-color: var(--observed); }
.who { color: var(--ink-2); } .verdict { font-weight: 600; }
svg.sketch { width: 100%; height: auto; display: block; margin: 8px 0; font-family: var(--serif); }
.sk-tick { font-size: 11px; fill: var(--ink-3); } .sk-axlab { font-size: 12px; fill: var(--ink-3); font-style: italic; } .sk-grid { stroke: var(--rule); }
.sk-pA { fill: var(--pA); } .sk-pB { fill: var(--pB); } .sk-pC { fill: var(--pC); }
.sk-chosen { fill: none; stroke: var(--observed); stroke-width: 2.5; } .sk-preset { fill: none; stroke: var(--ink-2); stroke-width: 1.5; stroke-dasharray: 4 3; }
.sk-thr { stroke: var(--ink-2); stroke-dasharray: 2 3; } .sk-tag { font-size: 11px; fill: var(--ink-2); } .sk-tag.on { fill: var(--observed); font-weight: 700; }
.legend { font-size: .85em; color: var(--ink-2); }
.lg { display: inline-block; width: 12px; height: 12px; vertical-align: -1px; margin: 0 5px 0 12px; }
.lg.pA { background: var(--pA); } .lg.pB { background: var(--pB); } .lg.pC { background: var(--pC); }
.lg.chosen { border: 2.5px solid var(--observed); } .lg.preset { border: 1.5px dashed var(--ink-2); }
.lg.trk { height: 0; border-top: 3px solid var(--observed); width: 18px; vertical-align: 3px; } .lg.ref { height: 0; border-top: 2px dashed var(--ink); width: 18px; vertical-align: 3px; }
.lg.nuc { background: rgba(42,120,214,.12); } .lg.dft { height: 0; border-top: 3px solid #aab2bb; width: 18px; vertical-align: 3px; }
table { border-collapse: collapse; font-size: .9em; margin: 10px 0; } th, td { border-top: 1px solid var(--rule); padding: 3px 14px 3px 0; text-align: left; }
table.scores tr.chosen td { font-weight: 700; color: var(--observed); } table.scores tr.preset td:first-child::after { content: " (default)"; font-weight: 400; color: var(--ink-3); }
details { margin: 8px 0; font-size: .9em; } summary { cursor: pointer; color: var(--ink-2); }
.tokens { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.tok figcaption { font-size: .85em; color: var(--ink-2); display: flex; justify-content: space-between; align-items: center; }
.tok .plot { position: relative; } .tok img { width: 100%; display: block; background: #fff; border: 1px solid var(--rule); }
.tok svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.tok button { font: inherit; font-size: .8em; border: 1px solid var(--rule); background: transparent; color: var(--ink); border-radius: 10px; padding: 0 8px; cursor: pointer; }
.scatter svg { max-width: 360px; width: 100%; }
.note { font-size: .85em; color: var(--ink-3); }
</style></head><body>
<p><a href="../">← Audapter report</a> · <a href="../voices-demo/">coAdapt with realistic voices</a></p>
<h1>How the LPC order was chosen for each simulated participant</h1>
<p class="lede">Before an experiment, a blab experimenter checks the order of Audapter's formant tracker (the LPC order).
The male/female setting, which the experimenter picks from the participant's apparent height, gives a default order (17 for male, 15 for female); the experimenter then opens the lab's LPC-check tool on a few pretest
recordings, tries orders 10 to 20, and keeps the one whose formant tracks follow the formants and whose vowels form tight,
separate clusters.</p>
<p class="lede">Our simulated experimenter does this with a fixed rule, written down before it was run. For each order it
scores three things: how far Audapter's F1 and F2 are from an independent Praat measurement over the middle of each
vowel (half the weight), how often the tracks jump (a quarter), and how spread out each vowel's cluster is relative to
the distance between vowels (a quarter). Like an experimenter, it keeps the default unless another order is clearly
better: at least 15% lower cost. The talkers are AI-generated voices (OpenAI gpt-audio-1.5) saying the pretest words of
the lab's coAdapt experiment.</p>
<p class="lede">Use this page to judge whether the choices look right: pick a talker, step through the orders, and compare the blue tracks with the grey default and the dashed Praat reference.</p>
<h2>All talkers</h2>
<table><tr><th>talker</th><th>male/female setting</th><th>default order</th><th>lowest-cost order</th><th>order used</th><th>best vs default</th><th>changed from default?</th></tr>{{SUMMARY}}</table>
<nav class="talkers">{{TABS}}</nav>
{{SECTIONS}}
<script>
var DATA = {{DATA}}, FMAX = 3500;
function el(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
function path(pts, i, w, h, dur) { var d = '', pen = false; pts.forEach(function (p) { var v = p[i]; if (v == null) { pen = false; return; }
  d += (pen ? 'L' : 'M') + (p[0] / dur * w).toFixed(1) + ',' + (h - v / FMAX * h).toFixed(1); pen = true; }); return d; }
function drawTokens(tid, o) {
  var box = document.getElementById(tid + '-tokens'); box.innerHTML = '';
  DATA[tid].tokens.forEach(function (tk) {
    var fig = document.createElement('figure'); fig.className = 'tok';
    fig.innerHTML = '<figcaption><span>trial ' + tk.trial + ' · “' + tk.word + '”</span><button type="button">play</button></figcaption><div class="plot"><img src="' + tk.img + '" alt=""></div>';
    var s = el('svg', { viewBox: '0 0 320 220', preserveAspectRatio: 'none' }), w = 320, h = 220;
    s.appendChild(el('rect', { x: tk.nucleus[0] / tk.dur * w, y: 0, width: (tk.nucleus[1] - tk.nucleus[0]) / tk.dur * w, height: h, fill: 'rgba(42,120,214,.07)' }));
    s.appendChild(el('rect', { x: tk.mid[0] / tk.dur * w, y: 0, width: (tk.mid[1] - tk.mid[0]) / tk.dur * w, height: h, fill: 'rgba(42,120,214,.12)' }));
    [1, 2].forEach(function (i) {
      s.appendChild(el('path', { d: path(tk.praat, i, w, h, tk.dur), fill: 'none', stroke: '#1d2530', 'stroke-width': 1.6, 'stroke-dasharray': '5 3', 'vector-effect': 'non-scaling-stroke' }));      if (String(o) !== String(DATA[tid].preset)) s.appendChild(el('path', { d: path(tk.tracks[DATA[tid].preset], i, w, h, tk.dur), fill: 'none', stroke: '#aab2bb', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }));
      s.appendChild(el('path', { d: path(tk.tracks[o], i, w, h, tk.dur), fill: 'none', stroke: '#2a78d6', 'stroke-width': 2.4, 'vector-effect': 'non-scaling-stroke' }));
    });
    fig.querySelector('.plot').appendChild(s);
    var au = new Audio(tk.wav); fig.querySelector('button').onclick = function () { au.currentTime = 0; au.play(); };
    box.appendChild(fig);
  });
  var sc = document.getElementById(tid + '-scatter'), pts = DATA[tid].scatter[o], W = 360, H = 260;
  var m = function (f) { return 1127.01048 * Math.log(1 + f / 700); };
  var all = []; Object.keys(DATA[tid].scatter).forEach(function (k) { DATA[tid].scatter[k].forEach(function (p) { all.push(p); }); });
  var x0 = Math.min.apply(null, all.map(function (p) { return m(p[2]); })) - 40, x1 = Math.max.apply(null, all.map(function (p) { return m(p[2]); })) + 40;
  var y0 = Math.min.apply(null, all.map(function (p) { return m(p[1]); })) - 40, y1 = Math.max.apply(null, all.map(function (p) { return m(p[1]); })) + 40;
  var s2 = el('svg', { viewBox: '0 0 ' + W + ' ' + H }); s2.appendChild(el('rect', { x: 30, y: 4, width: W - 34, height: H - 34, fill: 'none', stroke: '#dde2e7' }));
  var words = []; pts.forEach(function (p) { if (words.indexOf(p[0]) < 0) words.push(p[0]); });
  pts.forEach(function (p) {
    var cx = 30 + (x1 - m(p[2])) / (x1 - x0) * (W - 34), cy = 4 + (m(p[1]) - y0) / (y1 - y0) * (H - 34);
    s2.appendChild(el('circle', { cx: cx, cy: cy, r: 4.5, fill: '#2a78d6', 'fill-opacity': .75 }));
    var t = el('text', { x: cx + 7, y: cy + 4, 'font-size': 11, fill: '#4a5563' }); t.textContent = p[0]; s2.appendChild(t);
  });
  var a = el('text', { x: W - 4, y: H - 10, 'font-size': 11, 'text-anchor': 'end', fill: '#6f7985', 'font-style': 'italic' }); a.textContent = '← F2 (mel)   F1 (mel) ↓'; s2.appendChild(a);
  sc.innerHTML = ''; sc.appendChild(s2);
}
document.querySelectorAll('.orders').forEach(function (bar) {
  var tid = bar.dataset.t;
  bar.querySelectorAll('button').forEach(function (b) { b.onclick = function () {
    bar.querySelectorAll('button').forEach(function (o) { o.classList.toggle('on', o === b); }); drawTokens(tid, b.dataset.o); }; });
  drawTokens(tid, DATA[tid].chosen);
});
document.querySelectorAll('nav.talkers button').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('nav.talkers button').forEach(function (o) { o.classList.toggle('on', o === b); });
    document.querySelectorAll('section.talker').forEach(function (s) { s.hidden = s.id !== b.dataset.t; });
  });
});
</script>
</body></html>
"""

if __name__ == "__main__":
    build(sys.argv[1:])
