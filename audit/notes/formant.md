# Formant tracking / formant perturbation audit (area: formant)

Scope: `TransShiftMex/lpc_formant.cpp/.h`, `DSPF.cpp`, formant path of `Audapter.cpp`
(handleBuffer lines ~1740-1945, detectTrans 2393-2427, getGain/gainAdapt/formantShiftFilter
2430-2515, locateF1/F2 2675-2728, gainPerturb 3031), setGetParam/queryParam for the
blab-added params, and MATLAB `AudapterIO.m` / `getAudapterDefaultParams.m` /
`getAudapterParamSet.m` (blab audapter_matlab).
All line numbers are for blab `origin/master` (audapter_mex HEAD 169cadf).
Blab-only formant changes: 2D field (`pertf1`, `pertamp2d`, `pertphi2d`, `bshift2d`,
`locateF1`), taimComp clamping (`bclampformants`, `clamposts`, `clampf1/2`), "dropout fix"
in detectTrans. `lpc_formant.cpp` and `DSPF.cpp` are unchanged from upstream.

Verified OK (no finding):
- 2D transpose on set (Audapter.cpp:1226-1232) and on get (1550-1559) are consistent:
  after `Audapter(3,'pertamp2d',M)`, `p.pertAmp2D[i][j] == M(i+1,j+1)`; use site
  `pertAmp2D[locintf1][locintf2]` (1846-1847) => **MATLAB rows = F1 grid index, columns =
  F2 grid index**. getParam round-trips the same matrix. No row/col-major bug in the C code.
- Binary search in locateF1/locateF2 is correct for strictly increasing 257-point grids
  (brute-force checked in scratch/formant/loc.cpp: 0 mismatches over 150-1600 Hz; values
  below grid clamp to 0, above clamp to 255.999..., so `locint<=255`, `locint+1<=256`, in bounds).
- 1D path "locfracf2 error referencing f1" fix is correct now: 1D uses
  `locintf2/locfracf2` (1850-1851), identical math to upstream.
- Clamp index cannot overflow: `clampIx` is capped at `maxNClampFrames-2` (1818).
- Units: the 2D field, F1Min/F1Max, pertF1/pertF2 are all compared against f1m/f2m, i.e.
  mel if bMelShift=1 else Hz; the clamp values are always Hz (converted straight to
  newPhis, 1815-1816). Consistent, but see F15 for documentation.

---

### F1. `clampf1`/`clampf2` setter always copies 2048 doubles regardless of input length (OOB read; clamp runs into garbage)
- Severity: high (conditional on caller passing a vector shorter than 2048)
- Location: Audapter.cpp:1154-1173 (len forced to `maxNClampFrames`), 1211-1225 (copy loop; zero-fill commented out)
- Blab-only? yes
- What: `len = maxNClampFrames` unconditionally, so `setParam("clampf1", value, nPars)` reads
  2048 doubles from the MATLAB array even if it has N<2048 elements. Elements N..2047 are
  whatever lies after the mxArray data on the MATLAB heap. The clamp terminator is
  `p.clamp_f1[clampIx+1] != 0` (1818), so if the garbage is nonzero the clamp keeps
  advancing through garbage "formant" values (arbitrary doubles, possibly huge/NaN/denormal)
  which are turned directly into pole angles -> arbitrary/NaN output audio and logged sFmts.
  Passing `[]` gives `mxGetPr()==NULL` -> crash. The in-source comment explains why: the
  developer tried `len = min(nPars, max)` but getParam calls this with nPars=0 so
  getParam returned empty; the fix chosen breaks setting instead. The "zero the rest" block
  (1221-1224) is commented out because with len==max it is a no-op anyway.
  Safe only if every caller pads to exactly 2048 (getAudapterDefaultParams does,
  zeros(1,2048); the taimComp experiment code is not in this repo, so unverified).
