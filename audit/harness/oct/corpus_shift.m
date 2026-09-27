% CORPUS: formant and pitch shifts on real speech. Commanded vs logged (sfmts/fmts) vs measured in the
% output audio (independent LPC / autocorrelation F0 on signalOut vs signalIn over the same frames).
% Runs on sustained vowels, sung vowels, sentences, children. Writes out/corpus_shift.csv; prints group summaries.
M = corpus_index();
use = ~ismember({M.source}, {'freespeech'});   % 0.5 s words are too short for steady-state measures
M = M(use);
if ~isempty(getenv('SCEN')), M = M(strncmp({M.id}, getenv('SCEN'), numel(getenv('SCEN')))); end   % optional id-prefix filter
1;
function [lo, hi] = f0range(m)
  switch m.group
    case {'singer_F'}, lo = 150; hi = 600;
    case {'singer_M'}, lo = 100; hi = 450;
    case {'child', 'teen_F'}, lo = 150; hi = 600;
    otherwise, if m.sex == 'M', lo = 60; hi = 300; else, lo = 100; hi = 500; end
  end
  if strcmp(m.id, 'vocadito_2'), lo = 200; hi = 700; end
  if any(strcmp(m.id, {'vocadito_4', 'vocadito_10'})), lo = 70; hi = 300; end
