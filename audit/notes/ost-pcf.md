# OST / PCF audit (area: ost-pcf)

Scope: `TransShiftMex/ost.cpp`, `ost.h`, `pcf.cpp`, `pcf.h`, `utils.cpp`, and the OST/PCF call sites in
`Audapter.cpp` (osTrack call ~1797, formant pert 1807-1845, pitch/int shift 1968-1974, time warp 2018-2050,
readOSTTab/readPertCfg 3122-3220). Also checked `audapter_matlab/mcode/gen_multi_pert_pcf.m`, `gen_pert_pcf.m`,
the example `.ost`/`.pcf` files, `doc/ostParams.pdf`, `doc/PertCfgFileFormat.pdf`, and the 2.1.5 manual (Sect. 7-8).

Blab diff (upstream/master..origin/master) for this area: 6 new OST modes (enum 12, 13, 21, 32, 40, 45), a new
`prm3` column, and the removed check that field 5 must be `{}`. No blab change to `pcf.cpp`/`utils.cpp`, and
no blab change to the OST/PCF call sites apart from the taimComp clamp condition at Audapter.cpp:1814.

Several findings were confirmed by running a standalone driver. It compiles the real `ost.cpp`/`pcf.cpp`/`utils.cpp`
with a stub `mex.h` (with `-include cmath -include cstdlib`; `ost.cpp` does not include `<cmath>`) and calls
`OST_TAB::osTrack` frame by frame with synthetic RMS/ratio/slope values:
`~/hobby/audapter/audit/scratch/ost-pcf/t/{drv.cpp,drvp.cpp}` (run `./drvplain <case>`, `./drvp <case>`; ASan build = `./drv`).
The driver calls the loop the way Audapter does: `stat=0` and counters reset per trial, and `OST_TAB::reset()`
is never called between trials, which is what Audapter does (see F1).

---

### F1. `OST_TAB::reset()` is never called, so OST state leaks across trials (lastStatEnd, statOnsetIndices, stretch counters)
- Severity: high
- Location: ost.cpp:97-101 (reset), Audapter.cpp:522-680 (`Audapter::reset` sets `stat = 0` at :651 but never calls `ostTab.reset()`); grep shows no caller of `ostTab.reset` anywhere (same in upstream).
- Blab-only? no. Blab's new `INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR` makes it more likely to show up, because it never updates `lastStatEnd`.
- What: `lastStatEnd`, `stretchSpanAccum` and `statOnsetIndices[]` carry over from the previous trial. `data_counter` restarts at 0 each trial. `lastStatEnd` is never initialized by the constructor either; it is 0 only because `audapter` is a function-static object in mexLibrary.cpp:84. `INTENSITY_FALL` (ost.cpp:546) fires only when `data_counter - lastStatEnd > minDurN`. If the rule before it did not set `lastStatEnd` in the current trial, a previous trial's large `lastStatEnd` blocks offset detection until the frame count passes the previous trial's value. Rules that don't set it: ELAPSED_TIME, the hold branch of the RATIO modes, the blab RMS_FLOOR mode. The perturbation turns off late, with no error.
- Evidence (driver `fall_leak`; OST `0 ELAPSED_TIME 0.1 / 1 INTENSITY_FALL 0.01 0.02 / 2 OST_END`):
  `trial 0: speech offset at 800, INTENSITY_FALL fired at frame 804`
  `trial 1: speech offset at 200, INTENSITY_FALL fired at frame 815` (delayed about 1.2 s)
- How to test headlessly: load that OST and a PCF with `fmtPertAmp` nonzero in state 1. Run trial A: tone/noise burst at RMS well above 0.01 from 0.04 s to 1.6 s, then silence, and call `reset`. Run trial B: the same burst ending at 0.4 s. Assert that `ost_stat` in trial B reaches 2 within about 30 ms of the burst offset, and that sFmts is zero after offset + 30 ms. It currently fails.
- Confidence: confirmed (driver).

