% Report asset export for I-02 (fb 5 multiplies the speech-modulated component by dScale twice).
% fb = 5 with the bundled babble (mtbabble48k.wav) as datapb, scaled to RMS 0.03, fb5Gain_playback = 1 and
% fb5GainDB_speech = +20 dB, so both components are audible. Input: three vowels at different levels, 4 s.
% Same input and parameters at three dScale values:
%   1     : reference. With dScale = 1 applying it once or twice is the same, so this is the intended mix.
%   A     : getAudapterDefaultParams with the bundled calibration (closedLoopGain 15 dB)
%   B     : the same with closedLoopGain 21 dB (6 dB louder feedback), dScale set directly, as the default script computes it
% Each condition is run twice: with both components, and with fb5Gain_playback = 0 (speech-modulated component alone).
% Playback component = total - speech-only (the output path is linear). What the participant hears is the
% device-rate output, which runFrame writes back into its input frame (finding I-04); that is how it is read here.
% Usage: ./run-oct.sh report_i02.m        Output: out/report/i-02/blab/{*.wav,data.json}
p = defparams('female'); fs = p.sr * p.downFact; N = p.frameLen * p.downFact; TR = 4.0;
od = report_outdir('i-02');
clg0 = calcClosedLoopGain();                      % bundled micRMS_100dBA.mat
CLG = [15 21]; DS = [1, 10.^((CLG - clg0) / 20)];
% babble, as runExperiment.m loads it (zero mean, unit RMS), first 4.5 s, scaled to RMS 0.03; quantised to 16 bit
% through the dev_*.wav round trip so the in-browser panel gets exactly the same samples.
[mb, fsm] = audioread('/a/blab/audapter_matlab/mcode/mtbabble48k.wav'); mb = mb - mean(mb); mb = mb / rms(mb);
pb = 0.03 * mb(1:round(4.5*fsm));
audiowrite(fullfile(od, 'dev_babble_48k.wav'), pb, fs, 'BitsPerSample', 16); pb = audioread(fullfile(od, 'dev_babble_48k.wav'));
randn('seed', 21);
x = 1e-4 * randn(round(TR*fs), 1); AMP = [0.25 0.12 0.35]; VV = {[850 1220 2810 3800], [580 1800 2600 3500], [300 2300 3000 3800]};
for k = 0:2
  v = synth_vowel(fs, 0.8, 190 + 10*k, VV{k+1}, [80 100 150 200], 'onset', 0.03, 'offset', 0.03, 'amp', AMP(k+1));
  i0 = round((0.3 + 1.2*k) * fs); x(i0 + (1:numel(v))) = x(i0 + (1:numel(v))) + v;
end
audiowrite(fullfile(od, 'dev_input_48k.wav'), x, fs, 'BitsPerSample', 16); x = audioread(fullfile(od, 'dev_input_48k.wav'));
function [y, d] = fb5run(p, x, pb, ds, gp, N)
  q = p; q.fb = 5; q.dScale = ds; q.fb5GainDB_speech = 20; q.fb5Gain_playback = gp;
  AudapterIO('init', q); Audapter('setParam', 'datapb', pb, 0); Audapter('reset');
  y = zeros(size(x));
  for k = 1:floor(numel(x)/N)
    fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); y((k-1)*N+1:k*N) = fr;   % fr now holds the device output
  end
  d = AudapterIO('getData');
end
W = round(0.02 * fs); nb = floor(numel(x) / W);
blk = @(s) sqrt(mean(reshape(s(1:nb*W), W, nb).^2));
bin = blk(x); act = 20*log10(bin) > -40;          % blocks where the speaker is voicing
r = struct(); r.env_dt = 0.02; r.env_in = round(20*log10(max(bin, 1e-6)) * 10) / 10;
r.clg_bundled_db = clg0; r.closedLoopGain_db = CLG; r.dScale = DS; r.fb5GainDB_speech = 20; r.fb5Gain_playback = 1; r.datapb_rms = 0.03;
tags = {'ref', 'A', 'B'}; Y = {};
for i = 1:3
  [yt, dt] = fb5run(p, x, pb, DS(i), 1, N);
  [ys, ds] = fb5run(p, x, pb, DS(i), 0, N);
  yp = yt - ys; Y{i} = yt;
  rs = blk(ys); rp = blk(yp);
  ratio = 20*log10(rs ./ rp); ratio(~act) = NaN;
  r.(['ratio_' tags{i}]) = round(ratio * 100) / 100;
  r.(['mix_db_' tags{i}]) = 20*log10(sqrt(sum(rs(act).^2) / sum(rp(act).^2)));       % speech-modulated re playback, voiced blocks
  r.(['speech_db_' tags{i}]) = 20*log10(sqrt(mean(rs(act).^2)));                        % levels at the device output, dBFS
  r.(['play_db_' tags{i}]) = 20*log10(sqrt(mean(rp(act).^2)));
  r.(['env_out_' tags{i}]) = round(20*log10(max(blk(yt), 1e-6)) * 10) / 10;
  printf('dScale %.4f: heard speech-mod re playback %+.2f dB (speech %.1f dBFS, playback %.1f dBFS)\n', DS(i), ...
    r.(['mix_db_' tags{i}]), r.(['speech_db_' tags{i}]), r.(['play_db_' tags{i}]));
end
r.shift_A_db = r.mix_db_A - r.mix_db_ref; r.shift_B_db = r.mix_db_B - r.mix_db_ref; r.shift_AB_db = r.mix_db_B - r.mix_db_A;
r.play_step_db = r.play_db_B - r.play_db_A; r.speech_step_db = r.speech_db_B - r.speech_db_A; r.clg_step_db = CLG(2) - CLG(1);
printf('closedLoopGain %d -> %d dB: playback %+.2f dB, speech-modulated %+.2f dB; mix shift %+.2f dB\n', CLG, r.play_step_db, r.speech_step_db, r.shift_AB_db);
% audio: 16 kHz (decimated with an anti-alias filter) to keep the files small
dec = @(y) resample(y, 1, 3);
c = struct('name', {'input_vowels', 'output_fb5_clg15', 'output_fb5_clg21'}, ...
  'x', {dec(x), dec(Y{2}), dec(Y{3})}, ...
  'label', {'Input: three vowels at different levels', ...
            sprintf('Heard, fb 5, closedLoopGain 15 dB (dScale %.3f)', DS(2)), sprintf('Heard, fb 5, closedLoopGain 21 dB (dScale %.3f)', DS(3))}, ...
  'warn', {'', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
r.settings = report_settings(p, 'female', 'switching', 'one trial per setting (fb 5 with dScale 1 and 2)', 'input', 'synthetic vowels');
report_json(fullfile(od, 'data.json'), r);
