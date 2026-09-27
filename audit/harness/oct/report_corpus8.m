% Report asset export for CORPUS-8 (logged pitchHz vs true F0 under the default analysis window).
% Synthetic vowels of known F0 (as a_pitchtrack.m, finer sweep); run once per config in a fresh process:
%   SCEN="32 5" ./run-oct.sh report_corpus8.m ; SCEN="64 7" ./run-oct.sh report_corpus8.m
% Output: out/report/corpus-8/blab/data_<frameLen>.json
cfg = str2num(getenv('SCEN')); p0 = defparams('male'); fs = p0.sr * p0.downFact;
F0 = [85 90 100 110 120 130 140 150 160 170 180 200 220 250]; R = struct('f0', {}, 'median_hz', {}, 'within5', {}, 'n', {});
case_mark('observed');   % Playground test case capture (audit/playground/capture); no-op otherwise
for f0 = F0
  p = p0; p.frameLen = cfg(1); p.nDelay = cfg(2);
  p.bTimeDomainShift = 1; p.pitchLowerBoundHz = 70; p.pitchUpperBoundHz = 300; p.bCepsLift = 1;
  p.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)];
  x = synth_vowel(fs, 0.8, f0, [700 1200 2600 3500], [80 100 150 200]);
  d = run_trial(p, x); v = d.pitchHz(d.pitchHz > 0);
  R(end+1) = struct('f0', f0, 'median_hz', median(v), 'within5', mean(abs(v/f0 - 1) < 0.05), 'n', numel(v));
  printf('frameLen %d nDelay %d F0 %3d: median %6.1f Hz, within 5%%: %3.0f%%\n', cfg(1), cfg(2), f0, median(v), 100*R(end).within5);
end
case_mark('');
r = struct('frameLen', cfg(1), 'nDelay', cfg(2), 'window_ms', 1000 * cfg(1) * cfg(2) / p0.sr, 'sweep', R);
od = report_outdir('corpus-8'); report_json(fullfile(od, sprintf('data_%d.json', cfg(1))), r);
