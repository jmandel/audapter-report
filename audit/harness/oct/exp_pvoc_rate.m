% EXP: pvoc (bPitchShift = 1, 0 st) level offset vs sampling settings: default 16 kHz / frameLen 32 (PT-5: +3.52 dB)
% vs the timeAdapt settings of free-speech run_measureDuration_audapter.m:101-119 (24 kHz / downFact 2 / frameLen 48),
% plus 24 kHz / frameLen 64 to see whether the pvoc hop (64) being a multiple of frameLen matters.
% Synthetic /a/ F0 120 and 200 Hz, 1 s. Also reports the waveform correlation of output vs gain-matched input.
% Usage: ./run-oct.sh exp_pvoc_rate.m
cfg = [16000 3 32; 24000 2 48; 24000 2 64; 16000 3 64];
for f0 = [120 200]
  x = synth_vowel(48000, 1.0, f0, [760 1150 2500 3500], [80 100 150 200], 'onset', 0.2, 'offset', 0.2, 'amp', 0.3);
  for c = 1:size(cfg, 1)
    L = zeros(1, 2);
    for b = [0 1]
      p = getAudapterDefaultParams('female'); p.sr = cfg(c,1); p.downFact = cfg(c,2); p.frameLen = cfg(c,3);
      p.bPitchShift = b; p.fb = 1; p.bShift = 0; Audapter('ost', '', 0); Audapter('pcf', '', 0);
      AudapterIO('init', p); d = run_trial(p, x, 'init', false); D = round(0.3 * p.sr); E = round(1.1 * p.sr);
      y = d.signalOut(D:E); s = d.signalIn(D:E); L(b+1) = 20*log10(rms(y) / rms(s)); if b, yy = y; ss = s; end
    end
    [r, lag] = xcorr(yy, ss, 400, 'coeff'); [rm, i] = max(r);
    printf('F0 %3d | sr %5d downFact %d frameLen %2d: bPitchShift 0 %+.2f dB, 1 %+.2f dB -> pvoc %+.2f dB | max xcorr out/in %.3f at lag %d\n', ...
           f0, cfg(c,:), L, L(2) - L(1), rm, lag(i));
  end
end