- Evidence: `len = maxNClampFrames;` (1162, 1172) plus generic DOUBLE_ARRAY copy
  `for i<len: ptr[i] = value[i]`.
- How to test headlessly: allocate `double *v = new double[10]` (ASan) filled with 700 Hz /
  1200 Hz and call `setParam("clampf1", v, 10)` -> ASan heap-buffer-overflow. Without ASan:
  allocate 2048 doubles, fill [0..9]=700 and [10..2047]=1234 (sentinel), call with nPars=10;
  assert `getParam("clampf1")[10..] == 0` (currently == 1234). End-to-end: bShift=1,
  bClampFormants=1, clamp_osts=[0 999], feed 100 frames of a synthetic vowel (e.g. glottal
  pulse train 120 Hz through formant resonators 700/1200/2500 Hz, above rmsThresh); assert
  the logged sFmts(F1) column stays at 700 after frame 10 (currently goes to 1234).
  Fix: `len = bSet ? min(nPars, max) : max;` and zero-fill `[len, max)` on set.
- Confidence: confirmed-by-reading

### F2. No size validation on pertf1 / pertamp2d / pertphi2d (and upstream pertf2/pertamp/pertphi); non-257x257 matrices read OOB
- Severity: medium
- Location: Audapter.cpp:930-953 (len = pfNPoints), 1226-1232 (reads len*len = 66049 doubles); mexLibrary.cpp:262-272 (nPars = rows for a matrix)
- Blab-only? yes for pertf1/pertamp2d/pertphi2d (pattern inherited from upstream pertf2/pertamp/pertphi)
- What: the setter ignores nPars. A 2D field that is not exactly 257x257 (e.g. a coarser
  50x50 field, or a 257-vector passed by mistake) makes the transpose loop read far past the
  MATLAB buffer -> garbage perturbation field (silent) or access violation. A wrong-shaped
  but right-sized array (e.g. 1x66049) is accepted and silently reinterpreted.
  Axis orientation is also not enforced: the code requires rows=F1, cols=F2 (see header),
  but nothing in AudapterIO/getAudapterDefaultParams documents this; a field built with
  `[F1g,F2g]=meshgrid(pertF1,pertF2)` (rows=F2) is silently transposed. For a
  non-separable field this perturbs in the wrong place/direction with no error.
- Evidence: `else if (ns == string("pertamp2d")) { ptr = p.pertAmp2D; len = pfNPoints; }` then
  `ptr[i*len+j] = value[j*len+i]` for i,j<257, no check on nPars or on column count
  (mexLibrary only passes rows as nPars; columns are never passed).
- How to test headlessly: call `setParam("pertamp2d", buf, 50)` with a 50x50 ASan-guarded
  buffer -> overflow. Orientation test: set pertF1=linspace(200,1000,257),
  pertF2=linspace(800,2500,257), pertAmp2D(i,j)=0.2 only for rows 0..128 (F1<600), 0 else,
  pertPhi2D=0 (pure F1 shift), bShift2D=1, bShift=1, bDetect=1, bRatioShift=1, bMelShift=0;
  feed a synthetic vowel with F1=500,F2=2000 then one with F1=800,F2=1000; assert
  sFmts(F1)≈600 for the first and ≈800 (unshifted) for the second.
  Fix: require nPars==257 and the column count (pass both dims from mexLibrary).
- Confidence: confirmed-by-reading

### F3. 2D field is looked up by floor (lower-left cell), not interpolated; comment claims linear interpolation
- Severity: medium (systematic, small-to-moderate magnitude; depends on field smoothness)
- Location: Audapter.cpp:1831-1837, 1845-1848
- Blab-only? yes
- What: `locfracf1`/`locfracf2` are computed but unused in the 2D branch:
  `mamp = p.pertAmp2D[locintf1][locintf2]` (comment "Interpolaton (linear)"). The applied
  perturbation is piecewise-constant, biased by up to one grid step toward lower F1/F2
  (half a step on average), jumps discontinuously at cell boundaries, and the last row and
  last column of the 257x257 matrix are never used (loc is clamped to 255.999 -> index 255).
  The 1D path does interpolate. Experimenters who compute "intended perturbation at the
  produced formants" offline with interp2 will get a different value than applied.
