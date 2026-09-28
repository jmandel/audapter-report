function [f0, loc] = pitch(x, fs, varargin)
% labrun compat (Audio Toolbox pitch, default 'NCF'-like): per-frame F0 by normalized autocorrelation in 52 ms
% windows every 10 ms, search range [50 400] Hz (options 'Range', 'WindowLength', 'OverlapLength' honoured).
o = struct('range', [50 400], 'windowlength', round(0.052 * fs), 'overlaplength', round(0.042 * fs));
for j = 1:2:numel(varargin), o.(lower(varargin{j})) = varargin{j + 1}; end
x = mean(double(x), 2); W = o.windowlength; H = W - o.overlaplength; n = floor((numel(x) - W) / H) + 1;
f0 = zeros(max(n, 0), 1); loc = zeros(size(f0));
lo = floor(fs / o.range(2)); hi = ceil(fs / o.range(1));
for i = 1:n
  s = x((i-1)*H + (1:W)); s = s - mean(s); r = xcorr(s, hi, 'coeff'); r = r(hi+1:end);
  [~, k] = max(r(lo+1:min(end, hi+1))); T = lo + k - 1;
  if T > 1 && T < numel(r) - 1, a = r(T); b = r(T+1); c = r(T+2); T = T + 0.5 * (a - c) / (a - 2*b + c); else, T = T + 0; end
  f0(i) = fs / max(T, 1); loc(i) = (i-1)*H + W;
end
end
