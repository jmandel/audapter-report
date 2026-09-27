function r = shift_measure(p, d, t0, t1)
% Ratios (shifted/original) of F1,F2: logged by Audapter (sfmts/fmts) and measured independently in audio.
fr = p.frameLen / p.sr; tt = (0:size(d.fmts,1)-1)' * fr; m = tt > t0 & tt < t1 & d.sfmts(:,1) > 0;
r.logged = median(d.sfmts(m,1:2) ./ d.fmts(m,1:2), 1);
r.nlogged = sum(m);
[Fi, te] = est_formants(d.signalIn, p.sr); [Fo, ~] = est_formants(d.signalOut, p.sr);
lat = 0; mm = te > t0 & te < t1;   % output latency (nDelay frames ~ 10ms) is small relative to the steady window
r.audio = median(Fo(mm,:), 1, 'omitnan') ./ median(Fi(mm,:), 1, 'omitnan');
end
