# Interface / IO / data-path audit (area: "interface")

Scope: mexLibrary.cpp, Audapter::setGetParam/queryParam/getParam, Parameter table, reset(),
getSignal/getData and the recorders, datapb playback, tone-sequence generator, fb modes 0-5
(including blab mode 5), stereoMode, audapterCallback and threading, audioIO.cpp, and the blab
MATLAB side (AudapterIO.m, getAudapterDefaultParams.m, getAudapterParamSet.m, genRandScript.m,
play_audio.m, check_file.m).

Line numbers refer to the blab tree (blab/...). "Blab-only" was checked against
`upstream/`.

Confirmation scripts: audit/scratch/interface/t_iface.m and t_wrap.m, run through
`harness/run-oct.sh /a/audit/scratch/interface/<file>.m`. Tests marked **[harness-confirmed]**
were run on the Octave build of the blab MEX.

Output from the harness run:
```
T1 maxPBLen=480000  mean|out| 0-4.9s=0.1000  5.1-9.9s=0.0000  10.1-12s=0.1000
T2 rms_slope NaN rows: 14 (first 16 rows: [1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0])
T3 dScale=1  speech-mod component per unit playback=0.07046
T3 dScale=2  speech-mod component per unit playback=0.14093
T4 input modified by runFrame: 1 ; alias modified: 1
T5 setParam('tsgntones',100) accepted; the next getParam('tsgntones') errors "too big"
T6 after 31 s of input: signalIn len=16000 (1.000 s)
```

Overlap with other areas: formant.md already covers F1/F2 (clamp/pert array lengths), F5
(clampIx static) and F14 (gain statics). ost-pcf.md covers F1 (OST reset never called) and F15
(rms slope). These are only cross-referenced below, apart from one correction to ost-pcf F15 (see I-05).

---

### I-01. Playback buffer wraps at maxPBSize, not at the datapb length. After the 230400→480000 bump, fb 2/3/4/5 noise has silent gaps
- Severity: high (silent; affects every masking-noise and fb5 condition)
- Location: Audapter.cpp:2189-2205 (fb 2-5 loop: `pbCounter += p.downFact; if (pbCounter >= maxPBSize) pbCounter -= maxPBSize;`); Audapter.cpp:1216-1219 (setting datapb zero-fills [len, maxPBSize)); Audapter.h:176 (`maxPBSize = 480000`); reset() (Audapter.cpp:522-680) never resets pbCounter. Only setting datapb resets it (Audapter.cpp:1324-1325).
- Blab-only? Yes, in effect. Wrap-at-max is upstream behaviour, but blab commit 3c90a3a (maxPBSize 230400→480000) turned seamless loops into gapped ones.
- What: the playback pointer always runs to 480000 device-rate samples (10 s at 48 kHz) and then wraps, whatever length was loaded. Any datapb shorter than 10 s is followed by `480000 − len` samples of digital silence in every 10 s cycle.
  - Before the bump, callers (runExperiment.m:325-330, test_audapter.m:70-74, audapterDemo_online.m:60-71) truncated noise to `getMaxPBLen` = 230400. Any file ≥ 4.8 s therefore looped with no gap.
  - Now the bundled mtbabble48k.wav (479230 samples) leaves a 770-sample (16 ms) dropout every 10 s.
  - Any user noise between 4.8 s and 10 s gives a dropout of up to 5.2 s. For example, a 5 s noise file now produces 5 s of noise followed by 5 s of silence.
  - pbCounter carries over between trials, so the gap lands at an arbitrary point inside a trial. In fb 2 the participant then hears nothing, in fb 3/4/5 the masking or modulated component disappears, and in fb 5 the "constant playback" component is gone.
  - signalOut does record the gap, but nobody looks for it.
- Evidence: T1 **[harness-confirmed]**. fb=2 with datapb = 0.1·ones(240000,1) gives mean |signalOut| of 0.100 for 0-4.9 s, 0.000 for 5.1-9.9 s, and 0.100 again after 10 s.
- How to test headlessly: see t_iface.m T1. Assert that `signalOut` is non-zero for every 10 ms block when datapb has no zeros.
- Fix idea: store `pbLen = len` when datapb is set and wrap at pbLen. Reset pbCounter in reset(), or make that optional.
- Confidence: confirmed (harness).

