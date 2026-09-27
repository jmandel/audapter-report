# Formal checks of the blab Audapter C++ core

Target: blab `audapter_mex` @169cadf (`blab/audapter_mex/TransShiftMex/`). Each result is also
logged as FORMAL-1..9 in `audit/FINDINGS-LOG.md`. Re-check everything with `audit/formal/run.sh`
(quick, a few minutes). `run.sh sweep` adds the full frameLen sweep, which takes hours.

The audit's tests had already shown *that* these bugs happen for the settings that were tried.
The formal work answers two further questions:
- For **which settings exactly** does each bug happen?
- Do the proposed fixes work **for all settings**?

## What was used, and why

| Target | Tool | Why this tool |
|---|---|---|
| Ring-buffer / recorder index arithmetic (FORMAL-1..6) | **CBMC** 5.95 (bounded model checker for C), docker image `audapter-formal` | Checks the *actual source text*: `cbmc/extract.py` copies the relevant lines of Audapter.cpp verbatim and pins each snippet by SHA-256, so a changed source makes the check refuse to run. CBMC models C's integer semantics exactly, including negative `%`, which is the bug here; re-encoding that by hand is where mistakes hide. |
| OST state machine across trials (FORMAL-8) | **Lean 4** (v4.34.1, core only, no Mathlib; `lean/`, build with `lake build`) | "Trial behaviour never depends on earlier trials" is a claim about unboundedly many trials and frames. That needs induction, which a bounded checker cannot do. |
| Phase-vocoder loudness (FORMAL-7) | **Exact algebra** (`ola/ola_exact.py`, rational arithmetic) plus a run of the real `phase_vocoder.cpp` | The proof is one line of algebra (below). A heavyweight prover would add nothing. |
| Formant-field grid lookup (FORMAL-9) | **CBMC** with IEEE doubles, verbatim `locateF1` body | Floating-point corner cases (NaN, ±Inf, overflow) are exactly what CBMC's bit-precise float model gets right. |

---
## <a name="ring"></a>1. Ring buffers and recorder (CBMC): FORMAL-1..6

**Checked code** (verbatim, Audapter.cpp):
- 1962: current frame into the pre-pitch-shift ring; 1948/1952 use the same pointer and length
- 2089-2092: no-pitch-shift copy into each voice
- 2002-2009: pvoc analysis-window copy with wrap-around
- 2065-2081: pvoc overlap-add accumulate, front zeroing, back zeroing
- 2110-2127: DAF read pointer `optr` and summation into `outFrameBufSum`
- 2225-2228: ring-pointer advance
- 1683-1687 and 2211-2213: recorder writes
- 2304-2307: recorder wrap

**Parameter domain** is everything the code itself accepts:
- frameLen F: 1..960
- delayFrames d: 0..600 (setParam clamp)
- nFB: 1..4
- pvocFrameLen N: any power of two up to 4096
- pvocHop H: 1..N
- ring position c: every value the pointer can reach (c = kF < L)
- L = internalBufLen = 1,728,000 samples = 108 s at 16 kHz

F is fixed per CBMC run because a symbolic divisor makes the SAT problem intractable, so run.sh
enumerates it. Every other parameter is fully symbolic, i.e. all values are covered at once.
**Coverage.** Each F takes 17 CBMC runs, and the machine is shared, so the sweep runs at 2 jobs and
about 3.5 GB per job. At the time of writing, F = 1..34 and 36 are complete with 0 failures, and
`run.sh` re-checks F = 32 and F = 7. The rest of F <= 120 (the reachable range with nDelay = 5),
plus 128, 160, 192, 256, 320 and 512, is running in the docker container `formal-sweep`, which
appends to `results/cbmc-sweep.txt` (`grep -c FAIL` should stay 0). Two properties were first proven *inductively*: the ring pointer
always satisfies 0 <= c < L with F dividing c, and the recorder counter always satisfies
frame_counter·F < 480000 with data_counter == frame_counter. So "reachable" is exact, not an
approximation.

