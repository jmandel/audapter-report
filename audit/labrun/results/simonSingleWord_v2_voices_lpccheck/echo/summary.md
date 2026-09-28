# labrun: simonSingleWord_v2

- status: **completed** 
- device trials: 30 (audio 30); virtual time 133.9 s (audio 54.0 s); wall 114.2 s; speed 1.2x virtual, 0.5x audio
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
- voice-only replays (fb 2..5 trials, measurement aid; heard numbers use signalOut): 11 of 28 passed the checks
  - failed trial 5: fmts differ (33.9 Hz); residual 2.1 dB above the pre-onset output
  - failed trial 10: voice left in the residual (beta -0.885); residual 2.1 dB above the pre-onset output
  - failed trial 11: voice left in the residual (beta -1.018); residual 5.6 dB above the pre-onset output
  - failed trial 12: voice left in the residual (beta -0.997); residual 2.9 dB above the pre-onset output
  - failed trial 13: voice left in the residual (beta -0.988); residual 2.9 dB above the pre-onset output
  - failed trial 14: fmts differ (727 Hz); voice left in the residual (beta -0.964); residual 3.3 dB above the pre-onset output
  - failed trial 15: voice left in the residual (beta -1.004); residual 2.7 dB above the pre-onset output
  - failed trial 16: fmts differ (923 Hz); voice left in the residual (beta -0.983)
  - failed trial 17: voice left in the residual (beta -0.986); residual 5.0 dB above the pre-onset output
  - failed trial 22: fmts differ (445 Hz); voice left in the residual (beta -0.935); residual 2.8 dB above the pre-onset output
  - failed trial 23: voice left in the residual (beta -0.999); residual 3.9 dB above the pre-onset output
  - failed trial 24: voice left in the residual (beta -0.949); residual 3.3 dB above the pre-onset output
  - failed trial 25: voice left in the residual (beta -1.043); residual 4.0 dB above the pre-onset output
  - failed trial 26: voice left in the residual (beta -1.065); residual 4.5 dB above the pre-onset output
  - failed trial 27: voice left in the residual (beta -1.048); residual 2.3 dB above the pre-onset output
  - failed trial 28: voice left in the residual (beta -1.031); residual 2.1 dB above the pre-onset output
  - failed trial 29: fmts differ (598 Hz); voice left in the residual (beta -1.049); residual 3.4 dB above the pre-onset output

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
| bedheadWorking.pcf | pcf | db071aaa9b | 10 | 1 |
| bedheadWorking.pcf | pcf | 5f317a7b62 | 11 | 1 |
| bedheadWorking.pcf | pcf | 039b1d6579 | 12 | 1 |
| bedheadWorking.pcf | pcf | 77c9ee1b60 | 13 | 1 |
| bedheadWorking.pcf | pcf | e968e89916 | 14 | 1 |
| bedheadWorking.pcf | pcf | 26917f750a | 15 | 1 |
| bedheadWorking.pcf | pcf | 1cadd809eb | 16 | 1 |
| bedheadWorking.pcf | pcf | df58e02782 | 17 | 1 |
| bedheadWorking.pcf | pcf | 5a33407e6f | 18 | 1 |
| bedheadWorking.pcf | pcf | c5c7070202 | 19 | 1 |
| bedheadWorking.pcf | pcf | 66e3e0f968 | 20 | 1 |
| bedheadWorking.pcf | pcf | a5f4693537 | 21 | 1 |
| bedheadWorking.pcf | pcf | ede6c67d1e | 22 | 1 |
| bedheadWorking.pcf | pcf | 33ac63e499 | 23 | 1 |
| bedheadWorking.pcf | pcf | f9ca0fb054 | 24 | 1 |
| bedheadWorking.pcf | pcf | b049933d62 | 25 | 1 |
| bedheadWorking.pcf | pcf | 22f806c177 | 26 | 1 |
| bedheadWorking.pcf | pcf | cb49309e5f | 27 | 1 |
| bedheadWorking.pcf | pcf | 3e1d0dc405 | 28 | 1 |
| bedheadWorking.pcf | pcf | 10e33bc135 | 29 | 1 |
| bedheadWorking.pcf | pcf | ed83c322b6 | 30 | 1 |

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
| noShift | 3 | 1.80 | 0.000 | 0 / 0 | 1.004 | 1.000 | NaN | NaN | 212 | -1.90 | 8.0 | 0 |
| ost_check | 6 | 1.80 | 0.000 | 0 / 0 | 1.001 | 1.000 | NaN | NaN | 25 | -1.89 | 8.0 | 0 |
| transfer1 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 722 | -2.13 | -3.0 | 1 |
| baseline | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |
| ramp | 1 | 1.80 | 0.416 | -93 / 85 | 1.249 | 0.940 | 1.249 | 0.940 | 74 | -3.13 | 7.9 | 0 |
| hold | 2 | 1.80 | 0.406 | -136 / 93 | 1.207 | 0.955 | 1.193 | 0.954 | 13 | -1.80 | 8.0 | 0 |
| transfer2 | 8 | 1.80 | 0.000 | 0 / 0 | NaN | NaN | NaN | NaN | 639 | -1.91 | 22.0 | 2 |
| washout | 1 | 1.80 | 0.000 | 0 / 0 | 1.000 | 1.000 | NaN | NaN | 0 | -1.99 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