### I-02. fb mode 5: `dScale` is applied twice to the speech-modulated component and once to the playback component
- Severity: medium-high (silent mis-calibration of the new blab mode)
- Location: Audapter.cpp:2197-2201 (`speech_modulated_component = data_pb * rms_fb * fb5Gain_speech * p.dScale`), then upSampSig (Audapter.cpp:2221-2223, 2660) multiplies everything by dScale again.
- Blab-only? Yes, fb5 is new. It copies fb4's `* p.dScale` (upstream fb4 has the same double application, but fb4 has only one component, so it is just a level offset there).
- What: heard output = dScale·g_p·n + dScale²·g_s·rms_fb·n. The effective speech-modulated/playback ratio is therefore `fb5GainDB_speech + 20·log10(dScale)` dB, not `fb5GainDB_speech`. blab's getAudapterDefaultParams sets `dScale = 10^((closedLoopGain − calcClosedLoopGain)/20)`, which is site/calibration dependent and not 1. The ratio thus silently differs between rigs and between calibrations. The logged `data.params.fb5GainDB_speech` is the nominal value, not the effective one.
- Evidence: T3 **[harness-confirmed]**. The recorded speech component per unit of playback doubles from 0.0705 to 0.1409 when dScale goes from 1 to 2 (recorded signalOut is pre-upsampling, so the heard ratio carries one more dScale factor on both terms). Nothing else changed.
- How to test headlessly: see t_iface.m T3. Assert that the recorded ratio is independent of `scale`.
- Also note: at the defaults (0 dB, rms_fb ≈ 0.01-0.1) the speech-modulated component sits 20-40 dB below the playback component. That is worth documenting for users.
- Confidence: confirmed (harness).

### I-03. Recorder silently wraps after maxRecSize/sr (30 s at 16 kHz). Trial timing, OST and ramps restart mid-trial
- Severity: medium (silent data loss; the limit moved from 14.4 s to 30 s with the bump)
- Location: Audapter.cpp:2307-2310 (`if (frame_counter*p.frameLen >= maxRecSize || ...) { frame_counter = 0; data_counter = 0; ...}`); getSignal/getData (1602-1611) return only `frame_counter*frameLen` / `data_counter` rows.
- Blab-only? No (upstream). The bump changed the threshold.
- What: once a trial passes maxRecSize internal samples, the counters reset to 0 with no warning.
  - getData then returns only the part recorded since the last wrap. The start of the trial is lost, and so is everything else before the wrap.
  - `intervals` restarts at 1.
  - OST sees data_counter jump back to 0 while statOnsetIndices/lastStatEnd hold large values, so time-based rules stall.
  - The trialLen mute (2285-2291) is lifted again after a wrap.
  - The onset ramp (2292-2296) is re-applied mid-utterance.
  - checkParameters() runs again (1663).
- Evidence: T6 **[harness-confirmed]**. After 31 s of input, signalIn has 16000 samples (1.0 s).
- How to test headlessly: see t_wrap.m. Assert either an explicit error/flag or a saturating (non-wrapping) recorder.
- Fix idea: saturate (stop recording and keep counting) and expose an "overflowed" flag through getData.
- Confidence: confirmed (harness).

### I-04. `runFrame` (action 5) writes the output into the caller's MATLAB input array in place
- Severity: medium (silent corruption of offline-reprocessing inputs, and of any variable sharing data with them)
- Location: mexLibrary.cpp:361-364 (`data_ptr = mxGetPr(prhs[1]); audapterCallback((char*)data_ptr, ...)`), then Audapter.cpp:74-77 (inFrame_ptr == outFrame_ptr), then 2256-2259 (writes outFrame_ptr).
- Blab-only? No.
- What: prhs are read-only by the MEX contract. The processed output overwrites the frame the user passed in, and (because of copy-on-write sharing) any MATLAB variable aliasing it. Code such as `sigInCell{n}` (reprocData.m, test_audapter.m, UIRecorder.m:1085, testTSM.m) ends up holding outputs. Reusing sigInCell for a second configuration (a common pattern in parameter sweeps) then processes the processed signal.
- Evidence: T4 **[harness-confirmed]** (Octave): both the input and an alias of it were modified.
- How to test headlessly: see t_iface.m T4.
- Fix: copy prhs[1] into a scratch buffer before calling the callback.
- Confidence: confirmed (Octave). MATLAB is expected to behave the same (mxGetPr returns shared data).

