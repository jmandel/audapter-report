p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
for r = 1:2, d{r} = run_trial(p, xa); end
for r=1:2, printf('run %d: first sample |out|>1e-4 at %.4f s; rms(out 0-0.09s)=%.2e ; max|out| %.3f; rms cols first frame: %s\n', r, find(abs(d{r}.signalOut)>1e-4,1)/p.sr, sqrt(mean(d{r}.signalOut(1:1440).^2)), max(abs(d{r}.signalOut)), mat2str(d{r}.rms(1,:),3)); end
i=find(abs(d{2}.signalOut-d{1}.signalOut)>1e-6,1); printf('first out diff sample %d: %g vs %g (in %g)\n', i, d{1}.signalOut(i), d{2}.signalOut(i), d{1}.signalIn(i));
fr = 1:40; printf('rms col1 frames 1..8 run1 %s\n run2 %s\n', mat2str(d{1}.rms(1:8,1)',3), mat2str(d{2}.rms(1:8,1)',3));
printf('rms col2 (smoothed?) frames 55..62 run1 %s\n run2 %s\n', mat2str(d{1}.rms(55:62,2)',3), mat2str(d{2}.rms(55:62,2)',3));
printf('size rms %s\n', mat2str(size(d{1}.rms)));
