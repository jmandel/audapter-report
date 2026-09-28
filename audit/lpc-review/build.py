#!/usr/bin/env python3
"""Review page for the simulated LPC check: per talker, the formant tracks Audapter produces on the pretest tokens at
every LPC order (10-20) against an independent Praat track, the documented selection rule's scores (reimplemented here
from audit/labrun/README.md, "Participant setup: the LPC check"), and the order it picks versus the gender preset.

Inputs per talker: a labrun result dir (pretest trials, talker.json) and the per-order tracks written by
audit/harness/oct/lpc_orders.m (SCEN='<run dir>|lpc/<talker>'). Praat tracks come from the voice bank.
Usage: python3 audit/lpc-review/build.py audit/labrun/results/lpccheck/*/   (labrun's per-talker LPC-check records)
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
def load_check(d):
    """One talker's LPC-check record written by labrun (results/lpccheck/<talker>/check.json): the tool's own re-run
    tracks at every order, the Praat reference with its quality check, the rule's scores and decision."""
    c = json.load(open(os.path.join(d, "check.json")))
    toks = []
    for t in c["tokens"]:
        fs, x = wavfile.read(os.path.join(d, t["audio"])); x = x.astype(float) / (32768 if x.dtype == np.int16 else 1)
        n = len(t["audapter"][str(c["preset"])]["F1"]); tf = t["t0"] + np.arange(n) * t["frameLen"] / t["sr"]
        tracks = {int(o): np.column_stack([np.asarray(v["F1"], float), np.asarray(v["F2"], float)]) for o, v in t["audapter"].items()}
        pt = np.asarray(t["praat"]["t"], float)
        p1 = np.array([np.nan if v is None else v for v in t["praat"]["F1"]], float); p2 = np.array([np.nan if v is None else v for v in t["praat"]["F2"]], float)
        toks.append(dict(k=t["trial"], word=t["word"], x=x, sr=fs, nucleus=tuple(t["vowel_nucleus"]), tf=tf, tracks=tracks,
                         praat=(pt, p1, p2), qc=t["reference"].get("qc", ""), cost={int(o): v for o, v in t["per_token_cost"].items()}))
    return c, toks


def parts_of(o):
    A, B, C = o.get("A"), o.get("B") or 0.0, o.get("C")
    if A is None and C is None: return (0.0, o["cost"], 0.0)
    if A is None: return (0.0, 0.5 * B, 0.5 * C)
    if C is None: return (A * 0.5 / 0.75, B * 0.25 / 0.75, 0.0)
    return (0.5 * A, 0.25 * B, 0.25 * C)