**Results** (original code: exactly when out of bounds / fix: proven safe when):

| Site | Original: out of bounds **exactly** when | Fix, proven in bounds |
|---|---|---|
| DAF read 2110-2127 (FORMAL-2) | c = d·F, i.e. frame d of every trial and again every 108 s; or, if F does not divide L, the last frame of a lap | change `> 0` to `>= 0`, **and** F divides L. It then reads exactly the frame written d frames earlier |
| Back zeroing 2078-2081 (FORMAL-4) | iteration i0 writes index c − d·F − i0 < 0; a pvoc frame does so iff c < d·F + H | positive modulo `((x % L) + L) % L`: safe for all parameters, identical to the original wherever the original was valid (or simply delete the loop: front zeroing already clears the slots) |
| `outFrameBufSum[n0 + N − F]` 2121/2124, **every frame, pitch shift or not** (FORMAL-1, NEW) | N < F (writes *before* the array, onto `outFrameBuf_circPtr`) or N > 2880 | validate F <= N <= 2880 |
| Current-frame write 1962 and copy 2090 (FORMAL-3, NEW) | c + F > L, which is reachable iff F does not divide 1,728,000 | F divides L (or wrap with `% L`) |
| Recorder 1685/2212 (FORMAL-5) | (frame_counter+1)·F > 480000, reachable iff F does not divide 480000 (trial > 30 s at 16 kHz) | F divides 480000 (or bound the copy) |
| pvoc input copy 2002-2009 (FORMAL-6) | never, if N <= 4096. It copies exactly the N samples before the current frame | n/a |
| OLA accumulate and front zeroing | never | n/a |

**Which configurations are affected** (the region that passes `checkParameters`, 2(nDelay−1)·F <= 960):
- The common frameLen values 16, 32, 48, 64, 80, 96, 120, 128, 160, 192, 240, 256, 320, 480 and
  960 divide both 1,728,000 and 480,000. For them FORMAL-3 and FORMAL-5 **cannot happen**. The
  exception is **512**, which does not divide 480,000, so a trial longer than 30 s overruns the
  recorder.
- **FORMAL-1** needs pvocFrameLen < frameLen **and** pvocHop >= frameLen. With pvocHop < frameLen,
  line 1986 divides by zero first (PT-11). This is impossible with either default and practically
  unreachable with sane settings. It is still worth a one-line validation, because the effect is
  severe. In the harness (`harness/oct/formal_n_lt_f.m`: frameLen 64, pvocFrameLen 32, pvocHop 64,
  pitch shift off) both the normal and the ASan build **segfault** within the first frames. The
  negative index overwrites the ring pointer.
- **FORMAL-2** happens in every configuration. At trial start the wrongly read frame and the right
  one are both near-silent. It becomes audible as a one-frame dropout only in continuous runs
  longer than 108 s without `reset`.
- **FORMAL-4**, within the first 108 s, needs DAF and pitch shift together, with delayFrames >
  (nDelay−1) + (N−H)/F. That is d >= 11 frames (22 ms) with the MATLAB defaults 256/64/32/5, and
  d >= 31 with the C++ defaults. It then overwrites slots that are still zero, which is harmless.
  After a 108 s wrap it zeroes live audio.

**In audio terms:**
- The DAF-read bug plays one frame from the *next voice's* buffer, which is silence for
  single-voice setups: a 2 ms dropout.
- The back-zeroing bug erases up to d·F + H samples of the analysis input or of the previous
  voice. After a wrap, that is a glitch in the pitch-shifted or delayed feedback.
- The recorder bug overwrites the first samples of the *output* recording, and then the first
  entries of the logged frame-index row, so the saved data no longer match what was heard.

**Fidelity**: the index expressions are the source text. Four mechanical transforms are applied,
all listed in `cbmc/extract.py`:
1. A `for` loop runs one arbitrary iteration. The indices in these loops do not depend on earlier
   iterations, so this is equivalent for index safety.
