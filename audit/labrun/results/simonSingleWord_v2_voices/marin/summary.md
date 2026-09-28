# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 70.8 s; speed 1.9x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Does the participant appear to be above the height 5' 8"? (y/n):`
  - `Save LPC order and exit?`
  - `Is the LPC order OK? (yes/no):`
  - `\nRead instructions, then press ENTER to continue to "Pretest phase: OST Check" section`
  - `[Test mode only] Run ost pretest phase (1), or skip it (0)?`
  - `Save current OST parameters and exit?`
  - `Redo OST testing phase, or move on? (redo/move on):`
  - `\nRead instructions, then press ENTER to continue to "Practice with stimulus words" phase`
  - `\nRead instructions, then press ENTER to continue to "Main Phase"`
- load-time transformations: 123 lines (transforms.tsv)

## OST/PCF files loaded

| file | kind | hash | first trial | loads |
|---|---|---|---|---|
| measureFormantsWorking.ost | ost | a72d44bb11 | 1 | 1 |
| measureFormantsWorking.pcf | pcf | e665e810b4 | 1 | 1 |
| bedheadWorking.ost | ost | 028a715f94 | 4 | 2 |
| bedheadWorking.pcf | pcf | cafa6fad1e | 4 | 2 |
| bedheadWorking.pcf | pcf | eac427d9a3 | 4 | 2 |
| bedheadWorking.pcf | pcf | 87c0e25700 | 5 | 2 |
| bedheadWorking.pcf | pcf | 10944ea6c4 | 6 | 5 |
| bedheadWorking.ost | ost | 5cabd3e7ee | 7 | 3 |
| bedheadWorking.pcf | pcf | ac6fae8eb9 | 10 | 1 |
| bedheadWorking.pcf | pcf | 4062696be2 | 11 | 1 |
| bedheadWorking.pcf | pcf | 7f9aee39dd | 12 | 1 |
| bedheadWorking.pcf | pcf | f3f7596254 | 13 | 1 |
| bedheadWorking.pcf | pcf | 6645b9bdd5 | 14 | 1 |
| bedheadWorking.pcf | pcf | 6dcdb01b53 | 15 | 1 |
| bedheadWorking.pcf | pcf | 93a6dc03c0 | 16 | 1 |
| bedheadWorking.pcf | pcf | aeda9f9eab | 17 | 1 |
| bedheadWorking.pcf | pcf | d2b7aeb9a7 | 18 | 1 |
| bedheadWorking.pcf | pcf | 52a3b02ada | 19 | 1 |
| bedheadWorking.pcf | pcf | f480f13af0 | 20 | 1 |
| bedheadWorking.pcf | pcf | 61ec6851e4 | 21 | 1 |
| bedheadWorking.pcf | pcf | 3df8247992 | 22 | 1 |
| bedheadWorking.pcf | pcf | bbcc444c2d | 23 | 1 |
| bedheadWorking.pcf | pcf | b492297db3 | 24 | 1 |
| bedheadWorking.pcf | pcf | 3fe60284df | 25 | 1 |
| bedheadWorking.pcf | pcf | da617b70d2 | 26 | 1 |
| bedheadWorking.pcf | pcf | 13de948f45 | 27 | 1 |
| bedheadWorking.pcf | pcf | 60b2e24aa0 | 28 | 1 |
| bedheadWorking.pcf | pcf | 3129519378 | 29 | 1 |
| bedheadWorking.pcf | pcf | bbc96196e7 | 30 | 1 |

## Intended parameters vs what Audapter reports

The script's parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.
`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO('init') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.

(7 fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)

| kind | field | param | intended | actual | trials |
|---|---|---|---|---|---|
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 30 trials (1-30) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 30 trials (1-30) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.013 | 1.000 | NaN | NaN | 23 | -1.95 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 5 | -1.93 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -123 | -1.72 | 0.8 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.490 | -135 / 85 | 0.886 | 0.941 | 0.884 | 0.942 | 21 | -0.36 | 8.0 | 0 |
| hold | 2 | 1.80 | 0.450 | -130 / 85 | 0.928 | 0.980 | 0.917 | 0.977 | 20 | 0.25 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | 0.456 | 1.605 | NaN | NaN | -31 | -2.30 | 9.4 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
