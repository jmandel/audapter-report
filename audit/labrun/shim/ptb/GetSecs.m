function t = GetSecs()
% labrun (Psychtoolbox stub): the virtual clock. Each read advances by one quantum so polling loops end.
global LR
lr_quantum(); t = LR.ptb0 + LR.vclock;
end
