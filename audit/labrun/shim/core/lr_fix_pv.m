function a = lr_fix_pv(a)
% MATLAB-accepted property values Octave rejects: 'String', [] (or a number) -> char.
for j = 1:numel(a) - 1
  if ischar(a{j}) && strcmpi(a{j}, 'String') && (isnumeric(a{j+1}) || islogical(a{j+1}))
    if isempty(a{j+1}), a{j+1} = ''; else, a{j+1} = num2str(a{j+1}); end
  end
end
end
