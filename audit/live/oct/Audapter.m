function varargout = Audapter(varargin)
% Logging stand-in for the Audapter MEX (live harness). AudapterIO('init', p) calls this instead
% of the real MEX; every setParam is appended to the global trace file so that the native live
% driver can replay the exact MATLAB-side call sequence.
global LIVE_TRACE_FID
varargout = cell(1, nargout);
a = varargin{1};
if ischar(a), isSet = strcmpi(a, 'setParam'); else isSet = (a == 3); end
if isSet
  v = double(varargin{3});
  fprintf(LIVE_TRACE_FID, 'S %s %d %d', lower(varargin{2}), size(v, 1), size(v, 2));
  fprintf(LIVE_TRACE_FID, ' %.17g', v(:));
  fprintf(LIVE_TRACE_FID, '\n');
else
  for k = 1:nargout, varargout{k} = 0; end
end
end