- Evidence: see lines; locfracf1 has no reader anywhere (grep).
- How to test headlessly: pertF1=pertF2=linspace(0,2560,257) (10 Hz steps, bMelShift=0,
  bRatioShift=0), pertAmp2D(i,j)=i-1 (amp = row index in Hz), pertPhi2D=0 (shift F1 only);
  vowel with F1 tracked ≈ 705 Hz; bilinear would give shift ≈70.5, current gives 70. Make the
  field steep (amp=10*(i-1)) to see a 5 Hz discrepancy clearly; assert sFmts(F1)-fmts(F1)
  matches bilinear interpolation. Also put a nonzero only in row 257 and check it is
  reachable for F1 above the grid (currently never).
- Confidence: confirmed-by-reading

### F4. Clamp branch bypasses the voicing (above_rms) check: logged sFmts claim a clamp that was not applied, and the clamp trajectory advances through silence
- Severity: medium
- Location: Audapter.cpp:1814-1825, 1883-1888
- Blab-only? yes
- What: the clamp branch sets `during_trans=true` whenever the OST state is in
  [clamp_osts[0], clamp_osts[1]) regardless of `above_rms`. In a sub-threshold window,
  `amps[]` and `wmaPhis[]` were zeroed (1775-1782), so `formantShiftFilter` has mags=0 ->
  b=a=[1,0,0] identity: nothing is shifted, but `sFmts` is logged as the clamp target
  (1884-1886). So data.sfmts shows clamped formants in frames where the participant heard
  unaltered speech (e.g. voicing dropouts, onsets/offsets, fricatives inside the window).
  Also clampIx increments on every window in the OST range, voiced or not, so the clamp
  trajectory is time-locked to OST entry, not to voicing; with nWin>1 it advances once per
  window (nWin times per frame), so MATLAB must build the trajectory at frameLen/nWin rate.
  (By contrast the perturbation branch requires `during_trans && above_rms`.)
- Evidence: `if (p.bClampFormants && stat >= ... && p.clamp_f1[clampIx] != 0) { newPhis=...; during_trans = true; ...}` — no above_rms term; then `if (during_trans||maintain_trans){ sFmts = newPhis...; formantShiftFilter(..., amps, ...)}`.
- How to test headlessly: bShift=1, bClampFormants=1, clamp_osts=[0 999] (stat stays 0
  without an OST file), clamp_f1=600*ones(1,2048), clamp_f2=1500*ones(1,2048). Feed 20
  frames of silence then 20 frames of vowel. Assert: for silent frames either sFmts==0 or
  (if the current behavior is intended) output==input; currently sFmts(F1)=600 while the
  output buffer equals the unmodified input. Also check that clampIx at voicing onset is 0
  (log sFmts with a ramped clamp_f1 = 600+k to see which index is used at onset; currently
  index ≈ number of silent windows elapsed).
- Confidence: confirmed-by-reading

### F5. clampIx is a function-static in handleBuffer; not reset by `reset()` (state can leak across trials)
- Severity: low-medium
- Location: Audapter.cpp:1654 (static), 1876 (only reset site); reset() at 522-680 does not touch it
- Blab-only? yes
- What: clampIx is reset only when a window takes the "no force applied" else-branch. If a
  trial ends inside the clamp window (typical when the trial is cut off before the end OST)
  and the next trial's first window is again in the clamp window (clamp_osts[0]==0), or the
  first windows take the perturbation branch (pcf with nonzero fmtPertAmp at stat 0 and
  immediate voicing), the new trial starts mid-trajectory (or skips a frame when it lands on a
  zero). Also impossible for a harness/MATLAB to reset. Related: the same static-local pattern
  holds `during_trans`, `maintain_trans`, `time_elapsed` (1643-1653).
  Off-by-one: clampIx max is 2046, so element 2047 of a full-length trajectory is never used.
