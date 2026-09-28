function h = waitbar(x, varargin)
% labrun: progress bars are invisible figures; updates are ignored.
if numel(varargin) >= 1 && ~ischar(varargin{1}) && ishghandle(varargin{1}), h = varargin{1}; return; end
h = figure('Visible', 'off', 'Tag', 'waitbar_labrun');
end
