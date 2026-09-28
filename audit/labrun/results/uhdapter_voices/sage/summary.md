# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.3 s (audio 26.2 s); wall 23.0 s; speed 3.0x virtual, 1.1x audio
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
| noisebase | 2 | 1.75 | 0.445 | 1 / 0 | NaN | NaN | NaN | NaN | -691 | -2.32 | -52.1 | 0 |
| baseline | 2 | 1.75 | 0.407 | 1 / 0 | 1.009 | 1.001 | 1.011 | 1.023 | 337 | -2.00 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.448 | 4 / 0 | 1.001 | 1.000 | 0.987 | 1.003 | -38 | -2.00 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.375 | 6 / 0 | 0.918 | 1.006 | 0.973 | 1.004 | -86 | -2.11 | 8.0 | 0 |
| post | 2 | 1.75 | 0.397 | 1 / 0 | NaN | NaN | NaN | NaN | -279 | -2.58 | -29.6 | 0 |
| washout | 2 | 1.75 | 0.434 | 1 / 0 | 0.995 | 1.001 | 0.995 | 1.004 | -116 | -1.97 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
