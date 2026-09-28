function c = splitlines(s)
c = regexp(s, '\r\n|\n|\r', 'split')';
end
