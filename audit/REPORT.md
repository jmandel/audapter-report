# Audapter (blab-lab fork, b2.5) — audit report

Date: 2026-09-27 · Target: `blab-lab/audapter_mex` @169cadf, `blab-lab/audapter_matlab` @e1695f1
Baseline: `shanqing-cai/audapter_mex` 2.1.5 @f547196

## How this was done
1. **Inspection**: four parallel reviews (OST/PCF state machine, formant tracking & shifting,
   pitch/time shifting, MEX interface + MATLAB side). Detailed notes with line numbers are in
   `notes/*.md`; this report ranks and cross-checks them.
2. **Headless execution** (`harness/`, see its README): the real C++ core compiled as an Octave MEX
   in docker and driven through the real blab MATLAB wrapper (`AudapterIO.m` etc.) with synthetic
   vowels/noise via the offline `runFrame` path. That path runs the same `handleBuffer` as the ASIO
   callback. Three builds: blab, upstream 2.1.5, blab+ASan/UBSan.
3. **Differential testing**: blab and upstream fed identical parameters and inputs; outputs compared bit-for-bit.

Verification labels: **[H]** reproduced in the full harness · **[D]** reproduced in a standalone
driver of the relevant .cpp files · **[R]** by reading only.

## Headline results
- **The blab DSP core is bit-identical to upstream 2.1.5** on passthrough, 1D field formant shift,
  PCF formant shift, phase-vocoder pitch shift, PCF pitch shift and 100 ms DAF [H]. The one
  divergence is the intended "formant dropout fix" (below). Most risk is therefore in (a) long-standing
  upstream bugs and (b) blab's new features (2D field, clamping, fb mode 5, new OST rules, 480000 buffers).
- **Formant shifting does what it logs.** For ±20 % F1/F2 shifts (1D field, 2D field, PCF), logged
  `sfmts/fmts` equals the command exactly, and independent LPC on the output audio agrees within
  measurement error. That error was checked with a control: vowels synthesized directly at the target formant [H].
- **The serious problems are silent timing/state bugs**: OST state leaking across trials,
  maxIOI bookkeeping, masking-noise gaps, recorder wrap, and several out-of-bounds reads whose garbage
  values feed perturbation decisions.

