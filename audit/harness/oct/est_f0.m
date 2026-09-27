function f0 = est_f0(x, fs, fmin, fmax)
% Median autocorrelation F0 over voiced 40 ms frames.
if nargin < 3, fmin = 60; fmax = 500; end
W = round(0.04*fs); H = round(0.01*fs); x = x(:); v = [];
for i = 1:H:numel(x)-W
  s = x(i:i+W-1); s = s - mean(s);
  if sqrt(mean(s.^2)) < 1e-3, continue; end
  r = xcorr(s, 'coeff'); r = r(W:end);
  lo = floor(fs/fmax); hi = ceil(fs/fmin); [pk, k] = max(r(lo+1:hi+1));
  if pk > 0.5
    k = k + lo; if k > 1 && k < numel(r), d = (r(k-1)-r(k+1))/(2*(r(k-1)-2*r(k)+r(k+1))); else d = 0; end
    v(end+1) = fs / (k - 1 + d);
  end
end
f0 = median(v);
end
