% Does Audapter('runFrame', x) modify its input argument in place?
p = defparams('female'); N = p.frameLen*p.downFact;
AudapterIO('init', p); Audapter('reset');
fr = 0.05*sin(2*pi*200*(0:N-1)'/48000); keep = fr + 0;  % force a separate copy
for k = 1:10, frk = fr; frk(1) = frk(1) + 0; Audapter('runFrame', frk); end
Audapter('runFrame', fr);
T('runFrame leaves input variable untouched', isequal(fr, keep), 'max|change| %.3g', max(abs(fr - keep)));
