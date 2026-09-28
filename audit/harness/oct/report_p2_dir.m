function d = report_p2_dir(id)
% Measurement directory for a report card: out/report/<id>/meas (created if missing).
d = ['/h/oct/out/report/' id '/meas']; if ~exist(d, 'dir'), mkdir(d); end
end
