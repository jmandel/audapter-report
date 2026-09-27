% EXP: blab vowel-space (VSA) perturbation fields, wired exactly as the PUBLIC blab runners wire them.
% Builds the field with the lab's own free-speech calc_pertField('in', fmtMeans, 1) (mel field), then
% reproduces each runner's parameter sequence (expt.audapterParams assembly, add2struct onto
% getAudapterDefaultParams, AudapterIO('init'), the extra setParam calls right after init, and the
% per-trial scaling), and measures the logged shift (sfmts vs fmts, in mel) on synthetic vowels.
%   vsaSentence    run_vsaSentence_expt.m:220-228,266 + run_vsaSentence_audapter.m:51-71,119-120  (pertF1 = mel grid)
%   vsaCentralize  run_vsaAdapt2_expt.m:108-118,155,168 + run_vsaAdapt2_audapter.m:47-65,104-105 (pertf1 = Hz grid)
%   vsaGeneralize  run_vsaGeneralize_expt.m:126-136,190,201 + run_vsaGeneralize_audapter.m:54-77,117-118
% Intended shift ("in", scale s): heard = produced + s * (centre - produced), in mel (Parrell & Niziolek design).
% Also checks that vsaGeneralize's p.fb4Gain = 0.98 (run_vsaGeneralize_audapter.m:65-66) reaches Audapter.
% Usage: ./run-oct.sh exp_vsa_field.m          Sources: other/blab-experiments (public repos, SHAs in notes)
FS = '/a/other/blab-experiments/free-speech';
addpath(fullfile(FS, 'experiment_helpers'), '-end'); addpath(fullfile(FS, 'utils'), '-end');
addpath(fullfile(FS, 'speech'), '-end'); addpath('/h/oct/exp_shims');
fieldDim = 257; mel2hz_ = @(m) (exp(m / 1127.01048) - 1) * 700;
% the lab's default corner vowels (calc_pertField.m:31-34; Hillenbrand men), passed explicitly
fm = struct('iy', [342 2322], 'uw', [378 997], 'ae', [588 1952], 'aa', [768 1333]);
pf = calc_pertField('in', fm, 1, 0);          % bMel = 1, no plot
pf.nLPC = 17;                                  % stands for the per-participant nlpc (male default)
cen = pf.fCen;                                 % centre in mel
printf('calc_pertField: F1Min..F1Max %.1f..%.1f mel, F2Min..F2Max %.1f..%.1f, centre (%.1f, %.1f) mel = (%.0f, %.0f) Hz\n', ...
       pf.F1Min, pf.F1Max, pf.F2Min, pf.F2Max, cen(1), cen(2), mel2hz_(cen(1)), mel2hz_(cen(2)));
% --- expt.audapterParams as each expt function assembles it
hzgrid = @(a, b) floor(a:(b-a)/(fieldDim-1):b);
g.F1Min = 200; g.F1Max = 1500; g.F2Min = 500; g.F2Max = 3500;
A.sent = g; A.sent.pertF1 = hzgrid(200, 1500); A.sent.pertF2 = hzgrid(500, 3500);
A.sent.pertAmp2D = zeros(fieldDim); A.sent.pertPhi2D = zeros(fieldDim); A.sent.bShift2D = 1;
A.cent = g; A.cent.pertf1 = hzgrid(200, 1500); A.cent.pertf2 = hzgrid(500, 3500);
A.cent.pertAmp2D = zeros(fieldDim); A.cent.pertPhi2D = zeros(fieldDim); A.cent.bShift2D = 1;
A.gen = g; A.gen.pertf1 = hzgrid(200, 1500); A.gen.pertf2 = hzgrid(500, 3500);
A.gen.pertAmp = zeros(1, fieldDim); A.gen.pertPhi = zeros(1, fieldDim);
names = {'sent', 'cent', 'gen'}; labels = {'vsaSentence', 'vsaCentralize', 'vsaGeneralize'};
for k = 1:3, A.(names{k}) = add2struct(A.(names{k}), pf); end
% --- stimuli: male vowels (F0 120) at the corner means and two untrained vowels (Hillenbrand men)
V = {'iy', [342 2322 3000 3657]; 'ae', [588 1952 2601 3500]; 'aa', [768 1333 2522 3500]; 'uw', [378 997 2343 3500]; ...
     'ih', [427 2034 2684 3500]; 'eh', [580 1799 2605 3500]};
