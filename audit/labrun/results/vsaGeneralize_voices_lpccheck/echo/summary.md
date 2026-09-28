# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 83.5 s; speed 1.0x virtual, 0.4x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 11 of 22 passed the checks
  - failed trial 5: voice left in the residual (beta -0.995); residual 31.3 dB above the pre-onset output
  - failed trial 6: voice left in the residual (beta -1.086); residual 58.5 dB above the pre-onset output
  - failed trial 7: voice left in the residual (beta -1.004); residual 41.2 dB above the pre-onset output
  - failed trial 8: fmts differ (629 Hz); voice left in the residual (beta -1.004); residual 55.5 dB above the pre-onset output
  - failed trial 9: voice left in the residual (beta -0.944); residual 57.2 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -0.037)
  - failed trial 18: voice left in the residual (beta -1.005); residual 58.7 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.002); residual 59.9 dB above the pre-onset output
  - failed trial 20: voice left in the residual (beta -1.129); residual 43.6 dB above the pre-onset output
  - failed trial 21: voice left in the residual (beta -0.934); residual 57.9 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -1.005); residual 61.3 dB above the pre-onset output

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
| unknown | fCen |  | [652.863 1373.74] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.166 | -8 / 428 | 1.027 | 1.237 | 1.059 | 1.476 | 161 | -5.24 | 7.6 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.268 | 11 / 824 | 0.754 | 0.834 | 0.787 | 0.830 | 1089 | -5.58 | 44.5 | 0 |
| train | 4 | 1.50 | 0.291 | -21 / 853 | 1.056 | 1.516 | 1.061 | 1.515 | 58 | -7.77 | 7.9 | 1 |
| generalization | 5 | 1.50 | 0.300 | -26 / 821 | 0.723 | 0.810 | 0.720 | 0.818 | 998 | -5.56 | 15.8 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
