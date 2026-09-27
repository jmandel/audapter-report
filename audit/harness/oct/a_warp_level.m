% Does the heard level change during a PCF time warp (bPitchShift = 1, pvoc), as in time-warp experiments?
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
x = synth_vowel(fs, 1.6, 180, [700 1200 2600 3500], [80 100 150 200], 'onset', 0.1, 'offset', 0.2);
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 1;
fid = fopen('cfg/warp1.pcf', 'w'); fprintf(fid, '1\n0.5, 0.5, 0.3, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n'); fclose(fid);   % warp from 0.5 s: slow x0.5 for 0.3 s, then x2
d0 = run_trial(q, x, 'ost', 'cfg/one.ost', 'pcf', 'cfg/f1up.pcf');   % pvoc on, PCF without warp (F1 row unused: bShift 0)
Audapter('ost', '', 0); Audapter('pcf', '', 0);
d1 = run_trial(q, x, 'ost', 'cfg/one.ost', 'pcf', 'cfg/warp1.pcf');
Audapter('ost', '', 0); Audapter('pcf', '', 0);
fid = fopen('cfg/warp0.pcf', 'w'); fprintf(fid, '1\n0.5, 0.5, 0.0, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n'); fclose(fid);
dn = run_trial(q, x, 'ost', 'cfg/one.ost', 'pcf', 'cfg/warp0.pcf'); Ln = 20*log10(sqrt(movmean(dn.signalOut.^2, round(0.05*p.sr)))+1e-12);
Audapter('ost', '', 0); Audapter('pcf', '', 0);
W = round(0.05 * p.sr); lv = @(y) 20*log10(sqrt(movmean(y.^2, W)) + 1e-12);
Li = lv(d1.signalIn); L0 = lv(d0.signalOut); L1 = lv(d1.signalOut); t = (0:numel(Li)-1)'/p.sr;
S = {0.2,0.45,'before warp'; 0.55,0.75,'during slow-down'; 0.85,1.05,'catch-up'; 1.25,1.6,'after warp'}; for k = 1:4
  m = t > S{k,1} & t < S{k,2};
  printf('%-18s  no warp section %+5.1f dB | warp %+5.1f dB | zero-length warp (control trial) %+5.1f dB\n', S{k,3}, median(L0(m)-Li(m)), median(L1(m)-Li(m)), median(Ln(m)-Li(m)));
end
