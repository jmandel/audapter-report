#!/usr/bin/env python3
"""Standalone page: the lab's public coAdapt experiment run unmodified in labrun, with a virtual participant speaking
each trial's word. Per talker: the session as run (programmed vs applied F1 shift and heard level, trial by trial, in
the report's expected/observed language), a hold-phase summary, then one trial per phase and word with spoken and
heard audio, spectrograms, formant tracks and a one-line measurement.

Usage: python3 audit/voices-demo/build.py [run_dir ...]
  run_dir: a labrun result directory (results/<plan>/ or results/<plan>_voices/<talker>/); default: every
  results/coAdapt_voices/*/ that exists, else results/coAdapt/ (the synthetic participant).
Writes audit/voices-demo/dist/ (index.html + assets/), staged to docs/voices-demo/ by audit/publish/stage.sh.
"""
import csv, glob, html, json, os, re, sys
import numpy as np
import scipy.io as sio
import scipy.io.wavfile as wavfile
import scipy.signal as sg
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
LR = os.path.join(HERE, "..", "labrun")
OUT = os.path.join(HERE, "dist")
E = html.escape
# the report's colour roles: input grey, expected = hollow ink outline, observed blue, discrepancy orange
C = dict(input="#aab2bb", ink="#1d2530", ink2="#4a5563", ink3="#6f7985", rule="#dde2e7", observed="#2a78d6",
         disc="#eb6834", context="#e8ebee")
PHASES = ["noShift", "baseline", "ramp", "hold", "washout"]
SHIFT_TOL_MEL, LEVEL_TOL_DB = 25.0, 1.0


def mel(f):
    return 1127.01048 * np.log(1 + np.asarray(f, float) / 700)


def num(row, key):
    try:
        v = float(row.get(key, "nan"))
        return v if np.isfinite(v) else None
    except (ValueError, TypeError):
        return None


def programmed(row):
    m = re.search(r"shiftMags=(-?[0-9.]+)", row.get("shiftInfo", "") or "")
    return float(m.group(1)) if m else 0.0


# ---------------------------------------------------------------------------------------------------- data
def load_trial(run, k):
    r = sio.loadmat(os.path.join(run, "trials", f"{k:04d}.mat"), squeeze_me=True, struct_as_record=False)["rec"]
    D = np.asarray(r.dataMat, float); nT = int(r.nTracks); o = 4
    fm = D[:, o:o + nT]; o2 = o + 2 * nT + 2; sf = D[:, o2:o2 + 2]
    sc = float(getattr(r.params, "scale", 1.0)) if hasattr(r.params, "scale") else 1.0
    v = getattr(r, "signalOutVoice", None)
    v = None if v is None or np.size(v) < 2 else np.asarray(v, float) * sc
    return dict(sr=int(r.sr), fl=int(r.frameLen), x=np.asarray(r.signalIn, float), y=np.asarray(r.signalOut, float) * sc, v=v,
                fm=fm, sf=sf, word=str(r.ctx.word), cond=str(r.ctx.cond), inputDesc=str(r.inputDesc), params=r.params)


def summary_rows(run):
    with open(os.path.join(run, "summary.tsv")) as f:
        return [row for row in csv.DictReader(f, delimiter="\t") if row.get("mode") == "proc"]


def applied_shift_mel(row):
    """F1 shift Audapter applied (its own log: target minus tracked F1, median over the shifted frames); 0 if none."""
    return num(row, "shift_F1_mel") or 0.0


