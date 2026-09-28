# labrun: vsaGeneralize

- status: **completed** 
- device trials: 465 (audio 465); virtual time 1259.8 s (audio 697.5 s); wall 422.8 s; speed 3.0x virtual, 1.6x audio
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
| mismatch | pertF1 | pertf1 | [1x257 min 283 max 1290 mean 786.405 rms 838.841 hash ac960631f0] | [1x257 min 200 max 1500 mean 849.51 rms 929.295 hash 10839e31c3] | 445 trials (21-465) |
| mismatch | pertF2 | pertf2 | [1x257 min 607 max 2019 mean 1312.89 rms 1375.17 hash 04b5d4040e] | [1x257 min 500 max 3500 mean 1999.52 rms 2180.35 hash a41f9db57d] | 445 trials (21-465) |
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 465 trials (1-465) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 465 trials (1-465) |
| unknown | fCen |  | [660.959 1347.15] |  | 445 trials (21-465) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (21-465) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 60 | 1.50 | 0.219 | -4 / 525 | 1.087 | 1.398 | 1.133 | 1.595 | 246 | -6.71 | 7.9 | 5 |
| baselineGeneralize | 75 | 1.50 | 0.282 | 13 / 748 | 0.782 | 1.144 | 0.760 | 1.144 | 803 | -5.13 | 18.4 | 0 |
| train | 280 | 1.50 | 0.329 | -5 / 788 | 1.139 | 1.599 | 1.136 | 1.596 | 302 | -9.09 | 7.9 | 25 |
| generalization | 50 | 1.50 | 0.285 | 12 / 748 | 0.865 | 1.160 | 0.772 | 1.136 | 886 | -5.01 | 16.7 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