end
g = linspace(0, 5000, 257);
fo = fopen('/h/oct/out/corpus_shift.csv', 'w');
fprintf(fo, 'id,group,case,cmdF1,cmdF2,logF1,logF2,audF1,audF2,coverage,nfr,cmd_cents,out_cents,gain_db\n');
cases = {'F1+20', [1.2 1], 0.2, 0; 'F2-20', [1 0.8], 0.2, -pi/2; 'F1-20F2+20', [0.8 1.2], 0.2*sqrt(2), 3*pi/4};
for m = M
  printf('clip %s\n', m.id); fflush(stdout); fflush(fo);
  [x, fs] = corpus_wav(m); p0 = defparams(corpus_preset(m)); [lo, hi] = f0range(m);
  d0 = run_trial(p0, x); voiced = d0.fmts(:,1) > 0;
  % --- formant shifts via 1D field covering the whole F1/F2 plane
  for c = 1:size(cases, 1)
    p = p0; p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
    p.pertF2 = g; p.pertAmp = cases{c,3}*ones(1,257); p.pertPhi = cases{c,4}*ones(1,257);
    d = run_trial(p, x); fr = p.frameLen / p.sr;
    sh = d.sfmts(:,1) > 0 & d.fmts(:,1) > 0;
    lg = [NaN NaN]; if nnz(sh) > 5, lg = median(d.sfmts(sh,1:2) ./ d.fmts(sh,1:2), 1); end
    % measured: independent LPC on in and on latency-compensated out, per frame, only on shifted frames where
    % the independent LPC agrees with Audapter's own fmts within 10 % (so both see the same formants)
    si = d.signalIn; so = d.signalOut; [xc, lg_] = xcorr(so, si, round(0.03*p.sr)); xc(lg_ < 0) = 0; [~, k] = max(abs(xc)); dl = lg_(k);
    so = [so(dl+1:end); zeros(dl, 1)];
    ordr = 16 + 2*strcmp(corpus_preset(m), 'male');
    [Fi, te] = est_formants(si, p.sr, 'order', ordr); [Fo, ~] = est_formants(so, p.sr, 'order', ordr);
    ta = ((1:size(d.fmts,1))' - 0.5) * fr - 0.014;
    Fa = [interp1(ta, d.fmts(:,1), te, 'nearest', 0), interp1(ta, d.fmts(:,2), te, 'nearest', 0)];
    Sa = interp1(ta, double(sh), te, 'nearest', 0) > 0;
    msk = Sa & all(abs(Fi - Fa) ./ Fa < 0.1, 2) & ~any(isnan(Fo), 2);
    au = [NaN NaN]; if nnz(msk) >= 5, au = median(Fo(msk,:) ./ Fi(msk,:), 1); end
    fprintf(fo, '%s,%s,%s,%.3f,%.3f,%.4f,%.4f,%.4f,%.4f,%.3f,%d,,,\n', m.id, m.group, cases{c,1}, cases{c,2}, lg, au, nnz(sh) / max(1, nnz(voiced)), nnz(msk));
  end
  % --- phase-vocoder pitch shift +/-2 st and 0 st: frame-paired autocorrelation F0 (in vs out), latency ignored
  [fin, tf] = corpus_f0track(d0.signalIn, p0.sr, lo, hi);
  for st = [0 2 -2]
    p = p0; p.bPitchShift = 1; p.pitchShiftRatio = 2^(st/12); d = run_trial(p, x);
    L = corpus_lag(d.signalIn, d.signalOut, p.sr); so = [d.signalOut(L+1:end); zeros(L, 1)];
    fout = corpus_f0track(so, p.sr, lo * 2^(min(st,0)/12), hi * 2^(max(st,0)/12));
    nn = min(numel(fin), numel(fout)); fout = fout(1:nn); fi_ = fin(1:nn);
    ok = ~isnan(fi_) & ~isnan(fout); cen = 1200*log2(fout(ok) ./ fi_(ok));
    v = d.rms(:,1) > p.rmsThresh; vi = repelem(v, p.frameLen); n = min(numel(vi), numel(d.signalIn));
    gdb = 20*log10(rms(d.signalOut(vi(1:n))) / rms(d.signalIn(vi(1:n))));
    fprintf(fo, '%s,%s,pvoc%+d,,,,,,,,%d,%d,%.1f,%.2f\n', m.id, m.group, st, nnz(ok), 100*st, median(cen), gdb);
    if st == 0, fprintf(fo, '%s,%s,pvoc_latency_ms,,,,,,,,,,%.1f,\n', m.id, m.group, 1000*L/p.sr); end
  end
  % --- time-domain pitch shift +1 st from onset (bounds per speaker group), with the default frame settings
  %     (frameLen 32, nDelay 5) and with the settings of upstream time_domain_shift_demo.m (frameLen 64, nDelay 7).
  %     Output: frame-paired F0 cents; tracker: Audapter's logged pitchHz vs reference F0
  %     (vocadito expert annotation if present, else the Praat reference)
  for fcfg = {'tdsdef', 32, 5; 'tdsdemo', 64, 7}'
    p = p0; p.frameLen = fcfg{2}; p.nDelay = fcfg{3};
    p.bTimeDomainShift = 1; p.pitchLowerBoundHz = lo; p.pitchUpperBoundHz = hi; p.bCepsLift = 1;
    p.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)];
    try
      % frameLen/nDelay changes do not rebuild the formant tracker (FMT-F15); a stale tracker can feed NaN LPC
      % coefficients to hqr_roots, which then never terminates (CORPUS finding, repro: corpus_tdshang.m).
      % Force a rebuild by toggling bCepsLift in a throw-away init.
      q = p; q.bCepsLift = 1 - p.bCepsLift; AudapterIO('init', q);
      d = run_trial(p, x);
      L = corpus_lag(d.signalIn, d.signalOut, p.sr); so = [d.signalOut(L+1:end); zeros(L, 1)];
      fout = corpus_f0track(so, p.sr, lo, hi * 1.1); nn = min(numel(fin), numel(fout)); fout = fout(1:nn); fi_ = fin(1:nn);
      ok = ~isnan(fi_) & ~isnan(fout); cen = median(1200*log2(fout(ok) ./ fi_(ok)));
      ta = ((1:numel(d.pitchHz))' - 0.5) * p.frameLen / p.sr - 0.014;
      if strncmp(m.id, 'vocadito', 8), R = corpus_csv([m.root '/gt/' m.id '.f0.csv']); R(R(:,2) == 0, 2) = NaN; rs = 'expert';
      else, R = corpus_csv([m.root '/ref/' m.id '.praat.csv']); R = R(:, 1:2); rs = 'praat'; end
      pr = interp1(ta, d.pitchHz(:), R(:,1), 'nearest', 0); ok2 = pr > 0 & R(:,2) > 0;
      q = pr(ok2) ./ R(ok2,2);
      fprintf(fo, '%s,%s,%s+1,,,,,,,,%d,100,%.1f,\n', m.id, m.group, fcfg{1}, nnz(ok), cen);
      fprintf(fo, '%s,%s,%s_tracker_vs_%s,,,,,%.4f,%.4f,%.4f,%d,,,\n', m.id, m.group, fcfg{1}, rs, median(q), mean(abs(q - 1) < 0.05), mean(abs(q - 2) < 0.15), nnz(ok2));
    catch e
      fprintf(fo, '%s,%s,%s+1,ERROR %s\n', m.id, m.group, fcfg{1}, strrep(e.message, ',', ';'));
    end
  end
end
fclose(fo);
corpus_shift_summary('/h/oct/out/corpus_shift.csv');
