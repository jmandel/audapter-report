pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('male');
p.bTimeDomainShift = 1; p.pitchLowerBoundHz = 80; p.pitchUpperBoundHz = 200; p.frameLen = 64; p.nDelay = 7; p.bCepsLift = 1;
p.timeDomainPitchShiftAlgorithm = 'pp_none'; p.rmsThresh = 0.011;
p.timeDomainPitchShiftSchedule = [0, 1.0; 1, 1.0; 1.01, 1.0595];
Audapter('ost','',0); Audapter('pcf','',0); AudapterIO('init', p); AudapterIO('reset');
fs = p.sr*p.downFact; T=3; t=(0:round(fs*T)-1)'/fs;
x = zeros(size(t)); for k=1:25, x = x + sin(2*pi*k*120*t + 0.3*k)/k; end; x = 0.08*x;
gap = t>=0.4 & t<0.7; x(gap) = 1e-4*randn(sum(gap),1);   % below-threshold dip (e.g., pause / closure)
N = p.frameLen*p.downFact;
for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N)+0; Audapter('runFrame', fr); end
d = AudapterIO('getData');
ft = (0:numel(d.shiftedPitchHz)-1)*p.frameLen/p.sr;
r = d.shiftedPitchHz ./ d.pitchHz;
i = find(r > 1.03, 1);
printf('logged shifted/input pitch ratio first exceeds 1.03 at trial t = %.3f s (schedule says 1.00 s after onset; gap 0.4-0.7 s)\n', ft(i));
printf('logged pitchShiftRatio column unique values: %s\n', mat2str(unique(d.pitchShiftRatio)'));
% output F0 over time via autocorr in 100 ms windows
so = d.signalOut; sr = p.sr;
ab = d.rms(:,1) > p.rmsThresh; cab = cumsum(ab)*p.frameLen/p.sr; j1 = find(cab>=1.0,1); printf('frames above thresh: first %.3f s; cumulative above-thresh time reaches 1.0 s at trial t=%.3f s; below-thresh frames in gap: %d (%.0f ms)\n', ft(find(ab,1)), ft(j1), sum(~ab(ft>0.1 & ft<1)), 1000*sum(~ab(ft>0.1 & ft<1))*p.frameLen/p.sr);
for tc = 0.95:0.05:1.4
  a = round(tc*sr); w = so(a:a+round(0.04*sr)); lags = round(sr/200):round(sr/80); c = zeros(size(lags));
  for j=1:numel(lags), L=lags(j); c(j) = sum(w(1:end-L).*w(1+L:end))/sqrt(sum(w(1:end-L).^2)*sum(w(1+L:end).^2)); end
  [~,j] = max(c); printf('  t=%.1fs output F0 ~ %.1f Hz\n', tc, sr/lags(j));
end
