% uhdapter (shifted-schwa adaptation): run_uhdapter_audapter(outputdir, expt, bTestMode) as full_run_uhdapter calls it.
plan.name = 'uhdapter';
plan.repos = {'uhdapter'};
plan.exptDir = 'uhdapter';
plan.entry = 'run_uhdapter_audapter';
plan.args = {'C:\Users\Public\Documents\experiments\stress', [], ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
