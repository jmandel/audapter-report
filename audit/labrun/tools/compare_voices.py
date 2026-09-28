#!/usr/bin/env python3
"""Synthetic participant vs voice-bank participants, per condition and word, from summary.tsv files.

  compare_voices.py SYNTH_DIR VOICES_DIR [--by cond|cond,word] [--skip-first-call] [--md OUT.md]

VOICES_DIR holds one result dir per talker (tools/runvoices.sh). For each group the table gives the synthetic median
and, over talkers, the median of the per-talker medians with its range. Columns: trials, trials with a logged shift,
heard level re input (gain_dB), in->out lag (ms), pitch change (cents), logged shift (mel, shifted trials only) and
heard/spoken formant ratios within the shifted span. --skip-first-call drops the first runner call (trials up to the
first reset of the script's trial index) when the session has more than one call (e.g. a pre phase).
"""
import argparse, csv, glob, os, sys, warnings
import numpy as np
warnings.filterwarnings("ignore", category=RuntimeWarning)


def f(x):
    try: return float(x)
    except (TypeError, ValueError): return np.nan


def load(d, skip_first):
    p = os.path.join(d, 'summary.tsv')
    if not os.path.exists(p): return []
    R = [r for r in csv.DictReader(open(p), delimiter='\t') if r['mode'] == 'proc']
    if skip_first:
        it = [f(r['itrial']) for r in R]; cut = None
        for i in range(1, len(R)):
            if it[i] < it[i - 1]: cut = i; break
        if cut is not None: R = R[cut:]
    return R


MET = [('n', None), ('shifted', None), ('gain_dB', 'gain_dB'), ('lag_ms', 'lag_ms'), ('pitch_cents', 'pitch_cents'),
       ('|dF1| mel', 'shift_F1_mel'), ('|dF2| mel', 'shift_F2_mel'), ('F1 out/in', 'F1r'), ('F2 out/in', 'F2r')]


def stats(R):
    sh = [r for r in R if f(r['shift_s']) > 0]
    o = {'n': len(R), 'shifted': len(sh)}
    for k, c in MET[2:5]: o[k] = np.nanmedian([f(r[c]) for r in R]) if R else np.nan
    o['|dF1| mel'] = np.nanmedian([abs(f(r['shift_F1_mel'])) for r in sh]) if sh else np.nan
    o['|dF2| mel'] = np.nanmedian([abs(f(r['shift_F2_mel'])) for r in sh]) if sh else np.nan
    o['F1 out/in'] = np.nanmedian([f(r['span_out_F1']) / f(r['span_in_F1']) for r in sh]) if sh else np.nan
    o['F2 out/in'] = np.nanmedian([f(r['span_out_F2']) / f(r['span_in_F2']) for r in sh]) if sh else np.nan
    return o


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('synth'); ap.add_argument('voices')
    ap.add_argument('--by', default='cond'); ap.add_argument('--skip-first-call', action='store_true'); ap.add_argument('--md')
    a = ap.parse_args(); by = a.by.split(',')
    S = load(a.synth, a.skip_first_call)
    T = {os.path.basename(d): load(d, a.skip_first_call) for d in sorted(glob.glob(os.path.join(a.voices, '*'))) if os.path.isdir(d)}
    T = {k: v for k, v in T.items() if v}
    key = lambda r: tuple(r.get(b, '') for b in by)
    groups = sorted(set(map(key, S)) | set(k for R in T.values() for k in map(key, R)))
    L = ['# %s: synthetic vs voice-bank participants' % os.path.basename(os.path.normpath(a.voices)), '',
         'Talkers: %s. Cells: synthetic | median over talkers [min, max] of per-talker medians.' % ', '.join(T), '',
         '| %s | %s |' % (' | '.join(by), ' | '.join(m for m, _ in MET)), '|' + '---|' * (len(by) + len(MET))]
    for g in groups:
        s = stats([r for r in S if key(r) == g])
        per = [stats([r for r in R if key(r) == g]) for R in T.values()]
        cells = []
        for m, _ in MET:
            v = np.array([p[m] for p in per], float); v = v[~np.isnan(v)]
            fmt = '%.0f' if m in ('n', 'shifted') else '%.2f'
            sv = fmt % s[m] if s[m] == s[m] else '-'
            cells.append('%s \\| %s' % (sv, (fmt % np.median(v) + ' [' + fmt % v.min() + ', ' + fmt % v.max() + ']') if len(v) else '-'))
        L.append('| %s | %s |' % (' | '.join(g), ' | '.join(cells)))
    out = '\n'.join(L) + '\n'
    if a.md: open(a.md, 'w').write(out)
    sys.stdout.write(out)


if __name__ == '__main__':
    main()
