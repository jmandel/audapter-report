# Audapter Playground

A static web page for trying Audapter settings on speech and seeing and hearing what they do. It runs the **real**
blab-lab Audapter core (TransShiftMex @ 169cadf) compiled to WebAssembly by [`../wasm`](../wasm/README.md), the same
build the audit report uses. Published beside the report as `playground/`.

It is a record-then-process tool: the whole utterance is recorded or loaded first and then run through Audapter frame
by frame (`Audapter('runFrame')`, the same `handleBuffer` as the ASIO callback). It is not real-time feedback.

## Features

**Input.** A bundled speech clip (21 clips from `../corpus`, CC BY 4.0 and CMU ARCTIC only: adults, children, noisy
speech, sustained and dysphonic vowels, singers), a synthetic vowel (Peterson & Barney formants for men, women or
children, F0 and formant glides, vibrato), a microphone recording (browser processing off), or an uploaded WAV/FLAC.
48 kHz WAVs are read sample-exact; anything else is resampled by the browser.

**Settings**, grouped by what they do. Every control has a one-line plain-language description, units and a range.
- *Starting point* presets built on the blab defaults recorded from `AudapterIO('init')`: adult female, adult male,
  child (nLPC 11, CORPUS-3), and "low voice, upstream demo" (frameLen 64, nDelay 7, as `time_domain_shift_demo.m`).
- *What gets shifted*: formants (% / Hz / mel; everywhere, in an F1–F2 region, varying with F2 as a 1-D field, or a 2-D
  field painted on the vowel map), pitch (phase vocoder or time domain), loudness, timing (phase-vocoder time warp) and delay (DAF).
- *When*: always, after a delay, in a time window, during the vowel (speech-triggered OST), as drawn on the
  **Timing & design** tab (below), or a custom OST/PCF.
- *How Audapter listens*: nLPC, frame length, nDelay (with the resulting delay and analysis window), thresholds, priors, smoothing, liftering.
- *What the participant hears*: feedback mode 0–5, generated masking noise, output gain.
- *Expert: all parameters* (a link, opening a drawer): all 87 parameters parsed from the C++ constructor (name, type,
  help text, source line link), the value actually sent, and validated overrides.

**Vowel variability (inward / outward).** A "Where on the vowel map" option on the formant card: heard = centre +
k × (spoken − centre), with k = 1 − strength (inward, less variable) or 1 + strength (outward, more variable), an optional
maximum shift, the centre from the current input's median, the ticked trials' median (a baseline) or typed in, and
Hz or mel distances. It compiles to Audapter's 2-D field: bShift2D = 1, bRatioShift = 0 (absolute shift), strictly
increasing pertF1/pertF2 grids over the centre ± a chosen reach (default ±450 Hz F1, ±900 Hz F2: steps 3.5 and 7 Hz),
pertAmp2D = strength × distance (capped) and pertPhi2D pointing toward or away from the centre, evaluated at each cell's
centre because Audapter reads the lower-left cell without interpolating (FMT-F3); the field bounds (f1Min … f2Max) are set
to the grid so formants outside it are not shifted. The vowel map shows the field as arrows with the centre marked, a
zoom on 24 grid steps comparing the intended (smooth) and applied (stepped) shift, and, for ticked trials, a token view:
spoken (fmts) and heard (sfmts) medians per token joined by lines, the output measured with the same LPC on input and
output, 1 SD dispersion ellipses, and the heard/spoken dispersion ratio. "Vowel cloud" under Input, Synthetic vowel
makes N tokens with random F1/F2 around a vowel, optionally runs them unshifted first to set the centre, then runs them
with the current settings and shows them as tokens.

**Test cases from the report.** Every report card that can be replayed is a test case (14 of 22 cards; the other 8 say
why in the header picker: live audio path, a hang, heap-garbage reads, array reuse, a 35 s trial). A case is the exact
command stream the card's export script sent to Audapter: `audit/playground/tools/capture-cases.sh` runs the export
(`audit/harness/oct/report_*.m`, with `case_mark` section marks) against the real Octave MEX through a recording shim
(`capture/Audapter.m`) that logs every setParam (including the ones `AudapterIO('init')` sends), OST/PCF text, reset and
trial input. The build packs each case (`tools/cases.spec.mjs`: the captured sections, session or fresh per trial, the
build, and the card's key numbers read from the same export's `data.json`) into `dist/cases/<ID>.js`, with inputs and
long arrays as shared 24-bit FLAC or float32 resources.

