function [pressed, first, frel, lpress, lrel] = KbQueueCheck(varargin)
% labrun (Psychtoolbox stub): like KbCheck (a press every plan.kbEvery polls).
global LR
[d, s, code] = KbCheck(); pressed = d; first = zeros(1, 256); first(code) = LR.ptb0 + LR.vclock;
frel = zeros(1, 256); lpress = first; lrel = frel;
end
