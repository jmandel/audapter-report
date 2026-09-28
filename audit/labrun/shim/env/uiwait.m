function uiwait(h, varargin)
% labrun: instead of blocking, operate the GUI (lr_gui_autopilot).
if nargin < 1, h = gcf; end
lr_log_op(struct('op', 'uiwait'));
lr_gui_autopilot(h);
end
