# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 183.5 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 33 of 49 passed the checks
  - failed trial 5: fmts differ (274 Hz)
  - failed trial 15: voice left in the residual (beta -0.897); residual 2.9 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -0.996); residual 2.4 dB above the pre-onset output
  - failed trial 17: voice left in the residual (beta -1.031); residual 3.6 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -0.986); residual 3.3 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.011); residual 4.0 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.981); residual 3.6 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.015)
  - failed trial 26: voice left in the residual (beta -0.939)
  - failed trial 27: voice left in the residual (beta -1.021); residual 2.8 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -0.999); residual 3.4 dB above the pre-onset output
  - failed trial 37: fmts differ (323 Hz); sfmts differ (323 Hz); voice left in the residual (beta -0.994); residual 2.9 dB above the pre-onset output
  - failed trial 38: fmts differ (1.38e+03 Hz); sfmts differ (1.38e+03 Hz); voice left in the residual (beta -1.027); residual 2.2 dB above the pre-onset output
  - failed trial 39: fmts differ (582 Hz); sfmts differ (582 Hz); voice left in the residual (beta -0.953); residual 2.7 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.977); residual 3.5 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -0.968); residual 3.2 dB above the pre-onset output

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
| unknown | fCen |  | [652.697 1373.93] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 0.997 | 0.991 | NaN | NaN | 113 | -1.96 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.991 | 1.009 | NaN | NaN | 17 | -1.93 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.128 | 0.728 | NaN | NaN | 688 | -3.64 | -14.1 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.796 | 0.983 | NaN | NaN | -7 | -1.92 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 664 | -2.60 | 8.0 | 0 |
| ramp | 4 | 4.50 | 1.087 | 17 / -8 | 0.913 | 1.029 | 0.870 | 1.033 | 14 | -2.55 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.788 | 14 / 27 | 0.551 | 1.046 | 0.738 | 1.085 | 67 | -3.10 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 756 | -3.22 | 3.8 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.697 | 1.057 | NaN | NaN | 4 | -1.89 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.831 | 0.961 | NaN | NaN | 48 | -1.93 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
