function id = tic()
% labrun virtual clock (microseconds of virtual time).
global LR
if isempty(LR) || ~isstruct(LR), if nargout, id = builtin('tic'); else, builtin('tic'); end, return; end
LR.ticT = LR.vclock;
if nargout, id = uint64(round((LR.vclock + LR.epoch0) * 1e6)); end
end
