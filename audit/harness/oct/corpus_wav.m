function [x, fs, g] = corpus_wav(m, target)
% Load a corpus clip (48 kHz mono) and scale it so the RMS of its active part
% (20 ms frames within 30 dB of the loudest) equals target (default 0.05, about -26 dBFS).
if nargin < 2, target = 0.05; end
[x, fs] = audioread(m.file); x = x(:, 1);
W = round(0.02*fs); n = floor(numel(x)/W); e = sqrt(mean(reshape(x(1:n*W), W, n).^2));
a = e(20*log10(e + 1e-12) > 20*log10(max(e)) - 30);
g = target / sqrt(mean(a.^2)); x = x * g;
if max(abs(x)) > 0.99, x = x * 0.99 / max(abs(x)); g = g * 0.99 / max(abs(x)); end
end
