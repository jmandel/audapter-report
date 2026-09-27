# Area "corpus": real-speech tests (session 2)

Corpus: `audit/corpus/` (80 clips, 48 kHz mono, all redistributable; see its README.md). Test scripts:
`audit/harness/oct/corpus_*.m`, run by `audit/harness/run-corpus.sh`. Logs are in `audit/harness/logs/corpus_*.log`.
Real-speech report exports are in `audit/harness/oct/out/report/<finding>/real/` (produced by `corpus_report.m`).
Permalink base: https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/

References used, from strongest to weakest:
- Hillenbrand et al. (1995): hand-corrected formants. Licence-restricted, so it is used locally only (`corpus/fetch_restricted.sh`).
- CMU ARCTIC forced-alignment phone labels, and vocadito expert F0.
- The recorded online Audapter logs in the upstream example trials.
- Automatic Praat tracks (`corpus/ref`). These are only trusted where Praat and the harness's independent LPC agree within 10 % ("consensus frames").

## New findings

### CORPUS-10. Formant tracker hangs forever (hqr_roots has no iteration cap) after a frameLen/nDelay change
- Severity: high (MATLAB or the audio callback freezes; the experiment must be killed)
- Location:
  - lpc_formant.cpp:395-500 (`hqr_roots`). The loop `while (nn >= 1) { its=0; do {...} while (l < nn-1)` has no `its == 30` exit; the Numerical Recipes original has one.
  - Audapter.cpp:758-766: `framelen` rebuilds the pvoc and the TDS but not the formant tracker, and `ndelay` rebuilds nothing (see FMT-F15).
- Blab-only? no
- What: after one trial with frameLen 32 / nDelay 5, switching to frameLen 64 / nDelay 7 (the settings of the upstream `time_domain_shift_demo.m`) leaves the formant tracker built for the old sizes. On one real sung clip (vocadito_4, F0 about 120 Hz, TDS +1 st, pitch bounds 70-300 Hz), `Audapter('runFrame')` never returned.
  - `perf` on the hung process: 100 % of samples are in `LPFormantTracker::hqr_roots`, with NaN operands on the stack (0x7ff8...).
  - NaN makes the deflation test `fabs(a)+s == s` never true, so the QR iteration never ends.
  - The same clip completes in a fresh session. Three other clips complete after the same switch. So a stale tracker plus a particular signal yields NaN LPC coefficients.
- Evidence:
  - `harness/oct/corpus_tdshang.m`: `SCEN=vocadito_4 VARIANT=after32 ./run-oct.sh corpus_tdshang.m` hangs (killed by timeout).
  - Without VARIANT, and on kearney_eee_male, arctic_bdl_a0005 and pvqd_LA9003_a, it completes.
- Workaround used in the tests: toggle `bCepsLift` in a throw-away `AudapterIO('init')`. That forces a tracker rebuild.
- Fix:
  - add `its` cap (return failure, keep the previous formants);
  - `if (!isfinite(...))` guard on the LPC coefficients;
  - set `bRemakeFmtTracker` for framelen/ndelay/nwin.
- Confidence: confirmed (hang reproduced; hot function by profiling). The exact NaN origin is likely, not traced.

### CORPUS-8. Audapter's pitch tracker (data.pitchHz, used for TDS) reports ~2x F0 on low voices with the default frame settings
- Severity: medium-high (logged pitchHz / shiftedPitchHz are wrong by an octave for most adult male speech; the TDS works on half cycles)
- Location:
  - lpc_formant.cpp:678-697: cepstral pitch search within sr/pitchUpperBound .. sr/pitchLowerBound.
  - Audapter.cpp:1896-1900: f0BandpassFilter is centred on getLatestPitchHz.
  - Audapter.cpp:2098-2104: logging.
