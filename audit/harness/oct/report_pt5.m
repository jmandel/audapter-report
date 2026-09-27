% Report asset export for PT-5 (phase vocoder is not level-preserving; bPvocAmpNorm unreachable).
% A sustained vowel; an OST switches to state 1 at 0.6 s; the PCF asks for 0 st in state 0 and +2 st in
% state 1 (a typical pitch-perturbation-onset design). Controls: bPitchShift = 0 (the level the
% participant should hear) and the pvoc at a constant 0 st. Traces: 20 ms output level re input, F0.
% Usage: ./run-oct.sh report_pt5.m
% Output: out/report/pt-5/blab/{*.wav,data.json}
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
fid = fopen('cfg/report_step.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME 0.6 NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fid = fopen('cfg/report_step.pcf', 'w'); fprintf(fid, '0\n\n2\n0, 0, 0, 0, 0\n1, 2, 0, 0, 0\n'); fclose(fid);
F0D = 120;   % as in t_pitch.m; the F0/vowel sweep below shows how the step size varies
x = synth_vowel(fs, 1.2, F0D, [850 1220 2810 3800], [80 100 150 200], 'onset', 0.1, 'offset', 0.1, 'amp', 0.25);
q = p; q.bPitchShift = 0;                          d0 = run_trial(q, x);
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 1;  d1 = run_trial(q, x);
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 1;  dS = run_trial(q, x, 'ost', 'cfg/report_step.ost', 'pcf', 'cfg/report_step.pcf');
Audapter('ost', '', 0); Audapter('pcf', '', 0);
% can the documented fix be switched on?
nm = {'bPvocAmpNorm', 'bpvocmpnorm'}; r = struct(); r.ampnorm = struct('name', nm, 'result', {'', ''});
for i = 1:2
  try, Audapter('setParam', lower(nm{i}), 1, 0); r.ampnorm(i).result = 'accepted';
  catch e, r.ampnorm(i).result = e.message; end
end
W = round(0.02 * p.sr); nb = floor(numel(dS.signalIn) / W);
blk = @(s) sqrt(mean(reshape(s(1:nb*W), W, nb).^2));
lin = blk(dS.signalIn); ok = lin > 0.3 * max(lin);
rel = @(d) round(20*log10(blk(d.signalOut) ./ max(blk(d.signalIn), 1e-9)) * 100) / 100;
r.dt = 0.02; r.voiced = double(ok);
r.level_step = rel(dS); r.level_bypass = rel(d0); r.level_pvoc0 = rel(d1);
% Audapter delays the output by a fixed latency; measure it on the bypass run and align the traces
[xc, lags] = xcorr(d0.signalOut, d0.signalIn, 400); [~, im] = max(xc); r.latency_s = lags(im) / p.sr;
% F0 per 40 ms window (hop 20 ms)
F0 = nan(1, nb);
for b = 2:nb-1
  s = dS.signalOut((b-2)*W+1:(b+1)*W);
  if rms(s) > 0.01, F0(b) = est_f0(s, p.sr, 100, 400); end
end
r.f0_out = round(F0 * 10) / 10;
r.ost_onset_s = (find(dS.ost_stat >= 1, 1) - 1) * fr;
m1 = round(0.3/0.02):round(0.55/0.02); m2 = round(0.8/0.02):round(1.15/0.02);
r.gain_before_db = mean(r.level_step(m1)); r.gain_after_db = mean(r.level_step(m2)); r.gain_bypass_db = mean(r.level_bypass(m2));
r.f0_in = est_f0(dS.signalIn, p.sr); r.f0_after = median(F0(m2), 'omitnan');
printf('onset %.3f s; gain before %.2f dB, after %.2f dB, bypass %.2f dB; F0 in %.1f after %.1f (%.1f cents)\n', ...
  r.ost_onset_s, r.gain_before_db, r.gain_after_db, r.gain_bypass_db, r.f0_in, r.f0_after, 1200*log2(r.f0_after/r.f0_in));
printf('ampnorm: %s | %s\n', r.ampnorm(1).result, r.ampnorm(2).result);
% Sweep: steady-state gain at 0 st and +2 st (constant ratio), over F0 and vowel
V = struct('name', {'a', 'i'}, 'F', {[850 1220 2810 3800], [300 2300 3000 3800]}); sw = [];
for iv = 1:2, for f0 = [100 120 150 180 220 260]
  xs = synth_vowel(fs, 0.8, f0, V(iv).F, [80 100 150 200]); g = [];
  for st = [0 2]
    q = p; q.bPitchShift = 1; q.pitchShiftRatio = 2^(st/12); d = run_trial(q, xs); mm = round(0.35*p.sr):round(0.75*p.sr);
    g(end+1) = 20*log10(rms(d.signalOut(mm)) / rms(d.signalIn(mm)));
  end
  sw(end+1,:) = [iv, f0, g]; printf('sweep /%s/ F0 %d: 0 st %+.2f dB, +2 st %+.2f dB, step %.2f dB\n', V(iv).name, f0, g(1), g(2), g(2)-g(1));
end, end
r.sweep = struct('vowel', {V(sw(:,1)).name}, 'f0', num2cell(sw(:,2))', 'gain0_db', num2cell(round(sw(:,3)*100)/100)', 'gain2_db', num2cell(round(sw(:,4)*100)/100)');
od = report_outdir('pt-5');
c = struct('name', {'input_vowel', 'output_bypass', 'output_pitch_step'}, ...
  'x', {dS.signalIn, d0.signalOut, dS.signalOut}, ...
  'label', {sprintf('Input: sustained /a/, F0 %d Hz', F0D), 'Output with bPitchShift = 0 (reference level)', 'Output with the 0 to +2 st PCF step at 0.6 s'}, ...
  'warn', {'', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
report_json(fullfile(od, 'data.json'), r);
