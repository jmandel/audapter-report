function dbstop(varargin)
% labrun: 'dbstop if error' would drop a non-interactive run into the debugger; ignored (logged as an op).
lr_log_op(struct('op', 'dbstop-ignored', 'args', strjoin(varargin, ' ')));
end