- Blab-only? no
- What: with frameLen 32 / nDelay 5 (defaults; the analysis buffer is 18 ms), the tracker vs the Praat F0 reference gives:

  | Group | Median tracker/ref ratio | Frames within 5 % |
  |---|---|---|
  | Adult male (84-128 Hz) | 1.80 (2.0-2.3 for F0 < 110 Hz) | 7 % |
  | Adult female overall | – | 46 % |
  | ARCTIC slt/clb at 178-195 Hz | 1.6-2.1 | – |

  With frameLen 64 / nDelay 7 (the TDS demo's settings) the same clips give 1.00-1.01 and 80-86 % of frames within 5 %.

  The heard +1 st TDS shift is still about right (median 101-104 cents), because the shifter then splices at the 2nd-harmonic period. But `data.pitchHz` and `data.shiftedPitchHz` are not F0. In the logs, shiftedPitchHz/pitchHz is 72-77 cents instead of 100 on low male voices, because the two estimators disagree.

  Nothing warns when bTimeDomainShift=1 is combined with the default frame settings.
- Evidence: corpus_shift.log, "time-domain shift" section; tdsdef vs tdsdemo rows. Per-clip values are in out/corpus_shift.csv.
- Confidence: confirmed

### CORPUS-11. No bound on the shifted-formant target: Hz/mel-sized pertAmp in ratio mode gives sfmts of 130 kHz and +24 dB output
- Severity: medium (a silent, participant-safety relevant misconfiguration)
- Location: Audapter.cpp:1855-1872. `sf1m = f1m * (1 + mamp*cos(mphi))` and `newPhis[0] = sf1m/p.sr*2*pi`, with no clamp to (0, Nyquist).
- Blab-only? no. MATLAB defaults are bRatioShift=1 / bMelShift=0 in both upstream and blab; the C++ defaults are 0/1 (Audapter.cpp:336-337).
- What: the upstream example trial diao1_female (2008) stores pertAmp up to 164, which is in mel. Its params carry no bRatioShift/bMelShift. Merged into today's `getAudapterDefaultParams` and replayed:
  - Ratio mode, the MATLAB default: sfmts/fmts F1 = 102.8, max sfmts F1 = 129,992 Hz, output +23.8 dB above input, peak 4.56 x full scale.
  - Mel mode: F1 x1.214, against 1.223 logged online in 2008.
- Evidence: corpus_regress.m, blab_diao1_female block.
- Fix: reject |sF1|,|sF2| outside (0, 0.45 sr); warn when bRatioShift=1 and max|pertAmp| > ~2.
- Confidence: confirmed

### CORPUS-3. Young children (6-7 y): the female preset underestimates F2 by about 12 %; nLPC 11 fixes it
- Severity: medium (for paediatric formant-perturbation studies)
- Location: getAudapterDefaultParams.m (no child preset; female nLPC 15 at 16 kHz)
- Blab-only? no
- What: on consensus frames of 8 speechocean762 children (ages 6-7, F0 217-315 Hz), the female preset gives:
  - F2 bias -11.9 %, median abs error 6.6 %, gross (>20 %) errors 18 %;
  - worst clips F2 -22 % (e.g. 1389 vs 1952 Hz).

  The nLPC sweep: nLPC 11 gives 1.7/2.0 % (gross 10 %); nLPC 15 gives 5.6/12.3 %.

  Negative control: Hillenbrand's 10-12 year olds are within 2 % with the female preset (CORPUS-2), so the problem is specific to younger and higher-formant voices.
- Evidence: corpus_track.log (group table and nLPC sweep)
- Confidence: likely. The reference is automatic (consensus frames), not hand-measured.

### CORPUS-4. Whole-token F2 mis-tracking on a male /a/ (F3 reported as F2) with the male preset
- Severity: low-medium
- What: PVQD LA9022 sustained /a/ (F1 632 Hz, F2 1000 Hz). The male preset (nLPC 17) reports F2 = 2494 Hz on 100 % of frames. nLPC 15 is correct (994 Hz). Under an F2-indexed field or an F2 shift, the perturbation is computed from F3.
  1 of 4 male sustained /a/ tokens. Hillenbrand men's /ah/ and /aw/ are fine (F2 error 2 %).
- Evidence: out/corpus_track.csv rows pvqd_LA9022_a
- Confidence: confirmed (one token)

### CORPUS-7. The phase vocoder boosts low frequencies: +7 dB at 30 Hz vs +3.5 dB broadband
- Severity: low-medium (it changes the SNR and timbre of what the participant hears)
- Blab-only? no (pvoc is bit-identical to upstream on the whole corpus)
- What: with bPitchShift=1 at 0 st, pure-tone gains are:

  | Tone | Gain |
  |---|---|
  | 30 Hz | +7.00 dB |
  | 50 Hz | +5.68 dB |
  | 80 Hz | +4.03 dB |
  | 100 Hz | +3.61 dB |
  | ≥150 Hz | +3.52 dB (the PT-5 offset) |

  Consequences:
  - The real bus noise from a VoiceBank-DEMAND clip gets +7.4 dB against +3.6 dB for the clean speech, so pvoc lowers the SNR at the ear by ~3.8 dB for low-frequency noise.
  - The noisy clips' overall 0 st gain is +4.7 to +6.0 dB.
- Evidence: `harness/oct/corpus_pvoc_lf.m` (tone sweep plus the noise/clean split); noisy-clip gains are in out/report/pt-5/real/data.json (noisy_gain0_db_range).
- Confidence: confirmed (the mechanism in phase_vocoder.cpp was not isolated)

## Confirmations on real speech (report findings)
Values are real speech vs the synthetic numbers on the report cards. Exports are in out/report/<id>/real/.

### OST-F1: confirmed, with nuance
The OST is ELAPSED 0.1 → INTENSITY_FALL 0.01/0.02 → END, with F1 +30 % in state 1, over 6 pairs (trial A long, trial B short):
- 4/6 pairs change: the fall is detected 0.04, 0.43, 0.79 s later, or never.
- In one pair the F1 perturbation is applied for 0.32 s only after trial A (0 s fresh). In another it is extended from 0.56 to 0.87 s.
- 2/6 pairs are unaffected, because the fall never fires in B.
- With real leading silence, the fall can fire inside the pre-speech silence (0.13 s), before any speech.

The example_data 'ost' (RISE_HOLD → FALL → ELAPSED) shows no leak in 6/6 pairs, so the leak needs the ELAPSED → FALL pattern.

### OST-F2: confirmed exactly
Quiet real speakers (active RMS 0.01), with the OST not reloaded:
- the timeout fires at 0.203 / 0.405 / 0.607 / 0.809 / 1.011 s on trials 1-5 (0.203 s every trial with a reload);
- the ELAPSED 0.1 s state is held 2 ms instead of 100 ms on every trial.

### PT-5: confirmed; the real-speech range is wider than synthetic
- 0 st gain +3.53 to +3.55 dB on every clean group.
- Steady step 0 → +2 st: median -4.3 dB (M), -5.0 dB (F), -4.4 dB (children); range -2.5 to -10.3 dB.
- 0 → -2 st: -1.1 to -9.6 dB.
- Heard step at a mid-utterance +2 st onset (example ost + pitch_pert.pcf): -1.2 to -7.3 dB (median -3.4) over 9 clips.
- Card (synthetic): 0.8-8.8 dB.
- Pitch accuracy on clean real speech: median |error| < 3 cents; outliers are measurement failures on 0.7 s words.

### Formant shifting: confirmed OK
- Over 78 clips, 3 shift patterns and every group, logged sfmts/fmts = commanded exactly (max error 0.0000).
- The output measured by independent LPC, on frames where that LPC agrees with the tracker, is within median 1.9-3.3 % of the commanded ratio.
- Larger deviations only occur at F0 ≥ 260 Hz (the LPC measurement limit) and on the CORPUS-4 token.

### Tracker vs Hillenbrand (restricted; numbers only): CORPUS-2
Within 1.3-2.0 % median (10-27 Hz) for men, women, boys and girls.

### F6 (dropout fix): confirmed; larger on real speech
Field F1 350-900 / F2 900-2600 Hz, F1 +20 %:
- Over the corpus, blab shifts 42,947 frames against upstream's 21,006 (+104 %), on 61 of 80 clips.
- Example: ARCTIC "I had faith in them". Upstream shifts 0.08-0.38 s (one segment). Blab shifts 7 segments totalling 0.70 s, up to 1.13 s, including later words.
- On the 2008 diao1 trial, the frames shifted were:

  | Source | Frames shifted |
  |---|---|
  | Online log (2008) | 944-1128 |
  | Upstream 2.1.5 | 883-1128 |
  | Blab | 883-1193 (+87 ms after the online end) |

### I-01: confirmed
With real sentences as input (fb 3, 5 s noise), the noise is absent 5.1-10.0 s (5.0 s of 12 s). As expected, the result does not depend on the input.

### I-02: confirmed
The speech-modulated/playback ratio moves by 20·log10(dScale): -2.0 dB at dScale 0.795 and +4.0 dB at 1.587, relative to dScale 1.

### OST-F8: nuance, not a clean confirmation
With the card's thresholds (rms 0.01, ratio 1.5), neither variant fired at the /sh/ onsets of 4 ARCTIC "She turned ..." clips:
- the 50 ms hold never fired;
- `{}` fired in 2/4 clips at 0.17 and 0.26 s, i.e. 110-150 ms after /sh/ onset.

The rule's ratio threshold needs per-speaker tuning on real fricatives before the hold matters.

## Negative results
- **OST-F3 known:** the ASan corpus sweep (7 scenarios x 80 clips) aborts at the known ost.cpp:361 read on the first OST scenario.
- **ASan sweep without the OST scenarios** (6 x 80 = 480 clip-scenarios): 0 ASan errors. The only UBSan site is the known Audapter.cpp:2124 DAF read (H2/FORMAL-2).
- **Output sanity:** no NaN/Inf, no clipping and no gain > +10 dB anywhere in the corpus sweep at sane settings.
- **Differential:** blab = upstream bit-for-bit on 80 real clips for track, field F1 +20 % (whole plane), PCF formant, pvoc +2 st, PCF pitch, TDS +1 st and 100 ms DAF. Differences appear only with a restricted field (dropout fix).
- **Replay of the upstream 2008 online trials:** the tracker reproduces the logged fmts within 0.2-0.4 % (1-4 Hz).
- **OST onset on connected speech:** detection is robust. It lags the first vowel by +39 ms (median; -43 to +125 ms) at nominal level and never fires before speech in 2.5-7.5 dB SNR noise.
- **INTENSITY_FALL as "end of first word":** on connected speech it fires within 50 ms of the true word end in 0/19 ARCTIC sentences. It fires at the next real pause, +0.3 to +1.1 s later depending on level. In 2.5 dB SNR noise it mostly never fires (7/8), so a perturbation keyed to it is never delivered.
- **TDS integer-period quantisation (confirms 17f):** at F0 ≈ 262 Hz (VocalSet), +1 st is heard as +90 cents while the log implies exactly +100.

## Coverage gaps
- No F0 above ~350 Hz: VocalSet's female long tones are at ~262 Hz, not 530 Hz.
- No hand-measured formants among the redistributable clips.
- Children are 6-7 year old Mandarin-L1 English readers.
