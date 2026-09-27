% CORPUS: Audapter formant tracker vs Hillenbrand et al. (1995) hand-corrected formants (hVd words).
% RESTRICTED DATA: audio is read from a local, non-redistributed copy under
% audit/scratch/corpus/restricted/hillenbrand (see corpus/README.md "Restricted sources"); results only.
% 12 talkers x 12 vowels per group (men, women, boys, girls; kids aged 10-12).
% Compares Audapter fmts (median over steady state +/- 20 ms) with the published steady-state F1/F2,
% for the default preset (men: 'male', everyone else: 'female') and an nLPC sweep.
HB = '/a/audit/scratch/corpus/restricted/hillenbrand';
if ~exist([HB '/index.tsv'], 'file'), printf('SKIP: Hillenbrand restricted copy not present\n'); return; end
1;
function s = preset(g), if g == 'm', s = 'male'; else, s = 'female'; end, end
fid = fopen([HB '/index.tsv']); hdr = strsplit(fgetl(fid), "\t");
C = textscan(fid, ['%s%s%s' repmat('%f', 1, numel(hdr)-3)], 'Delimiter', "\t"); fclose(fid);
H = struct(); for k = 1:numel(hdr), H.(hdr{k}) = C{k}; end
N = numel(H.file); LAG = 0.014;   % tracker lag estimated in corpus_track.m
cfg = {'default', 0; 'nLPC9', 9; 'nLPC11', 11; 'nLPC13', 13; 'nLPC15', 15; 'nLPC17', 17};
fo = fopen('/h/oct/out/corpus_hillenbrand.csv', 'w');
fprintf(fo, 'file,group,vowel,f0,cfg,nLPC,F1ref,F2ref,F1aud,F2aud,F1lpc,F2lpc,nfr,F1traj_err,F2traj_err\n');
for i = 1:N
  [x, fs] = audioread([HB '/wav/' H.file{i}]); x = resample(x(:,1), 3, 1); fs = 48000;
  x = x / sqrt(mean(x(round(H.start(i)/1000*fs):round(H.end(i)/1000*fs)).^2)) * 0.05;   % vowel RMS -> 0.05
  x = [zeros(round(0.05*fs), 1); x; zeros(round(0.05*fs), 1)]; off = 0.05;
  ss = H.ss(i)/1000 + off;
  [Fl, tl] = est_formants(resample(x, 1, 3), 16000, 'order', 18); ml = abs(tl - ss) <= 0.02;
  for c = 1:size(cfg, 1)
    if cfg{c,2} == 0, p = defparams(preset(H.group{i})); else, p = defparams('female'); p.nLPC = cfg{c,2}; end
    d = run_trial(p, x); ta = ((1:size(d.fmts,1))' - 0.5) * p.frameLen / p.sr - LAG;
    m = abs(ta - ss) <= 0.02 & d.fmts(:,1) > 0;
    fa = [NaN NaN]; if nnz(m) >= 3, fa = median(d.fmts(m, 1:2), 1); end
    % trajectory: 20/50/80 % points
    te = []; dur = (H.end(i) - H.start(i))/1000; pts = [0.2 0.5 0.8];
    R = [H.F1_20(i) H.F2_20(i); H.F1_50(i) H.F2_50(i); H.F1_80(i) H.F2_80(i)];
    for q = 1:3
      tq = H.start(i)/1000 + off + pts(q)*dur; mq = abs(ta - tq) <= 0.006 & d.fmts(:,1) > 0;
      if nnz(mq) && all(R(q,:) > 0), te(end+1, :) = abs(median(d.fmts(mq, 1:2), 1) - R(q,:)) ./ R(q,:); end
    end
    if isempty(te), te = [NaN NaN]; end
    fprintf(fo, '%s,%s,%s,%.0f,%s,%d,%.0f,%.0f,%.0f,%.0f,%.0f,%.0f,%d,%.4f,%.4f\n', H.file{i}, H.group{i}, H.vowel{i}, H.f0(i), cfg{c,1}, p.nLPC, ...
      H.F1(i), H.F2(i), fa(1), fa(2), median(Fl(ml,1), 'omitnan'), median(Fl(ml,2), 'omitnan'), nnz(m), mean(te(:,1)), mean(te(:,2)));
  end
end
fclose(fo);
corpus_hillenbrand_summary('/h/oct/out/corpus_hillenbrand.csv');
