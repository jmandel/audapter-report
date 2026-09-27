# Audapter live-path simulation (audit area "live")

The existing audit harness drives Audapter only through the offline `Audapter('runFrame', ...)`
call, with a stub sound card. Here the **real online path** runs on Linux, with no Windows,
MATLAB or audio hardware:

- the real `mexFunction` (actions `start`, `stop`, `deviceName`, `info`, `getData`, `setParam`, `reset`, `ost`, `pcf`);
- the real `audioIO.cpp` (device enumeration, `startdev`/`stopdev`);
- the real `RtAudio.cpp`, compiled with **its Windows ASIO backend**. It talks through the
  Steinberg ASIO C API to a software-clocked *fake ASIO driver*.

As a cross-check, the same code was also run through RtAudio's **JACK backend** against a
`jackd -d dummy` server.

A native C++ "MATLAB stand-in" calls `mexFunction` through a small fake MEX API. It follows the
call sequences of the lab's own scripts, with `AudapterIO('init', p)` replayed from a trace
recorded by the real `AudapterIO.m`.

All paths are relative to `audit/live/`. Blab line numbers are at
`blab-lab/audapter_mex@169cadf`.

## Summary for the lab

1. **If you run Audapter the default way, the live path does what the offline path does.** The
   default way is `reset` → `start` → pause → `stop` → `getData` for each trial, with nothing
   changed while audio runs.
   - Given the same input, the live recording (`signalIn`, `signalOut`, formants, OST state, pitch
     data) is **bit-identical** to offline `runFrame`. This held for passthrough, PCF formant
     shift, phase-vocoder pitch shift and time-domain pitch shift, through both the ASIO and JACK
     backends.
   - What the participant hears is the offline output delayed by exactly 2 device buffers. This
     comes on top of Audapter's own `nDelay`.
   - ThreadSanitizer found no race in 300 start/stop cycles, apart from a benign one inside
     RtAudio.