2. Accesses to `outFrameBufPS`/`outFrameBufSum` go through an accessor that records and checks
   the index.
3. `static_cast<T>(x)` becomes `(T)(x)`.
4. The fixes are exact string replacements.

Sample *values* are modelled as `int`, since they never influence an index. `DSPF_dp_blk_move` is
modelled by its contract: memcpy of nx elements, with the whole source and destination range
checked. In the real C++ class the buffers are adjacent members. An overflow therefore silently
lands in the neighbouring buffer, which ASan cannot see. In the harness they are separate objects,
so CBMC flags every such overflow.

---
## <a name="ola"></a>2. Phase-vocoder loudness (FORMAL-7)

The window is w(i) = ½ − ½cos(2πi/N) (phase_vocoder.cpp:11-13). It is used for analysis *and*
synthesis, with hop N/R, where R = osamp = pvocFrameLen/pvocHop. Write z = e^{iθ}. Then

  w² = 3/8 − (z + z⁻¹)/4 + (z² + z⁻²)/16.

Summing over the R frames that overlap any sample multiplies each z^m by Σ_k e^{2πikm/R}. That
sum is R when R divides m, and 0 otherwise. So for **R >= 3** only the constant survives:
Σ w² = 3R/8.

At 0 semitones the vocoder's IFFT returns the windowed input, because the phase accumulator
tracks the analysis phase exactly. Synthesis then multiplies by (4/R)·w (line 467). The output is
therefore **(4/R)·(3R/8) = 3/2 of the input, for every N, hop, frameLen and sample rate.** That is
exactly the +3.52 dB the harness measured (PT-5); it is not a property of the test signal.

- **Unity gain:** multiply line 467 by 2/3, i.e. `ftBuf2[2*i] * hWin[i] * 8.0 / (3.0 * osamp)`.
  With that, a PCF that switches 0 → +2 st no longer comes with a ~3 dB loudness step. The
  remaining shift-dependent level change (PT-5) is a separate issue.
- **NEW, R = 2** (pvocHop = pvocFrameLen/2): the z² terms survive. The gain becomes
  3/2 + ½cos(4πn/N), swinging between 1x and 2x (0 to +6 dB) at the hop rate. That is audible
  amplitude modulation.
- **NEW, minor:** bins 0 and N/2 are doubled too (`X_magn = 2|X|`, lines 219-220). Content below
  the first bin (sr/N, i.e. 62.5 Hz at N = 256 and 16 kHz, including any DC offset) therefore gets
  5/2 (+8 dB) instead of 3/2.

`ola/ola_exact.py` performs this computation with exact fractions for R = 1..64. `ola/pv_gain.cpp`
runs the real `phase_vocoder.cpp` and measures 1.5000 at R = 4 and 8, 2.5000 at DC, and an
instantaneous DC gain in [2.0, 3.0] at R = 2, all as predicted (`results/pv-gain-empirical.txt`).

---
## <a name="ost"></a>3. OST state machine across trials (Lean): FORMAL-8

`lean/Ost.lean` models:
- `OST_TAB::osTrack` (ost.cpp:327-738): the segment lookup, all 15 rule modes, and the maxIOI loop
- `OST_TAB::reset` (97-101)
- `Audapter::reset`'s `stat = 0` (Audapter.cpp:651)
- the per-frame call `stat = ostTab.osTrack(...)` (1797)

Each definition cites the lines it mirrors. The maxIOI loop is modelled both as shipped
(`statOnsetIndices[stat] = frame_counter`) and as fixed (`[j]`).

**Proven (theorem `trial_independent`).** Assume the maxIOI write is fixed and `ostTab.reset()` is
called at trial start. Then the frame-by-frame OST state sequence of a trial is identical to the
one you get from a freshly loaded OST file, no matter how many trials came before and what their
audio was. The theorem holds:
- for every well-formed OST table (stat0 values and maxIOI stat0 >= 0; a load-time validator
  should enforce more, see notes/ost-pcf.md)
