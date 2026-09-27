% Report asset export for OST-F1 (OST state leaks across trials; OST_TAB::reset() never called).
% Same OST as t_ost.m F1, with vowels instead of noise bursts and a PCF that shifts F1 +30 % in state 1,
% so the leak is audible. Run order in ONE MEX session: B (fresh, the control), A, B again (leaked).
% Usage: ./run-oct.sh report_ost_f1.m   then   VARIANT=upstream ./run-oct.sh report_ost_f1.m build-upstream upstream/audapter_matlab
% Output: out/report/ost-f1/<build>/{*.wav,data.json}
UP = strcmp(getenv('VARIANT'), 'upstream');
if ~UP, p = defparams('female'); end
if ~UP, p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0;
p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
p.pertF1 = linspace(0, 5000, 257); p.pertF2 = p.pertF1; p.pertAmp = zeros(1,257); p.pertPhi = zeros(1,257); end
% Upstream build: reuse the blab-made params (upstream mcode lacks fsic; pertF1 is a blab-only param).
pf = '/h/oct/out/report/ost-f1/params.mat';
if UP, load(pf); p = rmfield(p, 'pertF1'); else, save('-binary', pf, 'p'); end
fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
fid = fopen('cfg/report_fall.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fid = fopen('cfg/report_s1f1.pcf', 'w'); fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n'); fclose(fid);
randn('seed', 7);
V_EH = [580 1800 2600 3500]; V_AA = [760 1150 2500 3500]; BW = [80 100 150 200];
place = @(x, t0, y) [x(1:round(t0*fs)); y; x(round(t0*fs)+numel(y)+1:end)];
vow = @(dur, F) synth_vowel(fs, dur, 200, F, BW, 'onset', 0, 'offset', 0, 'amp', 0.3);
xA = 1e-4*randn(round(2.0*fs), 1); xA = place(xA, 0.04, vow(1.56, V_AA));             % trial A: one long vowel, 0.04-1.60 s
xB = 1e-4*randn(round(2.0*fs), 1); xB = place(xB, 0.04, vow(0.36, V_EH));              % trial B: word 1, 0.04-0.40 s
xB = place(xB, 0.60, vow(0.70, V_AA));                                                  %          word 2, 0.60-1.30 s
dB0 = run_trial(p, xB, 'ost', 'cfg/report_fall.ost', 'pcf', 'cfg/report_s1f1.pcf');   % fresh MEX: expected behaviour
dA  = run_trial(p, xA, 'ost', 'cfg/report_fall.ost', 'pcf', 'cfg/report_s1f1.pcf');
dB1 = run_trial(p, xB, 'ost', 'cfg/report_fall.ost', 'pcf', 'cfg/report_s1f1.pcf');   % same input, after trial A
Audapter('ost', '', 0); Audapter('pcf', '', 0);
first = @(d, s) (find(d.ost_stat >= s, 1) - 1) * fr;
% F1 heard in word 2 (independent LPC on the output audio, 0.75-1.15 s)
w2 = @(d) median(est_formants(d.signalOut(round(0.75*p.sr):round(1.15*p.sr)), p.sr)(:,1), 'omitnan');
r = struct();
r.frame_s = fr; r.offset_B_s = 0.40; r.offset_A_s = 1.60;
r.state2_A_s = first(dA, 2); r.state2_B_fresh_s = first(dB0, 2); r.state2_B_after_A_s = first(dB1, 2);
r.word2_F1_in_hz = w2(struct('signalOut', dB0.signalIn));
r.word2_F1_out_fresh_hz = w2(dB0); r.word2_F1_out_after_A_hz = w2(dB1);
printf('state 2: A %.3f  B fresh %.3f  B after A %.3f s\n', r.state2_A_s, r.state2_B_fresh_s, r.state2_B_after_A_s);
printf('word-2 F1 heard: input %.0f  fresh %.0f  after-A %.0f Hz\n', r.word2_F1_in_hz, r.word2_F1_out_fresh_hz, r.word2_F1_out_after_A_hz);
% Decimated per-frame traces for the sketch (every 5th frame = 10 ms)
k = 1:5:numel(dB1.ost_stat); lg = @(v) round(v(k)' * 1e4) / 1e4;
r.t = round((k-1) * fr * 1e4) / 1e4;
r.stat_A = dA.ost_stat(k)'; r.stat_B_fresh = dB0.ost_stat(k)'; r.stat_B_after_A = dB1.ost_stat(k)';
r.rms_B = lg(dB1.rms(:,1)); r.rms_A = lg(dA.rms(:,1));
r.sF1_B_fresh = round(dB0.sfmts(k,1))'; r.sF1_B_after_A = round(dB1.sfmts(k,1))'; r.sF1_A = round(dA.sfmts(k,1))'; r.F1_B = round(dB1.fmts(k,1))';
od = report_outdir('ost-f1');
c = struct('name', {'trialB_input', 'trialB_output_fresh', 'trialB_output_after_A', 'trialA_input'}, ...
  'x', {dB0.signalIn, dB0.signalOut, dB1.signalOut, dA.signalIn}, ...
  'label', {'Trial B input (two vowels)', 'Trial B output, first trial of the session', 'Trial B output, run right after trial A', 'Trial A input (one long vowel)'}, ...
  'warn', {'', '', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
r.params = struct('sr', p.sr, 'downFact', p.downFact, 'frameLen', p.frameLen, 'rmsThresh', p.rmsThresh, 'ost', fileread('cfg/report_fall.ost'), 'pcf', fileread('cfg/report_s1f1.pcf'));
% Device-rate inputs, unscaled, for the in-browser (WASM) widget; 16-bit quantisation is far below rmsThresh.
audiowrite(fullfile(od, 'dev_trialA_48k.wav'), xA, fs, 'BitsPerSample', 16);
audiowrite(fullfile(od, 'dev_trialB_48k.wav'), xB, fs, 'BitsPerSample', 16);
report_json(fullfile(od, 'data.json'), r);
