function waitfor(h, varargin)
% labrun: instead of blocking, operate the GUI (lr_gui_autopilot).
lr_log_op(struct('op', 'waitfor'));
if isempty(h), return; end
lr_gui_autopilot(h);
end
