M = corpus_index(); printf('%d clips\n', numel(M));
[x, fs] = corpus_wav(M(1)); printf('%s fs %d n %d max %.3f\n', M(1).id, fs, numel(x), max(abs(x)));
R = corpus_csv(['/a/audit/corpus/ref/' M(1).id '.praat.csv']); size(R)
P = corpus_phones('/a/audit/corpus/gt/arctic_bdl_a0005.phones.csv'); P.ph
p = defparams('male'); tic; d = run_trial(p, x); toc
size(d.fmts), p.sr, p.frameLen
