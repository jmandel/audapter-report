#!/usr/bin/env python3
"""Build ~/hobby/audapter/audit/corpus from downloaded originals in scratch/corpus/raw.

Every clip: mono, 48 kHz, PCM_16, original level preserved (no normalisation).
Writes corpus/audio/<id>.wav, corpus/gt/* (ground truth, converted + originals),
corpus/ref/<id>.praat.csv (automatic Praat F0/F1-F3 reference, NOT hand-measured),
corpus/ref/<id>.energy.csv (energy-based speech segments), corpus/manifest.csv/.json.
"""
import json, os, sys, csv, shutil, glob
import numpy as np, soundfile as sf, scipy.io as sio
from scipy.signal import resample_poly
from math import gcd
import parselmouth

HERE = os.path.dirname(os.path.abspath(__file__)); RAW = os.path.join(HERE, 'raw')
OUT = os.path.expanduser('~/hobby/audapter/audit/corpus')
FS = 48000
for d in ('audio', 'gt', 'ref'): os.makedirs(os.path.join(OUT, d), exist_ok=True)
rows = []

LIC = {
 'arctic': ('CMU ARCTIC (Kominek & Black 2003), festvox.org', 'CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)', 'http://festvox.org/cmu_arctic/'),
 'so762': ('speechocean762 (Zhang et al. 2021), OpenSLR 101', 'CC BY 4.0', 'https://www.openslr.org/101/'),
 'libri': ('LibriSpeech dev-clean (Panayotov et al. 2015), OpenSLR 12', 'CC BY 4.0', 'https://www.openslr.org/12/'),
 'vbd': ('Noisy speech database / VoiceBank-DEMAND test set (Valentini-Botinhao 2017), doi:10.7488/ds/2117', 'CC BY 4.0', 'https://datashare.ed.ac.uk/handle/10283/2791'),
 'pvqd': ('Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4', 'CC BY 4.0', 'https://data.mendeley.com/datasets/9dz247gnyb/4'),
 'vocalset': ('VocalSet (Wilkins et al. 2018), Zenodo doi:10.5281/zenodo.1442513', 'CC BY 4.0', 'https://zenodo.org/records/1442513'),
 'blab': ('Audapter example trials: audapter_matlab example_data (MIT, (c) 2006-2021 Audapter Authors) / audapter_mex mcode (Apache-2.0, (c) 2015 Authors of Audapter)', 'MIT (audapter_matlab) / Apache-2.0 (audapter_mex)', 'https://github.com/shanqing-cai/audapter_matlab/tree/master/example_data'),
 'kearney': ('elainekearney/audapter_matlab fork, mcode/audio (time-domain pitch-shift demo samples)', 'MIT ((c) 2006-2021 Audapter Authors)', 'https://github.com/elainekearney/audapter_matlab/tree/master/mcode/audio'),
 'freespeech': ('carrien/free-speech templates (Niziolek lab)', 'MIT ((c) 2015 Carrie Niziolek)', 'https://github.com/carrien/free-speech/tree/master/templates'),
 'praat': ('Praat source tree test/fon ExperimentMFC/Sounds', 'GPL-3.0-or-later (Praat; audio provenance not separately stated)', 'https://github.com/praat/praat/tree/master/test/fon%20ExperimentMFC/Sounds'),
 'vocadito': ('vocadito (Bittner et al. 2021), Zenodo doi:10.5281/zenodo.5578807', 'CC BY 4.0', 'https://zenodo.org/records/5578807'),
}

def resample(x, fs):
    if fs == FS: return x
    g = gcd(FS, int(fs)); return resample_poly(x, FS // g, int(fs) // g)

def praat_ref(x, path, sex):
    snd = parselmouth.Sound(x, FS)
    ceil = {'M': 5000, 'F': 5500, 'child': 8000}.get(sex, 5500)
    hi = 1000 if sex in ('child', 'singer_F') else 600
    p = snd.to_pitch_ac(time_step=0.01, pitch_floor=60, pitch_ceiling=hi)
    fm = snd.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=ceil)
    with open(path, 'w') as f:
        f.write('# automatic Praat reference (to_pitch_ac, to_formant_burg ceil=%d Hz); NOT hand-measured\n' % ceil)
        f.write('t,f0,F1,F2,F3\n')
        for t in np.arange(0.01, len(x) / FS - 0.01, 0.01):
            f0 = p.get_value_at_time(t)
            F = [fm.get_value_at_time(k, t) for k in (1, 2, 3)]
            f.write('%.3f,%s\n' % (t, ','.join('' if (v is None or np.isnan(v)) else '%.1f' % v for v in [f0] + F)))

