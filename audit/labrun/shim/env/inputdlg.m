function a = inputdlg(prompts, title, dims, defs, varargin)
% labrun: each field answered from the plan (lr_ask); default = the dialog's default text.
if ischar(prompts), prompts = {prompts}; end
if nargin < 4, defs = repmat({''}, size(prompts)); end
a = cell(numel(prompts), 1);
for j = 1:numel(prompts)
  d = ''; if numel(defs) >= j, d = defs{j}; end
  a{j} = lr_ask('inputdlg', prompts{j}, {}, d);
end
end
