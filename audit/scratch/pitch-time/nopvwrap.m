pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('female'); p.bPitchShift=0; p.bBypassFmt=1; p.pitchShiftRatio=1;
Audapter('ost','',0); Audapter('pcf','',0); AudapterIO('init', p); Audapter('reset');
N = p.frameLen*p.downFact; fs = p.sr*p.downFact; nF = 55000;
k0 = (0:N-1)';
tic;
for k = 1:nF
  tt = ((k-1)*N + k0)/fs;
  fr = 0.05*(sin(2*pi*200*tt) + 0.5*sin(2*pi*530*tt+1) + 0.3*sin(2*pi*1270*tt+2));
  Audapter('runFrame', fr);
end
toc
d = AudapterIO('getData'); si=d.signalIn; so=d.signalOut; L = 0;
res = so(L+1:end) - 1.0*si(1:end-L);
fr = reshape(res(1:floor(numel(res)/32)*32), 32, []); e = sqrt(mean(fr.^2));
ref = 1.0*sqrt(mean(si.^2));
bad = find(e > 0.05*ref);
printf('recorded %d samples; frames with residual > 5%% of signal: %d\n', numel(si), numel(bad));
if ~isempty(bad), printf('  bad frame idx (recording-relative): %s\n', mat2str(bad(1:min(20,end)))); printf('  residual rel. to signal: %s\n', mat2str(e(bad)/ref,2)); printf('  expected wrap near recording sample %d (frame %d)\n', (54000-45000)*32, 9000); end
