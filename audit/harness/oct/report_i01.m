% Report asset export for I-01 (playback loops at maxPBSize, not at the datapb length).
% Loads masking noise the way runExperiment.m:318-330 does (mtbabble48k.wav, zero-mean, unit RMS,
% truncated to Audapter('getMaxPBLen')), but uses only its first 5 s, as a lab's own shorter noise
% file would be. fb = 3 (voice + noise), 12 s trial of short vowels. Also runs fb = 2 (noise only) to
% mark exactly where noise is present, and fb = 2 with the full bundled babble (16 ms dropout at ~9.98 s).
% Usage: ./run-oct.sh report_i01.m
%        VARIANT=upstream ./run-oct.sh report_i01.m build-upstream upstream/audapter_matlab
% Output: out/report/i-01/<build>/{*.wav,data.json}
UP = strcmp(getenv('VARIANT'), 'upstream');
pf = '/h/oct/out/report/i-01-params.mat';
if UP, load(pf); else, p = defparams('female'); save('-binary', pf, 'p'); end
fs = p.sr * p.downFact; N = p.frameLen * p.downFact; TR = 12.0;
[mb, fsm] = audioread('/a/blab/audapter_matlab/mcode/mtbabble48k.wav'); mb = mb - mean(mb); mb = mb / rms(mb);
maxPB = Audapter('getMaxPBLen');
noise5 = mb(1:5*fsm); if numel(noise5) > maxPB, noise5 = noise5(1:maxPB); end   % runExperiment's truncation rule
nfull = mb; if numel(nfull) > maxPB, nfull = nfull(1:maxPB); end
% input: 0.5 s vowels every 1.0 s
randn('seed', 11);
x = 1e-4 * randn(round(TR*fs), 1); VV = {[850 1220 2810 3800], [300 2300 3000 3800], [580 1800 2600 3500]};
for k = 0:10
  v = synth_vowel(fs, 0.5, 190 + 10*mod(k,3), VV{mod(k,3)+1}, [80 100 150 200], 'onset', 0, 'offset', 0, 'amp', 0.25);
  i0 = round((0.3 + k) * fs); x(i0 + (1:numel(v))) = x(i0 + (1:numel(v))) + v;
end
function d = pbtrial(p, x, fb, gain, pb, N)
  q = p; q.fb = fb; q.fb2Gain = gain; q.fb3Gain = gain; q.dScale = 1;
  AudapterIO('init', q); Audapter('setParam', 'datapb', pb, 0); Audapter('reset');
  for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
  d = AudapterIO('getData');
end
d3 = pbtrial(p, x, 3, 0.05, noise5, N);                        % voice + 5 s noise
d2 = pbtrial(p, zeros(size(x)), 2, 0.05, noise5, N);           % noise only: where is noise present?
db = pbtrial(p, zeros(round(11*fs),1), 2, 0.05, nfull, N);     % bundled babble, full length
% pbCounter is not reset by Audapter('reset'): two consecutive 4 s trials, noise loaded once
dt1 = pbtrial(p, zeros(round(4*fs),1), 2, 0.05, noise5, N);
Audapter('reset'); for k = 1:floor(4*fs/N), fr = zeros(N,1); Audapter('runFrame', fr); end
dt2 = AudapterIO('getData');
z2 = find(abs(dt2.signalOut) < 1e-9, 1); if isempty(z2), r_t2 = NaN; else, r_t2 = (z2-1)/p.sr; end
printf('second trial (after reset): noise stops at %.3f s into the trial\n', r_t2);
% 20 ms envelopes
W = round(0.02 * p.sr); env = @(s) 20*log10(max(sqrt(mean(reshape(s(1:floor(numel(s)/W)*W), W, []).^2)), 1e-6));
r = struct(); r.maxPBLen = maxPB; r.noise_len_samples = numel(noise5); r.fs_device = fs;
r.trial2_gap_start_s = r_t2; r.env_dt = 0.02; r.env_in = round(env(d3.signalIn)*10)/10; r.env_out = round(env(d3.signalOut)*10)/10;
e2 = env(d2.signalOut); r.noise_on = double(e2 > -80);
on = r.noise_on; r.gaps = [];
dn = diff([1 on 1]); gs = find(dn == -1); ge = find(dn == 1);
for i = 1:numel(gs), r.gaps(end+1,:) = [(gs(i)-1), (ge(i)-1)] * r.env_dt; end
% bundled babble: exact zero run in the noise-only output near 9.98 s
z = abs(db.signalOut) < 1e-9; z(1:round(9*p.sr)) = false; iz = find(z);
if isempty(iz), r.babble_dropout = []; else
  r.babble_dropout = [iz(1), iz(end)] / p.sr; end
seg = db.signalOut(round(9.90*p.sr):round(10.06*p.sr));
r.babble_zoom = round(seg(1:4:end)' * 1e4) / 1e4; r.babble_zoom_t0 = 9.90; r.babble_zoom_dt = 4 / p.sr;
printf('maxPBLen %d; 5 s noise gaps (s): %s; bundled babble dropout: %s s\n', maxPB, mat2str(r.gaps, 3), mat2str(r.babble_dropout, 4));
od = report_outdir('i-01');
c = struct('name', {'input_vowels', 'output_fb3_voice_plus_noise', 'output_fb2_bundled_babble_zoom'}, ...
  'x', {d3.signalIn, d3.signalOut, db.signalOut(round(8.5*p.sr):round(11*p.sr))}, ...
  'label', {'Input: vowels, one every second', 'What the participant hears: voice + 5 s masking noise (fb 3)', 'Bundled babble, 8.5-11.0 s, noise only (fb 2)'}, ...
  'warn', {'', 'The noise stops abruptly at 5 s and resumes at 10 s.', 'A 16 ms dropout near 9.98 s; listen closely.'});
r.audio = report_wavgroup(od, p.sr, c);
report_json(fullfile(od, 'data.json'), r);