### F2. maxIOI jump writes the wrong onset index: target state onset is never set, and the current state's onset is corrupted (drift across trials)
- Severity: high
- Location: ost.cpp:726-731
- Blab-only? no
- What:
  ```c
  for (j = stat + 1; j <= maxIOICfg.stat1[i]; j++) {
      statOnsetIndices[stat] = frame_counter;   // should be [j]
  }
  stat_out = maxIOICfg.stat1[i];
  ```
  (a) The onset of the state jumped to, and of any skipped states, keeps its stale value, which may come from an earlier trial or be 0. ELAPSED_TIME in that state, 6-column time-warp atoms anchored on it, and later maxIOI rules measured from it all use the wrong reference. (b) `statOnsetIndices[stat]` for the state being left is overwritten. When that state is 0, the change is permanent: nothing else ever writes index 0, and it is not reset between trials. From then on, every "from state 0" timing is measured from the stale frame. That covers maxIOI rules with stat0 = 0, `0 ELAPSED_TIME`, and every 5-column (format 1) time-warp atom, since those use ostInitState = 0. The error grows with each timed-out trial.
- Evidence (driver): OST `0 INTENSITY_RISE_HOLD / 2 ELAPSED_TIME 0.1 / 3 OST_END`, maxIOI `0 0.2 2`, no speech:
  `enter2 frame 101, enter3 frame 102 => ELAPSED_TIME measured 0.002 s (expected 0.1)` and `statOnsetIndices[0]=101`.
  Over three consecutive trials the 0.2 s timeout fired at frames 101, 202, 303 (expected about 101 each time).
- How to test headlessly: use the OST above plus a PCF with pitchShift or fmtPertAmp only in state 2. Feed 3 trials of low-level noise (RMS about 0.001), calling `reset` between them. Assert that in each trial `ost_stat` first reaches 2 at t ≈ 0.2 s and stays in 2 for about 0.1 s before reaching 3. Currently trial 1 stays in state 2 for one frame, and trials 2 and 3 time out at 0.4 s and 0.6 s.
- Confidence: confirmed (driver).

### F3. `stat0[i + 1]` read past the end on every frame once the final rule is reached
- Severity: medium. It is always out of bounds, and it becomes a silent behaviour change when the last rule is not OST_END.
- Location: ost.cpp:360-365
- Blab-only? no
- What: the segment lookup `stat >= stat0[i] && stat < stat0[i+1]` reads `stat0[n]` (heap garbage) for i = n-1. With a proper trailing OST_END this does no harm beyond being UB, because both outcomes do nothing. But if the last rule is a real heuristic (the manual requires OST_END, but nothing enforces it), whether that rule ever runs depends on heap contents.
- Evidence: ASan reports heap-buffer-overflow READ at ost.cpp:361 for every well-formed test OST. The driver `lastnotend` (`n = 1`, `0 INTENSITY_RISE_HOLD 0.02 0.01 {}`, loud input) ends with `final stat 0`: the rule never ran.
- How to test headlessly: build the harness with `-fsanitize=address` and run any OST, e.g. `example_data/two_blips.ost`, with a burst input. ASan will flag it immediately. Also add a behavioural test: a one-rule OST without OST_END should either be rejected at load or advance.
- Confidence: confirmed (ASan + driver).

