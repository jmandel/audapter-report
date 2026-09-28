# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 77.1 s; speed 1.7x virtual, 0.7x audio
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
| bedheadWorking.pcf | pcf | e4e6a929a2 | 10 | 1 |
| bedheadWorking.pcf | pcf | 9b31df8281 | 11 | 1 |
| bedheadWorking.pcf | pcf | c2f711409e | 12 | 1 |
| bedheadWorking.pcf | pcf | 19f6f81d18 | 13 | 1 |
| bedheadWorking.pcf | pcf | 0557fefa04 | 14 | 1 |
| bedheadWorking.pcf | pcf | 5e0adc0bd2 | 15 | 1 |
| bedheadWorking.pcf | pcf | 3e3898d27d | 16 | 1 |
| bedheadWorking.pcf | pcf | 426279b5c1 | 17 | 1 |
| bedheadWorking.pcf | pcf | 0f14c56570 | 18 | 1 |
| bedheadWorking.pcf | pcf | bd93ea12dd | 19 | 1 |
| bedheadWorking.pcf | pcf | 173ad085be | 20 | 1 |
| bedheadWorking.pcf | pcf | a8525a39ce | 21 | 1 |
| bedheadWorking.pcf | pcf | 5226beff6d | 22 | 1 |
| bedheadWorking.pcf | pcf | 41784820e2 | 23 | 1 |
| bedheadWorking.pcf | pcf | e6992354b4 | 24 | 1 |
| bedheadWorking.pcf | pcf | 6f154e0c85 | 25 | 1 |
| bedheadWorking.pcf | pcf | c61461c158 | 26 | 1 |
| bedheadWorking.pcf | pcf | d65c1ad310 | 27 | 1 |
| bedheadWorking.pcf | pcf | 2129c9d3ae | 28 | 1 |
| bedheadWorking.pcf | pcf | 744950957f | 29 | 1 |
| bedheadWorking.pcf | pcf | fc5873b880 | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 0.992 | 1.000 | NaN | NaN | 63 | -1.93 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 0.997 | 1.000 | NaN | NaN | 86 | -1.91 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | 0.781 | 1.614 | NaN | NaN | 942 | -1.77 | -10.9 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.484 | -107 / 108 | 1.146 | 0.923 | 1.133 | 0.997 | 17 | -1.04 | 7.6 | 0 |
| hold | 2 | 1.80 | 0.507 | -106 / 110 | 1.034 | 1.059 | 0.991 | 1.061 | -12 | -0.72 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 1085 | -1.97 | 1.0 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -0 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
