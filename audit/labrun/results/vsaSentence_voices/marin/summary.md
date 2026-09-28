# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 72.6 s; speed 3.5x virtual, 2.0x audio
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