### F4. PCF formant-perturbation arrays indexed by `stat` without a bounds check; OOB read decides `during_trans`, `mamp` and `mphi`
- Severity: high. Silent wrong or garbage formant perturbation when the PCF has fewer rows than the OST has states.
- Location: Audapter.cpp:1811 (`during_trans = (pertCfg.fmtPertAmp[stat] != 0)`), :1841-1842 (`mamp/mphi = pertCfg.fmtPertAmp/Phi[stat]`). Compare :1971 and :2042, which do check `stat < pertCfg.n`.
- Blab-only? no
- What: nothing checks that the PCF `n` is at least max OST state + 1. The manual says it "should" be, but the parser never sees the OST. When `stat >= pertCfg.n` the code reads heap memory after the float arrays. On glibc, `fmtPertAmp[n+1]` lands on the malloc chunk header: a nonzero denormal, so `during_trans` becomes true and the formant filter runs. `fmtPertPhi[n+3]` read 4.3e18. On the Windows heap the values are unpredictable. Pitch and intensity are handled differently: for `stat >= n` they skip the update, so `intShiftRatio` and `p.pitchShiftRatio[0]` keep the last in-range state's values (see F5).
- Evidence: driver `drvp oob` (PCF n=5): `stat 6: fmtPertAmp[stat]=4.62428e-44 (!=0 -> during_trans=1)`, `stat 8: ... fmtPertPhi=4.34453e+18`.
- How to test headlessly: use OST `example_data/two_blips.ost` (states 0-6) with a 5-row PCF (states 0-4, all zeros), bShift=1, and a steady synthetic vowel (e.g. glottal pulse train through F1=700/F2=1200 resonators, RMS about 0.05). Assert that the output formants (`sfmts`) are 0 and that output equals input spectrally in states 5-6. Better: build with ASan and expect a read overflow at Audapter.cpp:1811. Fix direction: reject at load when the PCF has fewer rows than the OST has states, and guard `stat < n` everywhere.
- Confidence: confirmed on the parser side (driver); by reading for the call site.

### F5. PCF-driven pitch shift mutates the user parameter `p.pitchShiftRatio[0]`, which persists after the PCF is cleared; intShift is also sticky
- Severity: medium
- Location: Audapter.cpp:1970-1974, 1998, 2045; nullify path Audapter.cpp:3159-3161
- Blab-only? no
- What: with a PCF loaded, each frame writes `p.pitchShiftRatio[0] = 2^(pitchShift[stat]/12)`, overwriting the user parameter. After `Audapter('pcf','',0)`, `pertCfg.n == 0` and pvoc uses `p.pitchShiftRatio[0]`, which still holds the last frame's PCF value. For example, after `persistent_pitch_pert.pcf` it is 1.122. So a later "no PCF" run gets pitch-shifted feedback unless the script sets `pitchShiftRatio` again. `data.params.pitchShiftRatio` also reports the mutated value. The readPertCfg nullify path also returns without re-creating pVocs, so the old pvoc mode (e.g. TIME_WARP_ONLY) is kept. Within a trial, `intShiftRatio` keeps its last value once `stat >= n`.
- How to test headlessly: set bPitchShift=1 and load `persistent_pitch_pert.pcf` with any OST. Run a 1 s harmonic signal (f0 = 150 Hz), then `Audapter('pcf','',0)` and `reset`. Run the same signal again. Assert that the output f0 is 150 Hz (no shift) and that `getParam pitchShiftRatio == 1`. Currently expect about 168 Hz.
- Confidence: likely (by reading; untested in the harness).

### F6. Reloading an OST without a maxIOI section leaves `maxIOICfg.n` stale while its arrays are freed → NULL deref in the audio callback
- Severity: medium (MATLAB crash). The MATLAB writer `gen_multi_pert_pcf.m` produces exactly this kind of file.
- Location: ost.cpp:162-173 frees the arrays; ost.cpp:261-262 returns early without setting `maxIOICfg.n = 0`; the crash is at ost.cpp:725.
- Blab-only? no
- What: load OST A with `n = 1` maxIOI rules, then OST B with no trailing `n = ...` section. `gen_multi_pert_pcf.m:69-73` writes files without that section. `maxIOICfg.n` stays 1, `stat0` is NULL, and the first `osTrack` call segfaults.
- Evidence: driver `maxioi_stale`: `maxIOICfg.n=1 stat0ptr=(nil)` followed by a SEGV at ost.cpp:725.
- How to test headlessly: `setParam ost A.ost`, then `ost B.ost` (B has no maxIOI section), then run one frame of noise. Expect no crash.
- Confidence: confirmed (driver).

