Audapter('version');
p = getAudapterDefaultParams('female');
AudapterIO('init', p);
Audapter('reset');
fs = p.sr * p.downFact; t = (0:round(fs*1.0)-1)'/fs;
x = 0.1*sin(2*pi*200*t);
N = p.frameLen*p.downFact;
for k = 1:floor(numel(x)/N)
  Audapter('runFrame', x((k-1)*N+1:k*N));
end
d = AudapterIO('getData');
disp(fieldnames(d)')
printf('signalIn %d signalOut %d fmts %dx%d\n', numel(d.signalIn), numel(d.signalOut), size(d.fmts));
