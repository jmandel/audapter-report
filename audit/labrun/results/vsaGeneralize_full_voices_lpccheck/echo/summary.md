# labrun: vsaGeneralize

- status: **completed** 
- device trials: 465 (audio 465); virtual time 1259.8 s (audio 697.5 s); wall 591.9 s; speed 2.1x virtual, 1.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 317 of 465 passed the checks
  - failed trial 21: voice left in the residual (beta -1.015); residual 31.8 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -0.962); residual 57.5 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -0.975); residual 39.8 dB above the pre-onset output
  - failed trial 24: fmts differ (1.2e+03 Hz); voice left in the residual (beta -1.001); residual 56.3 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.019); residual 57.5 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.066); residual 62.4 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -0.976); residual 57.2 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.114); residual 44.9 dB above the pre-onset output
  - failed trial 29: voice left in the residual (beta -1.078); residual 62.1 dB above the pre-onset output
  - failed trial 30: voice left in the residual (beta -1.005); residual 54.2 dB above the pre-onset output
  - failed trial 31: voice left in the residual (beta -0.894); residual 58.9 dB above the pre-onset output
  - failed trial 32: voice left in the residual (beta -1.000); residual 64.3 dB above the pre-onset output
  - failed trial 33: voice left in the residual (beta -1.009); residual 60.4 dB above the pre-onset output
  - failed trial 34: voice left in the residual (beta -1.075); residual 59.8 dB above the pre-onset output
  - failed trial 35: voice left in the residual (beta -1.003); residual 61.9 dB above the pre-onset output
  - failed trial 36: voice left in the residual (beta -1.126); residual 58.5 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -0.922); residual 63.0 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -1.033); residual 59.9 dB above the pre-onset output
  - failed trial 39: voice left in the residual (beta -1.074); residual 60.2 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.980); residual 59.7 dB above the pre-onset output

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
| unknown | fCen |  | [659.991 1380.27] |  | 445 trials (21-465) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (21-465) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 60 | 1.50 | 0.213 | -14 / 583 | 1.031 | 1.348 | 1.055 | 1.527 | 163 | -6.13 | 7.9 | 6 |
| baselineGeneralize | 75 | 1.50 | 0.286 | -10 / 843 | 0.885 | 1.292 | 0.884 | 1.249 | 1029 | -5.27 | 20.1 | 0 |
| train | 280 | 1.50 | 0.319 | -22 / 874 | 1.050 | 1.529 | 1.049 | 1.533 | 181 | -8.30 | 7.9 | 26 |
| generalization | 50 | 1.50 | 0.286 | -11 / 842 | 0.792 | 1.202 | 0.790 | 1.210 | 1009 | -5.36 | 18.2 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
