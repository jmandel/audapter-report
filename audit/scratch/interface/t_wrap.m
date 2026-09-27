p = getAudapterDefaultParams('female'); p.rmsThresh = 0.005;
fsd = p.sr * p.downFact; N = p.frameLen * p.downFact;
AudapterIO('init', p); Audapter('reset');
x = 0.05*randn(31 * fsd, 1);
for k = 1:numel(x)/N, Audapter('runFrame', x((k-1)*N+1:k*N)); end
d = AudapterIO('getData');
printf('T6 after 31 s of input: signalIn len=%d (%.3f s), ost/interval first=%d\n', numel(d.signalIn), numel(d.signalIn)/p.sr, d.intervals(1));