### F7. Sparse or mis-numbered OST states overflow `statOnsetIndices` (sized `4*n`); state numbers are never range-checked
- Severity: medium (heap write OOB, silent timing change)
- Location: ost.cpp:256 (`calloc(n * maxStatesPerLine)`), writes at 374/381/392/..., and maxIOI `stat_out = maxIOICfg.stat1[i]` at 731. PCF call sites index `[stat]` too.
- Blab-only? no
- What: in the +2 modes, the `else` branch handles any `stat > t_stat0` inside the segment. If the next rule's stat0 is more than t_stat0+2, the state climbs by 1 per frame until it reaches that stat0, writing `statOnsetIndices[stat_out]` as it goes. With `n=2: 0 INTENSITY_RISE_HOLD / 12 OST_END` the array has 8 entries and gets writes at index 8 and above (ASan heap-buffer-overflow WRITE at ost.cpp:392). The same mechanism silently adds delays in valid-looking files. A user who numbers a +1 rule (ELAPSED_TIME, INTENSITY_FALL) as if it were +2 gets that rule applied twice, so its duration doubles. That is plausible because the blab comment at ost.cpp:531 wrongly labels INTENSITY_FALL "(+2)"; see F9. The same goes for maxIOI `stat1` beyond the table, and for `stat0` values that are unsorted or negative (never validated).
- How to test headlessly: in ASan harness load `0 INTENSITY_RISE_HOLD 0.02 0.01 {} / 12 OST_END NaN NaN {}`, feed loud noise; expect ASan write overflow. Behavioural test: `0 INTENSITY_RISE_HOLD / 2 ELAPSED_TIME 0.1 / 4 OST_END` with a burst at 0.1 s should yield state 4 at about 0.15+0.1 s. It actually takes 0.2 s after the hold (state 3 gets a second ELAPSED_TIME). Fix: validate at load that the increments match the per-mode increments and that the max state is within bounds.
- Confidence: confirmed (ASan driver `sparse`); the doubling by reading.

### F8. Blab `INTENSITY_AND_RATIO_ABOVE/BELOW_THRESH`: the hold duration comes from field 5, and the documented `{}` placeholder silently parses as 0 s
- Severity: medium (blab-only; silent)
- Location: ost.cpp:230 (the `items[4] == "{}"` check removed), 249 (`prm3 = atof(items[4])`), 676/702 (`minDurN = floor(prm3/frameDur + .5)`)
- Blab-only? yes
- What: manual Sect. 7 says field 5 is a compulsory `{}` with no meaning, and every example/writer emits `{}`. For modes 40 and 45 that field is now the hold duration. `atof("{}") = 0`, which gives minDurN = 0, so the state advances one frame after the first qualifying frame (2 ms) instead of after the hold. Removing the `{}` check also means any junk in field 5 is accepted without a diagnostic for all modes. The verbose printout (ost.cpp:251-253) does not show prm3, so it is invisible there too.
- Evidence (driver `hold`, condition true from frame 100, 2 ms frames):
  `INTENSITY_AND_RATIO_ABOVE_THRESH 0.02 1.5 0.05 -> 25 frames = 0.050 s`
  `INTENSITY_AND_RATIO_ABOVE_THRESH 0.02 1.5 {}   -> 1 frames = 0.002 s`
- How to test headlessly: OST `0 INTENSITY_AND_RATIO_ABOVE_THRESH 0.02 1.5 {} / 2 OST_END`. Feed white noise (high rms_p/rms_s) with RMS 0.1 starting at 0.2 s. Assert the load is rejected, or that state 2 is not reached before 0.2 s + the intended hold. Also run the same test with a numeric 0.05 in field 5 and assert that state 2 is reached at onset + 50 ms ±1 frame.
- Confidence: confirmed (driver).

