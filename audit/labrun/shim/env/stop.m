function stop(id, varargin)
% labrun: stop an audiorecorder (ids >= 2e6); stopping a record-only audio player has no effect.
if isnumeric(id) && isscalar(id) && id > 2e6 && isempty(lr_player(id)), lr_recorder_stop(id); end
end
