function P = lr_player(h)
% labrun: the record-only audio player (samples, rate) behind an audioplayer handle; [] if h is not one.
global LR
P = [];
if ~isnumeric(h) || ~isscalar(h) || ~isfield(LR, 'players'), return; end
for j = numel(LR.players):-1:1, if LR.players{j}.h == h, P = LR.players{j}; return; end, end
end
