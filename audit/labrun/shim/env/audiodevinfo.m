function r = audiodevinfo(varargin)
% labrun: one virtual input and one virtual output device.
d.Name = 'Focusrite USB ASIO (labrun virtual)'; d.DriverVersion = 'labrun'; d.ID = 0;
if nargin == 0, r.input = d; r.output = d; return; end
io = varargin{1};
if nargin == 1, r = 1; return; end            % number of devices
a = varargin{2};
if ischar(a), r = 0; elseif nargin >= 3, r = 0; else, r = d.Name; end
end
