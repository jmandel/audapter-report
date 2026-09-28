# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 74.5 s; speed 3.4x virtual, 2.0x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
- load-time transformations: 6 lines (transforms.tsv)

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