Open a case from the "Test cases from the report…" menu in the header, with `#case=<ID>`, or from a report card's link.
It opens in the Explore workspace:
- **Real voice first.** Where the card's primary example is real speech (OST-F1, OST-F2, COORD-1, OST-F5, LAB-1/2/3,
  PT-5), the case opens with it (captured from the export's real-voice sections); "Real voice / Synthetic" in the
  banner switches to the synthetic example (`#case=<ID>&voice=synthetic`). The key trial, callout, trial list and
  numbers vs card follow the chosen example.
- Every case has an **expected** and an **observed** variant with the same trials. Expected is, where one exists, the
  same inputs and sequence on the build with that card's fix alone (the report's one-fix builds from
  `audit/report/wasm/variants.yaml`: OST-F1, OST-F2, I-01, I-02, PT-5 gain-normalised; F6's one-shot rule, labelled an
  alternative, not a fix). Where no code fix applies, expected is what the card uses, and the banner says so: COORD-1 the
  runner's two clear lines, the LAB cards the correctly wired settings, OST-F5 the all-zero catch PCF, OST-F8 the hold in
  field 5, CORPUS-11 the mel units, CORPUS-8 the longer window. PT-5 is the card's plausible design (the settings of an unused
  Audapter runner in blab's cerebTypicalProduction folder: baseline bPitchShift 0, later phases bPitchShift 1 at 0 st) on
  a real sentence; its synthetic step trials are an extra group.
- **First view: the key trial side by side** ("Expected vs observed"): expected above observed, one time axis and one
  playhead; output spectrograms with the spoken (tracked), target and heard (LPC) formants; pitch or level strips where
  the case is about pitch or level; OST state and shift-on rows; the difference marked in orange with a one-line callout
  ("0.72–1.30 s: F1 shifted +27 % (should be unchanged)"); Play expected / Play observed / A/B (switch with X).
- **Trial list:** one row per trial under a case header, with an Expected/Observed toggle; ticking a row ticks both, so
  both show in Compare. The settings panel shows the selected trial's settings (per-trial settings are flagged in the
  banner), and the input panel gives way to the case's own input.
- **Compare** (or "Show session timeline" / "Numbers vs card" in the banner) shows the session timeline with expected
  (hollow) and observed (blue) rows and orange where they differ, and the card-vs-replay table.
- **Editing forks the case.** Any change while a case is loaded (a setting, the build, or the trial table: order,
  inputs, switching between trials, session mode) makes an editable copy, "OST-F1 · my edit", listed with its settings
  diff against the original, and re-runs the whole trial sequence as one session with the case's switching, so effects
  between trials are kept. Further edits update the same copy; the original stays in the list for comparison, and the
  side-by-side view shows the copy against the original expected run.

When a custom OST/PCF or a timeline design sets the shift, the Explore cards show what it sets per state
("set by the OST/PCF: F1 +125 mel in state 2") with their switches locked, instead of their own unused values.

**Timing & design tab.** Graphical control of WHEN the perturbation happens.
- The current input is analysed by a dry run of the real core; its per-frame level (`rms`, `rms_slope`) drives a
  JavaScript port of `OST_TAB::osTrack` (`src/js/ostsim.js`), which finds the "sounds" Audapter's level rules detect
  (onset: level above a start level for a hold time; end: 10 ms below an end level; levels fitted to each input,
  12 and 18 dB below its peak, or set by hand).
- The design is a set of blocks on a timeline, each anchored to the trial start, a sound's start or end (plus an offset),
  or a duration, and each carrying what changes (F1/F2 in the Explore units, pitch in semitones via the phase vocoder,
  level in dB). Edges are draggable and snap to detected events; double-click adds a block; a plain block list edits the same.
- One-click designs with 1–3 plain controls: whole utterance, sudden step after voice onset (delay, random extra delay
  drawn per trial and stored with it), during the vowel, Nth word/syllable, brief pulse, step then return.
- The design compiles to a linear OST (INTENSITY_RISE_HOLD, INTENSITY_FALL, ELAPSED_TIME, OST_END) and a PCF.
  Every "sound ends" rule follows a "sound starts" rule in the same trial, so nothing depends on the previous trial
  (OST-F1); no maxIOI (OST-F2) or AND_RATIO rules (OST-F8). Designs Audapter's forward-only rules cannot express
  (timing from the trial start after an event, an event that has already gone by, blocks after one that never ends,
  starts earlier than the onset hold) are refused with a plain explanation.
