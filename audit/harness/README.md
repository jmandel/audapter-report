# Headless Audapter test harness

Runs the **real** Audapter C++ core and the **real** blab MATLAB wrapper code (AudapterIO.m,
getAudapterDefaultParams.m, ...) on Linux with no MATLAB, no Windows and no audio hardware.

How: the MEX is compiled with Octave's `mkoctfile --mex` (Octave implements the MATLAB MEX API)
inside a docker image (`docker/Dockerfile`, tag `audapter-octave`). Windows/MSVC-isms are covered by
`compat/windows.h` (sprintf_s, strcpy_s, fopen_s, __stdcall), an empty `compat/process.h`, and a stub
`compat/audioIO.h` (no devices). Audio is fed through the offline `Audapter('runFrame', ...)` path,
which runs exactly the same `handleBuffer` code as the ASIO callback.

`prep-src.sh` copies the source and applies only portability patches:
- `(sizeof dtype)` -> `(sizeof(dtype))` (MSVC accepts the former)
- `DSPF_dp_blk_move`: memcpy -> memmove (finding H1: overlapping copies; MSVC's memcpy behaves as memmove,
  so this *matches* the shipped Windows binary)

## Builds (`./build-all.sh`)
- `build-oct/`      blab audapter_mex, -O2
- `build-upstream/` shanqing-cai audapter_mex 2.1.5 (for differential testing)
- `build-asan/`     blab with AddressSanitizer + UBSan (run-oct.sh preloads the runtimes)

## Running
- `./run-tests.sh [--rebuild]` — whole suite; prints PASS/FAIL lines and sanitizer summaries. Logs in `logs/`.
- `./run-oct.sh <script.m> [builddir] [matlab-root]` — run one Octave script from `oct/`.
  `SCEN=<name> ./run-oct.sh t_mem.m build-asan` runs one sanitizer scenario.

## Library (oct/)
- `synth_vowel.m`  Klatt cascade vowel synthesizer (static or time-varying formants/F0)
- `est_formants.m` independent LPC formant estimator (to check what the participant would *hear*)
- `est_f0.m`       autocorrelation F0 estimator
- `run_trial.m`    AudapterIO('init') + ost/pcf + reset + runFrame loop + AudapterIO('getData')
- `defparams.m`    blab defaults with a threshold suited to synthetic signals
- `T.m`            PASS/FAIL reporter

## Tests
- `t_track.m`      tracker vs independent LPC on 4 vowels
- `t_repeat.m`     determinism and cross-trial leakage
- `t_inplace.m`    runFrame must not modify its input (H3 — currently FAILS)
- `t_fmt_shift.m`  1D field / 2D field / PCF formant shifts: commanded vs logged vs heard
- `t_ost.m`        OST timing: cross-trial leak, maxIOI, blab AND_RATIO hold (currently FAIL = bugs)
- `t_pitch.m`      pvoc pitch accuracy and loudness continuity (gain step currently FAILS)
- `diff_run.m` + `t_diff.m` blab vs upstream 2.1.5 bit-exact differential over 7 scenarios
- `t_mem.m`        sanitizer scenarios (pcf_short, clamp_short, pert_short, long, pitch)
- `a_*.m`          one-off analyses used during the audit (kept for reproducibility)

Caveats: Octave, not MATLAB (argument passing/copy semantics may differ in corner cases); offline
path only (the ASIO/threaded online path is not exercised); synthetic vowels, not real speech.
