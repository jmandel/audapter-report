% simonSingleWord (v1): run_simonSingleWord_expt, test mode unless LR_FULL=1.
plan.name = 'simonSingleWord_v1';
plan.repos = {'simonSingleWord'};
plan.exptDir = 'simonSingleWord/experiment scripts';
plan.entry = 'run_simonSingleWord_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
plan.pre = @() lr_make_cbperm('\\wcs-cifs\wc\smng\experiments\simonSingleWord\', 'simonSingleWord', {'shiftIH', 'shiftAE'; 'shiftAE', 'shiftIH'});