def lpc_formants(x, sr, hop, order=12):
    """Autocorrelation-LPC track of F1, F2 (one per hop). Used only on the clean heard voice (no masking noise)."""
    fs = 10000; y = sg.resample_poly(x, fs, sr); y = np.append(y[0], y[1:] - 0.97 * y[:-1])
    w = int(0.025 * fs); h = max(1, int(round(hop * fs))); win = np.hamming(w)
    n = max(0, (len(y) - w) // h + 1); F = np.full((n, 2), np.nan); t = (np.arange(n) * h + w / 2) / fs
    for i in range(n):
        s = y[i*h:i*h+w] * win; r = np.correlate(s, s, "full")[w-1:w+order+1]
        if r[0] < 1e-8: continue
        try: a = np.linalg.solve(np.array([[r[abs(p-q)] for q in range(order)] for p in range(order)]), -r[1:order+1])
        except np.linalg.LinAlgError: continue
        ro = np.roots(np.r_[1, a]); ro = ro[np.imag(ro) > 0]
        f = np.angle(ro) * fs / (2 * np.pi); bw = -np.log(np.abs(ro)) * fs / np.pi
        f = np.sort(f[(f > 200) & (f < 4000) & (bw < 400)])
        if len(f) >= 2: F[i] = f[:2]
    return t, F


def replay_ok(t):
    """Use the voice-only replay only if the heard mix minus the replay is pure masking noise: no trace of the voice
    (regression of the residual on the replay |beta| < 0.03, i.e. under ~0.25 dB of gain difference) and no louder than the noise alone before the word (+2 dB; babble is not steady, so quieter is fine). Audapter's
    own checks (identical input and formant logs) are made when the replay is recorded."""
    v, y, x, sr = t["v"], t["y"], t["x"], t["sr"]
    if v is None: return False
    n = min(len(v), len(y)); v, y = v[:n], y[:n]; res = y - v
    W = int(0.02 * sr); env = np.sqrt(np.convolve(x[:n] ** 2, np.ones(W) / W, "same")); voiced = env > env.max() * 0.1
    first = np.argmax(voiced); quiet = slice(0, max(W, first - W))
    if voiced.sum() < W or first < 3 * W: return False
    beta = np.dot(res[voiced], v[voiced]) / (np.dot(v[voiced], v[voiced]) + 1e-12)   # fraction of the voice left in the residual
    lv = 20 * np.log10(np.sqrt(np.mean(res[voiced] ** 2)) / (np.sqrt(np.mean(y[quiet] ** 2)) + 1e-12))
    return bool(abs(beta) < 0.03 and lv < 2.0)


def measured_shift(t):
    """F1 shift measured independently: LPC on the clean heard voice minus LPC on the spoken signal, over the frames
    Audapter shifted (or all tracked frames). None without a clean heard voice."""
    if not replay_ok(t): return None, None
    sr, fl = t["sr"], t["fl"]; tf = (np.arange(len(t["fm"])) + 0.5) * fl / sr; ok = t["fm"][:, 0] > 0
    sh = ok & (t["sf"][:, 0] > 0) & (np.abs(t["sf"][:, 0] - t["fm"][:, 0]) > 0.5); sel = sh if sh.any() else ok
    ti, Fi = lpc_formants(t["x"], sr, fl / sr); to, Fo = lpc_formants(t["v"], sr, fl / sr); n = min(len(Fi), len(Fo))
    m = np.interp(ti[:n], tf, sel.astype(float)) > 0.5
    d = mel(Fo[:n][m, 0]) - mel(Fi[:n][m, 0])
    return (float(np.nanmedian(d)) if np.isfinite(d).any() else None), (to, Fo)


# ---------------------------------------------------------------------------------------------------- SVG charts
W = 760
X0, X1 = 150, W - 12


def svg(h, body, label):
    return f'<svg class="sketch" viewBox="0 0 {W} {h}" role="img" aria-label="{E(label)}">{body}</svg>'


def phase_strip(rows, y):
    n = len(rows); runs = []
    for i, r in enumerate(rows):
        if not runs or runs[-1][0] != r["cond"]: runs.append([r["cond"], i, i])
        else: runs[-1][2] = i
    out = [f'<text class="sk-lab" x="{X0 - 10}" y="{y + 17}" text-anchor="end">phase</text>']
    for c, a, b in runs:
        xa, xb = X0 + a * (X1 - X0) / n, X0 + (b + 1) * (X1 - X0) / n
        out.append(f'<rect x="{xa + 1:.1f}" y="{y + 2}" width="{max(xb - xa - 2, 1):.1f}" height="22" rx="2" class="sk-context"/>')
        if xb - xa > 46: out.append(f'<text class="sk-in" x="{(xa + xb) / 2:.1f}" y="{y + 17}" text-anchor="middle">{E(c)}</text>')
    return "".join(out)


def dots_panel(rows, words, value, expected, lo, hi, grid, gridlab, sub, tol, tip):
    """One row per word: expected (dashed ink step line) and observed dots, orange where they differ by more than tol."""
    n = len(rows); x = lambda i: X0 + (i + 0.5) * (X1 - X0) / n; half = (X1 - X0) / n / 2
    H = 64; out = [phase_strip(rows, 4)]; y = 36
    yy = lambda v: y + H - 5 - (min(max(v, lo), hi) - lo) / (hi - lo) * (H - 10)
    for w in words:
        idx = [i for i, r in enumerate(rows) if r["word"] == w]
        out.append(f'<rect class="sk-frame" x="{X0}" y="{y}" width="{X1 - X0}" height="{H}"/>')
        for g in grid:
            out.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{yy(g):.1f}" y2="{yy(g):.1f}"/>'
                       f'<text class="sk-tick" x="{X0 + 3}" y="{yy(g) - 3:.1f}">{gridlab(g)}</text>')
        out.append(f'<text class="sk-lab" x="{X0 - 10}" y="{y + H / 2}" text-anchor="end">“{E(w)}”</text>'
                   f'<text class="sk-sub" x="{X0 - 10}" y="{y + H / 2 + 16}" text-anchor="end">{sub}</text>')
        d = "".join(f'{"M" if j == 0 else "L"}{x(i) - half:.1f},{yy(expected(rows[i])):.1f}L{x(i) + half:.1f},{yy(expected(rows[i])):.1f}'
                    for j, i in enumerate(idx))
        out.append(f'<path class="sk-line-expected" d="{d}"/>')
        for i in idx:
            v = value(rows[i])
            if v is None: continue
            cls = "sk-disc" if abs(v - expected(rows[i])) > tol else "sk-observed"
            out.append(f'<circle class="{cls}" cx="{x(i):.1f}" cy="{yy(v):.1f}" r="3.6"><title>{E(tip(rows[i], v))}</title></circle>')
        y += H + 8
    out.append(f'<text class="sk-axlab" x="{X1}" y="{y + 8}" text-anchor="end">trials in session order</text>')
    return svg(y + 14, "".join(out), sub)