2. **Changing anything while audio runs is unsafe.** This is what `ALWAYS_ON 1` in
   `runExperiment`/`UIRecorder` does, and what any script that calls `setParam`, `reset`, `ost`,
   `pcf` or `getData` between `start` and `stop` does. There is no lock between MATLAB and the
   audio callback: ThreadSanitizer reports **195 distinct racing code-site pairs**. Consequences
   we reproduced:
   - **Loading an OST or PCF file while audio runs crashes the process** (NULL pointer in the audio
     thread). Measured rate: roughly 1 crash per 200–1400 reloads, depending on timing
     ([LIVE-1](#live-1)). In MATLAB this kills the session. `ALWAYS_ON` experiments reload both
     files every trial.
   - **Several setParams rebuild DSP objects while the callback is using them**, which is a
     heap use-after-free ([LIVE-2](#live-2)). Examples:
     - `pitchShiftRatio`, which `AudapterIO('init')` always sets, rebuilds the time-domain pitch shifter;
     - `fn1`/`fn2`/`nLPC` rebuild the formant tracker;
     - `pvocFrameLen` and every PCF load rebuild the phase vocoders.
   - **`reset` while audio runs can send a loud burst to the headphones** ([LIVE-3](#live-3)).
     About 1 in 200 to 1 in 2000 resets during voicing produced a 2–8 ms burst **17–72 dB above
     the loudest normal output sample**, clipped at DAC full scale. The race also occasionally
     corrupts the logged frame clock of the new trial.
3. **Several live-only failures are silent or nearly so:**
   - `start` does not report a device that failed to open, for example because of the wrong
     sample rate or a busy driver ([LIVE-4](#live-4));
   - with **no ASIO driver installed, the very first Audapter call crashes**, even for offline
     processing ([LIVE-5](#live-5));
   - an ASIO buffer size other than `frameLen*downFact` plays **garbled, unprocessed, uncalibrated
     microphone sound** to the participant ([LIVE-6](#live-6), the live consequence of I-11);
   - **missed callbacks (xruns) are neither detected nor logged**, and they silently shift the
     logged time axis ([LIVE-7](#live-7)).
4. **Per-callback cost is small:**
   - median 28–114 µs and worst case ≤ 0.7 ms, against a 2 ms (96-sample) or 4 ms (192-sample) budget;
   - `reset` takes about 12 ms and `getData` about 3 ms on the MATLAB thread, but neither blocks audio;
   - xruns appeared only when the audio thread was not real-time and the CPU was oversubscribed.

## How faithful is this to Windows + ASIO?

| Layer | Here | Faithful? |
|---|---|---|
| Audapter DSP + `mexLibrary.cpp` | real source, GCC -O2 (portability patches from `harness/prep-src.sh` only) | yes (GCC not MSVC: UB such as NaN→int or OOB reads may differ) |
| MEX API | `src/fakemex`. `mexErrMsgTxt` throws; `plhs` has exactly `max(nlhs,1)` slots plus guard slots that detect writes past the end | behaviour-equivalent for the calls Audapter makes. Not MATLAB's memory manager or copy-on-write |
| `audioIO.cpp` | real, unmodified | yes |
| RtAudio | real `RtAudio.cpp` 3.0.3 compiled with `__WINDOWS_ASIO__` (as in `audioIO.vcxproj`). Covers device probing, sample-rate check, buffer-size negotiation (min/max/pref/granularity), sample-format conversion, de-interleave, callback ordering, `stream_.mutex` locking | yes. Win32 `CRITICAL_SECTION` is emulated by a *recursive* pthread mutex (same semantics); COM init is a no-op |
| ASIO driver | `src/fakeasio` implements the ASIO host C API (`ASIOInit`, `ASIOCreateBuffers`, `ASIOStart`, …) and the driver list. One driver thread calls `bufferSwitch(i)` at period boundaries on a double buffer. Configurable: names, buffer min/max/pref/granularity, sample type (Int16/Int24/Int32/Float32/Float64), rates, real-time priority, synchronous stop | **modelled, not real**. Real drivers differ in thread priority, what they play on an overrun (we repeat the last buffer), DPC/USB jitter, and whether `ASIOStop` waits for the callback. The Steinberg COM loader (`asiolist.cpp`, registry) is not exercised |
| Thread scheduling | Linux CFS; optional `SCHED_FIFO` for the driver thread (as ASIO drivers use time-critical threads) | qualitative only. Race *rates* depend on the scheduler, CPU count and MATLAB's per-call overhead (MATLAB adds roughly 10–50 µs per MEX call, which widens the windows) |
| JACK cross-check | real `RtApiJack` + `jackd -d dummy` + an in-process JACK client that plays the mic and records the headphones | real server and real client thread. But the dummy driver *stretches its clock* under load instead of dropping audio, so it is **not** a faithful xrun model (see LIVE-7) |

**Not exercised:** DirectSound; the real Steinberg `asio.cpp`/`asiolist.cpp` COM path; MSVC code
generation; MATLAB's own threads. A further step would give the COM/driver-loading path and
MSVC-built binaries under a real Windows loader: build the MEX for Windows with `clang-cl` and
the `xwin` SDK (or MSVC in a Windows VM), then run it under Wine with `wineasio` (ASIO → JACK)
and a tiny MEX host. That is a much larger effort, and it would still not be MATLAB.

## How to run

```
./run.sh                 # everything (≈ 25 min; the 'crash' step alone ≈ 10 min)
./run.sh build inputs    # docker image audapter-live, 4 binaries, stimuli + AudapterIO traces
./run.sh equiv tsan uaf burst ...   # individual steps; results in results/<step>.txt
```

| Script | Purpose |
|---|---|
| `build.sh` | builds `build/{asio,asio-tsan,asio-asan,jack}/live_driver` inside the `audapter-live` image (`docker/Dockerfile` = audapter-octave + jackd2 + matplotlib) |
| `mkinputs.sh` | runs `oct/mk_inputs.m` in Octave. It synthesizes stimuli (harness `synth_vowel.m`) and records the `setParam` sequence of the **real `AudapterIO('init', p)`** through a logging `oct/Audapter.m`, giving `work/in/trace_*.txt`. The configurations are: blab defaults (`base`); 1-D-field F1 +20 % (`f1up`); pvoc +2 st (`pvoc2st`); time-domain +1 st as in `time_domain_shift_demo.m` (`td1st`); and trialLen 1.6 s with a 50 ms ramp (`ramp`) |
| `live_driver <scenario>` (`src/driver/live_driver.cpp`) | the scenarios below |
| `analysis/*.py` | comparisons and statistics. `tsan_summary.py` reduces TSan logs to (main-thread site ↔ audio-thread site) pairs |

The `live_driver` scenarios are:
- `offline`: the reference path, `runFrame`, with optional input lead and quantisation;
- `live`: one default-flow trial;
- `alwayson`: the `runExperiment`/`UIRecorder` ALWAYS_ON sequence;
- `hammer`: repeats one MATLAB-side operation while audio runs;
- `resetcheck`;
- `startstop`;
- `info`.

Fake-driver knobs (environment variables): `FAKEASIO_DRIVERS`, `FAKEASIO_BUF=min,max,pref,gran`,
`FAKEASIO_FMT`, `FAKEASIO_RATES`, `FAKEASIO_RT`, `FAKEASIO_RTPRIO`, `FAKEASIO_XRUN`,
`FAKEASIO_STOPJOIN`.

## Findings

<a id="live-1"></a>
### LIVE-1. Loading an OST or PCF file while audio runs crashes the audio thread (NULL dereference)
- Severity: **high** (crashes MATLAB mid-session; hits every `ALWAYS_ON 1` experiment and any script that loads files between `start` and `stop`). Origin: upstream. Status: [D] reproduced.
- Location, PCF: `PERT_CFG::readFromFile` frees `pitchShift`/`intShift` and sets them to NULL at pcf.cpp:333-340. `n` still holds the old state count until pcf.cpp:421, and the arrays are re-`calloc`ed at pcf.cpp:423-434. Meanwhile the callback reads `pertCfg.pitchShift[stat]` whenever `pertCfg.n > 0` (Audapter.cpp:1970-1973), which is **every frame**.
- Location, OST: `OST_TAB::readFromFile` frees `stat0`/`mode`/`prm*`/`statOnsetIndices` and sets them to NULL at ost.cpp:139-178, then re-allocates them at ost.cpp:206-264. `osTrack` dereferences `stat0` every frame (ost.cpp:360-361).
- Also: `fmtPertAmp`/`fmtPertPhi` are not freed before the new `calloc`, so the old arrays leak, and for a few µs the callback sees zeros or the new `n` with the old arrays.
- Evidence:
  - `./run.sh crash` (plain -O2 build, reloads repeated while a looped vowel plays):
    - PCF: 10 crashes in ≈ 6 600 reloads;
    - OST: 13 crashes in ≈ 3 000 reloads.
    - Individual runs crashed after 1 to 1 842 reloads. The rate depends on how often the MATLAB thread is preempted inside the free→calloc window.
  - ASan: `SEGV on unknown address 0x0 … Audapter::handleBuffer Audapter.cpp:1972` ← `RtApiAsio::callbackEvent`.
  - TSan: `SEGV … ost.cpp:361`.
  - `runExperiment.m` (ALWAYS_ON) calls `AudapterIO('ost')` and `AudapterIO('pcf')` per trial at lines 851/859, after `Audapter(1)` at 646. At the pooled rates a 300-trial session has a substantial chance of crashing.
  - With a pitch-shift PCF there is a second path: `readPertCfg` always runs `pVocs.clear()` and rebuilds the vocoders (Audapter.cpp:3205). ASan shows `heap-use-after-free … PhaseVocoder::getMode` from `handleBuffer` Audapter.cpp:2030.
- Fix: parse into temporaries and swap them in under a lock that the callback also takes. Or refuse `ost`/`pcf` while started (`mexErrMsgTxt("stop audio first")`).

<a id="live-2"></a>
### LIVE-2. setParams that rebuild DSP objects are a use-after-free while audio runs
- Severity: **high** (heap corruption or crash; silent garbage is possible). Origin: upstream. Status: [D] ASan.
- Location: `setGetParam` rebuilds objects at Audapter.cpp:1407-1455:
  - `fmtTracker.reset(new …)`: triggered by `fn1`, `fn2`, `nlpc`, `ntracks`, `afact`, `bfact`, `gfact`, `bcepslift`, `cepswinwidth`, `srate`, `btimedomainshift` and the pitch bounds;
  - `pVocs.clear()`: triggered by `pvocframelen`, `pvochop`, `nfb`, `framelen`, `srate`;
  - `timeDomainShifter.reset(new …)`: triggered by **`pitchshiftratio` unconditionally**, and by the time-domain schedule and algorithm.

  These run on the MATLAB thread while the callback is inside `procFrame`/`processFrame`.
- Evidence (`./run.sh uaf`, the setParam repeated while audio runs), with ASan:
  - `heap-use-after-free` in `TimeDomainShifter::genShiftedPitchCycle` (time_domain_shifter.cpp:301/316) after `setParam('pitchshiftratio')`;
  - `LPFormantTracker::hqr_roots` (lpc_formant.cpp:491/574) after `fn1` toggles;
  - `PhaseVocoder::getMode` (phase_vocoder.cpp:542) after `pvocframelen` toggles.
  - The plain build segfaulted for the tracker and pvoc cases.
  - `AudapterIO('init', p)` always sets `pitchshiftratio`, so every ALWAYS_ON trial rebuilds the time-domain shifter. That is a UAF risk whenever `bTimeDomainShift = 1`, and even without the race it restarts the shift schedule.
- Fix: as for LIVE-1 (a lock, or refuse these while started). Build the new object off-thread and swap the pointer atomically under the lock.

<a id="live-3"></a>
### LIVE-3. `reset`, `setParam` and `getData` race the callback; `reset` during voicing can emit a full-scale burst
- Severity: **medium-high** (a loud, possibly uncomfortable burst in the headphones, and rare silent logging corruption). ALWAYS_ON only: `UIRecorder.m:1091` calls `AudapterIO('reset')` while running. Origin: upstream. Status: [D].
- What: `Audapter::reset` (Audapter.cpp:522-680) zeroes the resampling-filter states (537-538: `downSampFilter/upSampFilter.reset()`) and every other DSP buffer while `handleBuffer` may be in the middle of `IIR_Filter::filter` (filter.h:56-64).
  - The resampling IIRs are high-order, with coefficients up to about ±36, so their internal states are large and normally cancel. Zeroing part of the state mid-frame destroys that cancellation.
  - `frame_counter` and `data_counter` are zeroed *last* (609/611). A callback that is between `data_counter++` (2181) and `frame_counter++` (2304) at that moment leaves the new trial with its frame clock offset.
- Evidence, `./run.sh burst` (reset every 50 ms while a vowel with an active F1 shift plays; float64 device so true peaks are visible):
  - bursts 2–8 ms long, peaking at **+17 dB and +72 dB** (1.2× and 728× digital full scale) re the loudest normal output sample;
  - rate: 1 in 968 and 1 in 1 945 resets;
  - an int32 run had one clipped full-scale burst in 162 resets.
  - See `results/reset_race_burst.png` / `.wav` (clipped as a DAC would play it).
  - Control: the same resets done race-free, between offline `runFrame` calls, produce no burst (max |out| 0.171 = normal).
- Evidence, `./run.sh resetcheck` (1 000 always-on trial starts): 1–2 trials per 1 000 started with a corrupted frame clock. Either `data.intervals(1) = 33` (all data rows shifted one frame, 2 ms, against the signals) or a zeroed first row.
- Evidence, TSan (`results/tsan.txt`): 356 reports and 195 unique site pairs.
  - The top groups are `reset` ↔ `handleBuffer`, filters, formant tracker, `getDFmt` and RMS.
  - `setGetParam` (e.g. the array copy at Audapter.cpp:1212-1232 and `setCoeff`) ↔ `handleBuffer`, `locateF1`/`locateF2`, `calcRMS_fb`.
  - `getData` (mexLibrary.cpp:311-330) ↔ recorder writes.
- Torn parameter arrays (e.g. `pertAmp` half copied) are real races, but the callback reads only 2 adjacent field points per frame, so the audible effect is at most one 2 ms frame. We judged this negligible and did not try to demonstrate it.
- Fix: one mutex around every MEX action that touches `Audapter` state. The callback `try_lock`s it and, if the lock is busy, outputs the previous frame or silence. Alternatively make `reset` et al. set a flag that the callback acts on at a frame boundary.

<a id="live-4"></a>
### LIVE-4. `Audapter('start')` hides device-open failures
- Severity: **medium** (silent at start; the trial runs with no feedback and no recording). Origin: upstream. Status: [D].
- Location: mexLibrary.cpp:233 ignores `audio_obj.startdev()`'s return value, and :238 sets `started = 1` anyway. The same pattern is at :450/455, :476/481 and :504/509. `audioIO::startdev` catches the `RtError` and only calls `printMessage()`, which writes to stdout/stderr. That output is not the MATLAB command window on Windows.
- Evidence, `./run.sh startfail`:
  - an ASIO driver without 48 kHz: `start` returns normally, 0 callbacks run, and `getData` returns 1×1 (then writes `plhs[2]` out of bounds, I-11);
  - identical with a JACK server at 44.1 kHz;
  - a driver whose native format is Int24 (unsupported by RtAudio 3.0.3) is rejected at probe time with the misleading error "Cannot find device with specified name".
- Related: the default `deviceName` is `"MOTU MicroBook"` (Audapter.cpp:253). Any other interface needs `Audapter('deviceName', …)`.
- Fix: `if (audio_obj.startdev()) mexErrMsgTxt(...)`, and set `started` only on success.

<a id="live-5"></a>
### LIVE-5. With no ASIO driver installed, the first Audapter call of any kind crashes
- Severity: **medium** (crash; this hits offline reprocessing on analysis machines). Origin: upstream. Status: [D] ASan.
- Location: audioIO.cpp:19-27. `new RtAudio()` throws "no devices found", the exception is caught and printed, and then `audio->getDeviceCount()` is called on NULL. The `static audioIO audio_obj` in mexFunction (mexLibrary.cpp:85) is constructed on the first call, even for `setParam`/`runFrame`.
- Evidence: `./run.sh noasio` gives `SEGV … RtAudio::getDeviceCount() ← audioIO::audioIO() audioIO.cpp:27 ← mexFunction mexLibrary.cpp:85`, during `AudapterIO('init')`'s first `setParam`.
- Fix: check `audio` for NULL and leave `devices` empty.

<a id="live-6"></a>
### LIVE-6. Buffer-size mismatch (I-11), live: the participant hears raw microphone sound, garbled and uncalibrated
- Severity: **medium**. The data side fails loudly: `getData` returns 1×1, AudapterIO errors, and `plhs[2]` is written out of bounds. The audio side is confusing for the participant. Origin: upstream. Status: [D], on both the ASIO and JACK backends.
- Negotiation: RtAudio's ASIO code takes the driver's *preferred* size whenever the driver reports granularity −1 (RtAudio.cpp:5174-5186), so the control-panel setting must equal `frameLen*downFact` exactly (96 by default, 192 for the time-domain demo). `audioIO::startdev` never compares the negotiated `buffer_size` with `algosize` (audioIO.cpp:94).
- Mechanism: `handleBuffer` returns immediately (Audapter.cpp:1667). The user buffer then still holds the mono input copied in by RtAudio *after* the previous callback, and RtAudio plays that buffer as interleaved stereo.
- What is heard: in every buffer, the **first half is the mic signal decimated by 2** (double speed, one octave up, aliased) and the **second half is silence**, with no Audapter gain or `dScale`. The fake-ASIO output matches this model to −76 dB (`results/mismatch.txt`).
- Fix: after opening, `if (buffer_size != algosize) { stopdev(1); error }`.

<a id="live-7"></a>
### LIVE-7. Missed callbacks (xruns) are invisible: the recording is silently spliced and the logged time axis drifts
- Severity: **low-medium**. It matters when data are aligned to external clocks such as EEG/MEG/fMRI triggers or `stereoMode 2` TTL. Origin: upstream. Status: [D].
- What: the frames Audapter logs are consecutive callbacks. The code has no sample-position check (`ASIOGetSamplePosition`/`bufferSwitchTimeInfo`) and no per-frame timestamp. When the driver drops periods:
  - the recorded `signalIn` is spliced with no marker;
  - `data.intervals` and every event time (OST onsets, perturbation onsets) run behind wall-clock time;
  - RtAudio's own xrun message goes to stderr (JACK) or nowhere (ASIO).
- Evidence (`./run.sh timing`), with one CPU shared with 3 busy processes and the driver thread at normal priority:
  - 109 of 5 152 periods were never processed;
  - the logged time axis ended **218 ms behind** hardware time;
  - an OST onset was logged at 0.314 s while it happened at 0.328 s.
  - With `SCHED_FIFO` (as ASIO driver threads run) and the same load there were 0 xruns.
  - Callback cost itself is far below budget:

    | Configuration | Median | p99 | Max | Budget |
    |---|---|---|---|---|
    | base | 28 µs | 75 µs | 0.10 ms | 2 ms |
    | F1 shift | 31 µs | 77 µs | 0.66 ms | 2 ms |
    | pvoc | 44 µs | 121 µs | 0.15 ms | 2 ms |
    | time-domain | 114 µs | 234 µs | 0.40 ms | 4 ms |

  - So on a real rig, xruns come from driver/DPC/USB latency rather than from Audapter.
  - The JACK dummy server under the same load logged 3 084 xruns but stretched its clock (13.7 s wall time for 10.3 s of audio) instead of dropping audio.
- Fix: log a per-frame timestamp (QueryPerformanceCounter, or the ASIO sample position) as an extra data column, and count xruns.

<a id="live-8"></a>
### LIVE-8. Live onset/offset ramps are computed on the interleaved stereo index
- Severity: low. It is audible only if speech overlaps the first or last `rampLen` of a trial with `trialLen > 0` (UIRecorder sets `trialLen`). Origin: upstream. Status: [D].
- Location: Audapter.cpp:2292-2301. The gain is computed as `((frame_counter-1)*frame_size + n)/(sr*downFact)/rampLen`, with `n` running over `frame_size*2` interleaved samples. Online, the ramp therefore advances twice as fast within each frame and jumps back at the frame boundary.
- Evidence: `./run.sh ramp`, `results/live_ramp_gain.png`.
  - Live, the gain is a 500 Hz sawtooth of ±0.04 (= 2 ms/`rampLen`) around the offline ramp.
  - It ends at −0.04, a sign flip, in the last millisecond.
  - Offline, the first frame's gain is negative, because the formula uses `frame_counter-1`.
- Fix: use `n / nMult` and `frame_counter` in the formula.

<a id="live-9"></a>
### LIVE-9 (negative). Live and offline processing agree bit-for-bit; latency is exactly two device buffers
- `./run.sh equiv`: for `base`, `f1up` (+OST/PCF), `pvoc2st` (+PCF) and `td1st`, the fake-ASIO Int32 run gives `signalIn`, `signalOut`, `rms`, `fmts`, `sfmts`, `ost_stat` and `pitchShiftRatio` **identical** to offline `runFrame`. The same holds for `base` over JACK with float32 ports. Two adjustments make the offline run comparable:
  1. prepend one buffer of zeros (two for JACK);
  2. quantize the offline input like the device path.
- Why the extra buffer: RtAudio calls the user callback *before* copying in the new input. The first callback therefore processes zeros, and callback *k* processes the input of period *k−1*.
- What the participant hears equals the offline output delayed by one more period, to within int32 quantisation (5e-10).
- The only differing data columns are the unexposed LPC-coefficient columns. They hold **uninitialised heap memory** (`lpcAi` from `new dtype[]`, lpc_formant.cpp:168) until the first voiced frame. This is visible offline too, so it is not a live issue (it was already logged as WASM-1).

<a id="live-10"></a>
### LIVE-10 (negative / low). The default start/stop-per-trial flow is race-free
- TSan over 300 start/stop cycles and 3 000 plain start/stop cycles found no hang. The only report is inside RtAudio (RtAudio.cpp:5476-5485): `startStream` sets `state = RUNNING` *after* `ASIOStart`, so the first callback can return early and one period is lost at the trial start. That is benign.
- `getData` after `stop` is properly ordered, because `ASIOStop` joins the driver thread and `jack_deactivate` does the equivalent.
- A theoretical stop deadlock (`stopStream` holds the mutex while a synchronous `ASIOStop` waits for a callback blocked on the same mutex) needs a window of a few instructions. It was not observed.

## Proposed harness changes (not applied)
- Add `live/run.sh equiv tsan uaf` to `harness/run-tests.sh`, or to a CI job. `equiv` fails if live ≠ offline. `tsan`/`uaf` should become regression tests once a lock or "refuse while started" fix lands: expect 0 reports.
- Replace `harness/compat/audioIO.h` (the stub) with the real `audioIO.cpp` + RtAudio + `src/fakeasio` for a "live smoke" build. `src/fakemex` plus a native driver also gives a much faster and TSan-able alternative to Octave for concurrency tests.
- The harness README caveat "offline path only" can point here.

## Files
- `src/fakemex/`: fake MEX API.
- `src/compat/`: Win32 shims for the RtAudio ASIO build.
- `src/fakeasio/`: fake ASIO driver, replacement `asiosys.h`/`asiodrivers.h`. The real Steinberg `asio.h` is copied at build time.
- `src/driver/`: `live_driver.cpp`, `wavio.h`.
- `oct/`: stimulus and trace generation (logging `Audapter.m`, `mk_inputs.m`).
- `analysis/`: comparisons, TSan summariser, crash-rate and burst tools.
- `results/`: text outputs of each step, figures, the burst WAV.
- `work/`: generated inputs and raw run data (disposable, about 400 MB).
