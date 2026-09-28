function s = lr_screen_text()
% Visible text: MATLAB text objects in all figures (the lab's draw_exptText) and the last Psychtoolbox Flip.
global LR
s = {};
try
  h = findall(0, 'type', 'text');
  for j = 1:numel(h)
    st = get(h(j), 'String'); if iscell(st), st = strjoin(st, ' '); end
    if size(st, 1) > 1, st = strjoin(cellstr(st)', ' '); end
    if ~isempty(st) && strcmp(get(h(j), 'Visible'), 'on'), s{end+1} = st; end
  end
catch
end
s = [s, LR.ptbShown, LR.ptbDraw];
end
