# Audio review (REPORT-26)

One row per card. "Measured" values are computed independently of Audapter's tracker and logs: for the reworked cards
by `report/measure.py` on the published or measurement WAV files (autocorrelation LPC for F1, autocorrelation F0,
RMS level, exact-zero runs), for the other cards by the harness's `est_formants.m` / `est_f0.m` / RMS on
`signalOut`. Each card's clips share one playback gain, so level differences are real. Values quoted here are
those of the current build (`prototype/build-manifest.json`, `values`).

Verdicts: **pass** = the expected clip audibly does the intended manipulation (or is meant to do nothing and does
nothing), the observed clip differs audibly in the bug's direction, and the numbers under the figure match the clip
labels. **figure-only** = no clip, with the reason on the card.

| Card | Design and source experiment | Expected (measured) | Observed (measured) | Verdict |
|---|---|---|---|---|
| I-01 | blab's simonSingleWord v2 masking phase: fb 2, fb2Gain 0.16, 1.8 s trials, init per trial, bundled babble via get_noiseSource; trial 6 of 24 | pre-b2.4 buffer: babble continuous, −20.9 dBFS in the 0.984–1.000 s window (no silent run) | current build: exact silence 0.984–1.000 s (16 ms); 4 gaps in 24 trials (trials 6, 12, 17, 23) | pass, but short: a 16 ms dropout in babble is heard as a brief tick; the card says to listen on headphones. A/B clip provided |
| PT-5 | blab's timeAdapt settings (24 kHz, downFact 2, frameLen 48, bPitchShift 1); real sentence (CMU ARCTIC clb a0018); control vs warp trials | control with zero-length warp row −0.1 dB, warp trial 0.0 dB re input | control without warp section +6.0 dB, warp trial 0.0 dB: a 6.0 dB cue | pass (6 dB is clearly audible; A/B clip control → warp) |
| F6 | restricted 1-D field F1 +20 % above 600 Hz, standing in for vsaSentence's restricted 2-D field; /a/→/i/→/a/ glide and /a/ with a dip | one-shot rule (2.1.5): final /a/ 767 Hz (spoken 778 Hz) | current blab: final /a/ 909 Hz (+17 %) | pass (kept from REPORT-25; here "expected" is the 2.1.5 rule, "observed" is what vsaSentence relies on; the card frames it as a behaviour change) |
| OST-F1 | hypothetical mixed "shift the first word" design, blab standard settings, blab's RMS-floor onset → FALL, catch trials; trial 4 after a long catch trial | word 1 +20 % (698 → 839 Hz), word 2 −1 % (519 → 512 Hz) | word 1 +20 %, word 2 +18 % (519 → 612 Hz); trial 7 word 2 +18 % | pass (A/B clip; the expected run is the same trial in a fresh process, equal to the one-line fix to the frame in the browser build) |
| COORD-1 | blab session: measureFormants calibration (2 trials), then an attentionComp-style field experiment (125 mel, fb 3 babble 0.02), with vs without the runner's two clear lines; trial 3 | F1 +20 % (698 → 839 Hz) | F1 +1 % (698 → 702 Hz): no shift | pass (A/B) |
| OST-F5 | hypothetical sustained-vowel pitch design (+2 st, pvoc, blab defaults), catch trial 2 after a trial that ended while shifted | all-zero PCF catch: 0 cents | catch made with pcf '': +200 cents | pass (a whole tone, clearly audible; A/B) |
| OST-F2 | hypothetical OST with a maxIOI timeout, 3 trials, OST loaded once | control: shift starts 0.30 s | trial 1 shift starts 0.20 s (F1 997 vs 789 Hz at 0.22–0.28 s); trial 3 at 0.61 s (F1 788 vs 997 Hz mid-vowel) | pass, subtle: 0.1–0.3 s timing differences on a synthetic vowel; kept from REPORT-25 |
| OST-F8 | hypothetical AND_RATIO fricative-onset rule with {} in field 5 | hold 0.05 s: +10 dB from 0.486 s, click ignored | {}: +10 dB 48 ms early, and from 0.116 s after a click | pass (kept) |
| I-02 | hypothetical fb 5 design, closedLoopGain 15 vs 21 dB | speech/noise mix constant (+1.3 dB) with the fix | mix −0.7 dB vs +5.3 dB: 6 dB apart | pass for the observed pair; there is no "expected" clip (the fixed build is in the browser panel). Kept |
| I-03 | hypothetical 35 s trial with trialLen 34 s and a 50 ms ramp | — | 27–35 s of output: a −5.2 dB ramp at 30 s, no mute at 34 s | pass as an observed-only illustration; the main finding (lost data) is figure-only by nature. Kept |
| I-04 | offline reprocessing reusing one frame array for two conditions | condition 2 fresh: F1 599 Hz (−18 %) | condition 2 reused: F1 715 Hz | pass (kept) |
| CORPUS-11 | Audapter's 2008 example trial parameters under today's defaults | mel mode: F1 ×1.21 | ratio mode: F1 ×102.8, +23.8 dB, clipped | pass (kept; the observed clip is loud, with a warning) |
| LIVE-3 | hypothetical always-on reset() during voicing, simulated live path | reset without a burst | burst +17.0 dB above the normal peak, 6.5 ms | pass (kept, warning on the clip) |
| LIVE-6 | blab's frame settings on a 128-sample sound-card buffer, simulated live path | matched buffer: normal processed voice | raw microphone, decimated: an octave up with gaps | pass (kept) |
| CORPUS-8, CORPUS-10, FMT-F1, OST-F4, LIVE-1/2 | — | — | — | figure-only, as before: logged values (CORPUS-8), a hang with no output (CORPUS-10), heap contents that vary by machine (FMT-F1, OST-F4), a crash (LIVE-1/2) |

Removed: the old OST-F1 trial-A/trial-B clips and its real-speech layer (COORD-2 found the real-speech pair backwards and the
design contrived), the old COORD-1 pitch_pert.pcf clips and real-speech layer, the old I-01 "5 s noise file" and 10 s-babble
clips (the generic case stays as a table row and in the browser panel), and the PT-5 pitch-step clips (the step stays in the
table, the real-speech section and the browser panel).
