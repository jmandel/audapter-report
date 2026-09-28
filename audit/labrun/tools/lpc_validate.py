#!/usr/bin/env python3
"""Validate the LPC-check rule (audit/labrun/README.md, "Participant setup: the LPC check") on recordings.

  lpc_validate.py public  OUTDIR     CMU ARCTIC sentences (monophthongs from the phone labels) and PVQD sustained /a/ /i/
  lpc_validate.py hillenbrand OUTDIR Hillenbrand et al. (1995) hVd words (licence-restricted; run privately only)

Per talker, every order 10-20 is run through Audapter at the talker's gender preset (tools/lpc_validate.m) and scored
with the rule: A against a reference (public: Praat at two ceilings, the same QC as the voice bank; Hillenbrand: the
hand-measured steady-state formants, F1/F2 over the middle half of the vowel vs the published values), B continuity,
C clustering of per-token points (vowels with >= 2 tokens), cost and choice with the margin and consistency conditions.
Stability: the rule is also applied to two halves of each talker's tokens (alternate tokens).
Writes OUTDIR/validation.json and prints a table.
"""
import csv, glob, json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '..', 'voices'); sys.path.insert(0, V)
import build_bank as BB
ROOT = BB.ROOT; C = os.path.join(ROOT, 'audit', 'corpus')
ARPA = {'aa': 'ah', 'ae': 'ae', 'ah': 'uh', 'eh': 'eh', 'ih': 'ih', 'iy': 'iy', 'uh': 'oo', 'uw': 'uw', 'ao': 'aw'}
mel = lambda f: 1127.01048 * np.log(1 + np.asarray(f, float) / 700)
N = BB.norms()

def tokens_public():
    T = []
    man = {r['id']: r for r in csv.DictReader(open(os.path.join(C, 'manifest.tsv')), delimiter='\t')}
    for cid, r in man.items():
        g = r.get('sex', r.get('gender', ''))
        if cid.startswith('arctic_'):
            spk = cid.split('_')[1]
            for i, p in enumerate(csv.reader(l for l in open(os.path.join(C, 'gt', cid + '.phones.csv')) if not l.startswith('#'))):
                if i == 0 or p[2] not in ARPA: continue
                t0, t1 = float(p[0]), float(p[1])
                if t1 - t0 >= 0.06: T.append(dict(talker='arctic_' + spk, gender=g, path=os.path.join(C, 'audio', cid + '.wav'), t0=t0, t1=t1, vowel=ARPA[p[2]], id='%s_%d' % (cid, i)))
        elif cid.startswith('pvqd_'):
            spk = cid.split('_')[1]; w = open(os.path.join(C, 'audio', cid + '.wav'), 'rb'); import wave
            d = wave.open(os.path.join(C, 'audio', cid + '.wav')).getnframes() / 48000
            T.append(dict(talker='pvqd_' + spk, gender=g, path=os.path.join(C, 'audio', cid + '.wav'), t0=max(0.2, d / 2 - 0.5), t1=min(d - 0.2, d / 2 + 0.5), vowel='ah' if cid.endswith('_a') else 'iy', id=cid))
    return T

def tokens_hillenbrand():
    T = []
    for r in csv.DictReader(open(os.path.join(BB.HIL, 'index.tsv')), delimiter='\t'):
        if r['group'] not in 'mw' or r['vowel'] not in ('ae', 'eh', 'ih', 'iy', 'ah', 'uw', 'uh', 'oo', 'ei', 'oa'): continue
        T.append(dict(talker='hil_' + r['file'][:3], gender='M' if r['group'] == 'm' else 'F', path=os.path.join(BB.HIL, 'wav', r['file']),
                      t0=float(r['start']) / 1000, t1=float(r['end']) / 1000, vowel=r['vowel'], id=r['file'][:-4], refF1=float(r['F1']), refF2=float(r['F2'])))
    return T

def references(T, out):
    """Praat medians over the middle half of each segment at two ceilings; QC as the voice bank."""
    items = sorted(set((t['path'], t['gender']) for t in T))
    tA, tB = os.path.join(out, 'tracks'), os.path.join(out, 'tracks_up'); BB.tracks(items, tA); BB.tracks(items, tB, 500)
    for t in T:
        a = t['t0'] + 0.25 * (t['t1'] - t['t0']); b = t['t1'] - 0.25 * (t['t1'] - t['t0']); m = []
        for td in (tA, tB):
            tt, _, _, F1, F2 = BB.load_tr(os.path.join(td, os.path.basename(t['path'])[:-4] + '.tsv')); k = (tt >= a) & (tt <= b)
            m.append((np.nanmedian(F1[k]), np.nanmedian(F2[k])) if k.any() else (np.nan, np.nan))
        (h1, h2), (l1, l2) = m; gk = ('m' if t['gender'] == 'M' else 'w', t['vowel'])
        refs = [N[gk]] + ([BB.PB[gk]] if gk in BB.PB else [])
        ok = abs(np.log(h1 / l1)) <= np.log(1.1) and abs(np.log(h2 / l2)) <= np.log(1.1) and any(abs(h1 / a1 - 1) <= 0.35 and abs(h2 / a2 - 1) <= 0.25 for a1, a2 in refs)
        t['refF1'], t['refF2'], t['qc'] = h1, h2, bool(ok)

