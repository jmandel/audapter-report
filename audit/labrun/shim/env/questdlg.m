function a = questdlg(q, varargin)
% labrun: answered from the plan (lr_ask); default = the dialog's default button.
if iscell(q), q = strjoin(q, ' '); end
btn = {}; dflt = '';
for j = 2:numel(varargin)
  if ischar(varargin{j}), btn{end+1} = varargin{j}; elseif isstruct(varargin{j}) && isfield(varargin{j}, 'Default'), dflt = varargin{j}.Default; end
end
if isempty(btn), btn = {'Yes', 'No', 'Cancel'}; dflt = 'Yes'; end
if isempty(dflt), if numel(varargin) >= 2 && numel(btn) > 1, dflt = btn{end}; else, dflt = btn{1}; end, end
if numel(btn) > 1 && any(strcmp(btn{end}, btn(1:end-1))), btn = btn(1:end-1); end   % last char arg is the default
% lab GUIs end with "save ... and exit?": the virtual experimenter saves (unless a plan rule says otherwise)
sv = btn(~cellfun(@isempty, regexpi(btn, '^save', 'once')));
if ~isempty(sv) && ~isempty(regexpi(q, 'exit|close|quit', 'once')), dflt = sv{1}; end
a = lr_ask('questdlg', q, btn, dflt);
end
