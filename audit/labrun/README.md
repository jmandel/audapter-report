# labrun: run the lab's real experiment code against the real Audapter

`labrun` runs a blab experiment's own MATLAB code (the `run_*_expt.m` entry point, its `run_*_audapter.m` runner and
the shared free-speech / commonmcode / wave_viewer / audapter_matlab helpers), **unmodified**, under Octave with
the real Audapter MEX (`audit/harness/build-oct`). The audio device, the participant, the experimenter and the
Windows machine are simulated. The result is what Audapter actually received and produced on every trial of a
session, next to what the script meant to set.

It does not run in real time. Everything runs on a virtual clock that advances only by the audio pumped through
Audapter and by explicit waits, as fast as the CPU allows (see [Speed](#speed)).

## Contents

| Path | What |
|---|---|
| `labrun` | driver: `labrun PLAN.m [OUTDIR]`, `labrun --summary OUTDIR`, `labrun --analyze SCRIPT.m DIR...` |
| `docker/` | image `audapter-labrun` = the harness image `audapter-octave` + gnuplot (invisible graphics objects) + Xvfb (a screen size) + Praat (wave_viewer's pitch tracker) + `winpath.so` (Windows path translation) |
| `shim/audapter/Audapter.m` | the virtual audio device around the real MEX |
| `shim/core/` | the virtual clock, the command log, the virtual participant and experimenter, the per-trial records |
| `shim/env/` | MATLAB environment: `pause`, `tic`/`toc`, `clock`, `now`, `input`, dialogs, `uiwait`/`waitfor`, `sound`, `audioplayer`, `audiorecorder`, `rng`, `ispc` ... |
| `shim/ptb/` | Psychtoolbox: `Screen`, `KbCheck`/`KbWait`/`KbName`, `GetSecs`, `WaitSecs`, `PsychPortAudio` (playback and capture) ... |
| `shim/compat/` | MATLAB functions Octave lacks or implements differently (`contains`, `matches`, `height`, `isoutlier`, `spectrogram`, `detectSpeech`, `pitch`, `readcell`, `which(..,'-all')`, struct property lists in `text`/`set` ...) |
| `shim/thirdparty/` | display-only stand-ins for two File Exchange functions the lab's helpers call (`CloneFig`, `varycolor`) |
| `oct/labrun_main.m` | sets up the sandbox, the path and the state, runs the entry point |
| `oct/labrun_summary.m` | per-trial analysis (`summary.tsv`, `summary.md`) |
| `tools/transform.py` | the one load-time source transformation (graphics dot notation), applied only to files that fail with it |
| `tools/runall.sh` | run several plans in parallel |
| `tools/sanitize.sh` | keeps names of unpublished lab repositories out of public results |
| `plans/` | one plan per public experiment |
| `results/<plan>/` | outputs (the text summaries are tracked; trial data, lab data and audio are not) |

## How it works

### The virtual audio device (`shim/audapter/Audapter.m`)
`Audapter.m` sits ahead of the MEX on the path (the MEX is loaded as `AudapterReal`). Every call is forwarded,
except the device actions, which the Octave build of the MEX cannot perform (its audio layer has no devices):

- `start`: the MEX's own `reset` (Audapter's `start` calls `audapter.reset()` before opening the device), then the
  virtual device runs. While it runs, each advance of the virtual clock pumps `round(t × srate × downFact)` samples
  of the planned microphone signal through the real `runFrame`, one frame of `frameLen × downFact` at a time, with
  a fresh buffer per call (the MEX writes into its input, finding H3). Fractions of a frame carry over.
- `stop`: the trial is closed. The MEX's recording is read with `Audapter(4)` (read-only), so the record does not
  depend on the lab code calling `getData`.
- `playWave` / `playTone`: reset, then a virtual playback device. The played samples follow
  `handleBufferWavePB` (data_pb from `pbCounter`, wrapping at `maxPBSize`, no gain) and `handleBufferSineGen`.
  `data_pb` and `pbCounter` cannot be read back through `getParam`, so the shim mirrors them from the `datapb`
  `setParam` calls and the frames processed in feedback modes 2..5. `playToneSeq` is recorded as an event only.
- Everything else (`setParam`, `getParam`, `ost`, `pcf`, `reset`, `getData`, `deviceName`, `runFrame` from lab
  code) goes to the real MEX and is logged. OST/PCF file contents are logged at load time. Calls that change state
  while the virtual device runs are flagged (the LIVE-1/2/3 races are out of scope here, see below).

### The virtual clock
`pause(t)`, `WaitSecs`, `Screen('Flip')` (one 60 Hz refresh, or up to its `when`), `playblocking`, and the
Psychtoolbox capture calls advance the clock by the requested time. Every read of a clock (`GetSecs`, `toc`, `clock`,
`now`, `time`, `cputime`, `datetime('now')`, `KbCheck`) advances it by one quantum: one audio frame while the device
runs (so the time is pumped like any other), 1 ms otherwise. Polling loops ("wait until stimdur has elapsed") therefore
end deterministically and agree with Audapter's sample-based timing. `pause` with no argument (a key wait) takes
`plan.keyWait` (1 s). The clock starts at 2026-01-05 09:00:00. The timeline is in `timeline.tsv` and every op in
`ops.tsv` carries its virtual time.

### The virtual participant
The microphone signal of each trial is chosen when the device first needs audio (by then the stimulus is on
screen). The request carries the word from `expt.listWords` at the script's trial index (read from the runner's
workspace: `trial_index`, `itrial`, ...), the on-screen text, the condition and the gender. The default input is a
synthetic utterance: one Klatt cascade vowel per vowel group of the word (harness `synth_vowel.m`) with
Hillenbrand et al. (1995) formants for the gender, F0 205 Hz (female) or 118 Hz (male) with a slight fall, 0.30 s
onset, 0.30 s vowels (0.18 s per syllable in longer words), vowel RMS 0.05, small seeded per-trial jitter, and a
-80 dBFS noise floor. A plan can instead give a corpus WAV per trial (`lr_input_wav`), a token-spread generator
(`lr_token_spread`: formant variability, outlier tokens, consonant transitions) or any function of the request.
The participant follows the lab's on-screen feedback ("speak more slowly", "louder", ...): vowels get 25 % longer or
20 % shorter, the level ±3 dB.

### The virtual experimenter
- Console prompts (`input`) and dialogs (`questdlg`, `inputdlg`, `listdlg`, `uigetfile`, ...) are answered by
  the plan's rules (`plan.answers = {regexp, answer}`), then by generic rules: participant ID `lr001`, height by
  the plan's gender, `(y/n)` → y, `(1/2)` or "1 or 2" → the first option, `(a/b)` → the first option, "redo/move on"
  → redo once then move on, dialogs → their default button, except that "save ... and exit?" dialogs are saved. A
  numeric prompt with no rule gets the first number it offers. A prompt that keeps being asked (25 times) stops
  the run with an error naming it. Every prompt and answer is logged.
- Blocking GUIs (`uiwait`, `waitfor` on a figure) are operated: the plan's steps for that figure (`plan.gui`),
  else the first push button found in the order continue, save, OK, done, next, accept, confirm, finish, yes, close
  is clicked (its real callback runs). A figure still open afterwards is closed through its `CloseRequestFcn`, as the
  window's close button would.
- The keyboard: `KbCheck` reports a press on every third poll; `KbWait`, `KbStrokeWait`, `GetChar` return after
  `plan.keyWait`. The key is the next one queued in `plan.keys`, else space; if the script keeps polling without
  anything else happening, the simulated keyboard cycles through the keys the script asked `KbName` about (quit
  keys last), which ends "press left or right" loops.
- Randomness: `rng('shuffle')` becomes a seed derived from `plan.seed`; runs are reproducible.

### The simulated machine
- Figures, axes, text and uicontrols are real Octave graphics objects (gnuplot toolkit, never rendered; Xvfb gives
  Octave a 1920×1080 screen so normalized units and font sizes work). MATLAB-only figure properties are added at
  creation. `CloneFig`/`varycolor` have display-only stand-ins.
- The platform is Windows (`ispc` true for lab code; Octave's own code gets the truth).
- Windows paths: `winpath.so` (LD_PRELOAD) maps `C:\...` to `/w/win/C/...` and `\\server\...` to `/w/win/unc/...`
  for every file system call of Octave and of the tools it starts, and makes `mkdir` create intermediate folders as
  MATLAB does on Windows. `C:\Users\Public\Documents\software\<repo>` (the lab's checkout location) points at the
  sandbox copies of the lab repos; data written under `C:\Users\Public\Documents\experiments` is collected.
  The lab file server is absent unless a plan provides files on it, so scripts take their "server down" branch.
- Sandbox: the lab repos are copied to a tmpfs (the lab code writes Working OST/PCF copies into its repos) and put
  on the path: the experiment folder first, then its repo, free-speech, commonmcode, wave_viewer (genpath each),
  then `audapter_matlab/mcode`. Missing `<name>Working.ost/.pcf` copies are made from `<name>Master.*` (on a rig
  they are left over from earlier sessions). Where a public runner looks for its own folder inside an unpublished
  repo (`fullfile(get_gitPath(repo), name)`), a copy of the public folder is placed there and the repo's marker file
  (read from `get_gitPath.m`) is created. All stand-ins are listed in `stand-ins.tsv`.
- `C:\Users\Public\Desktop\Praat.exe` (where wave_viewer calls Praat) runs the Debian Praat.
- Plans may add stand-ins for files that live on the lab server (`lr_make_cbperm`: a counterbalancing table made
  with the lab's own `gen_cbPermutation`; `lr_plan_files`: text files), rig-specific links (`plan.links`) and
  function stand-ins (`plan.stubs`, e.g. for a GUIDE `.fig` GUI).

### Load-time transformation (the only source change)
Octave's graphics handles are plain numbers, so MATLAB's `h.Visible = 'on'` / `x = h.Value` fail. When a run fails
with that error, `labrun` rewrites **that file's** graphics-property dot accesses in the sandbox copy (never the lab's
files) to `lr_dotset(h, 'Visible', 'on')` / `lr_dotget(h, 'Value')`, which use `set`/`get` for graphics handles and
plain field access for structs, and reruns the experiment from the start. Only property names that exist on Octave
graphics objects, written in MATLAB's CamelCase, are rewritten. Every rewritten line is listed in `transforms.tsv`.
So far this was needed in free-speech `check_audapterLPC.m`, `audapter_viewer.m`, `plotting/makeFig4Screen.m` and
wave_viewer `wave_viewer.m` (GUI code only).

### Psychtoolbox audio and other recorders
`PsychPortAudio` playback (`FillBuffer`/`CreateBuffer` + `Start`) is recorded with its volume and level-checked
like `sound()`: RMS and peak dBFS, samples beyond ±1 flagged (`plays.tsv`, `plays/*.wav`). Capture devices record
the same virtual microphone as Audapter, at the rate and channel count the script opened, from `Start`:
`GetAudioData` honours the allocated buffer (overflow flagged, oldest samples lost), `minimumAmountToReturnSecs`
(the clock advances until that much is available), `maximumAmountToReturnSecs`, and data remaining after `Stop`;
`GetStatus` is consistent with the clock. A capture started while an Audapter trial runs gets that trial's
microphone signal from the same moment (saved next to the trial as `NNNN_ptbCapture.mat`); otherwise the capture is
a trial of its own. `audiorecorder` (`record`, `recordblocking`, `getaudiodata`) works the same way. PTB playback
while Audapter runs is noted; it is not mixed into the microphone (no script so far assumes acoustic loopback).

## Outputs (per run, `results/<plan>/`)
- `summary.md`: status, speed, prompts answered, notes, OST/PCF files loaded (with hashes; texts in `ost/`), the
  **intended-vs-actual parameter table** and a per-condition table.
- `summary.tsv`: one row per device trial: word, condition, the script's shift value, duration, OST state timeline
  (`state@s`), logged shift span and median logged shift (Hz, mel), heard vs spoken F1/F2 by an independent LPC
  (whole utterance and within the logged shift span), heard vs spoken F0 in cents, output/input level (dB, heard =
  signalOut × dScale), in→out lag within Audapter, input level, noise-gap count (I-01), recorder limit, input used.
- `ops.tsv`: every Audapter call and environment event (prompts, keys, GUI clicks, plays, captures) with virtual time,
  trial and whether the device was running. `timeline.tsv`, `plays.tsv`, `stand-ins.tsv`, `transforms.tsv`,
  `run.json`, `run.log`.
- `trials/NNNN.mat` (untracked): per trial the op stream, `getParam` snapshot at start, the intent diff, the input
  signal at the device rate, `signalIn`/`signalOut` and Audapter's data matrix. `audio/` (untracked): stereo WAVs
  (left = mic, right = heard) for two trials per condition. `labdata/` (untracked): every file the lab code saved
  (`expt.mat`, `data.mat`, trial files, Working OST/PCF).

**Intended vs actual.** At every `start` the runner's parameter struct (`p`, `params` or `expt.audapterParams`,
read from its workspace) is compared with what Audapter reports through `getParam`, using the field→parameter map
parsed from the `AudapterIO.m` on the path. `mismatch`: the struct holds a value Audapter does not have (e.g. a
field changed after `init` and never sent, or a grid overwritten after `init`); `not-forwarded`: Audapter has the
parameter but nothing sent it (e.g. `bRMSClip`, whose `setParam` lines are commented out in AudapterIO); `unknown`:
no Audapter parameter of that name (e.g. `fb4Gain`). Fields of `getAudapterDefaultParams` that are not Audapter
parameters are counted but not listed.

## Running
```
docker build -t audapter-labrun audit/labrun/docker      # once (needs the harness image audapter-octave)
audit/harness/build-oct.sh                                # once: the Octave MEX (audit/harness/README.md)
audit/labrun/labrun audit/labrun/plans/vsaGeneralize.m    # test mode (the scripts' bTestMode = 1)
LR_FULL=1 audit/labrun/labrun audit/labrun/plans/vsaGeneralize.m    # the full session
audit/labrun/tools/runall.sh audit/labrun/plans/*.m       # several in parallel (LR_JOBS, default 6)
```
A plan is an Octave script setting `plan.name`, `plan.repos` (lab repos to copy; free-speech, commonmcode and
wave_viewer are always added), `plan.exptDir`, `plan.entry`, `plan.args`, `plan.gender`, and optionally
`answers`, `gui`, `keys`, `input`, `pre`, `links`, `stubs`, `layout`, `seed`. Plans under `audit/labrun/plans` see
only public repositories.

## Speed
Wall time counts the run itself (sandbox setup, Octave start and the summary add 10-20 s per run). Measured on a
12-core desktop, one run per core. "x real time" = virtual seconds (or seconds of audio pumped through Audapter)
per wall-clock second. The MEX itself processes a 96-sample frame in about 10 µs (≈ 200× real time); the rest is the
lab's own code (figures, per-trial saves and plots, GUIs) and the shims. Experiments with the OST-check GUI
(audapter_viewer) are the slowest.

| run | status | device trials (audio) | virtual s | audio s | wall s | x real time (virtual / audio) | transformed lines | stand-ins |
|---|---|---|---|---|---|---|---|---|
| attentionAdapt | completed | 69 (69) | 236 | 105 | 49 | 4.8 / 2.1 | 16 | 2 working-copy |
| attentionComp | completed | 51 (51) | 507 | 77 | 35 | 14.6 / 2.2 | 16 | 2 working-copy |
| coAdapt | completed | 66 (66) | 202 | 93 | 53 | 3.8 / 1.7 | 6 | 6 working-copy |
| modelComp | completed | 39 (39) | 172 | 74 | 37 | 4.7 / 2.0 | 0 | 2 working-copy |
| modelExpt | completed | 21 (21) | 89 | 36 | 22 | 4.1 / 1.6 | 6 | 2 working-copy |
| modelExpt_full | completed | 90 (90) | 267 | 153 | 54 | 4.9 / 2.8 | 6 | 2 working-copy |
| simonMultisyllable_exp3 | completed | 102 (102) | 361 | 193 | 142 | 2.5 / 1.4 | 113 | 1 experiment-folder, 1 repo-marker, 8 working-copy |
| simonMultisyllable_v2 | completed | 78 (78) | 281 | 147 | 115 | 2.5 / 1.3 | 113 | 1 experiment-folder, 1 repo-marker, 8 working-copy |
| simonSingleWord_v1 | completed | 65 (65) | 243 | 117 | 102 | 2.4 / 1.1 | 123 | 2 experiment-folder, 1 repo-marker, 8 working-copy |
| simonSingleWord_v2 | completed | 30 (30) | 134 | 54 | 57 | 2.3 / 0.9 | 123 | 2 experiment-folder, 1 repo-marker, 8 working-copy |
| uhdapter | completed | 15 (15) | 69 | 26 | 16 | 4.4 / 1.7 | 0 | 2 working-copy |
| vsaAdapt2 | error: 'run_vsaAdapt_audapter' undefined near line 177, column 8 | 13 (13) | 43 | 20 | 16 | 2.6 / 1.2 | 6 | 2 working-copy |
| vsaGeneralize | completed | 22 (22) | 83 | 33 | 26 | 3.2 / 1.3 | 6 | 2 working-copy |
| vsaGeneralize_full | completed | 466 (466) | 1266 | 699 | 279 | 4.5 / 2.5 | 6 | 2 working-copy |
| vsaSentence | completed | 49 (49) | 255 | 146 | 55 | 4.6 / 2.6 | 6 | 2 working-copy |


## Fidelity limits
- **Not real time, by design.** Callback/MATLAB-thread races (LIVE-1/2/3), xruns, device buffering latency and
  driver behaviour are out of scope; they are covered by `audit/live/`. The in→out lag reported here is Audapter's
  internal lag only (the live path adds 2 device buffers).
- Audapter runs through the offline `runFrame` path with `PROC_AUDIO_INPUT_OFFLINE`; `audit/live` showed the online
  path is bit-identical given the same input.
- Octave, not MATLAB: copy semantics, string class (approximated by char/cellstr), `datetime` (a char stand-in),
  graphics (never rendered; layout and callbacks run), `.fig` files cannot be loaded (GUIDE GUIs need a stub), and
  handles to nested functions do not share their parent's workspace, so a GUI that returns its result through
  nested-function state (wave_viewer's end state, used by free-speech audioGUI) needs a stub.
  Each MATLAB-only function added in `shim/compat` is a small reimplementation; the ones that affect numbers the lab
  uses are `isoutlier` (median / Grubbs), `pitch`, `detectSpeech`, `spectrogram`, `tinv`, `randsample`, `round(x, n)`,
  `readtable` (a struct of columns, not a table).
- The participant is synthetic (or a corpus clip): clean vowels without consonant bursts, a fixed F0 contour and
  level unless a plan varies them. Formant and pitch tracking behave as on clean speech.
- The experimenter is generic: default answers take the first or "continue" option. Answers that choose a group,
  a session or a phase are listed in `summary.md`; plans override them.
- Files that live on the lab server or only on rigs (counterbalancing tables, sentence lists, images) are absent
  unless a plan provides stand-ins, which are listed in `stand-ins.tsv`.
- `playToneSeq` is not simulated; `PsychPortAudio` schedules and slaves are simplified.

## Coverage (public experiments)
All public entry points were run in test mode (the scripts' `bTestMode = 1`), two also as full sessions
(`LR_FULL=1`). "Stand-ins" count the files or folders labrun provided (`stand-ins.tsv`); "transformed lines" count
the graphics dot-notation rewrites (`transforms.tsv`).

| Experiment (entry) | Result | Device trials | What was needed |
|---|---|---|---|
| free-speech modelExpt template (`run_modelExpt_expt` → run_checkLPC → run_measureFormants_audapter → run_modelExpt_audapter) | end to end; also full session (90 trials) | 21 / 90 | check_audapterLPC GUI operated (dot notation rewritten) |
| free-speech modelComp template (`run_modelComp_expt`) | end to end **only with the LPC check skipped**: the script calls `run_checkLPC(expt, exptPre)` with `exptPre` never defined (full mode always takes that branch) | 39 | plan answers "skip" to the test-mode LPC question |
| simonSingleWord v2 (`run_simonSingleWord_v2_expt`) | end to end | 30 | experiment folder placed where the runner looks for it (inside an unpublished repo); counterbalancing table on the (simulated) lab server; audapter_viewer OST-check GUI operated |
| simonSingleWord v1 | end to end | 65 | as v2 |
| simonMultisyllable v2 (Exp2) | end to end | 78 | as v2 |
| simonMultisyllable (Exp3) | end to end | 102 | as v2 |
| coAdapt (Exp1) | end to end | 66 | counterbalancing table |
| attentionComp | end to end | 51 | Psychtoolbox coherence test (dots, key responses) simulated |
| attentionAdapt | end to end | 69 (+60 PTB captures) | counterbalancing table on the server path (the script's server-down branch assigns `expt.session` but then reads `expt.sessionOrder`, so it cannot run without the server); PsychPortAudio voice-onset trigger fed by the same virtual microphone |
| vsaSentence | end to end | 49 | sentence list (lab server) replaced by 40 Harvard sentences + 10 words; counterbalancing table |
| vsaGeneralize | end to end; also full session (466 trials) | 22 / 466 | none beyond GUI operation |
| uhdapter (`run_uhdapter_audapter` as `full_run_uhdapter` calls it) | end to end | 15 | none |
| vsaCentralize (`run_vsaAdapt2_expt`) | **partial**: the pre phase runs; the main phase calls `run_vsaAdapt_audapter`, which is not in the public repository | 13 | |
| free-speech run_measureFormants_audapter, run_checkLPC, check_audapterLPC, audapter_viewer, get_noiseSource, calc_vowelMeans, calc_pertField | run inside the experiments above | | |

Per-run speed and stand-in counts are in the [Speed](#speed) table; per-trial results are in `results/<run>/`.

