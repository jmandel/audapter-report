# labrun: attentionComp

- status: **completed** 
- device trials: 51 (audio 51); virtual time 309.6 s (audio 77.1 s); wall 139.9 s; speed 2.2x virtual, 0.6x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? yes/no:`
  - `[Test mode only] Enter a coherence [0-1], or leave blank to run coherence testing:`
  - `Enter [y] to move on to pretest phase:`
  - `Run duration practice? [skip/run]`
- load-time transformations: 16 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 41 of 51 passed the checks
  - failed trial 5: fmts differ (62.1 Hz)
  - failed trial 7: fmts differ (231 Hz)
  - failed trial 9: fmts differ (2.44e+03 Hz)
  - failed trial 18: fmts differ (581 Hz); sfmts differ (581 Hz)
  - failed trial 22: fmts differ (1.02e+03 Hz); sfmts differ (1.02e+03 Hz)
  - failed trial 25: fmts differ (769 Hz); sfmts differ (769 Hz)
  - failed trial 37: residual 2.1 dB above the pre-onset output
  - failed trial 39: fmts differ (775 Hz); sfmts differ (775 Hz)
  - failed trial 41: fmts differ (1.02e+03 Hz); sfmts differ (1.02e+03 Hz)
  - failed trial 47: fmts differ (1.17e+03 Hz); sfmts differ (1.17e+03 Hz)

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 51 trials (1-51) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 51 trials (1-51) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 42 | 1.51 | 0.000 | 0 / 0 | 0.999 | 1.001 | NaN | NaN | 21 | -1.95 | 8.0 | 5 |
| shiftIH | 5 | 1.52 | 0.292 | -139 / 103 | 0.805 | 1.053 | 0.799 | 1.052 | 28 | 1.59 | 8.2 | 0 |
| shiftAE | 4 | 1.52 | 0.289 | 106 / -231 | 1.146 | 0.928 | 1.149 | 0.924 | 89 | -1.86 | 7.9 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
