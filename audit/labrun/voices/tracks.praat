# Per-file 10 ms tracks for voice-bank validation: time, intensity (dB), F0 (Hz, 0 = unvoiced), F1-F3 (Hz, Burg).
# praat --run tracks.praat LIST OUTDIR [CEILING_OFFSET]   (LIST: lines "path<TAB>gender", gender F or M; the formant
# ceiling is 5500 Hz (F) / 5000 Hz (M) plus CEILING_OFFSET, +500 for the second reference used in the LPC-check QC)
form tracks
  sentence list
  sentence outdir
  real ceiling_offset 0
endform
strings = Read Strings from raw text file: list$
n = Get number of strings
for i to n
  selectObject: strings
  line$ = Get string: i
  tab = index(line$, tab$)
  path$ = left$(line$, tab - 1)
  g$ = mid$(line$, tab + 1, 1)
  if g$ = "M"
    fmax = 5000 + ceiling_offset
    f0lo = 60
    f0hi = 300
  else
    fmax = 5500 + ceiling_offset
    f0lo = 100
    f0hi = 500
  endif
  snd = Read from file: path$
  dur = Get total duration
  selectObject: snd
  pit = To Pitch (filtered autocorrelation): 0.01, f0lo, f0hi, 15, "no", 0.03, 0.09, 0.5, 0.055, 0.35, 0.14
  selectObject: snd
  frm = To Formant (burg): 0.01, 5, fmax, 0.025, 50
  selectObject: snd
  int = To Intensity: f0lo, 0.01, "yes"
  base$ = replace_regex$(path$, "^.*/", "", 0)
  out$ = outdir$ + "/" + base$ - ".wav" + ".tsv"
  writeFileLine: out$, "t", tab$, "db", tab$, "f0", tab$, "F1", tab$, "F2", tab$, "F3"
  t = 0.02
  while t < dur - 0.02
    selectObject: int
    db = Get value at time: t, "cubic"
    selectObject: pit
    f0 = Get value at time: t, "Hertz", "linear"
    if f0 = undefined
      f0 = 0
    endif
    selectObject: frm
    f1 = Get value at time: 1, t, "hertz", "linear"
    f2 = Get value at time: 2, t, "hertz", "linear"
    f3 = Get value at time: 3, t, "hertz", "linear"
    appendFileLine: out$, fixed$(t, 3), tab$, fixed$(db, 1), tab$, fixed$(f0, 1), tab$, fixed$(f1, 0), tab$, fixed$(f2, 0), tab$, fixed$(f3, 0)
    t = t + 0.01
  endwhile
  removeObject: snd, pit, frm, int
endfor
