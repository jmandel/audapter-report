pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('female'); p.bRMSClip = 1; p.rmsClipThresh = 0.01; p.bBypassFmt = 0;
Audapter('ost','',0); Audapter('pcf','',0); AudapterIO('init', p); Audapter('reset');
fs = p.sr*p.downFact; t=(0:round(fs*1.0)-1)'/fs; x = 0.3*sin(2*pi*200*t);
N = p.frameLen*p.downFact;
for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N)+0; Audapter('runFrame', fr); end
d = AudapterIO('getData'); a = round(numel(d.signalOut)/2):numel(d.signalOut);
printf('rms_s (smoothed) ~ %.3f > thresh %.3f; output RMS in 2nd half = %.4f (expect 0 if clip protection worked); input RMS %.4f\n', mean(d.rms(end/2:end,1)), p.rmsClipThresh, sqrt(mean(d.signalOut(a).^2)), sqrt(mean(d.signalIn(a).^2)));
