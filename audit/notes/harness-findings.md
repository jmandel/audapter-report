# Findings confirmed by the headless harness

### H1. Overlapping memcpy in DSPF_dp_blk_move (buffer shifts)
- Severity: low (latent UB; MSVC CRT memcpy tolerates overlap in practice)
- Location: TransShiftMex/DSPF.cpp:15, called with overlapping ranges at Audapter.cpp:1691-1692 (and others)
- Blab-only? no (upstream since 2017)
- Evidence: ASan `memcpy-param-overlap` on first frame of any offline run (build-asan, oct/smoke.m).
- Fix: use memmove. Harness applies this patch (prep-src.sh) to emulate MSVC behavior.

### H2. Out-of-bounds read of output delay ring buffer on first frame of every trial
- Severity: low (reads the neighbouring voice's buffer / past the array for voice nFB-1; normally zeros → first frame of output silent)
- Location: Audapter.cpp:2111-2124 (`if (circPtr - delay*frameLen > 0)` should be `>= 0`)
- Blab-only? no
- Evidence: UBSan `index 1728000 out of bounds for type 'double [1728000]'` at Audapter.cpp:2124 on every offline run (oct/smoke.m, build-asan). When circPtr - delay*frameLen == 0 (first frame after reset with delayFrames=0, and on every wrap of the 108 s ring), optr = internalBufLen and the whole frame is read from beyond the voice's buffer.
- Related (by reading, same pattern): Audapter.cpp:2080 "back zeroing" computes `(circPtr - delay*frameLen - i0) % internalBufLen`, which is negative in C++ when circPtr is small → writes zeros before the start of outFrameBufPS[ifb] (into the previous voice's buffer or outFrameBuf) during pitch shifting.

### H3. runFrame overwrites the caller's MATLAB input array with the output (MEX contract violation)
- Severity: medium (silent data corruption in offline reprocessing code)
- Location: mexLibrary.cpp:361-364 passes mxGetPr(prhs[1]) to audapterCallback, which calls handleBuffer(buffer, buffer, ...) (Audapter.cpp:75-77) — in == out.
- Blab-only? no
- Evidence: oct/t_inplace.m — after Audapter('runFrame', fr), `fr` differs from its saved copy (max change 0.03). In MATLAB, named variables and cell elements are passed by shared storage, so e.g. running the same `sigInCell` through Audapter twice (two conditions) feeds the first run's *output* in as the second run's *input*; AudapterIO('process', frame) mutates the caller's `frame`. This first showed up in the harness as "identical trials give different formant tracks" (recorded input gained 128 leading zeros per repeat = the 4-frame output latency written back into the source).
- Fix: copy prhs[1] into a scratch buffer (or mxDuplicateArray) before calling handleBuffer; optionally return the output frame as plhs[0].
- Also: mexLibrary.cpp:347-349 checks `inParNDims` instead of `inSigNDims` (dimension check never looks at the signal).
