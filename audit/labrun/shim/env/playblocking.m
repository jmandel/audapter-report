function playblocking(id, varargin)
% labrun: record what an audioplayer would play; the virtual clock advances by its duration.
for j = 1:numel(id), P = lr_player(id(j)); if ~isempty(P), lr_play_event('audioplayer.playblocking', P.y, P.SampleRate, 1); lr_advance(size(P.y, 1) / P.SampleRate); end, end
end
