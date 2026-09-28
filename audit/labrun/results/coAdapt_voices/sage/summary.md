# labrun: coAdapt

- status: **completed** 
- device trials: 66 (audio 66); virtual time 201.8 s (audio 93.0 s); wall 61.1 s; speed 3.3x virtual, 1.5x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 46 of 66 passed the checks
  - failed trial 8: fmts differ (88.7 Hz); sfmts differ (88.7 Hz)
  - failed trial 10: fmts differ (163 Hz); sfmts differ (163 Hz)
  - failed trial 17: fmts differ (220 Hz); sfmts differ (220 Hz)
  - failed trial 18: fmts differ (122 Hz); sfmts differ (122 Hz)
  - failed trial 19: fmts differ (92.1 Hz); sfmts differ (92.1 Hz)
  - failed trial 23: fmts differ (195 Hz); sfmts differ (195 Hz)
  - failed trial 27: fmts differ (268 Hz); sfmts differ (268 Hz)
  - failed trial 29: fmts differ (243 Hz); sfmts differ (243 Hz)
  - failed trial 31: fmts differ (93.9 Hz); sfmts differ (93.9 Hz)
  - failed trial 35: fmts differ (128 Hz); sfmts differ (128 Hz)
  - failed trial 39: fmts differ (102 Hz); sfmts differ (102 Hz)
  - failed trial 40: fmts differ (218 Hz); sfmts differ (218 Hz)
  - failed trial 42: fmts differ (247 Hz); sfmts differ (247 Hz)
  - failed trial 45: fmts differ (89 Hz); sfmts differ (89 Hz)
  - failed trial 49: fmts differ (199 Hz); sfmts differ (199 Hz)
  - failed trial 53: fmts differ (118 Hz); sfmts differ (118 Hz)
  - failed trial 56: fmts differ (85.3 Hz); sfmts differ (85.3 Hz)
  - failed trial 60: fmts differ (151 Hz); sfmts differ (151 Hz)
  - failed trial 63: fmts differ (204 Hz); sfmts differ (204 Hz)
  - failed trial 66: fmts differ (205 Hz); sfmts differ (205 Hz)

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
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 0.996 | 1.001 | NaN | NaN | -29 | -1.87 | 8.0 | 0 |
| baseline | 12 | 1.40 | 0.000 | 0 / 0 | 0.998 | 1.009 | NaN | NaN | -3 | -1.90 | 8.0 | 1 |
| ramp | 12 | 1.40 | 0.156 | 2 / 0 | 1.008 | 1.050 | 1.008 | 1.065 | -23 | -1.91 | 8.0 | 0 |
| hold | 24 | 1.40 | 0.228 | 5 / 0 | 1.008 | 1.059 | 1.004 | 1.047 | 11 | -1.64 | 8.0 | 1 |
| washout | 12 | 1.40 | 0.000 | 0 / 0 | 1.002 | 1.011 | NaN | NaN | -13 | -1.92 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
