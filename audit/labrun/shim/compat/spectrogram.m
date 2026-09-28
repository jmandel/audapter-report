function [S, F, T, P] = spectrogram(x, win, noverlap, nfft, fs, varargin)
% labrun compat (MATLAB Signal Processing Toolbox spectrogram), short-time Fourier transform with one-sided
% output: S (nfft/2+1 x frames), F (Hz), T (s, frame centres), P (power spectral density).
x = double(x(:));
if nargin < 2 || isempty(win), win = floor(numel(x) / 4.5); end
if isscalar(win), win = hamming(win); end
win = win(:); L = numel(win);
if nargin < 3 || isempty(noverlap), noverlap = floor(L / 2); end
if nargin < 4 || isempty(nfft), nfft = max(256, 2^nextpow2(L)); end
if nargin < 5 || isempty(fs), fs = 1; end
hop = L - noverlap; n = max(0, floor((numel(x) - noverlap) / hop));
S = zeros(floor(nfft / 2) + 1, n);
for i = 1:n
  s = x((i - 1) * hop + (1:L)) .* win; X = fft(s, nfft); S(:, i) = X(1:floor(nfft / 2) + 1);
end
F = (0:floor(nfft / 2))' * fs / nfft; T = ((0:n - 1) * hop + L / 2) / fs;
P = abs(S).^2 / (fs * sum(win.^2)); P(2:end-1, :) = 2 * P(2:end-1, :);
if nargout == 0, imagesc(T, F, 10 * log10(P + eps)); axis xy; end
end