### I-05. `rms_slope` is NaN for the first rmsSlopeN−1 frames of every trial (correction to ost-pcf F15)
- Severity: low-medium (NaNs in logged data; NaN fed to OST slope rules)
- Location: Audapter.cpp:3011-3013 sets 0, but 3027 then unconditionally overwrites it with `nom/den/...` = 0/0.
- Blab-only? No.
- What: ost-pcf.md F15 says the first N−1 frames have slope 0. They actually have NaN, because line 3027 runs after the early branch. At the defaults (N=15, 2 ms frames), the first 28 ms of `data.rms_slope` are NaN. In OST, NaN comparisons are false, and `stretchSpanAccum += NaN` would poison NEG_INTENSITY_SLOPE_STRETCH_SPAN if a stretch started in that window.
- Evidence: T2 **[harness-confirmed]**: 14 NaN rows, all at the start.
- Fix: `return` after the early assignment.
- Confidence: confirmed.

### I-06. `tsgNTones` range check tests the old value, so an oversized count is accepted, overflows the `p` struct, and bricks later get/set
- Severity: medium (memory corruption from one bad parameter; also breaks getAudapterParamSet for the rest of the session)
- Location: Audapter.cpp:855-867 (the check reads `*((int*)ptr)` before the assignment at 1197). The check also runs in get mode.
- Blab-only? No.
- What: `setParam('tsgntones', 100)` succeeds. The next `tsgToneDur/Freq/Amp/Ramp/tsgInt` set then writes 100 doubles into 64-element arrays inside `p`. The tsgInt overflow runs past the end into bBypassFmt, bShift2D, stereoMode, bPvocAmpNorm, pvocAmpNormTrans, bClampFormants, clamp_osts and clamp_f1[...], silently changing those parameters. handleBufferToneSeq (3094) reads tsgToneOnsets[99] (sized 64). After that, every get/set of tsgntones errors, including `getAudapterParamSet` inside `AudapterIO('getData')`.
- Evidence: T5 **[harness-confirmed]**. Set to 100 was accepted, and the following getParam errored "too big".
- How to test headlessly: set tsgntones=70, then tsgint = 70 ones, then getParam('stereomode') and 'bshift2d'. Assert the values are unchanged (currently they will be garbage).
- Confidence: confirmed (harness for the check order; overflow by reading).

### I-07. Tone-sequence recorder `tsg_wf` has no bound: over 10 s of playToneSeq writes past the array, starting with `tsgRecCounter` itself
- Severity: medium (crash or heap corruption; the bump moved the limit from 4.8 s to 10 s)
- Location: Audapter.cpp:3114 (`tsg_wf[tsgRecCounter++] = ...`). Audapter.h:640-641 declares tsg_wf[maxToneSeqRecLen] immediately followed by tsgRecCounter. The generator never stops on its own. dt is hard-coded to 1/48000 (3090), whatever srate·downFact is.
- Blab-only? No.
- What: once 480000 device samples have been generated, the write lands on tsgRecCounter. It overwrites it with double bits, and later writes go to arbitrary offsets. If tsgNTones == 0, `m` becomes −1 and indexes tsgToneOnsets[-1] (3094-3098). Also, wgTime is not reset by reset() or by action 13. The next sequence starts where the last one ended unless MATLAB sets wgTime = 0.
- How to test headlessly: set actionMode GEN_TONE_SEQ (or call handleBufferToneSeq directly) for 480000/96 + 10 buffers under ASan. Expect heap-buffer-overflow.
- Confidence: confirmed by reading.

