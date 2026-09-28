% simonSingleWord v2 ("bedhead" opposing-shift adaptation): run_simonSingleWord_v2_expt, test mode unless LR_FULL=1.
plan.name = 'simonSingleWord_v2';
plan.repos = {'simonSingleWord'};
plan.exptDir = 'simonSingleWord/experiment scripts';
plan.entry = 'run_simonSingleWord_v2_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
% counterbalancing file, at the lab-server path the script checks first
plan.pre = @() lr_make_cbperm('\\wcs-cifs\wc\smng\experiments\simonSingleWord_v2\', 'simonSingleWord_v2', {'shiftIH', 'shiftAE'; 'shiftAE', 'shiftIH'});
