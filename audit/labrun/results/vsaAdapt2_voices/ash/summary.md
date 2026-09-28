# labrun: vsaAdapt2

- status: **error** 'run_vsaAdapt_audapter' undefined near line 177, column 8
  - at /w/sandbox/repos/vsaCentralize/run_vsaAdapt2_expt.m:177 (run_vsaAdapt2_expt)
  - at /a/audit/labrun/oct/labrun_main.m:148 (labrun_main)
  - at /usr/share/octave/9.4.0/m/miscellaneous/run.m:78 (run)
- device trials: 12 (audio 12); virtual time 41.5 s (audio 18.0 s); wall 21.7 s; speed 1.9x virtual, 0.8x audio
- console/dialog prompts answered (see ops.tsv for answers):
  - `Enter participant gender (m/f):`
  - `Save LPC order and exit?`
  - `Is the perturbation field OK? y/n:`
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
| not-forwarded | bRMSClip | brmsclip | 0 | 1 | 12 trials (1-12) |
| not-forwarded | rmsClipThresh | rmsclipthresh | 0.5 | 1 | 12 trials (1-12) |

## Per condition (audio trials)

| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline | 12 | 1.50 | 0.000 | 0 / 0 | 1.011 | 1.002 | NaN | NaN | 141 | -1.94 | 8.0 | 0 |

Per-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.