### I-08. Array parameters ignore the MATLAB-supplied length (OOB reads); the blab mex change accepts matrices silently
- Severity: medium (garbage perturbation fields; see formant.md F1/F2 for the formant-side consequences)
- Location:
  - Audapter.cpp:930-953: pertf1/pertf2/pertamp/pertphi use `len = pfNPoints`, and the 2-D params use `len` so that `len*len` doubles are read.
  - Audapter.cpp:1154-1177: clampf1/f2 use len = 2048 and clamposts uses 2.
  - Copy loops are at 1212-1232.
  - mexLibrary.cpp:269-271 (blab): for an M×N non-vector, `nPars = inParSize[0]` instead of erroring.
- Blab-only? Partly. pertf1, the 2-D params, clamp* and the mex relaxation are blab. pertf2/amp/phi are upstream.
- What: none of these compare nPars against len. A shorter vector or smaller matrix reads past the mxArray. A 257×1 passed as pertAmp2D reads 66049 doubles, and an empty [] may hand NULL to the copy loop. The mex relaxation also means that *any* array param given a matrix gets nPars = rows, with no error.
- How to test headlessly: in the Octave MEX under ASan, run `Audapter('setParam','pertamp2d', zeros(10,10))` and `Audapter('setParam','clampf1', zeros(1,10))`. Expect heap-buffer-overflow reads. After the fix, assert an error for any nPars ≠ expected.
- Confidence: confirmed by reading.

### I-09. The formant tracker is not rebuilt when ndelay/framelen/nwin change, so its analysis window (anaLen) is stale
- Severity: medium (silent change in analysis window length/centering; formant estimates and hence shift timing change)
- Location: Audapter.cpp:758-770 (framelen/ndelay/nwin do not set bRemakeFmtTracker); 1308-1309 and 1339-1340 recompute p.anaLen. LPFormantTracker's bufferSize (Hanning window length, autocorrelation length) is fixed at construction (lpc_formant.cpp:147, 643, 727). `setBufferSize` (lpc_formant.cpp:993) is never called. The phase vocoder is likewise configured with nDelay and is not remade on an ndelay change (1437-1441).
- Blab-only? No.
- What: C++ defaults to nDelay=7 (anaLen 416) and blab MATLAB uses nDelay=5 (anaLen 288). AudapterIO('init') gets a tracker rebuilt with the new anaLen only because a later parameter (fn1/fn2, or nlpc/cepswinwidth for male) happens to differ from the current C++ value. It fails if:
  - a second init in the same MATLAB session changes only nDelay/frameLen (fn1/fn2 unchanged), or
  - a script sets ndelay directly.
  In either case LPC runs on a 416-sample window over a buffer whose valid region is 288 samples, and the window is no longer centred on the frame being shifted.
- How to test headlessly: two runs on the same synthetic vowel. (a) Fresh object, set ndelay=5 only. (b) Fresh object, set ndelay=5, then fn1 to a new value and back. Assert that the formant tracks are identical (currently they differ). A direct check is to expose bufferSize and assert it equals p.anaLen after every setParam.
- Confidence: confirmed by reading (mechanism). Impact depends on the call sequence.

### I-10. No locks between the ASIO callback thread and the MATLAB thread; reset() is now about 190 MB of zeroing
- Severity: medium (speculative for the default flow; real for bAlwaysOn and for any setParam during a run)
- Location: Audapter.cpp:67-90 (callback), 522-680 (reset), 1406-1455 (fmtTracker/pVocs/timeDomainShifter `reset(new ...)` from the MATLAB thread), UIRecorder.m:988, 1091-1092 (AudapterIO('reset') while running when bAlwaysOn), runExperiment.m:898-902 (setParam while running when bAlwaysOn).
- Blab-only? No, but the bump doubled the reset cost.
- What:
  - Any setParam that triggers a remake frees objects the callback may be using. Examples are fn1/fn2/afact/nlpc/srate, or `pitchshiftratio`, which always remakes the time-domain shifter. That is a use-after-free if bTimeDomainShift is on or the tracker is in procFrame.
  - reset() concurrently zeroes 2×480000 + 45×480000 + 2×480000 doubles (~188 MB; ~91 MB before the bump) while the callback keeps writing and incrementing counters. The result is torn trial starts and possible ASIO underruns.
  - getData while running (bAlwaysOn: UIRecorder.m:817) reads counters and buffers that are being written.
  - data_recorder is sized [45][maxDataSize=480000] although only about one row per frame is used (~15000 per 30 s), so ~95% of the zeroing is waste.
