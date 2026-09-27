A = load('/h/oct/out/diff_upstream.mat'); B = load('/h/oct/out/diff_blab.mat');
fr = 0.002;
for v = {'upstream', A.R.field_reentry; 'blab', B.R.field_reentry}'
  d = v{2}; on = d.sfmts(:,1) > 0; e = diff([0; on; 0]); s = find(e == 1); t = find(e == -1) - 1;
  printf('%-9s shifted segments (s): %s\n', v{1}, mat2str([(s-1)*fr (t-1)*fr], 3));
end
d = B.R.field_reentry; F1 = d.fmts(:,1); printf('F1 track at 0.15/0.3/0.5/0.7/0.85 s: %s\n', mat2str(F1(round([0.15 0.3 0.5 0.7 0.85]/fr)), 4));
