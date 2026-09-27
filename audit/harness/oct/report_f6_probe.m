load('/h/oct/out/report/f6-params.mat'); if isfield(p,'pertF1') && strcmp(getenv('VARIANT'),'upstream'), p = rmfield(p,'pertF1'); end
fs = p.sr * p.downFact; n = round(1.0 * fs); tt = (0:n-1)' / n; s2 = sin(pi * tt).^2; f0 = 125 - 20 * tt;
Fg = [850 - 540 * s2, 1220 + 1570 * s2, 2810 * ones(n,1), 3800 * ones(n,1)];
xg = synth_vowel(fs, 1.0, f0, Fg, [80 100 150 200], 'onset', 0.1, 'offset', 0.2, 'amp', 0.3);
for m = [5 60 1000 100000]
  q = p; q.minVowelLen = m; d = run_trial(q, xg); on = d.sfmts(:,1) > 0; e = diff([0; on; 0]);
  printf('minVowelLen %d (get %d): %s\n', m, Audapter('getParam','minvowellen'), mat2str([find(e==1) find(e==-1)]'));
end