- How to test headlessly: a pthread harness that runs handleBuffer in a loop on one thread and calls setParam('fn1', …)/reset() on another, under TSan/ASan. Also time reset() (expect tens of ms).
- Confidence: likely.

### I-11. Device buffer size mismatch makes handleBuffer silently do nothing; getData then writes plhs[2] out of bounds
- Severity: low-medium
- Location: audioIO.cpp:94 passes `&buffer_size` to RtAudio, which may change it (RtAudio.cpp:5174-5186; with granularity −1 it takes preferSize). Audapter.cpp:1667-1668 returns 1 when `frame_size != downFact*frameLen`. audapterCallback (89) always returns 0. mexLibrary.cpp:333-338 writes plhs[2] when size == 0, even with nlhs = 2.
- Blab-only? No.
- What: if the ASIO driver rounds the buffer size, nothing is processed or recorded, and the output buffer holds the unprocessed input bytes. There is no warning; startdev does not compare buffer_size to algosize. getData then returns 1×1 zeros (AudapterIO errors on column indexing) after writing past plhs.
- How to test headlessly: call audapterCallback with buffer_size = 128 while frameLen·downFact = 96. Assert an error or flag, and assert getData does not touch plhs[2] when nlhs = 2 (fake-mex check).
- Confidence: confirmed by reading.

### I-12. Stack overflow of `outputBuf[maxFrameLen]` for large frameLen·downFact; signal_recorder overrun when frameLen does not divide 480000
- Severity: low
- Location:
  - Audapter.cpp:1651 declares `dtype outputBuf[maxFrameLen]` (960), but upSampSig writes frameLen·downFact samples into it (2221-2223). checkParameters (1618) only bounds 2(nDelay−1)·frameLen, so it does not stop nDelay ≤ 2 with frameLen > 320.
  - Audapter.cpp:1684-1686, 2211-2213 and 2307: the wrap test happens after the write. For frameLen values that do not divide maxRecSize, the last frame writes past the end of signal_recorder[1] into data_recorder[0].
- Blab-only? The second part is new with the bump. 230400 is divisible by 512 but 480000 is not (480000/512 = 937.5). The first part is upstream.
- How to test headlessly: ASan build, frameLen=512, downFact=3, nDelay=1, run 940 frames. Expect a stack overflow (outputBuf) and then a global/heap overflow at frame 937.
- Confidence: confirmed by reading.

### I-13. Parameter validation happens after assignment; a rejected value stays live
- Severity: low-medium
- Location: Audapter.cpp:1303-1307 (nfb: `mexErrMsgTxt` runs before the `p.nFB = 1` recovery line, which is therefore unreachable, and pVocs are not remade); nlpc > 20 (the tracker throws at 1420 after p.nLPC was set at 1197); nTracks is never bounded above (maxNTracks = 5).
- Blab-only? No.
- What:
  - After a caught error (AudapterIO itself uses try/catch around fb5 params), p.nFB = 5 makes the loops at 2089, 2110 and 2122 index optr[4], p.mute[4], p.gain[4] and pVocs[4] out of bounds.
  - p.nLPC = 25 makes the data recorder read lpcAi[21..25] (a 21-element heap array) and write data_recorder rows 45-46, which are past the [45] array, into a_rms_o/a_rms_o_slp. That corrupts the rms slope used by OST.
  - nTracks = 6 overflows fmts/wmaPhis[5].
  - Even legal nTracks = 5 with nLPC = 20 makes getData (vecsize = 16 + 2·nT + nLPC = 46) read one row past data_recorder.
- How to test headlessly: try/catch `setParam('nfb',5)` and then run one frame under ASan. Do the same for nlpc=25, and for nTracks=5 with nLPC=20 followed by getData.
- Confidence: confirmed by reading.

