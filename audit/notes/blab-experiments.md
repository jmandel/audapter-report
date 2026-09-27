# How the blab lab runs Audapter: real designs, and which findings affect them (public code only)

Area: blab-experiments. Evidence scripts: `audit/harness/oct/exp_*.m` (run with `audit/harness/run-oct.sh`).
Log entries: EXP-1 … EXP-11 (+ EXP-4 correction) in `audit/FINDINGS-LOG.md`.

**Scope and sources.** Everything below comes from **public** repositories only, cloned with `--depth 1`
into `other/blab-experiments/` (the three VSA repos were later unshallowed to read their history).
Permalinks are pinned to these SHAs:

| Repo | URL | HEAD SHA | What it holds |
|---|---|---|---|
| free-speech | https://github.com/carrien/free-speech | `ec961b7a04a79199217f4973effda9157afcdf9d` | shared experiment helpers (`experiment_helpers/`), template experiment, audapter_viewer, analysis |
| simonSingleWord | https://github.com/blab-lab/simonSingleWord | `df6712020e59dae86e303d5cea599c2412aaa206` | "bedhead" opposing-shift adaptation (v1, v2), real OST/PCF |
| simonMulti | https://github.com/blab-lab/simonMulti | `e05f155dfba07110026688d8f000068cee1c9249` | coAdapt (Exp1), simonMultisyllable v2 "seven/sever" (Exp2), "ped-" (Exp3), real OST/PCF |
| attentionAAF | https://github.com/blab-lab/attentionAAF | `0f4ef4301ef10144fcbc2a75b990207a9e9441fd` | attentionComp (compensation, randomized catch design) and attentionAdapt (dual task) |
| vsaCentralize | https://github.com/blab-lab/vsaCentralize | `9beb9a7767418cae5d681b35fb1e0cc010331d02` | vowel-space centralization (2-D field), "vsaAdapt2" |
| vsaGeneralize | https://github.com/blab-lab/vsaGeneralize | `0ec575ae1cde8402628b6cb5cd756467a95dd11d` | generalization of centralization (2-D field) |
| vsaSentence | https://github.com/blab-lab/vsaSentence | `c01942f1381237fd8c205e06e7c1472d72e4e685` | centralization with sentences (Beach et al. preprint 2024) |
| uhdapter | https://github.com/blab-lab/uhdapter | `92aa1c0a45756267d73414d291a0c38fb02d68bc` | shifted-schwa adaptation (uniform field) |
| postMan | https://github.com/blab-lab/postMan | `1358d3698156a9b0f1581b1b741185376b9b1b02` | single-exposure adaptation (eLife 2022); **analysis only, no runner** |
| commonmcode | https://github.com/blab-lab/commonmcode | `1c7c0faecc78878d8af99240a6912ff43cc307ad` | utilities (no Audapter calls) |
| wave_viewer | https://github.com/blab-lab/wave_viewer | `83e751f76d0e6e045f9a10ec8af08329256d45d9` | offline formant/pitch viewer (no Audapter calls) |
| comppedagogy | https://github.com/blab-lab/comppedagogy | `8fc41507d6b539024fc5fad14782f157bb76aa56` | teaching material (not surveyed further) |

`gh repo list blab-lab --visibility public` lists these plus `audapter_mex`/`audapter_matlab` (the audit
target) and two Python/Jupyter repos without Audapter code (pitch-mouse-py, fun-with-formants).

Not in any public repo: the timeAdapt / taimComp OST+PCF files and runners, and the postMan runner. Their
settings are unknown here and are marked "not public" below.
**Private repositories were not accessed.** Mid-task I received two agent-relayed messages allowing private
access. The original rule was "public only", and permission relayed by an agent is not the user's own, so
I left private repos alone and flagged this to the coordinator.

---

## 1. Trial-to-trial carry-over in mixed designs (priority section)

Question from the lab's PI, relayed by the user: "We do have experiments where some trials have manipulation
followed by some without … if one trial's lingering state can affect another, that's a problem".

**Short answer.**
- **Blab's real switching methods are free of carry-over** in what the participant hears and in the logged
  shift. They are field-mode `setParam` per trial, or PCF rewrite-and-reload per trial, with `reset` per trial
  and the lab's own OST rules. Catch trials deliver nothing: 0 s logged shift, output/input F1 0.99–1.01 by
  an independent estimator. Every trial is bit-identical whatever came before it: forward vs reversed session
  order, logged `fmts`/`sfmts`/`ost_stat` and `signalOut`. The only exception is ~36 ms of logged onset
  `fmts` on the first trial of a MATLAB session (item 1.4).
- **Carry-over is real, and large, for a different class of OST design.** When the "turn the perturbation
  off" rule is `INTENSITY_FALL` and the rule before it does not refresh `lastStatEnd` (blab's own RMS-floor
  onset rule, mode 32; `ELAPSED_TIME`; the ratio rules), OST-F1 applies. Then **one long trial, perturbed
  or not, extends the perturbation in every later perturbed trial**. In a realistic sequence with catch trials
  this runs through the whole second word (+0.84 s), and it ratchets: it never recovers for the rest of the
  session. **Reloading the OST before every trial does not help**, and neither does `AudapterIO('init')`
  (`lastStatEnd` is only cleared by `OST_TAB::reset()`, which nothing calls). No public blab OST uses such a
  rule, so this is "could trigger if". The OST files of the non-public experiments could not be checked.
