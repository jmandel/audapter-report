pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
function out = runit(p, x)
  AudapterIO('init', p); Audapter('reset');
  N = p.frameLen*p.downFact;
  for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
  out = AudapterIO('getData');
end
p = getAudapterDefaultParams('female');
fs = p.sr*p.downFact; t=(0:round(fs*1.5)-1)'/fs;
x = zeros(size(t)); for k=1:15, x = x + sin(2*pi*k*200*t + k)/k; end; x = 0.05*x;
Audapter('ost','',0); Audapter('pcf','',0);
for cfg = 1:4
  q = p; q.bPitchShift = 1; q.bBypassFmt = 1;
  switch cfg
    case 1, q.pitchShiftRatio = 1; q.bPvocAmpNorm = 0; lbl='pvoc ratio1 nonorm';
    case 2, q.pitchShiftRatio = 2^(1/12); q.bPvocAmpNorm = 0; lbl='pvoc +1st nonorm';
    case 3, q.pitchShiftRatio = 2^(1/12); q.bPvocAmpNorm = 1; lbl='pvoc +1st ampnorm';
    case 4, q.bPitchShift = 0; lbl='no pvoc';
  end
  d = runit(q, x);
  so = d.signalOut; si = d.signalIn; n = numel(so); a = round(n/3):n;
  printf('%-22s outRMS/inRMS = %.3f  NaN=%d Inf=%d  zeros(last 1/3)=%d\n', lbl, sqrt(mean(so(a).^2))/sqrt(mean(si(a).^2)), sum(isnan(so)), sum(isinf(so)), sum(so(a)==0));
end