### I-14. State not reset between trials (interface-side list)
- Severity: low (individually small; cross-refs noted)
- Location / What:
  - pbCounter (see I-01).
  - p.wgTime (sine and tone generators).
  - intShiftRatio and amp_ratio_prev are initialised only in the constructor (431-433). gainPerturb (1944) runs before intShiftRatio is updated from the PCF (1970-1973). The first frame of each trial therefore uses the previous trial's last intensity-shift ratio, and every intensity change lags the OST state by one frame.
  - Function statics during_trans/maintain_trans/time_elapsed/clampIx (1643-1654, formant F5), gain/lastSample (formant F14) and btransition (2395).
  - OST_TAB::reset() is never called (ost-pcf F1). lastStatEnd survives across trials, so INTENSITY_FALL cannot fire until data_counter exceeds the previous trial's value.
  - dataFileCnt is reset on every reset().
- How to test headlessly: two consecutive trials with a PCF whose last state has intShift = −12 dB. In trial 2, check that the output gain of frame 0 equals the state-0 gain.
- Confidence: confirmed by reading.

### I-15. RMS-clip "loudness protection" zeroes the wrong part of the circular buffer; blab's MATLAB settings for it are ignored
- Severity: low-medium (safety feature is non-functional)
- Location: Audapter.cpp:1955-1958 (`outFrameBuf[n] = 0` for n < frameLen; it should offset by outFrameBuf_circPtr). AudapterIO.m:47-53 (bRMSClip/rmsClipThresh setters are commented out). C++ defaults (507-509) are bRMSClip = 1 and thresh = 1.0, and MATLAB's p.bRMSClip = 0 / micRMS-based threshold never reach the mex (testTSM.m also sets them, with no effect).
- Blab-only? No.
- What: when triggered, the clip mutes a stale 2 ms slot, not the current frame (except once every 54000 frames). In practice it never triggers because thresh = 1.0. data.params reports bRMSClip = 1, while the experiment's p says 0.
- How to test headlessly: set rmsclipthresh = 0.01, feed a 0.5-amplitude sine, and assert that the output is zero (it is not).
- Confidence: confirmed by reading.

### I-16. MATLAB ↔ C++ interface mismatches (blab mcode)
- Severity: low (each silent, small)
- Items:
  - `getAudapterDefaultParams.m:24-26`: an override stores `p.downfact` (lower case) while everything uses `p.downFact`. Passing 'downFact' silently has no effect, including on p.sr (line 37). Upstream typo.
  - `getAudapterDefaultParams.m:75-76`: the 'closedLoopGain' varargin is also used as `mouthMicDist`. Passing closedLoopGain = 15 sets the mic distance to 15 cm and changes rmsThresh. Upstream.
  - `getAudapterDefaultParams.m:15` sets `p.nFB`, but AudapterIO.m:111-115 reads `p.nfb`. nFB is always forced to 1, and a 2-voice pitchShiftRatio errors with the misleading message "Erroneous length of input delayFrames".
  - AudapterIO getData layout (AudapterIO.m:364-393) matches the C++ columns (Audapter.cpp:1905-1936, 2096-2105), which I verified index by index. It uses the *persistent* p (nTracks/nLPC from the last 'init'), not the mex's current values. A direct `Audapter(3,'nlpc',…)` shifts all later columns silently. getData always has two extra all-zero columns (vecsize counts 16 + 2nT + nLPC, but the last written index is 13 + 2nT + nLPC). The shiftedPitchHz column is written only when above_rms, so it is stale after a recorder wrap. `nout==3` references the undefined `transdataMat`.
  - getAudapterParamSet.m (the saved data.params):
    - `datapb` returns 1×0, because getParam passes nPars = 0 so len = 0 (Audapter.cpp:922). The noise/playback used for fb 2-5 is never logged.
    - `rmsFF_fb` returns [] (queryParam TYPE_SMN_RMS_FF, 1595-1597), although it governs the fb4/fb5 modulation.
    - `mute` returns only mute[0].
    - minVowelLen is registered as INT (Audapter.cpp:152) but stored as double (Audapter.h:469). Setting it writes 4 bytes into a double. The param is unused anyway.
    - The registered name "bpvocmpnorm" (138) does not match the lookup "bpvocampnorm" (877), so bPvocAmpNorm can neither be set nor read.
  - `fb` is not validated (Audapter.cpp:797-799). Any value outside 0 and 2-5 behaves as fb=1 (normal speech). On a pre-b2.5 mex, fb=5 without fb5 fields in p silently gives normal feedback. The "fb" help string (151) omits mode 5. audapterDemo_online.m:54-58 rejects fb=5.
  - `mxGetPr(prhs[2])` (mexLibrary.cpp:279) is used without a class check. A logical/int argument (e.g. `setParam('bShift', true)`) is reinterpreted as a double, which gives a garbage value (likely 0 or huge). Case 3 also dereferences prhs[2] when nrhs == 2 (254).
  - play_audio.m renormalises to 0.98 peak, which loses calibrated levels and divides by zero on silence. check_file.m is fine.
