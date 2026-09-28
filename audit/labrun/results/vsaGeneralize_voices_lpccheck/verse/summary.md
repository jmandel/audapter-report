# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 82.2 s; speed 1.0x virtual, 0.4x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 12 of 22 passed the checks
  - failed trial 5: voice left in the residual (beta -0.925); residual 43.7 dB above the pre-onset output
  - failed trial 6: voice left in the residual (beta -1.040); residual 56.4 dB above the pre-onset output
  - failed trial 7: voice left in the residual (beta -1.041); residual 58.9 dB above the pre-onset output
  - failed trial 8: voice left in the residual (beta -0.912); residual 51.4 dB above the pre-onset output
  - failed trial 9: voice left in the residual (beta -0.949); residual 60.5 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -1.042); residual 60.9 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -0.989); residual 56.6 dB above the pre-onset output
  - failed trial 20: voice left in the residual (beta -0.936); residual 57.7 dB above the pre-onset output
  - failed trial 21: voice left in the residual (beta -1.083); residual 55.1 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -0.994); residual 47.9 dB above the pre-onset output

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
| unknown | fCen |  | [668.292 1347.85] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.170 | 4 / 393 | 1.071 | 1.301 | 1.132 | 1.602 | 273 | -5.89 | 7.9 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.266 | 16 / 750 | 0.731 | 0.856 | 0.727 | 0.855 | 910 | -5.10 | 8.7 | 0 |
| train | 4 | 1.50 | 0.311 | -6 / 787 | 1.154 | 1.592 | 1.156 | 1.593 | 288 | -8.66 | 7.9 | 1 |
| generalization | 5 | 1.50 | 0.298 | 30 / 748 | 0.814 | 1.519 | 0.800 | 1.489 | 575 | -5.04 | 8.8 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
