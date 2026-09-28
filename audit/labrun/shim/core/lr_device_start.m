function lr_device_start(mode, ctx)
% Open the virtual device for one "trial" (Audapter start / playWave / playTone / playToneSeq).
global LR
LR.ntrial = LR.ntrial + 1; k = LR.ntrial;
LR.kbStuck = 0; LR.lastProgress = LR.vclock;
if LR.ntrial > LR.plan.maxStarts
  error('labrun:maxStarts', 'labrun: more than %d device starts (plan.maxStarts); stopping (a retry loop that never succeeds?)', LR.plan.maxStarts);
end
d = struct('running', true, 'mode', mode, 'k', k);
d.sr = double(AudapterReal('getParam', 'srate')); d.downFact = double(AudapterReal('getParam', 'downfact'));
d.frameLen = double(AudapterReal('getParam', 'framelen'));
d.fsDev = d.sr * d.downFact; d.frame = d.frameLen * d.downFact;
d.fb = double(AudapterReal('getParam', 'fb'));
d.acc = 0; d.pos = 0; d.nframes = 0; d.t0 = LR.vclock;
d.input = []; d.inputDesc = ''; d.ctx = lr_ctx_summary(ctx);
d.play = [];
% parameters in effect at start (getParam of everything AudapterIO('init') can send) and the script's intent
[d.params, d.intentDiff, d.intentSrc, d.paramsFull] = lr_param_check(ctx);
d.ostText = LR.curOst; d.pcfText = LR.curPcf;   % OST/PCF in effect (texts), so a trial can be replayed from its record
if strcmp(mode, 'playWave')
  d.maxPB = LR.pb.max; d.datapb = zeros(d.maxPB, 1); n = min(numel(LR.pb.data), d.maxPB); d.datapb(1:n) = LR.pb.data(1:n);
end
if strcmp(mode, 'playTone')
  d.wgFreq = double(AudapterReal('getParam', 'wgfreq')); d.wgAmp = double(AudapterReal('getParam', 'wgamp'));
  d.wgTime = double(AudapterReal('getParam', 'wgtime'));
end
LR.dev = d;
end
