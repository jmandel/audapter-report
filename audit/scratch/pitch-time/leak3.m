pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('female');
fs = p.sr*p.downFact; t=(0:round(fs*0.5)-1)'/fs;
randn('seed',1); x = 0.05*randn(size(t));
Audapter('ost','',0); Audapter('pcf','',0);
for ps = [0 1]
q = p; q.bPitchShift = ps; q.bBypassFmt = 1; q.pitchShiftRatio = 1;
AudapterIO('init', q);
N = p.frameLen*p.downFact;
for r=1:3
  Audapter('reset');
  for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
  d = AudapterIO('getData'); si=d.signalIn; so=d.signalOut;
  printf('bPitchShift=%d run %d: len %d first nz in %d out %d; si(1:3)=%s\n', ps, r, numel(si), find(si~=0,1), find(so~=0,1), mat2str(si(1:3)',3));
end
end
