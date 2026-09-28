function lr_device_stop()
% Close the virtual device: record the trial (timeline, input, params, intent diff, ops) and the MEX's own
% recording (Audapter(4), read-only) so the summary does not depend on whether the lab script calls getData.
global LR
d = LR.dev; d.running = false; d.t1 = LR.vclock; LR.dev = d;
k = d.k;
rec = struct('k', k, 'mode', d.mode, 't0', d.t0, 't1', d.t1, 'pumped_s', d.nframes * d.frame / d.fsDev, ...
  'nframes', d.nframes, 'sr', d.sr, 'downFact', d.downFact, 'frameLen', d.frameLen, 'fb', d.fb, ...
  'inputDesc', d.inputDesc, 'input_s', numel(d.input) / d.fsDev, 'ctx', d.ctx, 'params', d.params, ...
  'intentDiff', {d.intentDiff}, 'intentSrc', d.intentSrc);
rec.ops = LR.ops; LR.ops = {};
rec.nTracks = double(AudapterReal('getParam', 'ntracks')); rec.nLPC = double(AudapterReal('getParam', 'nlpc'));
rec.maxRecSize = 480000;
if strcmp(d.mode, 'proc')
  [sig, dat] = AudapterReal(4);
  rec.signalIn = single(sig(:, 1)); rec.signalOut = single(sig(:, min(2, end)));
  rec.dataMat = single(dat);
  rec.input = single(d.input(1:min(end, d.nframes * d.frame)));
  rec.fsDev = d.fsDev;
else
  rec.play = single(d.play); rec.fsDev = d.fsDev;
  rec.playPeak = max([0; abs(d.play(:))]);
end
LR.trialIndex(end+1) = struct('k', k, 'mode', d.mode, 't0', d.t0, 't1', d.t1, 'word', d.ctx.word, 'cond', d.ctx.cond, 'phase', {LR.phase});
save('-v7', fullfile(LR.outdir, 'trials', sprintf('%04d.mat', k)), 'rec');
fprintf(LR.timeline, '%d\t%s\t%.4f\t%.4f\t%.4f\t%s\t%s\t%s\n', k, d.mode, d.t0, d.t1, rec.pumped_s, d.ctx.word, d.ctx.cond, d.inputDesc);
end
