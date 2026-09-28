# labrun: vsaGeneralize

- status: **completed** 
- device trials: 465 (audio 465); virtual time 1259.8 s (audio 697.5 s); wall 587.7 s; speed 2.1x virtual, 1.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 327 of 465 passed the checks
  - failed trial 21: voice left in the residual (beta -1.011); residual 37.9 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -0.982); residual 57.3 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -1.021); residual 37.3 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.942); residual 58.3 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.013); residual 30.5 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.014); residual 56.3 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -0.972); residual 58.0 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.053); residual 42.4 dB above the pre-onset output
  - failed trial 29: voice left in the residual (beta -1.006); residual 42.6 dB above the pre-onset output
  - failed trial 30: voice left in the residual (beta -0.949); residual 39.0 dB above the pre-onset output
  - failed trial 31: voice left in the residual (beta -0.978); residual 60.4 dB above the pre-onset output
  - failed trial 32: voice left in the residual (beta -0.994); residual 62.2 dB above the pre-onset output
  - failed trial 33: voice left in the residual (beta -0.994); residual 60.9 dB above the pre-onset output
  - failed trial 34: voice left in the residual (beta -0.988); residual 50.6 dB above the pre-onset output
  - failed trial 35: voice left in the residual (beta -1.021); residual 44.7 dB above the pre-onset output
  - failed trial 36: voice left in the residual (beta -0.998); residual 59.9 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -0.966); residual 46.5 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -1.019); residual 45.0 dB above the pre-onset output
  - failed trial 39: voice left in the residual (beta -1.046); residual 35.6 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -1.014); residual 40.1 dB above the pre-onset output

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
| unknown | fCen |  | [592.336 1272.56] |  | 445 trials (21-465) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (21-465) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 60 | 1.50 | 0.233 | -2 / 431 | 1.104 | 1.369 | 1.154 | 1.552 | 349 | -6.20 | 7.9 | 5 |
| baselineGeneralize | 75 | 1.50 | 0.295 | 5 / 608 | 0.941 | 1.138 | 1.001 | 1.145 | 1125 | -4.99 | 24.7 | 0 |
| train | 280 | 1.50 | 0.347 | -4 / 648 | 1.151 | 1.548 | 1.152 | 1.547 | 409 | -8.30 | 7.9 | 21 |
| generalization | 50 | 1.50 | 0.292 | 4 / 608 | 0.919 | 1.226 | 0.915 | 1.240 | 1149 | -4.99 | 23.7 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