def energy_ref(x, path, rel_db=-30, min_gap=0.1, min_seg=0.05):
    h = int(0.005 * FS); w = int(0.02 * FS)
    e = np.array([np.sqrt(np.mean(x[i:i + w] ** 2) + 1e-12) for i in range(0, len(x) - w, h)])
    db = 20 * np.log10(e); on = db > db.max() + rel_db
    segs = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            segs.append([i * h / FS + 0.01, j * h / FS + 0.01]); i = j
        else: i += 1
    m = []
    for s in segs:
        if m and s[0] - m[-1][1] < min_gap: m[-1][1] = s[1]
        else: m.append(s)
    m = [s for s in m if s[1] - s[0] >= min_seg]
    with open(path, 'w') as f:
        f.write('# energy segments: 20 ms RMS > (max %+d dB), gaps < %.0f ms merged\nonset,offset\n' % (rel_db, min_gap * 1000))
        for a, b in m: f.write('%.3f,%.3f\n' % (a, b))
    return m

def add(cid, src, x, fs, speaker, sex, age, group, content, orig, t0=None, t1=None, gt='', gt_type='', notes='', extra=None):
    if x.ndim > 1: x = x[:, 0]
    if t0 is not None:
        x = x[int(max(t0, 0) * fs): int(min(t1, len(x) / fs) * fs)]
    y = resample(x.astype(np.float64), fs)
    peak = np.max(np.abs(y))
    if peak >= 1: y = y / peak * 0.99; notes += ' [scaled to avoid clipping]'
    path = 'audio/%s.wav' % cid
    sf.write(os.path.join(OUT, path), y, FS, subtype='PCM_16')
    praat_ref(y, os.path.join(OUT, 'ref/%s.praat.csv' % cid), group if group in ('child', 'singer_F') else sex)
    energy_ref(y, os.path.join(OUT, 'ref/%s.energy.csv' % cid))
    s, lic, url = LIC[src]
    r = dict(id=cid, path=path, source=s, source_url=url, license=lic, speaker=speaker, sex=sex, age=age, group=group,
             content=content, orig_file=orig, orig_sr=int(fs), clip_start_s='' if t0 is None else round(max(t0, 0), 3),
             clip_end_s='' if t1 is None else round(min(t1, len(x) / fs + (t0 or 0)), 3), dur_s=round(len(y) / FS, 3),
             peak_dbfs=round(20 * np.log10(np.max(np.abs(y))), 1), rms_dbfs=round(20 * np.log10(np.sqrt(np.mean(y ** 2))), 1),
             gt_file=gt, gt_type=gt_type, ref_praat='ref/%s.praat.csv' % cid, ref_energy='ref/%s.energy.csv' % cid, notes=notes.strip())
    if extra: r.update(extra)
    rows.append(r); print(cid, r['dur_s'], r['peak_dbfs'])

# ---- CMU ARCTIC: sentences with autolabelled phone boundaries (lab) and pitchmarks (pm)
ARC = dict(bdl=('M', 'US English'), slt=('F', 'US English'), clb=('F', 'US English'), rms=('M', 'US English'),
           jmk=('M', 'Canadian English'), awb=('M', 'Scottish English'), ksp=('M', 'Indian English'))
prompts = {l.split('"')[0].split()[1]: l.split('"')[1] for l in open(os.path.join(RAW, 'arctic/txt.done.data'))}
for f in sorted(glob.glob(os.path.join(RAW, 'arctic/*.wav'))):
    b = os.path.basename(f)[:-4]; spk, utt = b.split('_'); x, fs = sf.read(f)
    # labels -> csv (start,end,phone); pitchmarks -> csv (t)
    lab = [l.split() for l in open(f[:-4] + '.lab') if l.strip() and not l.startswith('#')]
    gtl = 'gt/arctic_%s_%s.phones.csv' % (spk, utt); prev = 0.0
    with open(os.path.join(OUT, gtl), 'w') as g:
        g.write('# CMU ARCTIC autolabelled (EHMM forced alignment) phone segments\nstart,end,phone\n')
        for t, _, ph in lab: g.write('%.3f,%s,%s\n' % (prev, t, ph)); prev = float(t)
    pm = [l.split()[0] for l in open(f[:-4] + '.pm') if l[:1].isdigit()]
    gtp = 'gt/arctic_%s_%s.pm.csv' % (spk, utt)
    with open(os.path.join(OUT, gtp), 'w') as g: g.write('# CMU ARCTIC pitchmarks (festvox pm)\nt\n' + '\n'.join(pm) + '\n')
    for ext in ('lab', 'pm'): shutil.copy(f[:-4] + '.' + ext, os.path.join(OUT, 'gt', 'arctic_%s_%s.orig.%s' % (spk, utt, ext)))
    add('arctic_%s_%s' % (spk, utt), 'arctic', x, fs, 'cmu_us_%s' % spk, ARC[spk][0], 'adult', 'adult_' + ARC[spk][0], prompts['arctic_' + utt],
        'cmu_us_%s_arctic/wav/arctic_%s.wav' % (spk, utt), gt=gtl + ';' + gtp, gt_type='phone alignment (auto); pitchmarks',
        notes=ARC[spk][1] + '; resampled 16k->48k (modification)')

