# labrun: coAdapt

- status: **completed** 
- device trials: 66 (audio 66); virtual time 201.8 s (audio 93.0 s); wall 114.5 s; speed 1.8x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Save LPC order and exit?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 66 of 66 passed the checks

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
| noShift | 6 | 1.50 | 0.000 | 0 / 0 | 1.005 | 0.999 | NaN | NaN | 196 | -1.91 | 8.0 | 0 |
| baseline | 12 | 1.40 | 0.000 | 0 / 0 | 1.001 | 1.000 | NaN | NaN | 175 | -1.93 | 8.0 | 1 |
| ramp | 12 | 1.40 | 0.132 | 2 / 0 | 0.996 | 1.000 | 0.992 | 1.000 | 189 | -1.84 | 8.0 | 0 |
| hold | 24 | 1.40 | 0.180 | 5 / 0 | 1.006 | 1.000 | 1.005 | 1.000 | 168 | -1.69 | 8.0 | 2 |
| washout | 12 | 1.40 | 0.000 | 0 / 0 | 0.999 | 1.000 | NaN | NaN | 178 | -1.91 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
