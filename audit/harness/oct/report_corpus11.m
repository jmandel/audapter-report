% Report asset export for CORPUS-11 (no bound on shifted-formant targets). Replays the 2008 upstream trial
% diao1_female (real recording shipped with Audapter's example_data, MIT) with its ORIGINAL parameters merged into
% today's getAudapterDefaultParams, as corpus_regress.m does: once as ratio shift (today's MATLAB default, which the
% old mel-unit pertAmp then means as "x165") and once as mel shift (the C++ default the 2008 binary used).
% Usage: ./run-oct.sh report_corpus11.m        Output: out/report/corpus-11/blab/{*.wav,data.json}
M = corpus_index(); m = M(strcmp({M.id}, 'blab_diao1_female'));
G = load([m.root '/gt/' m.id '.audapter_online.mat']);
[x, fs] = audioread(m.file); x = x(:,1);
p = defparams(corpus_preset(m)); P = G.params; f = fieldnames(P); pf = fieldnames(p);
for k = 1:numel(f)
  j = find(strcmpi(pf, f{k}), 1);
  if ~isempty(j) && ~ischar(P.(f{k})) && isnumeric(p.(pf{j})), p.(pf{j}) = double(P.(f{k})); end
end
if isnan(p.rmsThresh), p.rmsThresh = 0.01; end
r = struct('clip', m.id, 'sr', p.sr, 'pertAmp_max', max(p.pertAmp), 'frame_s', p.frameLen / p.sr);
modes = {'ratio', 1, 0; 'mel', 0, 1};
for i = 1:2
  q = p; q.bRatioShift = modes{i,2}; q.bMelShift = modes{i,3}; d = run_trial(q, x); k = d.sfmts(:,1) > 0;
  s = struct('ratio_F1', median(d.sfmts(k,1) ./ d.fmts(k,1)), 'max_sF1_hz', max(d.sfmts(:,1)), 'shifted_frames', nnz(k), ...
    'gain_db', 20*log10(rms(d.signalOut) / rms(d.signalIn)), 'peak', max(abs(d.signalOut)));
  kk = 1:2:size(d.fmts, 1);
  s.t = round((kk-1) * r.frame_s * 1e4) / 1e4; s.F1 = round(d.fmts(kk,1))'; s.sF1 = round(d.sfmts(kk,1))';
  r.(modes{i,1}) = s; D.(modes{i,1}) = d;
end
k = G.sfmts(:,1) > 0; r.online_ratio_F1 = median(G.sfmts(k,1) ./ G.fmts(k,1)); r.online_shifted_frames = nnz(k);
printf('ratio: x%.1f, max sF1 %.0f Hz, %+.1f dB, peak %.2f | mel: x%.3f (online x%.3f)\n', r.ratio.ratio_F1, r.ratio.max_sF1_hz, r.ratio.gain_db, r.ratio.peak, r.mel.ratio_F1, r.online_ratio_F1);
od = report_outdir('corpus-11');
c = struct('name', {'input', 'output_mel', 'output_ratio'}, 'x', {D.mel.signalIn, D.mel.signalOut, D.ratio.signalOut}, ...
  'label', {'Input: the 2008 recording (Mandarin syllable)', 'Output with mel shift, as in the 2008 session', 'Output with the same parameters under today''s ratio default'}, ...
  'warn', {'', '', 'Very loud: the ratio-mode output is about +24 dB and clips; the clip is scaled down so its peak is at -1 dBFS.'});
r.audio = report_wavgroup(od, p.sr, c);
report_json(fullfile(od, 'data.json'), r);
