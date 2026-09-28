function varargout = which(varargin)
% labrun compat: Octave's which plus MATLAB's which(name, '-all') (a cell of every match on the path, in path
% order) and which('file.ext') for non-function files on the path.
isall = strcmpi(varargin, '-all'); names = varargin(~isall);
if any(isall)
  nm = names{1}; hits = {};
  [~, ~, e] = fileparts(nm); if isempty(e), cand = {[nm '.m'], [nm '.mex'], [nm '.oct']}; else, cand = {nm}; end
  dirs = [{pwd}, strsplit(path, pathsep)];
  for j = 1:numel(dirs)
    for c = 1:numel(cand)
      f = fullfile(dirs{j}, cand{c}); if exist(f, 'file') == 2 && ~any(strcmp(hits, f)), hits{end+1} = f; end
    end
  end
  if nargout, varargout{1} = hits(:); else, printf('%s\n', hits{:}); end
  return
end
m = __which__(names{:});
for i = 1:numel(m)
  if isempty(m(i).file)
    [~, ~, e] = fileparts(m(i).name);
    if ~isempty(e), f = file_in_loadpath(m(i).name); if ~isempty(f), m(i).file = f; end, end
  end
end
if nargout == 0
  for i = 1:numel(m), if ~isempty(m(i).file), printf('%s\n', m(i).file); elseif ~isempty(m(i).type), printf('%s is a %s\n', m(i).name, m(i).type); end, end
else
  varargout = {m.file};
  idx = find(cellfun('isempty', varargout)); if idx, varargout(idx) = {m(idx).type}; end
end
end
