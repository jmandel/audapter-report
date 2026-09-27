# Area: pitch-time (time-domain pitch shifter, phase vocoder, time warp, global delay, SR filters)

Reviewer scope: `time_domain_shifter.cpp/.h`, `phase_vocoder.cpp/.h`, `pvocWarpAtom.*`, and their use in
`Audapter.cpp` (bPitchShift / pitchShiftRatio / bTimeDomainShift / timeDomainPitchShiftSchedule /
timeDomainPitchShiftAlgorithm / pvocFrameLen / pvocHop / pvocWarp / delayFrames / output ring buffer /
down/up-sampling filters). All line numbers are blab `origin/master` unless noted.

Scratch tests (all reproducible) live in `audit/scratch/pitch-time/`:
- `pv_test.cpp`, `pv_test2.cpp`, `pv_warp.cpp`: standalone PhaseVocoder + Audapter-style OLA (g++, stub mex.h)
- `tds_test.cpp`, `tds_test2.cpp`, `tds_peaks.cpp`: standalone TimeDomainShifter
- `*.m`: end-to-end runs through the real MEX via `audit/harness/run-oct.sh /a/audit/scratch/pitch-time/<x>.m`
  (`pvnorm.m`, `leak2.m`, `pvwrap.m`, `nopvwrap.m`, `rmsclip.m`, `tdsched.m`, `ampnorm.m`)
- `filt.py`: frequency response/stability of both SR filters

## Question from the brief: is blab missing the GuentherLab / Kearney time-domain-shifter fix?

