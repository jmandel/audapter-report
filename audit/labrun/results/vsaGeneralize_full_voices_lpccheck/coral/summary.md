# labrun: vsaGeneralize

- status: **completed** 
- device trials: 465 (audio 465); virtual time 1259.8 s (audio 697.5 s); wall 578.3 s; speed 2.2x virtual, 1.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 316 of 465 passed the checks
  - failed trial 21: voice left in the residual (beta -1.007); residual 52.3 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -1.058); residual 57.3 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -1.021); residual 64.0 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.949); residual 56.4 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.968); residual 57.5 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.051); residual 60.7 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.054); residual 61.9 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -0.856); residual 59.6 dB above the pre-onset output
  - failed trial 29: voice left in the residual (beta -0.990); residual 57.1 dB above the pre-onset output
  - failed trial 30: voice left in the residual (beta -1.037); residual 48.3 dB above the pre-onset output
  - failed trial 31: voice left in the residual (beta -0.957); residual 55.1 dB above the pre-onset output
  - failed trial 32: voice left in the residual (beta -1.001); residual 64.0 dB above the pre-onset output
  - failed trial 33: voice left in the residual (beta -1.035); residual 33.8 dB above the pre-onset output
  - failed trial 34: voice left in the residual (beta -1.080); residual 52.3 dB above the pre-onset output
  - failed trial 35: fmts differ (456 Hz); sfmts differ (307 Hz); voice left in the residual (beta -1.144); residual 55.8 dB above the pre-onset output
  - failed trial 36: voice left in the residual (beta -1.121); residual 36.7 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -1.028); residual 34.2 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -0.939); residual 35.6 dB above the pre-onset output
  - failed trial 39: voice left in the residual (beta -0.997); residual 57.8 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.978); residual 55.1 dB above the pre-onset output

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
| unknown | fCen |  | [686.372 1399.95] |  | 445 trials (21-465) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (21-465) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 60 | 1.50 | 0.236 | 1 / 609 | 1.058 | 1.423 | 1.089 | 1.584 | 31 | -6.81 | 8.0 | 5 |
| baselineGeneralize | 75 | 1.50 | 0.310 | 17 / 878 | 0.802 | 1.206 | 0.835 | 1.130 | 164 | -4.97 | 23.2 | 0 |
| train | 280 | 1.50 | 0.352 | -0 / 913 | 1.098 | 1.592 | 1.103 | 1.566 | 46 | -9.24 | 8.0 | 23 |
| generalization | 50 | 1.50 | 0.303 | 16 / 881 | 0.873 | 1.046 | 0.901 | 1.080 | 240 | -4.91 | 15.8 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
