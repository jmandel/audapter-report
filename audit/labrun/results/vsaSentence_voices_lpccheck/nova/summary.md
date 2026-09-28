# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 183.6 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 34 of 49 passed the checks
  - failed trial 15: voice left in the residual (beta -0.956); residual 3.1 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -1.060); residual 3.1 dB above the pre-onset output
  - failed trial 17: voice left in the residual (beta -1.033); residual 3.2 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -1.034); residual 3.8 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -0.961); residual 3.7 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -1.001); residual 3.7 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.986); residual 2.1 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -0.994); residual 3.2 dB above the pre-onset output
  - failed trial 27: fmts differ (131 Hz); sfmts differ (131 Hz); voice left in the residual (beta -0.996); residual 2.6 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.018); residual 3.9 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -1.004); residual 2.9 dB above the pre-onset output
  - failed trial 38: fmts differ (1.6e+03 Hz); sfmts differ (1.6e+03 Hz); voice left in the residual (beta -0.987); residual 2.2 dB above the pre-onset output
  - failed trial 39: fmts differ (561 Hz); sfmts differ (561 Hz); voice left in the residual (beta -1.010); residual 3.2 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.982); residual 3.0 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -1.082); residual 4.0 dB above the pre-onset output

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 49 trials (1-49) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 49 trials (1-49) |
| unknown | fCen |  | [694.366 1424.98] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 0.989 | 0.998 | NaN | NaN | 9 | -1.94 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.965 | 1.028 | NaN | NaN | -5 | -1.95 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 1.071 | 1.620 | NaN | NaN | -3 | -3.76 | 27.1 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.887 | 1.035 | NaN | NaN | 2 | -1.92 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | 0.241 | 0.295 | NaN | NaN | 179 | -3.40 | 7.5 | 0 |
| ramp | 4 | 4.50 | 1.083 | 32 / -19 | 0.946 | 1.009 | 1.041 | 0.994 | 16 | -2.20 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.765 | -7 / -30 | 0.725 | 0.926 | 0.789 | 1.053 | 14 | -2.56 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 75 | -3.23 | 6.1 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.800 | 1.112 | NaN | NaN | 2 | -1.94 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.919 | 1.073 | NaN | NaN | 4 | -1.92 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
