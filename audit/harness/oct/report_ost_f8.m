% Report asset export for OST-F8 (blab INTENSITY_AND_RATIO_ABOVE_THRESH reads its hold duration from field 5;
% the documented "{}" placeholder parses as 0 s, so the hold is silently dropped).
% Basis: t_ost.m F8 (same OST with field 5 = {} vs a number). Here with a fricative-like input so the rule does what
% it is meant for (loud AND high-frequency, rms_p/rms_s > prm2), and a PCF that raises intensity by INT_DB in state 2,
% so the onset of state 2 is audible. Two inputs: "sa" alone, and "sa" preceded by a 20 ms click (the kind of
% transient a hold is meant to reject). Each input runs with field 5 = "0.05" (intended 50 ms hold) and "{}".
% Usage: ./run-oct.sh report_ost_f8.m      Output: out/report/ost-f8/blab/{*.wav,data.json}
% (blab-only mode: upstream 2.1.5 rejects INTENSITY_AND_RATIO_ABOVE_THRESH at load, so there is no upstream run.)
p = defparams('female');
fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
RMS_THR = 0.01; RATIO_THR = 1.5; HOLD = 0.05; INT_DB = 10;
ost = @(f5) sprintf('rmsSlopeWin = 0.030000\n\nn = 2\n0 INTENSITY_AND_RATIO_ABOVE_THRESH %g %g %s\n2 OST_END NaN NaN {}\n\nn = 0\n', RMS_THR, RATIO_THR, f5);
fid = fopen('cfg/report_andratio_hold.ost', 'w'); fprintf(fid, '%s', ost(sprintf('%g', HOLD))); fclose(fid);
fid = fopen('cfg/report_andratio_braces.ost', 'w'); fprintf(fid, '%s', ost('{}')); fclose(fid);
fid = fopen('cfg/report_andratio.pcf', 'w'); fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, %g, 0, 0\n', INT_DB); fclose(fid);
randn('seed', 5);
T1 = 1.2; S0 = 0.40; S1 = 0.65; V1 = 1.05; C0 = 0.10; CD = 0.02;
[bh, ah] = butter(4, 3500/(fs/2), 'high');
fric = @(n) filter(bh, ah, randn(n, 1));
ramp = @(n, r) min(1, min((1:n)', (n:-1:1)') / round(r*fs));
x = 1e-4*randn(round(T1*fs), 1);
ns = round((S1-S0)*fs); s = fric(ns); s = 0.08 * s / sqrt(mean(s.^2)) .* ramp(ns, 0.03);        % /s/ 0.40-0.65 s
x(round(S0*fs)+(1:ns)) += s;
v = synth_vowel(fs, V1-S1, 200, [760 1150 2500 3500], [80 100 150 200], 'onset', 0, 'offset', 0, 'amp', 0.3);   % /a/ 0.65-1.05 s
x(round(S1*fs)+(1:numel(v))) += v;
xc = x; nc = round(CD*fs); c = fric(nc); c = 0.15 * c / sqrt(mean(c.^2)) .* ramp(nc, 0.003);      % 20 ms click at 0.10 s
xc(round(C0*fs)+(1:nc)) += c;
run = @(xx, f) run_trial(p, xx, 'ost', f, 'pcf', 'cfg/report_andratio.pcf');
dH = run(x, 'cfg/report_andratio_hold.ost');  dB = run(x, 'cfg/report_andratio_braces.ost');
cH = run(xc, 'cfg/report_andratio_hold.ost'); cB = run(xc, 'cfg/report_andratio_braces.ost');
Audapter('ost', '', 0); Audapter('pcf', '', 0);
first = @(d, s) (find(d.ost_stat >= s, 1) - 1) * fr;
r = struct();
r.frame_s = fr; r.rms_thr = RMS_THR; r.ratio_thr = RATIO_THR; r.hold_s = HOLD; r.int_db = INT_DB;
r.s_on = S0; r.s_off = S1; r.v_off = V1; r.click_on = C0; r.click_dur = CD;
r.hold_state2_s = first(dH, 2); r.braces_state2_s = first(dB, 2);
r.click_hold_state2_s = first(cH, 2); r.click_braces_state2_s = first(cB, 2);
r.hold_delay_ms = 1000 * (r.hold_state2_s - S0); r.braces_delay_ms = 1000 * (r.braces_state2_s - S0);
r.click_hold_delay_ms = 1000 * (r.click_hold_state2_s - S0);
r.click_braces_after_click_ms = 1000 * (r.click_braces_state2_s - C0);
% frames spent in state 1 (the hold) before state 2
r.hold_frames = nnz(dH.ost_stat == 1 & (0:numel(dH.ost_stat)-1)' * fr < r.hold_state2_s);
r.braces_frames = nnz(dB.ost_stat == 1 & (0:numel(dB.ost_stat)-1)' * fr < r.braces_state2_s);
% did the click alone enter state 1 in the hold run (and fall back)?
r.click_hold_entered1 = any(cH.ost_stat(1:round(0.3/fr)) == 1);
% measured output/input level change in the first 60 ms of /s/ (click trial)
lv = @(d, a, b) 20*log10(sqrt(mean(d.signalOut(round(a*p.sr):round(b*p.sr)).^2)) / sqrt(mean(d.signalIn(round(a*p.sr):round(b*p.sr)).^2)));
r.early_s_gain_hold_db = lv(cH, S0 + 0.005, S0 + 0.06); r.early_s_gain_braces_db = lv(cB, S0 + 0.005, S0 + 0.06);
r.late_gain_hold_db = lv(cH, S1 + 0.1, V1 - 0.05);
printf('no click: state 2 at %.3f s (hold 0.05) vs %.3f s ({}) = %.0f vs %.0f ms after /s/ onset\n', r.hold_state2_s, r.braces_state2_s, r.hold_delay_ms, r.braces_delay_ms);
printf('click:    state 2 at %.3f s (hold 0.05) vs %.3f s ({}); click entered state 1 with hold: %d\n', r.click_hold_state2_s, r.click_braces_state2_s, r.click_hold_entered1);
printf('level in first 55 ms of /s/: hold %+.1f dB, {} %+.1f dB; later %+.1f dB\n', r.early_s_gain_hold_db, r.early_s_gain_braces_db, r.late_gain_hold_db);
k = 1:5:numel(dH.ost_stat); lg = @(v) round(v(k)' * 1e4) / 1e4;
r.t = round((k-1) * fr * 1e4) / 1e4;
r.rms = lg(dH.rms(:,1)); r.rms_click = lg(cH.rms(:,1));
r.stat_hold = dH.ost_stat(k)'; r.stat_braces = dB.ost_stat(k)'; r.stat_click_hold = cH.ost_stat(k)'; r.stat_click_braces = cB.ost_stat(k)';
od = report_outdir('ost-f8');
cl = struct('name', {'input_click', 'output_click_hold', 'output_click_braces', 'output_braces'}, ...
  'x', {cB.signalIn, cH.signalOut, cB.signalOut, dB.signalOut}, ...
  'label', {sprintf('Input: a %.0f ms click, then "sa" (/s/ from %.2f s)', 1000*CD, S0), ...
            sprintf('Output: field 5 = %g (+%g dB from %.2f s)', HOLD, INT_DB, r.click_hold_state2_s), ...
            sprintf('Output: field 5 = {} (+%g dB from %.2f s, triggered by the click)', INT_DB, r.click_braces_state2_s), ...
            sprintf('Output: field 5 = {}, no click (+%g dB from %.3f s)', INT_DB, r.braces_state2_s)}, ...
  'warn', {'', '', '', ''});
r.audio = report_wavgroup(od, p.sr, cl);
r.params = struct('sr', p.sr, 'downFact', p.downFact, 'frameLen', p.frameLen, 'rmsThresh', p.rmsThresh, ...
  'ost_hold', fileread('cfg/report_andratio_hold.ost'), 'ost_braces', fileread('cfg/report_andratio_braces.ost'), 'pcf', fileread('cfg/report_andratio.pcf'));
r.settings = report_settings(p, 'female', 'ost', fileread('cfg/report_andratio_braces.ost'), 'ost_safe', fileread('cfg/report_andratio_hold.ost'), 'pcf', fileread('cfg/report_andratio.pcf'), 'switching', 'one trial per OST variant', 'input', 'synthetic /s/-like noise onset followed by a vowel');
report_json(fullfile(od, 'data.json'), r);
