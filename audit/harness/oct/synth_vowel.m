function x = synth_vowel(fs, dur, f0, F, BW, varargin)
% Klatt-style cascade formant synthesizer. F/BW: formant freqs/bandwidths (Hz).
% F may be a matrix [nSamples x nF] for time-varying formants; f0 may be a vector per sample.
% Options: 'amp' (peak), 'onset'/'offset' (s of silence before/after), 'noise' (rms), 'ramp' (s)
o = struct('amp', 0.2, 'onset', 0.1, 'offset', 0.1, 'noise', 1e-5, 'ramp', 0.02, 'seed', 1);
for k = 1:2:numel(varargin), o.(varargin{k}) = varargin{k+1}; end
n = round(dur * fs); T = 1/fs;
if isscalar(f0), f0 = f0 * ones(n,1); end
if size(F,1) == 1, F = repmat(F, n, 1); end
% glottal source: phase-accumulated pulse train, Rosenberg-like shaping via 2x one-pole LP
ph = cumsum(f0(:)) / fs; src = [0; diff(floor(ph))] ;
src = filter(1, [1 -0.97], filter(1, [1 -0.97], src));
src = [0; diff(src)];                               % lip radiation (differentiator) folded into source
y = src;
for k = 1:size(F,2)
  C = -exp(-2*pi*BW(k)*T); B = 2*exp(-pi*BW(k)*T)*cos(2*pi*F(:,k)*T); A = 1 - B - C;
  if all(F(:,k) == F(1,k))
    y = filter(A(1), [1 -B(1) -C], y);
  else
    out = zeros(n,1); y1 = 0; y2 = 0;
    for i = 1:n, out(i) = A(i)*y(i) + B(i)*y1 + C*y2; y2 = y1; y1 = out(i); end
    y = out;
  end
end
r = round(o.ramp * fs); w = ones(n,1);
if r > 0, w(1:r) = 0.5-0.5*cos(pi*(0:r-1)'/r); w(end-r+1:end) = flipud(w(1:r)); end
y = y .* w; y = o.amp * y / max(abs(y));
randn('seed', o.seed);
x = [zeros(round(o.onset*fs),1); y; zeros(round(o.offset*fs),1)];
x = x + o.noise * randn(size(x));
end