- A "Predicted" row replays the compiled OST on the input before running, with an orange band where it differs from
  the drawn block; after a run a "Last run" row shows the logged on-states and the frames where sfmts ≠ fmts.
- "Show generated OST/PCF (advanced)" holds the raw files, import/export and the rule/PCF table editor for custom files.
- *Across trials: experiment schedule*: baseline / ramp (growing to the full value) / hold / washout counts, optional catch
  trials, one input or a cycle of chosen clips, fresh per trial or one session. It creates and runs the trials and plots,
  per trial, the produced value (Audapter's tracking of the input), the heard target (sfmts) and the value measured in the output. The output
  value is the produced value times the median per-frame ratio of the same independent estimator (LPC for formants, YIN for F0)
  on output and input over the same voiced frames of the perturbation window, the output read one processing delay later, so
  the estimator's bias cancels; with fewer than 20 paired frames or an implausible ratio the dot is hidden and the reason shown.
- *Inline warnings from the audit's findings* where they apply: PCF shorter than the OST (OST-F4), INTENSITY_FALL after
  rules that never set "last state end" (OST-F1, stronger in a same-session run), maxIOI (OST-F2), AND_RATIO hold in
  field 5 (OST-F8), pitch range below the analysis window (CORPUS-8, also from the input's measured F0), pvocFrameLen /
  pvocHop against frameLen (PT-11, 17g), phase-vocoder level offset (PT-5), time-domain schedule clock and logged ratio
  (PT-3, PT-4), warp dropped with pitch shift (17e), mel versus ratio units and unbounded targets (CORPUS-11),
  restricted-field re-arming (F6), 2-D lower-left lookup, noise shorter than 10 s (I-01), fb 5 double dScale (I-02),
  delay clamp, recorder length (I-03), stale OST/PCF in a session (COORD-1), frame changes in a session (CORPUS-10), and
  the settings Audapter itself refuses.
- Settings save and load as JSON, and "Copy link" puts small configurations in the URL hash (`#s=…`).

**Trials.** Each run is a trial with its input, output, settings snapshot and every `getData` field (fmts, sfmts,
rads, dfmts, rms, rms_slope, ost_stat, pitchShiftRatio, pitchHz, shiftedPitchHz, signalIn/Out). With "Update as I
change settings" on, the current settings re-run automatically (debounced) into a draft trial; **Run** keeps a trial.
**Sweep** next to any numeric control runs 3–8 values as separate trials and opens them side by side. The trial list
sorts by any setting, filters by name/setting/tag, and holds names, tags and notes. Kept trials persist in IndexedDB;
a session exports to and imports from a zip (`session.json` plus 32-bit float WAVs).

**Fresh by default, sessions on request.** Every trial runs in a fresh Audapter instance (a Web Worker that is
terminated afterwards), so trials are independent and reproducible. "Run ticked as one session" runs selected trials
in order in *one* instance, as a MATLAB session would; a trial without an OST/PCF then keeps the previous one, exactly
like `AudapterIO('init')` (COORD-1). A small "Audapter build" option switches between the shipped build, the patched
build (fixes for OST-F1, OST-F2, I-01), the full-size shipped build (30 s recorders), and the report's one-fix builds
(each card's fix alone, `audit/report/prototype/wasm/audapter-<fix>.js`; the test cases use them as "expected").

**Playback.** Original, processed, or both in sync with a gapless A/B switch (X), loop over the visible time window,
start at the clicked time, and an optional level match (labelled with the gain applied). Playback is capped at
−1 dBFS peak, with a warning when the output clips or has a burst (a 20 ms block more than 20 dB above the average).

**Views**, in the report's visual language (input grey, intended hollow ink, observed blue, discrepancy orange),
light and dark, with a one-column phone layout:
- *Spectrograms*: time-aligned input and output spectrograms with Audapter's tracked formants (fmts) and its shifted
  targets (sfmts, hollow), an independent LPC estimate on the output, OST state and "shift on" tiers (configured vs applied).
- *Pitch and level*: independent YIN F0 of input and output, Audapter's logged pitchHz and shiftedPitchHz with an orange
  band where the logged pitch is not the voice's F0, input/output level with Audapter's RMS and threshold, tracked frames, OST state.
- *Vowel space*: F1–F2 plane with the Peterson & Barney backdrop, the perturbation field as arrows, input trajectory,
  targets and output formants, medians, and the 2-D field painter.
- *Compare*: small multiples on shared axes with the settings that differ, A/B listening between any two trials or
  originals, and a session timeline that places trials end to end (never as rows that look simultaneous).
- Every view has a synchronized playhead, hover readouts, zoom/pan, and a "Numbers behind this view" table.

## Build

Test cases: `audit/playground/tools/capture-cases.sh` (docker, the harness image and `audit/harness/build-oct`) writes
`audit/playground/capture/out/<ID>/` (PT-5's two-phase design is the capture `PT-5-CEREB`, run with
`SCEN=cereb`; OST-F1's real-voice session is `OST-F1-REAL`, run with `SCEN=real`); the build then packs them and writes `audit/playground/cases.json`, which the
report build reads to link each card. Without captures the build skips the cases with a warning.


```sh
audit/playground/build.sh        # -> audit/playground/dist/ (about 15 MB with the test cases); copy it to docs/playground/
```

Needs node ≥ 20 and the WASM bundles in `audit/wasm/lib/` (`audit/wasm/build.sh full lite patched`) and, for the
test cases' expected runs, the report's one-fix builds in `audit/report/prototype/wasm/` (`audit/report/wasm/build-variants.sh`). If the `flac`
encoder is installed, the clips are stored losslessly as FLAC, otherwise as WAV. The build also parses the parameter
table from `blab/audapter_mex/TransShiftMex/Audapter.cpp` and copies the report's Charis SIL fonts. Everything is a
classic script, so `dist/index.html` also works from `file://` (engines load as Blob workers from function source text);
only the microphone needs https or localhost. `node audit/playground/test/serve.mjs` serves `dist/` on localhost.

Source: `src/index.html`, `src/style.css`, `src/js/*.js` (page, concatenated in `src/js/ORDER`), `src/shared/`
(settings model and DSP, used by page and worker), `src/worker/engine-worker.js`, `tools/build.mjs`.

## Test

```sh
audit/playground/build.sh && node audit/playground/test/run.mjs
```

Uses playwright-core from `audit/scratch/wasm` and Chromium at `/usr/bin/chromium` (or `$CHROME`) with a fake microphone
fed from `audit/corpus/audio/pvqd_LA9003_a.wav`. Results on 2026-09-27, Chromium 150, all PASS:
- Records 3 s through the UI and runs F1 +20 %: logged sF1/F1 = 1.200000 on all 1281 shifted frames (range 1.200000–1.200000).
- The page's output equals the batch API (`lib/audapter-lite.js`, `runTrial`, fresh instance, same setParam list) run in node
  on the same recorded input: 0 of 144 000 samples differ; fmts and sfmts identical on all 1500 frames.
- Timing & design: each of the six templates on "I had faith in them." (arctic_slt_a0030) and a two-block design: the
  predicted OST state equals the logged ost_stat on every frame (0 of 738 differ), and sfmts ≠ fmts only inside the
  predicted on-time, on all tracked frames there. Dragging the block start onto sound 2 snaps it to "sound 2 starts".
  A 2/3/2/2 schedule logs heard/produced F1 = 1, 1, 1.067, 1.133, 1.2, 1.2, 1.2, 1, 1.
  Its output measurement sits on produced in baseline and washout (575 vs 577 Hz) and on the target in ramp and hold
  (605/641/691 vs 615/654/692 Hz), within 4 %.
- Vowel variability on a 20-token synthetic cloud (baseline pass sets the centre): 50 % inward gives a heard/spoken
  dispersion of 0.5005 from the logged sfmts (0.467 measured in the output), 50 % outward 1.4996 (1.426); every token's
  heard point is within 1.8 Hz of the intended point on the line to the centre (grid step 7.9 Hz diagonal). In node the
  JavaScript port of Audapter's 2-D lookup reproduced sfmts on all 6042 shifted frames of each direction
  (`audit/scratch/playground/probe10.mjs`).
- Test cases: every example of the 14 cases replays the card's key numbers, for both variants. Real voice (the default where
  it exists): OST-F1 32/32, OST-F2 12/12, COORD-1 10/10, OST-F5 16/16, LAB-1 16/16, LAB-2 16/16, LAB-3 2/2 (RMS of the
  card's real clips), PT-5 3/3. Synthetic: OST-F1 32/32, OST-F2 18/18, COORD-1 10/10, OST-F5 16/16, I-01 4/4, LAB-1 48/48,
  LAB-2 48/48, LAB-3 2/2, F6 11/11, OST-F8 4/4, CORPUS-11 4/4, CORPUS-8 28/28, I-02 5/5, PT-5 4/4 (341 numbers in all).
  Tolerances are one frame (2 ms) for times, 1 frame count, 3 Hz for heard formants, 12 cents, 0.1 dB
  (0.2 dB for "PT-5 fix: later phase at the baseline level"), and one lag step for CORPUS-8's logged pitchHz.
  For every example: the key trial opens side by side (one stack, expected above observed, heard-formant dots drawn in both),
  the difference is marked in orange with a callout, the list has one row and one Expected/Observed toggle per trial,
  expected runs on the card's fix build where one exists (otherwise the banner says what it is), and three parameters of
  the settings panel equal the case's. On OST-F1: the toggle, ticking a row ticks both variants, Compare shows all 16
  trials with the timeline and numbers; an edit (fb3gain 0.05) makes "OST-F1 · my edit" (8 trials, one session, trial 4
  still leaks 0.92 s like the original), and a second edit (build → fix-ost-f1) updates the same copy (trial 4: 0.348 s,
  as expected).
- 14 settings variants run (pvoc, time-domain after 0.5 s, loudness window, time warp during the vowel, 150 ms delay,
  speech + 3 s noise, Hz region, F2-dependent field, painted 2-D field, mel units, custom OST/PCF, child preset, low-voice
  preset on the patched build, full-size build).
- A 5-value F1 sweep logs ratios 1.0/1.1/1.2/1.3/1.4; three trials run as one session; the page also runs from `file://`; no page errors.
- 55 screenshots at 1440 px and 390 px, light and dark (Explore views, Timing & design, schedule, expert drawer, vowel variability tokens; OST-F1, LAB-1 and PT-5 opened in the workspace at 1440 px light and dark and 390 px dark, the side-by-side view, the list, the timeline, the fork), in `test/shots/` (git-ignored).

## Memory and latency

- **Memory.** One instance's WASM heap is 163 MB (shipped and patched builds, 10 s recorders) or 307 MB (full-size build).
  Fresh trials run in a worker that is terminated after the trial; the next worker is pre-created only after that, so
  at most one instance is alive at a time (plus the one pre-warmed spare between runs). Measured resident memory of the
  whole headless Chromium in the test: 474 MB at start, peak 1.25 GB while one page ran about 20 trials (including the
  full-size build), a 5-value sweep and a 3-trial session, and ~1.1 GB afterwards; the rest is the kept trials' audio
  and analyses (about 3–4 MB per 3 s trial) and the browser itself. Processing a 3 s trial takes 70–160 ms plus about
  0.2 s of worker start-up.
- **Latency.** Not applicable to the page itself (record, then process). The "How Audapter listens" group shows
  Audapter's own buffering delay, nDelay × frameLen (10 ms with the blab defaults; `../wasm` measured 8.2 ms algorithmic latency). A browser
  round trip for live feedback is typically 60–115 ms against about 20–40 ms for native Audapter with ASIO
  (`../wasm/README.md` §3), so a browser is not a substitute for a lab rig when feedback latency matters.

## Limitations

- The independent estimates (YIN F0, LPC formants) are rough references computed in the page; LPC is biased at high F0 (NEG-2).
- Only Chromium was tested. Blob workers from `file://` worked in Chromium; if a browser refuses them the page falls
  back to one instance on the main thread (not fresh per trial; shown next to the memory figure).
- Trials longer than 10 s need the full-size build (the recorder wraps, I-03). `datapb` noise is at most 10 s.
- The time-warp card starts the warp at the "When" start time, voice onset, or trial start; a warp at trial start
  during leading silence has no audible effect.
- The page stops a run that makes no progress for 12 s (e.g. the CORPUS-10 hang) by terminating its worker.

Licences: code Apache-2.0; see `dist/NOTICE.txt` and `dist/clips/ATTRIBUTION.md` for the core, fonts and clips.
