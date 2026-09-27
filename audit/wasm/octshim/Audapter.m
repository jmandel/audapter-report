function varargout = Audapter(varargin)
% Recording shim for wasm_export.m: forwards every call to the real MEX (AudapterReal.mex, a copy of
% harness/build-oct/Audapter.mex) and logs the command stream so the WASM build can replay it exactly.
% Each command records atFrame = number of runFrame calls before it.
global WASMLOG
a = varargin{1};
if isnumeric(a), codes = {3,'setParam'; 4,'getData'; 5,'runFrame'; 6,'reset'; 8,'ost'; 9,'pcf'};
  a = codes{find([codes{:,1}] == a), 2}; end
switch a
  case 'setParam'
    WASMLOG.cmds{end+1} = struct('op', 'setParam', 'name', varargin{2}, 'value', double(varargin{3}(:)'), 'atFrame', numel(WASMLOG.in));
    AudapterReal(varargin{:});
  case {'ost', 'pcf'}
    fn = varargin{2}; txt = '';
    if ~isempty(fn), txt = fileread(fn); end
    WASMLOG.cmds{end+1} = struct('op', a, 'name', fn, 'text', txt, 'atFrame', numel(WASMLOG.in));
    AudapterReal(varargin{:});
  case 'reset'
    WASMLOG.cmds{end+1} = struct('op', 'reset', 'name', '', 'value', [], 'atFrame', numel(WASMLOG.in));
    AudapterReal(varargin{:});
  case 'runFrame'
    fr = varargin{2} + 0;             % private copy: the MEX writes its output into this array (H3)
    WASMLOG.in{end+1} = varargin{2}(:);
    AudapterReal('runFrame', fr);
    WASMLOG.out{end+1} = fr(:);       % device-rate output that would go to the headphones
  case 'getData'
    [varargout{1:nargout}] = AudapterReal(varargin{:});
    if nargout >= 2, WASMLOG.sig = varargout{1}; WASMLOG.data = varargout{2}; end
  otherwise
    [varargout{1:nargout}] = AudapterReal(varargin{:});
end
end
