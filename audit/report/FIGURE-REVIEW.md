# Figure review

Every figure in the report, checked against six questions:
- (a) shows the finding directly;
- (b) the right time axis, labelled, with sequence visible;
- (c) expected vs observed encoded consistently;
- (d) no misleading reading;
- (e) fits 390 px and dark mode;
- (f) simplest form.

Screenshots of every figure at desktop, 390 px light and 390 px dark are produced by `node audit/report/figshots.mjs` (into `report/build/figs/`), and each set was looked at.

## Changes that apply to all figures

- **Two layouts.** Every sketch is rendered twice:
  - wide, with a label column, for desktop;
  - narrow, with labels above each row and larger type, for phones.

  CSS shows one of them, so nothing is clipped or squeezed at 390 px.
- **Annotations in lanes.** They sit in their own space below the rows they refer to (`Sketch.lane`), never over data. Band labels are collected into lanes automatically.
- **Axis labels.** Every axis carries a label: "time in trial (s)", "time in the session (s)", "time relative to the reset (ms)", "true F0 (Hz)" or "array element". The end ticks are anchored inside the plot.
- **Group headers.** Rows from different trials, sessions or inputs sit under headers with a rule between groups. Cross-trial figures use a single session axis.
- **Dark mode.** State tiers now have visible fills, boundaries and labels.
- **Encoding, unchanged.** Grey is input, an outline is expected, solid blue is observed, and an orange band is the discrepancy. The intro explains this once.

## Card figures

| Figure | Verdict | Problem found | What changed |
|---|---|---|---|
| OST-F1 main | redesigned | Trials A and B were stacked on a shared trial-relative axis and read as simultaneous. The mobile view clipped the key comparison. In dark mode, trial A's state row showed no labels | One session axis: trial A, reset() (dashed rule, "OST state not cleared"), trial B. Trial A's state-2 time is marked, with a dashed "same frame count" marker in trial B and a shaded over-run. Session 2 (trial B alone) is drawn under trial B |
| OST-F1 panel | redesigned | The rows mixed trials without a time base | The same session-timeline design as the static figure, with the current build, the fixed build, and trial B alone |
| OST-F2 main | redesigned | Three trials were stacked as if simultaneous | One session with trials 1–3 end to end, reset() rules, and each trial's intended timeout dashed. The drift is annotated per trial, and the intended timing is drawn below on the same axis |
| OST-F2 panel | redesigned | Per-trial rows | One session row per build, plus an intended-timing row, on one axis |
| COORD-1 | redesigned | Showed fresh vs after on a trial axis, without the sequence that causes it | Session 1: the PCF experiment, then AudapterIO('init') (rule), then the field experiment, with the missing shift shaded. Session 2: a fresh field experiment drawn under it |
| I-01 main + babble inset | fixed | Showed an upstream row that framed the finding by origin. In-bar text overflowed on phones; the inset label was clipped | Upstream row removed. Notes moved to lanes. The inset label has its own row. Axis labelled |
| PT-5 main + sweep | fixed | The sweep was a separate fixed-width SVG, unreadable at 390 px. Notes overlapped the traces | The sweep is rebuilt on the shared primitives, with an F0 axis labelled as F0 (not time). Level notes moved to a lane |
| CORPUS-8 | fixed | The label covered the first data point. The x axis was labelled as time although it is F0. Ticks were crowded on phones | Notes in a lane. Axis labelled "true F0 of the synthetic vowel (Hz)". Fewer ticks in the narrow layout |
| CORPUS-10 | fixed | The axis did not say what time it was | Axis: "wall-clock time since the trial started (s)". The fresh-session note moved to a lane |
| CORPUS-11 | fixed | The ratio-mode note sat over the curve | Note moved to a lane that also explains the line encoding. Log axis labelled in Hz |
| F6 | fixed | Framed as "upstream vs blab". The two inputs were not separated. Band labels overlapped rows on phones | Rows are "one-shot rule" vs "current", under headers for input 1 and input 2 (separate trials). Notes in lanes. The caption states that the rows are separate runs |
| F6 panel | fixed | Labels were "released" and "alternative (upstream)" | Labels are "current behaviour" and "one-shot per trial" |
| FMT-F1 array + trial | fixed | The array index axis was labelled as time. Notes overlapped on phones | Axis: "array element". Notes in lanes. Heap-derived values marked "in this run" |
| OST-F4 | fixed | The array diagram and the timeline shared one figure without saying the top has no time axis. A note was clipped | Headers: "Memory … (not a time axis)" and "One trial". Notes in lanes |
| OST-F8 | fixed | Band notes sat inside the rows | Notes in lanes. The caption explains that each row is one trial per setting |
| I-02 | fixed | A second, fixed-width bar chart duplicated the numbers table and was unreadable on phones | Bar chart removed; the table carries the 6 vs 12 dB numbers. Explanatory notes in lanes |
| I-03 main + zoom | fixed | An upstream row. Notes inside rows. Zoom label clipped | Upstream row removed. Notes in lanes. The zoom label has its own row |
| I-04 | fixed | Notes over the traces | One lane explains both lines. The caption states that the two conditions are sequential runs |
| LIVE-1 / LIVE-2 timelines | fixed | Sanitizer quotes were monospace text inside the SVG and overflowed on phones. Notes overlapped. The axis did not say it is schematic | Quotes moved to HTML code blocks under each timeline. Notes in lanes. Axis: "time within one call (schematic)" |
| LIVE-1 / LIVE-2 crash dots | redesigned | A custom fixed-width chart; labels were cut on phones | Rebuilt on the shared primitives with a log axis ("reloads while audio ran"). Crash counts go in the row labels |
| LIVE-3 main + waveform | fixed | Stat tiles duplicated the table and overflowed on phones. The legend overflowed. Notes overlapped the trace | Tiles removed. Legend text moved to the caption and a lane. Notes in lanes. Axis: "time relative to the reset (ms)" |
| LIVE-6 | fixed | A custom axis with clipped ticks. In-row "mic ×2 speed" labels crowded the waveform | Standard axis with a label giving the buffer length. One lane explains the halves |
| I-01, PT-5, I-02 panels | kept | Single-trial rows on a trial axis; they already fit the panel width | Tick labels now render at CSS size (the row width is taken from the panel) |

The short cards and the compact table have no graphics. The methods section has no figures; the earlier five-step diagram was replaced by prose.
