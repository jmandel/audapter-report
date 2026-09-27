% CORPUS: replay the three real recorded Audapter trials shipped with upstream Audapter
% (diao1_female, da1_male: 2008-era formant-shift trials; trial-1-2: 2013 rhythm study) through today's build
% with their ORIGINAL parameters, and compare the formant tracks (fmts), shifted formants (sfmts) and
% OST states with what the original online (Windows) session logged.
% Caveats: the input is the logged signalIn (at sr) upsampled to 48 kHz, so Audapter's downsampler sees a
% slightly different signal than online; the old sessions ran older Audapter versions.
M = corpus_index(); M = M(strcmp({M.source}, 'blab'));
1;
function p = orig_params(G, sex)
  p = defparams(sex); P = G.params; f = fieldnames(P); pf = fieldnames(p);
  for k = 1:numel(f)
    j = find(strcmpi(pf, f{k}), 1);   % match case-insensitively (e.g. downfact vs downFact)
    if ~isempty(j) && ~ischar(P.(f{k})) && isnumeric(p.(pf{j})), p.(pf{j}) = double(P.(f{k})); end
  end
  if isnan(p.rmsThresh), p.rmsThresh = 0.01; end
end
for m = M
  G = load([m.root '/gt/' m.id '.audapter_online.mat']);
  [x, fs] = audioread(m.file); x = x(:,1) * 1;   % keep the original (recorded) level
  p = orig_params(G, corpus_preset(m));
  if isfield(G.params, 'bShift') && G.params.bShift
    printf('%s: original bShift=1 (pertAmp max %.2f, F2 grid %s)\n', m.id, max(p.pertAmp), mat2str(p.pertF2([1 end]), 4));
  end
  d = run_trial(p, x);
  n = min(size(d.fmts, 1), size(G.fmts, 1)); A = d.fmts(1:n, 1:2); B = double(G.fmts(1:n, 1:2));
  if ~any(B(:,1) > 0)
    printf('SKIP  corpus regress %s: the online log has no formant track (saved rmsThresh = %g, so no frame passed the threshold online); its OST file is not shipped\n', m.id, G.params.rmsThresh); continue;
  end
  % align: find frame lag maximizing agreement of the voiced masks
  best = -1; lag = 0;
  for L = -20:20
    a = circshift(A(:,1) > 0, L); s = mean(a == (B(:,1) > 0)); if s > best, best = s; lag = L; end
  end
  A = circshift(A, lag); ok = A(:,1) > 0 & B(:,1) > 0;
  e = abs(A(ok,:) - B(ok,:)) ./ B(ok,:);
  printf('%-18s sr %d frameLen %d nLPC %d rmsThresh %.4f | frames tracked: online %d, replay %d, both %d (lag %d frames)\n', m.id, p.sr, p.frameLen, p.nLPC, p.rmsThresh, nnz(B(:,1) > 0), nnz(A(:,1) > 0), nnz(ok), lag);
  printf('    F1 median |diff| %.1f%% (%.0f Hz), F2 %.1f%% (%.0f Hz); frames >10%% off: F1 %.0f%% F2 %.0f%%\n', 100*median(e(:,1)), median(abs(A(ok,1) - B(ok,1))), ...
    100*median(e(:,2)), median(abs(A(ok,2) - B(ok,2))), 100*mean(e(:,1) > 0.1), 100*mean(e(:,2) > 0.1));
  if isfield(G, 'sfmts') && any(G.sfmts(:,1) > 0)
    S = circshift(d.sfmts(1:n, 1:2), lag); So = double(G.sfmts(1:n, 1:2)); ok2 = S(:,1) > 0 & So(:,1) > 0;
    r1 = S(ok2,:) ./ A(ok2,:); r0 = So(ok2,:) ./ B(ok2,:);
    printf('    shift ratio sfmts/fmts: online median F1 %.3f F2 %.3f | replay F1 %.3f F2 %.3f (shifted frames online %d, replay %d)\n', median(r0), median(r1), nnz(So(:,1) > 0), nnz(S(:,1) > 0));
  end
  if isfield(G.params, 'bShift') && G.params.bShift
    % the 2008 params carry no bRatioShift/bMelShift; merged into today's MATLAB defaults they mean "ratio".
    % Replay under both interpretations (C++ defaults = mel/absolute, which the 2008 binary used).
    for mode = {'ratio (MATLAB default)', 1, 0; 'mel (C++ default)', 0, 1}'
      q = p; q.bRatioShift = mode{2}; q.bMelShift = mode{3}; dq = run_trial(q, x); k = dq.sfmts(:,1) > 0;
      printf('    replay as %-22s: sfmts/fmts F1 %.3f, max sfmts F1 %.0f Hz, shifted frames %d (frames %d-%d), out/in level %+.1f dB, peak %.2f\n', mode{1}, ...
        median(dq.sfmts(k,1) ./ dq.fmts(k,1)), max(dq.sfmts(:,1)), nnz(k), find(k, 1), find(k, 1, 'last'), 20*log10(rms(dq.signalOut)/rms(dq.signalIn)), max(abs(dq.signalOut)));
    end
    k = G.sfmts(:,1) > 0; printf('    online log (%-18s): sfmts/fmts F1 %.3f, shifted frames %d (frames %d-%d)\n', 'original session', median(G.sfmts(k,1) ./ G.fmts(k,1)), nnz(k), find(k, 1), find(k, 1, 'last'));
  end
  T(sprintf('corpus regress %s: replay tracks online F1/F2 within 5%% (median)', m.id), all(median(e) < 0.05), 'F1 %.1f%% F2 %.1f%%', 100*median(e));
end
