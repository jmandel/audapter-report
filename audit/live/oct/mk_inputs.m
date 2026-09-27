% Generate stimuli (48 kHz WAV) and AudapterIO('init') traces for the live harness.
% Run via ../run.sh (inside the audapter-live image with the blab mcode and harness/oct on the path).
global LIVE_TRACE_FID
out = '/live/work/in'; if ~exist(out, 'dir'), mkdir(out); end
p0 = defparams('female'); fs = p0.sr * p0.downFact;
% --- stimuli -----------------------------------------------------------------------------
% A: /a/-like vowel, 1.0 s, F0 120 Hz, 0.3 s silence before and 0.4 s after (1.7 s total)
xa = synth_vowel(fs, 1.0, 120, [850 1220 2810 3800], [80 100 150 200], 'onset', 0.3, 'offset', 0.4);
audiowrite(fullfile(out, 'vowel_a.wav'), xa, fs, 'BitsPerSample', 32);
% B: /a-i-a/ glide 1.2 s, F0 falling 140->110 Hz
n = round(1.2 * fs); t = (0:n-1)'/n; w = 0.5 - 0.5*cos(2*pi*t);
F = [850 + (300-850)*w, 1220 + (2300-1220)*w, 2810*ones(n,1), 3800*ones(n,1)];
xb = synth_vowel(fs, 1.2, linspace(140, 110, n)', F, [80 100 150 200], 'onset', 0.3, 'offset', 0.4);
audiowrite(fullfile(out, 'glide_aia.wav'), xb, fs, 'BitsPerSample', 32);
% C: 5 repetitions of A with 0.3 s gaps (for always-on / multi-trial runs)
xc = []; for k = 1:5, xc = [xc; xa; zeros(round(0.3*fs), 1)]; end
audiowrite(fullfile(out, 'vowel_a_x5.wav'), xc, fs, 'BitsPerSample', 32);
% D: sustained vowel with no silence (2.0 s), used where the signal must be voiced at trial start/end
xd = synth_vowel(fs, 2.0, 120, [850 1220 2810 3800], [80 100 150 200], 'onset', 0, 'offset', 0, 'ramp', 0.005);
audiowrite(fullfile(out, 'vowel_cont.wav'), xd, fs, 'BitsPerSample', 32);
% --- init traces --------------------------------------------------------------------------
g = linspace(0, 5000, 257);
cfgs = {};
p = p0; cfgs(end+1,:) = {'base', p};
p = p0; p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000;
p.LBk = 0; p.LBb = 0; p.pertF1 = g; p.pertF2 = g; p.pertAmp = 0.2*ones(1,257); p.pertPhi = zeros(1,257);
cfgs(end+1,:) = {'f1up', p};
p = p0; p.bShift = 0; p.bPitchShift = 1; p.pitchShiftRatio = 2^(2/12); cfgs(end+1,:) = {'pvoc2st', p};
% time-domain pitch shift as in time_domain_shift_demo.m (frameLen 64, nDelay 7, cepstral lifter on)
p = p0; p.bTimeDomainShift = 1; p.pitchLowerBoundHz = 80; p.pitchUpperBoundHz = 200; p.frameLen = 64; p.nDelay = 7;
p.bCepsLift = 1; p.timeDomainPitchShiftAlgorithm = 'pp_none'; p.timeDomainPitchShiftSchedule = [0, 1.0; 0.2, 1.0; 0.4, 2^(1/12)];
p.frameShift = p.frameLen / p.nWin; p.bufLen = (2*p.nDelay-1)*p.frameLen; p.anaLen = p.frameShift+2*(p.nDelay-1)*p.frameLen;
cfgs(end+1,:) = {'td1st', p};
p = p0; p.trialLen = 1.6; p.rampLen = 0.05; cfgs(end+1,:) = {'ramp', p};
p.trialLen = 0; cfgs(end+1,:) = {'noramp', p};
for i = 1:size(cfgs, 1)
  fn = fullfile(out, ['trace_' cfgs{i,1} '.txt']);
  LIVE_TRACE_FID = fopen(fn, 'w');
  AudapterIO('init', cfgs{i,2});
  fclose(LIVE_TRACE_FID);
  printf('%s: %d setParam calls\n', fn, numel(strsplit(fileread(fn), "\n")) - 1);
end
% OST/PCF used by the live scenarios: vowel onset -> state 2 (hold 20 ms); PCF F1 +20% in state 2
fid = fopen(fullfile(out, 'onset.ost'), 'w');
fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 INTENSITY_RISE_HOLD 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fid = fopen(fullfile(out, 'f1up_s2.pcf'), 'w');
fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.2, 0\n'); fclose(fid);
fid = fopen(fullfile(out, 'pitch_s2.pcf'), 'w');
fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 2, 0, 0, 0\n'); fclose(fid);
