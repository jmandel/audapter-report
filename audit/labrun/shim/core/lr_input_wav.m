function [x, desc] = lr_input_wav(req, spec)
% A recorded clip (spec.file; spec.files = cell to cycle over trials), resampled to the device rate, scaled to
% spec.level RMS (over samples above -40 dB of peak; default 0.05), with spec.onset s of silence before it.
o = struct('file', '', 'files', {{}}, 'level', 0.05, 'onset', 0.3, 'tail', 0.25, 'maxdur', 10);
f = fieldnames(spec); for j = 1:numel(f), o.(f{j}) = spec.(f{j}); end
if ~isempty(o.files), o.file = o.files{mod(req.k - 1, numel(o.files)) + 1}; end
[y, fs0] = audioread(o.file); y = mean(y, 2);
if fs0 ~= req.fs, y = resample(y, req.fs, fs0); end
y = y(1:min(end, round(o.maxdur * req.fs)));
a = abs(y); act = a > max(a) * 0.01;
if ~isfield(req, 'levelScale'), req.levelScale = 1; end
y = y / sqrt(mean(y(act).^2)) * o.level * req.levelScale;
x = [zeros(round(o.onset * req.fs), 1); y; zeros(round(o.tail * req.fs), 1)];
[~, nm, e] = fileparts(o.file); desc = sprintf('wav %s%s level=%.3f', nm, e, o.level);
end
