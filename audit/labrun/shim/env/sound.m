function sound(y, fs, varargin)
% labrun: record what would be played (level, peak; clipping above 1.0 flagged).
if nargin < 2, fs = 8192; end
lr_play_event('sound', y, fs, 1);
end
