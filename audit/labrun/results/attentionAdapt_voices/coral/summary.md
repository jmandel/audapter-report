# labrun: attentionAdapt

- status: **completed** 
- device trials: 70 (audio 70); virtual time 240.5 s (audio 106.0 s); wall 58.4 s; speed 4.1x virtual, 1.8x audio
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
| pre | 10 | 1.50 | 0.000 | 0 / 0 | 1.029 | 1.001 | NaN | NaN | 27 | -1.90 | 8.0 | 0 |
| baseline | 15 | 1.52 | 0.000 | 0 / 0 | 0.995 | 1.001 | NaN | NaN | 24 | -1.93 | 8.0 | 1 |
| hold | 15 | 1.52 | 0.273 | 172 / 0 | 1.202 | 1.001 | 1.191 | 1.000 | 84 | -3.59 | 7.9 | 1 |
| washout | 15 | 1.52 | 0.000 | 0 / 0 | 1.006 | 1.001 | NaN | NaN | 60 | -1.90 | 8.0 | 2 |
| retention | 15 | 1.52 | 0.000 | 0 / 0 | 0.995 | 1.001 | NaN | NaN | 64 | -1.93 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
