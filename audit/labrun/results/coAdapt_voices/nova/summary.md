# labrun: coAdapt

- status: **completed** 
- device trials: 66 (audio 66); virtual time 201.8 s (audio 93.0 s); wall 58.7 s; speed 3.4x virtual, 1.6x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 60 of 66 passed the checks
  - failed trial 9: fmts differ (115 Hz); sfmts differ (115 Hz)
  - failed trial 21: fmts differ (113 Hz); sfmts differ (113 Hz)
  - failed trial 32: fmts differ (206 Hz); sfmts differ (206 Hz)
  - failed trial 44: fmts differ (153 Hz); sfmts differ (153 Hz)
  - failed trial 50: fmts differ (193 Hz); sfmts differ (193 Hz)
  - failed trial 55: fmts differ (120 Hz); sfmts differ (120 Hz)

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
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 1.015 | 0.999 | NaN | NaN | 13 | -1.93 | 8.0 | 0 |
| baseline | 12 | 1.40 | 0.000 | 0 / 0 | 1.004 | 1.002 | NaN | NaN | 48 | -1.93 | 8.0 | 1 |
| ramp | 12 | 1.40 | 0.125 | 2 / 0 | 1.009 | 1.006 | 1.002 | 1.003 | 44 | -1.67 | 8.0 | 0 |
| hold | 24 | 1.40 | 0.165 | 5 / 0 | 1.007 | 1.001 | 1.011 | 1.000 | 92 | -1.12 | 8.0 | 4 |
| washout | 12 | 1.40 | 0.000 | 0 / 0 | 1.001 | 1.001 | NaN | NaN | 39 | -1.95 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
