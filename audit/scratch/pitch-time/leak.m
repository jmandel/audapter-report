pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
function out = runit(p, x)
  AudapterIO('init', p); Audapter('reset');
  N = p.frameLen*p.downFact;
  for k = 1:floor(numel(x)/N), Audapter('runFrame', x((k-1)*N+1:k*N)); end
  out = AudapterIO('getData');
end
p = getAudapterDefaultParams('female');
fs = p.sr*p.downFact; t=(0:round(fs*1.5)-1)'/fs;
x = zeros(size(t)); for k=1:15, x = x + sin(2*pi*k*200*t + k)/k; end; x = 0.05*x;
Audapter('ost','',0); Audapter('pcf','',0);
q = p; q.bPitchShift = 1; q.bBypassFmt = 1; q.pitchShiftRatio = 2^(1/12);
prev = [];
for r=1:4
  d = runit(q, x); so = d.signalOut;
  n = numel(so); a = round(n/3):n;
  if isempty(prev), dd = NaN; else dd = max(abs(so-prev)); end
  i1 = find(so~=0,1);
  printf('run %d: RMS ratio %.4f  first nonzero out sample %d  maxdiff vs prev run %.3g\n', r, sqrt(mean(so(a).^2))/sqrt(mean(d.signalIn(a).^2)), i1, dd);
  prev = so;
end
q.pitchShiftRatio = 1;
for r=1:2
  d = runit(q, x); so=d.signalOut; n=numel(so); a=round(n/3):n; printf('ratio1 run %d: RMS ratio %.4f\n', r, sqrt(mean(so(a).^2))/sqrt(mean(d.signalIn(a).^2)));
end
% where does output start relative to input? xcorr lag
d = runit(q, x); si=d.signalIn; so=d.signalOut; best=0; bc=-inf;
for l=0:3000, c = sum(si(4000:end-3000).*so(4000+l:end-3000+l)); if c>bc, bc=c; best=l; end; end
printf('pvoc ratio1 lag in/out = %d samples at %d Hz (%.1f ms); frameLen %d nDelay %d\n', best, p.sr, 1000*best/p.sr, p.frameLen, p.nDelay);
q.bPitchShift = 0; d = runit(q, x); si=d.signalIn; so=d.signalOut; best=0; bc=-inf;
for l=0:3000, c = sum(si(4000:end-3000).*so(4000+l:end-3000+l)); if c>bc, bc=c; best=l; end; end
printf('no-pvoc lag in/out = %d samples (%.1f ms)\n', best, 1000*best/p.sr);
