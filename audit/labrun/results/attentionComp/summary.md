# labrun: attentionComp

- status: **completed** 
- device trials: 51 (audio 51); virtual time 507.4 s (audio 77.1 s); wall 34.7 s; speed 14.6x virtual, 2.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? yes/no:`
  - `[Test mode only] Enter a coherence [0-1], or leave blank to run coherence testing:`
  - `Enter [y] to move on to pretest phase:`
  - `Run duration practice? [skip/run]`
- load-time transformations: 16 lines (transforms.tsv)

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 51 trials (1-51) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 51 trials (1-51) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 42 | 1.51 | 0.000 | 0 / 0 | 0.997 | 1.000 | NaN | NaN | -3 | -1.94 | 8.0 | 5 |
| shiftIH | 5 | 1.52 | 0.488 | -132 / 159 | 0.852 | 1.097 | 0.848 | 1.100 | 1 | 1.01 | 13.1 | 0 |
| shiftAE | 4 | 1.52 | 0.516 | -97 / 249 | 0.855 | 1.109 | 0.850 | 1.111 | 1 | -0.95 | 13.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
