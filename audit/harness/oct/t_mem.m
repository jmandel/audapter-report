% Memory-safety scenarios; run under build-asan. Each scenario prints DONE; sanitizer reports are the signal.
p = defparams('female'); fs = p.sr * p.downFact;
x = synth_vowel(fs, 0.6, 120, [850 1220 2810 3800], [80 100 150 200]);
sc = getenv('SCEN');
switch sc
 case 'pcf_short'   % OST reaches state 2, PCF only defines states 0-1 (ost-pcf F4)
  fid = fopen('cfg/s3.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 INTENSITY_RISE_HOLD 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
  fid = fopen('cfg/s2.pcf', 'w'); fprintf(fid, '0\n\n2\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n'); fclose(fid);
  q = p; q.bShift = 1; d = run_trial(q, x, 'ost', 'cfg/s3.ost', 'pcf', 'cfg/s2.pcf');
  printf('max ost_stat %d, frames with sfmts>0: %d (PCF defines no shift at all)\n', max(d.ost_stat), nnz(d.sfmts(:,1)));
 case 'clamp_short' % clamp arrays shorter than 2048 (formant F1 / interface I-08)
  q = p; q.bShift = 1; q.bClampFormants = 1; q.clamp_osts = [0 5]; q.clamp_f1 = 700*ones(1,100); q.clamp_f2 = 1500*ones(1,100);
  d = run_trial(q, x);
  printf('clamp frames logged: %d; sfmts F1 values seen: %s\n', nnz(d.sfmts(:,1)), mat2str(unique(round(d.sfmts(d.sfmts(:,1)>0,1)))'));
 case 'pert_short'  % 1D field arrays shorter than 257
  q = p; q.bShift = 1; q.pertF2 = linspace(0,5000,10); q.pertAmp = 0.2*ones(1,10); q.pertPhi = zeros(1,10); q.pertF1 = zeros(1,10);
  d = run_trial(q, x); printf('ran\n');
 case 'long'        % 35 s trial (> maxRecSize at 16 kHz = 30 s)
  y = repmat(x, ceil(35*fs/numel(x)), 1); d = run_trial(p, y);
  printf('input %.1f s, getData returned %.2f s\n', numel(y)/fs, numel(d.signalIn)/p.sr);
 case 'pitch'       % pvoc + time-domain pitch shift, DAF
  q = p; q.bPitchShift = 1; q.pitchShiftRatio = 2^(3/12); q.delayFrames = 10; d = run_trial(q, x); printf('pvoc ran\n');
end
printf('DONE %s\n', sc);