### F9. INTENSITY_FALL: code, blab comment and manual disagree; the effective rule is "RMS below threshold for the last ~5 frames AND at least minDur since the last +2-rule completion"
- Severity: medium (documentation/semantics; causes silent mis-specification)
- Location: ost.cpp:531-552 (blab edited the comment at 531 to "(+2) RMS intensity below a threshold for a certain duration")
- Blab-only? The misleading comment is blab-only; the code is upstream.
- What: (1) The code increments by +1 (manual Table 2 also says +1), but the blab comment says +2. Someone who writes the next rule at stat+2 gets F7-style doubling: the FALL fires again minDur after the first firing. (2) prm2 `minDur` is not a below-threshold hold. The below-threshold check only looks back `nLBDelay = round(0.010/frameDur)` frames (5 at 2 ms). minDur is measured from `lastStatEnd`, i.e. from the previous +2 rule's completion, which may be stale (F1). (3) Off by one: the look-back includes `rms_rec[data_counter]`, where `rms_rec` = `data_recorder[1]`. That entry is written at Audapter.cpp:1906, after `osTrack` at :1797, so it still holds 0 from `reset()`, or a stale value after the counter wraps. The current frame is therefore never examined, and the check lags by one frame.
- How to test headlessly: OST `0 INTENSITY_RISE_HOLD 0.02 0.02 / 2 INTENSITY_FALL 0.01 0.3 / 3 OST_END`. Input: loud from 0.1 s to 0.2 s, then silence. The documented semantics predict state 3 at about 0.2 s + small delay. The code gives state 3 at about 0.12 s + 0.3 s = 0.42 s. Pin whichever is intended.
- Confidence: confirmed by reading (plus F1 driver).

### F10. Truncated or short OST/PCF files dereference `end()` (UB / crash) instead of raising a syntax error; failed reloads leave half-built state
- Severity: medium (crash). A partial reload can also leave state that fails silently later.
- Location: ost.cpp:184 (empty after comment stripping), 195, 229, 291 (`*(++lit)` without an end check); pcf.cpp:344, 357, 418, 441; pcf.cpp:333-340 free `pitchShift`/`intShift` before parsing, but `n` is updated only at :421.
- Blab-only? no
- What: an OST with `n = 3` but only one rule line, or a comments-only file, walks past the end of the list. The driver `trunc` crashed with `std::bad_alloc` (ASan: stack-buffer-overflow). In the PCF, a syntax error in the warp section (e.g. a 3-number warp line) throws after `pitchShift`/`intShift` are freed and set to NULL. `n` keeps the old value and `fmtPertAmp` keeps the old array. mexErrMsgTxt reports the error, but if the script continues (try/catch or a retry), Audapter.cpp:1972 dereferences NULL `pitchShift` on the next frame. The driver `drvp partial` printed `n=5 pitchShift=(nil) intShift=(nil) fmtPertAmp=0x...`. An OST that throws mid-parse similarly leaves `n` set and `statOnsetIndices == NULL` (freed at :175, reallocated at :256 only if parsing reaches that line), so the next state transition writes through NULL. Also: `fmtPertAmp`/`fmtPertPhi` are never freed on reload, which leaks memory (pcf.cpp:333-340).
- How to test headlessly: feed each malformed file (truncated, comments-only, n > lines, 4-number warp line, out-of-order state line). Assert that a clean error is raised, and that a subsequent `runFrame` either works with the previous config or runs with OST/PCF disabled, without crashing.
- Confidence: confirmed (driver) for the OST truncation and the PCF partial state; the OST NULL path by reading.

### F11. The PCF time warp indexes `ostTab.statOnsetIndices[ostInitState]` with no NULL or range check
- Severity: medium (crash) / low
- Location: pcf.cpp:484; Audapter.cpp:2024
- Blab-only? no
- What: a PCF with warp atoms and no OST loaded leaves `statOnsetIndices == NULL` → crash on the first pvoc frame (bPitchShift=1). A 6-column atom with a negative or too-large `ostInitState` reads out of bounds before the `ostInitState < 0` guard in `pvocWarpAtom::procTimeWarp` runs. Format-1 atoms get `ostInitState = 0` (pcf.cpp:47). Their onset is therefore "trial start" (index 0), not "utterance onset" as the manual says, and F2 can corrupt it.
- How to test headlessly: `ost ''` plus `pcf time_warp_demo.pcf` with bPitchShift=1, then run 1 s of any signal. Expect no crash.
- Confidence: likely (by reading).

