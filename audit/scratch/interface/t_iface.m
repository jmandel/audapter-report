% Interface-area confirmations. Run: harness/run-oct.sh /a/audit/scratch/interface/t_iface.m
p = getAudapterDefaultParams('female');
p.rmsThresh = 0.005;
fsd = p.sr * p.downFact; N = p.frameLen * p.downFact;

%% T1: datapb shorter than maxPBSize -> silent gap in fb=2 noise
p1 = p; p1.fb = 2; p1.fb2Gain = 1; p1.dScale = 1;
AudapterIO('init', p1);
Audapter('setParam', 'datapb', 0.1 * ones(240000, 1), 0);   % 5 s @ 48k
Audapter('reset');
x = zeros(12 * fsd, 1);
for k = 1:numel(x)/N, Audapter('runFrame', x((k-1)*N+1:k*N)); end
d = AudapterIO('getData');
so = d.signalOut; fs = p.sr;
printf('T1 maxPBLen=%d  mean|out| 0-4.9s=%.4f  5.1-9.9s=%.4f  10.1-12s=%.4f\n', Audapter('getMaxPBLen'), ...
  mean(abs(so(1:round(4.9*fs)))), mean(abs(so(round(5.1*fs):round(9.9*fs)))), mean(abs(so(round(10.1*fs):end))));

%% T2: rms_slope NaN in first frames
p2 = p; AudapterIO('init', p2); Audapter('reset');
t = (0:fsd-1)'/fsd; x = 0.1*sin(2*pi*200*t);
for k = 1:floor(numel(x)/N), Audapter('runFrame', x((k-1)*N+1:k*N)); end
d = AudapterIO('getData');
printf('T2 rms_slope NaN rows: %d (first %d rows: %s)\n', sum(isnan(d.rms_slope)), 16, mat2str(isnan(d.rms_slope(1:16))'));

%% T3: fb=5, dScale applied twice to speech-modulated component
for ds = [1 2]
  p3 = p; p3.fb = 5; p3.dScale = ds; p3.fb5GainDB_speech = 0; p3.fb5Gain_playback = 1;
  AudapterIO('init', p3);
  Audapter('setParam', 'datapb', 0.1 * ones(480000, 1), 0);
  Audapter('reset');
  t = (0:fsd-1)'/fsd; x = 0.1*sin(2*pi*200*t);
  outs = zeros(size(x));
  for k = 1:floor(numel(x)/N)
    fr = x((k-1)*N+1:k*N) + 0;   % force a private copy
    Audapter('runFrame', fr);
  end
  d = AudapterIO('getData');
  so = d.signalOut(end-1000:end);
  % recorded = 0.1*(g_p + rms_fb*g_s*dScale)  => speech part = mean/0.1 - 1
  printf('T3 dScale=%g  recorded signalOut mean=%.5f  -> speech-mod component per unit playback=%.5f\n', ds, mean(so), mean(so)/0.1 - 1);
end

%% T4: runFrame overwrites its input array in place
p4 = p; AudapterIO('init', p4); Audapter('reset');
fr = 0.1*sin(2*pi*200*(0:N-1)'/fsd); fr0 = fr + 0; alias = fr;
Audapter('runFrame', fr);
printf('T4 input modified by runFrame: %d ; alias modified: %d\n', ~isequal(fr, fr0), ~isequal(alias, fr0));

%% T5: tsgNTones range check tests the OLD value
Audapter('setParam', 'tsgntones', 100, 0);
printf('T5 tsgntones after setting 100: %d (maxNTones=64)\n', Audapter('getParam', 'tsgntones'));
try, Audapter('setParam', 'tsgntones', 0, 0); printf('T5 reset to 0 ok\n'); catch e, printf('T5 setting 0 afterwards errors: %s\n', e.message); end
