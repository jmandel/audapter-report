% Report asset export for I-03 (the recorders wrap silently at maxRecSize: 30 s at 16 kHz in blab, 14.4 s upstream).
% One 35 s trial, as a long reading or continuous-speech trial would be: a 0.6 s vowel every second (0.7-1.3 s, 1.7-2.3 s, ...).
% OST: state 0 for 10 s, state 1 for 22 s (e.g. the perturbation block), then state 2 (OST_END), all ELAPSED_TIME.
% trialLen = 34 s with AudapterIO's default rampLen 0.05 s: output should fade out at 33.95 s and be muted after 34 s.
% getData is read twice: just before the wrap (what happened) and at the end (what the experiment script gets).
% The device-rate output (what is heard) is read from the frame runFrame writes back into (finding I-04).
% Usage: ./run-oct.sh report_i03.m
%        VARIANT=upstream ./run-oct.sh report_i03.m build-upstream upstream/audapter_matlab
% Output: out/report/i-03/<build>/data.json (+ one clip for blab)
UP = strcmp(getenv('VARIANT'), 'upstream');
pf = '/h/oct/out/report/i-03-params.mat';
if UP, load(pf); else, p = defparams('female'); p.trialLen = 34; p.rampLen = 0.05; save('-binary', pf, 'p'); end
fs = p.sr * p.downFact; N = p.frameLen * p.downFact; TR = 35.0; fr = p.frameLen / p.sr;
fid = fopen('cfg/report_i03.ost', 'w');
fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 10 NaN {}\n1 ELAPSED_TIME 22 NaN {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fid = fopen('cfg/report_i03.pcf', 'w'); fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n'); fclose(fid);
randn('seed', 31);
x = 1e-4 * randn(round(TR*fs), 1); VV = {[850 1220 2810 3800], [300 2300 3000 3800], [580 1800 2600 3500]};
for k = 0:34
  v = synth_vowel(fs, 0.6, 190 + 10*mod(k,3), VV{mod(k,3)+1}, [80 100 150 200], 'onset', 0.02, 'offset', 0.02, 'amp', 0.25);
  i0 = round((0.7 + k) * fs); if i0 + numel(v) <= numel(x), x(i0 + (1:numel(v))) = x(i0 + (1:numel(v))) + v; end
end
AudapterIO('init', p); Audapter('ost', 'cfg/report_i03.ost', 0); Audapter('pcf', 'cfg/report_i03.pcf', 0); Audapter('reset');
maxRec = numel(Audapter(22)); nF = floor(numel(x) / N); nWrap = maxRec / p.frameLen;   % frames until the recorder wraps
y = zeros(size(x)); dpre = [];
for k = 1:nF
  f = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', f); y((k-1)*N+1:k*N) = f;
  if k == nWrap - 1, dpre = AudapterIO('getData'); end         % last frame before the first wrap
end
d = AudapterIO('getData');
whole = Audapter(22);                                              % the whole input recorder, not just the returned part
r = struct(); r.ost_elapsed = [10 22]; r.maxRecSize = maxRec; r.sr = p.sr; r.frame_s = fr; r.trial_s = nF * N / fs; r.trialLen = p.trialLen; r.rampLen = p.rampLen;
r.wrap_s = maxRec / p.sr; r.returned_s = numel(d.signalIn) / p.sr; r.returned_rows = numel(d.ost_stat);
r.returned_from_s = r.trial_s - r.returned_s;
% which part of the trial does the returned signalIn match? (cross-check against the input, decimated by Audapter)
r.pre_returned_s = numel(dpre.signalIn) / p.sr;
r.returned_matches_tail = max(abs(d.signalIn - dpre.signalIn(end-numel(d.signalIn)+1:end))) > 0;   % must differ: different times
tail_in = whole(numel(d.signalIn)+1:numel(dpre.signalIn));
r.stale_tail_s = numel(tail_in) / p.sr; r.stale_tail_equal = isequal(tail_in, dpre.signalIn(numel(d.signalIn)+1:end));
r.intervals_first = d.intervals(1);
st_pre = dpre.ost_stat(:)'; st_post = d.ost_stat(:)';
r.state1_onset_s = (find(st_pre >= 1, 1) - 1) * fr;
i2 = find(st_pre >= 2, 1); if isempty(i2), r.state2_onset_pre_s = NaN; else, r.state2_onset_pre_s = (i2 - 1) * fr; end
i2 = find(st_post >= 2, 1); if isempty(i2), r.state2_onset_post = NaN; else, r.state2_onset_post = r.returned_from_s + (i2 - 1) * fr; end
r.post_states = unique(st_post);
% state traces for the sketch, 10 ms steps: actual (pre-wrap snapshot + returned part)
k = 1:5:numel(st_pre); r.stat_pre = st_pre(k); r.stat_pre_t0 = 0;
k = 1:5:numel(st_post); r.stat_post = st_post(k); r.stat_post_t0 = r.returned_from_s; r.stat_dt = 5 * fr;
% 20 ms envelopes of the input and of the heard (device) output
W = round(0.02 * fs); nb = floor(numel(x) / W); env = @(s) 20*log10(max(sqrt(mean(reshape(s(1:nb*W), W, nb).^2)), 1e-6));
r.env_dt = 0.02; r.env_in = round(env(x) * 10) / 10; r.env_out = round(env(y) * 10) / 10;
% heard output around the wrap (onset ramp re-applied) and after trialLen (mute expected)
t = ((1:numel(y))' - 1) / fs;
r.out_rms_pre_wrap = rms(y(t >= r.wrap_s - 0.15 & t < r.wrap_s - 0.01)); r.out_rms_ramp = rms(y(t >= r.wrap_s & t < r.wrap_s + 0.05));
r.out_rms_ref = rms(y(t >= 33.75 & t < 33.9)); r.out_rms_after_triallen = rms(y(t >= 34.0 & t < 34.25));
r.ramp_db = 20*log10(r.out_rms_ramp / r.out_rms_pre_wrap);
z = y(t >= r.wrap_s - 0.005 & t < r.wrap_s + 0.06); r.ramp_zoom = round(z(1:12:end)' * 1e4) / 1e4; r.ramp_zoom_t0 = r.wrap_s - 0.005; r.ramp_zoom_dt = 12 / fs;
r.muted_after_triallen = r.out_rms_after_triallen < 1e-6;
% Keep the same session running (low noise) to 65 s: does state 2 ever come? Snapshot before the second wrap (blab only).
if ~UP
xn = 1e-4 * randn(round(30*fs), 1); dmid = [];
for k = 1:floor(numel(xn) / N)
  f = xn((k-1)*N+1:k*N) + 0; Audapter('runFrame', f);
  if nF + k == 2*nWrap - 1, dmid = AudapterIO('getData'); end
end
dend = AudapterIO('getData');
r.ext_total_s = (nF + floor(numel(xn) / N)) * N / fs; r.ext_max_state_to_2nd_wrap = max(dmid.ost_stat); r.ext_max_state_end = max(dend.ost_stat);
r.ext_returned_s = numel(dend.signalIn) / p.sr;
printf('continued to %.1f s: max ost_stat %d-%.0f s: %d; after that: %d; getData returns %.2f s\n', r.ext_total_s, r.wrap_s, 2*r.wrap_s, ...
  r.ext_max_state_to_2nd_wrap, r.ext_max_state_end, r.ext_returned_s);
end
printf('maxRecSize %d (%.1f s): %.1f s trial, getData returned %.2f s (%d rows), from %.2f s; before the wrap %.2f s\n', ...
  maxRec, r.wrap_s, r.trial_s, r.returned_s, r.returned_rows, r.returned_from_s, r.pre_returned_s);
printf('OST: state 1 at %.3f s, state 2 before wrap: %g, state 2 in returned data at: %g; states returned: %s\n', r.state1_onset_s, r.state2_onset_pre_s, r.state2_onset_post, mat2str(r.post_states));
printf('output rms pre-wrap %.4f, first 50 ms after wrap %.4f (%.1f dB), 33.75-33.9 %.4f, 34.0-34.25 %.4f (muted %d); intervals(1) %g; stale tail %.2f s equal %d\n', ...
  r.out_rms_pre_wrap, r.out_rms_ramp, r.ramp_db, r.out_rms_ref, r.out_rms_after_triallen, r.muted_after_triallen, r.intervals_first, r.stale_tail_s, r.stale_tail_equal);
od = report_outdir('i-03');
if ~UP
  seg = y(t >= 27 & t < 35); c = struct('name', {'output_27_to_35s'}, 'x', {resample(seg, 1, 3)}, ...
    'label', {'Heard, 27-35 s of the trial (trialLen 34 s, rampLen 0.05 s)'}, ...
    'warn', {'At 30.00 s the onset ramp restarts (a 50 ms fade-in mid-vowel), and the output is not muted at 34 s.'});
  r.audio = {report_wavgroup(od, p.sr, c)};   % cell: jsonencode keeps a one-clip list a list
end
if ~UP, r.settings = report_settings(p, 'female', 'ost', fileread('cfg/report_i03.ost'), 'pcf', fileread('cfg/report_i03.pcf'), 'switching', 'one 35 s trial', 'input', 'synthetic vowels over 35 s'); end
report_json(fullfile(od, 'data.json'), r);
