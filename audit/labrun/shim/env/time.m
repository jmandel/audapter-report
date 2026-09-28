function t = time()
% labrun virtual clock (seconds since the epoch).
global LR
if isempty(LR) || ~isstruct(LR), t = builtin('time'); return; end
lr_quantum(); t = LR.epoch0 + LR.vclock;
end
