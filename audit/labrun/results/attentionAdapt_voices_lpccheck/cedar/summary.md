# labrun: attentionAdapt

- status: **completed** 
- device trials: 69 (audio 69); virtual time 236.8 s (audio 104.5 s); wall 117.3 s; speed 2.0x virtual, 0.9x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
  - `This is the no dots (control) session. Press ENTER to move on to the main experiment.`
  - `[Test mode only] Enter a coherence [0-1], or leave blank to run coherence testing:`
- load-time transformations: 16 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 68 of 69 passed the checks
  - failed trial 13: fmts differ (65.1 Hz); sfmts differ (65.1 Hz)

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 69 trials (1-69) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 69 trials (1-69) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pre | 9 | 1.50 | 0.000 | 0 / 0 | 0.985 | 1.000 | NaN | NaN | -114 | -1.92 | 8.0 | 1 |
| baseline | 15 | 1.52 | 0.000 | 0 / 0 | 1.006 | 1.000 | NaN | NaN | 242 | -1.94 | 8.0 | 2 |
| hold | 15 | 1.52 | 0.265 | 154 / 0 | 1.219 | 1.001 | 1.217 | 1.000 | 246 | -3.92 | 7.8 | 1 |
| washout | 15 | 1.52 | 0.000 | 0 / 0 | 1.001 | 0.999 | NaN | NaN | 227 | -1.94 | 8.0 | 1 |
| retention | 15 | 1.52 | 0.000 | 0 / 0 | 1.007 | 1.000 | NaN | NaN | 266 | -1.92 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
