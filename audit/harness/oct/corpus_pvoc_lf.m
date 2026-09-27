% CORPUS-7: phase-vocoder gain vs frequency at 0 st (pure tones), and on a real noisy clip split into
% its speech (VoiceBank clean) and noise (noisy - clean) parts.
p0 = defparams('female'); fs = 48000; t = (0:2*fs-1)'/fs; a = round(0.3*p0.sr);
for f = [30 50 80 100 150 200 500 1000 4000]
  q = p0; q.bPitchShift = 1; q.rmsThresh = 0; d = run_trial(q, 0.1*sin(2*pi*f*t));
  printf('tone %5d Hz: pvoc 0 st gain %+.2f dB\n', f, 20*log10(rms(d.signalOut(a:end))/rms(d.signalIn(a:end))));
end
M = corpus_index(); m = M(strcmp({M.id}, 'vbd_p257_387_bus2.5')); x = corpus_wav(m);
[c, ~] = audioread('/a/audit/corpus/gt/vbd_p257_387.clean.wav'); c = c(:,1) * (rms(x) / rms(audioread(m.file)(:,1)));
for s = {'clean speech', c; 'bus noise alone (noisy - clean)', x - c}'
  q = p0; q.bPitchShift = 1; q.rmsThresh = 0; d = run_trial(q, s{2}); a = round(0.2*p0.sr);
  printf('%-32s pvoc 0 st gain %+.2f dB\n', s{1}, 20*log10(rms(d.signalOut(a:end))/rms(d.signalIn(a:end))));
end
