function [x, y, b] = ginput(n)
% labrun: a single click at the centre of the axes.
if nargin < 1, n = 1; end
lr_log_op(struct('op', 'ginput')); x = 0.5 * ones(n, 1); y = x; b = ones(n, 1);
end
