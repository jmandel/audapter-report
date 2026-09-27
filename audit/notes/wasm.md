# WASM line: findings (details and numbers are in ../wasm/README.md)

### WASM-1. The LPC-coefficient columns of the data matrix log uninitialised heap memory
- Severity: low
- Location: lpc_formant.cpp:168 (`lpcAi = new dtype[maxNLPC + 1];` never zeroed); Audapter.cpp:1925-1928 (logged every frame); lpc_formant.cpp:952-956 (written only inside procFrame, i.e. only on supra-threshold frames)
- Blab-only? no (identical in upstream 2.1.5)
- What: `data_recorder` columns 4+2·nTracks+4 … +nLPC (the "ai" block of `Audapter(4)`'s dataMat) contain whatever was on the heap until the first voiced frame after the formant tracker is (re)built. The tracker is rebuilt when srate, nlpc, bcepslift and similar parameters change, which AudapterIO('init') does on every call. Values seen: 8.5e+247, 6.0e+175, 7.1e+194, and pointer-like denormals (4.7e-310), all different between the MEX, glibc, musl and WASM builds. After voicing, silent frames log the last voiced frame's coefficients, not zeros.
- Impact: AudapterIO('getData') does not return these columns, since the `data.ai` line is commented out. Code that saves or analyses the raw dataMat, or computes NaN/Inf checks or statistics over it, sees garbage or huge values. Nothing reaches the audio.
- Evidence: wasm/test/equiv.mjs (per-column diff) and wasm/test/cmpdirs.mjs ("uninit-ai rows"); scratch/wasm/ai.mjs prints them.
- How to test headlessly: run a trial whose first 100 ms are silent and read `Audapter(4)` dataMat columns 17..17+nLPC for rows 0..49. Assert they are all 0 (or all NaN). Currently they are arbitrary and can be ~1e+248.
- Fix: `lpcAi = new dtype[maxNLPC + 1]();`, or zero it in `LPFormantTracker::reset()`, and log NaN or 0 on unvoiced frames.
- Confidence: confirmed (four builds).

### WASM-4. clang cannot compile Audapter.h (extra member qualification)
- Severity: low (portability)
- Location: Audapter.h:552-555, 562-563, 565, 618, 637-638 (`dtype Audapter::hz2mel(dtype hz);` inside `class Audapter`)
- Blab-only? no
- What: MSVC accepts this and GCC accepts it under -fpermissive, but clang reports "extra qualification on member" as an error. Any macOS, clang or Emscripten build must edit the header. wasm/build.sh strips the qualifiers with sed.
- Fix: delete the `Audapter::` prefixes inside the class body.

### WASM-2, WASM-3, WASM-5: see FINDINGS-LOG.md and ../wasm/README.md
- WASM-2 (NEG): WASM equals native musl bit for bit; native glibc equals the Octave MEX bit for bit. WASM vs MEX differ only via libm, at 1.8e-10 relative. No UB-dependent or compiler-dependent behaviour was observed.
- WASM-3: 1.5-3 % CPU per frame. The AudioWorklet FIFO costs 1.33 ms. Audapter's algorithmic latency is 8.2 ms, or 24.2 ms with pvoc. The browser round trip dominates.
- WASM-5: buggy-vs-patched bundles and `patches/fixes/*.patch` for OST-F1, OST-F2 and I-01.

## Ideas
- Use the WASM or native C API replay (`octshim` + `wasm_export.m` + `test/equiv.mjs`) as a CI regression test. It is a cheap way to check any patch against recorded MEX runs; use a tolerance of about 1e-9 across libms.
- Expose `aud_set_seed`-style determinism hooks and a `reset_statics` entry point, so that a trial can be made independent of the previous one (formant F5), for testing.
- Proposed harness change, not made: have `prep-src.sh` also strip the `Audapter::` in-class qualifiers, so the native harness can build with clang and UBSan as well as GCC.
- A per-participant loopback latency calibration page, reusing the demo worklet with a click-train generator and cross-correlation, would be the first requirement for any online use.
