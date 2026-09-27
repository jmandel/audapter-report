# Audapter audit (blab-lab fork, b2.5)

An independent audit of [Audapter](https://github.com/blab-lab/audapter_mex), the real-time speech
perturbation software used in auditory-feedback research. This repo holds everything: the sources as
pinned submodules, the headless test harness, the analyses, the findings log, and the published report.

**Report:** served from [`docs/`](docs/) by GitHub Pages.
Author: Claude (Anthropic), working with AI sub-agents, at the request of Josh Mandel.
Every finding carries its evidence and a one-line reproduce command, so you can check it rather than trust it.

## Layout
| Path | What |
|---|---|
| `blab/`, `upstream/`, `other/` | Git submodules pinned to the audited commits (blab-lab fork, shanqing-cai original 2.1.5, GuentherLab and other forks) |
| `audit/FINDINGS-LOG.md` | Append-only chronological log of every finding, negative result and retraction |
| `audit/REPORT.md` | Ranked summary of findings |
| `audit/notes/` | Detailed per-area write-ups (OST/PCF, formant, pitch/time, interface, harness) |
| `audit/harness/` | Headless harness: real C++ core as an Octave MEX in docker, driven through the real MATLAB wrapper code; ASan/UBSan and upstream builds; test suite |
| `audit/wasm/` | Audapter compiled to WebAssembly: node/browser equivalence, real-time and latency measurements, mic demo, fix patches |
| `audit/live/` | Live audio-path simulation (real audioIO/RtAudio against a virtual clocked device) and thread-safety analysis |
| `audit/formal/` | Formal analysis (model checking / proofs) of index arithmetic, the OST state machine, overlap-add gain |
| `audit/corpus/` | Real speech test clips, with a license manifest, plus real-speech test results |
| `audit/report/` | Report source: `findings.yaml`, templates, `build.py`, render checks |
| `audit/publish/` | `stage.sh` builds `docs/` and runs the public-information gate |
| `audit/scratch/` | Agents' working scripts that findings cite as evidence (sources only) |
| `docs/` | The built static site (GitHub Pages): report, audio, WASM bundles |

## Reproduce
Requirements: Linux or macOS with docker, git, python3, node ≥ 20. No MATLAB, Windows or audio hardware.
```sh
git clone --recurse-submodules https://github.com/jmandel/audapter-report
cd audapter-report
./reproduce.sh            # builds the images, runs the harness suite, rebuilds the report into docs/
```
Individual pieces: `audit/harness/run-tests.sh`, `audit/wasm/build.sh`, `audit/live/run.sh`,
`audit/formal/run.sh`, `audit/report/build.py`. Each directory's README explains more.

## Licenses
License for the audit code and text in `audit/` and `docs/`: **TBD (to be chosen before publishing)**. Audapter sources (submodules)
keep their own licenses (Apache-2.0 / MIT); the WASM bundles in `docs/` are built from them (see
`docs/ATTRIBUTION.md`). Corpus clips keep their original licenses (`audit/corpus/manifest.*`).
License-restricted material is never committed.
