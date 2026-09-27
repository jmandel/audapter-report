% Is the F1 overshoot real or estimator bias? Compare against vowels synthesized at the target formant.
p0 = defparams('female'); fs = p0.sr * p0.downFact; g = linspace(0, 5000, 257);
c = p0; c.bShift = 1; c.bRatioShift = 1; c.bMelShift = 0; c.F1Min = 0; c.F1Max = 5000; c.F2Min = 0; c.F2Max = 5000; c.LBk = 0; c.LBb = 0; c.pertF2 = g;
BW = [80 100 150 200];
for f0 = [100 140 200]
 for F1 = [500 700 850]
  for ratio = [0.8 1.2]
   F = [F1 1500 2810 3800];
   x = synth_vowel(fs, 0.8, f0, F, BW);
   c.pertAmp = abs(ratio-1)*ones(1,257); c.pertPhi = (ratio < 1)*pi*ones(1,257);
   d = run_trial(c, x); r = shift_measure(c, d, 0.3, 0.8);
   % control: synthesize at target F1 directly, measure with same estimator
   xt = synth_vowel(fs, 0.8, f0, [F1*ratio F(2:end)], BW);
   dt = run_trial(p0, xt); rt = shift_measure(p0, setfield(dt, 'signalOut', dt.signalIn), 0.3, 0.8);
   [Fi,te] = est_formants(dt.signalIn, p0.sr); [Fb,~] = est_formants(d.signalIn, p0.sr); m = te>0.3&te<0.8;
   ctrl = median(Fi(m,1),'omitnan')/median(Fb(m,1),'omitnan');
   % Audapter's own tracker on the shifted output (feed output back through tracker)
   dd = run_trial(p0, resample(d.signalOut, 3, 1)); fr = p0.frameLen/p0.sr; tt=(0:size(dd.fmts,1)-1)'*fr; mm = tt>0.3&tt<0.8&dd.fmts(:,1)>0;
   trk = median(dd.fmts(mm,1)) / median(d.fmts(mm,1));
   printf('f0 %3d F1 %3d cmd %.2f | logged %.3f | audio(LPC) %.3f | control synth-at-target (LPC) %.3f | audapter tracker on output %.3f\n', f0, F1, ratio, r.logged(1), r.audio(1), ctrl, trk);
  end
 end
end
