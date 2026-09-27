% CORPUS: Audapter formant tracker on real speech vs references.
% References: (a) automatic Praat Burg tracks shipped in corpus/ref (NOT hand-measured);
% (b) the harness's independent LPC (est_formants) as a second opinion, so reference disagreement is visible;
% (c) hand-measured Hillenbrand (1995) steady-state formants if the restricted local copy exists (see corpus/README.md).
% Output: per-clip table out/corpus_track.csv, group/vowel/nLPC summaries on stdout.
M = corpus_index(); outf = '/h/oct/out/corpus_track.csv'; fo = fopen(outf, 'w');
fprintf(fo, 'id,group,sex,vowel,param,nLPC,n,F1_mare,F2_mare,F1_gross,F2_gross,F1_bias,F2_bias,ref_F1,ref_F2,aud_F1,aud_F2,lpc_F1err,lpc_F2err,n_cons,F1_mare_cons,F2_mare_cons,gross_cons\n');
VOW = {'aa','ae','ah','ao','aw','ay','eh','er','ey','ih','iy','ow','oy','uh','uw'};
LAG = 0.010;   % Audapter fmts frame i is reported ~10 ms after the audio it describes (estimated below, printed)
1;
function e = mare(a, r), e = median(abs(a - r) ./ r); end
% ---- lag estimate on ARCTIC vowels (female defaults on F, male on M)
lags = 0:0.002:0.03; E = zeros(size(lags));
for m = M(strcmp({M.source}, 'arctic'))
  p = defparams(corpus_preset(m)); [x, fs] = corpus_wav(m); d = run_trial(p, x);
  R = corpus_csv([m.root '/ref/' m.id '.praat.csv']); ta = ((1:size(d.fmts,1))' - 0.5) * p.frameLen / p.sr;
  for k = 1:numel(lags)
    F2a = interp1(ta - lags(k), d.fmts(:,2), R(:,1), 'nearest', 0); ok = F2a > 0 & R(:,2) > 0 & R(:,4) > 0;
    E(k) = E(k) + median(abs(F2a(ok) - R(ok,4)) ./ R(ok,4));
  end
end
[~, k] = min(E); LAG = lags(k); printf('estimated tracker lag vs Praat: %.0f ms (used for alignment)\n', 1000*LAG);
nl = [9 11 13 15 17 19];
for m = M
  [x, fs] = corpus_wav(m);
  R = corpus_csv([m.root '/ref/' m.id '.praat.csv']); tr = R(:,1);
  % frame selection: sustained vowels = 0.4 s .. end-0.3 s; ARCTIC = vowel phones (middle 50 %); others = all voiced
  sel = {}; vn = {};
  if any(strcmp(m.source, {'pvqd', 'vocalset'}))
    sel{1} = tr > 0.4 & tr < tr(end) - 0.3; t_ = regexp(m.content, '/(\w+)/', 'tokens'); vn{1} = t_{1}{1};
  elseif strcmp(m.source, 'arctic')
    P = corpus_phones([m.root '/' strtok(m.gt_file, ';')]);
    for v = VOW
      s = false(size(tr));
      for j = find(strcmp(P.ph, v{1}))
        L = P.t1(j) - P.t0(j); if L < 0.06, continue; end
        s = s | (tr > P.t0(j) + L/4 & tr < P.t1(j) - L/4);
      end
      if any(s), sel{end+1} = s; vn{end+1} = v{1}; end
    end
  else
    sel{1} = true(size(tr)); vn{1} = 'all';
  end
  [Fl, tl] = est_formants(resample(x, 1, 3), 16000, 'order', 18);   % independent LPC at 16 kHz
  for nlpc = [0 nl]
    if nlpc == 0, sx = corpus_preset(m); p = defparams(sx); pname = ['default_' sx];
    else, p = defparams('female'); p.nLPC = nlpc; pname = 'sweep'; end
    d = run_trial(p, x); ta = ((1:size(d.fmts,1))' - 0.5) * p.frameLen / p.sr - LAG;
    Fa = [interp1(ta, d.fmts(:,1), tr, 'nearest', 0), interp1(ta, d.fmts(:,2), tr, 'nearest', 0)];
    Fi = [interp1(tl, Fl(:,1), tr, 'nearest', NaN), interp1(tl, Fl(:,2), tr, 'nearest', NaN)];
    for j = 1:numel(sel)
      ok = sel{j} & R(:,2) > 0 & R(:,3) > 0 & R(:,4) > 0 & Fa(:,1) > 0;
      if nnz(ok) < 5, continue; end
      r1 = R(ok,3); r2 = R(ok,4); a1 = Fa(ok,1); a2 = Fa(ok,2); okl = ~isnan(Fi(ok,1));
      l1 = median(abs(Fi(ok,1)(okl) - r1(okl)) ./ r1(okl)); l2 = median(abs(Fi(ok,2)(okl) - r2(okl)) ./ r2(okl));
      % consensus frames: Praat and the independent LPC agree within 10 % on both F1 and F2
      cons = okl & abs(Fi(ok,1) - r1) ./ r1 < 0.1 & abs(Fi(ok,2) - r2) ./ r2 < 0.1;
      if nnz(cons) >= 5, c1 = mare(a1(cons), r1(cons)); c2 = mare(a2(cons), r2(cons)); gc = mean(abs(a1(cons) - r1(cons)) ./ r1(cons) > 0.2 | abs(a2(cons) - r2(cons)) ./ r2(cons) > 0.2);
      else, c1 = NaN; c2 = NaN; gc = NaN; end
      fprintf(fo, '%s,%s,%s,%s,%s,%d,%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.0f,%.0f,%.0f,%.0f,%.4f,%.4f,%d,%.4f,%.4f,%.4f\n', m.id, m.group, m.sex, vn{j}, pname, p.nLPC, nnz(ok), ...
        mare(a1, r1), mare(a2, r2), mean(abs(a1 - r1) ./ r1 > 0.2), mean(abs(a2 - r2) ./ r2 > 0.2), median((a1 - r1) ./ r1), median((a2 - r2) ./ r2), ...
        median(r1), median(r2), median(a1), median(a2), l1, l2, nnz(cons), c1, c2, gc);
    end
  end
end
fclose(fo);
printf('wrote %s\n', outf);
corpus_track_summary(outf);