- for every sequence of rms / slope / ratio values, including NaN
- for every setting of the per-rule durations

**Also proven, and new:** the onset array does *not* need clearing between trials. With the fix,
onset[0] stays 0 forever, and every place that reads an onset only looks at states entered in
the current trial. That covers ELAPSED_TIME, maxIOI, and the PCF time warp (pcf.cpp:484, used
only when `stat >= ostInitState`). The existing `OST_TAB::reset()` plus `stat = 0` is therefore
enough.

**Each fix alone is not enough.** The counterexamples in `lean/OstCex.lean` are machine-checked
with `decide`:
- *Reset missing (OST-F1).* OST: `0 ELAPSED_TIME → 1 INTENSITY_FALL → 2 OST_END`. After a trial
  with a long utterance, the next trial's offset is never detected. The fresh detection is 5 frames
  after speech ends. A perturbation keyed to state 1 would stay on for the entire next trial.
- *maxIOI `[stat]` bug (OST-F2)*, even with the reset. OST: `0 INTENSITY_RISE_HOLD → 2
  ELAPSED_TIME(5 frames) → 3 END`, with a timeout 0 → 2 after 10 frames. On a silent trial:
  - the timeout fires at frame 11, but the "5 frames later" state comes **1** frame later, not 6;
  - on the next identical trials the timeout fires at frame **22**, then **33**, then later still.
  This is the 0.2 / 0.4 / 0.6 s drift the harness saw.

**How faithful the model is:**
- Control flow and every state update are transcribed branch by branch.
- The onset array is an unbounded function. The C array has 4n entries; out-of-range states are
  the separate bug OST-F7.
- rms values are an abstract type with the C comparisons, so NaN is included.
- Values the C code derives from the fixed frame duration are free per-rule parameters, so the
  proof covers every possible value: minDurN (with each mode's own rounding), the "elapsed frames
  × frameDur > seconds" tests, and nLBDelay.
- The heap word read past `stat0[n]` (OST-F3) is a parameter that must be the same across trials.
  It is irrelevant when the last rule is OST_END.
- Not modelled: the Audapter-side inputs (rms, slope, ratio). The harness found those do not leak
  across trials in default settings.

---
## 4. Formant-field grid lookup `locateF1`/`locateF2` (CBMC): FORMAL-9

This check runs the verbatim function body on IEEE doubles, with all 257 grid values and the
formant arbitrary.
- For **every** grid, sorted or not, the result is either NaN or in [0, 256), so the row index
  `floor(loc)` is 0..255. Unsorted grids give meaningless but memory-safe lookups.
- NaN happens only when:
  - the formant equals two equal neighbouring grid points (0/0), or
  - the formant is NaN, or
  - values are near 1e308.
  NaN then becomes `(int)floor(NaN)` = INT_MIN, an out-of-bounds read (F7).
- Strictly increasing grids never produce NaN.

---
## What was not done, and why
- **Playback-loop wrap (I-01)**: `pbCounter` stays in [0, 480000) trivially (it is decremented by
  maxPBSize after each += downFact). The real bug is semantic: it loops at maxPBSize instead of the
  datapb length. The harness already shows that exactly, so a proof would add nothing.
- **Time-domain shifter scratch buffer (PT-9)**: every index there is taken modulo the buffer
  length, so memory safety is evident. The defect is loudness (summed copies), which needs a
  signal model, not an index proof. Not done, for time.
- **The whole `handleBuffer`** is not model-checked. FFT, LPC and filters in floating point are
  far beyond CBMC. Only the index-carrying statements listed above are checked.
- **Symbolic frameLen**: intractable for the SAT back end (divisions by a symbolic value). It was
  replaced by enumeration, which is complete for the enumerated values.
