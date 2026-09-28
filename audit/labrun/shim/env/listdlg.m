function [sel, ok] = listdlg(varargin)
% labrun: answered from the plan (lr_ask on the prompt; the answer is an item string or index); default 1.
o = struct(); for j = 1:2:numel(varargin), o.(lower(varargin{j})) = varargin{j+1}; end
items = {}; if isfield(o, 'liststring'), items = o.liststring; end
pr = ''; if isfield(o, 'promptstring'), pr = o.promptstring; end
if iscell(pr), pr = strjoin(pr, ' '); end
d = '1'; if isfield(o, 'initialvalue'), d = num2str(o.initialvalue(1)); end
a = lr_ask('listdlg', [pr ' [' strjoin(items, '|') ']'], {}, d);
sel = find(strcmp(items, a), 1); if isempty(sel), sel = str2double(a); end
ok = 1;
end
