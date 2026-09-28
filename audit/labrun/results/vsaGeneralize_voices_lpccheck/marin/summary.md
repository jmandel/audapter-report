# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 78.9 s; speed 1.1x virtual, 0.4x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 12 of 22 passed the checks
  - failed trial 5: voice left in the residual (beta -0.992); residual 60.2 dB above the pre-onset output
  - failed trial 6: voice left in the residual (beta -0.955); residual 58.3 dB above the pre-onset output
  - failed trial 7: voice left in the residual (beta -0.997); residual 55.3 dB above the pre-onset output
  - failed trial 8: fmts differ (2.12e+03 Hz); voice left in the residual (beta -1.010); residual 57.8 dB above the pre-onset output
  - failed trial 9: voice left in the residual (beta -0.954); residual 61.9 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -0.956); residual 62.2 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.019); residual 60.3 dB above the pre-onset output
  - failed trial 20: voice left in the residual (beta -1.074); residual 53.4 dB above the pre-onset output
  - failed trial 21: voice left in the residual (beta -0.806); residual 53.0 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -0.933); residual 59.0 dB above the pre-onset output

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
| unknown | fCen |  | [694.793 1417.93] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.205 | -16 / 478 | 0.983 | 1.264 | 0.990 | 1.540 | 90 | -5.72 | 8.0 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.326 | 43 / 908 | 0.666 | 0.856 | 0.690 | 0.891 | -19 | -5.12 | 26.7 | 0 |
| train | 4 | 1.50 | 0.378 | -19 / 952 | 1.037 | 1.581 | 1.061 | 1.581 | 47 | -9.59 | 7.9 | 1 |
| generalization | 5 | 1.50 | 0.364 | 27 / 915 | 0.661 | 0.784 | 0.651 | 0.811 | 115 | -5.36 | 24.7 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
