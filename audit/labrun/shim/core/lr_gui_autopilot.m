function lr_gui_autopilot(h)
% Operate a blocking GUI (waitfor / uiwait on a figure): invoke the callbacks of its controls as the plan says
% (LR.plan.gui = {figure tag/name regexp, {button-string regexp, ...}; ...}), else press the first push button
% whose label looks like "save/ok/done/continue/...". Close the figure if it is still open afterwards.
global LR
if isempty(h) || ~ishghandle(h), return; end
fig = ancestor(h, 'figure');
if isempty(fig), return; end
tag = [get(fig, 'Tag') ' ' get(fig, 'Name')];
steps = {};
for j = 1:size(LR.plan.gui, 1)
  if ~isempty(regexpi(tag, LR.plan.gui{j, 1}, 'once')), steps = LR.plan.gui{j, 2}; break; end
end
if isempty(steps), steps = {LR.plan.guiDefaultButton}; end
lr_log_op(struct('op', 'gui', 'figure', tag, 'steps', strjoin(cellfun(@lr_str1, steps, 'UniformOutput', false), ' ; ')));
for s = 1:numel(steps)
  if ~ishghandle(fig), break; end
  st = steps{s};
  if is_function_handle(st), st(fig); continue; end
  b = lr_find_control(fig, st);
  if isempty(b), lr_note(sprintf('gui %s: no control matching "%s"', tag, st)); continue; end
  lr_invoke_callback(b);
end
if ishghandle(fig) && ishghandle(h) && strcmp(get(h, 'type'), 'figure'), try, delete(fig); catch, end, end
end
function s = lr_str1(x)
if ischar(x), s = x; else, s = func2str(x); end
end
function b = lr_find_control(fig, rx)
b = [];
u = findall(fig, 'type', 'uicontrol');
for i = 1:numel(u)
  st = get(u(i), 'String'); if iscell(st), st = strjoin(st, ' '); end
  if any(strcmpi(get(u(i), 'Style'), {'pushbutton', 'togglebutton', 'radiobutton', 'checkbox'})) && ~isempty(regexpi([st ' ' get(u(i), 'Tag')], rx, 'once'))
    b = u(i); return
  end
end
end
