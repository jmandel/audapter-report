% Report asset export for I-01 in a real blab session (FINDINGS-LOG EXP-3, exp_noise_session.m): the masking phase of
% blab's simonSingleWord v2 experiment (transfer phases: fb 2 = masking noise only, fb2Gain 0.16, 1.8 s trials,
% AudapterIO('init') every trial), with the bundled babble loaded once by free-speech get_noiseSource.
%   blab build (maxPBSize 480000, since b2.4 / 2026-04): the 479,230-sample babble is not truncated, so every 9.98 s of
%   running time the output is silent for 16 ms, at a point that moves from trial to trial.
%   VARIANT=upstream (maxPBSize 230400 = blab before b2.4): the babble is truncated to the buffer and loops seamlessly.
% Input: 1.8 s of near-silence per trial (in fb 2 the participant's voice is not in the output).
% Usage: ./run-oct.sh report_i01_session.m
%        VARIANT=upstream ./run-oct.sh report_i01_session.m build-upstream upstream/audapter_matlab
% Output: out/report/i-01/meas/{blab,upstream}_t<k>.wav and session_{blab,upstream}.json
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
UP = strcmp(getenv('VARIANT'), 'upstream'); tag = ifelse_str(UP, 'upstream', 'blab');
if UP, addpath('/a/other/blab-experiments/commonmcode', '-end'); end
p = getAudapterDefaultParams('female'); p.downFact = 3; p.sr = 16000; p.frameLen = 32;
p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb2Gain = 0.16; p.fb3Gain = 0.02; p.fb = 2;
w = get_noiseSource(p);
Audapter('ost', '', 0); Audapter('pcf', '', 0); Audapter('setParam', 'datapb', w, 1);
fs = p.sr * p.downFact; N = p.frameLen * p.downFact; nTr = 24; tr = 1.8;
md = '/h/oct/out/report/i-01/meas'; if ~exist(md, 'dir'), mkdir(md); end
randn('seed', 3); gaps = zeros(0, 3);
for k = 1:nTr
  AudapterIO('init', p); Audapter('reset');
  x = 1e-4 * randn(round(tr * fs), 1);
  for m = 1:floor(numel(x)/N), fr = x((m-1)*N+1:m*N) + 0; Audapter('runFrame', fr); end
  d = AudapterIO('getData'); y = d.signalOut;
  audiowrite(fullfile(md, sprintf('%s_t%d.wav', tag, k)), y, p.sr, 'BitsPerSample', 16);
  z = abs(y) < 1e-12; e = diff([0; z; 0]); on = find(e == 1); off = find(e == -1) - 1; L = off - on + 1;
  for g = find(L >= round(0.002 * p.sr))'
    gaps(end+1, :) = [k, (on(g)-1)/p.sr, off(g)/p.sr];
    printf('%s trial %2d: output silent %.4f-%.4f s (%.1f ms)\n', tag, k, (on(g)-1)/p.sr, off(g)/p.sr, 1000*L(g)/p.sr);
  end
end
printf('%s: %d silent gaps in %d trials; maxPBLen %d, babble loaded %d samples\n', tag, size(gaps, 1), nTr, Audapter('getMaxPBLen'), numel(w));
s = struct('build', tag, 'n_trials', nTr, 'trial_s', tr, 'maxPBLen', Audapter('getMaxPBLen'), 'noise_len', numel(w), 'gaps', gaps);
if ~UP
  s.settings = report_settings(p, 'female', 'setparam', struct('datapb', sprintf('bundled babble mtbabble48k.wav, loaded once with free-speech get_noiseSource (%d samples)', numel(w))), ...
    'sequence', {arrayfun(@(k) 'fb 2', 1:nTr, 'UniformOutput', false)}, ...
    'switching', 'AudapterIO(''init'', p) and reset() before every trial; the noise is loaded once per run', ...
    'input', 'near-silent input (in fb 2 the participant hears only the masking noise); 24 trials of 1.8 s');
end
report_json(fullfile(md, sprintf('session_%s.json', tag)), s);
