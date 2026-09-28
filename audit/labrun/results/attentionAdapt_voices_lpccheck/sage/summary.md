# labrun: attentionAdapt

- status: **completed** 
- device trials: 69 (audio 69); virtual time 236.8 s (audio 104.5 s); wall 120.1 s; speed 2.0x virtual, 0.9x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? (yes/no):`
  - `This is the no dots (control) session. Press ENTER to move on to the main experiment.`
  - `[Test mode only] Enter a coherence [0-1], or leave blank to run coherence testing:`
- load-time transformations: 16 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 52 of 69 passed the checks
  - failed trial 2: fmts differ (83.1 Hz)
  - failed trial 9: fmts differ (265 Hz)
  - failed trial 15: fmts differ (51.5 Hz); sfmts differ (51.5 Hz)
  - failed trial 20: fmts differ (203 Hz); sfmts differ (203 Hz)
  - failed trial 21: fmts differ (207 Hz); sfmts differ (207 Hz)
  - failed trial 30: fmts differ (219 Hz); sfmts differ (219 Hz)
  - failed trial 32: fmts differ (222 Hz); sfmts differ (222 Hz)
  - failed trial 37: fmts differ (94.7 Hz); sfmts differ (94.7 Hz)
  - failed trial 42: fmts differ (198 Hz); sfmts differ (198 Hz)
  - failed trial 44: fmts differ (205 Hz); sfmts differ (205 Hz)
  - failed trial 45: fmts differ (89 Hz); sfmts differ (89 Hz)
  - failed trial 55: fmts differ (209 Hz); sfmts differ (209 Hz)
  - failed trial 57: fmts differ (93.4 Hz); sfmts differ (93.4 Hz)
  - failed trial 61: fmts differ (171 Hz); sfmts differ (171 Hz)
  - failed trial 65: fmts differ (217 Hz); sfmts differ (217 Hz)
  - failed trial 67: fmts differ (222 Hz); sfmts differ (222 Hz)
  - failed trial 69: fmts differ (103 Hz); sfmts differ (103 Hz)

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
| pre | 9 | 1.50 | 0.000 | 0 / 0 | 0.998 | 1.002 | NaN | NaN | 32 | -1.92 | 8.0 | 0 |
| baseline | 15 | 1.52 | 0.000 | 0 / 0 | 0.996 | 1.006 | NaN | NaN | -28 | -1.95 | 8.0 | 2 |
| hold | 15 | 1.52 | 0.317 | 186 / 0 | 1.175 | 1.015 | 1.180 | 1.026 | 25 | -3.52 | 7.9 | 1 |
| washout | 15 | 1.52 | 0.000 | 0 / 0 | 0.996 | 1.003 | NaN | NaN | -26 | -1.96 | 8.0 | 1 |
| retention | 15 | 1.52 | 0.000 | 0 / 0 | 0.999 | 0.999 | NaN | NaN | 42 | -1.92 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
