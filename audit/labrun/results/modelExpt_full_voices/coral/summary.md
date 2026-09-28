# labrun: modelExpt

- status: **completed** 
- device trials: 92 (audio 92); virtual time 274.7 s (audio 156.0 s); wall 81.4 s; speed 3.4x virtual, 1.9x audio
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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 92 trials (1-92) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 92 trials (1-92) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 32 | 1.50 | 0.000 | 0 / 0 | 1.023 | 1.000 | NaN | NaN | 50 | -1.93 | 8.0 | 3 |
| baseline | 12 | 1.80 | 0.000 | 0 / 0 | 0.998 | 1.002 | NaN | NaN | 27 | -1.92 | 8.0 | 2 |
| ramp | 12 | 1.80 | 0.245 | 85 / 0 | 1.101 | 1.001 | 1.119 | 1.000 | 58 | -2.77 | 8.0 | 2 |
| hold | 24 | 1.80 | 0.274 | 173 / 0 | 1.192 | 1.002 | 1.196 | 1.000 | 114 | -3.61 | 7.9 | 2 |
| washout | 12 | 1.80 | 0.000 | 0 / 0 | 0.999 | 1.002 | NaN | NaN | 30 | -1.91 | 8.0 | 1 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