- How to test headlessly: clamp_osts=[0 999], clamp_f1 = 500+(0:2047) (ramp). Trial A: feed
  30 voiced frames; call reset(); trial B: feed 5 voiced frames; assert trial B's first
  sFmts(F1)==500 (currently ≈530).
- Confidence: confirmed-by-reading

### F6. "Dropout fix" removes `transDone`: perturbation now re-arms on every re-entry into the field; minVowelLen is dead
- Severity: medium (semantic change vs upstream; may or may not be intended per experiment)
- Location: Audapter.cpp:2393-2427 (esp. 2409-2412 commented out, 2418)
- Blab-only? yes
- What: Upstream: once F1/F2 had been in the field ≥ minVowelLen windows and then left it,
  `transDone=true` and no further perturbation occurred for the rest of the trial (one vowel
  per trial). Blab removed the set; `transDone` is now only ever false (reset() sets false,
  nothing sets true), so the `else` branch (2415-2419) is dead code and `minVowelLen` has no
  effect. Every vowel/segment in a trial whose formants fall in [F1Min,F1Max]x[F2Min,F2Max]
  (+LB boundary) is perturbed, including later syllables and brief tracker excursions. This
  fixes perturbation dropping out mid-vowel, but changes behavior for multi-syllable stimuli
  and for any lab using blab mex with upstream-style configs. Note sub-threshold RMS gaps
  never triggered transDone in upstream either (detectTrans is only called when above_rms),
  so the "dropout" being fixed was formant excursions out of the field.
- How to test headlessly: bShift=1, bDetect=1, no pcf, F2Min..F2Max bracketing vowel 1
  (e.g. 1000-2500 Hz, bMelShift=0), constant pertAmp=0.2 ratio, minVowelLen=5. Input:
  vowel A (F2=1800) 30 frames, silence 10, vowel B (F2=1800) 30 frames. Upstream: B
  unshifted; blab: B shifted. Also vowel with a 3-frame excursion of F2 out of field mid-vowel.
  Assert whichever semantics the lab intends; document it.
- Confidence: confirmed-by-reading

### F7. NaN from locateF1/locateF2 on non-strictly-increasing grids -> `(int)floor(NaN)` = INT_MIN index (OOB read); locateF1 runs even in 1D mode on the all-zero default grid
- Severity: low (2D with a malformed grid: medium)
- Location: Audapter.cpp:2675-2701 (locateF1), 2703-2728 (locateF2), 1831-1836
- Blab-only? locateF1 and its unconditional call: yes; same flaw in locateF2 is upstream
- What: `loc += (f - g[k])/(g[k+1]-g[k])` gives +inf when g[k+1]==g[k] (clamped fine) but NaN
  when f == g[k] == g[k+1]; NaN passes both clamps (`>=` and `<` are false), and
  `static_cast<int>(floor(NaN))` is UB (INT_MIN on x86) -> `pertAmp2D[INT_MIN][..]` or
  `pertAmp[INT_MIN]`. Reproduced in scratch/formant/loc.cpp: grid flat at 1000 for the top
  part, f=1000 -> NaN; all-zero grid, f=0 -> NaN, int -2147483648. In 1D mode locateF1 is
  evaluated with the default all-zero pertF1 every perturbed window (result unused: UB but
  harmless in practice). In 2D mode a grid with repeated values (e.g. padded with its max, or
  pertF1 left at default zeros while bShift2D=1 -> always row 255, silently) is dangerous.
- How to test headlessly: unit-call locateF1 with pertF1 = [linspace(200,1000,200), 1000*ones(1,57)] and f1=1000 (in mel/Hz per bMelShift); assert finite loc in [0,256). Also bShift2D=1 with pertF1 all zeros: assert setParam/checkParameters rejects it (currently silently uses row 255).
- Confidence: confirmed-by-reading + reproduced in scratch