## Findings, ranked
| # | Sev | Finding | Origin | Status |
|---|---|---|---|---|
| 1 | High | **OST state leaks across trials.** `OST_TAB::reset()` is never called. After a trial whose speech ended at 1.6 s, the next trial's offset (0.40 s) was detected at **1.68 s**, so a perturbation tied to that state stays on ~1.3 s too long (ost.cpp:97, Audapter.cpp reset) | upstream | [H] t_ost |
| 2 | High | **maxIOI timeout bug**: `statOnsetIndices[stat]` should be `[j]` (ost.cpp:728). The target state's onset is never set (`ELAPSED_TIME 0.1` fired after **2 ms**), and state 0's onset is corrupted. If the OST isn't reloaded, the 0.2 s timeout fires at 0.2 / **0.4 / 0.6 s** on successive trials. Also shifts 5-column time-warp atoms | upstream | [H] t_ost |
| 3 | High | **Masking-noise playback gaps (fb 2–5).** Playback loops at maxPBSize, not at the `datapb` length. Since blab's 230400→480000 bump, noise < 10 s is followed by silence (5 s noise → 5 s silence). The bundled babble gets a 16 ms dropout every 10 s. `pbCounter` is not reset per trial, so the gap lands at random points | blab-amplified | [H] |
| 4 | High | **PCF shorter than the OST's state count** → `fmtPertAmp[stat]` / `fmtPertPhi[stat]` read out of bounds (Audapter.cpp:1811/1841). Garbage decides whether and how much to perturb | upstream | [H] ASan |
| 5 | High | **Clamp setter copies 2048 values whatever the length passed** (Audapter.cpp:1154-1173). Shorter trajectories read past the MATLAB array, and the clamp runs until it hits a zero, so garbage formants go to the filter and log. Safe only if every caller pads to 2048 (the defaults do; taimComp code not audited) | blab | [H] ASan |
| 5b | High | **Phase vocoder changes loudness at perturbation onset.** With `bPitchShift=1`, 0 st plays at a constant **+3.5 dB** (Hann² overlap-add not normalized). With a shift, the level depends on F0, vowel and onset phase: the step at 0→+2 st is **0.8–8.8 dB** across F0 100–260 Hz for /a/ and /i/, and it fluctuates block to block after onset. So pitch-perturbation onset **coincides with a loudness change of variable size** (REPORT-2). The fix option `bPvocAmpNorm` can't be switched on: it is registered as `"bpvocmpnorm"` but checked as `"bpvocampnorm"`, and would divide by 0 anyway. Pitch accuracy itself is excellent (<2 cents) | upstream | [H] t_pitch |
| 6 | Med | **`runFrame` writes output into the caller's input array** (in == out buffer). Reusing frames (two conditions, `AudapterIO('process', f)`) silently feeds processed audio back in. Found because "identical trials" diverged in the harness | upstream | [H] t_inplace |
| 7 | Med | **Blab AND_RATIO OST rules (40/45) read the hold from field 5**, where the manual says `{}` goes (parsed as 0). With `{}` the 50 ms hold is ignored (fires at 26 ms vs 74 ms). Blab also removed the `{}` syntax check | blab | [H] t_ost |
| 8 | Med | **fb mode 5: `dScale` applied twice to the speech-modulated part**, once to playback. The speech/playback ratio silently depends on each rig's calibration | blab | [H] |
| 9 | Med | **"Dropout fix" semantics change**: perturbation re-arms each time formants re-enter the field; `minVowelLen` is now a no-op. Upstream perturbed 0.12–0.33 s, blab additionally 0.69–0.99 s on a /a–i–a/ glide | blab (intended?) | [H] t_diff |
| 10 | Med | **Recorder silently wraps after 30 s** (maxRecSize at 16 kHz). A 35 s trial returns only the last 5.0 s; OST timing, the trialLen mute and ramps restart mid-trial | upstream (limit moved) | [H] |
| 11 | Med | **Array params ignore the MATLAB length** (pertF1/F2, pertAmp/Phi, 2D fields). Short or wrong-shaped input reads OOB. Blab's mex change also accepts matrices silently | both | [H] ASan |
| 12 | Med | **2D field uses the lower-left cell, not interpolation** (comment says linear). The perturbation is piecewise-constant; the last row and column are never used. Row = F1, column = F2 (no transposition bug, but undocumented) | blab | [R] |
| 13 | Med | **Clamp branch bypasses voicing check**: logged `sfmts` show clamp targets in silence or unvoiced frames where no filtering happened; the trajectory index advances through silence | blab | [R] |
| 14 | Med | **Tone-sequence overflows**: the `tsgNTones` range check tests the old value (100 accepted), overwriting neighbouring params (stereoMode, bShift2D, clamp settings). `tsg_wf` is unbounded after 10 s | upstream | [H] partly |
| 15 | Med | **Tracker not rebuilt when ndelay/framelen/nwin change** → stale LPC window (works in `init` only by the accident that fn1/fn2 also change) | upstream | [R] |
| 16 | Med | **PCF pitch shift overwrites user param `pitchShiftRatio[0]`**, which persists after the PCF is cleared and is logged in `data.params` | upstream | [R] |
| 17 | Med | Reloading an OST without a maxIOI section, truncated OST/PCF files, and sparse state numbering cause a NULL deref, reads past the end of the line list, or heap writes | upstream | [D] ASan |
| 17b | Med | **RMS-clip loudness protection does nothing**: zeroes `outFrameBuf[0..frameLen)` instead of the current frame at `circPtr` (Audapter.cpp:1955). Output RMS was unchanged with the threshold exceeded. Also skipped when `bBypassFmt=1`. Default off | upstream | [H] |
| 17c | Med | **Time-domain pitch schedule clock counts only above-threshold time.** A 168 ms dip below threshold moved the shift onset from 1.04 to 1.20 s; unshifted audio is heard during dips | upstream | [H] |
| 17d | Med | **Logged `pitchShiftRatio` is wrong for time-domain shifting** (logs `p.pitchShiftRatio[0]`, e.g. 1.0 during a +100 cent shift) | upstream | [H] |
| 17e | Med | PCF with both pitch shift and time warp silently drops the warp (duplicated condition, Audapter.cpp:3194-3203); stereoMode 2 TTL channel is always 0 | upstream | [R] |
| 17f | Low | Time-domain shifter: stale audio in PP_PEAKS/VALLEYS on rising F0; a +21 dB burst possible after long silence; `y[0]` for `y[i]` (time_domain_shifter.cpp:164); ±13 cent quantization at high F0 | upstream | [D] |
| 17g | Low | Blab's new resampling filter is chosen by `p.sr`, not `downFact` (aliasing for e.g. sr=32000/downFact=3); pvoc param checks broken (`L & hop != 0`; hop<frameLen → modulo by zero crash) | blab / upstream | [R] |
| 18 | Low | Output delay ring: `> 0` should be `>= 0` (Audapter.cpp:2111), so the first frame of every trial reads past the voice buffer. The pitch-shift back-zeroing uses negative `%` (Audapter.cpp:2080) | upstream | [H] UBSan |
| 19 | Low | `DSPF_dp_blk_move` uses memcpy on overlapping ranges (UB; works on MSVC) | upstream | [H] ASan |
| 20 | Low | `rms_slope` is NaN for the first 14 frames of every trial (fed to slope-based OST rules) | upstream | [H] |
| 21 | Low | MATLAB side: `p.downfact` typo in getAudapterDefaultParams; the `closedLoopGain` argument is also assigned to `mouthMicDist` (copy-paste), which changes rmsThresh; default `rmsRatioThresh` changed 0.1→0.7 | upstream/blab | [R] |
| 22 | Low | Tracker `static last_f[]` survives trials. Code-level leak, but **no observable effect** in harness tests (abrupt /i/→/a/) | upstream | [H] negative |

