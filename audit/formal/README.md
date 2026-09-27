# Formal checks of the blab Audapter C++ core

Status: **in progress** (checkpoint at ~70 min). This is updated as results land. Each result is
also logged as FORMAL-n in `audit/FINDINGS-LOG.md`.

Tools, and why each one:
- **CBMC 5.95** (bounded model checker for C; docker image `audapter-formal`, built from
  `audit/formal/docker/Dockerfile`). Used for ring-buffer and recorder index arithmetic. It checks
  the actual source text: `cbmc/extract.py` copies the relevant lines verbatim from
  `blab/audapter_mex/TransShiftMex/Audapter.cpp` and pins each snippet by SHA-256, so if the source
  changes the check refuses to run. It also models C's integer semantics exactly, including
  negative `%`. A hand-written model (Lean, z3) would have to re-encode those, and that
  re-encoding is where this bug class hides.
- **Lean 4** (planned, for the OST state machine). Showing that "trial behaviour does not depend on
  earlier trials" is a statement about unboundedly long runs, so it needs induction, which a
  bounded checker cannot give.
- **Plain derivation plus exact symbolic check** for the phase-vocoder overlap-add gain (planned).

## <a name="ring"></a>1. Ring buffers and recorder (CBMC) — preliminary

What is checked: the pre-pitch-shift ring write (Audapter.cpp:1962; 1948/1952 use the same
pointer and length), the no-pitch-shift copy (2089-2092), the pvoc analysis copy (2002-2009), the
pvoc overlap-add accumulate, front zeroing and back zeroing (2065-2081), the DAF read pointer and
summation (2110-2127), the ring-pointer advance (2225-2228), and the recorder writes and wrap
(1683-1687, 2211-2213, 2304-2307).

Parameter domain (what the code itself admits): frameLen F in 1..960; delayFrames d in 0..600
(setParam clamp); nFB 1..4; pvocFrameLen N a power of two up to 4096; pvocHop H in 1..N; ring
position c any value the pointer can reach (c = kF < L, where L = internalBufLen = 1,728,000).
F is enumerated one value at a time (a symbolic divisor makes the SAT problem intractable). All
other parameters are fully symbolic.

Preliminary results (F in {1, 7, 32, 512}; full sweep pending):

| Site | Original code: out of bounds exactly when | Fix, proven in bounds when |
|---|---|---|
| DAF read 2110-2127 | c == d·F (frame d of every trial, and every 108 s lap), or F ∤ L tail | `>= 0`, and F divides L; it then reads exactly the frame written d frames ago |
| back zeroing 2078-2081 | c − d·F − i0 < 0, i.e. on a pvoc frame with c < d·F + H | positive modulo: always; same index wherever the original was valid |
| outFrameBufSum 2121/2124 (every frame) | N < F (NEW) or N > 2880 | require F ≤ N ≤ 2880 |
| current-frame write 1962, copy 2090 | c + F > L, reachable iff F ∤ L (NEW) | F divides L |
| recorder 1685/2212 | (fc+1)·F > 480000, reachable iff F ∤ 480000 | F divides 480000 |
| pvoc input copy 2002-2009 | never (N ≤ 4096) | n/a |
| OLA accumulate / front zeroing | never | n/a |

In audio terms:
- At the DAF read overrun, one frame (2 ms at the defaults) is taken from the next voice's buffer,
  which is silence for a single voice. That is a click or dropout at frame d of every trial.
- The back-zeroing overrun writes zeros into the tail of the pre-pitch-shift ring or the previous
  voice. That tail is still silent in the first lap, but after a 108 s wrap it wipes live audio.
- An `N < F` configuration corrupts the ring pointer itself.

## 2. OST state machine (Lean) — not started
## 3. Phase-vocoder overlap-add gain — not started
## 4. locateF1/locateF2 — not started

## Reproduce
`audit/formal/run.sh` (to be written): rebuilds the docker image if missing, re-extracts and
hash-checks snippets, runs all CBMC groups, and runs the Lean build.
