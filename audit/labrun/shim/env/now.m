function t = now()
% labrun virtual clock.
global LR
if isempty(LR) || ~isstruct(LR), t = builtin('now'); return; end
lr_quantum(); t = LR.datenum0 + LR.vclock / 86400;
end
