V = getenv('VARIANT'); PF = '/h/oct/out/replay_p.mat';
if strcmp(V, 'blab')
  M = corpus_index(); m = M(strcmp({M.id}, 'blab_diao1_female'));
  G = load([m.root '/gt/' m.id '.audapter_online.mat']); [x, fs] = audioread(m.file);
  p = defparams('female'); P = G.params; f = fieldnames(P); pf = fieldnames(p);
  for k = 1:numel(f), j = find(strcmpi(pf, f{k}), 1); if ~isempty(j) && ~ischar(P.(f{k})) && isnumeric(p.(pf{j})), p.(pf{j}) = double(P.(f{k})); end, end
  p.bRatioShift = 0; p.bMelShift = 1; save('-binary', PF, 'p', 'x', 'G');
end
load(PF); d = run_trial(p, x); ok = d.sfmts(:,1) > 0; o = G.sfmts(:,1) > 0;
printf('%s: shifted frames %d (first %d last %d) | online %d (first %d last %d) | tracked %d | minVowelLen %g\n', V, nnz(ok), find(ok,1), find(ok,1,'last'), nnz(o), find(o,1), find(o,1,'last'), nnz(d.fmts(:,1)>0), p.minVowelLen);
