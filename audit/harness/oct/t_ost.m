% OST timing through the full pipeline (claims ost-pcf F1, F2, F8).
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
burst = @(t0, t1, dur, a) a * randn(round(dur*fs), 1) .* ((0:round(dur*fs)-1)'/fs >= t0 & (0:round(dur*fs)-1)'/fs < t1) + 1e-4*randn(round(dur*fs),1);
first = @(d, s) (find(d.ost_stat >= s, 1) - 1) * fr;
randn('seed', 3);
% --- F1: INTENSITY_FALL after ELAPSED_TIME leaks lastStatEnd across trials
fid = fopen('cfg/fall.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
dA = run_trial(p, burst(0.04, 1.6, 2.0, 0.05), 'ost', 'cfg/fall.ost');
dB = run_trial(p, burst(0.04, 0.4, 2.0, 0.05), 'ost', 'cfg/fall.ost');
T('OST F1: trial A offset detected', abs(first(dA, 2) - 1.6) < 0.08, 'burst ends 1.60 s, state 2 at %.3f s', first(dA, 2));
T('OST F1: trial B (after A) offset detected', abs(first(dB, 2) - 0.4) < 0.08, 'burst ends 0.40 s, state 2 at %.3f s', first(dB, 2));
% --- F2: maxIOI timeout onset bookkeeping
fid = fopen('cfg/ioi.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n'); fclose(fid);
for k = 1:3
  d = run_trial(p, burst(0, 0, 1.0, 0), 'ost', 'cfg/ioi.ost');
  T(sprintf('OST F2: maxIOI trial %d timeout at 0.2 s', k), abs(first(d, 2) - 0.2) < 0.01, 'state 2 at %.3f s', first(d, 2));
  T(sprintf('OST F2: maxIOI trial %d ELAPSED 0.1 s in state 2', k), abs(first(d, 3) - first(d, 2) - 0.1) < 0.01, 'state 2 held %.3f s', first(d, 3) - first(d, 2));
end
% F2 variant: OST loaded once, trials separated only by reset (as in an experiment loop that doesn't reload)
Audapter('ost', 'cfg/ioi.ost', 0);
for k = 1:3
  d = run_trial(p, burst(0, 0, 1.0, 0), 'init', k == 1);
  T(sprintf('OST F2: no-reload trial %d timeout at 0.2 s', k), abs(first(d, 2) - 0.2) < 0.01, 'state 2 at %.3f s', first(d, 2));
end
% --- F8: blab INTENSITY_AND_RATIO_ABOVE_THRESH: hold from field 4 ({} per manual) vs explicit field 5
w = {};
for f5 = {'{}', '0.05'}
  fid = fopen('cfg/andratio.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 INTENSITY_AND_RATIO_ABOVE_THRESH 0.01 0.05 %s\n2 OST_END NaN NaN {}\n\nn = 0\n', f5{1}); fclose(fid);
  d = run_trial(p, burst(0.2, 0.8, 1.0, 0.05), 'ost', 'cfg/andratio.ost'); w{end+1} = first(d, 2);
end
T('OST F8: AND_RATIO field-4 hold (50 ms) honoured', w{1} - 0.2 > 0.045, 'onset 0.200; with {}: %.3f s, with field5=0.05: %.3f s', w{1}, w{2});
Audapter('ost', '', 0);
