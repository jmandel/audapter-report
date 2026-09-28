function idx = detectSpeech(x, fs, varargin)
% labrun compat (Audio Toolbox detectSpeech, simplified): speech regions as [start end] sample indices from
% short-term energy (30 ms frames, threshold 10 % of the way from the 10th to the 99th energy percentile in dB),
% regions closer than 50 ms merged. The toolbox also uses spectral spread; for clean input the result is similar.
x = mean(double(x), 2); W = round(0.03 * fs); H = W; n = floor(numel(x) / H);
if n < 1, idx = zeros(0, 2); return; end
e = zeros(n, 1); for i = 1:n, s = x((i-1)*H + (1:min(W, numel(x) - (i-1)*H))); e(i) = 10 * log10(mean(s.^2) + 1e-12); end
q = sort(e); lo = q(max(1, round(0.1 * n))); hi = q(max(1, round(0.99 * n)));
on = e > lo + 0.1 * (hi - lo) & hi - lo > 6;
d = diff([0; on; 0]); s0 = find(d == 1); s1 = find(d == -1) - 1;
k = 1; while k < numel(s0), if (s0(k+1) - s1(k)) * H / fs < 0.05, s1(k) = s1(k+1); s0(k+1) = []; s1(k+1) = []; else, k = k + 1; end, end
idx = [(s0 - 1) * H + 1, min(numel(x), s1 * H)];
end
