# Audapter in the browser: WebAssembly port (research prototype)

The **real** blab-lab Audapter C++ core (TransShiftMex @ 169cadf) compiles with Emscripten and runs in node, Web Workers,
the browser main thread and an **AudioWorklet** on live microphone input. The MEX layer is replaced by a thin C API.
The build reproduces the native core bit for bit when both use the same libm. The core uses about 2 % of the real-time budget. For
experiments the limit is browser and OS audio latency, not compute.

Everything here was measured on an AMD Ryzen 5 3600 running Linux, with Chromium 150 (system `/usr/bin/chromium`), node 26 and Emscripten 6.0.10.

## Contents

| path | what |
|---|---|
| `build.sh` | Emscripten build in docker (`emscripten/emsdk`). Variants `full`, `lite`, `patched`, `patched-full` |
| `src/audapter_c.cpp`, `compat/mex.h` | C API; stub mex.h (`mexErrMsgTxt` throws, and the API returns -1 plus `aud_last_error()`) |
| `patches/build/size-flags.patch` | compile-time buffer-size macros (the defaults are the shipped values) |
| `patches/fixes/0[1-3]-*.patch` | fixes for OST-F1, OST-F2, I-01 (only in the `patched` builds) |
| `web/audapter-api.mjs` | JS API (the per-frame API and the batch API) |
| `web/audapter.mjs`, `web/audapter-defaults.mjs` | ES-module entry; blab defaults recorded from MATLAB `AudapterIO('init')` |
| `dist/audapter-<v>.{mjs,wasm}` | ES-module builds (node, worklet) |
| `lib/audapter-<v>.js` | single-file classic-script bundles (wasm inlined, work from `file://`) for embedding in the report |
| `web/index.html` (+`demo.mjs`, `worklet.mjs`) | live mic demo |
| `web/bench.html`, `web/server.mjs` | benchmark page; static server with COOP/COEP |
| `examples/embed.html` | minimal embedding example: buggy vs patched, from `file://` |
| `export.sh`, `octshim/`, `../harness/oct/wasm_export.m` | native reference export: Octave MEX plus a recording shim |
| `native/` | native replay driver (glibc and musl) used to explain the WASM-vs-MEX differences |
| `test/*.mjs` | `equiv`, `cmpdirs`, `bench`, `latency`, `browser` (Playwright), `patches`, `embed-file` |

Rebuild and retest:

```sh
wasm/export.sh                      # native reference runs -> wasm/testdata (docker audapter-octave)
wasm/build.sh                       # full lite patched  -> dist/ and lib/
node wasm/test/equiv.mjs full       # WASM vs Octave MEX
wasm/native/build-run.sh            # native glibc and musl replays -> scratch/wasm/native-*
node wasm/test/cmpdirs.mjs scratch/wasm/wasm-full scratch/wasm/native-musl
node wasm/test/patches.mjs          # buggy vs patched
node wasm/test/browser.mjs          # headless Chromium + fake mic (needs playwright-core in scratch/wasm)
node wasm/test/embed-file.mjs       # examples/embed.html from file://
node wasm/test/bench.mjs full 30; node wasm/test/latency.mjs
```

## 1. Build

- **Source changes** come in two kinds. The first kind are portability edits only:
  - `harness/prep-src.sh`: `sizeof dtype` and memcpy→memmove, the same as the native harness.
  - A sed that removes the extra `Audapter::` qualification inside the class body, which clang rejects (**WASM-4**).
  - `-fpermissive` and the harness `compat/windows.h`.

  The second kind are the build-only patch `patches/build/size-flags.patch` and, for the patched variants only, `patches/fixes/`. Neither `mexLibrary.cpp` nor any audio I/O code is compiled.
- **C API** (`src/audapter_c.cpp`):
  - `aud_create` and `aud_reset`.
  - `aud_set_param(name, double*, n)`: same semantics as `Audapter(3, name, value)`, including the array-length behaviour of I-08.
  - `aud_get_param`.
  - `aud_load_ost(text)` and `aud_load_pcf(text)`: the text is written to MEMFS and then `readOSTTab`/`readPertCfg` read it; `''` clears the table.
  - `aud_process(in, out, n)`: identical to `Audapter('runFrame')`, i.e. `audapterCallback` in offline mode.
  - `aud_process_block`.
  - `aud_get_signal` and `aud_get_data`: the Audapter(4) layout.
  - `aud_get_latest`: the newest data row, for live displays.
  - `aud_variant` and `aud_patches`.

  C++ exceptions use `-fwasm-exceptions`.
