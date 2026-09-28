function t = WaitSecs(a, b)
% labrun (Psychtoolbox stub): advance the virtual clock (pumping audio while the virtual device runs).
global LR
if ischar(a)
  switch lower(a)
    case 'untiltime', lr_advance(b - (LR.ptb0 + LR.vclock));
    case 'yieldsecs', lr_advance(b);
  end
else
  lr_advance(a);
end
t = LR.ptb0 + LR.vclock;
end
