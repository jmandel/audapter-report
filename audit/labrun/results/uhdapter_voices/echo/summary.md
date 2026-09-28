# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.3 s (audio 26.2 s); wall 23.1 s; speed 3.0x virtual, 1.1x audio
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
| noisebase | 2 | 1.75 | 0.327 | 1 / 0 | 0.468 | 2.825 | 0.468 | 2.825 | 775 | -1.93 | 12.7 | 0 |
| baseline | 2 | 1.75 | 0.300 | 1 / 0 | 1.090 | 1.011 | 0.997 | 1.001 | 10 | -1.96 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.334 | 4 / 0 | 1.005 | 1.000 | 1.006 | 1.000 | 71 | -2.05 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.349 | 6 / 0 | 1.000 | 0.982 | 1.005 | 1.000 | 24 | -2.09 | 8.0 | 0 |
| post | 2 | 1.75 | 0.345 | 1 / 0 | 0.644 | 1.092 | 0.644 | 1.092 | 97 | -2.43 | 31.4 | 0 |
| washout | 2 | 1.75 | 0.296 | 1 / 0 | 1.009 | 1.001 | 1.006 | 1.001 | 171 | -1.98 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