- **Size**:

  | artifact | size | gzip -9 |
  |---|---|---|
  | `.wasm` | 282 KB | 113 KB |
  | single-file `lib/audapter-<v>.js` | 392 KB | 142 KB |
  | `.mjs` glue | 66 KB | |

- **Memory: the static Audapter object.** `sizeof(Audapter)` is 266,479,184 B with the shipped sizes. Most of that is `data_recorder`, 45×480000 doubles = 173 MB. The five 1.73-M-sample delay buffers add 69 MB. The full build fits easily in wasm32 memory: the wasm heap is **307 MB** after `create`, the maximum is set to 2 GB, and growth is allowed.
  - `lite` (recorders 10 s instead of 30 s, via `-DAUDAPTER_MAX_REC_SIZE=160000 -DAUDAPTER_MAX_DATA_SIZE=160000`): `sizeof` 141,039,184 B, heap **163 MB**.
  - The DSP is unchanged: lite output equals full output bit for bit on every scenario.
  - Playback, tone and delay buffers keep their shipped sizes on purpose, so buffer-size findings (I-01 loop point, H2 wrap cadence) behave exactly as shipped. Only I-03 (the recorder wraps at 30 s) moves to 10 s in lite; use `full` or `patched-full` to demonstrate I-03.
  - `AUDAPTER_MAX_DELAY_FRAMES` exists but is not used: shrinking it changes how often H2 glitches.
  - The whole object is dirty memory, because `reset()` zeroes all of it. That takes 11-18 ms in the full build and 6 ms in lite (I-10). `create()` takes about 150 ms.

## 2. Equivalence with the native Octave build

`harness/oct/wasm_export.m` runs each scenario in a fresh Octave process through a shim (`octshim/Audapter.m`). The shim forwards every call to the real MEX and logs the exact command stream: every `setParam` that `AudapterIO('init')` issues, OST/PCF text, `reset`, and each command's frame index. It also logs every input frame, every device-rate output frame and the `Audapter(4)` matrices. `test/equiv.mjs` replays that stream into a fresh WASM instance.

The six scenarios, each on a synthetic /a/ at 48 kHz:
- `passthru`: blab female defaults, tracking on.
- `fmtshift`: 1-D ratio field, F1 +20 %.
- `fmtshift2d`: 257×257 field, F2 +20 %.
- `pcf`: OST + PCF F1 +20 %.
- `pvoc`: +2 semitones.
- `tdshift`: time-domain shifter with a schedule, frameLen 64.

| comparison | audio out (48 kHz) | signalIn/Out | data matrix |
|---|---|---|---|
| WASM vs **native musl** g++ (same C API) | **bit-exact, 6/6** | bit-exact | bit-exact* |
| native glibc g++ vs **Octave MEX** | bit-exact, 6/6 | bit-exact | bit-exact* |
| WASM vs Octave MEX | bit-exact for passthru and tdshift; otherwise max \|Δ\| 2.9e-11 (relative 1.8e-10, about -195 dB) | same | formant tracks max \|Δ\| 1.3e-7 Hz |
| lite vs full, patched vs lite | bit-exact | bit-exact | bit-exact* |

\* Excluding the LPC-coefficient columns before the first voiced frame. Those contain **uninitialised heap memory** in every build, with values such as 8.5e+247 (**WASM-1**, new finding, low).

So the only difference is **libm**. Emscripten uses musl's `sin/cos/atan2/exp/log`; the MEX links glibc's. Both compilers produce IEEE-identical arithmetic here: there is no FMA contraction on x86-64 without `-march`, and wasm has no FMA. No undefined-behaviour-dependent or compiler-dependent divergence appeared. The Windows MSVC binary will differ from both at a similar ~1e-10 level, so bit-exact cross-platform regression tests need a tolerance or a pinned libm.

Two caveats on exactness:
- **Function statics.** `handleBuffer` has function-static locals (formant F5). Only a fresh wasm *instance* reproduces a fresh MEX. `aud_create` does not reset those statics.
- **Browser I/O is float32.** Rounding the output to float32 (about 6e-8 relative) is a larger change than the libm differences.

