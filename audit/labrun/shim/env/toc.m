function t = toc(id)
% labrun virtual clock. Each read advances by one quantum (lr_quantum) so polling loops terminate.
global LR
if isempty(LR) || ~isstruct(LR), if nargin, t = builtin('toc', id); else, t = builtin('toc'); end, return; end
lr_quantum();
if nargin, t0 = double(id) / 1e6 - LR.epoch0; else, t0 = LR.ticT; end
e = LR.vclock - t0;
if nargout, t = e; else, printf('Elapsed time is %g seconds.\n', e); end
end
