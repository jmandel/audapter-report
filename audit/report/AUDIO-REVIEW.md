# Audio review (REPORT-26, REPORT-29)

One row per card with audio. All values are measured independently of Audapter's tracker and logs, on the WAV files the reader
plays: `report/measure.py` (autocorrelation LPC for F1/F2, per-frame output/input F1 ratio on connected speech, autocorrelation F0,
A-weighted level in dBA, exact-zero runs), or the harness's `est_formants.m` / `est_f0.m` for the cards kept from earlier. Each card's clips share
one playback gain, so level differences are real. Current numbers: `prototype/build-manifest.json` → `values`.

**Playhead column.** Mapped clips carry the figure panel, trial and within-trial offset (built from the figure's own trial boxes;
`build.py` refuses a clip whose trial the figure does not draw). `check-render.mjs` places the playhead at clip time 0 and at the
clip's end and asserts both fall inside the named trial box of the named panel, at desktop and 390 px (last run: 19 mapped clips,
0 problems in either layout). "T4 exp" = trial 4 of the Expected panel. "—" = no playhead, with a note under the clip (A/B clips,
secondary synthetic clips when the figure shows the real voice, and figures without a time axis).

| Card | Design (source) | Real speech: clip, expected vs observed (measured) | Synthetic: expected vs observed (measured) | Playhead | Verdict |
|---|---|---|---|---|---|
| I-01 | simonSingleWord v2 masking phase (fb 2), trial 6 of 24 | none: in fb 2 the participant hears only the noise (stated on the card) | pre-b2.4 buffer: no silent run (−20.9 dBFS in the window); current: 16 ms of exact silence at 0.984 s | T6 exp, T6 obs; A/B — | pass (short dropout; headphones advised) |
| PT-5 | A: blab's timeWrap / cerebTimeAdapt settings (24 kHz, frameLen 32, nDelay 3): pre phase bPitchShift 0 vs later phases bPitchShift 1 + warp-row PCF | ARCTIC clb a0018: pre 0.0 dBA vs later −2.8 dBA (−2.8 to −3.5 dBA on four voices), output 13.3 ms later (clicks) | — | A: T1 exp (input), T1 exp, T2 obs; A/B — | pass |
| PT-5 (C) | hypothetical: vocoder on without a PCF after a baseline (unused runner settings in the cerebTypicalProduction folder) | ARCTIC clb a0018: 0.0 dBA vs +3.5 dBA | — | C: T1 exp, T2 obs | pass |
| PT-5 (B) | timeAdapt settings (24 kHz, frameLen 48), control vs warp trials | ARCTIC clb a0018: control with zero-length warp row −0.3 dBA; without warp section +6.0 dBA; warp trial −0.2 dBA (6.2 dBA cue) | pitch-onset step in the real-speech section and the browser panel | T1 exp, T1 exp, T1 obs, T2 obs; A/B — | pass |
| FMT-LEVEL | blab's standard formant settings, field ±125 mel, ratio ±20 %, 2-D centralization 0.5; bGainAdapt 0 vs 1 | ARCTIC bdl: F1 −125 mel +2.9 dBA (+6.7 dB RMS), +125 mel −0.7 dBA (−2.4 dB RMS) re unshifted (bGainAdapt 0); 8 voices in the figure | — | — (per-voice figure, not a session) | pass (A/B of −125 vs +125 mel) |
| F6 | restricted field standing in for vsaSentence | real-speech section kept (80 clips: 42,947 vs 21,006 perturbed frames) | final /a/ of a glide: one-shot 767 Hz vs current 909 Hz | — (figure is a rule comparison, not a session) | pass |
| LAB-1 | vsaCentralize public runner, strength 0.5 | PVQD LA9015 /i/: spoken F2 2292 Hz; correctly wired 1926 Hz (toward the centre); as committed 2562 Hz (away) | synthetic /i/: 1906 vs 2524 Hz | — (vowel-space figure) | pass |
| LAB-2 | vsaGeneralize public runner, strength 0 (baseline training) | PVQD LA9015 /ɑ/: spoken F2 1163 Hz; intended 1163 Hz; as committed 1923 Hz | synthetic /u/: F2 971 → 1889 Hz | — (vowel-space figure) | pass |
| LAB-3 | vsaGeneralize fb 4 phases, p.fb4Gain | ARCTIC bdl a0005 in fb 4: −42.4 vs −32.2 dBFS A-weighted (+10.2 dBA) | synthetic /ɑ/: +10.2 dB (export log) | — | pass |
| OST-F1 | hypothetical mixed "shift the first word" design, RMS-floor onset, trial 4 after a long catch trial | PVQD SJ7001 /ɑ/ + /i/: word 2 +1 % expected vs +80 % observed (F1 253 → 454 Hz; 125 mel is large at a low F1) | word 2 −1 % vs +18 % (519 → 612 Hz) | T4 exp (input), T4 exp, T4 obs; A/B —; synthetic — | pass |
| COORD-1 | measureFormants calibration then an attentionComp-style field block, with/without the clear lines, trial 3 | ARCTIC clb a0030: F1 +23 % expected vs −1 % observed (median per-frame ratio) | +20 % vs +1 % | T3 exp (input), T3 exp, T3 obs; A/B —; synthetic — | pass |
| OST-F5 | hypothetical sustained-vowel pitch design, catch trial 2 | PVQD SJ7001 /a/: 0 cents expected vs +198 cents observed | 0 vs +200 cents | T2 exp (input), T2 exp, T2 obs; A/B —; synthetic — | pass |
| OST-F2 | hypothetical OST with a maxIOI timeout, three trials, OST loaded once | PVQD SJ7001 /a/ played softly: shift from 0.30 s intended, from 0.20 / 0.41 / 0.61 s observed; F1 at 0.21–0.30 s trial 1: 0 % vs +18 %; at 0.42–0.60 s trial 3: +12 % vs 0 % | same timings (report_ost_f2.m) | T1 exp (input), T1 exp, T1 obs, T3 obs; A/B —; synthetic — | pass (subtle: timing of a 12–18 % F1 change) |
| OST-F8 | hypothetical AND_RATIO rule with {} | real-speech section kept (/sh/ onsets) | hold: +10 dB from 0.486 s; {}: 48 ms early, and from a click | — (figure has no trial boxes) | pass (kept) |
| I-02 | hypothetical fb 5 design | real-speech section kept | mix −0.7 vs +5.3 dB | — | pass (kept) |
| I-03 | hypothetical 35 s trial | none: longer than any corpus clip (stated) | ramp −5.2 dB at 30 s, no mute at 34 s | — | pass (observed-only illustration) |
| I-04 | offline reuse of one frame array | none: the effect is exact sample reuse, input-independent (stated) | condition 2: 599 Hz fresh vs 715 Hz reused | — | pass (kept) |
| CORPUS-11 | Audapter's 2008 example trial under today's defaults | the input is itself a real recording (blab_diao1_female) | mel ×1.21 vs ratio ×102.8, +13.3 dBA | — | pass (kept) |
| LIVE-3, LIVE-6 | live-path simulation | none: the live simulation was run with a synthetic vowel (stated) | burst +17.0 dB / raw microphone an octave up | — | pass (kept) |
| CORPUS-8, CORPUS-10, FMT-F1, OST-F4, LIVE-1/2 | — | — | — | — | figure-only, reason on each card |