def build(dirs):
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    tabs, sections, summary, data = [], [], [], {}
    for ti, d in enumerate(dirs):
        c, toks = load_check(os.path.normpath(d)); talker = c["talker"]; preset = int(c["preset"]); chosen = int(c["chosen"])
        nm = int(c["chosen_no_margin"]); wins, ntok = c.get("best_wins_tokens"), c.get("n_tokens")
        scores = {int(o): dict(v, parts=parts_of(v)) for o, v in c["orders"].items()}
        gain = 100 * (1 - scores[nm]["cost"] / scores[preset]["cost"])
        tid = f"t{ti}"; td = dict(orders=ORDERS, preset=preset, chosen=chosen, best=nm, tokens=[], scatter={},
                                  cost={o: round(scores[o]["cost"], 2) for o in ORDERS})
        for tok in toks:
            base = f"{tid}_{tok['k']:04d}"; t0, t1 = spectro_png(tok, os.path.join(OUT, "assets", base + ".png"))
            wavfile.write(os.path.join(OUT, "assets", base + ".wav"), tok["sr"], (np.clip(tok["x"], -1, 1) * 32767).astype(np.int16))
            pt, p1, p2 = tok["praat"]; ps = (pt >= t0) & (pt <= t1); tf = tok["tf"]; m = (tf >= t0) & (tf <= t1)
            trk = {o: [[round(float(a - t0), 4), round(float(f1), 1) if f1 > 0 else None, round(float(f2), 1) if f1 > 0 else None]
                       for a, f1, f2 in zip(tf[m], F[m, 0], F[m, 1])] for o, F in tok["tracks"].items()}
            a, b = tok["nucleus"]; q = (b - a) / 4
            td["tokens"].append(dict(err={o: (None if tok["cost"].get(o) is None else round(float(tok["cost"][o]), 1)) for o in ORDERS},
                                     qc=tok["qc"], img=f"assets/{base}.png", wav=f"assets/{base}.wav", word=tok["word"], trial=tok["k"], dur=t1 - t0,
                                     nucleus=[a - t0, b - t0], mid=[a + q - t0, b - q - t0],
                                     praat=[[round(float(u - t0), 4), None if np.isnan(v) else round(float(v), 1), None if np.isnan(w) else round(float(w), 1)]
                                            for u, v, w in zip(pt[ps], p1[ps], p2[ps])], tracks=trk))
        for o in ORDERS: td["scatter"][o] = [[p["word"], p["F1"], p["F2"]] for p in c["scatter"][str(o)]]
        td["sane"] = [o for o in ORDERS if scores[o]["cost"] <= 2 * scores[preset]["cost"]]
        data[tid] = td
        nA = [scores[o].get("nA") for o in ORDERS]
        rows = "".join(f'<tr class="{"chosen" if o == chosen else ""}{" preset" if o == preset else ""}"><td>{o}</td>'
                       f'<td>{"–" if v.get("A") is None else f"{v["A"]:.1f}"}</td><td>{v.get("B") or 0:.1f}</td>'
                       f'<td>{"–" if v.get("C") is None else f"{v["C"]:.1f}"}</td><td>{v["cost"]:.2f}</td></tr>' for o, v in scores.items())
        g = c.get("gender", "")
        dname = f"the {g} default ({preset})" if g else f"the default ({preset})"
        if chosen != preset:
            verdict = f"Switches from {dname} to order {chosen}: {gain:.0f}% lower cost, and better on {wins} of {ntok} tokens."
        elif nm == preset:
            verdict = f"Keeps {dname}: it has the lowest cost of all orders."
        else:
            why = []
            if scores[nm]["cost"] > MARGIN * scores[preset]["cost"]: why.append(f"only {gain:.0f}% lower cost (15% needed)")
            if wins is not None and ntok and wins < 2 * ntok / 3: why.append(f"better on only {wins} of {ntok} tokens (two thirds needed)")
            verdict = f"Keeps {dname}: order {nm} has the lowest cost, but " + " and ".join(why or ["not clearly enough"]) + "."
        nref = sum(1 for t in toks if t["qc"] == "ok")
        summary.append(f'<tr><td>{E(talker)}</td><td>{E(g)}</td><td>{preset}</td><td>{nm}</td><td>{gain:.0f}%</td>'
                       f'<td>{"–" if wins is None else f"{wins} of {ntok}"}</td><td><b>{chosen}</b></td><td>{"yes" if chosen != preset else "no"}</td>'
                       f'<td>{nref} of {len(toks)}</td></tr>')
        tabs.append(f'<button type="button" data-t="{tid}"{" class=on" if not tabs else ""}>{E(talker)}</button>')
        excluded = [f"trial {t['k']} “{t['word']}”: {t['qc']}" for t in toks if t["qc"] != "ok"]
        sections.append(f"""<section id="{tid}" class="talker"{'' if not sections else ' hidden'}>
<p class="who"><b>{E(talker)}</b> · {E(c.get('voice', ''))}; {E(g)}; study {E(c.get('study', ''))}.</p>
<p class="verdict">{E(verdict)}</p>
<h2>Why this order</h2>
<p>Each bar is one LPC order; its height is the rule's cost, built from three parts (legend below). The outlined bar
is the order used.{' The Praat reference passed its quality check on ' + str(nref) + ' of ' + str(len(toks)) + ' tokens; tokens that failed are left out of the tracking-error part.' if excluded else ''}</p>
{score_svg(scores, preset, chosen, nm)}
<p class="legend"><span class="lg pA"></span>tracking error against Praat <span class="lg pB"></span>track jumps
<span class="lg pC"></span>vowel-cluster spread <span class="lg chosen"></span>used <span class="lg preset"></span>default (from the male/female setting)</p>
<details><summary>Scores by order</summary><table class="scores"><tr><th>order</th><th>A, error %</th><th>B, jumps %</th><th>C, spread %</th><th>cost</th></tr>{rows}</table>
{'<p>References left out: ' + E('; '.join(excluded)) + '.</p>' if excluded else ''}</details>
<h2>Every order, every token</h2>
<p>Each row is one LPC order and each column one pretest token. Read down a column to see how one token is tracked as
the order changes, or along a row to see one order across all tokens. The number in each cell is that token's cost at
that order (lower is better; orange above 10); the last column shows the vowel clusters as the lab's tool plots them.
A column marked “no reference” is a token whose Praat reference failed its quality check.</p>
<p class="legend"><span class="lg trk"></span>Audapter's F1, F2 at that order <span class="lg ref"></span>Praat (independent reference)
<span class="lg nuc"></span>middle of the vowel (where accuracy is scored) <span class="lg chosen"></span>order used
<span class="lg preset"></span>default</p>
<div class="gridwrap"><table class="grid" id="{tid}-grid"></table></div>
<p class="note">Tracks are the ones the lab's LPC-check tool computed when the simulated experimenter selected each order.</p>
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
body { font: 17px/1.55 var(--serif); color: var(--ink); background: var(--paper); max-width: 1060px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.55em; line-height: 1.2; margin: .3em 0; } h2 { font-size: 1.15em; margin: 1.6em 0 .4em; } h3 { font-size: 1em; margin: 1.2em 0 .3em; }
a { color: var(--observed); } p { margin: .5em 0; } .lede { color: var(--ink-2); } .preview { border-left: 3px solid #eb6834; padding: 6px 10px; background: rgba(235,104,52,.08); font-size: .92em; }
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
.gridwrap { overflow-x: auto; margin: 8px -16px; padding: 0 16px; }
table.grid { border-collapse: separate; border-spacing: 3px; font-size: .78em; }
table.grid th, table.grid td { border: none; padding: 0; vertical-align: middle; }
table.grid thead th { text-align: center; font-weight: 400; color: var(--ink-2); padding-bottom: 2px; white-space: nowrap; }
table.grid thead button { font: inherit; border: 1px solid var(--rule); background: transparent; color: var(--ink); border-radius: 10px; padding: 0 6px; margin-left: 4px; cursor: pointer; }
table.grid td.lab { padding: 0 8px 0 4px; white-space: nowrap; text-align: right; line-height: 1.25; position: sticky; left: 0; z-index: 1; background: var(--paper); }
table.grid td.lab b { font-size: 1.25em; } table.grid td.lab .tag { display: block; color: var(--ink-3); } table.grid tr.used td.lab .tag { color: var(--observed); font-weight: 700; }
table.grid .cell { position: relative; width: 118px; height: 81px; } table.grid .cell img { width: 100%; height: 100%; display: block; background: #fff; }
table.grid .cell svg { position: absolute; inset: 0; width: 100%; height: 100%; }
table.grid .cell .e { position: absolute; right: 2px; top: 1px; font-size: 10.5px; background: rgba(255,255,255,.85); color: #1d2530; padding: 0 2px; border-radius: 2px; }
table.grid .cell .e.hi { color: #fff; background: #eb6834; }
table.grid tr.used .cell, table.grid tr.used .vw { outline: 2.5px solid var(--observed); }
table.grid tr.dflt .cell, table.grid tr.dflt .vw { outline: 1.5px dashed var(--ink-2); }
.noref { color: #eb6834; font-size: .9em; } table.grid .vw { width: 96px; height: 81px; background: var(--paper); border: 1px solid var(--rule); display: block; }
.note { font-size: .85em; color: var(--ink-3); }
</style></head><body>
<p><a href="../">← Audapter report</a> · <a href="../voices-demo/">coAdapt with realistic voices</a></p>
<h1>How the LPC order was chosen for each simulated participant</h1>
<p class="lede">Before an experiment, a blab experimenter checks the order of Audapter's formant tracker (the LPC order).
The male/female setting, which the experimenter picks from the participant's apparent height, gives a default order (17 for male, 15 for female); the experimenter then opens the lab's LPC-check tool on a few pretest
recordings, tries orders 10 to 20, and keeps the one whose formant tracks follow the formants and whose vowels form tight,
separate clusters.</p>
<p class="lede">Our simulated experimenter does this with a fixed rule, written down before it was run. For each order
it scores three things: how far Audapter's F1 and F2 are from an independent Praat measurement over the middle of each
vowel (half the weight), how often the tracks jump (a quarter), and how spread out each vowel's cluster is relative to
the distance between vowels (a quarter). Praat measurements are used only if they pass a quality check (two Praat
settings agree, and the values are plausible for the vowel). Like an experimenter, it keeps the default unless another
order is clearly better: at least 15% lower cost, and better on at least two thirds of the tokens. The talkers are
AI-generated voices (OpenAI gpt-audio-1.5) saying the pretest words of the lab's coAdapt experiment; the lab's own
LPC-check tool computes every track.</p>
<p class="lede">Use this page to judge whether the choices look right: pick a talker and scan the grid of every order against every token, comparing the blue tracks with the dashed Praat reference.</p>
<h2>All talkers</h2>
<div class="gridwrap"><table><tr><th>talker</th><th>male/female setting</th><th>default order</th><th>lowest-cost order</th><th>its cost vs default</th><th>better on tokens</th><th>order used</th><th>changed?</th><th>usable references</th></tr>{{SUMMARY}}</table></div>
<p class="preview"><b>Preview.</b> This covers the coAdapt pretest for eight AI-generated voices. The rule was revised
twice before this run, for stated reasons: a quality check on the Praat reference (it mistracks some tokens), and the
two-thirds-of-tokens condition (a 15% margin alone is easy to meet when every good order scores near zero). Other studies
and a validation on real recordings are in progress.</p>
<nav class="talkers">{{TABS}}</nav>
{{SECTIONS}}
<script>
var DATA = {{DATA}}, FMAX = 3500;
function el(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
function path(pts, i, w, h, dur) { var d = '', pen = false; pts.forEach(function (p) { var v = p[i]; if (v == null) { pen = false; return; }
  d += (pen ? 'L' : 'M') + (p[0] / dur * w).toFixed(1) + ',' + (h - v / FMAX * h).toFixed(1); pen = true; }); return d; }
function m(f) { return 1127.01048 * Math.log(1 + f / 700); }
function drawGrid(tid) {
  var D = DATA[tid], g = document.getElementById(tid + '-grid'), w = 118, h = 81;
  var head = '<thead><tr><th></th>' + D.tokens.map(function (tk, j) { return '<th title="' + (tk.qc === 'ok' ? '' : 'Praat reference left out: ' + tk.qc) + '">“' + tk.word + '”<button type="button" data-j="' + j + '">play</button>' + (tk.qc === 'ok' ? '' : '<br><span class="noref">no reference</span>') + '</th>'; }).join('') + '<th>vowels</th></tr></thead>';
  g.innerHTML = head + '<tbody></tbody>';
  var audios = D.tokens.map(function (tk) { return new Audio(tk.wav); });
  g.querySelectorAll('thead button').forEach(function (b) { b.onclick = function () { var a = audios[+b.dataset.j]; a.currentTime = 0; a.play(); }; });
  // vowel-plot axes fitted to the orders that track sensibly
  var all = []; D.sane.forEach(function (k) { D.scatter[k].forEach(function (p) { all.push(p); }); });
  var x0 = Math.min.apply(null, all.map(function (p) { return m(p[2]); })) - 40, x1 = Math.max.apply(null, all.map(function (p) { return m(p[2]); })) + 40;
  var y0 = Math.min.apply(null, all.map(function (p) { return m(p[1]); })) - 40, y1 = Math.max.apply(null, all.map(function (p) { return m(p[1]); })) + 40;
  var tb = g.querySelector('tbody');
  D.orders.forEach(function (o) {
    var tr = document.createElement('tr'); if (o === D.chosen) tr.className = 'used'; else if (o === D.preset) tr.className = 'dflt';
    var tags = []; if (o === D.chosen) tags.push('used'); if (o === D.preset) tags.push('default'); if (o === D.best && o !== D.chosen) tags.push('lowest cost');
    tr.innerHTML = '<td class="lab"><b>' + o + '</b><span class="tag">' + (tags.join(', ') || '&nbsp;') + '</span><span class="tag">cost ' + D.cost[o].toFixed(1) + '</span></td>';
    D.tokens.forEach(function (tk) {
      var td = document.createElement('td'), c = document.createElement('div'); c.className = 'cell';
      c.innerHTML = '<img src="' + tk.img + '" alt="" loading="lazy">';
      var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none' });
      s.appendChild(el('rect', { x: tk.mid[0] / tk.dur * w, y: 0, width: (tk.mid[1] - tk.mid[0]) / tk.dur * w, height: h, fill: 'rgba(42,120,214,.13)' }));
      [1, 2].forEach(function (i) {
        s.appendChild(el('path', { d: path(tk.praat, i, w, h, tk.dur), fill: 'none', stroke: tk.qc === 'ok' ? '#1d2530' : '#aab2bb', 'stroke-width': 1.1, 'stroke-dasharray': '3 2' }));
        s.appendChild(el('path', { d: path(tk.tracks[o], i, w, h, tk.dur), fill: 'none', stroke: '#2a78d6', 'stroke-width': 1.8 }));
      });
      c.appendChild(s);
      var e = tk.qc === 'ok' ? tk.err[o] : null; if (tk.qc !== 'ok') { var sp0 = document.createElement('span'); sp0.className = 'e'; sp0.textContent = '–'; sp0.title = 'no usable reference for this token'; c.appendChild(sp0); } if (e != null) { var sp = document.createElement('span'); sp.className = 'e' + (e > 10 ? ' hi' : ''); sp.textContent = e < 10 ? e.toFixed(1) : e.toFixed(0); c.appendChild(sp); }
      td.appendChild(c); tr.appendChild(td);
    });
    var tv = document.createElement('td'), sv = el('svg', { viewBox: '0 0 96 81', 'class': 'vw' });
    D.scatter[o].forEach(function (p) {
      var cx = 6 + (x1 - m(p[2])) / (x1 - x0) * 70, cy = 5 + (m(p[1]) - y0) / (y1 - y0) * 70;
      if (cx < 0 || cx > 96 || cy < 0 || cy > 81) return;
      sv.appendChild(el('circle', { cx: cx, cy: cy, r: 2.6, fill: '#2a78d6', 'fill-opacity': .8 }));
      var t = el('text', { x: cx + 3.5, y: cy + 3, 'font-size': 7.5, fill: '#4a5563' }); t.textContent = p[0]; sv.appendChild(t);
    });
    tv.appendChild(sv); tr.appendChild(tv); tb.appendChild(tr);
  });
}
Object.keys(DATA).forEach(drawGrid);
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
    build([d for d in sys.argv[1:] if os.path.exists(os.path.join(d, "check.json"))])
