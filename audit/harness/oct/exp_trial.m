function r = exp_trial(p, x)
% One lab-style trial: Audapter('reset'), feed x (device rate) through runFrame (fresh copies, H3),
% AudapterIO('getData'). Returns the data plus what was delivered:
%   r.shift_s    seconds of frames logged as shifted (sfmts > 0 and |sfmts - fmts| > 1 Hz, PLAYGROUND-2)
%   r.on, r.off  first/last shifted time (s), NaN if none
%   r.dF1mel     median logged F1 shift (mel) over shifted frames
%   r.outF1      median ratio of an independent LPC F1 on output vs input (voiced 10 ms frames, 10 ms lag)
Audapter('reset');
N = p.frameLen * p.downFact; x = x(:); x = [x; zeros(mod(-numel(x), N), 1)];
for k = 1:numel(x)/N, fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
d = AudapterIO('getData'); r.d = d; fd = p.frameLen / p.sr;
hz2mel = @(f) 1127.01048 * log(1 + f / 700);
s = d.sfmts(:,1) > 0 & abs(d.sfmts(:,1) - d.fmts(:,1)) > 1;
r.shift_s = sum(s) * fd; ix = find(s);
if isempty(ix), r.on = NaN; r.off = NaN; r.dF1mel = 0; else
  r.on = (ix(1) - 1) * fd; r.off = ix(end) * fd; r.dF1mel = median(hz2mel(d.sfmts(ix,1)) - hz2mel(d.fmts(ix,1))); end
[Fi, ti] = est_formants(d.signalIn, p.sr); [Fo, to] = est_formants(d.signalOut, p.sr);
n = min(size(Fi,1), size(Fo,1) - 1); q = Fo(2:n+1,1) ./ Fi(1:n,1); q = q(isfinite(q) & q > 0.5 & q < 2);
if numel(q) < 5, r.outF1 = NaN; else, r.outF1 = median(q); end
end
