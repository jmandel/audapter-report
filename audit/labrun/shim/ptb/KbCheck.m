function [down, secs, code, delta] = KbCheck(varargin)
% labrun (Psychtoolbox stub): every plan.kbEvery-th poll reports a key press (the next key of the plan's queue,
% else plan.defaultKey); other polls report no key. Polling advances the virtual clock by one quantum.
global LR
lr_quantum();
LR.kbPolls = LR.kbPolls + 1; code = false(1, 256); down = false;
if mod(LR.kbPolls, LR.plan.kbEvery) == 0
  k = lr_key_event(); c = KbName(k); if ~isempty(c), code(c) = true; down = true; end
end
secs = LR.ptb0 + LR.vclock; delta = 0.001;
end
