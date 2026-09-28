# labrun: vsaSentence

- status: **completed** 
- device trials: 49 (audio 49); virtual time 256.1 s (audio 145.5 s); wall 71.7 s; speed 3.6x virtual, 2.0x audio
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
| unknown | fCen |  | [694.6 1398.08] |  | 39 trials (11-49) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 10 | 1.50 | 0.000 | 0 / 0 | 1.002 | 1.122 | NaN | NaN | 77 | -1.96 | 8.0 | 0 |
| baseline1 | 4 | 4.50 | 0.000 | 0 / 0 | 0.853 | 1.023 | NaN | NaN | -7 | -1.93 | 8.0 | 0 |
| transfer1 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -99 | -3.52 | -3.2 | 0 |
| baseline2 | 4 | 4.50 | 0.000 | 0 / 0 | 0.793 | 0.982 | NaN | NaN | 18 | -1.93 | 8.0 | 0 |
| transfer2 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -12 | -1.96 | -20.3 | 0 |
| ramp | 4 | 4.50 | 1.348 | 20 / -26 | 1.037 | 1.054 | 0.873 | 0.971 | -3 | -3.45 | 8.0 | 0 |
| hold | 4 | 4.50 | 1.884 | 51 / -38 | 0.844 | 1.048 | 0.851 | 1.058 | -9 | -3.38 | 8.0 | 0 |
| transfer3 | 5 | 1.50 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -382 | -2.95 | 2.6 | 0 |
| washout | 4 | 4.50 | 0.000 | 0 / 0 | 0.859 | 1.069 | NaN | NaN | -9 | -1.93 | 8.0 | 0 |
| retention | 4 | 4.50 | 0.000 | 0 / 0 | 0.913 | 0.997 | NaN | NaN | 0 | -1.95 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
