# labrun: vsaGeneralize

- status: **completed** 
- device trials: 465 (audio 465); virtual time 1259.8 s (audio 697.5 s); wall 576.7 s; speed 2.2x virtual, 1.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Please read the following words out [y/n]: bad, bayed, bead, bed bid, bod, bode, booed bud`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 271 of 465 passed the checks
  - failed trial 8: fmts differ (41.5 Hz)
  - failed trial 10: fmts differ (182 Hz)
  - failed trial 16: fmts differ (38.8 Hz)
  - failed trial 20: fmts differ (85.3 Hz)
  - failed trial 21: voice left in the residual (beta -0.913); residual 61.0 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -1.028); residual 57.9 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -0.893); residual 57.8 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.909); residual 57.8 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.967); residual 59.9 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -0.983); residual 49.8 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -0.964); residual 60.5 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -0.979); residual 63.1 dB above the pre-onset output
  - failed trial 29: voice left in the residual (beta -1.050); residual 60.4 dB above the pre-onset output
  - failed trial 30: voice left in the residual (beta -0.928); residual 58.9 dB above the pre-onset output
  - failed trial 31: voice left in the residual (beta -0.871); residual 39.4 dB above the pre-onset output
  - failed trial 32: voice left in the residual (beta -0.953); residual 65.1 dB above the pre-onset output
  - failed trial 33: voice left in the residual (beta -0.981); residual 58.0 dB above the pre-onset output
  - failed trial 34: voice left in the residual (beta -0.856); residual 58.3 dB above the pre-onset output
  - failed trial 35: voice left in the residual (beta -1.056); residual 62.1 dB above the pre-onset output
  - failed trial 36: voice left in the residual (beta -1.069); residual 60.2 dB above the pre-onset output

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
| unknown | fCen |  | [699.693 1422.06] |  | 445 trials (21-465) |
| unknown | fb4Gain |  | 0.98 |  | 125 trials (21-465) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baselineTrain | 60 | 1.50 | 0.203 | -9 / 640 | 1.049 | 1.375 | 1.131 | 1.544 | 37 | -6.88 | 8.0 | 6 |
| baselineGeneralize | 75 | 1.50 | 0.299 | 28 / 925 | 0.811 | 1.295 | 0.825 | 1.308 | 377 | -5.07 | 16.2 | 0 |
| train | 280 | 1.50 | 0.303 | -14 / 961 | 1.078 | 1.568 | 1.085 | 1.559 | 74 | -9.26 | 8.0 | 28 |
| generalization | 50 | 1.50 | 0.301 | 28 / 924 | 0.775 | 0.993 | 0.765 | 1.025 | 266 | -5.01 | 11.3 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
