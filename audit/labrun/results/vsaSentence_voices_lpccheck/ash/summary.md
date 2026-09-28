# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 182.2 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 33 of 49 passed the checks
  - failed trial 15: voice left in the residual (beta -1.014); residual 2.9 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -0.989); residual 2.1 dB above the pre-onset output
  - failed trial 17: voice left in the residual (beta -0.971); residual 2.7 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -0.995); residual 3.4 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.009); residual 3.6 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -1.034); residual 3.6 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.023)
  - failed trial 26: voice left in the residual (beta -1.058); residual 3.3 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.012); residual 2.9 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.028); residual 4.2 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -0.956); residual 3.8 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -1.006)
  - failed trial 39: fmts differ (433 Hz); sfmts differ (433 Hz); voice left in the residual (beta -0.984); residual 3.7 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -1.006); residual 2.4 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -0.945); residual 2.5 dB above the pre-onset output
  - failed trial 45: fmts differ (1.69e+03 Hz); sfmts differ (2.59e+03 Hz)

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
| unknown | fCen |  | [603.9 1264.86] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 1.004 | 0.998 | NaN | NaN | 136 | -1.96 | 8.0 | 0 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.964 | 1.001 | NaN | NaN | 10 | -1.93 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 1.086 | 1.273 | NaN | NaN | 680 | -3.03 | -15.6 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.900 | 1.003 | NaN | NaN | 32 | -1.92 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 947 | -3.02 | -1.7 | 0 |
| ramp | 4 | 4.50 | 1.353 | 24 / -63 | 0.927 | 0.943 | 0.902 | 0.904 | 74 | -1.86 | 7.9 | 0 |
| hold | 4 | 4.50 | 2.067 | -5 / -125 | 0.751 | 0.941 | 0.754 | 0.950 | 46 | -0.78 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.775 | 1.320 | NaN | NaN | 950 | -3.02 | 15.6 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.972 | 1.011 | NaN | NaN | 2 | -1.93 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.891 | 0.988 | NaN | NaN | 17 | -1.91 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
