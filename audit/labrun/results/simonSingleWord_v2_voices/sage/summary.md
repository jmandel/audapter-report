# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 80.1 s; speed 1.7x virtual, 0.7x audio
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
| bedheadWorking.pcf | pcf | c89fb05509 | 10 | 1 |
| bedheadWorking.pcf | pcf | 30a29b66f3 | 11 | 1 |
| bedheadWorking.pcf | pcf | bf22b68f09 | 12 | 1 |
| bedheadWorking.pcf | pcf | 94e664ffa4 | 13 | 1 |
| bedheadWorking.pcf | pcf | a18a3be51d | 14 | 1 |
| bedheadWorking.pcf | pcf | 3a4e5e8b06 | 15 | 1 |
| bedheadWorking.pcf | pcf | fed7a4f06d | 16 | 1 |
| bedheadWorking.pcf | pcf | af1ca1d8fc | 17 | 1 |
| bedheadWorking.pcf | pcf | 8abaf2385d | 18 | 1 |
| bedheadWorking.pcf | pcf | 0c890f6905 | 19 | 1 |
| bedheadWorking.pcf | pcf | ed4c093e97 | 20 | 1 |
| bedheadWorking.pcf | pcf | 841d7defd8 | 21 | 1 |
| bedheadWorking.pcf | pcf | 2cee8587bc | 22 | 1 |
| bedheadWorking.pcf | pcf | 941e9f1796 | 23 | 1 |
| bedheadWorking.pcf | pcf | 9da6ad7f4c | 24 | 1 |
| bedheadWorking.pcf | pcf | fbffb2d2be | 25 | 1 |
| bedheadWorking.pcf | pcf | ebc03b1b12 | 26 | 1 |
| bedheadWorking.pcf | pcf | 146da796a5 | 27 | 1 |
| bedheadWorking.pcf | pcf | f36863b84f | 28 | 1 |
| bedheadWorking.pcf | pcf | 491802dc22 | 29 | 1 |
| bedheadWorking.pcf | pcf | 855e5c3be9 | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.007 | 1.119 | NaN | NaN | 5 | -1.96 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.002 | 1.000 | NaN | NaN | -39 | -1.90 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -33 | -1.09 | -12.2 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -98 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.384 | -120 / 73 | 1.098 | 0.862 | 1.075 | 0.859 | 62 | -0.63 | 7.9 | 0 |
| hold | 2 | 1.80 | 0.587 | -146 / 74 | 1.050 | 0.919 | 1.050 | 0.921 | 8 | -0.06 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 69 | -0.82 | -3.7 | 1 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -10 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
