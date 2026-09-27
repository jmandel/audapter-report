% Differential scenario runner. Run once per build; writes out/diff_<VARIANT>.mat. Params come from a
% fixed struct (out/diff_params.mat, made from blab defaults) so both builds see identical settings.
VARIANT = getenv('VARIANT');
if ~exist('/h/oct/out/diff_params.mat', 'file')
  p = defparams('female'); p.rmsRatioThresh = 0.7; save('-binary', '/h/oct/out/diff_params.mat', 'p');
end
load('/h/oct/out/diff_params.mat'); fs = p.sr * p.downFact; g = linspace(0, 5000, 257);
S = struct('name', {}, 'p', {}, 'x', {}, 'ost', {}, 'pcf', {});
xa = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]);
n = round(0.8*fs); tt = (0:n-1)'/n; F1 = 850 - 450*sin(pi*tt).^2;   % 850 -> 400 -> 850: leaves and re-enters field
xd = synth_vowel(fs, 0.8, 120, [F1, 1400*ones(n,1), 2810*ones(n,1), 3800*ones(n,1)], [80 100 150 200]);
q = p; S(end+1) = struct('name', 'passthrough', 'p', q, 'x', xa, 'ost', '', 'pcf', '');
q = p; q.bShift = 1; q.F1Min = 0; q.F1Max = 5000; q.F2Min = 0; q.F2Max = 5000; q.LBk = 0; q.LBb = 0; q.pertF2 = g;
q.pertAmp = 0.2*ones(1,257); q.pertPhi = zeros(1,257); S(end+1) = struct('name', 'field_F1up', 'p', q, 'x', xa, 'ost', '', 'pcf', '');
q.F1Min = 600; S(end+1) = struct('name', 'field_reentry', 'p', q, 'x', xd, 'ost', '', 'pcf', '');
q = p; q.bShift = 1; S(end+1) = struct('name', 'pcf_example', 'p', q, 'x', xa, 'ost', '/a/blab/audapter_matlab/example_data/ost', 'pcf', '/a/blab/audapter_matlab/example_data/fmt_pert.pcf');
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 2^(2/12); S(end+1) = struct('name', 'pvoc_pitch_up2', 'p', q, 'x', xa, 'ost', '', 'pcf', '');
q = p; q.bPitchShift = 1; S(end+1) = struct('name', 'pcf_pitch', 'p', q, 'x', xa, 'ost', '/a/blab/audapter_matlab/example_data/ost', 'pcf', '/a/blab/audapter_matlab/example_data/pitch_pert.pcf');
q = p; q.delayFrames = 50; S(end+1) = struct('name', 'daf_100ms', 'p', q, 'x', xa, 'ost', '', 'pcf', '');
R = struct();
for i = 1:numel(S)
  try
    d = run_trial(S(i).p, S(i).x, 'ost', S(i).ost, 'pcf', S(i).pcf);
    R.(S(i).name) = rmfield(d, 'params');
  catch e
    R.(S(i).name) = struct('error', e.message);
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end
save('-binary', sprintf('/h/oct/out/diff_%s.mat', VARIANT), 'R');