## 3. Real-time feasibility

**Per-frame compute cost.** The frame budget is 96 samples at 48 kHz = 2.00 ms (tdshift: 192 samples = 4 ms). Figures are µs per frame, mean / p99, over 30 s of audio.

| config | native g++ -O2 | WASM, node 26 | WASM, Chromium 150 main thread† | WASM in AudioWorklet‡ |
|---|---|---|---|---|
| passthru (formant tracking) | 27 / 46 | 31 / 65 | 32 / 85 | ~60 |
| 1-D formant shift | 25 / 39 | 29 / 44 | 31 / 50 | ~60 |
| 2-D formant shift | – | 29 / 44 | 31 / 50 | – |
| pvoc pitch shift | 34 / 55 | 40 / 74 | 42 / 80 | – |
| time-domain shift (4 ms frame) | 92 / 117 | 112 / 169 | 117 / 180 | – |

- **Load and overruns.** The load is 1.5-3 % of real time. No frame exceeded its budget in 30 s. The worst single frames were 0.2-1.2 ms, from JIT tier-up and GC in the host.
- **Relative speed.** WASM runs at about 1.15× native.
- **Timer footnotes.**
  - † The page is cross-origin isolated (COOP/COEP), so the timer resolution is 5 µs.
  - ‡ AudioWorkletGlobalScope has **no `performance.now()`** ([WebAudio #2413](https://github.com/WebAudio/web-audio-api/issues/2413), open since 2020), so this figure is a mean of 1 ms `Date.now()` ticks. It includes the float32 conversion, the per-frame data-row read and the recording copies.

**Render quantum vs Audapter frame.**
- The AudioWorklet delivers 128-sample quanta; Audapter needs 96-sample frames.
- The worklet keeps an input FIFO and an output FIFO. The output FIFO is pre-filled with `frame − gcd(frame, 128)` = **64 samples (1.33 ms at 48 kHz)**. That is the minimum that can never underrun, because the output deficit cycles through 0, 32, 64 over lcm = 384 samples. Measured: 0 underruns in every run.
- Chrome 153 ships a configurable render quantum (`renderSizeHint`, [Intent to Ship](http://www.mail-archive.com/blog-dev@chromium.org/msg17051.html); [spec](https://webaudio.github.io/web-audio-api/)). A quantum of 96, or of 32 with frameLen 32 at 16 kHz, would remove the 1.33 ms.

**Sample rates.**
- Audapter's `downFact` = 3 and its fixed 21-tap resampling IIR assume a device rate of 48 kHz (sr 16 kHz).
- The demo therefore forces `new AudioContext({sampleRate: 48000})`, and the browser resamples a 44.1 kHz device. The spec says the browser "MUST resample" and notes that this can add latency.
- In the headless test, Chromium's fake capture device ran at **44.1 kHz** and the captured signal still matched the WAV (cross-correlation 0.9998).
- Running Audapter natively at 44.1 kHz (sr 14.7 kHz) is possible in principle, since the formant parameters are in Hz, but it is untested and not validated.

**Latency budget, mic → ear.**

| stage | measured / cited |
|---|---|
| Audapter algorithmic, blab defaults (nDelay 5, frameLen 32) | **8.2 ms**, from impulse and cross-correlation (`test/latency.mjs`) |
| Audapter with pvoc on (pvocFrameLen 256) | **24.2 ms** |
| worklet re-blocking FIFO | 1.33 ms |
| Chromium `baseLatency` on this Linux host | 2.67 ms (`latencyHint: 0`), 11.6 ms (`interactive`), 21.3 ms (`playback`) |
| Chromium `outputLatency` on this host (PipeWire) | reported 136-192 ms; unreliable ([Kaufman 2021](https://www.jefftk.com/p/browser-audio-latency)) |
| browser round trip, published, processing off | macOS optimised: Firefox 14 ms, Chrome 19-41 ms ([Kaufman 2020](https://www.jefftk.com/p/audioworklet-latency-firefox-vs-chrome)). Defaults, WAC 2025 ([weblatencytest](https://github.com/gilpanal/weblatencytest), [data](https://doi.org/10.5281/zenodo.17642262)): Ubuntu Chrome 64.5±7.9, Firefox 65.7; Windows Chrome 62.8, Edge 60.8, Firefox 104.7; macOS Chrome 52.3, Firefox 38.9, Safari 100.0 ms |
| native Audapter baseline | 19.3-38.6 ms total depending on interface; 11.4 ms with nDelay 3 on RME ([Kim, Wang & Max 2020, JSLHR](https://pmc.ncbi.nlm.nih.gov/articles/PMC7872729/)) |

**Totals.**
- Formant perturbation in a browser totals about **24-30 ms** in the best case (tuned macOS, wired headphones). Typical defaults give **60-115 ms**, and pvoc adds 16 ms more.
- Compensation to formant perturbation falls roughly linearly with feedback delay: about 90 % less adaptation at 100 ms ([Mitsuya, Munhall & Purcell 2017](https://pubmed.ncbi.nlm.nih.gov/28464659)) and none at ≥100 ms ([Max & Maffett 2015](https://pubmed.ncbi.nlm.nih.gov/25676810/)).
- Delays of about 25 to 50 ms already change speech rate and fluency ([Stuart et al. 2002](https://pubmed.ncbi.nlm.nih.gov/12051443/)).
- Bluetooth output adds a large further delay and must be excluded (not measured here).
- Getting to the low end also requires `echoCancellation`, `noiseSuppression` and `autoGainControl` set to false. The demo does this; otherwise capture adds tens of ms ([Kaufman](https://www.jefftk.com/p/audioworklet-latency-firefox-vs-chrome), [Mozilla bug 1375466](https://bugzilla.mozilla.org/show_bug.cgi?id=1375466)).
- Browsers expose no reliable input-latency figure, so every session would need an acoustic or electrical loopback measurement.

## 4. Browser demo (`web/index.html`)

**Signal chain.** `getUserMedia`, with echo cancellation, noise suppression and AGC off, feeds a 48 kHz `AudioContext` (latencyHint 0). The AudioWorklet (`worklet.mjs`) runs the lite build: the wasm bytes are compiled synchronously in the worklet, and the TextDecoder fallback is used because the worklet scope has no TextDecoder. It feeds both headphone channels.

**Controls.**
- F1 and F2 shift in %, sent as a 1-D ratio field: amp = hypot, phi = atan2.
- Pitch shift in semitones, via pvoc.
- Bypass: dry mic, with the same buffering.
- RMS gate.

**Display.** A live plot of tracked F1/F2 and shifted sF1/sF2, plus the in-worklet cost, FIFO underruns and the context latencies.

**Downloads.** A stereo float WAV (L = mic, R = processed) and a CSV of the tracks.

Run it with `node wasm/web/server.mjs` and open http://127.0.0.1:8765/web/index.html. Use closed headphones.

**Headless test** (`test/browser.mjs`). It uses Chromium with `--use-fake-device-for-media-stream --use-file-for-fake-audio-capture=test/fake-vowels.wav` (/a/ /i/ /u/, 3 s, looped). The script:
1. Starts the demo, applies F1 +20 %, then +2 st pitch, then bypass on/off, over about 7 s.
2. Pulls the worklet's recorded input, output, tracks and time-stamped command log.
3. Replays the recorded input offline through the same WASM build, applying each command at its logged frame.

Results, all PASS:
- Live output equals offline output: **0 of 339,840 samples differ (float32 bit-exact)**. Tracks match in 0/3540 rows.
- 0 FIFO underruns.
- Logged sF1/F1 = 1.2000 during the +20 % window.
- The captured input matches the WAV after Chromium's 48 k→44.1 k→48 k resampling (median cross-correlation 1.0000, minimum 0.9998).

The same run also serves `web/bench.html` for the Chromium numbers above.

## 5. Browser speech facilities

Probed in Chromium 150 (`scratch/wasm/speechprobe.mjs`, `sr.mjs`).

- **`speechSynthesis` as a stimulus or test input: not usable.** Its audio cannot be routed into Web Audio or a MediaStream; [WICG speech-api #69](https://github.com/WICG/speech-api/issues/69) has been open since 2019. Headless Linux Chromium exposes 0 voices anyway. It can speak instructions to the participant, but not in a way that is timed, recorded or perturbed. For TTS stimuli that pass through Audapter, render them offline or in-page with a WASM/WebGPU TTS and feed the PCM into `runTrial`, or into the worklet via an AudioBufferSourceNode. Options:
  - Piper ([vits-web](https://github.com/diffusionstudio/vits-web), [piper-tts-web](https://github.com/Mintplex-Labs/piper-tts-web)).
  - Kokoro.js: RTF 0.1 on WebGPU, but about 2 (slower than real time) on single-threaded WASM ([benchmark](https://briantung.me/blog/tts-engines-in-the-browser/)).

  The batch API makes this trivial.
- **`SpeechRecognition` for response logging: technically possible, with a privacy caveat.**
  - Chromium 150 has the unprefixed constructor, `available()`/`install()`, `processLocally`, and `start(MediaStreamTrack)`.
  - `start()` accepted a Web Audio `MediaStreamDestination` track. That track could be Audapter's processed output, i.e. "what the participant heard", or the raw mic.
  - With `processLocally = true`, the probe returned `language-not-supported` until a language pack (about 60 MB) is installed.
  - By default, audio goes to a server ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)). For research data use `processLocally` (Chrome desktop only, [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM/m/gwbtzV-lAQAJ)) or a WASM recognizer.
  - Firefox and Safari do not support track input.
- **In-browser ASR: the more controllable option.**
  - whisper.cpp WASM runs 2-3× faster than real time for tiny and base ([whisper.wasm](https://github.com/ggml-org/whisper.cpp/tree/master/examples/whisper.wasm)).
  - Also available: Transformers.js Whisper on WebGPU, Moonshine, [vosk-browser](https://github.com/ccoreilly/vosk-browser).
  - The sensible use is **offline, after the trial**, on the recorded signalIn. Its output would be word or phoneme timing, and misproduction detection.
  - Running ASR concurrently in the audio process competes with the worklet and is not recommended.
- **Not prototyped** beyond these probes: the useful pieces are ordinary plumbing on top of the batch API.

## 6. Embedding API (for the HTML report)

Loading the library:

```html
<script src="lib/audapter-lite.js"></script>      <!-- shipped blab behaviour, 10 s recorders -->
<script src="lib/audapter-patched.js"></script>   <!-- + patches/fixes/*.patch -->
<script>
(async () => {
  const a = await Audapter.create('lite');        // one wasm instance (~163 MB). Create once per variant; reuse.
  a.init('female', { bShift: 1, pertAmp: Array(257).fill(0.2) }); // blab defaults in AudapterIO('init') order, then overrides
  const r = a.runTrial({ input: float32At48k, ost: ostText, pcf: pcfText });   // reset + whole buffer + getData
  // r.output (48 kHz), r.signalIn / r.signalOut (16 kHz), r.frameRate (500 Hz), r.fmts[0..3], r.sfmts[0..1],
  // r.rms[0..2], r.dfmts, r.rads, r.rms_slope, r.ost_stat, r.pitchShiftRatio, r.pitchHz, r.shiftedPitchHz, r.raw
  const r2 = a.runTrial({ input: nextTrial });    // next trial: reset between, OST/PCF stay loaded (as in MATLAB)
})();
</script>
```

- **Globals.** `Audapter.create(variant)`, `Audapter.variants`, `Audapter.AudapterWasm`. Loading several bundles registers several variants on the same `Audapter` object. In node, `require('lib/audapter-lite.js')` returns the same object.
- **Instance methods.**
  - `init(sex, overrides)`: blab defaults, clears OST/PCF, resets.
  - `setParam(name, value)` and `setParams(obj | [[name, value]])`. Names are Audapter setParam names, case-insensitive. MATLAB field names such as `rmsThresh` and `dScale` are aliased. Arrays go through as-is, e.g. `datapb` or a 257×257 field in MATLAB column-major order.
  - `getParam(name)`.
  - `loadOst(text)` and `loadPcf(text)`: `''` clears.
  - `reset()`.
  - `runTrial({input, params, ost, pcf, reset = true})`.
  - `processBuffer(x)`: no reset.
  - `process(frame)`: one frame, like runFrame.
  - `processF32(frame, out)`: no allocation, for worklets.
  - `getData()`: AudapterIO field layout.
  - `getRawData()`: the Audapter(4) matrix.
  - `latest()`: newest data row.
  - `info`: variant, applied patches, sizeof, memory, recorder seconds.
- **ES modules.** `import { createAudapter } from 'web/audapter.mjs'; const a = await createAudapter('patched')` loads `dist/audapter-<v>.mjs`, which fetches the `.wasm` beside it.
- **Variants and gotchas.**
  - Fixes live in `patches/fixes/*.patch`, which are unified diffs against TransShiftMex. They apply with `patch -p1` to the original tree or to the prepped tree.
  - `test/patches.mjs` shows each bug in `lite` and its absence in `patched`: OST-F1 offset 1.680 s → 0.456 s; OST-F2 timeouts 0.202/0.404/0.606 s → 0.202 s ×3; I-01 silence from 5 to 10 s → noise. It also shows that patched equals lite bit for bit on single trials.
  - The recorders wrap at 10 s in lite and patched. Use `full` or `patched-full` for trials longer than 10 s or to demonstrate I-03.
  - Each `create()` is a fresh instance with fresh C++ statics, which matters for formant F5. Sequential trials on one instance behave like one MATLAB session.
  - `examples/embed.html` is a working page: it opens from `file://`, runs both variants in about 0.5 s and plays the I-01 audio. `test/embed-file.mjs` checks it.

## 7. Limitations

- **Only the offline processing path is compiled.** That is the same `handleBuffer` code as the ASIO callback, but the threading of the ASIO path, `playTone`, `playWave` and tone sequences are not exercised through the API. Their DSP is compiled, but no entry points are exported.
- **Audio differs from real speech.** Synthetic vowels and fake capture are used, not real speech or real microphones. Latency was not measured acoustically on real hardware here; the round-trip numbers are cited.
- **The Audapter bugs are the Audapter bugs.** The WASM build faithfully includes H2, OST-F1/F2, I-01 and the rest. Use `patched` where the fixed behaviour is wanted, and note that it contains only three fixes.
- **Browser coverage.** Only Chromium was tested. Firefox and Safari were not run: Safari's round trip is about 100 ms, and Firefox does not support `latencyHint` according to MDN compat data. Mobile was not tested; 163-307 MB heaps may fail on low-memory phones.
- **Timing inside the worklet.** No high-resolution timer exists in the worklet, and the worklet has no protection against main-thread GC or tab throttling, beyond the audio thread's own priority.

## 8. Recommendation

- **(a) Demos and teaching: yes, now.**
  - The page runs the actual core with a documented equivalence (bit-exact with musl; about 1e-10 from the MEX), live on a laptop.
  - Latency of about 25-100 ms is audible but acceptable for demonstrations.
  - The batch API also supports "hear the bug" and buggy-vs-patched comparisons in the report with no install, at a 142 KB gzip download.
- **(b) Remote or online data collection: only with strong caveats. Suitable for pilots and for latency-tolerant paradigms, not as a drop-in for lab AAF.**
  - Compute is not the problem. Uncontrolled, unmeasurable and device-dependent I/O latency is. Typical defaults are 50-105 ms before Audapter's 8-24 ms, which is squarely in the range where formant compensation shrinks or disappears.
  - Any online study would need all of the following:
    - wired closed headphones, verified with a headphone check ([Woods et al. 2017](https://link.springer.com/article/10.3758/s13414-017-1361-2), [Milne et al. 2021](https://link.springer.com/article/10.3758/s13428-020-01514-0));
    - a per-session loopback latency measurement and exclusion criteria;
    - desktop Chrome or Firefox with all capture processing off and `latencyHint: 0`;
    - logging of `baseLatency`/`outputLatency`, underruns and in-worklet timing;
    - upload of signalIn/Out for offline verification;
    - latency reported as a covariate.
  - Web Speech recognition should run on-device only. No published browser formant or pitch AAF study was found to benchmark against, which is itself a sign that this is uncharted ground.
- **(c) Lab-grade experiments: no, for the feedback loop. Keep native Audapter with ASIO or a dedicated interface (11-20 ms total).**
  - The WASM core is still useful in the lab as a portable, bit-reproducible *offline* reference: re-running recorded trials, CI regression tests of patches, and checking that logged perturbations match what was played.