### F12. Hold-duration conventions differ by one frame between modes; RATIO modes use `floor` without rounding
- Severity: low
- Location: ost.cpp:382/386 (RISE_HOLD family: count starts at 1, `round`); 585/589, 615/619, 647/651 (RATIO_RISE, RATIO_FALL_HOLD, blab RMS_FLOOR: count starts at 0, `floor`)
- Blab-only? The blab RMS_FLOOR mode copies the RATIO convention; the blab AND/slope modes copy the RISE_HOLD convention.
- What: with minDur = 0.05 s and 2 ms frames, RISE_HOLD-style modes advance 25 frames after the condition becomes true (condition held for 26 frames). RATIO-style modes advance after 26 frames (held for 27). `floor(prm2/frameDur)` can also lose a frame to floating point, e.g. 0.03/0.002 = 14.999… → 14. The driver `hold` confirms 25 vs 26 frames.
- How to test headlessly: square-wave RMS / ratio onset at a known frame; assert state +2 onset = onset + round(minDur/frameDur) frames for every +2 mode.
- Confidence: confirmed (driver).

### F13. Blab `INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR`: hard-coded absolute RMS floor 0.0003; the mode does not set `lastStatEnd`
- Severity: low
- Location: ost.cpp:644, 653
- Blab-only? yes
- What: the 0.0003 floor is in the same arbitrary units as rms_s, so it depends on mic/preamp gain and on the `downFact` path. It is not configurable, although `prm3` is available and unused in this mode. Unlike the other blab +2 modes, it never sets `lastStatEnd`, so a following INTENSITY_FALL is exposed to F1.
- How to test headlessly: vary the input scale by 10x (same signal). Assert that state transitions are scale-invariant, or document that they are not.
- Confidence: confirmed by reading.

### F14. RMS ratio can be NaN or Inf in digital silence; all ratio modes then silently never trigger (or fall back)
- Severity: low (relevant for headless tests that use exact zeros)
- Location: Audapter.cpp:1727 (`rms_ratio = rms_s / rms_p`); ost.cpp uses `1. / rms_ratio` in the modes at 582-704
- What: with exact zero input, `rms_s = rms_p = 0` → NaN, every comparison is false, and hold states fall back. If `rms_s == 0` and `rms_p > 0`, the result is +Inf, so the "above ratio" checks come out true.
- How to test headlessly: add dither (e.g. 1e-6 white noise) in every harness signal. Add one test with exact zeros and assert no state change and no NaN in logged data.
- Confidence: confirmed by reading.

### F15. `calcRMSSlope` (input to all slope modes, including blab 12/13/21): integer mean index, and NaN when the window has ≤1 frame
- Severity: low
- Location: Audapter.cpp:3008 (`dtype mn_x = (rmsSlopeN - 1) / 2;` integer division), 3027; rmsSlopeN = `int(rmsSlopeWin/frameDur)` at :1794
- What: for even N the x-mean is off by 0.5, so `den` is too large and the slope magnitude is biased low. N=2 halves the slope, N=4 cuts it by about 17%, and at the defaults (N=15, 2 ms frames) there is no effect. If rmsSlopeWin < 2 frames, `den = 0` gives NaN slope and the slope-based OST modes never fire. The first N-1 frames of each trial have slope 0, so `INTENSITY_SLOPE_BELOW_THRESH` with a positive threshold passes the first check immediately.
- How to test headlessly: linear RMS ramp input (amplitude-ramped noise). Set rmsSlopeWin to give N=4, then N=5, and assert `rms_slope` matches the analytic slope within 1%.
- Confidence: confirmed by reading.

