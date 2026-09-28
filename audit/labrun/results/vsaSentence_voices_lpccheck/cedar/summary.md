# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 184.3 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 32 of 49 passed the checks
  - failed trial 9: fmts differ (277 Hz)
  - failed trial 15: voice left in the residual (beta -1.002); residual 2.3 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -0.967)
  - failed trial 17: voice left in the residual (beta -0.982); residual 2.7 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -1.035); residual 4.0 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.001); residual 3.8 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -1.019); residual 3.7 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.002); residual 2.1 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.017); residual 3.2 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.015); residual 3.1 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -0.974); residual 3.8 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -1.003); residual 3.3 dB above the pre-onset output
  - failed trial 38: fmts differ (477 Hz); sfmts differ (477 Hz); voice left in the residual (beta -0.991); residual 2.3 dB above the pre-onset output
  - failed trial 39: fmts differ (688 Hz); sfmts differ (688 Hz); voice left in the residual (beta -0.990); residual 3.0 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.964); residual 3.2 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -1.012); residual 3.2 dB above the pre-onset output
  - failed trial 43: fmts differ (271 Hz); sfmts differ (271 Hz)

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
| unknown | fCen |  | [583.04 1294.98] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 142 | -1.91 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.982 | 0.985 | NaN | NaN | -4 | -1.92 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.646 | 0.437 | NaN | NaN | 506 | -3.04 | -14.1 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.928 | 1.000 | NaN | NaN | 8 | -1.90 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | 1.121 | 2.189 | NaN | NaN | 570 | -3.23 | -3.5 | 0 |
| ramp | 4 | 4.50 | 1.095 | 12 / -20 | 0.786 | 0.943 | 0.897 | 1.007 | -4 | -2.17 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.830 | -11 / -89 | 0.761 | 0.986 | 0.769 | 0.998 | 24 | 1.55 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.839 | 1.053 | NaN | NaN | 584 | -3.42 | -6.6 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.921 | 0.990 | NaN | NaN | 14 | -1.94 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.909 | 0.981 | NaN | NaN | 13 | -1.92 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
