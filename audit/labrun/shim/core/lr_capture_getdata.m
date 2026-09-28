function lr_capture_getdata(sig, dat)
% The lab script fetched the recording; note its size (the full copy is taken at stop by lr_device_stop).
global LR
LR.counts.getData = LR.counts.getData + 1;
end