### Pitfall pass (REPORT-35)

| Card | Design | Real speech: expected vs observed (measured) | Synthetic | Playhead | Verdict |
|---|---|---|---|---|---|
| OST-NUM | hypothetical: 0.2 s F1 shift after a random post-onset delay; correct vs misnumbered OST | PVQD SJ7001 0.35 s vowel, trial 2 (150 ms delay): 140 ms of the vowel shifted vs 46 ms | — | T2 exp (input), T2 exp, T2 obs; A/B — | pass (timing; the late shift is audible as a change only at the vowel's end) |
| FMT-PATCH | hypothetical ±90 mel /ɛ/ patch, with vs without F1Min..F2Max | — (synthetic tokens place formants exactly) | outlier token 5: 0 vs 64 mel | — (vowel-space figure) | pass, subtle (a 64 mel F1/F2 change) |
| INIT-PERSIST | hypothetical two-block session; block 2's p lacks bPitchShift | ARCTIC clb a0030: 0.0 vs +3.5 dBA | — | exp/obs block 2; A/B — | pass |
| WARP-48 | timeAdapt settings: the same warp at frameLen 32 and 48 | ARCTIC clb a0018 at both frame lengths (for listening) | sweep: 58.5 vs 44.0 ms delivered of 60 | — | figure-first (a 15 ms timing difference is hard to hear) |
| TDS-ONSET | hypothetical +2 st step 0.2 s after onset | ARCTIC bdl a0005 (observed only) | — | — | figure-only in substance (the point is timing vs acoustic onset: 56–111 ms) |
| PVOC-NOISE | hypothetical ±2/±4 st shifts at 24 kHz/frameLen 48 | ARCTIC slt /ʃ/: 0 st vs −4 st, −10.3 dBA (ISO 532-1 −8.7 to −10.0 phon) | noise band −6.4 to −14.8 dBA | — | pass |
| PB-DSCALE, REINIT-PARAMS, COORD-10 | short cards | — | — | — | no audio (numbers only) |

