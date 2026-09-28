function varargout = set(varargin)
% labrun compat: Octave's set after lr_fix_pv (MATLAB accepts 'String', []).
a = lr_fix_pv(varargin);
[varargout{1:nargout}] = builtin('set', a{:});
end
