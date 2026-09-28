# labrun: vsaGeneralize

- status: **completed** 
- device trials: 466 (audio 466); virtual time 1266.3 s (audio 699.0 s); wall 278.8 s; speed 4.5x virtual, 2.5x audio
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
| mismatch | pertF1 | pertf1 | [1x257 min 283 max 1290 mean 786.405 rms 838.841 hash ac960631f0] | [1x257 min 200 max 1500 mean 849.51 rms 929.295 hash 10839e31c3] | 445 trials (22-466) |
| mismatch | pertF2 | pertf2 | [1x257 min 607 max 2019 mean 1312.89 rms 1375.17 hash 04b5d4040e] | [1x257 min 500 max 3500 mean 1999.52 rms 2180.35 hash a41f9db57d] | 445 trials (22-466) |
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 466 trials (1-466) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 466 trials (1-466) |
| unknown | fCen |  | [762.079 1391.65] |  | 445 trials (22-466) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (22-466) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 61 | 1.50 | 0.208 | 61 / 562 | 1.203 | 1.262 | 1.310 | 1.400 | -3 | -5.50 | 7.9 | 6 |
| baselineGeneralize | 75 | 1.50 | 0.321 | 173 / 932 | 0.911 | 1.267 | 0.915 | 1.268 | 862 | -7.04 | 14.9 | 0 |
| train | 280 | 1.50 | 0.318 | 103 / 865 | 1.321 | 1.425 | 1.325 | 1.426 | -4 | -7.63 | 7.6 | 28 |
| generalization | 50 | 1.50 | 0.322 | 173 / 932 | 0.900 | 1.265 | 0.901 | 1.259 | 842 | -7.03 | 9.9 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
