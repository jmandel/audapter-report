function varargout = pause(varargin)
% labrun: pause(t) advances the virtual clock by t (pumping audio if the virtual device runs) without sleeping.
% pause with no argument (wait for a key) returns at once after plan.keyWait virtual seconds.
global LR
if isempty(LR) || ~isstruct(LR), [varargout{1:nargout}] = builtin('pause', varargin{:}); return; end
varargout = {};
if nargin == 0 || (isnumeric(varargin{1}) && isinf(varargin{1}))
  lr_log_op(struct('op', 'keywait', 'fn', 'pause'));
  lr_advance(LR.plan.keyWait); lr_key_event();
  return
end
t = varargin{1};
if ischar(t)
  if strcmpi(t, 'query'), varargout{1} = 'on'; end
  return
end
lr_advance(double(t));
end
