function d = uigetdir(varargin)
% labrun: answered from the plan; default = the start directory given by the caller (or pwd).
dd = pwd; if nargin >= 1 && ischar(varargin{1}), dd = varargin{1}; end
d = lr_ask('uigetdir', strjoin(cellfun(@(x) char(x), varargin(cellfun(@ischar, varargin)), 'UniformOutput', false), ' '), {}, dd);
end
