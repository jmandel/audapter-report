function [ch, when] = GetChar(varargin)
% labrun (Psychtoolbox stub): the next simulated key as a character.
global LR
lr_advance(LR.plan.keyWait); ch = lr_keychar(lr_key_event()); when = LR.ptb0 + LR.vclock;
end
