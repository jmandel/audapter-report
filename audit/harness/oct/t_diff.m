% Assert blab == upstream bit-for-bit on the differential scenarios (requires diff_run.m for both builds).
A = load('/h/oct/out/diff_upstream.mat'); B = load('/h/oct/out/diff_blab.mat'); A = A.R; B = B.R;
expect_diff = {'field_reentry'};   % known intentional behaviour change (blab "formant dropout fix")
for f = fieldnames(A)'
  a = A.(f{1}); b = B.(f{1});
  same = ~isfield(a,'error') && ~isfield(b,'error') && isequal(a.signalOut, b.signalOut) && isequal(a.fmts, b.fmts) && isequal(a.sfmts, b.sfmts) && isequal(a.ost_stat, b.ost_stat);
  if any(strcmp(f{1}, expect_diff))
    T(['diff upstream/blab: ' f{1}], ~same, 'expected to differ (dropout fix: re-perturbs on field re-entry)');
  else
    T(['diff upstream/blab: ' f{1}], same, '');
  end
end
