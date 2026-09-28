# labrun: modelExpt

- status: **completed** 
- device trials: 21 (audio 21); virtual time 88.3 s (audio 36.0 s); wall 71.3 s; speed 1.2x virtual, 0.5x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Which group? (1) Normal or (2) perturbed? (1/2):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
  - `Was the LPC check recording good? (yes/no):`
  - `Read instructions, then press ENTER to go to main phase`
  - `\fontsize{10}There is already a file named \color{blue}expt.mat\color{black} here: C:/Users/Public/Documents/experiments//modelExpt/acousticdata/ lr001/perturbed Do you want to overwrite \color{blue}expt.mat\color{black}?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 19 of 21 passed the checks
  - failed trial 13: fmts differ (406 Hz); sfmts differ (406 Hz)
  - failed trial 16: fmts differ (963 Hz); sfmts differ (963 Hz)

## OST/PCF files loaded

| file | kind | hash | first trial | loads |
|---|---|---|---|---|
| measureFormantsWorking.ost | ost | a72d44bb11 | 1 | 1 |
| measureFormantsWorking.pcf | pcf | e665e810b4 | 1 | 1 |

## Intended parameters vs what Audapter reports

The script's parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.
`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO('init') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.

(7 fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)

| kind | field | param | intended | actual | trials |
|---|---|---|---|---|---|
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 21 trials (1-21) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 21 trials (1-21) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 1.017 | 0.999 | NaN | NaN | 0 | -1.92 | 8.0 | 0 |
| baseline | 3 | 1.80 | 0.000 | 0 / 0 | 1.037 | 1.009 | NaN | NaN | 0 | -1.94 | 8.0 | 0 |
| ramp | 3 | 1.80 | 0.197 | 81 / 0 | 1.087 | 1.000 | 1.157 | 1.000 | -11 | -3.30 | 7.9 | 0 |
| hold | 6 | 1.80 | 0.266 | 168 / 0 | 1.211 | 1.001 | 1.227 | 1.001 | 56 | -4.40 | 7.9 | 1 |
| washout | 3 | 1.80 | 0.000 | 0 / 0 | 1.040 | 1.015 | NaN | NaN | 34 | -1.93 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
