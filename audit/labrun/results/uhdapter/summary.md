# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.1 s (audio 26.2 s); wall 15.6 s; speed 4.4x virtual, 1.7x audio
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
| noisebase | 2 | 1.75 | 0.404 | 1 / 0 | 0.773 | 1.064 | 0.787 | 1.027 | -223 | -3.61 | 29.9 | 0 |
| baseline | 2 | 1.75 | 0.432 | 1 / 0 | 1.011 | 1.002 | 1.004 | 1.001 | -0 | -2.01 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.416 | 4 / 0 | 1.010 | 1.000 | 1.018 | 1.002 | -5 | -2.09 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.401 | 6 / 0 | 1.035 | 1.003 | 1.013 | 1.002 | -1 | -2.34 | 8.0 | 0 |
| post | 2 | 1.75 | 0.410 | 1 / 0 | 0.747 | 0.780 | 0.684 | 0.852 | -519 | -3.35 | -8.1 | 1 |
| washout | 2 | 1.75 | 0.405 | 1 / 0 | 1.004 | 1.000 | 1.003 | 1.001 | -3 | -2.00 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
