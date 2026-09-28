# labrun: coAdapt

- status: **completed** 
- device trials: 66 (audio 66); virtual time 201.8 s (audio 93.0 s); wall 59.6 s; speed 3.4x virtual, 1.6x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 61 of 66 passed the checks
  - failed trial 9: fmts differ (124 Hz); sfmts differ (124 Hz)
  - failed trial 21: fmts differ (107 Hz); sfmts differ (107 Hz)
  - failed trial 32: fmts differ (136 Hz); sfmts differ (136 Hz)
  - failed trial 44: fmts differ (108 Hz); sfmts differ (108 Hz)
  - failed trial 55: fmts differ (240 Hz); sfmts differ (240 Hz)

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 66 trials (1-66) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 66 trials (1-66) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 0.995 | 0.999 | NaN | NaN | 147 | -1.90 | 8.0 | 0 |
| baseline | 12 | 1.40 | 0.000 | 0 / 0 | 1.000 | 1.001 | NaN | NaN | 81 | -1.90 | 8.0 | 1 |
| ramp | 12 | 1.40 | 0.131 | 3 / 0 | 1.013 | 1.001 | 1.021 | 0.999 | 124 | -1.84 | 8.0 | 0 |
| hold | 24 | 1.40 | 0.177 | 5 / 0 | 1.024 | 1.001 | 1.039 | 1.000 | 132 | -1.73 | 8.0 | 3 |
| washout | 12 | 1.40 | 0.000 | 0 / 0 | 1.001 | 1.001 | NaN | NaN | 84 | -1.95 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
