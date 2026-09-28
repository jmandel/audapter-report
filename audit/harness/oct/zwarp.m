% Zero-length warp row near trial start: does Audapter throw "predicting the future is impossible"?
p = getAudapterDefaultParams('male'); p.downFact = 2; p.sr = 24000; p.frameLen = 32; p.nDelay = 3; p.rmsThresh = 0.005; p.bPitchShift = 1;
fs = p.sr * p.downFact; x = synth_vowel(fs, 0.8, 120, [700 1200 2600 3500], [80 100 150 200], 'onset', 0.02);
for tb = [0 0.02 0.05 0.08 0.1 0.12 0.2 0.4]
  fid = fopen('cfg/zwarp.pcf', 'w'); fprintf(fid, '1\n%g, 0.1, 0.0, 0.0, 3.0\n\n1\n0, 0.0, 0, 0, 0\n', tb); fclose(fid);
  try
    run_trial(p, x, 'ost', 'cfg/one.ost', 'pcf', 'cfg/zwarp.pcf'); r = 'ok';
  catch e
    r = ['ERROR: ' e.message];
  end
  Audapter('ost','',0); Audapter('pcf','',0);
  printf('zero-length warp at tBegin %.2f s: %s\n', tb, r);
end
