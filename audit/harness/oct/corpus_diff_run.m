% CORPUS differential + sanitizer sweep: runs every corpus clip through a fixed set of scenarios and stores an
% md5 digest per output array (signalOut, fmts, sfmts, ost_stat, rms), plus NaN/Inf/clipping/level checks.
%   VARIANT=blab     ./run-oct.sh corpus_diff_run.m build-oct
%   VARIANT=upstream ./run-oct.sh corpus_diff_run.m build-upstream upstream/audapter_matlab
%   VARIANT=asan     ./run-oct.sh corpus_diff_run.m build-asan        (sanitizer reports are the signal)
% then corpus_diff.m compares blab vs upstream. Parameters come from out/corpus_diff_params.mat (made by the
% first blab run from blab defaults) so that both builds see identical settings.
VARIANT = getenv('VARIANT'); PF = '/h/oct/out/corpus_diff_params.mat';
if ~exist(PF, 'file')
  PM = defparams('male'); PFe = defparams('female'); save('-binary', PF, 'PM', 'PFe');
end
load(PF); M = corpus_index(); g = linspace(0, 5000, 257);
EX = '/a/blab/audapter_matlab/example_data/';
1;
function h = dig(a), h = hash('md5', char(typecast(double(a(:))', 'uint8'))); end
function s = chk(d)
  o = d.signalOut; s = struct('nan', nnz(~isfinite(o)) + nnz(~isfinite(d.fmts)) + nnz(~isfinite(d.sfmts)), 'peak', max(abs(o)), ...
    'gain_db', 20*log10(rms(o) / max(rms(d.signalIn), 1e-12)));
end
R = struct(); n = 0;
for m = M
  [x, fs] = corpus_wav(m); if m.sex == 'M' && ~strcmp(m.group, 'child'), p0 = PM; else, p0 = PFe; end
  S = {};
  S(end+1,:) = {'track', p0, '', ''};
  q = p0; q.bShift = 1; q.bRatioShift = 1; q.bMelShift = 0; q.F1Min = 0; q.F1Max = 5000; q.F2Min = 0; q.F2Max = 5000; q.LBk = 0; q.LBb = 0;
  q.pertF2 = g; q.pertAmp = 0.2*ones(1,257); q.pertPhi = zeros(1,257); S(end+1,:) = {'field_F1up', q, '', ''};
  % restricted F1/F2 region, as used in vowel-specific experiments: real speech leaves and re-enters it,
  % which is where blab's dropout fix changes behaviour
  q.F1Min = 350; q.F1Max = 900; q.F2Min = 900; q.F2Max = 2600; q.LBk = 0; q.LBb = 0; S(end+1,:) = {'field_region', q, '', ''};
  q = p0; q.bShift = 1; S(end+1,:) = {'pcf_fmt', q, [EX 'ost'], [EX 'fmt_pert.pcf']};
  q = p0; q.bPitchShift = 1; q.pitchShiftRatio = 2^(2/12); S(end+1,:) = {'pvoc_up2', q, '', ''};
  q = p0; q.bPitchShift = 1; S(end+1,:) = {'pcf_pitch', q, [EX 'ost'], [EX 'pitch_pert.pcf']};
  q = p0; q.frameLen = 64; q.nDelay = 7; q.bTimeDomainShift = 1; q.bCepsLift = 1; q.pitchLowerBoundHz = 60; q.pitchUpperBoundHz = 500;
  q.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)]; S(end+1,:) = {'tds_up1', q, '', ''};
  q = p0; q.delayFrames = 50; S(end+1,:) = {'daf_100ms', q, '', ''};
  if strcmp(getenv('SCEN'), 'noost'), S = S(~ismember(S(:,1), {'pcf_fmt', 'pcf_pitch'}), :); end   % OST scenarios abort ASan at the known ost.cpp:361 read (OST-F3)
  for k = 1:size(S, 1)
    key = sprintf('%s__%s', strrep(strrep(m.id, '-', '_'), '.', '_'), S{k,1});
    try
      d = run_trial(S{k,2}, x, 'ost', S{k,3}, 'pcf', S{k,4});
      r = chk(d); r.nshift = nnz(d.sfmts(:,1) > 0); r.ntrack = nnz(d.fmts(:,1) > 0);
      for f = {'signalOut', 'fmts', 'sfmts', 'ost_stat', 'rms'}, if isfield(d, f{1}), r.(f{1}) = dig(d.(f{1})); end, end
    catch e
      r = struct('error', e.message);
    end
    Audapter('ost', '', 0); Audapter('pcf', '', 0);
    R.(key) = r; n = n + 1;
  end
end
save('-binary', sprintf('/h/oct/out/corpus_diff_%s.mat', VARIANT), 'R');
printf('DONE %s: %d clip-scenarios\n', VARIANT, n);