# ---- speechocean762 children
for r in json.load(open(os.path.join(RAW, 'so762/picked.json'))):
    x, fs = sf.read(os.path.join(HERE, r['file']))
    sx = r['gender'].upper()
    add('so762_%s_%d' % (r['speaker'], r['idx']), 'so762', x, fs, 'so762_%s' % r['speaker'], sx, r['age'], 'child', r['text'],
        'test split row %d (HF mispeech/speechocean762)' % r['idx'], gt_type='transcript; expert scores',
        notes='Mandarin-L1 child reading English; expert total score %d/10' % r['total'])

# ---- LibriSpeech
for r in json.load(open(os.path.join(RAW, 'libri/picked.json'))):
    x, fs = sf.read(os.path.join(HERE, r['file']))
    add('libri_%s' % r['id'], 'libri', x, fs, 'libri_%s' % r['speaker'], r['sex'], 'adult', 'adult_' + r['sex'], r['text'],
        'dev-clean/%s/%s/%s.flac' % (tuple(r['id'].split('-')[:2]) + (r['id'],)), gt_type='transcript', notes='audiobook read speech')

# ---- VoiceBank-DEMAND noisy test set (+clean reference)
log = {l.split()[0]: (l.split()[1], float(l.split()[2])) for l in open(os.path.join(RAW, 'vbd/log_testset.txt'))}
for k in open(os.path.join(RAW, 'vbd/picked.txt')).read().split():
    x, fs = sf.read(os.path.join(RAW, 'vbd/noisy/%s.wav' % k)); c, _ = sf.read(os.path.join(RAW, 'vbd/clean/%s.wav' % k))
    gt = 'gt/vbd_%s.clean.wav' % k; sf.write(os.path.join(OUT, gt), c, 48000, subtype='PCM_16')
    txt = open(os.path.join(RAW, 'vbd/testset_txt/%s.txt' % k)).read().strip()
    sx = 'M' if k.startswith('p232') else 'F'
    noise, snr = log[k]
    add('vbd_%s_%s%g' % (k, noise, snr), 'vbd', x, fs, 'vctk_' + k[:4], sx, 'adult', 'adult_' + sx, txt, 'noisy_testset_wav/%s.wav' % k,
        gt=gt, gt_type='clean counterpart (sample-aligned); noise type + SNR', notes='DEMAND noise "%s" at %.1f dB SNR' % (noise, snr),
        extra=dict(snr_db=snr, noise=noise))

# ---- PVQD sustained vowels (CAPE-V /a/ and /i/)
PV = [  # id, sex, age, diag, severity, channel, (vowel, t0, t1)...
 ('LA9003', 'F', 27, 'none', 1.2, 0, [('a', 0.4, 3.3), ('i', 6.6, 9.4)]),
 ('SJ7001', 'F', 21, 'none', 0.3, 0, [('a', 0.5, 6.6), ('i', 8.2, 13.7)]),
 ('SJ2001', 'F', 69, 'none', 0.8, 0, [('a', 0.5, 4.9), ('i', 6.1, 10.2)]),
 ('PT101', 'F', 14, 'MTD', 6.7, 0, [('a', 0.4, 3.2), ('i', 6.0, 7.4)]),
 ('NYU1015', 'F', 52, 'atrophy', 45.5, 1, [('a', 11.9, 15.9), ('i', 0.1, 1.4)]),
 ('LA9015', 'M', 24, 'none', 2.7, 0, [('a', 1.9, 4.9), ('i', 6.8, 9.8)]),
 ('LA9022', 'M', 25, 'none', 2.5, 0, [('a', 0.0, 2.8), ('i', 3.8, 6.7)]),
 ('SJ2009', 'M', 21, 'none', 4.2, 0, [('a', 0.4, 5.0), ('i', 6.1, 11.1)]),
 ('PT128', 'M', 35, 'MTD', 1.2, 0, [('a', 8.7, 10.8)]),
 ('NYU1017', 'M', 68, 'vocal tremor', 19.8, 0, [('a', 0.3, 5.6), ('i', 7.3, 8.9)]),
]
for pid, sx, age, diag, sev, ch, vs in PV:
    x, fs = sf.read(os.path.join(RAW, 'pvqd/%s.wav' % pid))
    if x.ndim > 1: x = x[:, ch]
    grp = 'teen_F' if age < 18 else 'adult_' + sx
    for v, a, b in vs:
        t0 = max(a - 0.3, 0); t1 = min(b + 0.2, t0 + 3.5)
        add('pvqd_%s_%s' % (pid, v), 'pvqd', x, fs, 'pvqd_' + pid, sx, age, grp, 'sustained /%s/ (CAPE-V)' % v, '%s_ENSS.wav' % pid, t0, t1,
            gt_type='CAPE-V severity rating (0-100); diagnosis', notes='diagnosis: %s; CAPE-V overall severity %.1f; 44.1k->48k' % (diag, sev),
            extra=dict(capev_severity=sev, diagnosis=diag))