# ---------------------------------------------------------------------------------------------------- trial figure
def trial_png(t, path, prog, meas=None):
    sr, fl = t["sr"], t["fl"]; x, y = t["x"], t["y"]; T = len(x) / sr
    tf = (np.arange(len(t["fm"])) + 0.5) * fl / sr
    fig, axs = plt.subplots(2, 1, figsize=(7.4, 3.9), sharex=True, gridspec_kw=dict(hspace=0.08))
    vmax = 20 * np.log10(max(np.abs(x).max(), np.abs(y).max(), 1e-6))
    ok = t["fm"][:, 0] > 0
    sh = (t["sf"][:, 0] > 0) & ok & ((np.abs(t["sf"][:, 0] - t["fm"][:, 0]) > 0.5) | (np.abs(t["sf"][:, 1] - t["fm"][:, 1]) > 0.5))
    for ax, sig, lab in ((axs[0], x, "spoken (into Audapter)"), (axs[1], y, "heard")):
        ax.specgram(sig + 1e-7, NFFT=int(0.032 * sr), Fs=sr, noverlap=int(0.028 * sr), cmap="Greys", vmin=vmax - 100, vmax=vmax - 25)
        ax.set_ylim(0, 3500); ax.set_ylabel("Hz", fontsize=8)
        ax.text(0.01, 0.93, lab, transform=ax.transAxes, fontsize=8.5, va="top", family="serif",
                bbox=dict(fc="white", ec="none", alpha=0.85, pad=1.5))
        if sh.any(): ax.axvspan(tf[sh][0] - fl / sr / 2, tf[sh][-1] + fl / sr / 2, color=C["context"], alpha=0.6, lw=0, zorder=0.5)
    fmn = np.where(ok[:, None], t["fm"][:, :2], np.nan)
    for j in (0, 1):
        axs[0].plot(tf, fmn[:, j], "-", lw=1.8, color=C["ink2"], label="spoken F1, F2 (Audapter's track)" if j == 0 else None)
    m2h = lambda m: (np.exp(m / 1127.01048) - 1) * 700
    exp_ = fmn.copy(); exp_[:, 0] = m2h(mel(fmn[:, 0]) + prog)                  # expected: spoken F1 moved by the programmed shift
    obs = np.where(sh[:, None], t["sf"], t["fm"][:, :2]); obs[~ok] = np.nan    # observed: the formants Audapter produced (its log)
    for j in (0, 1):
        axs[1].plot(tf, obs[:, j], "-", lw=1.6, color=C["observed"], alpha=0.75, zorder=3, label="observed (Audapter's output formants)" if j == 0 else None)
        axs[1].plot(tf, exp_[:, j], "--", lw=1.4, color=C["ink"], zorder=4, label="expected (spoken + programmed shift)" if j == 0 else None)
        if meas is not None:
            to, Fo = meas; keep = np.interp(to, tf, ok.astype(float)) > 0.5
            axs[1].plot(to[::4], np.where(keep, Fo[:, j], np.nan)[::4], "o", ms=3.6, mfc="white", mew=0.9, color="#17457f", zorder=5,
                        label="measured independently" if j == 0 else None)
    for ax in axs:
        ax.legend(loc="upper right", markerscale=2.5, framealpha=0.9, prop=dict(family="serif", size=7.5))
        ax.tick_params(labelsize=7.5)
    axs[1].set_xlim(0, T); axs[1].set_xlabel("time in trial (s)", fontsize=8)
    fig.savefig(path, dpi=110, bbox_inches="tight"); plt.close(fig)