Full details, plus about 20 more low-severity items: `notes/ost-pcf.md` (F1–F17), `notes/formant.md` (F1–F15),
`notes/interface.md` (I-01–I-18), `notes/harness-findings.md` (H1–H3), `notes/pitch-time.md`.

## Things checked and found OK
- blab ≡ upstream bit-for-bit outside the dropout fix (7 scenarios).
- Tracker agrees with an independent LPC estimator within 5 % on /a/ /i/ /u/ /æ/.
- Offline runs are deterministic, and with proper input copies show no cross-trial leakage in default settings.
- 2D field MATLAB→C packing is consistent (no row/column-major bug); grid lookup is correct for increasing grids.
- getData column layout matches between C++ and AudapterIO.
- Phase-vocoder pitch shift accuracy: within 2 cents for ±2 st.
- Blab is **not** missing the Kearney/GuentherLab time-domain pitch-shift fix; it came in via blab PR #6.
  GuentherLab's later commits (EQ filters, `rmsthrtime`) are features, not fixes.

## Recommendations
1. **Cheap fixes with outsized value**:
   - call `ostTab.reset()` from `Audapter::reset`
   - ost.cpp:727 `[stat]`→`[j]`
   - loop playback at the `datapb` length and reset `pbCounter` per trial
   - check PCF rows ≥ OST states at load time
   - copy the `runFrame` input
   - honour the MATLAB length in every array setter (error on mismatch)
   - decide and document dropout-fix semantics; restore `minVowelLen` or delete it
   - fix fb5 double `dScale`
2. **Validation at load time**: reject OST/PCF files with unknown or sparse states, truncated sections, or a non-`{}` field 5
   where `{}` is required. Error when trialLen > maxRec.
3. **Adopt the harness as CI**: `harness/run-tests.sh` already encodes the confirmed bugs as FAILs.
   Keep the upstream differential so future blab changes show exactly which behaviours move.
   A GitHub Actions job with the docker image would run it on every PR (Windows/MSVC build stays separate).
4. **Next test ideas**:
   - real recorded speech (example_data .mat) as regression fixtures
   - a loopback "virtual ASIO" audioIO stub that runs `start`/`stop` on a thread, for ThreadSanitizer on the online path
   - property/fuzz tests of the OST/PCF parsers
   - pitch-shift accuracy sweeps (pvoc and time-domain) with `est_f0`
