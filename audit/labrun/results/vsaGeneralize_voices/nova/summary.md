# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 31.3 s; speed 2.7x virtual, 1.1x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
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
| mismatch | pertF1 | pertf1 | [1x257 min 283 max 1290 mean 786.405 rms 838.841 hash ac960631f0] | [1x257 min 200 max 1500 mean 849.51 rms 929.295 hash 10839e31c3] | 18 trials (5-22) |
| mismatch | pertF2 | pertf2 | [1x257 min 607 max 2019 mean 1312.89 rms 1375.17 hash 04b5d4040e] | [1x257 min 500 max 3500 mean 1999.52 rms 2180.35 hash a41f9db57d] | 18 trials (5-22) |
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 22 trials (1-22) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 22 trials (1-22) |
| unknown | fCen |  | [694.798 1425.85] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.157 | -10 / 486 | 1.098 | 1.298 | 1.215 | 1.607 | 63 | -5.98 | 8.0 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.302 | 12 / 916 | 0.669 | 1.023 | 0.656 | 0.916 | 308 | -5.05 | 22.0 | 0 |
| train | 4 | 1.50 | 0.301 | -16 / 950 | 1.099 | 1.475 | 1.090 | 1.474 | -23 | -8.90 | 7.9 | 1 |
| generalization | 5 | 1.50 | 0.308 | 30 / 932 | 1.206 | 1.058 | 1.204 | 1.030 | 449 | -5.53 | 16.7 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
