function B = lr_voice_bank()
% The voice bank index (cached in LR.voiceBank): audit/labrun/voices/bank.tsv plus, when present, the private bank
% (audit/private/labrun/voices/bank.tsv). Columns used: tok key style talker gender source take file dur nucleus_rms f0
% lead v_on v_off status.
global LR
if isfield(LR, 'voiceBank') && ~isempty(LR.voiceBank), B = LR.voiceBank; return; end
dirs = {fullfile(getenv('LR_LIB'), 'voices'), fullfile(getenv('LR_SRC'), 'audit', 'private', 'labrun', 'voices')};
B = struct('tok', {{}}, 'key', {{}}, 'style', {{}}, 'talker', {{}}, 'gender', {{}}, 'source', {{}}, 'take', [], ...
  'path', {{}}, 'dur', [], 'nucleus_rms', [], 'f0', [], 'lead', [], 'v_on', [], 'v_off', [], 'rawOnset', [], 'refF1', [], 'refF2', [], 'refQC', {{}}, 'status', {{}});
for d = dirs
  f = fullfile(d{1}, 'bank.tsv'); if ~exist(f, 'file'), continue; end
  L = strsplit(fileread(f), "\n"); L = L(~cellfun(@isempty, L));
  H = strsplit(L{1}, "\t", "CollapseDelimiters", false); c = @(n) find(strcmp(H, n), 1);
  for i = 2:numel(L)
    r = strsplit(L{i}, "\t", "CollapseDelimiters", false);
    B.tok{end+1} = r{c('tok')}; B.key{end+1} = r{c('key')}; B.style{end+1} = r{c('style')};
    B.talker{end+1} = r{c('talker')}; B.gender{end+1} = r{c('gender')}; B.source{end+1} = r{c('source')};
    B.take(end+1) = str2double(r{c('take')}); B.path{end+1} = fullfile(d{1}, r{c('file')});
    B.dur(end+1) = str2double(r{c('dur')}); B.nucleus_rms(end+1) = str2double(r{c('nucleus_rms')});
    B.f0(end+1) = str2double(r{c('f0')}); B.status{end+1} = r{c('status')};
    B.lead(end+1) = str2double(r{c('lead')}); B.v_on(end+1) = str2double(r{c('v_on')}); B.v_off(end+1) = str2double(r{c('v_off')});
    B.rawOnset(end+1) = str2double(r{c('onset')});
    if ~isempty(c('ref_qc')), B.refF1(end+1) = str2double(r{c('refF1')}); B.refF2(end+1) = str2double(r{c('refF2')}); B.refQC{end+1} = r{c('ref_qc')};
    else, B.refF1(end+1) = NaN; B.refF2(end+1) = NaN; B.refQC{end+1} = ''; end
  end
end
if isempty(B.tok), error('labrun: voice bank not found (audit/labrun/voices/bank.tsv)'); end
LR.voiceBank = B;
end
