function varargout = Audapter(varargin)
% Test-case capture shim (audit/playground/capture): forwards every call to the real MEX (AudapterReal.mex, a copy of
% harness/build-oct/Audapter.mex) and, while a section is open (case_mark), records the command stream: every setParam
% (including the ones AudapterIO('init') sends), OST/PCF texts, reset, and the frames of each trial (reset ... getData).
% capture.m writes the log for the Playground's test cases.
global CASELOG CASESEC
a = varargin{1};
if isnumeric(a), codes = {3,'setParam'; 4,'getData'; 5,'runFrame'; 6,'reset'; 8,'ost'; 9,'pcf'};
  i = find([codes{:,1}] == a); if ~isempty(i), a = codes{i, 2}; end, end
rec = ~isempty(CASESEC) && isstruct(CASELOG);
if rec && ischar(a)
  switch a
    case 'setParam'
      v = double(varargin{3}(:)'); op = struct('op', 'setParam', 'name', varargin{2}, 'value', [], 'array', 0, 'text', '');
      if numel(v) > 64
        k = 0; for j = 1:numel(CASELOG.arrays), if numel(CASELOG.arrays{j}) == numel(v) && isequal(CASELOG.arrays{j}, v), k = j; break; end, end
        if ~k, CASELOG.arrays{end+1} = v; k = numel(CASELOG.arrays); end
        op.array = k;
      else, op.value = v; end
      addop(op);
    case {'ost', 'pcf'}
      fn = varargin{2}; txt = ''; if ~isempty(fn), txt = fileread(fn); end
      addop(struct('op', a, 'name', '', 'value', [], 'array', 0, 'text', txt));
    case 'reset'
      addop(struct('op', 'reset', 'name', '', 'value', [], 'array', 0, 'text', '')); CASELOG.cur = {};
    case 'runFrame'
      CASELOG.cur{end+1} = double(varargin{2}(:)) + 0;   % a real copy: the MEX writes its output into the frame (H3)
    case 'getData'
      x = vertcat(CASELOG.cur{:}); CASELOG.cur = {};
      if ~isempty(x)
        k = 0; for j = 1:numel(CASELOG.inputs), if numel(CASELOG.inputs{j}) == numel(x) && isequal(CASELOG.inputs{j}, x), k = j; break; end, end
        if ~k, CASELOG.inputs{end+1} = x; k = numel(CASELOG.inputs); end
        addop(struct('op', 'process', 'name', '', 'value', [], 'array', k, 'text', ''));
      end
  end
end
if ischar(a) && strcmp(a, 'runFrame')
  fr = varargin{2}; AudapterReal('runFrame', fr);   % the caller's copy semantics are unchanged (H3)
else
  [varargout{1:nargout}] = AudapterReal(varargin{:});
end
end

function addop(op)
global CASELOG CASESEC
s = find(strcmp(CASELOG.names, CASESEC), 1);
if isempty(s), CASELOG.names{end+1} = CASESEC; CASELOG.ops{end+1} = {}; s = numel(CASELOG.names); end
CASELOG.ops{s}{end+1} = op;
end
