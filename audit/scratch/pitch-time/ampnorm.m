pkg load signal; warning('off','all');
addpath(BUILD); addpath('/a/blab/audapter_matlab/mcode');
p = getAudapterDefaultParams('female'); p.bPitchShift=1; p.bBypassFmt=1; p.pitchShiftRatio=2^(1/12);
Audapter('ost','',0); Audapter('pcf','',0); AudapterIO('init', p);
try, Audapter(3,'bpvocampnorm',1,1); disp('bpvocampnorm accepted'); catch e, disp(['bpvocampnorm: ' e.message]); end
try, Audapter(3,'bpvocmpnorm',1,1); disp('bpvocmpnorm accepted'); catch e, disp(['bpvocmpnorm: ' e.message]); end
try, v = Audapter('getParam','bpvocmpnorm'); disp(v); catch e, disp(['get bpvocmpnorm: ' e.message]); end
