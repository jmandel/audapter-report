pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('female');
fs = p.sr*p.downFact; t=(0:round(fs*1.0)-1)'/fs;
randn('seed',1); x = 0.05*randn(size(t));
Audapter('ost','',0); Audapter('pcf','',0);
q = p; q.bPitchShift = 1; q.bBypassFmt = 1; q.pitchShiftRatio = 1;
AudapterIO('init', q);
N = p.frameLen*p.downFact;
for r=1:3
  Audapter('reset');
  for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
  d = AudapterIO('getData'); si=d.signalIn; so=d.signalOut;
  best=0; bc=-inf; for l=0:3000, c = sum(si(2000:end-3000).*so(2000+l:end-3000+l)); if c>bc, bc=c; best=l; end; end
  printf('reset-only run %d: first nz in %d out %d; lag %d samples (%.1f ms) corr=%.3f\n', r, find(si~=0,1), find(so~=0,1), best, 1000*best/p.sr, bc/sqrt(sum(si(2000:end-3000).^2)*sum(so(2000+best:end-3000+best).^2)));
end
printf('nDelay=%d frameLen=%d pvocFrameLen=%d pvocHop=%d\n', p.nDelay, p.frameLen, Audapter('getParam','pvocframelen'), Audapter('getParam','pvochop'));
