% Independent LPC F1 (est_formants) per word in the exp_mixed.m S5 clips (mode 32 -> FALL, OST loaded once):
% trial 1 (fresh, expected) vs trial 4 (after a long catch trial, observed). Word 1 0.15-0.45 s, word 2 0.70-1.20 s.
% Usage: ./run-oct.sh exp_s5_measure.m   (after SCEN=S5 ./run-oct.sh exp_mixed.m)
for k = [1 4]
  [xi, fs] = audioread(sprintf('/h/oct/out/exp/s5_mode32_trial%d_in.wav', k)); xo = audioread(sprintf('/h/oct/out/exp/s5_mode32_trial%d_out.wav', k));
  [Fi, t] = est_formants(xi, fs); Fo = est_formants(xo, fs);
  for wd = {[0.20 0.40], [0.75 1.15]}
    g = t > wd{1}(1) & t < wd{1}(2); gi = find(g); go = gi + 1; go = go(go <= size(Fo,1));
    printf('trial %d, %.2f-%.2f s: F1 in %.0f Hz, out %.0f Hz (%+.1f %%)\n', k, wd{1}, median(Fi(gi,1), 'omitnan'), median(Fo(go,1), 'omitnan'), ...
           100*(median(Fo(go,1), 'omitnan') / median(Fi(gi,1), 'omitnan') - 1));
  end
end
