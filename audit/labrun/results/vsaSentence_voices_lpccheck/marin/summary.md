# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 187.1 s; speed 1.4x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 32 of 49 passed the checks
  - failed trial 15: voice left in the residual (beta -0.981); residual 3.7 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -1.053); residual 2.4 dB above the pre-onset output
  - failed trial 17: voice left in the residual (beta -0.985); residual 2.8 dB above the pre-onset output
  - failed trial 18: voice left in the residual (beta -1.002); residual 3.4 dB above the pre-onset output
  - failed trial 19: voice left in the residual (beta -1.005); residual 3.7 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -1.009); residual 3.8 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.976)
  - failed trial 26: voice left in the residual (beta -0.967); residual 3.0 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.044); residual 3.3 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.006); residual 4.0 dB above the pre-onset output
  - failed trial 37: voice left in the residual (beta -0.982); residual 3.2 dB above the pre-onset output
  - failed trial 38: voice left in the residual (beta -1.004); residual 2.3 dB above the pre-onset output
  - failed trial 39: fmts differ (1.04e+03 Hz); sfmts differ (1.04e+03 Hz); voice left in the residual (beta -0.954); residual 2.7 dB above the pre-onset output
  - failed trial 40: voice left in the residual (beta -0.946); residual 3.0 dB above the pre-onset output
  - failed trial 41: voice left in the residual (beta -0.987); residual 3.4 dB above the pre-onset output
  - failed trial 43: fmts differ (354 Hz); sfmts differ (354 Hz)
  - failed trial 46: fmts differ (59.9 Hz); sfmts differ (59.9 Hz)

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
| unknown | fCen |  | [695.959 1418.52] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 0.994 | 1.001 | NaN | NaN | 8 | -1.96 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.952 | 1.001 | NaN | NaN | -1 | -1.92 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.908 | 0.752 | NaN | NaN | -317 | -3.58 | -10.8 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.831 | 1.021 | NaN | NaN | 5 | -1.94 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -10 | -3.15 | -21.2 | 0 |
| ramp | 4 | 4.50 | 1.311 | 24 / -21 | 0.821 | 1.017 | 0.879 | 1.020 | 7 | -2.61 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.861 | 16 / -42 | 0.847 | 1.035 | 0.852 | 1.037 | 7 | -3.17 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.673 | 0.445 | NaN | NaN | -209 | -3.42 | -10.7 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.832 | 1.081 | NaN | NaN | 3 | -1.95 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.900 | 1.011 | NaN | NaN | -2 | -1.94 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
