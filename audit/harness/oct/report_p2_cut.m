function x = report_p2_cut(M, id, a, b)
% A cut (a..b s) of a corpus clip at 48 kHz.
x = corpus_wav(M(strcmp({M.id}, id))); x = x(max(1, round(a*48000)+1):min(end, round(b*48000)));
end
