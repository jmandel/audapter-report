# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 31 (audio 31); virtual time 138.2 s (audio 55.8 s); wall 114.7 s; speed 1.2x virtual, 0.5x audio
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
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 13 of 29 passed the checks
  - failed trial 11: voice left in the residual (beta -1.019); residual 2.6 dB above the pre-onset output
  - failed trial 12: voice left in the residual (beta -1.007); residual 4.4 dB above the pre-onset output
  - failed trial 13: voice left in the residual (beta -1.006); residual 3.5 dB above the pre-onset output
  - failed trial 14: voice left in the residual (beta -1.074); residual 3.4 dB above the pre-onset output
  - failed trial 15: voice left in the residual (beta -1.063)
  - failed trial 16: voice left in the residual (beta -1.043); residual 2.2 dB above the pre-onset output
  - failed trial 17: fmts differ (467 Hz); voice left in the residual (beta -1.015)
  - failed trial 18: voice left in the residual (beta -0.997); residual 4.2 dB above the pre-onset output
  - failed trial 23: fmts differ (1.22e+03 Hz); voice left in the residual (beta -1.036); residual 3.4 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.943); residual 2.9 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.993); residual 3.6 dB above the pre-onset output
  - failed trial 26: fmts differ (85.9 Hz); voice left in the residual (beta -1.020); residual 3.9 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.096); residual 4.2 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.008)
  - failed trial 29: fmts differ (410 Hz); voice left in the residual (beta -1.038)
  - failed trial 30: voice left in the residual (beta -1.095); residual 3.7 dB above the pre-onset output

## OST/PCF files loaded

| file | kind | hash | first trial | loads |
|---|---|---|---|---|
| measureFormantsWorking.ost | ost | a72d44bb11 | 1 | 1 |
| measureFormantsWorking.pcf | pcf | e665e810b4 | 1 | 1 |
| bedheadWorking.ost | ost | 028a715f94 | 5 | 2 |
| bedheadWorking.pcf | pcf | cafa6fad1e | 5 | 2 |
| bedheadWorking.pcf | pcf | eac427d9a3 | 5 | 2 |
| bedheadWorking.pcf | pcf | 87c0e25700 | 6 | 2 |
| bedheadWorking.pcf | pcf | 10944ea6c4 | 7 | 5 |
| bedheadWorking.ost | ost | 5cabd3e7ee | 8 | 3 |
| bedheadWorking.pcf | pcf | f161baa9ef | 11 | 1 |
| bedheadWorking.pcf | pcf | 5603fd8c3a | 12 | 1 |
| bedheadWorking.pcf | pcf | fb5e161c81 | 13 | 1 |
| bedheadWorking.pcf | pcf | 047a52b1d6 | 14 | 1 |
| bedheadWorking.pcf | pcf | c515a2bd60 | 15 | 1 |
| bedheadWorking.pcf | pcf | f2668a5a48 | 16 | 1 |
| bedheadWorking.pcf | pcf | 743bb5e844 | 17 | 1 |
| bedheadWorking.pcf | pcf | 923a60c41e | 18 | 1 |
| bedheadWorking.pcf | pcf | 2d96538b96 | 19 | 1 |
| bedheadWorking.pcf | pcf | 38d9f7f4b1 | 20 | 1 |
| bedheadWorking.pcf | pcf | c93d8ee3de | 21 | 1 |
| bedheadWorking.pcf | pcf | d209d37c1d | 22 | 1 |
| bedheadWorking.pcf | pcf | ba4170cb92 | 23 | 1 |
| bedheadWorking.pcf | pcf | 61a539799f | 24 | 1 |
| bedheadWorking.pcf | pcf | 3b9b90862f | 25 | 1 |
| bedheadWorking.pcf | pcf | 4c3640952e | 26 | 1 |
| bedheadWorking.pcf | pcf | 2deab0047c | 27 | 1 |
| bedheadWorking.pcf | pcf | e3e1bf0335 | 28 | 1 |
| bedheadWorking.pcf | pcf | a91185cb7d | 29 | 1 |
| bedheadWorking.pcf | pcf | c5199a5ec1 | 30 | 1 |
| bedheadWorking.pcf | pcf | ada26a6cd7 | 31 | 1 |

## Intended parameters vs what Audapter reports

The script's parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.
`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO('init') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.

(7 fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)

| kind | field | param | intended | actual | trials |
|---|---|---|---|---|---|
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 31 trials (1-31) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 31 trials (1-31) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| noShift | 4 | 1.80 | 0.000 | 0 / 0 | 1.034 | 0.999 | NaN | NaN | 73 | -1.91 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.007 | 1.000 | NaN | NaN | 148 | -1.90 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -56 | -0.83 | -13.0 | 0 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -4 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.338 | -94 / 119 | 1.316 | 0.934 | 1.317 | 0.932 | 557 | -2.29 | 7.9 | 0 |
| hold | 2 | 1.80 | 0.451 | -130 / 124 | 1.084 | 0.976 | 1.088 | 0.974 | -39 | -1.53 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | -19 | -1.70 | 7.0 | 1 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 2 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
