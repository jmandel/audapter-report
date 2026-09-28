function [secs, code, delta] = KbStrokeWait(varargin)
% labrun (Psychtoolbox stub): returns after plan.keyWait virtual seconds with the next simulated key.
global LR
lr_advance(LR.plan.keyWait);
k = lr_key_event(); code = false(1, 256); c = KbName(k); if ~isempty(c), code(c) = true; end
secs = LR.ptb0 + LR.vclock; delta = 0.001;
end
