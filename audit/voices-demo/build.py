#!/usr/bin/env python3
"""Standalone page: the lab's public coAdapt experiment run unmodified in labrun, with a virtual participant speaking
each trial's word. For every talker it shows the saved trials: what went into Audapter, what the participant heard,
spectrograms with Audapter's formant tracks and shift targets, and the per-trial measures from labrun's summary.

Usage: python3 audit/voices-demo/build.py [run_dir ...]
  run_dir: a labrun result directory (results/<plan>/ or results/<plan>_voices/<talker>/); default: every
  results/coAdapt_voices/*/ that exists, else results/coAdapt/ (the synthetic participant).
Writes audit/voices-demo/dist/ (index.html + assets/), staged to docs/voices-demo/ by audit/publish/stage.sh.
"""
import csv, glob, html, json, os, re, sys
import numpy as np
import scipy.io as sio
import scipy.io.wavfile as wavfile
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
LR = os.path.join(HERE, "..", "labrun")
OUT = os.path.join(HERE, "dist")
E = html.escape


def mel(f):
    return 1127.01048 * np.log(1 + np.asarray(f, float) / 700)


def load_trial(run, k):
    r = sio.loadmat(os.path.join(run, "trials", f"{k:04d}.mat"), squeeze_me=True, struct_as_record=False)["rec"]
    D = np.asarray(r.dataMat, float); nT, nL = int(r.nTracks), int(r.nLPC); o = 4
    fm = D[:, o:o + nT]; o2 = o + 2 * nT + 2; sf = D[:, o2:o2 + 2]; ost = D[:, o + 2 * nT + 4 + nL + 1]
    sc = float(getattr(r.params, "scale", 1.0)) if hasattr(r.params, "scale") else 1.0
    return dict(sr=int(r.sr), fl=int(r.frameLen), x=np.asarray(r.signalIn, float), y=np.asarray(r.signalOut, float) * sc,
                fm=fm, sf=sf, ost=ost, word=str(r.ctx.word), cond=str(r.ctx.cond), shift=str(r.ctx.shift),
                inputDesc=str(r.inputDesc), params=r.params)


def summary_rows(run):
    with open(os.path.join(run, "summary.tsv")) as f:
        return {int(row["k"]): row for row in csv.DictReader(f, delimiter="\t")}


def pick_trials(rows):
    """One trial per (phase, word), in session order: the first processed trial of each."""
    seen, ks = set(), []
    for k in sorted(rows):
        r = rows[k]
        if r.get("mode") != "proc": continue
        key = (r.get("cond"), r.get("word"))
        if key in seen: continue
        seen.add(key); ks.append(k)
    return ks


def write_wav(path, x, sr):
    x = np.clip(x / max(1e-9, 1.0), -1, 1)
    wavfile.write(path, sr, (x * 32767).astype(np.int16))