def write_wav(path, x, sr):
    wavfile.write(path, sr, (np.clip(x, -1, 1) * 32767).astype(np.int16))


# ---------------------------------------------------------------------------------------------------- page
def pick_trials(rows):
    """One trial per (phase, word), in session order."""
    seen, out = set(), []
    for r in rows:
        key = (r["cond"], r["word"])
        if key not in seen: seen.add(key); out.append(r)
    return out


def talker_label(run, first_desc):
    meta = os.path.join(run, "talker.json")
    if os.path.exists(meta): return json.load(open(meta))
    if first_desc.startswith("synth "):
        return dict(name="Klatt synthesizer", kind="synthetic",
                    note="The harness's default participant: one synthetic vowel per syllable, with textbook formants.")
    return dict(name=os.path.basename(os.path.normpath(run)), kind="voice", note="")


def settings_html(p):
    def g(k, d="–"):
        v = getattr(p, k, d)
        try: v = float(v); return f"{v:g}" if abs(v) < 1 else f"{v:.0f}" if v == int(v) else f"{v:.3g}"
        except (TypeError, ValueError): return v
    fb = g("fb"); items = [
        ("Sampling rate", f'{g("srate")} Hz'), ("Frame length", f'{g("framelen")} samples'), ("LPC order", g("nlpc")),
        ("Formant shift", "on, in mel, by region of the F1–F2 plane" if g("bshift", 0) == "1" and g("bmelshift", 0) == "1" else g("bshift")),
        ("Gain adaptation (bGainAdapt)", g("bgainadapt")), ("Feedback mode", f"{fb} (voice plus masking noise)" if fb == "3" else fb),
        ("Output scale (dScale)", f'{float(g("scale")):.4f}')]
    return "<dl class=settings>" + "".join(f"<dt>{E(str(a))}</dt><dd>{E(str(b))}</dd>" for a, b in items) + "</dl>"


