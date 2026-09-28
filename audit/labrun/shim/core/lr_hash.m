function h = lr_hash(v)
% Short content hash of a numeric array (for recognising repeated arrays in the log).
b = typecast(double(v(:))', 'uint8');
h = hash('md5', char(b));
h = h(1:10);
end
