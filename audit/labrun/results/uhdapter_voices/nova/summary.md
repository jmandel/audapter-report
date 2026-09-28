# labrun: uhdapter

- status: **completed** 
- device trials: 15 (audio 15); virtual time 69.3 s (audio 26.2 s); wall 22.4 s; speed 3.1x virtual, 1.2x audio
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
| noisebase | 2 | 1.75 | 0.359 | 1 / 0 | 0.513 | 1.577 | 0.513 | 1.577 | -242 | -3.11 | 15.9 | 0 |
| baseline | 2 | 1.75 | 0.305 | 1 / 0 | 1.019 | 1.010 | 0.996 | 1.000 | -27 | -2.02 | 8.0 | 0 |
| ramp | 5 | 1.75 | 0.330 | 4 / 0 | 1.021 | 1.004 | 1.013 | 1.001 | 76 | -2.03 | 8.0 | 1 |
| hold | 2 | 1.75 | 0.376 | 6 / 0 | 1.006 | 1.181 | 1.008 | 1.107 | 30 | -2.19 | 8.0 | 0 |
| post | 2 | 1.75 | 0.350 | 1 / 0 | NaN | NaN | NaN | NaN | -67 | -2.23 | -17.2 | 0 |
| washout | 2 | 1.75 | 0.277 | 1 / 0 | 1.088 | 1.005 | 1.002 | 1.000 | 9 | -2.02 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
