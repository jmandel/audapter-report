% Replay labrun trials voice-only: recorded device input + the lab's own saved parameters for that trial
% (data(i).params from the experiment's data.mat), with feedback mode 1 (no masking noise).
D = '/h/oct/out/replay'; L = dir([D '/0*.mat']); LD = load([D '/labdata.mat']);
for i = 1:numel(L)
  S = load([D '/' L(i).name]); r = S.rec; it = r.ctx.itrial; Q = LD.data(it).params; P = getAudapterDefaultParams(r.ctx.gender); fp = fieldnames(P); fq = fieldnames(Q);
  for j = 1:numel(fp), m = find(strcmpi(fq, fp{j}), 1); if ~isempty(m) && ~isempty(Q.(fq{m})), P.(fp{j}) = Q.(fq{m}); end, end
  if isfield(Q, 'scale'), P.dScale = Q.scale; end
  P.fb = 1;
  AudapterIO('init', P); Audapter('reset');
  N = double(r.params.framelen) * double(r.params.downfact); x = double(r.input(:)); x = [x; 1e-4*randn(double(r.nframes)*N - numel(x), 1)];
  for k = 1:numel(x)/N, Audapter('runFrame', x((k-1)*N+1:k*N) + 0); end
  d = AudapterIO('getData'); nT = double(r.nTracks); o2 = 4 + 2*nT + 2; sfR = double(r.dataMat(1:size(d.sfmts,1), o2+1));
  y3 = double(r.signalOut); y1 = d.signalOut; n = min(numel(y1), numel(y3)); vs = abs(double(r.signalIn(1:n))) > 0.01*max(abs(double(r.signalIn)));
  printf('%s %-5s: input match %d; shifted-F1 log max diff %.2f Hz; recorded mix minus replay, in voice: %.1f dB re voice\n', L(i).name, r.ctx.word, ...
    max(abs(single(d.signalIn(1:n)) - r.signalIn(1:n))) < 1e-3, max(abs(d.sfmts(:,1) - sfR)), 20*log10(norm(y3(vs)-y1(vs))/norm(y1(vs))));
  audiowrite([D '/' strrep(L(i).name, '.mat', '_fb1.wav')], y1, double(r.params.srate));
end