### F16. `nWin > 1`: `osTrack` runs nWin times per frame with the same data_counter/frame_counter, and frameDur = frameLen/sr
- Severity: low (nWin defaults to 1; the manual lists other values)
- Location: Audapter.cpp:1714 (window loop), 1797-1804, and the `data_counter++` at :2181, which runs once per frame despite the header comment at Audapter.h:214
- What: hold counters (stretchCnt) advance once per window, so hold durations shrink by a factor of nWin. Each window also overwrites the same `data_recorder` column. This probably belongs to the core-loop owner.
- How to test headlessly: run the F12 hold test with nWin=2 and assert the same hold duration in seconds.
- Confidence: likely.

### F17. (cross-ref, pitch/time owner) pvoc mode selection: third branch duplicates the first, so time warp is dropped when a PCF has both
- Severity: medium (silent: warp ignored)
- Location: Audapter.cpp:3195-3203. The `TIME_WARP_WITH_FIXED_PITCH_SHIFT` branch repeats the condition `warp>0 && !bIsPitchShift`, which is unreachable; it should be `bIsPitchShift`. A PCF with warp atoms and pitch shifts gets PITCH_SHIFT_ONLY, and the warp is never applied (Audapter.cpp:2029 is only checked in TIME_WARP_ONLY).
- Blab-only? no
- Confidence: confirmed by reading.

### Minor / notes
- ost.cpp:301: `printf("%d", maxInterval)` with a double is UB in verbose mode only.
- Mode strings are parsed with `atoi` first (ost.cpp:235), so `"5.5"` becomes 5. Numeric modes not in the enum (e.g. `7`) are accepted and the state then never advances; there is no diagnostic.
- `maxIOICfg` timeout uses `frame_counter` (ost.cpp:726), while ELAPSED_TIME uses `data_counter` (372). They are equal only while nWin=1 and no mid-trial counter wrap (Audapter.cpp:2307) has happened. After a wrap every onset index is in the "future", so ELAPSED_TIME and maxIOI stall.
- The manual says time-warp `rate1 ≤ 1` and `rate2 ≥ 1`; the code requires the strict forms (pcf.cpp:44, 62).
- The MATLAB writers (`gen_pert_pcf.m`, `gen_multi_pert_pcf.m`) never emit the blab modes. `gen_multi_pert_pcf.m` omits the maxIOI `n = 0` section (see F6), and its PCF has `nStates+1` rows, which matches the OST correctly.

## Ideas
1. Add a load-time validator in `OST_TAB::readFromFile`. It should check that stat0 values are strictly increasing, that each rule's stat0 equals the previous stat0 plus that mode's increment, that the last rule is OST_END, that maxIOI stat0/stat1 are within range, and that `n` matches the number of lines present (no `*(++lit)` past end). It should also reject unknown numeric modes and a non-numeric field 5 for modes 40/45. Size `statOnsetIndices` to max state + 1.
2. Cross-validate the OST and PCF when both are loaded: `pcf.n` must be at least max OST state + 1. Guard every `pertCfg.X[stat]` with `stat < n` and use 0 otherwise.
3. Call `ostTab.reset()` from `Audapter::reset()`, and have it clear `statOnsetIndices` and initialize `lastStatEnd`. Fix the `[stat]` → `[j]` bug in the maxIOI loop.
4. Parse transactionally: parse into temporaries and swap only on success, so a failed reload keeps the old config intact.
5. Keep PCF pitch shift in a separate runtime variable instead of overwriting `p.pitchShiftRatio[0]`.
6. Harness test matrix: one scripted RMS/ratio/slope trajectory per OST mode (15 modes), with asserted state-onset frames. Run it with ASan+UBSan, over 3 consecutive trials without reloading the OST, so that state leaks show up. The standalone driver in `scratch/ost-pcf/t/drv.cpp` already exercises `osTrack` directly and is cheap to extend.
7. Make the blab RMS floor (0.0003) a parameter (`prm3`), and document for every mode which prm fields are used and their units.
