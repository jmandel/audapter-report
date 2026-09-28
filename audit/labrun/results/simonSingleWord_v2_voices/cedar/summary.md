# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 78.6 s; speed 1.7x virtual, 0.7x audio
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
| bedheadWorking.pcf | pcf | c9da8f3984 | 10 | 1 |
| bedheadWorking.pcf | pcf | 14f2b58c76 | 11 | 1 |
| bedheadWorking.pcf | pcf | 220b753d9e | 12 | 1 |
| bedheadWorking.pcf | pcf | 64f7858516 | 13 | 1 |
| bedheadWorking.pcf | pcf | c9e75b268f | 14 | 1 |
| bedheadWorking.pcf | pcf | aa1fa0ff9b | 15 | 1 |
| bedheadWorking.pcf | pcf | 759971aaf7 | 16 | 1 |
| bedheadWorking.pcf | pcf | 4f1af57874 | 17 | 1 |
| bedheadWorking.pcf | pcf | c7889b9e6f | 18 | 1 |
| bedheadWorking.pcf | pcf | d976e68041 | 19 | 1 |
| bedheadWorking.pcf | pcf | 7fd2688fe1 | 20 | 1 |
| bedheadWorking.pcf | pcf | 4df87bf5cf | 21 | 1 |
| bedheadWorking.pcf | pcf | c9f995ede7 | 22 | 1 |
| bedheadWorking.pcf | pcf | 927fe2f55b | 23 | 1 |
| bedheadWorking.pcf | pcf | d80efee958 | 24 | 1 |
| bedheadWorking.pcf | pcf | 83af2de92f | 25 | 1 |
| bedheadWorking.pcf | pcf | e681649267 | 26 | 1 |
| bedheadWorking.pcf | pcf | 696f5a98af | 27 | 1 |
| bedheadWorking.pcf | pcf | 9808f7720a | 28 | 1 |
| bedheadWorking.pcf | pcf | 76c196224d | 29 | 1 |
| bedheadWorking.pcf | pcf | ee91dba205 | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 0.973 | 0.999 | NaN | NaN | 101 | -1.89 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.002 | 1.000 | NaN | NaN | 5 | -1.91 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | 0.760 | 2.233 | NaN | NaN | 653 | -1.64 | -7.1 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.412 | -119 / 71 | 1.221 | 0.957 | 1.181 | 0.960 | 27 | -2.53 | 8.0 | 0 |
| hold | 2 | 1.80 | 0.415 | -122 / 71 | 1.254 | 0.959 | 1.289 | 0.957 | 1 | -1.27 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | 0.693 | 1.274 | NaN | NaN | 805 | -1.80 | 27.6 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -0 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
