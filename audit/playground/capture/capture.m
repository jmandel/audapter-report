% Run one report export script under the capture shim and write its recorded sections to /c/out/<case>/:
%   log.json (sections of ops), arrays/<k>.f64 and inputs/<k>.f64 (little-endian doubles).
% Driven by tools/capture-cases.sh with CASE_SCRIPT and CASE_ID in the environment.
global CASELOG CASESEC
CASELOG = struct('names', {{}}, 'ops', {{}}, 'arrays', {{}}, 'inputs', {{}}, 'cur', {{}}); CASESEC = '';
scr = getenv('CASE_SCRIPT'); cid = getenv('CASE_ID');
cd('/h/oct'); run(scr);
CASESEC = '';
od = fullfile('/c/out', cid); if ~exist(od, 'dir'), mkdir(od); end
mkdir(fullfile(od, 'arrays')); mkdir(fullfile(od, 'inputs'));
for k = 1:numel(CASELOG.arrays), fid = fopen(fullfile(od, 'arrays', sprintf('%d.f64', k)), 'w', 'ieee-le'); fwrite(fid, CASELOG.arrays{k}, 'double'); fclose(fid); end
for k = 1:numel(CASELOG.inputs), fid = fopen(fullfile(od, 'inputs', sprintf('%d.f64', k)), 'w', 'ieee-le'); fwrite(fid, CASELOG.inputs{k}, 'double'); fclose(fid); end
S = struct('name', CASELOG.names, 'ops', CASELOG.ops);
if numel(CASELOG.names) == 0, S = struct('name', {}, 'ops', {}); end
out = struct('script', scr, 'id', cid, 'sections', {num2cell(S)}, 'n_arrays', numel(CASELOG.arrays), 'n_inputs', numel(CASELOG.inputs));
fid = fopen(fullfile(od, 'log.json'), 'w'); fprintf(fid, '%s', jsonencode(out)); fclose(fid);
printf('captured %s: %d sections, %d arrays, %d inputs\n', cid, numel(CASELOG.names), numel(CASELOG.arrays), numel(CASELOG.inputs));
