function p = defparams(sex)
% Blab defaults with detection on and a low rms threshold suitable for synthetic signals.
if nargin < 1, sex = 'female'; end
p = getAudapterDefaultParams(sex);
p.rmsThresh = 0.005; p.bDetect = 1; p.bTrack = 1;
end
