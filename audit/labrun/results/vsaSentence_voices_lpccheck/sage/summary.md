# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 180.6 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 33 of 49 passed the checks
  - failed trial 15: voice left in the residual (beta -0.992); residual 3.2 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -1.043)
  - failed trial 17: voice left in the residual (beta -0.976); residual 2.6 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -0.972); residual 3.6 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -0.965); residual 3.1 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -1.036); residual 3.4 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.973); residual 2.8 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -0.998); residual 2.2 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.014)
  - failed trial 28: voice left in the residual (beta -0.998); residual 3.9 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -1.039); residual 3.9 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -0.975)
  - failed trial 39: fmts differ (1.21e+03 Hz); sfmts differ (1.21e+03 Hz); voice left in the residual (beta -1.007); residual 2.9 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -1.009); residual 3.8 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -0.972); residual 3.1 dB above the pre-onset output
  - failed trial 45: fmts differ (275 Hz); sfmts differ (275 Hz)

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
| unknown | fCen |  | [691.821 1428.46] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 0.996 | 1.151 | NaN | NaN | -52 | -1.91 | 8.0 | 0 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.886 | 1.067 | NaN | NaN | -15 | -1.92 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.481 | 0.734 | NaN | NaN | -88 | -3.05 | 7.8 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.886 | 1.265 | NaN | NaN | -82 | -1.91 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | 0.247 | 0.397 | NaN | NaN | 72 | -1.91 | -20.5 | 0 |
| ramp | 4 | 4.50 | 1.401 | 24 / -46 | 0.889 | 1.058 | 0.971 | 0.995 | -4 | -2.48 | 8.0 | 0 |
| hold | 4 | 4.50 | 2.029 | 5 / -14 | 0.714 | 0.958 | 0.761 | 1.016 | -4 | -2.89 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.636 | 1.550 | NaN | NaN | -106 | -3.22 | 1.1 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.803 | 0.992 | NaN | NaN | -34 | -1.91 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.965 | 1.072 | NaN | NaN | -49 | -1.89 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
