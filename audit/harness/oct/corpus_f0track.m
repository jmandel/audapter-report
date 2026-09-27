function [f0, t] = corpus_f0track(x, fs, fmin, fmax, hop)
% Frame-wise normalized-autocorrelation F0 (40 ms window, 10 ms hop). NaN = unvoiced / low confidence (r < 0.6).
% Parabolic peak interpolation; picks the first lag whose r is within 0.03 of the global max (limits octave-down errors).
if nargin < 5, hop = 0.01; end
W = round(max(0.04, 2.5/fmin)*fs); H = round(hop*fs); x = x(:); n = floor((numel(x) - W) / H) + 1;
f0 = nan(n, 1); t = ((0:n-1)' * H + W/2) / fs; lo = floor(fs/fmax); hi = min(ceil(fs/fmin), W - 2);
for i = 1:n
  s = x((i-1)*H + (1:W)); s = s - mean(s); if sqrt(mean(s.^2)) < 1e-4, continue; end
  r = zeros(hi+1, 1); e0 = sum(s.^2);
  for L = lo:hi, a = s(1:end-L); b = s(1+L:end); r(L+1) = sum(a.*b) / sqrt(sum(a.^2)*sum(b.^2) + eps); end
  [pk, k] = max(r); if pk < 0.6, continue; end
  c = find(r(lo+1:hi+1) >= pk - 0.03, 1) + lo;   % earliest near-max lag
  while c < hi+1 && r(c+1) > r(c), c = c + 1; end
  while c > lo+1 && r(c-1) > r(c), c = c - 1; end
  if c > 1 && c < hi+1, dd = (r(c-1) - r(c+1)) / (2*(r(c-1) - 2*r(c) + r(c+1))); else, dd = 0; end
  f0(i) = fs / (c - 1 + dd);
end
end
