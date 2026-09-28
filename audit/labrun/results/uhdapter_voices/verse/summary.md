# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.3 s (audio 26.2 s); wall 21.8 s; speed 3.2x virtual, 1.2x audio
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
| noisebase | 2 | 1.75 | 0.345 | 1 / 0 | 0.783 | 0.690 | 0.783 | 0.690 | -4 | -2.76 | 26.2 | 0 |
| baseline | 2 | 1.75 | 0.279 | 1 / 0 | 0.997 | 1.015 | 1.004 | 1.010 | 30 | -2.00 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.412 | 4 / 0 | 0.995 | 1.001 | 1.004 | 1.001 | 18 | -2.03 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.407 | 6 / 0 | 0.903 | 0.984 | 1.012 | 1.001 | 36 | -2.09 | 8.0 | 0 |
| post | 2 | 1.75 | 0.341 | 1 / 0 | 0.668 | 1.137 | 0.668 | 1.137 | -175 | -2.05 | 12.9 | 0 |
| washout | 2 | 1.75 | 0.331 | 1 / 0 | 0.992 | 1.000 | 1.001 | 1.001 | 99 | -1.98 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
