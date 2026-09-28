# labrun: vsaGeneralize

- status: **completed** 
- device trials: 22 (audio 22); virtual time 83.6 s (audio 33.0 s); wall 78.8 s; speed 1.1x virtual, 0.4x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 12 of 22 passed the checks
  - failed trial 5: voice left in the residual (beta -0.895); residual 62.4 dB above the pre-onset output
  - failed trial 6: voice left in the residual (beta -1.045); residual 57.9 dB above the pre-onset output
  - failed trial 7: voice left in the residual (beta -1.030); residual 59.7 dB above the pre-onset output
  - failed trial 8: voice left in the residual (beta -1.083); residual 56.7 dB above the pre-onset output
  - failed trial 9: voice left in the residual (beta -1.002); residual 62.9 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -0.987); residual 62.9 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -0.983); residual 52.2 dB above the pre-onset output
  - failed trial 20: voice left in the residual (beta -0.913); residual 57.9 dB above the pre-onset output
  - failed trial 21: voice left in the residual (beta -0.883); residual 58.2 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -1.012); residual 64.6 dB above the pre-onset output

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
| unknown | fCen |  | [582.591 1294.01] |  | 18 trials (5-22) |
| unknown | fb4Gain |  | 0.98 |  | 10 trials (5-22) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 8 | 1.50 | 0.179 | -15 / 339 | 1.012 | 1.256 | 1.016 | 1.518 | 198 | -4.88 | 8.0 | 0 |
| baselineGeneralize | 5 | 1.50 | 0.266 | -25 / 650 | 0.771 | 0.985 | 0.771 | 0.985 | 766 | -5.18 | 9.5 | 0 |
| train | 4 | 1.50 | 0.274 | -60 / 690 | 1.058 | 1.511 | 1.070 | 1.542 | 126 | -7.24 | 7.9 | 1 |
| generalization | 5 | 1.50 | 0.320 | -16 / 660 | 0.910 | 0.907 | 0.910 | 0.907 | 783 | -5.16 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
