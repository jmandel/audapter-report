# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 32.0 s; speed 2.6x virtual, 1.0x audio
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
| unknown | fCen |  | [695.588 1397.92] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.197 | 10 / 448 | 1.077 | 1.458 | 1.151 | 1.612 | 36 | -5.16 | 7.9 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.308 | 32 / 865 | 0.674 | 0.966 | 0.645 | 0.962 | 350 | -5.16 | 9.9 | 0 |
| train | 4 | 1.50 | 0.325 | 6 / 896 | 1.094 | 1.623 | 1.091 | 1.625 | 100 | -10.57 | 7.4 | 1 |
| generalization | 5 | 1.50 | 0.356 | 12 / 866 | 0.674 | 0.819 | 0.670 | 0.800 | 190 | -5.40 | 35.1 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