### F8. clamp_f2 not validated: a zero F2 with nonzero F1 moves the F2 pole to DC
- Severity: low
- Location: Audapter.cpp:1814-1816
- Blab-only? yes
- What: only clamp_f1 is used as the terminator/validity flag. If clamp_f2 is shorter than
  clamp_f1 (zero-padded), newPhis[1]=0 -> pole at z=r (DC) with radius amps[1] (~0.95-0.99):
  ~+30-40 dB low-frequency boost; getGain partially compensates by a tiny gtot only if
  bGainAdapt. Garbage audio, silently logged as sFmts(F2)=0.
- How to test headlessly: clamp_f1=700*ones(1,100), clamp_f2=[1200*ones(1,50), zeros]; feed
  vowel; assert output RMS stays within a few dB of input across frames 50-100.
- Confidence: confirmed-by-reading

### F9. trackPhi keeps `static last_f[]` across trials and tracker re-creation (formant tracking state leak)
- Severity: medium (reproducibility: online vs offline reprocessing, trial-order dependence)
- Location: lpc_formant.cpp:816, used at 852 (cost) and 900 (update)
- Blab-only? no (upstream)
- What: the DP tracker's continuity term `gFact*|f - last_f[k]|` (gFact=1 by default in
  getAudapterDefaultParams) uses a function-static array that is never reset by
  `LPFormantTracker::reset()` / `postSupraThreshReset()` / Audapter reset / even destroying and
  recreating fmtTracker (e.g. nLPC change). The first frames of each trial are biased toward
  the previous trial's last formants (trackFF=0.95, so ~20 frames of memory). Offline
  re-processing of a single trial will not reproduce online fmts/sFmts exactly, and results
  depend on trial order. It is also shared by any other LPFormantTracker instance in the
  process.
- How to test headlessly: run trial B (vowel F1=300,F2=2300) alone after reset -> record
  fmts; then run trial A (F1=800,F2=1200), reset(), trial B again; assert identical fmts for B
  (expected to differ in first frames today, especially with ambiguous candidates, e.g. make
  B have a weak F2 and a nearby spurious peak).
- Confidence: confirmed-by-reading

### F10. trackPhi reads stale root candidates when fewer than nCands+1 complex roots exist
- Severity: low
- Location: lpc_formant.cpp:833-838 (i0 up to nCands-nTracks+k+1 = 6), getRPhiBw 744-806 (fills only numroots entries), procFrame 949-983 (phi_us/radius not cleared)
- Blab-only? no
- What: with nCands=6, nTracks=4 the DP reads phi_us[0..6], radius[0..6]. numroots (complex
  pairs with wi>0) can be <7 (nLPC=15 has ≥1 real root; more real roots on noisy frames).
  Entries ≥numroots hold values from previous frames (phi_us is a member buffer; `radius` is
  Audapter::amps, zeroed only for [0,nTracks)). A stale in-range candidate can win, yielding
  a phantom formant that is then shifted.
- How to test headlessly: feed a frame whose LPC has many real roots (white noise above
  threshold after a vowel); log fmts; compare to a version that zero-fills phi_us/radius
  beyond numroots (with radius 0 -> infinite bandwidth cost).
- Confidence: likely

### F11. Shifted formant targets are not bounded to (0, Nyquist); logged sFmts can disagree with what the filter applies
- Severity: low
- Location: Audapter.cpp:1855-1872
- Blab-only? no (applies to 2D path too)
- What: large absolute shifts or ratio shifts with `mamp*sin(mphi) < -1` give sf<0 (and mel2hz
  of negative mel is negative); the filter uses cos(newPhi), which is even, so it actually
  moves the pole to |sf| while data logs a negative sFmt; sf > sr/2 aliases. No NaN risk.
