# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.3 s (audio 26.2 s); wall 22.3 s; speed 3.1x virtual, 1.2x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant number:`
  - `Enter participant gender (m/f):`

## OST/PCF files loaded

| file | kind | hash | first trial | loads |
|---|---|---|---|---|

## Intended parameters vs what Audapter reports

The script's parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.
`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO('init') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.

(7 fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)

| kind | field | param | intended | actual | trials |
|---|---|---|---|---|---|
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 15 trials (1-15) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 15 trials (1-15) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noisebase | 2 | 1.75 | 0.354 | 1 / 0 | 0.487 | 1.843 | 0.487 | 1.843 | -505 | -2.46 | -26.1 | 0 |
| baseline | 2 | 1.75 | 0.313 | 1 / 0 | 1.013 | 1.000 | 0.997 | 1.001 | 58 | -1.96 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.402 | 4 / 0 | 1.010 | 1.000 | 1.002 | 0.995 | -3 | -2.01 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.371 | 6 / 0 | 0.947 | 1.043 | 1.002 | 1.000 | 50 | -2.10 | 8.0 | 0 |
| post | 2 | 1.75 | 0.336 | 1 / 0 | NaN | NaN | NaN | NaN | -290 | -1.87 | -29.8 | 0 |
| washout | 2 | 1.75 | 0.308 | 1 / 0 | 0.960 | 1.003 | 1.000 | 1.000 | 67 | -1.96 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
