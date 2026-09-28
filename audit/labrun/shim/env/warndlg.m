function h = warndlg(msg, varargin)
% labrun: logged; returns an invisible figure so uiwait(h) works.
if iscell(msg), msg = strjoin(msg, ' '); end
lr_log_op(struct('op', 'warndlg', 'text', msg)); fprintf(stdout, 'labrun warndlg: %s\n', msg);
h = figure('Visible', 'off', 'Tag', 'Msgbox_labrun', 'Name', 'warndlg');
end
