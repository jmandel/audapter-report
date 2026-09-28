function recordblocking(id, secs)
% labrun: record secs of the virtual microphone; the virtual clock advances by secs.
record(id, secs); lr_advance(secs); lr_recorder_stop(id);
end
