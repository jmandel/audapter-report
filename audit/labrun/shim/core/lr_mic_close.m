function H = lr_mic_close(h, H)
% Close a capture session: save it as a labrun trial (what the script could have read, and what it did read).
global LR
fs = H.fs; t = LR.ptb0 + LR.vclock; n = floor((t - H.t0) * fs); H.cap.stopAvail = n;
if isempty(H.cap.x), [H.cap.x, H.cap.desc] = lr_mic_input(H, h); end
x = H.cap.x; seg = zeros(n, 1); m = min(n, numel(x)); seg(1:m) = x(1:m);
if ~isfield(H, 'kind'), H.kind = 'ptbCapture'; end
rec = struct('k', H.cap.k, 'mode', H.kind, 't0', H.t0 - LR.ptb0, 't1', t - LR.ptb0, 'pumped_s', n / fs, 'fsDev', fs, ...
  'sr', fs, 'inputDesc', H.cap.desc, 'ctx', H.cap.ctx, 'captured', single(seg), 'read_s', H.cap.read / fs, 'lost_s', H.cap.lost / fs, 'ops', {LR.ops});
LR.ops = {};
if H.cap.shared   % saved next to the Audapter trial it shared the microphone with
  save('-v7', fullfile(LR.outdir, 'trials', sprintf('%04d_%s.mat', H.cap.k, H.kind)), 'rec'); H.active = false; return
end
save('-v7', fullfile(LR.outdir, 'trials', sprintf('%04d.mat', H.cap.k)), 'rec');
LR.trialIndex(end+1) = struct('k', H.cap.k, 'mode', H.kind, 't0', rec.t0, 't1', rec.t1, 'word', H.cap.ctx.word, 'cond', H.cap.ctx.cond, 'phase', {LR.phase});
if LR.timeline > 0, fprintf(LR.timeline, '%d\t%s\t%.4f\t%.4f\t%.4f\t%s\t%s\t%s\n', H.cap.k, H.kind, rec.t0, rec.t1, rec.pumped_s, H.cap.ctx.word, H.cap.ctx.cond, H.cap.desc); end
H.active = false;
end
