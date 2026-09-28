function lr_invoke_callback(b)
% Invoke a uicontrol's Callback as MATLAB would on a click.
cb = get(b, 'Callback'); st = get(b, 'String'); if iscell(st), st = strjoin(st, ' '); end
lr_log_op(struct('op', 'gui-click', 'control', st));
if strcmpi(get(b, 'Style'), 'togglebutton') || strcmpi(get(b, 'Style'), 'checkbox'), set(b, 'Value', 1 - get(b, 'Value')); end
if is_function_handle(cb), cb(b, struct());
elseif iscell(cb), f = cb{1}; f(b, struct(), cb{2:end});
elseif ischar(cb) && ~isempty(cb), evalin('base', cb);
end
end
