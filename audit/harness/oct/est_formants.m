function [F, t] = est_formants(x, fs, varargin)
% Independent LPC formant estimate (not Audapter's tracker). Returns [nFrames x 2] F1,F2 in Hz.
o = struct('win', 0.03, 'hop', 0.01, 'order', round(2 + fs/1000), 'rmsmin', 1e-3, 'fmin', 150);
for k = 1:2:numel(varargin), o.(varargin{k}) = varargin{k+1}; end
x = filter([1 -0.97], 1, x(:)); W = round(o.win*fs); H = round(o.hop*fs);
nf = floor((numel(x) - W) / H) + 1; F = nan(nf, 2); t = ((0:nf-1)*H + W/2)'/fs; w = hamming(W);
for i = 1:nf
  s = x((i-1)*H + (1:W));
  if sqrt(mean(s.^2)) < o.rmsmin, continue; end
  a = lpc(s .* w, o.order); r = roots(a); r = r(imag(r) > 0);
  f = angle(r) * fs / (2*pi); b = -log(abs(r)) * fs / pi;
  f = sort(f(f > o.fmin & b < 500));
  if numel(f) >= 2, F(i,:) = f(1:2); end
end
end
