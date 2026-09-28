# labrun: modelExpt

- status: **completed** 
- device trials: 90 (audio 90); virtual time 267.6 s (audio 153.0 s); wall 267.9 s; speed 1.0x virtual, 0.6x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Was the LPC check recording good? (yes/no):`
  - `Read instructions, then press ENTER to go to main phase`
  - `\fontsize{10}There is already a file named \color{blue}expt.mat\color{black} here: C:/Users/Public/Documents/experiments//modelExpt/acousticdata/ lr001/perturbed Do you want to overwrite \color{blue}expt.mat\color{black}?`
- load-time transformations: 6 lines (transforms.tsv)
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 90 of 90 passed the checks

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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 90 trials (1-90) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 90 trials (1-90) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 30 | 1.50 | 0.000 | 0 / 0 | 0.999 | 1.000 | NaN | NaN | 119 | -1.92 | 8.0 | 3 |
| baseline | 12 | 1.80 | 0.000 | 0 / 0 | 0.998 | 1.000 | NaN | NaN | 140 | -1.89 | 8.0 | 2 |
| ramp | 12 | 1.80 | 0.266 | 82 / 0 | 1.121 | 1.002 | 1.139 | 1.001 | 146 | -3.17 | 7.9 | 2 |
| hold | 24 | 1.80 | 0.288 | 165 / 0 | 1.244 | 1.002 | 1.252 | 1.001 | 240 | -4.39 | 7.8 | 2 |
| washout | 12 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 166 | -1.96 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
