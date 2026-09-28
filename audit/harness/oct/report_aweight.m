function y = report_aweight(x, fs)
% A-weighting filter (IEC 61672 analog prototype, bilinear transform), identical to report/loudness.py a_weight():
% used for the report's A-weighted level differences (dBA = 20 log10 of the ratio of A-weighted RMS).
f1 = 20.598997; f2 = 107.65265; f3 = 737.86223; f4 = 12194.217;
z = zeros(4, 1); p = -2*pi*[f4; f4; f1; f1; f3; f2]; k = (2*pi*f4)^2 * 10^(1.9997/20);
[zd, pd, kd] = bilinear(z, p, k, 1/fs);
y = sosfilt(zp2sos(zd, pd, kd), double(x(:)));
end