# ---- VocalSet sung sustained vowels (high F0)
VS = [('f2_long_straight_a', 'female2', 'F', 0.5, 4.0), ('f2_long_straight_i', 'female2', 'F', 0.3, 3.8),
      ('f9_long_straight_a', 'female9', 'F', 0.0, 3.5), ('f9_long_straight_i', 'female9', 'F', 0.0, 3.5),
      ('m2_long_straight_a', 'male2', 'M', 5.3, 8.3), ('m2_long_straight_i', 'male2', 'M', 2.9, 5.5)]
for fn, spk, sx, a, b in VS:
    x, fs = sf.read(os.path.join(RAW, 'vocalset/%s.wav' % fn))
    add('vocalset_' + fn, 'vocalset', x, fs, 'vocalset_' + spk, sx, 'adult', 'singer_' + sx, 'sung sustained /%s/ (long tone, straight)' % fn[-1],
        'FULL/%s/long_tones/straight/%s.wav' % (spk, fn), a, b, gt_type='none (F0 from Praat ref)', notes='trained singer; 44.1k->48k')

# ---- blab example_data: real Audapter trials (signalIn at Audapter's internal rate)
ED = os.path.expanduser('~/hobby/audapter/blab/audapter_matlab/example_data')
for fn, cid, sx, content in [('diao1_female.mat', 'blab_diao1_female', 'F', 'Mandarin syllable (diao1), formant-shift trial'),
                             ('trial-1-2.mat', 'blab_trial_1_2', 'M', '"The steady bat gave birth to pups" (rhythm study trial)')]:
    m = sio.loadmat(os.path.join(ED, fn), squeeze_me=True, struct_as_record=False)['data']
    p = m.params; fs = int(p.sr)
    gt = 'gt/%s.audapter_online.mat' % cid
    keep = {k: getattr(m, k) for k in ('fmts', 'sfmts', 'rms', 'ost_stat', 'signalOut') if hasattr(m, k)}
    keep.update(sr=p.sr, downfact=p.downfact, frameLen=p.frameLen, nLPC=p.nLPC, fn1=p.fn1, fn2=p.fn2, rmsThresh=p.rmsThresh)
    sio.savemat(os.path.join(OUT, gt), keep)
    add(cid, 'blab', np.asarray(m.signalIn, float), fs, getattr(m.subject, 'name', ''), sx, 'adult', 'adult_' + sx, content,
        'example_data/' + fn + ' data.signalIn', gt=gt, gt_type='Audapter online log (fmts,sfmts,rms,ost_stat) from original Windows session',
        notes='signalIn stored at %d Hz (sr), upsampled to 48k; original device rate %d; nLPC %d' % (fs, fs * p.downfact, p.nLPC))

# ---- shanqing-cai/audapter_mex da1_male (real Audapter trial, Apache-2.0)
m = sio.loadmat(os.path.join(RAW, 'gh/da1_male.mat'), squeeze_me=True, struct_as_record=False)['data']; p = m.params
gt = 'gt/blab_da1_male.audapter_online.mat'
keep = {k: getattr(m, k) for k in ('fmts', 'sfmts', 'rms', 'signalOut') if hasattr(m, k)}
keep.update(sr=p.sr, downfact=p.downfact, frameLen=p.frameLen, nLPC=p.nLPC, fn1=p.fn1, fn2=p.fn2, rmsThresh=p.rmsThresh)
sio.savemat(os.path.join(OUT, gt), keep)
add('blab_da1_male', 'blab', np.asarray(m.signalIn, float), int(p.sr), getattr(m.subject, 'name', ''), 'M', 'adult', 'adult_M', 'Mandarin syllable (da1), formant-shift trial',
    'audapter_mex/mcode/da1_male.mat data.signalIn', gt=gt, gt_type='Audapter online log (fmts,sfmts,rms) from original session',
    notes='signalIn stored at %d Hz, upsampled to 48k; nLPC %d' % (p.sr, p.nLPC))

