# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 254.5 s (audio 145.5 s); wall 54.9 s; speed 4.6x virtual, 2.6x audio
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
| unknown | fCen |  | [782.647 1512.28] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 1.006 | 1.003 | NaN | NaN | 1 | -1.95 | 8.0 | 1 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 1.005 | 1.005 | NaN | NaN | -0 | -1.93 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | 0.876 | 1.037 | NaN | NaN | 709 | -3.58 | -0.8 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 1.005 | 1.002 | NaN | NaN | -0 | -1.95 | 8.0 | 1 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | 0.812 | 1.140 | NaN | NaN | 761 | -3.58 | 8.4 | 0 |
| ramp | 4 | 4.50 | 1.596 | 28 / 31 | 1.064 | 1.032 | 1.084 | 1.040 | -1 | -3.14 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.958 | 58 / 34 | 1.123 | 1.023 | 1.126 | 1.023 | 1 | -4.89 | 7.9 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | 0.811 | 1.043 | NaN | NaN | 732 | -3.67 | 36.6 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 1.006 | 1.004 | NaN | NaN | 0 | -1.93 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 1.006 | 1.004 | NaN | NaN | 1 | -1.95 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
