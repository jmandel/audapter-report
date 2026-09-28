# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 116.8 s; speed 1.1x virtual, 0.5x audio
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
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 9 of 28 passed the checks
  - failed trial 5: residual 2.1 dB above the pre-onset output
  - failed trial 8: fmts differ (457 Hz); residual 2.1 dB above the pre-onset output
  - failed trial 10: voice left in the residual (beta -0.882); residual 3.2 dB above the pre-onset output
  - failed trial 11: voice left in the residual (beta -0.930); residual 5.2 dB above the pre-onset output
  - failed trial 12: voice left in the residual (beta -1.057); residual 3.9 dB above the pre-onset output
  - failed trial 13: voice left in the residual (beta -1.001); residual 3.3 dB above the pre-onset output
  - failed trial 14: voice left in the residual (beta -0.918); residual 2.8 dB above the pre-onset output
  - failed trial 15: voice left in the residual (beta -1.052); residual 3.5 dB above the pre-onset output
  - failed trial 16: voice left in the residual (beta -0.900)
  - failed trial 17: voice left in the residual (beta -1.013); residual 4.0 dB above the pre-onset output
  - failed trial 19: fmts differ (418 Hz); sfmts differ (377 Hz)
  - failed trial 22: voice left in the residual (beta -1.052); residual 3.4 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -1.034); residual 3.9 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.992); residual 3.8 dB above the pre-onset output
  - failed trial 25: fmts differ (11 Hz); voice left in the residual (beta -0.992); residual 3.3 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.005); residual 3.9 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -0.976); residual 2.9 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.035); residual 2.2 dB above the pre-onset output
  - failed trial 29: voice left in the residual (beta -1.039); residual 3.9 dB above the pre-onset output

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
| bedheadWorking.pcf | pcf | 19211abcee | 10 | 1 |
| bedheadWorking.pcf | pcf | b40ae526ef | 11 | 1 |
| bedheadWorking.pcf | pcf | 2747b8eee0 | 12 | 1 |
| bedheadWorking.pcf | pcf | 7fdfee7b85 | 13 | 1 |
| bedheadWorking.pcf | pcf | cf6a7ee263 | 14 | 1 |
| bedheadWorking.pcf | pcf | 92747ddb5d | 15 | 1 |
| bedheadWorking.pcf | pcf | dc11744f81 | 16 | 1 |
| bedheadWorking.pcf | pcf | 1be494a012 | 17 | 1 |
| bedheadWorking.pcf | pcf | 6bdabc09cf | 18 | 1 |
| bedheadWorking.pcf | pcf | 3ebfc78a34 | 19 | 1 |
| bedheadWorking.pcf | pcf | 9a94e52a7a | 20 | 1 |
| bedheadWorking.pcf | pcf | 4e7a065eec | 21 | 1 |
| bedheadWorking.pcf | pcf | 8c2f6b8c45 | 22 | 1 |
| bedheadWorking.pcf | pcf | 1bd09c26d5 | 23 | 1 |
| bedheadWorking.pcf | pcf | 5e2fe6aed0 | 24 | 1 |
| bedheadWorking.pcf | pcf | b6135cb377 | 25 | 1 |
| bedheadWorking.pcf | pcf | 8163f9914e | 26 | 1 |
| bedheadWorking.pcf | pcf | c6a4596e4b | 27 | 1 |
| bedheadWorking.pcf | pcf | ddcb84600c | 28 | 1 |
| bedheadWorking.pcf | pcf | 8a12a45038 | 29 | 1 |
| bedheadWorking.pcf | pcf | 9cdd928725 | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.002 | NaN | NaN | -1 | -1.94 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.001 | NaN | NaN | -41 | -1.93 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | 0.389 | 1.333 | NaN | NaN | 170 | -2.27 | 26.6 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.466 | -134 / 76 | 1.005 | 0.932 | 1.005 | 0.962 | 26 | -0.23 | 8.0 | 0 |
| hold | 2 | 1.80 | 0.463 | -133 / 77 | 0.970 | 0.945 | 0.977 | 0.948 | -33 | -0.04 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | 0.507 | 1.021 | NaN | NaN | 178 | -2.32 | 3.3 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -6 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