BW = [60 90 150 200];
fs = 48000; hz2mel = @(f) 1127.01048 * log(1 + f / 700);
for k = 1:3
  ap = A.(names{k});
  p = getAudapterDefaultParams('male'); p = add2struct(p, ap);
  p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1;
  if k == 1, p.bShift2D = 1; end
  w = get_noiseSource(p); Audapter('ost', '', 0); Audapter('pcf', '', 0);
  Audapter('setParam', 'datapb', w, 1); p.fb = 3; p.fb3Gain = 0.02;
  AudapterIO('init', p);
  switch names{k}                                   % the runner's extra calls right after init
    case 'sent', Audapter(3, 'pertf1', p.pertF1); Audapter(3, 'pertf2', p.pertF2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'cent', Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'gen',  Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp', p.pertAmp); Audapter(3, 'pertPhi', p.pertPhi);
  end
  printf('\n=== %s (grid sent after init: F1 %g..%g, F2 %g..%g; bShift2D=%d)\n', labels{k}, ...
         Audapter('getParam', 'pertf1')(1), Audapter('getParam', 'pertf1')(end), Audapter('getParam', 'pertf2')(1), Audapter('getParam', 'pertf2')(end), p.bShift2D);
  for s = [0 0.5]
    switch names{k}                                 % per-trial scaling as in the runner
      case 'gen', p.pertAmp = s * ap.pertAmp; Audapter('setParam', 'pertAmp', p.pertAmp);
      otherwise,  p.pertAmp2D = s * ap.pertAmp2D; Audapter('setParam', 'pertAmp2D', p.pertAmp2D);
    end
    for v = 1:size(V, 1)
      x = synth_vowel(fs, 0.45, 120, V{v,2}, BW, 'onset', 0.2, 'offset', 0.2, 'amp', 0.3);
      d = run_trial(p, x, 'init', false);
      ix = find(d.fmts(:,1) > 0 & d.sfmts(:,1) > 0); ix = ix(round(end*0.3):round(end*0.7));
      P = [median(hz2mel(d.fmts(ix,1))) median(hz2mel(d.fmts(ix,2)))];
      H = [median(hz2mel(d.sfmts(ix,1))) median(hz2mel(d.sfmts(ix,2)))];
      want = s * (cen - P); got = H - P;
      frac = dot(got, cen - P) / sum((cen - P).^2);          % projection onto produced->centre, 1 = collapse to centre
      perp = abs(det([got; (cen - P) / norm(cen - P)]));     % component perpendicular to the intended direction
      printf('scale %.1f  %s: produced F1/F2 %4.0f/%4.0f Hz | heard shift %+6.1f/%+6.1f mel (intended %+6.1f/%+6.1f) | toward centre %.2f (intended %.2f), off-axis %5.1f mel\n', ...
             s, V{v,1}, median(d.fmts(ix,1)), median(d.fmts(ix,2)), got(1), got(2), want(1), want(2), frac, s, perp);
    end
  end
end
% --- vsaGeneralize fb 4 gain: the runner sets p.fb4Gain = 0.98; AudapterIO only forwards fb4GainDB
p = getAudapterDefaultParams('male'); p.fb = 4; p.fb4Gain = 0.98; w = get_noiseSource(p); Audapter('setParam', 'datapb', w, 1);
x = synth_vowel(fs, 0.45, 120, V{3,2}, BW, 'onset', 0.2, 'offset', 0.2, 'amp', 0.3);
AudapterIO('init', p); Audapter('setParam', 'datapb', w, 1); d1 = run_trial(p, x, 'init', false);
q = p; q.fb4GainDB = 20*log10(0.98); AudapterIO('init', q); Audapter('setParam', 'datapb', w, 1); d2 = run_trial(q, x, 'init', false);
printf('\nfb 4 (vsaGeneralize generalization phases): p.fb4Gain=0.98 as set -> output RMS %.4f; with fb4GainDB=20log10(0.98) -> %.4f; difference %+.1f dB\n', ...
       rms(d1.signalOut), rms(d2.signalOut), 20*log10(rms(d1.signalOut) / rms(d2.signalOut)));
