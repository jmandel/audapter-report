# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 74.9 s; speed 3.4x virtual, 1.9x audio
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
| unknown | fCen |  | [665.808 1349.61] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 0.998 | 0.998 | NaN | NaN | 69 | -1.90 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.966 | 1.023 | NaN | NaN | 4 | -1.92 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.280 | 0.909 | NaN | NaN | 328 | -2.67 | -13.2 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.912 | 1.063 | NaN | NaN | -0 | -1.91 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | 0.939 | 1.065 | NaN | NaN | 377 | -2.66 | -3.3 | 0 |
| ramp | 4 | 4.50 | 1.298 | 17 / -33 | 0.730 | 0.914 | 0.854 | 0.954 | 32 | -2.47 | 8.0 | 0 |
| hold | 4 | 4.50 | 2.006 | 6 / -44 | 0.817 | 1.045 | 0.897 | 1.040 | 62 | -3.14 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.535 | 2.755 | NaN | NaN | 529 | -3.39 | 19.8 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.750 | 1.031 | NaN | NaN | -4 | -1.95 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.954 | 0.966 | NaN | NaN | 23 | -1.92 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