- How to test headlessly: MATLAB-side unit checks in Octave: default params with 'downFact',2 give p.sr = 24000; round-trip getAudapterParamSet after setting datapb/rmsFF_fb; `Audapter('setParam','bshift',true)` followed by getParam should equal 1.
- Confidence: confirmed by reading.

### I-17. genRandScript.m (blab rewrite of the check helpers)
- Severity: low
- Location: genRandScript.m:26-31, 73-75, 203-205 (checks now `x < 1 || ~isnumeric(x)`). Line ~571: `strsplit(tmpstr, '-')` uses the undefined lower-case `tmpstr`. Lines ~552 and 570: `length(strfind(tmpStr,'-') == 1)` has a misplaced parenthesis.
- Blab-only? Yes (commit 02aad98 inlined these).
- What:
  - NaN from `str2double` on a malformed config passes the new checks. So do non-integers (nBlocks = 2.5 gives 2 blocks). Trial counts are caught later by the sum check, but nBlocks/trialsPerBlock are not.
  - Nested bracket intervals in string2intervals throw "undefined tmpstr".
  - A negative value parses as [NaN x] and is silently pruned.
- How to test headlessly: Octave. Call genRandScript with N_BLOCKS 'abc' and expect an error; call string2intervals('[100-200]',1) and expect [100 200].
- Confidence: confirmed by reading.

### I-18. Minor
- writeSignalsToWavFile (action 31; Audapter.cpp:2941-2943) calls `exit(1)` on an open failure, which kills MATLAB. It always writes maxRecSize samples, and its clip test on a `short` (2990) is a no-op, so values above 1.0 wrap.
- fb 2-5 read datapb with stride downFact and no anti-alias filter (2202). The noise heard is an aliased, decimated version of the loaded 48 kHz file.
- mexLibrary.cpp:113-126: `isActionString` is uninitialised for non-row first arguments. Line 348 checks `inParNDims` instead of `inSigNDims`. Line 119 reads into `actionStr[512]` with no length bound.
- stereoMode other than 0/1/2 leaves the output buffer as the input bytes (2278-2280).
- Upstream TransShift.h still says 230400 but is not compiled.

## Ideas
- Add `pbLen`, saturating recorders with an overflow flag, and an explicit `lastError` getter. Make getData return a struct from C++ (column names) so MATLAB never has to hard-code offsets.
- Centralise parameter validation: validate before assignment, check nPars == expected length for every array param, check mxIsDouble, and bound nTracks, nFB and tsgNTones.
- Replace the static-local / constructor-only state with members reset in reset(). Call ostTab.reset() and reset pbCounter, wgTime, intShiftRatio and amp_ratio_prev.
- Protect the setParam/reset/getData ↔ callback boundary with a mutex or a "params pending" double buffer. Refuse remaking setParams while started.
- Zero only the used part of the recorders in reset(), or size data_recorder by frames rather than samples (maxDataSize = maxRecSize/minFrameLen).
- Harness regression tests: T1-T6 above, plus ASan runs of I-06, I-07, I-08, I-12 and I-13.
