function L = corpus_lag(a, b, fs, maxlag)
% Latency (samples) of b relative to a from cross-correlation of 2 ms RMS envelopes (robust to pitch shifting).
if nargin < 4, maxlag = 0.2; end
H = round(0.002*fs); n = floor(min(numel(a), numel(b)) / H);
ea = sqrt(mean(reshape(a(1:n*H), H, n).^2))'; eb = sqrt(mean(reshape(b(1:n*H), H, n).^2))';
ea = ea - mean(ea); eb = eb - mean(eb); M = round(maxlag*fs/H); c = zeros(M+1, 1);
for k = 0:M, c(k+1) = sum(ea(1:end-k) .* eb(1+k:end)); end
[~, k] = max(c); L = (k - 1) * H;
end