def build(runs):
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    tabs, sections = [], []
    for ti, run in enumerate(runs):
        rows = summary_rows(run)
        if not rows: continue
        tid = f"t{ti}"; words = list(dict.fromkeys(r["word"] for r in rows if r["cond"] != "noShift"))
        main = [r for r in rows if r["cond"] != "noShift"]
        ref_l = [num(r, "gain_dB") for r in main if programmed(r) == 0 and num(r, "gain_dB") is not None]
        ref = float(np.median(ref_l)) if ref_l else 0.0
        f1chart = dots_panel(main, words, applied_shift_mel, programmed, -180, 180, (-125, 0, 125), lambda g: f"{g:+d}" if g else "0",
                             "F1 shift, mel", SHIFT_TOL_MEL,
                             lambda r, v: f'trial {r["itrial"]} ({r["cond"]}): programmed {programmed(r):+.0f} mel, applied {v:+.0f} mel')
        levchart = dots_panel(main, words, lambda r: (num(r, "gain_dB") - ref) if num(r, "gain_dB") is not None else None, lambda r: 0.0,
                              -7, 7, (-5, 0, 5), lambda g: f"{g:+d}" if g else "0", "level, dB", LEVEL_TOL_DB,
                              lambda r, v: f'trial {r["itrial"]} ({r["cond"]}): {v:+.1f} dB relative to unshifted trials')
        summ = []
        for w in words:
            hw = [r for r in main if r["cond"] == "hold" and r["word"] == w]
            hs = [applied_shift_mel(r) for r in hw]
            lv = [num(r, "gain_dB") - ref for r in hw if num(r, "gain_dB") is not None]
            if not hw or not hs or not lv: continue
            pr = float(np.median([programmed(r) for r in hw]))
            mm = [m for m in (measured_shift(load_trial(run, int(r["k"])))[0] for r in hw) if m is not None]
            mcol = f"<td>{np.median(mm):+.0f} mel</td>" if mm else "<td>–</td>" 
            summ.append(f'<tr><td>“{E(w)}”</td><td>{"none" if pr == 0 else f"F1 {pr:+.0f} mel"}</td><td>{np.median(hs):+.0f} mel</td>'
                        f'{mcol}<td>{np.median(lv):+.1f} dB</td><td>{len(hw)}</td></tr>')
        cards, first = [], None
        for r in pick_trials(main):
            k = int(r["k"]); t = load_trial(run, k); first = first or t["inputDesc"]; base = f"{tid}_{k:04d}"
            write_wav(os.path.join(OUT, "assets", base + "_in.wav"), t["x"], t["sr"])
            write_wav(os.path.join(OUT, "assets", base + "_out.wav"), t["y"], t["sr"])
            ms, mtrack = measured_shift(t)
            trial_png(t, os.path.join(OUT, "assets", base + ".png"), programmed(r), mtrack)
            pr = programmed(r); hs = applied_shift_mel(r); lv = num(r, "gain_dB")
            ok = t["fm"][:, 0] > 0; sh = ok & (t["sf"][:, 0] > 0) & (np.abs(t["sf"][:, 0] - t["fm"][:, 0]) > 0.5)
            fi = float(np.median(t["fm"][sh if sh.any() else ok, 0])) if ok.any() else None
            fo = float(np.median(t["sf"][sh, 0])) if sh.any() else fi
            stat = (f"F1 {fi:.0f} Hz spoken, {fo:.0f} Hz heard: Audapter shifted it {hs:+.0f} mel" if sh.any() else
                    (f"F1 {fi:.0f} Hz, not shifted" if fi else "No voice tracked"))
            stat += f' (programmed: {"no shift" if pr == 0 else f"{pr:+.0f} mel"})'
            stat += f"; measured independently {ms:+.0f} mel." if ms is not None else "." 
            if lv is not None: stat += f" Heard level {lv - ref:+.1f} dB relative to unshifted trials."
            flag = (hs is not None and abs(hs - pr) > SHIFT_TOL_MEL) or (lv is not None and abs(lv - ref) > LEVEL_TOL_DB)
            cards.append(f"""
<figure class="trial">
  <figcaption><span class="tn">trial {E(r['itrial'])}</span> <b>{E(r['cond'])}</b> · “{E(r['word'])}”</figcaption>
  <img src="assets/{base}.png" alt="Spectrograms of trial {E(r['itrial'])}, spoken and heard, with formant tracks" loading="lazy">
  <div class="audio">
    <label><span class="role input">spoken</span><audio controls preload="none" src="assets/{base}_in.wav"></audio></label>
    <label><span class="role observed">heard</span><audio controls preload="none" src="assets/{base}_out.wav"></audio></label>
  </div>
  <p class="meas{' flag' if flag else ''}">{E(stat)}</p>
</figure>""")
        who = talker_label(run, first or "")
        tabs.append(f'<button type="button" data-t="{tid}"{" class=on" if not tabs else ""}>{E(who["name"])}</button>')
        sections.append(f"""<section id="{tid}" class="talker"{'' if not sections else ' hidden'}>
<p class="who"><b>{E(who['name'])}</b> · {E(who.get('kind', ''))}. {E(who.get('note', ''))}</p>
<h2>The session, trial by trial</h2>
<p>Each dot is one trial. First, the F1 shift Audapter applied to each word, against the shift the experiment
programmed for it:</p>
{f1chart}
<p>Then how loud their voice was in the headphones, relative to the trials with no shift:</p>
{levchart}
<p class="legend"><span class="lg exp"></span>expected <span class="lg obs"></span>observed
<span class="lg disc"></span>differs from expected by more than {SHIFT_TOL_MEL:.0f} mel or {LEVEL_TOL_DB:.0f} dB</p>
<table class="hold"><caption>Hold phase (full-strength shift), medians</caption>
<tr><th>word</th><th>programmed</th><th>F1 shift applied</th><th>measured independently</th><th>heard level vs unshifted</th><th>trials</th></tr>
{''.join(summ)}</table>
<details><summary>Audapter settings used</summary>{settings_html(load_trial(run, int(main[0]['k']))['params'])}</details>
<h2>Individual trials</h2>
<p>One trial per phase and word. In each figure, the top panel is what the participant said and the bottom panel what
they heard; the grey band marks where Audapter shifted the formants. The solid blue formants are
the ones Audapter logged producing. The hollow circles are an independent measurement of the
heard formants (taken with the masking noise removed); on higher voices, whose harmonics are widely spaced, expect it to
scatter by some tens of mel.</p>
{''.join(cards)}
</section>""")
    page = TEMPLATE.replace("{{TABS}}", "".join(tabs)).replace("{{SECTIONS}}", "\n".join(sections))
    open(os.path.join(OUT, "index.html"), "w").write(page)
    print(f"voices-demo: {len(sections)} talkers -> {OUT}")


TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>coAdapt run with realistic voices · Audapter report</title>
<style>
:root { --paper:#fff; --ink:#1d2530; --ink-2:#4a5563; --ink-3:#6f7985; --rule:#dde2e7; --observed:#2a78d6; --context:#e8ebee; --disc:#eb6834;
  --serif: "Charis SIL", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif; }
@media (prefers-color-scheme: dark) { :root { --paper:#15181c; --ink:#e7eaee; --ink-2:#b9c1ca; --ink-3:#8f99a4; --rule:#2e353d;
  --observed:#3987e5; --context:#2a3037; --disc:#d95926; } }
body { font: 17px/1.55 var(--serif); color: var(--ink); background: var(--paper); max-width: 820px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.55em; line-height: 1.2; margin: 0.3em 0; } h2 { font-size: 1.15em; margin: 1.6em 0 0.4em; }
a { color: var(--observed); } p { margin: 0.5em 0; } .lede { color: var(--ink-2); }
nav.talkers { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 4px; position: sticky; top: 0; z-index: 2; background: var(--paper); padding: 8px 0; border-bottom: 1px solid var(--rule); }
nav.talkers button { font: inherit; font-size: 0.85em; padding: 3px 11px; border: 1px solid var(--rule); background: transparent; color: var(--ink); border-radius: 14px; cursor: pointer; }
nav.talkers button.on { background: var(--observed); color: #fff; border-color: var(--observed); }
.who { color: var(--ink-2); }
svg.sketch { width: 100%; height: auto; display: block; margin: 8px 0; font-family: var(--serif); }
.sk-lab { font-size: 14px; font-weight: 600; fill: var(--ink); } .sk-sub { font-size: 12px; fill: var(--ink-3); }
.sk-tick { font-size: 11px; fill: var(--ink-3); } .sk-in { font-size: 12.5px; fill: var(--ink-2); } .sk-axlab { font-size: 12px; fill: var(--ink-3); font-style: italic; }
.sk-frame { fill: none; stroke: var(--rule); } .sk-grid { stroke: var(--rule); } .sk-context { fill: var(--context); }
.sk-line-expected { fill: none; stroke: var(--ink-2); stroke-width: 1.6; stroke-dasharray: 5 3; }
.sk-observed { fill: var(--observed); } .sk-disc { fill: var(--disc); }
.legend { font-size: 0.85em; color: var(--ink-2); }
.lg { display: inline-block; width: 11px; height: 11px; border-radius: 50%; vertical-align: -1px; margin: 0 5px 0 14px; }
.lg.exp { border-radius: 0; height: 0; width: 18px; border-top: 2px dashed var(--ink-2); vertical-align: 3px; margin-left: 0; }
.lg.obs { background: var(--observed); } .lg.disc { background: var(--disc); }
table.hold { border-collapse: collapse; font-size: 0.9em; margin: 14px 0; }
table.hold caption { text-align: left; font-weight: 600; margin-bottom: 4px; }
table.hold th, table.hold td { border-top: 1px solid var(--rule); padding: 3px 14px 3px 0; text-align: left; }
details { margin: 10px 0; font-size: 0.9em; } summary { cursor: pointer; color: var(--ink-2); }
dl.settings { display: grid; grid-template-columns: max-content 1fr; gap: 2px 14px; margin: 8px 0; } dl.settings dt { color: var(--ink-3); } dl.settings dd { margin: 0; }
figure.trial { margin: 20px 0; padding-top: 10px; border-top: 1px solid var(--rule); }
figcaption .tn { color: var(--ink-3); font-size: 0.85em; margin-right: 6px; }
figure img { width: 100%; height: auto; display: block; margin: 6px 0; background: #fff; border-radius: 3px; }
.audio { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.audio label { display: flex; align-items: center; gap: 8px; font-size: 0.85em; }
.role { display: inline-block; min-width: 3.6em; } .role.input { color: var(--ink-3); } .role.observed { color: var(--observed); font-weight: 600; }
audio { height: 32px; max-width: 250px; }
.meas { font-size: 0.92em; color: var(--ink-2); margin-top: 6px; } .meas.flag { border-left: 3px solid var(--disc); padding-left: 8px; }
</style></head><body>
<p><a href="../">← Audapter report</a></p>
<h1>The lab's coAdapt experiment, run with realistic voices</h1>
<p class="lede">coAdapt (simonMulti, Experiment 1) is one of the blab lab's public formant-perturbation experiments. A
participant reads three words aloud, trial after trial. For two of the words Audapter moves the first formant (F1) of
what they hear in their headphones, one word up and one down, rising to 125 mel during the ramp phase and holding
there; the third word is never shifted. Which word gets which shift is counterbalanced across participants.</p>
<p class="lede">Here the lab's own script ran unmodified, in its test mode, on a simulated rig with the real Audapter
core, and a virtual participant said each word the script put on screen (the report's
<a href="../#labrun">methods</a> describe how). Talkers marked <i>AI-generated</i> are voices from OpenAI's
gpt-audio-1.5 speech model saying just the requested word: realistic renditions, not recordings of people, with no
audio above 12 kHz. Choose a talker.</p>
<p class="lede">The figures use the report's colours: dashed ink is what the experiment intends (expected), blue is what
actually happened (observed: the shift from Audapter's own log, the level measured on the audio), and orange marks
where the two differ. Levels are RMS; the report's
<a href="../#FMT-LEVEL">FMT-LEVEL</a> card estimates how much of a level difference like this a listener perceives.</p>
<nav class="talkers">{{TABS}}</nav>
{{SECTIONS}}
<script>
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
    runs = sys.argv[1:] or sorted(glob.glob(os.path.join(LR, "results", "coAdapt_voices", "*", ""))) or [os.path.join(LR, "results", "coAdapt")]
    build(runs)