- How to test headlessly: bRatioShift=1, pertAmp=1.5, pertPhi=-pi/2 on a vowel; assert
  sFmts(F2) >= 0 or a param-validation error.
- Confidence: confirmed-by-reading

### F12. With nWin>1 sFmts (and dFmts) are only zeroed per frame, so an unshifted window logs the previous window's shifted values
- Severity: low (nWin=1 default)
- Location: Audapter.cpp:1675-1678 (zeroed before the fi loop), 1883-1886, 1918-1922
- Blab-only? no
- How to test headlessly: nWin=2, arrange shifting to stop mid-frame (OST/pcf or field
  boundary); assert logged sFmts==0 for the unshifted window.
- Confidence: confirmed-by-reading

### F13. 1D field interpolates pertPhi linearly without angle wrap
- Severity: low
- Location: Audapter.cpp:1850-1851
- Blab-only? no
- What: neighbors at +pi and -pi interpolate through 0 -> perturbation in the opposite
  direction for one grid cell. Irrelevant for constant-phi fields (the common case).
- Test: pertPhi = [pi*ones(1,128), -pi*ones(1,129)]... F2 in cell 127-128; assert mphi≈±pi.
- Confidence: confirmed-by-reading

### F14. gainAdapt/gainPerturb keep `static gain`, `static lastSample` across trials
- Severity: low
- Location: Audapter.cpp:2453-2454, 3042-3043
- Blab-only? no
- What: the first samples of a new trial are scaled by the previous trial's last gain until
  the first zero crossing (usually within a few samples; matters for gainPerturb when the
  previous trial ended in an intensity-perturbed state).
- Test: pcf with intShift +10 dB in last state; run, reset, run a trial with no intShift;
  assert first output samples == input*scale.
- Confidence: confirmed-by-reading

### F15. Unit/axis documentation inconsistencies on the MATLAB side
- Severity: low (risk of experimenter error)
- Location: AudapterIO.m:89-106 comments say "Mel"; Audapter.cpp:207 help says "F1 grid (Hz)";
  C default bMelShift=1 (Audapter.cpp:337) vs MATLAB default 0 (getAudapterDefaultParams.m:94);
  no statement anywhere in MATLAB that pertAmp2D rows index pertF1 and columns index pertF2.
- What: grids/field units actually follow bMelShift (and F1Min/F1Max/F2Min/F2Max/LBk/LBb too).
  If an experiment sets params without bMelShift (field absent), the C default mel is used
  with Hz grids.
- Confidence: confirmed-by-reading

---

## Ideas
- Harness golden tests for the formant path: synthetic vowel generator (impulse train through
  2-4 resonators at known F1/F2, 16 kHz after downsampling) -> assert tracked fmts within
  ~5%, sFmts equals expected field value, and the output's LPC-estimated F1/F2 moved by the
  logged amount (closes the "logged vs applied" loop; also catches F4/F11).
- Add a `resetStatics()` path: move handleBuffer/detectTrans/gainAdapt/gainPerturb/trackPhi
  statics into members reset by `reset()` (F5, F9, F14). Harness should run every test twice
  in one process (A then B, and B alone) and diff outputs to catch state leakage.
- Parameter validation at checkParameters(): pertF1/pertF2 strictly increasing when bShift is
  on; 2D field exactly 257x257; clamp arrays length-checked and zero-filled; clamp_f2 nonzero
  wherever clamp_f1 is; shifted formants clamped to (50 Hz, sr/2-50).
- Replace floor lookup in 2D with bilinear interpolation (locfrac already computed), or
  document it as nearest-lower-cell and make MATLAB-side analysis tools match.
- Run the harness under ASan/UBSan: F1, F2 and F7 are directly detectable (heap overflow,
  float-cast-overflow).
- Scratch: ~/hobby/audapter/audit/scratch/formant/loc.cpp (standalone locateF check).
