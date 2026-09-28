function play(id, varargin)
% labrun: record what an audioplayer would play.
for j = 1:numel(id), P = lr_player(id(j)); if ~isempty(P), lr_play_event('audioplayer.play', P.y, P.SampleRate, 1); end, end
end
