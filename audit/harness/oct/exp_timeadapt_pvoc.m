% EXP: phase-vocoder level offset (PT-5 / CORPUS-6) at the settings of free-speech run_measureDuration_audapter.m
% (timeAdapt baseline: sRate 48000, downFact 2 -> sr 24000, frameLen 48, bPitchShift = 1 "needed if time warping
% is used", fb 3 + babble at fb3Gain 0.02; lines 101-131). The lab's warp OST/PCF files are not public, so this
% uses a PCF with no warp and 0 st in every state, i.e. the level the participant hears whenever the warp is idle.
% Compares output level with bPitchShift = 1 vs 0 on real speech (CMU ARCTIC), noise off to isolate the speech path.
% Usage: ./run-oct.sh exp_timeadapt_pvoc.m
M = corpus_index(); ids = {'arctic_bdl_a0005', 'arctic_clb_a0005', 'arctic_awb_a0030', 'arctic_clb_a0030'};
fid = fopen('cfg/exp_ta0.pcf', 'w'); fprintf(fid, '0\n\n5\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n4, 0.0, 0, 0, 0\n'); fclose(fid);
fid = fopen('cfg/exp_ta0.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
for i = 1:numel(ids)
  m = M(strcmp({M.id}, ids{i})); [x, fs] = corpus_wav(m); if m.sex == 'M', g = 'male'; else, g = 'female'; end
  L = zeros(1, 2);
  for b = [0 1]
    p = getAudapterDefaultParams(g); p.downFact = 2; p.sr = 24000; p.frameLen = 48; p.bPitchShift = b; p.fb = 1;
    AudapterIO('init', p); Audapter('ost', 'cfg/exp_ta0.ost', 0); Audapter('pcf', 'cfg/exp_ta0.pcf', 0);
    d = run_trial(p, x, 'init', false);
    y = d.signalOut; s = d.signalIn; D = round(0.1 * p.sr);        % skip the first 100 ms
    L(b+1) = 20*log10(rms(y(D:end)) / rms(s(D:end)));
  end
  printf('%s (%s): output/input level bPitchShift=0 %+.2f dB, bPitchShift=1 %+.2f dB -> pvoc adds %+.2f dB\n', ids{i}, g, L(1), L(2), L(2) - L(1));
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