- **Two switching methods used by other labs (not in blab's public code) leak a perturbation into control
  trials.** (i) A PCF left loaded from an earlier block overrides a field experiment in both directions
  (COORD-1): it perturbs "noShift" trials at full strength, or suppresses all shifts. Blab's runners
  explicitly clear OST/PCF at the start, which is what protects them. (ii) Pitch catch trials made by
  *clearing* the PCF after a trial that ended while shifted are shifted at full size (OST-F5).

### 1.1 Real mixed designs in public blab code and exactly how the condition changes per trial

"Mixed" means perturbed and unperturbed (or differently perturbed) trials interleaved within a phase. Block designs (baseline → ramp → hold → washout) are listed afterwards because the hold→washout switch is the same mechanism.

| Experiment | Interleaving | How the condition changes per trial | OST | PCF | init | reset | start/stop |
|---|---|---|---|---|---|---|---|
| **attentionComp** (attentionAAF) | per 18-trial block: 3 words × (4 noShift + 1 shiftIH + 1 shiftAE), randomized ([run_attentionComp_expt.m:51-52,104-124](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionComp_expt.m#L51-L124)); 33 blocks, 1.5 s trials | field mode: `setParam pertAmp = mag*ones(1,257)`, `pertPhi = angle*ones(1,257)`; 0 for noShift ([run_attentionComp_audapter.m:202-205](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionComp_audapter.m#L202-L205)) | nullified once (:37-38) | nullified once | once (:55) | per trial (:208) | per trial (:210, :283) |
| **coAdapt** (simonMulti Exp1) | 3 words, each with its own shift (0, +1, −1 × 125 mel), word order randomized ([run_coAdapt_expt.m:98-100,156-186](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp1/run_coAdapt_expt.m#L98-L186)) | field mode: `setParam pertAmp` per trial, `pertPhi` always 0; negative amplitude = down ([run_coAdapt_audapter.m:34-35,109-110](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp1/run_coAdapt_audapter.m#L34-L110)) | nullified (:36-37) | nullified | once (:72) | per trial (:113) | per trial (:115, :123) |
| **simonMultisyllable_v2** (simonMulti Exp2) | "seven"/"sever" shifted (opposite directions by counterbalancing), "level" always noShift, randomized ([run_simonMultisyllable_v2_expt.m:47,162,218-245](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp2/run_simonMultisyllable_v2_expt.m#L47-L245)) | **PCF rewritten and reloaded every trial**: angle in rows 0-8, amplitude in rows 0-3 (first vowel only), 0 for "level" ([run_simonMultisyllable_v2_audapter.m:100-106](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp2/run_simonMultisyllable_v2_audapter.m#L100-L106)) | `sevXXX` loaded **once** (:31) | reloaded per trial | once (:66) | per trial (:108) | per trial (:110, :118) |
| **simonMultisyllable** (Exp3) | "pedigree"/"pedicure" shifted, "pedestal" and "carbonate" noShift ([run_simonMultisyllable_expt.m:51,242-251](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp3/run_simonMultisyllable_expt.m#L51-L251)) | as Exp2 (`pedXXX` OST) | once | per trial | once | per trial | per trial |
| free-speech **modelComp** template | noShift/shift conditions per trial | as attentionComp ([run_modelComp_audapter.m:36-37,96-103](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/templates/modelExpt/run_modelComp_audapter.m#L36-L103)) | nullified | nullified | once | per trial | per trial |
| **postMan** (eLife 2022) | single perturbed trials (shiftUp/shiftDown) followed by unperturbed "post" trials ([README](https://github.com/blab-lab/postMan/blob/1358d3698156a9b0f1581b1b741185376b9b1b02/README.md)) | **runner not public**; the analysis compares post-trial formants by condition | ? | ? | ? | ? | ? |
| Block designs: simonSingleWord v1/v2, vsaCentralize, vsaGeneralize, vsaSentence, uhdapter, attentionAdapt | perturbation changes at phase boundaries (hold → washout) or per ramp trial | v2: PCF rewritten+reloaded **and** `AudapterIO('init')` every trial ([run_simonSingleWord_v2_audapter.m:132-152](https://github.com/blab-lab/simonSingleWord/blob/df6712020e59dae86e303d5cea599c2412aaa206/experiment%20scripts/run_simonSingleWord_v2_audapter.m#L132-L152)); VSA: `setParam pertAmp2D = scale*field` per trial, init when fb changes ([run_vsaSentence_audapter.m:119-127](https://github.com/blab-lab/vsaSentence/blob/c01942f1381237fd8c205e06e7c1472d72e4e685/run_vsaSentence_audapter.m#L119-L127)); uhdapter: field `setParam`, init when fb changes ([run_uhdapter_audapter.m:227-242](https://github.com/blab-lab/uhdapter/blob/92aa1c0a45756267d73414d291a0c38fb02d68bc/run_uhdapter_audapter.m#L227-L242)) | bedhead once / nullified | per trial / nullified | per trial (v2) or on fb change | per trial | per trial |

Nobody uses always-on audio: every runner does `reset` → `start` → `pause(stimdur)` → `stop` → `getData` per
trial. No public runner toggles `bShift` per trial or changes `pitchShiftRatio`. No public blab experiment
does pitch perturbation.

### 1.2 What can carry over between trials, and whether it does under these methods

| State | Cleared per trial? | Under blab's switching methods |
|---|---|---|
| OST `lastStatEnd`, `statOnsetIndices`, `stretchSpanAccum` | **no**: `OST_TAB::reset()` is never called ([ost.cpp:97-101](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/ost.cpp#L97-L101)). An OST reload frees and reallocates `statOnsetIndices` (zeroed) but does **not** touch `lastStatEnd` ([ost.cpp:150-180](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/ost.cpp#L150-L180)) | harmless for blab's OSTs: `INTENSITY_RISE_HOLD_POS_SLOPE` and `NEG_INTENSITY_SLOPE_STRETCH_SPAN` set `lastStatEnd` on completion ([ost.cpp:413-421, 466-470](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/ost.cpp#L413-L470)), and they use no `ELAPSED_TIME`/maxIOI. Harmful for FALL after mode 32 / ELAPSED / ratio rules (S5) |
| `stretchCnt` | re-initialized on entry to each +2 rule | no effect |
| PCF (`pertCfg`) | persists until the next `pcf` load or `pcf '' 0`, across `reset` **and** `AudapterIO('init')` | blab reloads per trial, or clears at runner start: safe. Leftover across blocks: S3 |
| `p.pitchShiftRatio[0]` mutated by PCF pitch rows | persists after `pcf '' 0` (OST-F5) | no blab pitch design; S4/S4b |
| field `pertAmp/pertPhi/pertAmp2D` | parameters; persist until set | set every trial; `AudapterIO('init', p)` re-sends `p`'s values. A field set with `setParam` alone would be zeroed by a later init, but every blab runner stores the value in `p` first (vsaSentence :119-127, uhdapter :227-237) |
| handleBuffer statics `during_trans`, `maintain_trans`, `clampIx` | `during_trans` cleared every window; `clampIx`/`maintain_trans` cleared on any unshifted frame ([Audapter.cpp:1715, 1874-1878](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/Audapter.cpp#L1874-L1878)) | no effect (a clamp that starts at OST state 0 would resume its trajectory; taimComp settings not public) |
| tracker static `last_f` ([lpc_formant.cpp:816](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/lpc_formant.cpp#L816)) | never | only the **first trial of a MATLAB session** differs: logged `fmts` over the first ~36 ms of the vowel, up to 596 Hz; `sfmts` and audio identical (1.4) |
| `pbCounter` (masking-noise position) | only when `datapb` is set | noise position runs on across trials. Since b2.4 (maxPBSize 480000) the bundled babble has a 16 ms hole every 9.98 s of running time, landing at a different point in each affected trial (EXP-3); before b2.4 there is no hole |
| gain-adaptation statics | never | `gainAdapt = 0` in every blab runner (default) |

### 1.3 Scenarios run (harness, real settings)
Script: `audit/harness/oct/exp_mixed.m` (`SCEN=S1`…`S5`, `S4b`), logs `audit/harness/logs/exp_mixed_S*.log`;
helper `exp_trial.m`. Settings for all: `getAudapterDefaultParams('female')`, 16 kHz / downFact 3 / frameLen
32 / nDelay 5, `bShift 1`, `bMelShift 1`, `bRatioShift 0`, fb 3 with the lab's own `get_noiseSource` babble at
fb3Gain 0.02, and shifts of 125 mel (the lab's usual magnitude). Each (token, condition) is run in a forward
and in a reversed-order session.

- **S1 field mode, per-trial `setParam` (attentionComp / coAdapt / uhdapter / modelComp).** Sequence
  shiftAE, shiftAE, noShift, shiftIH, noShift, noShift, shiftAE, noShift (4 synthetic "head/bed"-like words,
  4 real CMU ARCTIC clips). Catch trials: shifted 0.000 s, output/input F1 1.009, 1.002, 1.001, 0.998.
  Perturbed: logged ±125.0 mel, output/input F1 1.14–1.26 (up) and 0.795 (down). Forward and reversed
  sessions are bit-identical for trials 2–8 (logged data at fb 3; `signalOut` for all 8 at fb 1). Trial 1
  differs only in onset `fmts` (1.4).
- **S2 PCF rewrite+reload per trial, OST once (simonMultisyllable_v2, real `sevXXXMaster.ost`).**
  Amplitude in rows 0-3 only, as in the lab's code. Sequence shift, shift, level, shift(long V1), level,
  shift, level, shift. Shift spans run from 0.324 s to the detected V1 offset (state 4, within 2 ms of the
  synthetic V1 end) on every perturbed trial. Catch ("level") trials: 0.000 s shifted. Order-invariant
  (trials 2–8; trial 1 as above).
- **S3 leftover OST/PCF from an earlier block (COORD-1), with blab's own files.** (i) After the
  `measureFormants` calibration block (all-zero PCF), a field block *without* the runner's
  `Audapter('ost'/'pcf','',0)` lines shifts **0.000 s** instead of 0.442 s: the F1 +125 mel field is fully
  suppressed (output/input F1 1.006 vs 1.203). (ii) After a SimOn hold block (bedhead PCF, 125 mel), a field
  "noShift" trial (pertAmp 0) is **shifted 0.442 s at +125 mel** (output/input F1 1.203). With the nullify
  lines both are correct. All public blab runners have those lines ([run_attentionComp_audapter.m:37-38](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionComp_audapter.m#L37-L38),
  [run_vsaSentence_audapter.m:47-48](https://github.com/blab-lab/vsaSentence/blob/c01942f1381237fd8c205e06e7c1472d72e4e685/run_vsaSentence_audapter.m#L47-L48),
  [run_modelExpt_audapter.m:52-53](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/templates/modelExpt/run_modelExpt_audapter.m#L52-L53), …),
  and every blab session starts with the measureFormants calibration, so **those two lines are load-bearing**.
- **S4 / S4b pitch catch trials (OST-F5; could trigger if).** OST RISE_HOLD → FALL, PCF +2 st in state 2,
  pvoc. If the perturbed trial ends *after* the FALL (state 3, 0 st), a following catch trial made with
  `Audapter('pcf','',0)` is clean (−0 cents). In a **sustained-vowel design where phonation is still going
  when the trial stops** (the trial ends in the shifted state), the catch trial is **+200 cents, the full
  shift**, and `data.params.pitchShiftRatio` logs 1.1225. A catch trial made by loading a zero PCF is clean
  (−0 cents) in both cases.
- **S5 OST-F1 in a mixed "shift the first word" design with catch trials.** Two words per trial, F1 +125 mel
  in state 2, catch trials = zero PCF. First-word durations 0.30, 0.35, **1.20 (catch)**, 0.30, 0.40,
  **0.90 (catch)**, 0.35, 0.30 s.
  - blab-style onset `INTENSITY_RISE_HOLD_POS_SLOPE 0.01 0.05` → `INTENSITY_FALL 0.01 0.02` (the
    measureFormants rules): the shift ends 0.08 s after word 1 on every perturbed trial, whatever the
    catch trials did. OST loaded once or reloaded per trial gives the same result. **Safe.**
  - onset `INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02` (blab mode 32) → the same FALL:
    - trials 1–2: correct (0.08 s past word 1).
    - trial 3 (catch, 1.20 s first word): its FALL at 1.444 s sets `lastStatEnd` = 722 frames.
    - trials 4 and 5 (perturbed, 0.30/0.40 s first words): the offset is detected only at 1.466/1.488 s, so
      **F1 +125 mel runs 0.84 s past word 1, through all of word 2**.
    - after the second catch trial (FALL at 1.906 s), the offset is **never** detected in trials 7–8.
      The perturbation covers both words, and every FALL pushes `lastStatEnd` later, so it never recovers.
    - measured independently on the audio (`exp_s5_measure.m`, WAVs in `harness/oct/out/exp/`): word 2
      of trial 4 is heard at F1 **+17.6 %** (520 → 612 Hz) against −1.6 % in trial 1 (same first-word
      length); word 1 is +20 % in both.
  - mode 32 with the OST **reloaded before every trial**: every perturbed trial is affected, including
    trial 1. `lastStatEnd` survived from the previous block even across the reload and `AudapterIO('init')`.

### 1.4 Minor: first trial of a MATLAB session
`exp_mixed_diag.m`: the same token run first after process start vs later differs only in logged `fmts` for
18 frames (0.380–0.414 s, the first ~36 ms of voicing, max 596 Hz). `sfmts`, `rms`, `ost_stat` and
`signalOut` are identical. The second and third occurrences are identical whatever came before (/i/-like
or /ɛ/), with or without `AudapterIO('init')` before every trial, provided the field is stored in `p` as the
lab does. This is the static tracker memory (FMT-F9): it shows up once per session in the logged onset
formants, and nowhere audible. blab's `calc_vowelMeans` takes the middle 50 % of the vowel
([calc_vowelMeans.m:39-54](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/calc_vowelMeans.m#L39-L54)),
so it is not affected.

### 1.5 Proposed realistic example for the report (OST-F1 card)
- **Design:** "shift the first word", level-detected, two-word utterances, catch trials interleaved (1 in 4),
  same OST and PCF file for every trial; catch = the same PCF with a zero row; `reset` + start/stop per trial.
  Settings are blab's standard ones: female preset, 16 kHz, frameLen 32, nDelay 5, fb 3 with the bundled
  babble at 0.02, F1 +125 mel (`bMelShift 1`).
- **Two OSTs side by side:** blab's measureFormants rules (`RISE_HOLD_POS_SLOPE` → `FALL`, unaffected) and
  blab's own RMS-floor onset (mode 32) → `FALL` (affected). Say explicitly that no public blab experiment
  uses the second combination.
- **Trial sequence:** 0.30, 0.35, **1.20 catch**, 0.30, 0.40, **0.90 catch**, 0.35, 0.30 s first words.
- **Expected vs observed clip:** trial 1 vs trial 4, same first-word length (0.30 s); input and output
  WAVs are in `harness/oct/out/exp/s5_mode32_trial{1,4}_{in,out}.wav`. Expected: only word 1 raised. Observed:
  word 2 also raised (+17.6 % F1, 0.84 s longer), because of a catch trial two trials earlier.
- **Key sentences for the card:** "Reloading the OST or calling AudapterIO('init') does not clear this";
  "which condition the earlier trial had does not matter, only how long its speech lasted".

---

## 2. Experiment profiles (public code)

Link bases (pinned): FS = `https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/`,
SSW = `https://github.com/blab-lab/simonSingleWord/blob/df6712020e59dae86e303d5cea599c2412aaa206/experiment%20scripts/`,
SM = `https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/`,
ATT = `https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/`,
VC = `https://github.com/blab-lab/vsaCentralize/blob/9beb9a7767418cae5d681b35fb1e0cc010331d02/`,
VG = `https://github.com/blab-lab/vsaGeneralize/blob/0ec575ae1cde8402628b6cb5cd756467a95dd11d/`,
VS = `https://github.com/blab-lab/vsaSentence/blob/c01942f1381237fd8c205e06e7c1472d72e4e685/`,
UH = `https://github.com/blab-lab/uhdapter/blob/92aa1c0a45756267d73414d291a0c38fb02d68bc/`.
A citation `VS run_vsaSentence_audapter.m:119-127` means `VS` + `run_vsaSentence_audapter.m#L119-L127`.

### 2.0 Common machinery (every blab experiment)
- **Template loop:** FS [templates/modelExpt/run_modelExpt_audapter.m:52-195](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/templates/modelExpt/run_modelExpt_audapter.m#L52-L195).
  - Before init: clear OST and PCF (:52-53); `p = getAudapterDefaultParams(expt.gender)` plus `expt.audapterParams` (:61-65).
  - Noise: `get_noiseSource` → `setParam datapb` once, fb 3 with fb3Gain 0.02 (:78-81); `AudapterIO('init', p)` once (:86).
  - Per trial: `setParam pertAmp/pertPhi` (:134-137), `reset`, `start` (:143-144), `pause(stimdur)` (:151), `stop` (:154), `getData` (:158).
  - A `bGoodTrial` loop re-runs a trial if the RMS check fails (:117, :164). Trials are saved one per file and merged at the end.
- **Noise:** FS [experiment_helpers/get_noiseSource.m:7-17](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/get_noiseSource.m#L7-L17)
  loads the bundled `mtbabble48k.wav` (479,230 samples) and truncates it to `Audapter('getMaxPBLen')`.
- **Calibration phase, before every formant experiment:** FS [experiment_helpers/run_measureFormants_audapter.m:39-72](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/run_measureFormants_audapter.m#L39-L72).
  - Loads `measureFormantsWorking.ost/.pcf` (copies of [measureFormants.ost](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/measureFormants.ost), PCF all zero), `bShift 0`, fb 3.
  - Then `check_audapterLPC` re-runs the recorded trials offline with other LPC orders (FS experiment_helpers/check_audapterLPC.m:257-262 → speech/audapter_runFrames.m:14-44: clears OST/PCF, init, reset, fresh frame cells). The experimenter picks `nlpc`.
  - `calc_vowelMeans` takes the median `fmts` over the middle 50 % of the OST-defined vowel (states 2-3, [calc_vowelMeans.m:39-54](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/calc_vowelMeans.m#L39-L54)). The result sets each participant's perturbation (shift angles, field centre).
- **measureFormants.ost** (whole file):
  ```
  rmsSlopeWin = 0.050000
  n = 3
  0 INTENSITY_RISE_HOLD_POS_SLOPE 0.01 0.05 {} # Detect the onset the vowel
  2 INTENSITY_FALL   0.03 0.01 {} # Detect the offset of the vowel
  4 OST_END NaN NaN {}
  n = 0
  ```
  Its +1 FALL is numbered like a +2 rule, so it fires twice (state 3 lasts 12 ms, EXP-2).
- **OST adjustment:** audapter_viewer re-derives `ost_stat` offline with edited thresholds. FS [audapter_viewer/calc_newAudapterData.m:91-114](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/audapter_viewer/calc_newAudapterData.m#L91-L114) loads the OST/PCF once, `AudapterIO('init')` once, then `reset` + `runFrame` for each trial. This is a multi-trial offline session, so OST-F1/F2 would apply to it just as online, but blab's rules are safe (EXP-2). Frames are fresh `makecell` slices used once, so I-04 is not triggered.
- **Logged fields the lab uses:**
  - `rms`: good-trial check (check_rmsThresh).
  - `ost_stat` and `fmts`: calibration means and event seeding (calc_vowelMeans, gen_dataVals_from_audapterdata, gen_ostUserEvents_timeAdapt).
  - `signalIn`: offline re-tracking (wave_viewer, audapter_viewer, check_audapterLPC).
  - `fmts`/`sfmts`: monitoring plots and paper figures (subplot_expt_spectrogram, postMan plot_audapterF1, plot_vsaGeneralize_PaperFigs).
  - `signalOut`: listening/QC (gen_sigInOutWavs).
  - `pitchHz`: no public use.
- **Hardware assumptions:** Focusrite USB ASIO at 48 kHz, frame 96 device samples (32 × 3 or 48 × 2). The blab mex README says Gen 4 Focusrites and newer drivers "cause MATLAB to crash". Could that be the LIVE-6 buffer mismatch? Speculative, untested.

### 2.1 attentionComp (attentionAAF): compensation, randomized catch design, dual task
- **Stimuli:** "head", "bed", "dead"; 1.5 s trials, ITI 0.75 + 0–0.75 s ([run_attentionComp_expt.m:51-59](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionComp_expt.m#L51-L59)).
- **Structure:** 33 blocks × 18 trials = 594. Every block has 4 noShift and 1 shiftIH and 1 shiftAE per word, randomized; the first 18 trials are baseline (:104-124). Blocks alternate with and without a random-dot visual task (:136-148).
- **Perturbation:** uniform field, 125 mel toward /ɪ/ or /æ/, with angles from the participant's calibration means (:185-212). `bMelShift 1`, `bRatioShift 0`; OST/PCF cleared ([run_attentionComp_audapter.m:37-55](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionComp_audapter.m#L37-L55)).
- **Parameters:** female/male preset, frameLen 32, nDelay 5, fb 3 with fb3Gain 0.02.
- **How trials run:** per trial `setParam pertAmp/pertPhi`, `reset`, `start`, dots task, `stop`, `getData` (:202-287).
- **attentionAdapt** ([run_attentionAdapt_expt.m:215-246](https://github.com/blab-lab/attentionAAF/blob/0f4ef4301ef10144fcbc2a75b990207a9e9441fd/run_attentionAdapt_expt.m#L215-L246)): same words, baseline 30 / hold 120 / washout 30 / retention 30, 125 mel, same machinery.

### 2.2 coAdapt (simonMulti Exp1): simultaneous opposing adaptation, per word
- **Design:** words "bed", "head", "ted", each assigned 0, +1 or −1 × 125 mel by counterbalancing; F1 only (`pertPhi` 0). 1.4 s trials. Baseline 90, ramp 90, hold 270, washout 90, word order randomized ([run_coAdapt_expt.m:36,98-186](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp1/run_coAdapt_expt.m#L36-L186)).
- **Machinery:** field `setParam pertAmp` per trial, init once, OST/PCF cleared ([run_coAdapt_audapter.m:34-126](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp1/run_coAdapt_audapter.m#L34-L126)). Sets `sRate`/`downFact`/`frameLen` explicitly (48000/3/32).

### 2.3 simonSingleWord (v1, v2): opposing shifts on the two syllables of "bedhead"
- **Stimuli and timing:** "bedhead", 1.8 s trials.
- **Phases:**
  - v1: baseline 30, ramp 30, hold 150, washout 30.
  - v2 ([run_simonSingleWord_v2_expt.m:51-120,272-279](https://github.com/blab-lab/simonSingleWord/blob/df6712020e59dae86e303d5cea599c2412aaa206/experiment%20scripts/run_simonSingleWord_v2_expt.m#L51-L279)): transfer1 80 (8 other /ɛ/ words, fb 2 masking only), baseline 20 (fb 1), ramp 30 (fb 3), hold 200 (fb 3), transfer2 80 (fb 2), washout 10 (fb 1).
- **Shift:** 125 mel; a 9-trial "ost_check" pilot with audapter_viewer tunes the OST thresholds per participant (:181-242).
- **OST** ([bedheadMaster.ost](https://github.com/blab-lab/simonSingleWord/blob/df6712020e59dae86e303d5cea599c2412aaa206/experiment%20scripts/bedheadMaster.ost)):
  ```
  rmsSlopeWin = 0.020000
  n = 5
  0 INTENSITY_RISE_HOLD_POS_SLOPE 0.02 0.008 {} # Voicing onset 1st vowel
  2 NEG_INTENSITY_SLOPE_STRETCH_SPAN 6 -3 {} # Offset 1st vowel
  4 INTENSITY_RISE_HOLD_POS_SLOPE 0.035 0.03 {} # Voicing onset 2nd vowel
  6 NEG_INTENSITY_SLOPE_STRETCH_SPAN 5 -6 {} # Offset 2nd vowel
  8 OST_END NaN NaN {}
  n = 0
  ```
- **PCF:** 9 rows (states 0-8). Each trial, `set_pcf` writes angle 1 into rows 0-3, angle 2 into rows 4-8, and the trial's magnitude into all rows, then the PCF is reloaded ([run_simonSingleWord_v2_audapter.m:132-141](https://github.com/blab-lab/simonSingleWord/blob/df6712020e59dae86e303d5cea599c2412aaa206/experiment%20scripts/run_simonSingleWord_v2_audapter.m#L132-L141)). The whole utterance is shifted, and the direction flips at the detected vowel-1 offset.
- **Parameters:** frameLen 32 at 16 kHz (set explicitly, :55-62), `bMelShift 1`, fb per trial with `AudapterIO('init', p)` **every trial** (:145-148), fb2Gain 0.16 ("77 dB HL").

### 2.4 simonMultisyllable v2 (Exp2) and simonMultisyllable (Exp3)
- **Stimuli:**
  - Exp2: "seven", "sever" shifted; "level" never shifted ([run_simonMultisyllable_v2_expt.m:47](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp2/run_simonMultisyllable_v2_expt.m#L47)).
  - Exp3: "pedigree", "pedicure" shifted; "pedestal", "carbonate" never shifted.
- **Timing and phases:** 2 s trials; baseline 60, ramp 90, hold 210, washout 30 (Exp2), 125 mel.
- **OSTs:** `sevXXXMaster.ost` / `pedXXXMaster.ost` have the same 4-rule structure as bedhead, with thresholds 0.04/0.008, −10 or −3, 0.030/0.05.
- **PCF:** 9 rows. Amplitude only in rows 0-3 (**first vowel only**), angle in all rows; rewritten and reloaded every trial with the OST loaded once and init once ([run_simonMultisyllable_v2_audapter.m:31-121](https://github.com/blab-lab/simonMulti/blob/e05f155dfba07110026688d8f000068cee1c9249/experiment%20scripts/Exp2/run_simonMultisyllable_v2_audapter.m#L31-L121)).
- **Parameters:** `rmsForgFact 0.89` (faster RMS tracking, :56).

### 2.5 vsaCentralize ("vsaAdapt2"): nonuniform 2-D field that centralizes the vowel space
- **Stimuli and timing:** "bead", "bad", "booed", "bod"; 1.5 s trials.
- **Phases:** pre 40; baseline 60, ramp 40, hold 320, washout 40, then retention 40 after a 10-minute pause.
- **Groups:** adapt (maxScaleFact 0.5) and null (0) ([run_vsaAdapt2_expt.m:15-126](https://github.com/blab-lab/vsaCentralize/blob/9beb9a7767418cae5d681b35fb1e0cc010331d02/run_vsaAdapt2_expt.m#L15-L126)).
- **Field:** from free-speech [calc_pertField.m](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/calc_pertField.m#L46-L195) in mel. Grid F1 200-1500 Hz and F2 500-3500 Hz converted to mel (257 × 257); amplitude = distance to the vowel-space centroid, angle toward it. `bShift2D 1`.
- **Per trial:** `pertAmp2D = scale × field` ([run_vsaAdapt2_audapter.m:104-105](https://github.com/blab-lab/vsaCentralize/blob/9beb9a7767418cae5d681b35fb1e0cc010331d02/run_vsaAdapt2_audapter.m#L104-L105)).
- **Grid problem:** the public runner re-sends the lower-case **Hz** grids `pertf1/pertf2` after init (:62-65, again at :165-170). The expt script stores them ([run_vsaAdapt2_expt.m:113-114](https://github.com/blab-lab/vsaCentralize/blob/9beb9a7767418cae5d681b35fb1e0cc010331d02/run_vsaAdapt2_expt.m#L113-L114)) next to calc_pertField's mel `pertF1` (:168). Result: EXP-4(b).
- **Provenance:** the expt script calls `run_vsaAdapt_audapter`, which is not in the repo.

### 2.6 vsaGeneralize
- **Stimuli:** train "bead", "bad", "booed", "bod"; generalize "bid", "bayed", "bed", "bode", "bud"; 1.5 s trials.
- **Phases:** baselineGeneralize 75 (fb 4), baselineTrain 40 + train 280 (fb 3, intended scale 0 and 0.5), generalization 50 (fb 4) ([run_vsaGeneralize_expt.m:15-141](https://github.com/blab-lab/vsaGeneralize/blob/0ec575ae1cde8402628b6cb5cd756467a95dd11d/run_vsaGeneralize_expt.m#L15-L141)).
- **As committed:** the runner scales the 1-D `pertAmp` (zeros) and re-sends Hz grids ([run_vsaGeneralize_audapter.m:54-77,117-118](https://github.com/blab-lab/vsaGeneralize/blob/0ec575ae1cde8402628b6cb5cd756467a95dd11d/run_vsaGeneralize_audapter.m#L54-L118)), so EXP-4(c) applies. It also sets `fb4Gain` instead of `fb4GainDB` (EXP-5).
- **Analysis:** reconstructs the field on Hz grids ([analyze_vsaGeneralize.m:1196-1258](https://github.com/blab-lab/vsaGeneralize/blob/0ec575ae1cde8402628b6cb5cd756467a95dd11d/analyze_vsaGeneralize.m#L1196-L1258)). Data: OSF 78z93.

### 2.7 vsaSentence: centralization trained with sentences
- **Stimuli and timing:** 40 Harvard sentences (4.5 s trials) and 10 transfer words (1.5 s).
- **Phases:** baseline1 40, transfer1 50, baseline2 40, transfer2 50, ramp 40, hold 240, transfer3 50, washout 40, retention 40 ([run_vsaSentence_expt.m:56-161,219-238](https://github.com/blab-lab/vsaSentence/blob/c01942f1381237fd8c205e06e7c1472d72e4e685/run_vsaSentence_expt.m#L56-L238)).
- **Feedback mode:** fb 3 in sentence phases, fb 2 (masking) in transfer phases, with `AudapterIO('init', p)` whenever fb changes ([run_vsaSentence_audapter.m:119-134](https://github.com/blab-lab/vsaSentence/blob/c01942f1381237fd8c205e06e7c1472d72e4e685/run_vsaSentence_audapter.m#L119-L134)).
- **Field:** the same calc_pertField field, sent correctly (mel `pertF1`, :67-71); verified in EXP-4(a).
- **Version note:** its README asks for a blab Audapter "released between 2021 and 2023", i.e. with the 2-D field (2020-11) and the dropout fix deab341 (2020-11-09), and before maxPBSize 480000 (2026-04).

### 2.8 uhdapter: shifted schwa (stress)
- **Stimuli and timing:** "abate", "adept", "above", "beta", "meta"; 1.75 s trials.
- **Phases:** noisebase 50 (fb 2), baseline 110, ramp 20, hold 250 (fb 3), post 50 (fb 2), washout 20 ([run_uhdapter_audapter.m:54-145](https://github.com/blab-lab/uhdapter/blob/92aa1c0a45756267d73414d291a0c38fb02d68bc/run_uhdapter_audapter.m#L54-L145)).
- **Shift:** uniform, maxshift 100.
- **Machinery:** field `setParam` per trial, init on fb change (:227-242), fb3Gain 0.014, fb2Gain 0.16.

### 2.9 Not public / partial
- **timeAdapt (time warping):** only the baseline runner is public ([run_measureDuration_audapter.m:60-131,178](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/run_measureDuration_audapter.m#L60-L178)).
  - Settings: 24 kHz / downFact 2 / frameLen 48, `bPitchShift 1`, PCF reloaded every trial.
  - The OST/PCF files (`ada`/`ata`/`aza`/`asa` Master) are not public.
- **taimComp (formant clamping):** nothing public beyond the Audapter fields.
- **postMan:** analysis only.
- **Passage reading** ([run_passageReading.m:37-55](https://github.com/carrien/free-speech/blob/ec961b7a04a79199217f4973effda9157afcdf9d/experiment_helpers/run_passageReading.m#L37-L55)): one Audapter run for a whole passage, fb 3 plus babble, unaltered feedback, audio not saved.
- **Dead runner:** `run_speechprod_audapter.m` calls `get_noiseSource(noiseWavFN, p)` with two arguments (the function takes one), and sets `p.datapb`, which AudapterIO never forwards.

---

## 3. Findings × real experiments

Legend:
- **AFFECTED**: the triggering condition is in their code.
- **SAFE**: the condition is absent, with the reason.
- **COULD**: triggers only if a stated, non-public or plausible variant holds.

| Finding | Real designs | Verdict and expected real-life effect |
|---|---|---|
| **OST-F1** state leak | SimOn (bedhead/sev/ped), measureFormants, audapter_viewer offline recompute | **SAFE**. All onset/offset rules refresh `lastStatEnd`; confirmed order-invariant (EXP-2, EXP-9). **COULD**: any lab OST with FALL after mode 32 / ELAPSED_TIME / ratio rules. Then one long trial prolongs the perturbation in every later trial, and it ratchets (EXP-9). timeAdapt/taimComp OSTs unknown. |
| **OST-F2** maxIOI | none (all public OSTs have `n = 0`) | **SAFE**. COULD for any OST with a maxIOI section and no reload (CORPUS-15). An OST reload fixes it (statOnsetIndices re-calloc'd) but not OST-F1. |
| **I-01** masking-noise gap | every blab runner (get_noiseSource, fb 2/3) | **AFFECTED only on b2.4/b2.5** (from 2026-04): a 16 ms hole every 9.98 s of running time, in about 1 of every 5.5 trials of 1.8 s, at a moving position (EXP-3). fb 2 transfer/noisebase phases are the worst, since only the babble masks the voice. **SAFE before b2.4**: truncation to 230400 made the loop seamless. |
| **OST-F4** PCF shorter than OST | bedhead/sev/ped 9 rows for states 0-8; measureFormants 5 rows for 0-4 | **SAFE**. |
| **FMT-F1** clamp setter length | taimComp only (not public); defaults pad to 2048 | **COULD** (unknown). |
| **PT-5** pvoc level step | timeAdapt baseline (`bPitchShift 1`) | **AFFECTED (constant offset)**. At their 24 kHz/frameLen 48 settings the pvoc adds **+6.0 dB**, not +3.5 (EXP-11), on every trial with pvoc on. Relative to phases run at bPitchShift 0 (the measureFormants calibration) the participant is ~6 dB louder. No pitch shifts in public designs, so no onset step. |
| **I-04** runFrame in place | audapter_runFrames, calc_newAudapterData, check_audapterLPC | **SAFE**: fresh frame cells, each used once. |
| **OST-F8** AND_RATIO `{}` | no public OST uses modes 40/45 | **COULD**: the modes were added to blab in 2023-04 (#8), presumably for an experiment; not public. |
| **I-02** fb 5 dScale | no public runner uses fb 5 (added 2026-08) | **SAFE** (public). |
| **F6** re-entry | vsaSentence, vsaCentralize, vsaGeneralize (restricted 2-D field on multi-vowel speech) | **AFFECTED by design, and intended**. The field bounds (F1 283-1291 mel, F2 607-2146 mel) exclude unvoiced frames, so with 2.1.5's one-shot rule a sentence would be perturbed only in its first vowel ≥ 120 ms. vsaSentence depends on the re-arming (commit deab341 "Formant dropout fix", 2020-11-09, right after the 2-D field). The uniform whole-plane fields (attentionComp, coAdapt, uhdapter; F1Min = 0) are unaffected (CORPUS-18: bit-identical). Real-life effect: replications on 2.1.5 or other forks would deliver much less perturbation; `minVowelLen` is dead. |
| **I-03** recorder wrap | longest recorded trials 4.5 s (vsaSentence); passage reading is one long run but not saved, trialLen 0 | **SAFE**. Passage reading crosses the wrap (14.4 s before b2.4, 30 s after) with no audible effect, since no OST, trialLen or ramps are used. |
| **I-08** array lengths | all fields 257 / 257×257 | **SAFE**. |
| **FMT-F3** lower-left cell | VSA 2-D fields | **AFFECTED, negligible**: grid step ≈ 3.9 mel (F1) × 6.0 mel (F2), so at scale 0.5 the error is ≤ ~3.5 mel. |
| **PLAYGROUND-4** edge clamping | VSA: F1Min..F2Max = grid ends | **SAFE**: nothing is shifted outside the grid. |
| **13** clamp logs in silence | taimComp | **COULD** (not public). |
| **14** tsg overflow | none | SAFE. |
| **FMT-F15 / CORPUS-10** stale tracker / hang | runners change frameLen only together with sRate (16 k/32 ↔ 24 k/48), always followed by AudapterIO('init'); an `srate` change rebuilds the tracker | **SAFE**. COULD if a lab changes frameLen/nDelay at a fixed rate (e.g. TDS 64/7 after 32/5). |
| **OST-F5** pitchShiftRatio mutation | no pitch PCFs in public designs | **COULD**: pitch catch trials made by clearing the PCF after a trial that ended mid-shift get the full shift (EXP-8). |
| **OST-F6 / F10 / F7** reload/truncation/sparse | timeAdapt/SimOn reload the PCF every trial while stopped, with well-formed files | SAFE with their files. COULD: `set_pcf` writes the file that is then parsed, so a failed write (e.g. an interrupted edit) would hit F10. |
| **PT-2** RMS clip | `bRMSClip 0` | SAFE. |
| **PT-3 / PT-4 / 17f / CORPUS-8 / CORPUS-9** TDS | none | SAFE (public). `pitchHz` is 0 unless TDS is on (PLAYGROUND-2). |
| **17e / F17** warp+pitch | timeAdapt (warp only) | SAFE unless their PCF also shifts pitch (not public). |
| **17g** resampling filter by sr | timeAdapt 24 kHz / downFact 2; everything else 16 kHz / 3 | **SAFE**: `p.sr >= 24000` selects the second filter branch ([Audapter.cpp:1457-1485](https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/Audapter.cpp#L1457-L1485)), which matches 48→24 kHz. The two blab rate/downFact pairs are both matched cases; mismatches need pairs like 32000/3. |
| **H2 / PT-1**, **H1**, **F3** (OOB reads) | everyone | UB on every trial; no observed behavioural effect. |
| **I-05** rms_slope NaN first frames | slope-based blab OSTs | SAFE: the first 20-50 ms of a trial are silence (pre-voice). |
| **21** MATLAB-side defaults | everyone (getAudapterDefaultParams) | `rmsRatioThresh 0.7` and the `closedLoopGain` quirk apply to all; the lab passes no varargin, so the copy-paste bug is not triggered. |
| **FMT-F9** tracker `last_f` | everyone | **AFFECTED, negligible**: the first trial of each MATLAB session logs different onset `fmts` for ~36 ms (EXP-10); `calc_vowelMeans` is unaffected. |
| **COORD-1** leftover OST/PCF | every session: measureFormants calibration, then the experiment | **SAFE because of the explicit clears** in every runner; without them the field is fully suppressed, or noShift trials get +125 mel (EXP-7). |
| **COORD-2** | n/a (presentation) | — |
| **COORD-3** | SimOn/measureFormants use the safe onset family | Their real designs are the SAFE arm of COORD-3. |
| **PLAYGROUND-2** logging semantics | postMan/vsaGeneralize figures plot `fmts` vs `sfmts`; PCF designs log `sfmts = 0` in unperturbed states | **Relevant for readers of blab data**: in SimOn, `sfmts > 0` means "PCF row nonzero", not "shifted" (all rows nonzero on hold trials); in field designs `sfmts == fmts` on noShift trials. |
| **CORPUS-3 / CORPUS-4** presets | adults only | Mitigated by the per-participant `check_audapterLPC` step, which picks nLPC by eye. |
| **CORPUS-7** pvoc LF boost | timeAdapt (pvoc on) | AFFECTED if low-frequency noise is present; +3.8 dB SNR loss at the ear for LF noise (measured at 16 kHz; not re-measured at 24 kHz). |
| **CORPUS-11** unbounded targets | mel-mode absolute shifts of 125 mel | SAFE. |
| **LIVE-1 / LIVE-3** reload or reset while audio runs | every runner stops first (`stop` → `pcf`/`init` → `reset` → `start`) | **SAFE** (LIVE-10: this flow is race-free). |
| **LIVE-6** buffer mismatch | Focusrite at 96-sample frames | COULD if the driver buffer is not 96. The README's crash note for Gen 4 or new drivers is worth checking against LIVE-6 (speculative). |
| **New (EXP-4)** VSA grid/scaling wiring | vsaCentralize (public runner), vsaGeneralize | **AFFECTED as committed**: wrong-direction or unscaled centralization. Audapter gives no warning. |
| **New (EXP-5)** ignored `fb4Gain` | vsaGeneralize fb 4 phases | **AFFECTED**: +10.2 dB louder masking noise than the script requests. |
| **New (EXP-11)** pvoc +6 dB at frameLen 48 | timeAdapt | see PT-5. |

---

## 4. Confirmations run (all public-sourced; `audit/harness/oct/`)

| Script | What | Log |
|---|---|---|
| `exp_simon_session.m` | bedhead/sev/ped OSTs with the lab loop, forward vs reversed; measureFormants double FALL | EXP-2 |
| `exp_noise_session.m` (+ `VARIANT=upstream`) | get_noiseSource babble, fb 2 transfer phase, 24 × 1.8 s | EXP-3 |
| `exp_vsa_field.m` (+ `exp_shims/`) | calc_pertField fields wired as each VSA runner does; fb4Gain | EXP-4, EXP-5 |
| `exp_mixed.m` S1-S5, S4b; `exp_trial.m` | mixed designs: carry-over | EXP-6 … EXP-9 |
| `exp_s5_measure.m` | independent F1 of the S5 expected/observed clips | EXP-9 |
| `exp_mixed_diag.m` | first-trial-of-session difference | EXP-10 |
| `exp_timeadapt_pvoc.m`, `exp_pvoc_rate.m` | pvoc gain at timeAdapt settings | EXP-11 |

Not run (no triggering public design): OST-F2, OST-F8, CORPUS-8 and CORPUS-10 under real designs. None of the public
designs contains their trigger (no maxIOI, no modes 40/45, no TDS, no frameLen change at a fixed rate).

---

## 5. Proposals

### 5.1 Realistic example per report card

| Card | Use instead | What it would show |
|---|---|---|
| **OST-F1** | Section 1.5: "shift the first word" with catch trials, settings from blab's standard runners, their measureFormants rules vs blab's mode-32 onset, same OST/PCF all session, reset only; trial sequence 0.30, 0.35, 1.20-catch, 0.30, 0.40, 0.90-catch, 0.35, 0.30 s | Safe arm: every shift ends 0.08 s after word 1. Leaking arm: after one long catch trial, word 2 is also raised (+17.6 % F1, 0.84 s), and it never recovers; reloading the OST does not fix it. Say that blab's published SimOn designs use the safe rules. |
| **OST-F2** | Keep CORPUS-15 (real quiet speakers), but frame it as "any OST with a maxIOI timeout, not reloaded between trials, e.g. a 'perturb 200 ms after onset or at timeout' design". State that no public blab OST uses maxIOI, and that an OST reload avoids this particular bug. | Timeout drifts 0.2 → 0.4 → 0.6 s over trials. |
| **I-01** | simonSingleWord_v2 transfer phase: fb 2 masking at fb2Gain 0.16, bundled babble via get_noiseSource, 1.8 s trials, init every trial | 16 ms of silence in about 1 of 5.5 trials, at a different point each time; only on b2.4/b2.5 (since 2026-04). Before that, no gap. Drop the "lab's own 5 s noise file" example, or keep it as the second case. |
| **OST-F4** | measureFormants-style OST with a PCF written only up to the last perturbed state (e.g. a 3-row PCF for the 5-state measureFormants OST, as a lab trimming unused rows would produce) | Garbage perturbation in states 3-4. Say that the lab's own files have the full row count. |
| **FMT-F1** | taimComp-style clamp (not public): keep the synthetic, but tie it to the documented field `clamp_f1/clamp_f2` of 2048 and to the defaults padding | as now |
| **PT-5** | Two realistic contexts: (a) timeAdapt baseline settings (24 kHz, frameLen 48, bPitchShift 1 for time warping), where the constant offset is **+6.0 dB**; (b) a pitch-reflex design (PCF +2 st mid-utterance) for the onset step | (a) is a real blab setting; (b) stays generic. |
| **I-04** | Offline reprocessing that reuses the same frame cell array twice (e.g. running check_audapterLPC-style loops on one `makecell` result for two LPC orders) | Second run processes processed audio. Say that blab's helpers rebuild the frames, so they are safe. |
| **OST-F8** | Keep low severity; example: an AND_RATIO fricative-onset rule written with the manual's `{}` in field 5 | as now (no public blab use) |
| **I-02** | fb 5 was added to blab in 2026-08 with no public experiment; keep the generic example | as now |
| **F6** | vsaSentence: calc_pertField centralization field (scale 0.5) on a real sentence (CMU ARCTIC), one-shot rule vs current | Current: every vowel of the sentence is centralized (what vsaSentence needs). One-shot (2.1.5 semantics): only the first vowel. Frame the finding as an undocumented behaviour change that the lab's sentence design depends on (and dead `minVowelLen`), not as a defect for blab. |
| **I-03** | A longer continuous task, e.g. passage reading recorded with an OST or trialLen, or a 35 s sustained-phonation trial | Say that blab's passage reading is not saved and uses no OST, so it is unaffected. |
| **COORD-1** | Every blab session: measureFormants calibration (all-zero PCF) → field experiment; and SimOn hold → field noShift | "Remove the two clear lines from the runner": the shift disappears (0 vs 0.442 s), or noShift trials get +125 mel. Blab's runners have the lines. |
| **CORPUS-8** | No blab use; keep as is (TDS is not in public blab designs) | — |
| **CORPUS-10** | No blab trigger (frameLen changes only with sRate); keep, noting the safe pattern | — |
| **CORPUS-11** | Keep (2008 upstream trial) | — |
| **LIVE-1 / LIVE-3** | Contrast with the lab loop (stop → reload → start), which is safe (LIVE-10); the risk is "always-on" designs | — |
| **LIVE-6** | Focusrite at 48 kHz with a driver buffer other than 96 | Link to the blab README's driver note (speculative). |
| **OST-F5** (short card) | Sustained-vowel pitch catch trial by `Audapter('pcf','',0)` after a trial that ended mid-shift | +200 cents on the catch trial, logged ratio 1.1225 (EXP-8); a zero PCF avoids it. |

### 5.2 New findings and checks suggested by the real designs
1. **Silent acceptance of inconsistent field setups (EXP-4):** Audapter should warn when:
   - `pertF1`/`pertF2` are not within F1Min..F1Max / F2Min..F2Max;
   - `bShift2D = 1` while `pertAmp2D` is all zero, or `bShift2D = 0` while `pertAmp2D` is non-zero;
   - `bMelShift = 1` and the grid looks like Hz (max > ~2200 for F1).

   Separately, `setParam` names are case-insensitive, so `pertf1` and `pertF1` are the same parameter. MATLAB struct fields are not, so two fields in `p` can silently fight.
2. **AudapterIO ignores unknown fields in `p` (EXP-5):** add a warning listing fields not forwarded (e.g. `fb4Gain`, `datapb`).
3. **pvoc gain depends on frameLen (EXP-11):** +6.02 dB at frameLen 48 vs +3.52 dB at 32/64. Locate it in phase_vocoder.cpp and add it to the PT-5 card/fix.
4. **`lastStatEnd` survives OST reload and AudapterIO('init') (EXP-9):** the report should say explicitly that reloading is **not** a workaround for OST-F1, whereas it is one for OST-F2.
5. **measureFormants.ost numbers a +1 rule as +2 (EXP-2):** a load-time validator (ost-pcf Ideas 1) would flag the lab's own calibration file. Harmless there, but it shows the rule-increment confusion is real in practice.
6. **bundled babble length vs maxPBSize (EXP-3):** ship `mtbabble48k.wav` padded or trimmed to maxPBSize, or loop at the datapb length. The I-01 fix covers it.
7. **Per-trial `AudapterIO('init')`** (simonSingleWord_v2; vsaSentence/uhdapter on fb change) re-sends every field of `p`. A value changed only with `setParam` since the last init is silently reverted. The lab stores values in `p` first; a check or documentation note would help others.
8. **Offline OST recomputation in audapter_viewer** runs a multi-trial session in one process (`calc_newAudapterData`). Any OST-F1/F2 exposure applies to the "recomputed" `ost_calc` too, so the viewer can disagree with what happened online. Suggest a reset per trial, or reloading the MEX, in that helper.
9. **Ask the lab (for the report text, not for code):** the timeAdapt and taimComp OST/PCF files, and whether the vsaCentralize/vsaGeneralize data were collected with the committed runners. The public logs on OSF (vsaGeneralize 78z93, vsaSentence 3fhbg) contain `sfmts`/`fmts`, which would settle EXP-4 directly.

---

## 6. Limits and things not done
- Public code only. Private blab repos were deliberately not accessed (see top).
- **Provenance:** the committed runners may differ from what ran. The vsaCentralize expt calls a runner that is not in the repo; the repos are single-snapshot commits.
- **Stimuli:** synthetic words stand in for the lab's single words (bedhead, seven, head/bed/dead); real CMU ARCTIC clips were used in S1 and PT-5 (EXP-11). The SimOn OSTs were not tuned per speaker as the lab does in its ost_check phase.
- **Live path:** everything ran on the offline `runFrame` path (identical DSP per VERIFY-LIVE). Timing between `stop` and the next `start` is not modelled; it does not matter for the state examined here.
