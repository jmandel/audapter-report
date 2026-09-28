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
| `tools/runvoices.sh`, `tools/compare_voices.py` | voice-bank runs (plans x talkers) and synthetic-vs-voice tables |
| `voices/` | the voice bank: generator, manifest, validation, index (`voices/README.md`) |
| `oct/lr_replay.m` | voice-only replay of fb 2..5 trials in the summary stage (checked; measurement aid) |
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

**Voice-bank participants** (`LR_VOICE=<talker>`; `voices/README.md`). The participant is one talker from the voice bank
for the whole session, saying the text each trial asks for: AI-generated (OpenAI `gpt-audio-1.5`) takes of every
stimulus word and sentence by ten voices (five perceived female, five male), validated (transcript, word boundaries,
clipping, F0 and vowel formants against reference means) and level-normalised like the synthetic vowels. Repetitions of
a word cycle through the talker's takes; "slower"/"faster" feedback picks a longer or shorter take (no time-stretch);
rest trials are silent. The talker's gender replaces the plan's. `tools/runvoices.sh` runs plans x talkers into
`results/<plan>_voices/<talker>/` (with `talker.json`); `tools/compare_voices.py` tabulates synthetic vs voice results
per condition and word.

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

### Participant setup: the LPC check
At setup a blab experimenter picks the male or female preset from a visual height estimate (labrun answers from the
talker's gender), then opens free-speech `check_audapterLPC` on the pretest recordings: a dropdown of LPC orders 10-20
(changing it re-runs Audapter offline on the pretest trials through the tool's own `changeLPC` callback), formant tracks
drawn over a spectrogram of one token per vowel, and an F1-F2 scatter of every pretest trial. The experimenter keeps the
order whose tracks look right and whose vowel clusters are tight, and saves it (`nlpc.mat`); the main phase loads it.
With `LR_LPCCHECK=rule` (voice-bank participants) the virtual experimenter does the same through the tool
(`shim/core/lr_lpc_experimenter.m`); otherwise it saves the preset.

For every order 10-20 it selects the order in the dropdown and invokes `changeLPC`, reads the tracks the tool computed,
and scores them; then it selects the chosen order, invokes `changeLPC` again and saves through the tool's OK button and
its "Save and exit" dialog. The rule, fixed before it was run on any talker:
- **A, accuracy (%)**: per pretest trial, Audapter's median F1 and F2 over the middle half of the vowel nucleus against
  an independent reference for the same token and span (the Praat tracks of the voice-bank token, `voices/audio/tracks`),
  mean of |ln(Audapter/reference)| over F1 and F2; A = 100 x the median over trials. **Reference quality control** (added
  before any scaled run, because Praat mistracked F1 on some tokens, e.g. an /ae/ at 212 Hz): a token's reference is used
  only if Praat at two formant ceilings (5500 and 6000 Hz for female voices, 5000 and 5500 Hz for male) agrees within
  10 % on the nucleus medians of F1 and F2, and the medians lie within +-35 % (F1) and +-25 % (F2) of the Hillenbrand et
  al. (1995) or Peterson & Barney (1952) mean for that vowel and gender (one-vowel words only). Tokens failing QC are left
  out of A and logged. If fewer than 3 trials or fewer than 2 vowels have a usable reference, A is dropped and the cost is
  0.5 B + 0.5 C (or B alone if C is unavailable too).
- **B, continuity (%)**: over each trial's vowel nucleus, the share of frame-to-frame steps with |dF1| > 100 Hz or
  |dF2| > 200 Hz (pooled over trials).
- **C, clustering (%)**: from the tool's own per-trial F1/F2 (the points of its scatter), in mel: the RMS distance of the
  points to their vowel's centroid divided by the mean distance between vowel centroids, x 100 (vowels with at least
  two trials; not used if fewer than two vowels, and the weights of A and B are then rescaled to sum to 1).
- **Cost** = 0.5 A + 0.25 B + 0.25 C (rescaled as stated when A or C is unavailable). The best order is the one with the lowest cost (ties: the one closer to the
  preset). **Experimenters keep the default unless another order is clearly better**: the chosen order is the best order
  only if (a) its cost is at most 0.85 x the preset's cost (15 % lower) **and** (b) the improvement is consistent across
  tokens: on the per-token cost (2/3 a + 1/3 b for a token with a usable reference, b alone otherwise, where a and b are
  that token's A and B) the best order is strictly lower than the preset on at least 2/3 of the pretest tokens (ties count
  against). Otherwise the preset is kept. (b) was added before any scaled run: when several orders are good their costs
  are small and nearly equal, and (a) alone switches on differences within token-to-token noise. Logged for every session:
  the choice without any margin (lowest cost), with (a) only, and with (a) and (b) (the rule).
- Logged per session (`lpccheck/check.json` in the result dir, and an `lpc-check` line in ops.tsv): the preset, the score
  of every order, the best order, the chosen order, and whether it differs from the preset; `lpccheck/index.json` lists
  the figures without scores, `lpccheck/audio/` holds the pretest audio as it went into the check. The tool's two panels are exported for every order
  (`lpccheck/order<NN>_tracks.png`, `order<NN>_vowels.png`) with the same axis limits across orders.
- Studies whose scripts offer the check run it; studies without it keep what their script does (the preset, or the order
  saved by an earlier checked session). The rule was validated on real recordings with known formants (see
  audit/FINDINGS-LOG.md, LPC-RULE entries).

### The simulated machine
- Figures, axes, text and uicontrols are real Octave graphics objects (gnuplot toolkit, never rendered except the LPC-check panels; Xvfb gives
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

**Voice-only replay (measurement aid).** In fb 2..5 `signalOut` mixes the voice with the masking noise. In the summary
stage, after the session, each such trial is replayed from its own record in a freshly loaded MEX: the exact pumped input
(`rec.input`), the full getParam snapshot at start (`rec.paramsFull`), the OST/PCF texts in effect (`rec.ostText`,
`rec.pcfText`), with fb = 1 and nothing else changed. The replay is kept as `rec.signalOutVoice` only if it passes every
check (`rec.replayCheck`): replayed `signalIn` identical to the recorded one, `fmts` and `sfmts` identical (< 0.01 Hz), and
the recorded output minus the replay, over the voiced part, is noise only (voice leakage <residual, replay>/<replay,
replay> within +-0.03, i.e. about +-0.25 dB, and level no more than 2 dB above the recorded output before voice onset). summary.tsv gets `replay_ok`, `replay_match` (max |sfmts
difference|, Hz) and `gain_voice_dB` (the replay re input); summary.md counts the replays that failed. Heard levels,
WAVs and every reported number use the recorded `signalOut`; the replay is only an independent view of the voice.

**Heard level.** `gain_dB` is the heard signal (`signalOut` × `params.scale`, i.e. dScale, aligned to the input) re the input,
plain RMS over the input's voiced samples (20 ms envelope above 0.1 × its maximum). `gain_dBA` is the same with both signals
A-weighted first (harness `report_aweight.m`, identical to the report's `loudness.a_weight`); the report quotes level differences in dBA.

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
  uses are `isoutlier` (median / Grubbs), `fillmissing`, `pitch`, `detectSpeech`, `spectrogram`, `tinv`, `randsample`, `round(x, n)`,
  `readtable` (a struct of columns, not a table).
- The default participant is synthetic (or a corpus clip): clean vowels without consonant bursts, a fixed F0 contour and
  level unless a plan varies them. Formant and pitch tracking behave as on clean speech. The voice-bank participants are
  AI-generated voices: real words with consonants, natural F0 and formant movement and take-to-take variation, but
  studio-clean, with loud sibilants and abrupt onsets of sustained vowels (voices/README.md, Limits).
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


## Voice-bank reruns (public experiments)
Every public run above was repeated with each of eight AI-generated voices (marin, coral, sage, nova, cedar, verse,
echo, ash; `voices/README.md`): `results/<plan>[_full]_voices/<talker>/` with the gender preset, and, for the
experiments whose scripts run the LPC check, `results/<plan>[_full]_voices_lpccheck/<talker>/` with the virtual
experimenter's check (see "Participant setup: the LPC check"). All runs completed as their synthetic counterparts did
(vsaCentralize stops at the same missing runner). `results/<plan>_voices/compare.md` tabulates synthetic vs voice
results per condition and word (`tools/compare_voices.py`); the headline numbers are in audit/FINDINGS-LOG.md
(VOICES-2, VOICES-3). The LPC-check choices per session are below (`tools/lpc_summary.py`); the coAdapt sessions'
panels, audio and scores are collected in `results/lpccheck/<talker>/` (`tools/lpc_export.py`).

**LPC check, per study** (public; changed = the rule's choice differs from the preset). Where the check kept the preset,
the checked run is the preset run (same order, same trials), so only sessions whose order changed need a comparison; none of
the public numbers quoted in the report comes from such a session.

| study | sessions | chosen order differs from the preset | lowest-cost order differs |
|---|---|---|---|
| attentionAdapt | 8 | none | 2 |
| attentionComp | 8 | none | 4 |
| coAdapt | 8 | none | 1 |
| modelExpt_full | 8 | none | 2 |
| modelExpt | 8 | none | 1 |
| simonMultisyllable_exp3 | 8 | none | 1 |
| simonMultisyllable_v2 | 8 | none | 1 |
| simonSingleWord_v1 | 8 | none | 2 |
| simonSingleWord_v2 | 8 | ash 17->19, coral 15->14 | 6 |
| vsaAdapt2 | 8 | none | 7 |
| vsaGeneralize_full | 8 | none | 6 |
| vsaGeneralize | 8 | cedar 17->16, echo 17->16 | 6 |
| vsaSentence | 8 | none | 6 |

Sessions: 104. Chosen order differs from the preset in 4 (4 %); lowest-cost order differs in 45; margin-only choice differs in 25. Talkers with at least one session off the preset: 4 of 8 (ash, cedar, coral, echo).

**coAdapt sessions** (the panels in `results/lpccheck/`):

| talker | preset | chosen | lowest cost | best cost / preset cost | best wins tokens | tokens with reference |
|---|---|---|---|---|---|---|
| ash | 17 | 17 | 17 | 1.00 | 0/6 | 5 |
| cedar | 17 | 17 | 16 | 0.94 | 2/6 | 3 |
| coral | 15 | 15 | 15 | 1.00 | 0/6 | 6 |
| echo | 17 | 17 | 17 | 1.00 | 0/6 | 3 |
| marin | 15 | 15 | 15 | 1.00 | 0/6 | 4 |
| nova | 15 | 15 | 15 | 1.00 | 0/6 | 5 |
| sage | 15 | 15 | 15 | 1.00 | 0/6 | 5 |
| verse | 17 | 17 | 17 | 1.00 | 0/6 | 4 |

**Validation on recordings** (`tools/lpc_validate.py public`: CMU ARCTIC monophthongs from the phone labels and PVQD
sustained /a/ /i/, Audapter at the gender preset, reference = Praat at two ceilings with the same QC): the rule keeps the
preset for all 17 talkers; the lowest-cost order differs from the preset for 7 (by 1-3 orders); for the four talkers with
at least four tokens the two halves of their tokens give the same choice as the whole except one (17 vs 16).

| talker | tokens (with reference) | preset | lowest cost | chosen | best wins tokens | split halves |
|---|---|---|---|---|---|---|
| arctic_awb | 2 (2) | 17 | 18 | 17 | 1/2 | n/a |
| arctic_bdl | 9 (8) | 17 | 17 | 17 | 0/9 | 17 / 17 |
| arctic_clb | 10 (7) | 15 | 15 | 15 | 0/10 | 15 / 15 |
| arctic_jmk | 2 (2) | 17 | 17 | 17 | 0/2 | n/a |
| arctic_ksp | 2 (2) | 17 | 17 | 17 | 0/2 | n/a |
| arctic_rms | 11 (10) | 17 | 16 | 17 | 7/11 | 17 / 16 |
| arctic_slt | 9 (8) | 15 | 17 | 15 | 5/9 | 15 / 15 |
| pvqd_LA9003 | 2 (2) | 15 | 15 | 15 | 0/2 | n/a |
| pvqd_LA9015 | 2 (2) | 17 | 17 | 17 | 0/2 | n/a |
| pvqd_LA9022 | 2 (0) | 17 | 17 | 17 | 0/2 | n/a |
| pvqd_NYU1015 | 2 (0) | 15 | 18 | 15 | 1/2 | n/a |
| pvqd_NYU1017 | 2 (2) | 17 | 18 | 17 | 1/2 | n/a |
| pvqd_PT101 | 2 (0) | 15 | 16 | 15 | 1/2 | n/a |
| pvqd_PT128 | 1 (1) | 17 | 17 | 17 | 0/1 | n/a |
| pvqd_SJ2001 | 2 (1) | 15 | 15 | 15 | 0/2 | n/a |
| pvqd_SJ2009 | 2 (1) | 17 | 16 | 17 | 1/2 | n/a |
| pvqd_SJ7001 | 2 (1) | 15 | 15 | 15 | 0/2 | n/a |

