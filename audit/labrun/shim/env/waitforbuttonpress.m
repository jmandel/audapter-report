function r = waitforbuttonpress()
% labrun: a simulated key press (1 = key), also stored as the current figure's CurrentCharacter.
global LR
lr_advance(LR.plan.keyWait); k = lr_key_event();
try, set(gcf, 'CurrentCharacter', lr_keychar(k)); catch, end
r = 1;
end
