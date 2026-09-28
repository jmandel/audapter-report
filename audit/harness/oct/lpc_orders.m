% For each pretest (noShift) trial of a labrun result dir, re-run Audapter on the recorded device input at LPC orders
% 10-20 (all other scalar settings from the trial's own snapshot, fb 1) and save the F1/F2 tracks.
% Usage: SCEN='<run dir rel. to repo root>|<out dir under oct/out>' ./run-oct.sh lpc_orders.m
a = strsplit(getenv('SCEN'), '|'); R = ['/a/' a{1}]; O = ['/h/oct/out/' a{2}]; mkdir(O);
L = dir([R '/trials/*.mat']); res = struct('k', {}, 'order', {}, 'fmts', {}, 'desc', {}, 'word', {}, 'sr', {}, 'fl', {});
for i = 1:numel(L)
  S = load([R '/trials/' L(i).name]); r = S.rec;
  if ~strcmp(r.mode, 'proc') || ~strcmp(r.ctx.cond, 'noShift'), continue; end
  P0 = getAudapterDefaultParams(r.ctx.gender); P = r.params; f = fieldnames(P); fp = fieldnames(P0);
  for j = 1:numel(fp), m = find(strcmpi(f, fp{j}), 1); if ~isempty(m) && isnumeric(P.(f{m})) && isscalar(P.(f{m})), P0.(fp{j}) = double(P.(f{m})); end, end
  P0.dScale = double(P.scale); P0.fb = 1; P0.bShift = 0;
  N = double(P.framelen) * double(P.downfact); x = double(r.input(:)); x = [x; 1e-4*randn(double(r.nframes)*N - numel(x), 1)];
  for ord = 10:20
    P0.nLPC = ord; AudapterIO('init', P0); Audapter('reset');
    for k = 1:numel(x)/N, Audapter('runFrame', x((k-1)*N+1:k*N) + 0); end
    d = AudapterIO('getData');
    res(end+1) = struct('k', r.k, 'order', ord, 'fmts', d.fmts(:, 1:2), 'desc', r.inputDesc, 'word', r.ctx.word, 'sr', double(P.srate), 'fl', double(P.framelen));
  end
end
save('-mat7-binary', [O '/orders.mat'], 'res');
printf('orders: %d trial x order runs -> %s\n', numel(res), O);
