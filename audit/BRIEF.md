# Audapter audit — shared brief for inspection agents

Target: blab-lab fork of Audapter (real-time speech formant/pitch/timing perturbation for
speech motor-control research; runs as a MATLAB MEX on Windows with ASIO audio).

- C++ source (READ ONLY): ~/hobby/audapter/blab/audapter_mex/TransShiftMex/
- MATLAB side (READ ONLY): ~/hobby/audapter/blab/audapter_matlab/mcode/
- Original upstream for diffing: ~/hobby/audapter/upstream/audapter_mex, upstream/audapter_matlab
  (in blab clones: `git diff upstream/master origin/master` shows blab-only changes; blab
  changes are the highest-priority review target since they have had the least scrutiny)
- Manual: https://sites.bu.edu/guentherlab/files/2022/09/AudapterManual_2.1.5.pdf and
  ~/hobby/audapter/blab/audapter_mex/doc/

Rules:
- Do NOT modify anything under ~/hobby/audapter/blab, upstream, or other. Do not git commit/push anywhere.
- Scratch files go in ~/hobby/audapter/audit/scratch/<your-area>/ (not /tmp).
- Write your findings to ~/hobby/audapter/audit/notes/<your-area>.md.

What matters: this code drives perturbation experiments whose results get published. The worst
bugs are SILENT ones: wrong perturbation magnitude/direction, wrong timing of perturbation onset,
wrong data logged vs. what the participant heard, state leaking across trials, uninitialized
memory, out-of-bounds writes, numeric blowups (NaN/Inf) that don't crash. Crashes of MATLAB are
second tier. Style nits are not interesting.

Findings format (per finding):
  ### <ID>. <one-line title>
  - Severity: critical / high / medium / low / idea
  - Location: file:line (blab version)
  - Blab-only? yes/no (was it introduced by blab changes?)
  - What: the defect or risk, precisely
  - Evidence: code excerpt / reasoning
  - How to test headlessly: a concrete test we can run on Linux WITHOUT audio hardware or MATLAB.
    A harness is being built that compiles the real Audapter DSP code on Linux with a stub mex.h
    and feeds synthetic audio frame-by-frame through Audapter's processing entry point, then reads
    back its data/output buffers. Describe the input signal, params, and the assertion.
  - Confidence: confirmed-by-reading / likely / speculative
Also include a short "Ideas" section: robustness/test/refactor ideas worth doing.
Be precise and skeptical; do not pad. Verify line numbers.

## Session 2 additions (applies to all agents)
- Findings log: ~/hobby/audapter/audit/FINDINGS-LOG.md. For every new finding, negative result or
  retraction, APPEND one entry under "## Session 2" using the entry format at the top of that file.
  Use a single `cat >> FINDINGS-LOG.md <<'EOF'` per entry, never rewrite the file. Prefix IDs with your area
  (FORMAL-n, WASM-n, ...). Give permalinks with the pinned SHAs listed there.
- Existing harness: ~/hobby/audapter/audit/harness (README.md there). Report: ~/hobby/audapter/audit/REPORT.md.
  You may ADD scripts under harness/oct/ (prefix them with your area) but do not change existing
  harness files; propose such changes in your notes instead.
- Docker is available (images: audapter-octave). You may pull or build other images, but keep total new
  disk use under ~6 GB (the disk is 97 % full) and remove large intermediate artifacts you no longer need.
- Never git commit or push anything.

## Standing rule (added 2026-09-27)
- Do the work yourself, directly with your own tools. Do NOT spawn your own sub-agents or workflows. (A nested
  sub-agent had all its shell commands blocked by the permission check; direct work has not been blocked.)
- If a command of yours is denied, do not route it through another agent or disguise it. Stop that step,
  record what was blocked and why it was needed in your notes, and report it to the coordinator.
