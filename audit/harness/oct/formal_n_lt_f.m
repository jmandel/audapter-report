% FORMAL-1 dynamic check: pvocFrameLen < frameLen with bPitchShift = 0.
% outFrameBufSum[n0 + pvocFrameLen - frameLen] goes negative (Audapter.cpp:2121/2124).
% pvocHop must be >= frameLen, otherwise 1986 divides by zero first (PT-11).
p = getAudapterDefaultParams('female');
p.frameLen = 64; p.nDelay = 5; p.bPitchShift = 0;
p.pvocFrameLen = 32; p.pvocHop = 64;
p.frameShift = p.frameLen / p.nWin; p.bufLen = (2*p.nDelay-1)*p.frameLen; p.anaLen = p.frameShift+2*(p.nDelay-1)*p.frameLen;
AudapterIO('init', p);
Audapter('reset');
fs = p.sr * p.downFact; t = (0:round(fs*0.5)-1)'/fs;
x = 0.1*sin(2*pi*200*t);
N = p.frameLen*p.downFact;
for k = 1:floor(numel(x)/N)
  fr = x((k-1)*N+1:k*N) + 0;
  Audapter('runFrame', fr);
end
d = AudapterIO('getData');
printf('FORMAL-1: ran %d frames; signalOut rms %.4g (in rms %.4g)\n', k, sqrt(mean(d.signalOut.^2)), sqrt(mean(d.signalIn.^2)));
