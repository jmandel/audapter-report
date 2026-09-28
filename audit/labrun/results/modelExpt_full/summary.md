# labrun: modelExpt

- status: **completed** 
- device trials: 90 (audio 90); virtual time 267.1 s (audio 153.0 s); wall 54.0 s; speed 4.9x virtual, 2.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Was the LPC check recording good? (yes/no):`
  - `Read instructions, then press ENTER to go to main phase`
  - `\fontsize{10}There is already a file named \color{blue}expt.mat\color{black} here: C:/Users/Public/Documents/experiments//modelExpt/acousticdata/ lr001/perturbed Do you want to overwrite \color{blue}expt.mat\color{black}?`
- load-time transformations: 6 lines (transforms.tsv)

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
| noShift | 30 | 1.50 | 0.000 | 0 / 0 | 1.001 | 0.999 | NaN | NaN | -3 | -1.95 | 8.0 | 3 |
| baseline | 12 | 1.80 | 0.000 | 0 / 0 | 0.999 | 1.000 | NaN | NaN | -3 | -1.94 | 8.0 | 2 |
| ramp | 12 | 1.80 | 0.301 | 84 / 0 | 1.105 | 1.001 | 1.112 | 1.001 | -3 | -2.17 | 8.0 | 2 |
| hold | 24 | 1.80 | 0.322 | 170 / 0 | 1.161 | 1.000 | 1.157 | 0.998 | -3 | -3.24 | 7.9 | 3 |
| washout | 12 | 1.80 | 0.000 | 0 / 0 | 0.999 | 1.000 | NaN | NaN | -4 | -1.96 | 8.0 | 2 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
