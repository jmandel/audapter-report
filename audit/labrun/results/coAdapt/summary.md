# labrun: coAdapt

- status: **completed** 
- device trials: 66 (audio 66); virtual time 201.7 s (audio 93.0 s); wall 53.3 s; speed 3.8x virtual, 1.7x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
- load-time transformations: 6 lines (transforms.tsv)

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
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 1.001 | 0.998 | NaN | NaN | -3 | -1.93 | 8.0 | 0 |
| baseline | 12 | 1.40 | 0.000 | 0 / 0 | 0.997 | 1.000 | NaN | NaN | -2 | -1.95 | 8.0 | 1 |
| ramp | 12 | 1.40 | 0.166 | 2 / 0 | 0.997 | 1.000 | 0.993 | 0.999 | -2 | -1.30 | 8.4 | 0 |
| hold | 24 | 1.40 | 0.217 | 6 / 0 | 1.002 | 0.999 | 0.999 | 0.998 | -1 | -0.82 | 9.7 | 3 |
| washout | 12 | 1.40 | 0.000 | 0 / 0 | 0.997 | 1.001 | NaN | NaN | -2 | -1.94 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
