function c = lr_keychar(name)
switch lower(name)
  case 'space', c = ' ';
  case {'return', 'enter'}, c = char(13);
  case {'escape', 'esc'}, c = char(27);
  otherwise, c = name(1);
end
end