def run_audapter(T, out):
    lst = os.path.join(out, 'list.tsv')
    with open(lst, 'w') as f:
        for t in T: f.write('%s\t%s\t%.4f\t%.4f\t%s\n' % (t['path'].replace(ROOT, '/a'), t['gender'], t['t0'], t['t1'], t['id']))
    cmd = ['docker', 'run', '--rm', '-u', '%d:%d' % (os.getuid(), os.getgid()), '-v', ROOT + ':/a:ro', '-v', os.path.join(ROOT, 'audit', 'harness') + ':/h',
           '-e', 'LIST=' + lst.replace(ROOT, '/a'), '-w', '/h/oct', 'audapter-octave', 'bash', '-c',
           "octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); addpath('/h/build-oct'); addpath('/a/blab/audapter_matlab/mcode'); addpath('/h/oct'); run('/a/audit/labrun/tools/lpc_validate.m')\""]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    R = {}
    for l in res.splitlines():
        p = l.split('\t')
        if len(p) == 6 and p[0] != 'id': R[(p[0], int(p[1]))] = (float(p[2]), float(p[3]), int(p[4]), int(p[5]))
    return R

def rule(T, R, orders=range(10, 21), preset=None):
    S = {}
    for n in orders:
        at, bt, st, jt, pts = [], [], 0, 0, []
        for t in T:
            F1, F2, s_, j_ = R[(t['id'], n)]; st += s_; jt += j_; b = 100 * j_ / max(s_, 1)
            a = 100 * np.mean(np.abs(np.log(np.array([F1, F2]) / [t['refF1'], t['refF2']]))) if t['qc'] and np.isfinite(F1) else np.nan
            at.append(a); bt.append(b); pts.append((t['vowel'], F1, F2))
        at = np.array(at); ua = np.isfinite(at); useA = ua.sum() >= 3 and len(set(t['vowel'] for t, u in zip(T, ua) if u)) >= 2
        A = np.median(at[ua]) if useA else np.nan; B = 100 * jt / max(st, 1)
        cen, wd = [], []
        for v in sorted(set(p[0] for p in pts)):
            P = np.array([[mel(p[1]), mel(p[2])] for p in pts if p[0] == v and np.isfinite(p[1])])
            if len(P) >= 2: c = P.mean(0); cen.append(c); wd += list(((P - c) ** 2).sum(1))
        Cc = np.nan
        if len(cen) >= 2: Cc = 100 * np.sqrt(np.mean(wd)) / np.mean([np.linalg.norm(a - b) for i, a in enumerate(cen) for b in cen[i + 1:]])
        cost = (0.5 * A + 0.25 * B + 0.25 * Cc) if useA and np.isfinite(Cc) else (2 / 3 * A + 1 / 3 * B) if useA else (0.5 * B + 0.5 * Cc) if np.isfinite(Cc) else B
        pc = np.array(bt, float); pc[ua] = 2 / 3 * at[ua] + 1 / 3 * pc[ua] if useA else pc[ua]
        S[n] = dict(A=A, B=B, C=Cc, cost=cost, nA=int(ua.sum()), pc=pc)
    best = min(S, key=lambda n: (S[n]['cost'], abs(n - preset)))
    condA = S[best]['cost'] <= 0.85 * S[preset]['cost']; wins = int((S[best]['pc'] < S[preset]['pc']).sum())
    chosen = best if condA and wins >= 2 / 3 * len(T) else preset
    return S, best, (best if condA else preset), chosen, wins

def main():
    which, out = sys.argv[1], os.path.abspath(sys.argv[2]); os.makedirs(out, exist_ok=True)
    T = tokens_public() if which == 'public' else tokens_hillenbrand()
    if which == 'public': references(T, out)
    else:
        for t in T: t['qc'] = True
    R = run_audapter(T, out)
    res = {}
    for tk in sorted(set(t['talker'] for t in T)):
        X = [t for t in T if t['talker'] == tk]; g = X[0]['gender']
        if not g or g not in 'MF': continue
        preset = 17 if g == 'M' else 15
        S, best, conly, chosen, wins = rule(X, R, preset=preset)
        halves = [rule(X[h::2], R, preset=preset)[3] if len(X) >= 4 else None for h in (0, 1)]
        res[tk] = dict(gender=g, n_tokens=len(X), n_ref=sum(t['qc'] for t in X), preset=preset, best=best, margin_only=conly, chosen=chosen,
                       wins=wins, halves=halves, orders={n: {k: (None if not np.isfinite(v) else round(float(v), 3)) for k, v in s.items() if k != 'pc'} for n, s in S.items()})
        print('%-14s %s n=%3d ref=%3d preset %d best %2d margin-only %2d chosen %2d wins %d/%d halves %s' % (tk, g, len(X), res[tk]['n_ref'], preset, best, conly, chosen, wins, len(X), halves))
    json.dump(res, open(os.path.join(out, 'validation.json'), 'w'), indent=1)

if __name__ == '__main__':
    main()
