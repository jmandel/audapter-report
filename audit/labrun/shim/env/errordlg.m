function h = errordlg(msg, varargin)
% labrun: logged; returns an invisible figure so uiwait(h) works.
if iscell(msg), msg = strjoin(msg, ' '); end
lr_log_op(struct('op', 'errordlg', 'text', msg)); fprintf(stdout, 'labrun errordlg: %s\n', msg);
h = figure('Visible', 'off', 'Tag', 'Msgbox_labrun', 'Name', 'errordlg');
end
