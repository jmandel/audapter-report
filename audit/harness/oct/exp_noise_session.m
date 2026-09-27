% EXP: masking-noise continuity (finding I-01) in a real blab session structure.
% simonSingleWord_v2 transfer phase: fb 2 (masking noise only), fb2Gain 0.16 ("77 dB HL"), 1.8 s trials
% (run_simonSingleWord_v2_expt.m:54-55,107,118-120; run_simonSingleWord_v2_audapter.m:79-83,143-167).
% Noise loaded ONCE per run with the lab's own free-speech get_noiseSource (bundled mtbabble48k.wav,
% truncated to Audapter('getMaxPBLen')); every trial: fb set, AudapterIO('init'), reset, start/stop.
% We feed 1.8 s of near-silent input per trial (the participant's voice is not in the fb 2 output) and
% find stretches where the output is exactly zero.
% Blab now (maxPBSize 480000 since 3c90a3a, 2026-04): the 479,230-sample babble is not truncated.
% VARIANT=upstream (build-upstream, maxPBSize 230400 = blab before 2026-04): the babble is truncated to it.
% Usage: ./run-oct.sh exp_noise_session.m
%        VARIANT=upstream ./run-oct.sh exp_noise_session.m build-upstream upstream/audapter_matlab
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
if strcmp(getenv('VARIANT'), 'upstream'), addpath('/a/other/blab-experiments/commonmcode', '-end'); end   % fsic for upstream defaults
p = getAudapterDefaultParams('female'); p.downFact = 3; p.sr = 16000; p.frameLen = 32;
p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb2Gain = 0.16; p.fb3Gain = 0.02;
w = get_noiseSource(p);
printf('maxPBLen %d, noise loaded %d samples (%.3f s at 48 kHz)\n', Audapter('getMaxPBLen'), numel(w), numel(w)/48000);
Audapter('ost', '', 0); Audapter('pcf', '', 0);
Audapter('setParam', 'datapb', w, 1);
fs = p.sr * p.downFact; N = p.frameLen * p.downFact; nTr = 24; tr = 1.8; gaps = 0;
randn('seed', 3);
for k = 1:nTr
  p.fb = 2; Audapter('setParam', 'fb', p.fb); AudapterIO('init', p); Audapter('reset');
  x = 1e-4 * randn(round(tr * fs), 1);
  for m = 1:floor(numel(x)/N), fr = x((m-1)*N+1:m*N) + 0; Audapter('runFrame', fr); end
  d = AudapterIO('getData'); y = d.signalOut; z = abs(y) < 1e-12;
  e = diff([0; z; 0]); on = find(e == 1); off = find(e == -1) - 1; L = off - on + 1; keep = L >= round(0.002 * p.sr);
  for g = find(keep)'
    gaps = gaps + 1;
    printf('trial %2d: output silent %.3f-%.3f s (%.1f ms) of %.1f s\n', k, (on(g)-1)/p.sr, off(g)/p.sr, 1000*L(g)/p.sr, tr);
  end
end
printf('%d silent gaps (>= 2 ms) in %d fb-2 trials (%.1f s of masking noise)\n', gaps, nTr, nTr*tr);
