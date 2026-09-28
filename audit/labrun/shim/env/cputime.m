function [t, u, s] = cputime()
global LR
if isempty(LR) || ~isstruct(LR), [t, u, s] = builtin('cputime'); return; end
lr_quantum(); t = LR.vclock; u = t; s = 0;
end