# ---- Kearney sustained /i/ (time-domain pitch-shift demo samples)
for sx, lo, hi in (('female', 150, 300), ('male', 80, 160)):
    x, fs = sf.read(os.path.join(RAW, 'gh/sustained-eee-%s.wav' % sx))
    add('kearney_eee_%s' % sx, 'kearney', x, fs, 'unknown', sx[0].upper(), 'adult', 'adult_' + sx[0].upper(), 'sustained /i/', 'mcode/audio/sustained-eee-%s.wav' % sx,
        0.2, 4.7, gt_type='none', notes='used by upstream time_domain_shift_demo.m with pitch bounds %d-%d Hz; 32-bit 44.1k -> 48k' % (lo, hi))

# ---- free-speech dipper/tipper (single words, Niziolek lab)
for w in ('dipper', 'tipper'):
    x, fs = sf.read(os.path.join(RAW, 'gh/%s_cwn.wav' % w))
    ch = int(np.argmax(np.std(x, 0))) if x.ndim > 1 else 0
    add('freespeech_%s_cwn' % w, 'freespeech', x[:, ch] if x.ndim > 1 else x, fs, 'cwn', 'unknown', 'adult', 'adult_unknown', w, 'templates/%s_cwn.wav' % w,
        gt_type='none', notes='stereo original, channel %d used; very short (0.5 s)' % (ch + 1))

# ---- Praat hVd words
for w in ('heed', 'hid', 'hood', 'hud'):
    x, fs = sf.read(os.path.join(RAW, 'gh/praat_%s.wav' % w))
    add('praat_%s' % w, 'praat', x, fs, 'unknown', 'unknown', 'adult', 'adult_unknown', 'hVd word "%s"' % w, 'test/fon ExperimentMFC/Sounds/%s.wav' % w,
        gt_type='none', notes='11025 Hz original: no energy above 5.5 kHz')

# ---- vocadito sung phrases with annotated F0
VC = {2: ('S2', 2.33), 4: ('S3', 0.83), 10: ('S7', 0.35)}
meta = {l.split(',')[0]: l.strip().split(',') for l in open(os.path.join(RAW, 'vocadito/vocadito_metadata.csv'))}
for t, (spk, a) in VC.items():
    x, fs = sf.read(os.path.join(RAW, 'vocadito/vocadito_%d.wav' % t)); b = a + 4.7
    F = np.loadtxt(os.path.join(RAW, 'vocadito/vocadito_%d_f0.csv' % t), delimiter=',')
    gt = 'gt/vocadito_%d.f0.csv' % t; sel = (F[:, 0] >= a) & (F[:, 0] < b)
    with open(os.path.join(OUT, gt), 'w') as g:
        g.write('# vocadito expert F0 annotation, time shifted to clip start (orig t - %.3f s); 0 = unvoiced\nt,f0\n' % a)
        for tt, f0 in F[sel]: g.write('%.4f,%.2f\n' % (tt - a, f0))
    add('vocadito_%d' % t, 'vocadito', x, fs, 'vocadito_' + spk, 'unknown', 'adult', 'singer_unknown', 'sung phrase (%s), avg MIDI pitch %s' % (meta[str(t)][3], meta[str(t)][2]),
        'Audio/vocadito_%d.wav' % t, a, b, gt=gt, gt_type='expert F0 annotation', notes='solo singing; 44.1k -> 48k')

cols = list(dict.fromkeys(k for r in rows for k in r))
with open(os.path.join(OUT, 'manifest.csv'), 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); [w.writerow(r) for r in rows]
json.dump(rows, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, default=str)
print(len(rows), 'clips')

# Octave-friendly index (tab-separated, no quoting)
with open(os.path.join(OUT, 'manifest.tsv'), 'w') as f:
    f.write('id\tpath\tsex\tage\tgroup\tsource\tgt_file\tcontent\n')
    for r in rows:
        f.write('\t'.join(str(r[k]).replace('\t', ' ') for k in ('id', 'path', 'sex', 'age', 'group')) + '\t' + r['id'].split('_')[0] + '\t' + r['gt_file'] + '\t' + r['content'].replace('\t', ' ') + '\n')
