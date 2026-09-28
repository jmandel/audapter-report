function lr_play_event(src, y, fs, vol)
% Something would be played to the participant outside Audapter (sound, audioplayer, PsychPortAudio):
% log level and peak, flag clipping (|y*vol| > 1), and keep the waveform (plays/NNN.wav, up to plan.maxPlayWavs).
global LR
y = double(y); if size(y, 1) < size(y, 2) && size(y, 1) <= 8, y = y'; end
s = y * vol; pk = max([0; abs(s(:))]); r = sqrt(mean(s(:).^2));
nclip = sum(abs(s(:)) > 1);
LR.nplay = LR.nplay + 1;
ev = struct('op', 'play', 'src', src, 'n', LR.nplay, 'fs', fs, 'dur', size(y, 1) / fs, 'vol', vol, 'peak', pk, 'rms_dBFS', 20*log10(max(r, 1e-12)), 'nclip', nclip);
lr_log_op(ev);
if nclip > 0, lr_note(sprintf('%s: %d samples above full scale (peak %.2f = %+.1f dBFS)', src, nclip, pk, 20*log10(pk))); end
if LR.nplay <= LR.plan.maxPlayWavs
  w = s; w(w > 1) = 1; w(w < -1) = -1;
  try, audiowrite(fullfile(LR.outdir, 'plays', sprintf('%04d_%s.wav', LR.nplay, regexprep(src, '\W', '_'))), w, round(fs)); catch, end
end
if LR.playlog > 0, fprintf(LR.playlog, '%d\t%.4f\t%d\t%s\t%g\t%.4f\t%.4f\t%.2f\t%.4f\t%d\n', LR.nplay, LR.vclock, LR.ntrial, src, fs, ev.dur, vol, ev.rms_dBFS, pk, nclip); end
end
