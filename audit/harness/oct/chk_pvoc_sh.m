% Check for the PVOC-NOISE card: level of pitch-shifted /S/, the voiced stretch after it, and a noise band, re 0 st.
% Usage: SCEN=<frameLen> ./run-oct.sh chk_pvoc_sh.m   (24 kHz, downFact 2; e.g. SCEN=32, 48, 64)
FL = str2double(getenv("SCEN"));
M = corpus_index(); m = M(strcmp({M.id}, 'arctic_slt_a0036')); [x, fs] = corpus_wav(m);
randn('seed', 1); segs = {'sh', x(round(0.16*fs):round(0.30*fs)); 'iy_er', x(round(0.31*fs):round(0.58*fs))};
[b, a] = butter(4, [3500 9000] / (fs/2)); nz = filter(b, a, randn(round(0.3*fs), 1)); nz = 0.05 * nz / sqrt(mean(nz.^2)); segs(end+1, :) = {'noise', nz};
sts = [-4 -2 0 2 4];
for thr = 1
for i = 1:size(segs, 1)
  s = segs{i, 2}; pad = 1e-4 * randn(round(0.15*fs), 1); in = [pad; s; pad]; L = [];
  for k = 1:numel(sts)
    p = getAudapterDefaultParams('female'); p.downFact = 2; p.sr = 24000; p.frameLen = FL; p.nDelay = 3; p.fb = 1;
    p.bPitchShift = 1; p.pitchShiftRatio = 2^(sts(k)/12); if thr == 0, p.rmsThresh = 0; end
    d = run_trial(p, in); y = d.signalOut; % at 24 kHz; segment starts at 0.15 s + delay; use generous window inside it
    a0 = round((0.15 + 0.03) * p.sr); a1 = round((0.15 + numel(s)/fs - 0.01) * p.sr);
    L(k) = 20*log10(sqrt(mean(y(a0:a1).^2)) + 1e-12);
  end
  printf('rmsThresh %s %-6s ', report_p2_ifn(thr, 'default', '0      '), segs{i,1}); printf('%+6.2f ', L - L(sts == 0)); printf('  (0 st abs %.1f dB)\n', L(sts == 0));
end
end