**No.** The fix is present in blab.
- Kearney `fec3a6d` (2021-07-06) replaced the `b > 0` branch of `genShiftedPitchCycle()` (the old
  `y2prime..y3prime` ramp that *replaced* the sample value for the second pass, creating a DC ramp
  across the whole cycle) with a ramp that is non-zero only for `b == n1 && n0-n1+i > n1`.
  Upstream merged it as `f547196` (PR #8). GuentherLab `e28915c` is the same change plus the old code
  left as a comment.
- blab got it via `f54ede9 "Merge in pitch shifting changes (#6)"`. `diff` of blab vs GuentherLab
  `time_domain_shifter.cpp` differs only in the commented-out block (Guenther lines 329-337);
  `time_domain_shifter.h`, `phase_vocoder.*`, `pvocWarpAtom.cpp` are byte-identical across blab,
  upstream and GuentherLab.
- I checked the fixed math: for pitch-up (n1 < n0, ratio <= 1.5 so n0 < 2*n1) there is exactly one
  extra `b = n1` pass; it adds a linear ramp from ~0 at `i = 2*n1-n0+1` to `(y3 - y2)*(n0-n1-1)/(n0-n1)`
  at `i = n1-1`, so the truncated cycle ends near `x[End-1]` (continuity with the next repeated
  cycle). `n0-n1 >= 1` in that branch, so no division by zero. Correct as long as `maxPitchShiftRatio`
  stays < 2 (a ratio >= 2 would silently zero the `b = 2*n1` passes).
- Other GuentherLab-only commits after the fix are features, not correctness fixes: `d5f9d23 rmsthrtime`
  (hysteresis on the above-threshold gate for the time-domain shifter; relevant to PT-3 below),
  `62984c6/c419bbf/cdd6ddd/36f4b1b/429019b` (EQ filters merged into the up/down-sampling filters).

---

## Findings

### PT-1. Output ring-buffer wrap: off-by-one read pointer + negative-modulo "back zeroing" cause out-of-bounds access and audible dropouts
- Severity: medium (high for continuous / long-running sessions)
- Location: Audapter.cpp:2110-2116 (`optr`), 2124 (read), 2078-2081 (back zeroing); Audapter.h:186 (`internalBufLen`)
- Blab-only? no (upstream)
- What:
  1. `if (outFrameBuf_circPtr - delayFrames*frameLen > 0)` should be `>= 0`. When the difference is
     exactly 0, `optr = internalBufLen`, and line 2124 reads `outFrameBufPS[m0][internalBufLen + n0]`,
     i.e. one row past `m0` (row m0+1, or past the whole 2-D array for m0 = maxNVoices-1 = 3; that
     is intra-object OOB, invisible to ASan). The correct samples at `[0, frameLen)` are never played.
     Happens (a) at the first frame of every trial when delayFrames = 0, (b) at frame `d` of every
     trial when delayFrames = d (DAF), and (c) every time `outFrameBuf_circPtr` wraps, i.e. every
     `internalBufLen = 960*3*600 = 1,728,000` samples = **108 s at 16 kHz** of continuous processing
     without `reset`. This hits **every mode** (pitch shift or not) because all output flows through
     `outFrameBufPS`.
  2. With `bPitchShift = 1`, the back-zeroing index `(circPtr - d*frameLen - i0) % internalBufLen`
     is negative whenever `circPtr < d*frameLen + pvocHop` (C++ `%` keeps the sign), so it writes
     zeros to `outFrameBufPS[ifb][-k]`: for ifb = 0 that is the tail of `outFrameBuf` (the pre-pvoc
     ring buffer, which is exactly what the pvoc reads its wrapped analysis window from, lines
     2005-2009); for ifb >= 1 it is the tail of the previous voice's row. With DAF + pitch shift this
     happens in the first frames of every trial (benign then, the tails are still zero); at a wrap
     it zeroes live analysis input. The back zeroing is redundant anyway (front zeroing at 2073-2076
     already clears every region before accumulation).
- Evidence (harness, `pvwrap.m` / `nopvwrap.m`): 55,000 frames of a 3-tone signal through the real
  MEX; residual `signalOut - g*signalIn(n-L)` per 32-sample frame:
  - bPitchShift = 1 (ratio 1, L = 256): 4 bad frames (recording-relative 8993, 8999, 9000, 9001),
    residual 100-110 % of signal, exactly at the 108 s wrap (expected frame 9000).
  - bPitchShift = 0: 1 bad frame (9001), residual 93 % of signal (one-frame dropout).
- How to test headlessly: feed >= internalBufLen/frameLen + 1000 frames of a stationary multi-tone
  signal without reset; compute per-frame residual vs gain*input delayed by the known latency
  (0 for no pvoc, pvocFrameLen for pvoc); assert no frame exceeds 5 % residual. Also: delayFrames=10,
  assert output frame 10 equals input frame 0 (currently zeros). For the OOB itself, compile with a
  bounds-checked accessor or `-D_GLIBCXX_ASSERTIONS` after converting the arrays to std::array.
- Confidence: confirmed by harness

### PT-2. RMS-clipping loudness protection is non-functional (zeros the wrong buffer slice)
- Severity: high (participant-safety feature silently does nothing), though it is off by default on the MATLAB side (`getAudapterDefaultParams.m:110 p.bRMSClip = 0`; C++ default is 1)
- Location: Audapter.cpp:1955-1959
- Blab-only? no
- What: when `rms_s > rmsClipThresh && bRMSClip`, the code zeroes `outFrameBuf[0 .. frameLen)`
  instead of `outFrameBuf[outFrameBuf_circPtr .. +frameLen)` (the frame just written at 1946-1952).
  It only mutes something when circPtr happens to be 0. Also it is inside the `!bBypassFmt` branch,
  so pitch-shift/time-warp configurations with `bBypassFmt = 1` get no protection at all.
- Evidence (harness, `rmsclip.m`): 0.3-amplitude 200 Hz sine, bRMSClip = 1, rmsClipThresh = 0.01,
  smoothed rms_s ~= 0.211 > thresh; output RMS in second half = 0.2121 = input RMS (expected 0).
- How to test headlessly: as above; assert signalOut is ~0 for frames where data.rms(:,1) >
  rmsClipThresh (allowing nDelay-frame latency).
- Confidence: confirmed by harness

### PT-3. Time-domain shift schedule runs on "cumulative supra-threshold time", not trial time or time since threshold crossing; sub-threshold frames get unshifted pass-through
- Severity: medium (wrong perturbation onset timing, silent)
- Location: Audapter.cpp:1896-1902 (shifter only called when `above_rms`), time_domain_shifter.cpp:176 (`totalLen += len` only inside processFrame), 243 (`nowSec = totalLen / sr`)
- Blab-only? no (GuentherLab added `rmsthrtime` hysteresis in `d5f9d23`, which blab lacks; it mitigates short dips but does not change the time base)
- What: `processFrame()` is only invoked for above-threshold frames, and the schedule clock is the
  count of samples fed to it since `reset()`. So (a) any below-threshold dip during an utterance
  pauses the clock and delays every later anchor point by the dip length, (b) a second
  supra-threshold event in the same trial does **not** restart the schedule (continues from where the
  first left off), contrary to the demo text ("time relative to the crossing of the intensity
  threshold ... until the end of the supra-threshold event", `time_domain_shift_demo.m:74-89`) and to
  the param help ("time points (in seconds)"), and (c) during the dip the output reverts to the
  unshifted, non-pre-emphasised input (outBuf = inBuf), so the participant hears unshifted bursts.
- Evidence (harness, `tdsched.m`): male params, 120 Hz harmonic complex 3 s with a quiet gap at
  0.4-0.7 s (168 ms of frames below threshold), schedule `[0 1; 1 1; 1.01 1.0595]`. Output F0 stays
  120.3 Hz until ~1.15 s and reaches 125-127 Hz at 1.2 s: onset at trial time 1.200 s = exactly when
  cumulative above-threshold time reaches 1.0 s (first crossing was at 0.036 s, second at ~0.7 s).
- How to test headlessly: as above; assert the output-F0 step happens at the documented time
  (whichever definition is chosen), independent of inserted sub-threshold gaps.
- Confidence: confirmed by harness

### PT-4. Logged `pitchShiftRatio` column does not reflect the time-domain shift (and PCF pitch values are logged while TDS ignores them)
- Severity: medium (data logged != what participant heard)
- Location: Audapter.cpp:1970-1975 (PCF overrides `p.pitchShiftRatio[0]`), 2095-2096 (logged), 1896-1902 (TDS uses only the schedule)
- Blab-only? no
- What: with `bTimeDomainShift = 1` the pitch-shift column is `p.pitchShiftRatio[0]` (1.0 unless set),
  never the schedule's current ratio. If a PCF with `pitchShift` values is loaded, those values are
  written into the column (and into `p.pitchShiftRatio[0]`) while the time-domain shifter completely
  ignores OST/PCF. Setting `pitchShiftRatio` only triggers a rebuild of the shifter (line 1035) but
  has no effect on it. The only TDS trace is `shiftedPitchHz` (intended `sr/n0*ratio`, not realised,
  written only on above-threshold frames).
- Evidence: `tdsched.m` - `unique(d.pitchShiftRatio) = 1` during a 100-cent shift.
- How to test headlessly: TDS with schedule 1.0595 and a PCF whose stat-1 pitchShift = -1 st; assert
  the logged ratio equals the schedule ratio (currently 2^(-1/12) is logged while +1 st is applied).
- Confidence: confirmed (column value by harness; PCF path by reading)

### PT-5. Phase vocoder is not level-preserving: +3.5 dB at zero shift, level drops 0.5-2 dB (up to -12 dB for pure tones) when a shift is applied; time-warp mode is -2.5 dB; the amplitude-normalisation option is unreachable and would emit NaN/Inf
- Severity: medium (perturbation onset coincides with a loudness step; cross-condition level mismatch)
- Location: phase_vocoder.cpp:219 (`X_magn = 2|X|`), 298-314 (dest->source bin mapping), 326 (sumPhase starts at 0 for all bins), 401-402 (`0.5*magn` in warp), 467 (`2*x*hWin/(osamp/2)`); Audapter.cpp:138 vs 877, 1978, 2129-2178
- Blab-only? no
- What:
  - Hann analysis x Hann synthesis with hop = L/4 sums to 1.5, and the synthesis scaling does not
    divide it out -> output = 1.5 x input at 0 semitones (bPitchShift=1 path always runs the pvoc,
    even at ratio 1). Versus bPitchShift = 0 the level is +3.52 dB.
  - With a nonzero shift the per-bin magnitude mapping plus fully phase-coherent resynthesis
    (sumPhase initialised to 0 for every bin, so the vertical phase relationships of the input are
    lost) changes level in a frequency-dependent way.
  - TIME_WARP_ONLY uses `0.5*magn` -> gain 0.75 (-2.5 dB) and synthesises with the phase from the
    previous hop (`lastPhase` is used at 401-402 before being updated at 433), i.e. total lag
    L + hop instead of L.
  - The intended fix, `bPvocAmpNorm`, is dead: registered as `"bpvocmpnorm"` (typo, line 138) while
    the setter matches `"bpvocampnorm"` (877), and both names are rejected (harness `ampnorm.m`:
    "Unknown parameter name" for both). If it were reachable: `ms_in` is a local that is always 0
    (1978) so `ms_out/ms_in` = Inf -> `t_amp_ratio = prev + (Inf-prev)/n*0` = NaN at n0 = 0 and Inf
    afterwards -> NaN/zero output; the division is inside a `for m0 < nFB` loop so it divides nFB
    times; `amp_ratio_prev` is not reset in `reset()` (only `amp_ratio`, line 666), so Inf would leak
    across trials.
- Evidence: standalone (`pv_test`, 1 kHz / 200 Hz tones, L=1024, hop=256): gain 1.500 at 0 st;
  +1 st 1.46/1.47; -1 st 1.22/1.30; -2 st at 1 kHz 0.243 (-12.3 dB); +/-12 st ~0.3. Harmonic complex
  (`pv_test2`, 110/220 Hz): 0 st +3.52 dB, +/-0.5..3 st between +1.45 and +3.09 dB. End-to-end
  (`pvnorm.m`, female defaults L=256 hop=64, 200 Hz complex): outRMS/inRMS 1.500 at ratio 1, 1.204 at
  +1 st, 1.000 with bPitchShift=0. Warp (`pv_warp`): gain 0.750, best lag 320 = L + hop.
- How to test headlessly: run a harmonic complex with bPitchShift=1 at ratio 1 and at +/-1 st;
  assert output/input RMS within +/-0.5 dB of 1 and within +/-0.5 dB of each other.
- Confidence: confirmed by harness

### PT-6. PCF with both pitch shift and time warp silently drops the time warp
- Severity: medium (silent: requested perturbation not delivered)
- Location: Audapter.cpp:3194-3203 (`readPertCfg`)
- Blab-only? no
- What: branch 3 `else if (warpCfg.size() > 0 && !bIsPitchShift)` duplicates branch 1 (should be
  `&& bIsPitchShift`), so "warp + pitch shift" falls through to `PITCH_SHIFT_ONLY`; in handleBuffer
  `procTimeWarp()` is still evaluated but only used when mode == TIME_WARP_ONLY (2030). (If the
  condition were fixed it would hit `TIME_WARP_WITH_FIXED_PITCH_SHIFT`, which is marked "TODO: Finish
  and test it" and throws unless `setFixedPitchShiftST` is called, which nothing does; so the real
  fix is to reject this combination loudly.)
- How to test headlessly: load an OST + PCF with a nonzero pitchShift in some state and one warp
  line; assert either an error or that the output shows the warp (e.g. an impulse train's click
  times are delayed during the warp interval).
- Confidence: confirmed by reading

### PT-7. stereoMode 2 "simulated TTL" for pitch shift is always 0
- Severity: medium if anyone uses the right channel as a perturbation-onset marker; otherwise low
- Location: Audapter.cpp:2275 (`0.99 * duringPitchShift`); `duringPitchShift` is only ever assigned false/its previous value (663, 1992, 1995, 2088)
- Blab-only? no
- What: nothing sets `duringPitchShift = true`, so the TTL channel is flat.
- How to test headlessly: online-only path (bSingleOutputBuffer=false); in a harness, call
  `handleBuffer(..., false)` directly with stereoMode=2, bPitchShift=1, ratio != 1, and assert the
  odd samples become 0.99 during the shift.
- Confidence: confirmed by reading

### PT-8. Time-domain shifter PP_PEAKS / PP_VALLEYS reads "future" (actually ~42 ms stale) samples when F0 rises
- Severity: medium-low (optional algorithm; artifacts during rising intonation)
- Location: time_domain_shifter.cpp:112-130 (peak-adjusted end = `lastPitchCycleBegin + round(pitchCyclePeakIndexState)`), 134 (`pitchCyclePeakSmoothingAlpha = 0.01` in .h), 219-222 (`accessRotBuf` wraps silently)
- Blab-only? no
- What: the peak/valley offset is smoothed very slowly (alpha 0.01 per cycle). When the period
  shortens, the smoothed offset exceeds the current cycle length and the adjusted cycle end points
  past the newest written sample; `accessRotBuf` wraps modulo `bufLen` (sr/25 rounded up = 672 at
  16 kHz) and returns 42-ms-old audio as part of the pitch cycle that is repeated into the output.
- Evidence (`tds_peaks.cpp`, instrumented): F0 glide 100->300 Hz then hold: PP_PEAKS 214/500 frames
  with the cycle end beyond the newest sample (max 69 samples), PP_VALLEYS 195/500; 150 +/- 30 Hz
  vibrato: 17/500 and 9/500; constant or falling F0: 0.
- How to test headlessly: same signal through Audapter with timeDomainPitchShiftAlgorithm = 1 and
  ratio 1; assert the output waveform correlates with the delayed input at > 0.9 per 20 ms block
  during the glide (or instrument as above).
- Confidence: confirmed (standalone)

### PT-9. Time-domain shifter: long zero-crossing-free input or strong pitch-down overruns the scratch buffer (summed copies -> up to +21 dB burst); no lower bound on ratio
- Severity: low (hard to reach in the real pipeline because only above-threshold frames are fed and f is a resonator output around the tracked F0; reachable with low ratios or low pitch bounds)
- Location: time_domain_shifter.cpp:24-29 (bufLen = ~40 ms, scratchLen = 2*bufLen), 296-302, 310-331, 395-411 (only `> 0` and `<= 1.5` checked)
- Blab-only? no
- What: a "cycle" longer than bufLen reads aliased rotBuf data; if `n1 = n0/ratio > scratchLen - frameLen`
  (1248 samples at 16 kHz) the zeroing and `+=` loops wrap the scratch buffer, overwriting unread
  output and summing ~n1/scratchLen copies of the same sample (scratchLen is a multiple of bufLen).
  e.g. ratio 0.5 with a 26 Hz cycle, or ratio 0.2 with a 64 Hz cycle. Memory-safe (all indices mod),
  but loud. Also `n1 == 0` would make `while (b < n0) b += n1` spin forever (not reachable today:
  n0 >= 1 and ratio <= 1.5).
- Evidence (`tds_test`, standalone, f = x = 0 then 150 Hz): 100 ms digital silence -> peak 1.92x input;
  500 ms -> 6.7x; 1000 ms -> 11.5x (+21 dB) at the onset; ratio 0.7 after 500 ms -> 7.7x.
- How to test headlessly: feed processFrame directly (or Audapter with pitchLowerBoundHz = 20 and a
  20 Hz pulse train, ratio 0.7); assert max |y| <= 1.5 * max |x|.
- Confidence: confirmed (standalone); reachability in the full pipeline speculative

### PT-10. Time-domain shifter minor output defects: pre-first-crossing frame, stale audio on resume, integer-period quantisation, pitch-down plateau
- Severity: low
- Location: time_domain_shifter.cpp:163-165, 296-297, 312-316; Audapter.cpp:1896-1902
- Blab-only? no
- What:
  - `for (i < len) y[0] = 0.0;` (should be `y[i]`): until the first zero crossing, outBuf keeps the
    unshifted input with only sample 0 zeroed (the commented-out line suggests silence or copy was
    intended).
  - On each return above threshold, up to one old cycle still sitting in the scratch buffer is played
    first (standalone `tds_test2`: 3 frames = 6 ms of spliced old/new audio), and the f0 resonator
    state is stale because it is only run on above-threshold frames.
  - Output period = round(n0/ratio) with integer n0 -> shift error vs nominal +/-100 cents: <= 5 cents
    at 97-223 Hz, +6 at 317 Hz, -9.5 / +12.7 cents at 410 Hz (`tds_test`). `shiftedPitchHz` logs the
    nominal `sr/n0*ratio`, not the realised `sr/n1`.
  - For ratio < 1 the cycle is lengthened by holding `x[End-1]` constant (flat plateau); with
    PP_PEAKS/VALLEYS it holds the peak value -> +1.5 to +2.4 dB level at ratio 0.7. PP_NONE pitch-up
    loses ~1 dB (level steps with perturbation onset, smaller than PT-5).
  - TDS latency is ~1 pitch cycle (6.2 ms at 151 Hz, `tds_test2`) on top of nDelay; unlogged.
- How to test headlessly: `tds_test.cpp`-style sweeps; assert |error| < 5 cents and level within
  +/-0.5 dB for ratios 0.94-1.06 over F0 80-400 Hz.
- Confidence: confirmed (standalone)

### PT-11. Phase-vocoder parameter validation is broken or missing (div-by-zero, buffer overflow)
- Severity: low (only with non-default pvocFrameLen / pvocHop)
- Location: phase_vocoder.cpp:109, 147; Audapter.cpp:1966 (`xBuf[max_nFFT = 4096]`), 1986-1987, 2121/2124 (`outFrameBufSum[maxFrameLen*3 = 2880]`), 814-827
- Blab-only? no
- What: `if ( t_pvocFrameLen & t_pvocHop != 0 )` parses as `L & (hop != 0)` = `L & 1` = 0 for any
  power of two, so the divisibility check never fires. Nothing checks `pvocHop >= frameLen`,
  `pvocHop % frameLen == 0`, or an upper bound on pvocFrameLen: `pvocHop < frameLen` -> integer
  `% 0` at 1986 (SIGFPE, kills MATLAB); hop not a multiple of frameLen -> pvoc frames every
  floor(hop/frameLen) frames while OLA/scaling assume `hop` (wrong gain, comb artifacts);
  `pvocFrameLen > 2880` -> writes past `outFrameBufSum` into `outFrameBufSum2`/`srfilt_buf`
  (2121, even with bPitchShift = 0); `pvocFrameLen > 4096` -> stack overflow of `xBuf`. A throw inside
  `config()` after `cleanup()` also leaves `pVocs` empty/short and handleBuffer then dereferences
  `pVocs[ifb]`.
- How to test headlessly: set pvocHop = 16 with frameLen = 32 (expect a clean error, currently a
  crash); set pvocFrameLen = 4096 and check the canary values after outFrameBufSum.
- Confidence: confirmed by reading

### PT-12. (blab-only) Sample-rate-conversion filter chosen by `p.sr` instead of by `downFact`
- Severity: low
- Location: Audapter.cpp:748-756 (only `srate` sets bRemakeFilter), 1456-1492
- Blab-only? **yes**
- What: filter A (sr < 24000) is a 20th-order elliptic lowpass with -3 dB at 0.157*fs_in (designed
  for /3); filter B (sr >= 24000) has -3 dB at 0.239*fs_in (for /2). Both are stable (max |pole| 0.976
  / 0.972), unity DC gain, >= 57 dB stopband (`filt.py`). The choice keys on the *post-decimation*
  rate, so it is right only for the (48 kHz, /3) and (48 kHz, /2) combos. Wrong cases: sr = 32000 with
  downFact 3 (96 kHz device) uses B -> passband to 23 kHz, aliasing 16-23 kHz into the band;
  sr = 16000 with downFact 2 (32 kHz device) uses A -> unnecessary 5 kHz lowpass; downFact = 1 still
  applies a lowpass. Changing `downfact` alone never re-selects the filter.
- How to test headlessly: set downFact=3, sr=32000; feed a 20 kHz sine at 96 kHz; assert
  signalIn energy < -40 dB.
- Confidence: confirmed by reading + filter analysis

### PT-13. Time-domain shift silently discards formant perturbation and changes LPC input
- Severity: low
- Location: Audapter.cpp:1699-1704 (no pre-emphasis when bTimeDomainShift), 1896-1902 (overwrites outBuf, not `outBuf + si`), 1626-1636 (checkParameters)
- Blab-only? no
- What: with bTimeDomainShift the LPC/formant tracker runs on non-pre-emphasised audio (formant logs
  differ from normal runs), any formant shift written to outBuf is overwritten by the TDS output,
  and nWin > 1 makes `checkFrameLen` throw every frame (len = frameShift != frameLen). None of these
  combinations is rejected up front (only bPitchShift and bCepsLift are checked).
- How to test headlessly: bTimeDomainShift=1 + bShift=1 with a strong F1 perturbation field; assert
  an error or that the formant shift is audible in signalOut.
- Confidence: confirmed by reading

### PT-14. Latency accounting (informational)
- Severity: idea
- What: measured end-to-end: pvoc adds exactly `pvocFrameLen` samples (256 = 16 ms with blab's
  default 'female' params, `leak2.m`; 1024 = 64 ms with the C++ defaults), time-warp mode adds another
  hop of phase lag (L + hop), TDS adds ~1 pitch period, and the pvoc analysis window excludes the
  current frame (`xBuf` = `outFrameBuf[circPtr-L, circPtr)`). The OST/PCF shift for a pvoc frame is
  chosen from `stat` at the window's end, so shifted content fades in from speech up to L samples
  before the trigger. None of this is recorded in the data; analyses that align `pitchShiftRatio` /
  `ost_stat` with signalOut will be off by L.

---

## Harness caveat (outside this area, but it will bite every offline test)
`mexLibrary.cpp:361-364` + `Audapter.cpp:77`: offline `runFrame` passes the MATLAB input array as
**both** input and output buffer to `handleBuffer`, so the output is written in place into
`prhs[1]`. In Octave, contiguous slices like `x(a:b)` share storage, so `Audapter('runFrame',
x(a:b))` overwrites `x` with the output: the next "trial" then processes the previous trial's
output. I first mistook this for state leakage across trials. In MATLAB, passing a variable or cell
element directly (`Audapter('runFrame', sigInCell{n})`) silently corrupts it too (a MEX-contract
violation). Workaround in tests: `fr = x(a:b) + 0;`. Suggest the mexLibrary reviewer file this.

## Ideas
- Regression tests (all headless, derived from the scratch programs): (1) pvoc level at 0 and +/-1 st
  within +/-0.5 dB; (2) TDS realised shift within 5 cents over F0 80-400 Hz; (3) schedule onset time
  independent of inserted sub-threshold gaps; (4) no dropout across the internalBufLen wrap and at
  frame `delayFrames`; (5) RMS clip mutes; (6) PP_PEAKS never reads beyond `totalLen-1`.
- Fix sketch: `>= 0` in the optr test; delete the back-zeroing loop (front zeroing covers it) or use
  a proper positive modulo; zero `outFrameBuf + outFrameBuf_circPtr` in RMS clip and move it outside
  `!bBypassFmt`; divide pvoc synthesis by the actual window-overlap sum (1.5 for Hann^2 at hop L/4);
  initialise `sumPhase` from the analysis phase on the first frame / on shift onset; clamp the
  peak-adjusted cycle end to `totalLen-1`; bound n0 <= bufLen - frameLen and n1 <= scratchLen - 2*frameLen;
  validate pvocHop/pvocFrameLen (`L % hop == 0`, `hop % frameLen == 0`, `L <= 2880`); remove or
  fix `bPvocAmpNorm`; log the actually applied TDS ratio and pvoc shift per frame; select the SR
  filter from downFact.
- `pvocWarpAtom.cpp/.h` and `TransShift.h` are not compiled (not in TransShiftMex.vcxproj) and
  duplicate the live `pvocWarpAtom` in pcf.h/pcf.cpp; delete them to avoid confusion.
- `getPitchShiftRatio()` has no return on the (currently unreachable) fall-through path; add
  `return pitchShiftSchedule.back().second;` to silence UB warnings.
- `zcIndices` grows without bound during a trial (heap allocation in the audio callback); keep only
  the last two indices.
