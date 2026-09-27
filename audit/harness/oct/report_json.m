function report_json(fn, s)
% Write struct s as JSON (numbers rounded to 5 significant digits to keep files small).
fid = fopen(fn, 'w'); fprintf(fid, '%s\n', jsonencode(s)); fclose(fid);
end
