% WASM equivalence export: run one scenario through the native Octave MEX via a recording shim
% (wasm/octshim/Audapter.m -> AudapterReal.mex) and write the exact command stream, input frames,
% device-rate output frames and Audapter(4) signal/data matrices for replay in the WASM build.
% SCEN=defaults_female|defaults_male only records the AudapterIO('init') stream of getAudapterDefaultParams(sex).
% Env: SCEN (scenario name), OUTDIR (default /h/oct/out/wasm), SHIM (dir with Audapter.m + AudapterReal.mex).
% One scenario per Octave process: handleBuffer has function-static locals that survive across trials.
global WASMLOG
scen = getenv('SCEN'); if isempty(scen), scen = 'passthru'; end
outdir = getenv('OUTDIR'); if isempty(outdir), outdir = '/h/oct/out/wasm'; end
shim = getenv('SHIM'); if isempty(shim), shim = '/a/audit/wasm/octshim'; end
addpath(shim);  % prepend: shadows BUILD/Audapter.mex
w = which('Audapter'); if isempty(strfind(w, 'octshim')), error('shim not active: %s', w); end

p0 = defparams('female'); fs = p0.sr * p0.downFact;
vowelA = synth_vowel(fs, 1.0, 120, [850 1220 2810 3800], [80 100 150 200]);
g = linspace(0, 5000, 257);
fld = p0; fld.bShift = 1; fld.bRatioShift = 1; fld.bMelShift = 0;
fld.F1Min = 0; fld.F1Max = 5000; fld.F2Min = 0; fld.F2Max = 5000; fld.LBk = 0; fld.LBb = 0;
fld.pertF2 = g; fld.pertF1 = g;
ost = ''; pcf = ''; x = vowelA;
switch scen
  case {'defaults_female', 'defaults_male'}
    p = [];
  case 'passthru'      % default blab formant tracking, no perturbation
    p = p0;
  case 'fmtshift'      % 1-D field, F1 +20 %
    p = fld; p.pertAmp = 0.2*ones(1,257); p.pertPhi = zeros(1,257);
  case 'fmtshift2d'    % 2-D field, F2 +20 % (257x257 parameter)
    p = fld; p.bShift2D = 1; p.pertAmp2D = 0.2*ones(257); p.pertPhi2D = (pi/2)*ones(257);
  case 'pcf'           % OST + PCF file driven F1 +20 %
    p = fld; p.pertAmp = zeros(1,257); p.pertPhi = zeros(1,257);
    ost = '/h/oct/cfg/one.ost'; pcf = '/h/oct/cfg/f1up.pcf';
  case 'pvoc'          % phase-vocoder pitch shift +2 semitones
    p = p0; p.bPitchShift = 1; p.pitchShiftRatio = 2^(2/12);
  case 'tdshift'       % time-domain pitch shifter with schedule (frameLen 64, male)
    p = getAudapterDefaultParams('male');
    p.bTimeDomainShift = 1; p.pitchLowerBoundHz = 80; p.pitchUpperBoundHz = 200; p.frameLen = 64; p.nDelay = 7;
    p.bCepsLift = 1; p.timeDomainPitchShiftAlgorithm = 'pp_none'; p.rmsThresh = 0.011;
    p.timeDomainPitchShiftSchedule = [0, 1.0; 0.3, 1.0; 0.31, 1.0595];
    x = synth_vowel(fs, 1.0, 110, [700 1100 2500 3500], [80 100 150 200]);
  otherwise
    error('unknown SCEN %s', scen);
end
if strncmp(scen, 'defaults_', 9)   % only record the AudapterIO('init') stream for blab defaults (no audio)
  WASMLOG = struct('cmds', {{}}, 'in', {{}}, 'out', {{}}, 'sig', [], 'data', []);
  sex = scen(10:end); p = getAudapterDefaultParams(sex);
  AudapterIO('init', p);
  od = fullfile(outdir, scen); if ~exist(od, 'dir'), mkdir(od); end
  meta = struct('scen', scen, 'sex', sex, 'fs', p.sr * p.downFact, 'sr', p.sr, 'nTracks', p.nTracks, 'nLPC', p.nLPC);
  meta.cmds = WASMLOG.cmds;
  fid = fopen(fullfile(od, 'defaults.json'), 'w'); fputs(fid, jsonencode(meta)); fclose(fid);
  printf('wasm_export %s: %d setParam commands -> %s\n', scen, numel(meta.cmds), od);
  return;
end
WASMLOG = struct('cmds', {{}}, 'in', {{}}, 'out', {{}}, 'sig', [], 'data', []);
Audapter('ost', '', 0); Audapter('pcf', '', 0);
WASMLOG.cmds = {};  % drop the nullify calls above; replay starts from a fresh object
d = run_trial(p, x, 'ost', ost, 'pcf', pcf);

od = fullfile(outdir, scen); if ~exist(od, 'dir'), mkdir(od); end
fid = fopen(fullfile(od, 'in.f64'), 'w'); fwrite(fid, vertcat(WASMLOG.in{:}), 'double'); fclose(fid);
fid = fopen(fullfile(od, 'out.f64'), 'w'); fwrite(fid, vertcat(WASMLOG.out{:}), 'double'); fclose(fid);
fid = fopen(fullfile(od, 'sig.f64'), 'w'); fwrite(fid, WASMLOG.sig(:), 'double'); fclose(fid);
fid = fopen(fullfile(od, 'data.f64'), 'w'); fwrite(fid, WASMLOG.data(:), 'double'); fclose(fid);
meta = struct('scen', scen, 'frameSize', numel(WASMLOG.in{1}), 'nFrames', numel(WASMLOG.in), ...
  'sigRows', size(WASMLOG.sig, 1), 'dataRows', size(WASMLOG.data, 1), 'dataCols', size(WASMLOG.data, 2), ...
  'fs', fs, 'sr', p.sr, 'nTracks', p.nTracks, 'nLPC', p.nLPC);
meta.cmds = WASMLOG.cmds;
fid = fopen(fullfile(od, 'meta.json'), 'w'); fputs(fid, jsonencode(meta)); fclose(fid);
printf('wasm_export %s: %d frames of %d, %d cmds, data %dx%d -> %s\n', scen, meta.nFrames, meta.frameSize, ...
  numel(meta.cmds), meta.dataRows, meta.dataCols, od);
