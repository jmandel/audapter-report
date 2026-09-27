function d = report_outdir(id)
% Output directory for report assets: oct/out/report/<id>/<build>/ (build = blab | upstream | asan)
b = evalin('base', 'BUILD'); [~, b] = fileparts(b);
tag = strrep(strrep(b, 'build-', ''), 'oct', 'blab');
d = fullfile('/h/oct/out/report', id, tag); if ~exist(d, 'dir'), mkdir(d); end
end
