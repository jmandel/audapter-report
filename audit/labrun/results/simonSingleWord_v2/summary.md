# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 57.4 s; speed 2.3x virtual, 0.9x audio
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
| bedheadWorking.pcf | pcf | 3629efe5d6 | 10 | 1 |
| bedheadWorking.pcf | pcf | b37f7e731f | 11 | 1 |
| bedheadWorking.pcf | pcf | a65a8dd3c4 | 12 | 1 |
| bedheadWorking.pcf | pcf | 96b9b0d8a3 | 13 | 1 |
| bedheadWorking.pcf | pcf | f91997a73f | 14 | 1 |
| bedheadWorking.pcf | pcf | ef196c6108 | 15 | 1 |
| bedheadWorking.pcf | pcf | 042ec25609 | 16 | 1 |
| bedheadWorking.pcf | pcf | 4c3b350c79 | 17 | 1 |
| bedheadWorking.pcf | pcf | 31ee5f3d5a | 18 | 1 |
| bedheadWorking.pcf | pcf | 302b64abda | 19 | 1 |
| bedheadWorking.pcf | pcf | 666c8c2a1d | 20 | 1 |
| bedheadWorking.pcf | pcf | 0683c46925 | 21 | 1 |
| bedheadWorking.pcf | pcf | d440126299 | 22 | 1 |
| bedheadWorking.pcf | pcf | d3e9daf318 | 23 | 1 |
| bedheadWorking.pcf | pcf | 63512d3860 | 24 | 1 |
| bedheadWorking.pcf | pcf | 52ba3e4054 | 25 | 1 |
| bedheadWorking.pcf | pcf | bd385d787a | 26 | 1 |
| bedheadWorking.pcf | pcf | 1710e8144a | 27 | 1 |
| bedheadWorking.pcf | pcf | f7c5020361 | 28 | 1 |
| bedheadWorking.pcf | pcf | b6b59fb406 | 29 | 1 |
| bedheadWorking.pcf | pcf | 39a444bfea | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.002 | 0.996 | NaN | NaN | -7 | -1.94 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.004 | 1.000 | NaN | NaN | -6 | -1.95 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | 0.704 | 0.883 | NaN | NaN | -391 | -3.41 | -21.2 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.418 | -112 / -200 | 0.851 | 0.926 | 0.844 | 0.908 | -2 | 2.21 | 8.1 | 0 |
| hold | 2 | 1.80 | 0.403 | -113 / -200 | 0.852 | 0.991 | 0.846 | 0.921 | 2 | 2.00 | 8.1 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | 0.680 | 1.077 | NaN | NaN | -253 | -3.61 | 14.4 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
