function man = report_wavgroup(outdir, fs, clips, varargin)
% Write a group of report audio clips with ONE shared gain, so relative levels
% inside the group (input vs output, before vs after) are preserved exactly.
% clips: struct array with fields name, x (column vector at fs), label, and optional warn.
% Gain: loudest clip's active-RMS -> target dBFS, then reduced so no clip peaks above -1 dBFS.
% Returns a manifest struct (also written by the caller into data.json).
o = struct('target_dbfs', -20, 'peak_dbfs', -1, 'active_thresh', 1e-3);
for k = 1:2:numel(varargin), o.(varargin{k}) = varargin{k+1}; end
if ~exist(outdir, 'dir'), mkdir(outdir); end
act = zeros(1, numel(clips)); pk = act;
for i = 1:numel(clips)
  x = clips(i).x(:); w = round(0.02*fs); nb = floor(numel(x)/w);
  b = reshape(x(1:nb*w), w, nb); br = sqrt(mean(b.^2));
  a = b(:, br > o.active_thresh);
  if isempty(a), act(i) = 0; else act(i) = sqrt(mean(a(:).^2)); end
  pk(i) = max(abs(x));
end
g = 10^(o.target_dbfs/20) / max(act);
g = min(g, 10^(o.peak_dbfs/20) / max(pk));
man = struct('file', {}, 'label', {}, 'dur_s', {}, 'active_rms_dbfs', {}, 'peak_dbfs', {}, 'warn', {});
for i = 1:numel(clips)
  f = [clips(i).name '.wav'];
  audiowrite(fullfile(outdir, f), g * clips(i).x(:), fs, 'BitsPerSample', 16);
  w = ''; if isfield(clips, 'warn') && ~isempty(clips(i).warn), w = clips(i).warn; end
  man(end+1) = struct('file', f, 'label', clips(i).label, 'dur_s', numel(clips(i).x)/fs, ...
    'active_rms_dbfs', 20*log10(max(act(i),1e-12)), 'peak_dbfs', 20*log10(max(pk(i),1e-12)), 'warn', w);
end
printf('wavgroup %s: shared gain %.2f dB, %d clips\n', outdir, 20*log10(g), numel(clips));
end
