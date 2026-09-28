function r = KbName(a)
% labrun (Psychtoolbox stub): Windows key codes and PTB's unified key names.
persistent names
if isempty(names)
  names = cell(1, 256);
  for c = 65:90, names{c} = char(c + 32); end
  dig = {'0)', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9('};
  for d = 0:9, names{48 + d} = dig{d + 1}; names{96 + d} = sprintf('%d', d); end
  names{8} = 'BackSpace'; names{9} = 'Tab'; names{13} = 'Return'; names{27} = 'ESCAPE'; names{32} = 'space';
  names{37} = 'LeftArrow'; names{38} = 'UpArrow'; names{39} = 'RightArrow'; names{40} = 'DownArrow';
  names{160} = 'LeftShift'; names{161} = 'RightShift'; names{162} = 'LeftControl'; names{163} = 'RightControl';
  names{186} = ';:'; names{187} = '=+'; names{188} = ',<'; names{189} = '-_'; names{190} = '.>'; names{191} = '/?';
  for c = 112:123, names{c} = sprintf('F%d', c - 111); end
end
if nargin == 0, r = []; return; end
if ischar(a) && ~any(strcmpi(a, {'UnifyKeyNames', 'KeyNamesWindows', 'KeyNamesOSX', 'KeyNamesLinux', 'KeyNames'})), lr_key_seen(a); end
if ischar(a)
  if any(strcmpi(a, {'UnifyKeyNames', 'KeyNamesWindows', 'KeyNamesOSX', 'KeyNamesLinux'})), r = []; return; end
  if strcmpi(a, 'KeyNames'), r = names; return; end
  r = find(strcmpi(names, a), 1);
  if isempty(r)
    alias = struct('escape', 27, 'esc', 27, 'enter', 13, 'return', 13, 'spacebar', 32);
    if isfield(alias, lower(a)), r = alias.(lower(a)); return; end
    if numel(a) == 1 && any(a >= '0' & a <= '9'), r = 48 + (a - '0'); return; end
    r = find(cellfun(@(n) ~isempty(n) && numel(n) == 2 && strcmpi(n(1), a), names), 1);
  end
  return
end
if iscell(a), r = cellfun(@KbName, a); return; end
if islogical(a) || numel(a) > 1, idx = find(a); else, idx = a; end
if isempty(idx), r = []; return; end
if numel(idx) == 1, r = names{idx}; else, r = names(idx); end
end
