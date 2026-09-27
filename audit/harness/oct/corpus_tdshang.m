% Minimal reproduction of a time-domain-shifter hang on a real sung clip (vocadito_4, F0 ~120 Hz):
% VARIANT=after32: first run one frameLen 32 / nDelay 5 TDS trial in the same session, then frameLen 64, nDelay 7 (upstream time_domain_shift_demo.m settings), pitch bounds 70-300 Hz, +1 st.
M = corpus_index(); cid = getenv('SCEN'); if isempty(cid), cid = 'vocadito_4'; end; m = M(strcmp({M.id}, cid)); [x, fs] = corpus_wav(m);
p = defparams('female'); p.frameLen = 64; p.nDelay = 7; p.bTimeDomainShift = 1; p.bCepsLift = 1;
p.pitchLowerBoundHz = 70; p.pitchUpperBoundHz = 300; p.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)];
if strcmp(getenv('VARIANT'), 'after32')   % a preceding TDS trial with the default frameLen 32 / nDelay 5
  q = p; q.frameLen = 32; q.nDelay = 5; run_trial(q, x); printf('trial with frameLen 32 done\n');
end
AudapterIO('init', p); Audapter('reset'); N = p.frameLen * p.downFact; x = [x; zeros(mod(-numel(x), N), 1)];
for k = 1:numel(x)/N
  if mod(k, 50) == 0, printf('frame %d (t=%.2f s)\n', k, k*N/48000); fflush(stdout); end
  fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr);
end
printf('DONE\n');
