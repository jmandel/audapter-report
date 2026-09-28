function c = clock()
% labrun virtual clock (a fixed start date + virtual time).
global LR
if isempty(LR) || ~isstruct(LR), c = builtin('clock'); return; end
lr_quantum(); c = datevec(LR.datenum0 + LR.vclock / 86400);
end
