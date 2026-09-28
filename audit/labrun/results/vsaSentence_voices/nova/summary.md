# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 71.0 s; speed 3.6x virtual, 2.0x audio
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