def figure(t, path, row):
    sr, fl = t["sr"], t["fl"]; x, y = t["x"], t["y"]; n = len(x); T = n / sr
    tf = (np.arange(len(t["ost"])) + 0.5) * fl / sr
    fig, axs = plt.subplots(2, 1, figsize=(7.2, 4.2), sharex=True, gridspec_kw=dict(hspace=0.1))
    vmax = 20 * np.log10(max(np.abs(x).max(), np.abs(y).max(), 1e-6))
    for ax, sig, lab in ((axs[0], x, "into Audapter (microphone)"), (axs[1], y, "heard by the participant")):
        ax.specgram(sig + 1e-7, NFFT=int(0.032 * sr), Fs=sr, noverlap=int(0.028 * sr), cmap="Greys", vmin=vmax - 110, vmax=vmax - 20)
        ax.set_ylim(0, 4000); ax.set_ylabel("Hz"); ax.text(0.01, 0.92, lab, transform=ax.transAxes, fontsize=8, va="top",
                                                             bbox=dict(fc="white", ec="none", alpha=0.8, pad=1.5))
    ok = t["fm"][:, 0] > 0
    for j, c in ((0, "#1f6fd1"), (1, "#1f6fd1")):
        axs[0].plot(tf[ok], t["fm"][ok, j], ".", ms=2.2, color=c, label="tracked F1, F2" if j == 0 else None)
        axs[1].plot(tf[ok], t["fm"][ok, j], ".", ms=2.2, color="#1f6fd1", alpha=0.45, label="tracked (input)" if j == 0 else None)
    sh = (t["sf"][:, 0] > 0) & ok & ((np.abs(t["sf"][:, 0] - t["fm"][:, 0]) > 0.5) | (np.abs(t["sf"][:, 1] - t["fm"][:, 1]) > 0.5))
    if sh.any():
        for j in (0, 1):
            axs[1].plot(tf[sh], t["sf"][sh, j], ".", ms=2.2, color="#d1541f", label="shift target" if j == 0 else None)
        for ax in axs[:2]:
            ax.axvspan(tf[sh][0] - fl / sr / 2, tf[sh][-1] + fl / sr / 2, color="#d1541f", alpha=0.07, lw=0)
    for ax in axs[:2]:
        ax.legend(loc="upper right", fontsize=7, markerscale=3, framealpha=0.85)
    axs[1].set_xlim(0, T); axs[1].set_xlabel("time in trial (s)")
    for ax in axs: ax.tick_params(labelsize=7)
    fig.savefig(path, dpi=110, bbox_inches="tight"); plt.close(fig)


def prog(shift):
    m = re.search(r"shiftMags=(-?[0-9.]+)", shift)
    if not m: return shift
    v = float(m.group(1)); return "programmed: no shift" if v == 0 else f"programmed: F1 {v:+.0f} mel"


def fnum(row, key, fmt="{:+.1f}"):
    try: return fmt.format(float(row[key]))
    except (KeyError, ValueError, TypeError): return "–"


def talker_label(run, first_desc):
    meta = os.path.join(run, "talker.json")
    if os.path.exists(meta):
        return json.load(open(meta))
    m = re.match(r"synth ", first_desc)
    if m: return dict(name="Klatt synthesizer", kind="synthetic", note="one synthetic vowel per syllable (the harness default)")
    return dict(name=os.path.basename(os.path.normpath(run)), kind="voice", note=first_desc)


def build(runs):
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    sections = []; tabs = []
    for i, run in enumerate(runs):
        rows = summary_rows(run); ks = pick_trials(rows)
        if not ks: continue
        tid = f"t{i}"; cards = []; first = None
        for k in ks:
            t = load_trial(run, k); row = rows.get(k, {}); first = first or t["inputDesc"]
            base = f"{tid}_{k:04d}"
            write_wav(os.path.join(OUT, "assets", base + "_in.wav"), t["x"], t["sr"])
            write_wav(os.path.join(OUT, "assets", base + "_out.wav"), t["y"], t["sr"])
            figure(t, os.path.join(OUT, "assets", base + ".png"), row)
            shifted = float(row.get("shift_s") or 0) > 0
            meas = (f"shift applied for {float(row['shift_s']):.2f} s: F1 {fnum(row, 'shift_F1_mel', '{:+.0f}')} mel, "
                    f"F2 {fnum(row, 'shift_F2_mel', '{:+.0f}')} mel" if shifted else "no shift applied")
            cards.append(f"""
<figure class="trial">
  <figcaption><b>Trial {E(row.get('itrial', str(k)))}</b> · phase <b>{E(t['cond'])}</b> · word <b>{E(t['word'])}</b>
    <span class="prog">{E(prog(t['shift']))}</span></figcaption>
  <img src="assets/{base}.png" alt="Spectrograms of trial {k}: input and heard output with formant tracks" loading="lazy">
  <div class="audio">
    <label>Into Audapter <audio controls preload="none" src="assets/{base}_in.wav"></audio></label>
    <label>Heard <audio controls preload="none" src="assets/{base}_out.wav"></audio></label>
  </div>
  <p class="meas">{meas}. Heard level re input {fnum(row, 'gain_dB')} dB (includes the rig's output scale);
    Audapter delay {fnum(row, 'lag_ms', '{:.0f}')} ms.</p>
</figure>""")
        who = talker_label(run, first)
        tabs.append(f'<button type="button" data-t="{tid}"{" class=on" if not tabs else ""}>{E(who["name"])}</button>')
        sections.append(f"""<section id="{tid}" class="talker"{'' if len(sections) == 0 else ' hidden'}>
  <p class="who"><b>{E(who['name'])}</b> ({E(who.get('kind', ''))}). {E(who.get('note', ''))}</p>
  {''.join(cards)}
</section>""")
    page = TEMPLATE.replace("{{TABS}}", "".join(tabs)).replace("{{SECTIONS}}", "\n".join(sections))
    open(os.path.join(OUT, "index.html"), "w").write(page)
    print(f"voices-demo: {len(sections)} talkers -> {OUT}")


TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>coAdapt run with realistic voices · Audapter report</title>
<style>
:root { --ink:#1d2530; --ink2:#4a5563; --rule:#dde2e7; --bg:#fbfbfa; --accent:#1f6fd1; }
@media (prefers-color-scheme: dark) { :root { --ink:#e7eaee; --ink2:#b9c1ca; --rule:#2e353d; --bg:#15191e; } img { filter: invert(0.9) hue-rotate(180deg); } }
body { font: 16px/1.5 Georgia, "Source Serif 4", serif; color: var(--ink); background: var(--bg); max-width: 820px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.5em; margin: 0.2em 0; } a { color: var(--accent); }
.lede { color: var(--ink2); }
nav.talkers { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0; position: sticky; top: 0; background: var(--bg); padding: 6px 0; border-bottom: 1px solid var(--rule); }
nav.talkers button { font: inherit; font-size: 0.9em; padding: 4px 10px; border: 1px solid var(--rule); background: transparent; color: var(--ink); border-radius: 14px; cursor: pointer; }
nav.talkers button.on { background: var(--accent); color: white; border-color: var(--accent); }
figure.trial { margin: 18px 0; padding: 10px 0; border-top: 1px solid var(--rule); }
figcaption .prog { color: var(--ink2); font-size: 0.85em; margin-left: 6px; }
figure img { width: 100%; height: auto; display: block; margin: 6px 0; }
.audio { display: flex; flex-wrap: wrap; gap: 10px 18px; font-size: 0.85em; color: var(--ink2); }
.audio label { display: flex; flex-direction: column; gap: 2px; } audio { height: 32px; max-width: 100%; }
.meas { font-size: 0.9em; color: var(--ink2); margin: 6px 0 0; }
.who { font-size: 0.95em; }
</style></head><body>
<p><a href="../">← Audapter report</a></p>
<h1>The lab's coAdapt experiment, run with realistic voices</h1>
<p class="lede">This page puts spoken words through one of the blab lab's public experiments, coAdapt (simonMulti,
Experiment 1). The experiment script ran unmodified, in test mode, on a simulated rig with the real Audapter core; a
virtual participant spoke the word each trial put on screen. Choose a talker, then listen to what went into Audapter
and what the participant heard, trial by trial.</p>
<p class="lede">The talkers marked <i>AI-generated</i> are voices produced by OpenAI's gpt-audio-1.5 speech model
(it says the requested word only; each take was checked for duration and plausible formants). They are realistic
renditions, not recordings of people, and their audio stops at 12 kHz. How the run works is described in the
report's <a href="../#labrun">methods section on running the lab's own code</a>.</p>
<p class="lede">In each figure the top panel is the microphone signal, with the first two formants Audapter tracked
(blue). The bottom panel is what the participant heard: the same formants in pale blue and, over the shaded stretch,
the formants Audapter shifted them to (orange). The heard signal includes the masking noise the experiment plays to
hide the participant's own voice.</p>
<p class="lede">coAdapt shifts the first formant (F1) of two of its three words in opposite directions during the ramp
and hold phases (125 mel at full strength) and leaves the third word unshifted. Which word gets which shift is
counterbalanced across participants.</p>
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
