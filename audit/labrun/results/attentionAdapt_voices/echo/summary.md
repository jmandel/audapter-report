# labrun: attentionAdapt

- status: **completed** 
- device trials: 70 (audio 70); virtual time 240.5 s (audio 106.0 s); wall 55.9 s; speed 4.3x virtual, 1.9x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
  - `This is the no dots (control) session. Press ENTER to move on to the main experiment.`
  - `[Test mode only] Enter a coherence [0-1], or leave blank to run coherence testing:`
- load-time transformations: 16 lines (transforms.tsv)

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 70 trials (1-70) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 70 trials (1-70) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pre | 10 | 1.50 | 0.000 | 0 / 0 | 0.984 | 1.000 | NaN | NaN | 147 | -1.91 | 8.0 | 1 |
| baseline | 15 | 1.52 | 0.000 | 0 / 0 | 1.003 | 1.000 | NaN | NaN | 128 | -1.93 | 8.0 | 2 |
| hold | 15 | 1.52 | 0.276 | 164 / 0 | 1.238 | 1.001 | 1.236 | 1.001 | 101 | -4.98 | 7.9 | 1 |
| washout | 15 | 1.52 | 0.000 | 0 / 0 | 1.005 | 1.000 | NaN | NaN | 44 | -1.93 | 8.0 | 2 |
| retention | 15 | 1.52 | 0.000 | 0 / 0 | 1.002 | 1.000 | NaN | NaN | 79 | -1.90 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
