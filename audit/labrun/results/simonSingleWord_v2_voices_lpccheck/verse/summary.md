# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 31 (audio 31); virtual time 138.1 s (audio 55.8 s); wall 117.9 s; speed 1.2x virtual, 0.5x audio
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
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 11 of 29 passed the checks
  - failed trial 2: residual 2.1 dB above the pre-onset output
  - failed trial 10: voice left in the residual (beta -0.970); residual 2.5 dB above the pre-onset output
  - failed trial 11: fmts differ (72.3 Hz); voice left in the residual (beta -1.023); residual 5.8 dB above the pre-onset output
  - failed trial 12: voice left in the residual (beta -0.914); residual 2.1 dB above the pre-onset output
  - failed trial 13: voice left in the residual (beta -1.118); residual 3.7 dB above the pre-onset output
  - failed trial 14: voice left in the residual (beta -0.994); residual 3.1 dB above the pre-onset output
  - failed trial 15: voice left in the residual (beta -1.018); residual 2.8 dB above the pre-onset output
  - failed trial 16: fmts differ (899 Hz); voice left in the residual (beta -1.024)
  - failed trial 17: voice left in the residual (beta -1.024); residual 4.3 dB above the pre-onset output
  - failed trial 22: voice left in the residual (beta -0.973); residual 3.7 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -0.934); residual 3.9 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.973); residual 3.5 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -0.989); residual 3.3 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.025); residual 3.3 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -0.926)
  - failed trial 28: voice left in the residual (beta -0.941)
  - failed trial 29: voice left in the residual (beta -0.968); residual 3.6 dB above the pre-onset output
  - failed trial 30: voice left in the residual (beta -1.064); residual 2.3 dB above the pre-onset output

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
| bedheadWorking.pcf | pcf | dc3e940922 | 10 | 1 |
| bedheadWorking.pcf | pcf | 4da6516471 | 11 | 1 |
| bedheadWorking.pcf | pcf | 3816585b25 | 12 | 1 |
| bedheadWorking.pcf | pcf | 2002aececc | 13 | 1 |
| bedheadWorking.pcf | pcf | fd73c50cde | 14 | 1 |
| bedheadWorking.pcf | pcf | 9a3ff953c9 | 15 | 1 |
| bedheadWorking.pcf | pcf | 10ae79942a | 16 | 1 |
| bedheadWorking.pcf | pcf | 7e1fc66e2f | 17 | 1 |
| bedheadWorking.pcf | pcf | d6f442b266 | 18 | 1 |
| bedheadWorking.pcf | pcf | 2ef794e35c | 19 | 1 |
| bedheadWorking.pcf | pcf | 10f727be7e | 20 | 1 |
| bedheadWorking.pcf | pcf | 083248f5fd | 21 | 1 |
| bedheadWorking.pcf | pcf | 8256b55160 | 22 | 1 |
| bedheadWorking.pcf | pcf | d66f7df06f | 23 | 1 |
| bedheadWorking.pcf | pcf | b34a6c1dd1 | 24 | 1 |
| bedheadWorking.pcf | pcf | a2f19a6ea4 | 25 | 1 |
| bedheadWorking.pcf | pcf | a2f56db5da | 26 | 1 |
| bedheadWorking.pcf | pcf | d16ec91ce2 | 27 | 1 |
| bedheadWorking.pcf | pcf | a6f5ef442a | 28 | 1 |
| bedheadWorking.pcf | pcf | ac6111ccc9 | 29 | 1 |
| bedheadWorking.pcf | pcf | dace7508b5 | 30 | 1 |
| bedheadWorking.pcf | pcf | 9f1b5000e0 | 31 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.005 | 1.000 | NaN | NaN | 80 | -1.95 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.004 | 1.000 | NaN | NaN | 45 | -1.95 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | 0.633 | 1.779 | NaN | NaN | 271 | -1.75 | 2.6 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.448 | -129 / 83 | 1.193 | 0.893 | 1.218 | 0.892 | 41 | -1.54 | 7.7 | 0 |
| hold | 2 | 1.80 | 0.501 | -113 / 82 | 1.095 | 0.898 | 1.089 | 0.898 | 25 | -1.59 | 7.8 | 0 |
| transfer2 | 9 | 1.80 | 0.000 | 0 / 0 | 0.563 | 0.812 | NaN | NaN | 443 | -1.29 | 8.6 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | -20 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
