# labrun: modelComp

- status: **completed** 
- device trials: 39 (audio 39); virtual time 168.8 s (audio 74.1 s); wall 44.4 s; speed 3.8x virtual, 1.7x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `[Test mode only] Run LPC check pretest phase (1), or skip it (0)? (1/0):`
  - `Run duration practice? (run/skip):`
  - `Participant was successful on: 0/12 trials. Redo training? (redo/move on):`

## OST/PCF files loaded

| file | kind | hash | first trial | loads |
|---|---|---|---|---|

## Intended parameters vs what Audapter reports

The script's parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.
`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO('init') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.

(7 fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)

| kind | field | param | intended | actual | trials |
|---|---|---|---|---|---|
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 39 trials (1-39) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 39 trials (1-39) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 33 | 1.90 | 0.000 | 0 / 0 | 1.002 | 0.999 | NaN | NaN | 54 | -1.92 | 8.0 | 2 |
| shiftUp | 3 | 1.90 | 0.242 | 171 / 0 | 1.195 | 0.999 | 1.206 | 1.000 | 218 | -4.13 | 7.9 | 0 |
| shiftDown | 3 | 1.90 | 0.301 | -145 / 0 | 0.756 | 1.000 | 0.755 | 1.000 | 58 | 2.69 | 8.3 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
