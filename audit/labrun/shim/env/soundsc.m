function soundsc(y, fs, varargin)
% labrun: soundsc scales to [-1 1] before playing; the scaled signal is recorded.
if nargin < 2 || isempty(fs), fs = 8192; end
y = double(y); m = max(abs(y(:))); if m > 0, y = y / m; end
lr_play_event('soundsc', y, fs, 1);
end
