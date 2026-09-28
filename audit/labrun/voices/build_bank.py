#!/usr/bin/env python3
"""Build and validate a labrun voice bank from cached TTS takes (tts.py) and, optionally, Hillenbrand et al. (1995)
recordings of the exact word.

  build_bank.py BANKDIR STIMULI.tsv [--hillenbrand]

For every take: Praat tracks (tracks.praat in the audapter-labrun image: intensity, F0, F1-F3 every 10 ms), then
- the word: the loudest run of frames within 35 dB of the take's peak, gaps up to 0.2 s merged (0.5 s in sentences);
- rejected if other sound within 25 dB of the peak lies outside it (a second word, a repetition, junk), if it touches
  the start or end of the file, if it is clipped (|x| >= 0.99), silent, too short or too long for its style, if it
  has too little voicing, if its median F0 is implausible for the voice's gender (F 120-320 Hz, M 70-190 Hz), or,
  for one-vowel words, if the vowel's F1/F2 (median over voiced frames within 6 dB of the peak) are far from both Hillenbrand et al.'s (1995) and Peterson & Barney's
  (1952) means for that vowel and gender (F1 0.65-1.5x, F2 0.7-1.35x; F2 up to 2.3x for /u/ and /U/ and 1.65x for /o/,
  which are fronted in current American English, more so after /s t d/; F1 only before a nasal coda);
- accepted takes are cut from 30 ms before the word to 50 ms after it (5 ms fades) into audio/tok/ (Hillenbrand
  tokens into restricted/tok/, never committed), and indexed in bank.tsv with their nucleus RMS (20 ms frames within
  10 dB of the loudest), which labrun scales to 0.05 as it does the synthetic vowels, the word onset within the cut
  token (lead) and the vowel nucleus (v_on..v_off: voiced frames within 15 dB of the peak, token time).
Writes BANKDIR/bank.tsv and BANKDIR/validation.md.
"""
import argparse, csv, glob, os, re, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
HIL = os.path.join(ROOT, 'audit', 'corpus', 'restricted', 'hillenbrand')
VOWEL = {  # one-vowel words -> Hillenbrand vowel code
    'bat': 'ae', 'bad': 'ae', 'add': 'ae', 'bed': 'eh', 'head': 'eh', 'dead': 'eh', 'ted': 'eh', 'ed': 'eh', 'best': 'eh',
    'said': 'eh', 'bid': 'ih', 'sip': 'ih', 'bead': 'iy', 'bee': 'iy', 'deem': 'iy', 'pea': 'iy', 'team': 'iy', 'eat': 'iy',
    'see': 'iy', 'seep': 'iy', 'seat': 'iy', 'bayed': 'ei', 'bod': 'ah', 'bot': 'ah', 'dock': 'ah', 'pot': 'ah', 'top': 'ah',
    'sop': 'ah', 'sock': 'ah', 'ah': 'ah', 'bode': 'oa', 'so': 'oa', 'booed': 'uw', 'sue': 'uw', 'suit': 'uw', 'bud': 'uh',
    'hood': 'oo'}
NASAL_CODA = {'team', 'deem'}
HILWORDS = {'head': 'eh', 'hood': 'oo'}   # exact hVd words in Hillenbrand
DUR = {'word': (0.15, 1.8), 'sentence': (0.8, 7.0), 'emphasis': (0.6, 3.0), 'sustained': (0.8, 8.0)}
PRIMARY = 'gpt-audio-1.5'   # gpt-4o-mini-tts takes are used only where a talker lacks accepted primary takes
F0 = {'F': (120, 320), 'M': (70, 190)}
TAKES_NEEDED = {'word': 2, 'sentence': 1, 'emphasis': 1, 'sustained': 2}


def norms():
    """Hillenbrand (1995) steady-state F1/F2 means per group (m, w) and vowel, all talkers (vowdata.dat)."""
    acc = {}
    for line in open(os.path.join(HIL, 'vowdata.dat')):
        p = line.split()
        if len(p) != 16 or len(p[0]) != 5 or p[0][0] not in 'mw': continue
        f1, f2 = float(p[3]), float(p[4])
        if f1 > 0 and f2 > 0: acc.setdefault((p[0][0], p[0][3:]), []).append((f1, f2))
    return {k: np.mean(v, 0) for k, v in acc.items()}


# Peterson & Barney (1952) means (men, women): a second reference, since Hillenbrand's Michigan talkers have a raised /ae/
PB = {('m', 'iy'): (270, 2290), ('w', 'iy'): (310, 2790), ('m', 'ih'): (390, 1990), ('w', 'ih'): (430, 2480),
      ('m', 'eh'): (530, 1840), ('w', 'eh'): (610, 2330), ('m', 'ae'): (660, 1720), ('w', 'ae'): (860, 2050),
      ('m', 'ah'): (730, 1090), ('w', 'ah'): (850, 1220), ('m', 'oo'): (440, 1020), ('w', 'oo'): (470, 1160),
      ('m', 'uw'): (300, 870), ('w', 'uw'): (370, 950), ('m', 'uh'): (640, 1190), ('w', 'uh'): (760, 1400)}


def rd(path):
    w = wave.open(path); fs = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    return fs, x


def wr(path, fs, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(fs); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def tracks(items, tdir, offset=0):
    """items: [(wavpath, gender)] -> run Praat once for those without a cached track file."""
    todo = [(p, g) for p, g in items if not os.path.exists(os.path.join(tdir, os.path.basename(p)[:-4] + '.tsv'))]
    if not todo: return
    os.makedirs(tdir, exist_ok=True)
    mounts = {}
    lines = []
    for p, g in todo:
        d = os.path.dirname(os.path.abspath(p)); m = mounts.setdefault(d, '/m%d' % len(mounts))
        lines.append('%s/%s\t%s' % (m, os.path.basename(p), g))
    lst = os.path.join(tdir, '_list.txt'); open(lst, 'w').write('\n'.join(lines) + '\n')
    cmd = ['docker', 'run', '--rm', '-u', '%d:%d' % (os.getuid(), os.getgid()), '-v', HERE + ':/v:ro', '-v', os.path.abspath(tdir) + ':/t']
    for d, m in mounts.items(): cmd += ['-v', d + ':' + m + ':ro']
    cmd += ['audapter-labrun', 'praat', '--run', '/v/tracks.praat', '/t/_list.txt', '/t', str(offset)]
    subprocess.run(cmd, check=True)


def load_tr(path):
    rows = list(csv.DictReader(open(path), delimiter='\t'))
    f = lambda k: np.array([float(r[k]) if r[k] not in ('--undefined--', '') else np.nan for r in rows])
    return f('t'), f('db'), f('f0'), f('F1'), f('F2')


def runs(mask):
    out, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j + 1 < n and mask[j + 1]: j += 1
            out.append([i, j]); i = j + 1
        else: i += 1
    return out


def analyse(fs, x, tr, style, gender, key, N):
    t, db, f0, F1, F2 = tr
    r = {'reason': []}
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    r['peak'] = peak
    if peak < 0.01: r['reason'].append('silent'); return r
    if np.sum(np.abs(x) >= 0.99) > 0: r['reason'].append('clipped')
    dbv = np.where(np.isnan(db), -200, db); mx = dbv.max()
    act = dbv > mx - 35
    seg = runs(act)
    gap = 0.5 if style in ('sentence', 'emphasis') else 0.2
    merged = []
    for s in seg:
        if merged and (t[s[0]] - t[merged[-1][1]]) <= gap: merged[-1][1] = s[1]
        else: merged.append(list(s))
    imax = int(np.argmax(dbv))
    main = [m for m in merged if m[0] <= imax <= m[1]][0]
    others = [m for m in merged if m is not main and dbv[m[0]:m[1] + 1].max() > mx - 25]
    if others: r['reason'].append('extra sound %s' % ','.join('%.2f-%.2fs' % (t[a], t[b]) for a, b in others))
    r['trimmed'] = len(merged) - 1 - len(others)
    on, off = t[main[0]] - 0.005, t[main[1]] + 0.005
    if main[0] == 0 or main[1] >= len(t) - 1: r['reason'].append('touches file edge')
    r['onset'], r['offset'] = on, off; r['dur'] = off - on
    lo, hi = DUR[style]
    if not lo <= r['dur'] <= hi: r['reason'].append('duration %.2fs' % r['dur'])
    v = (f0 > 0) & (np.arange(len(t)) >= main[0]) & (np.arange(len(t)) <= main[1])
    r['voiced_s'] = 0.01 * v.sum()
    vr = runs(v); longest = max(vr, key=lambda a: a[1] - a[0]) if vr else None
    need = 1.0 if (style == 'sustained' and key == 'ah') else 0.6 if style == 'sustained' else 0.08
    if longest is None or 0.01 * (longest[1] - longest[0] + 1) < need:
        r['reason'].append('voicing %.2fs' % (0 if longest is None else 0.01 * (longest[1] - longest[0] + 1)))
    r['f0'] = float(np.median(f0[v])) if v.any() else np.nan
    # vowel nucleus: voiced frames within 15 dB of the word's peak (first to last), for timing analyses
    vn = np.where(v & (dbv > mx - 15))[0]
    r['v_on'], r['v_off'] = (t[vn[0]] - 0.005, t[vn[-1]] + 0.005) if len(vn) else (np.nan, np.nan)
    a, b = F0[gender]
    if not (a <= r['f0'] <= b): r['reason'].append('F0 %.0f Hz' % r['f0'])
    r['F1'] = r['F2'] = r['nF1'] = r['nF2'] = np.nan
    if longest is not None:
        # vowel formants: median over the voiced frames within 6 dB of the word's peak (the vowel nucleus; this keeps
        # voiced consonants such as a final /m/ out)
        pk = v & (dbv > mx - 6)
        if not pk.any(): pk = v
        r['F1'] = float(np.nanmedian(F1[pk])); r['F2'] = float(np.nanmedian(F2[pk]))
        vw = VOWEL.get(key)
        if vw is not None:
            gk = ('m' if gender == 'M' else 'w', vw); n1, n2 = N[gk]; r['nF1'], r['nF2'] = n1, n2
            # F2 upper limit: /u/ and /U/ are fronted in current American English (more so after /s t d/), /o/ too
            hi2 = 2.3 if vw in ('uw', 'oo') else 1.65 if vw == 'oa' else 1.35
            nasal = key in NASAL_CODA   # vowel nasalised before /m/: a nasal pole near 1 kHz upsets F2; check F1 only
            fits = lambda m1, m2: 0.65 <= r['F1'] / m1 <= 1.5 and (nasal or 0.7 <= r['F2'] / m2 <= hi2)
            if not (fits(n1, n2) or (gk in PB and fits(*PB[gk]))):
                r['reason'].append('vowel F1 %.0f F2 %.0f (norms %.0f/%.0f%s)' % (r['F1'], r['F2'], n1, n2, ', %d/%d' % PB[gk] if gk in PB else ''))
    # nucleus RMS: 20 ms frames (10 ms hop) within the word, those within 10 dB of the loudest
    i0, i1 = int(on * fs), int(off * fs); y = x[i0:i1]; w = int(0.02 * fs); h = w // 2
    fr = np.array([np.sqrt(np.mean(y[k:k + w] ** 2)) for k in range(0, max(1, len(y) - w), h)]) if len(y) > w else np.array([np.sqrt(np.mean(y ** 2))])
    sel = fr >= fr.max() * 10 ** (-10 / 20)
    r['nucleus_rms'] = float(np.sqrt(np.mean(fr[sel] ** 2)))
    return r


def transcript_ok(text, style, tr):
    """The model's own transcript of the take must be the stimulus (case/punctuation-insensitive); stage directions such as
    '*sighs*' or '[sigh]' mean it performed rather than read the word."""
    if re.search(r'[\[\]\*\(\)]', tr): return False
    n = lambda s: re.sub(r'\s+', ' ', re.sub(r"[^a-z' ]", ' ', s.lower())).strip()
    if style == 'sustained':
        return bool(re.fullmatch({'ah': 'a+h*', 'bod': 'b+(o+|a+w*h*)d+'}[text.lower()], n(tr).replace(' ', '')))
    return n(tr) == n(text)


def cut(fs, x, on, off):
    i0 = max(0, int((on - 0.03) * fs)); i1 = min(len(x), int((off + 0.05) * fs))
    y = x[i0:i1].copy(); n = int(0.005 * fs); ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    y[:n] *= ramp; y[-n:] *= ramp[::-1]
    return y


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('bank'); ap.add_argument('stimuli'); ap.add_argument('--hillenbrand', action='store_true')
    a = ap.parse_args(); B = os.path.abspath(a.bank); N = norms()
    stim = {r['text']: r['style'] for r in csv.DictReader(open(a.stimuli), delimiter='\t')}
    sys.path.insert(0, HERE); from tts import instructions
    # takes made with an earlier version of the speaking instructions are kept in the cache but not used
    man = [r for r in csv.DictReader(open(os.path.join(B, 'manifest.tsv')), delimiter='\t') if r['text'] in stim
           and r['instructions'] == instructions(r['model'], r['text'], r['style'], int(r['take']))]
    items = [(os.path.join(B, 'audio', 'raw', r['id'] + '.wav'), r['voice_gender']) for r in man]
    hil = []
    if a.hillenbrand:
        for w, vw in HILWORDS.items():
            if w not in stim: continue
            for g in 'wm':
                for p in sorted(glob.glob(os.path.join(HIL, 'wav', '%s??%s.wav' % (g, vw)))):
                    hil.append((w, g, p)); items.append((p, 'M' if g == 'm' else 'F'))
    tdir = os.path.join(B, 'audio', 'tracks'); tracks(items, tdir)
    tdir_lo = os.path.join(B, 'audio', 'tracks_up'); tracks(items, tdir_lo, 500)   # second ceiling (+500 Hz), for the reference QC
    rows = []
    def add(tok, key, text, style, talker, gender, source, take, raw, transcript=None):
        fs, x = rd(raw); tr = load_tr(os.path.join(tdir, os.path.basename(raw)[:-4] + '.tsv'))
        r = analyse(fs, x, tr, style, gender, key, N)
        if transcript is not None and not transcript_ok(text, style, transcript): r['reason'].insert(0, 'transcript %r' % transcript[:60])
        ok = not r['reason']; f = ''
        # LPC-check reference (README "Participant setup"): Praat medians over the middle half of the vowel nucleus at two
        # ceilings (5500/6000 F, 5000/5500 M); QC = agreement within 10 % and within +-35 % F1 / +-25 % F2 of a reference mean for the vowel
        r['refF1'] = r['refF2'] = np.nan; r['ref_qc'] = ''
        if ok and r.get('v_on') == r.get('v_on') and 'v_on' in r:
            a0 = r['v_on'] + 0.25 * (r['v_off'] - r['v_on']); a1 = r['v_off'] - 0.25 * (r['v_off'] - r['v_on'])
            med = []
            for td in (tdir, tdir_lo):
                t_, _, _, F1_, F2_ = load_tr(os.path.join(td, os.path.basename(raw)[:-4] + '.tsv'))
                k = (t_ >= a0) & (t_ <= a1)
                med.append((np.nanmedian(F1_[k]), np.nanmedian(F2_[k])) if k.any() else (np.nan, np.nan))
            (h1, h2), (l1, l2) = med; r['refF1'], r['refF2'] = h1, h2
            why = []
            if not (abs(np.log(h1 / l1)) <= np.log(1.1) and abs(np.log(h2 / l2)) <= np.log(1.1)):
                why.append('ceilings disagree (%.0f/%.0f vs %.0f/%.0f)' % (h1, h2, l1, l2))
            vw = VOWEL.get(key)
            if vw is None: why.append('no single vowel')
            else:
                gk = ('m' if gender == 'M' else 'w', vw)
                refs = [N[gk]] + ([PB[gk]] if gk in PB else [])
                if not any(abs(h1 / m1 - 1) <= 0.35 and abs(h2 / m2 - 1) <= 0.25 for m1, m2 in refs):
                    why.append('far from vowel means (%.0f/%.0f)' % (h1, h2))
            r['ref_qc'] = '; '.join(why) or 'ok'
        if ok:
            sub = 'restricted/tok' if source == 'hillenbrand' else 'audio/tok'
            f = '%s/%s.wav' % (sub, tok); wr(os.path.join(B, f), fs, cut(fs, x, r['onset'], r['offset']))
        g = lambda k, fmt='%.3f': (fmt % r[k]) if k in r and r[k] == r[k] else ''
        lead = r['onset'] - max(0.0, int((r['onset'] - 0.03) * fs) / fs) if 'onset' in r else np.nan
        rel = lambda k: ('%.3f' % (r[k] - r['onset'] + lead)) if k in r and r[k] == r[k] else ''
        rows.append({'tok': tok, 'key': key, 'text': text, 'style': style, 'talker': talker, 'gender': gender, 'source': source,
                     'take': take, 'file': f, 'rate': fs, 'dur': g('dur'), 'nucleus_rms': g('nucleus_rms', '%.5f'), 'peak': g('peak'),
                     'f0': g('f0', '%.1f'), 'F1': g('F1', '%.0f'), 'F2': g('F2', '%.0f'), 'normF1': g('nF1', '%.0f'), 'normF2': g('nF2', '%.0f'),
                     'onset': g('onset'), 'offset': g('offset'), 'lead': ('%.3f' % lead) if lead == lead else '', 'v_on': rel('v_on'), 'v_off': rel('v_off'), 'voiced_s': g('voiced_s', '%.2f'), 'trimmed': r.get('trimmed', ''),
                     'refF1': g('refF1', '%.0f'), 'refF2': g('refF2', '%.0f'), 'ref_qc': r.get('ref_qc', ''),
                     'status': 'ok' if ok else 'rejected', 'reason': '; '.join(r['reason'])})
    for m in man:
        key = m['text'].lower()
        add(m['id'], key, m['text'], m['style'], m['voice'], m['voice_gender'], 'tts:' + m['model'], int(m['take']),
            os.path.join(B, 'audio', 'raw', m['id'] + '.wav'), m.get('transcript', '') if m['model'] == PRIMARY else None)
    # fallback-model takes: kept only where the talker has too few accepted primary takes of that text
    for r in rows:
        if r['source'] != 'tts:' + PRIMARY and r['source'].startswith('tts') and r['status'] == 'ok':
            prim = [q for q in rows if q['talker'] == r['talker'] and q['text'] == r['text'] and q['source'] == 'tts:' + PRIMARY]
            if sum(q['status'] == 'ok' for q in prim) >= min(TAKES_NEEDED[r['style']], len(prim) or 1):
                r['status'] = 'spare'; r['reason'] = 'fallback model not needed'
    for w, g, p in hil:
        spk = os.path.basename(p)[:3]
        add('hil_' + os.path.basename(p)[:-4], w, w, 'word', 'hil_' + spk, 'M' if g == 'm' else 'F', 'hillenbrand', 0, p)
    cols = list(rows[0].keys())
    # Hillenbrand tokens (licence-restricted) are indexed separately under restricted/, never in the committed bank.tsv
    for name, sel in (('bank.tsv', lambda r: r['source'] != 'hillenbrand'), ('restricted/bank_hillenbrand.tsv', lambda r: r['source'] == 'hillenbrand')):
        R = [r for r in rows if sel(r)]
        if not R: continue
        os.makedirs(os.path.dirname(os.path.join(B, name)), exist_ok=True)
        with open(os.path.join(B, name), 'w', newline='') as o:
            wtr = csv.DictWriter(o, cols, delimiter='\t'); wtr.writeheader()
            for r in sorted(R, key=lambda r: (r['key'], r['talker'], r['take'])): wtr.writerow(r)
    # validation report
    tts = [r for r in rows if r['source'].startswith('tts')]
    talkers = sorted(set(r['talker'] for r in tts))
    L = ['# Voice bank validation (%s)' % os.path.relpath(B, ROOT), '',
         'Takes: %d (%d accepted, %d rejected). Hillenbrand tokens: %d (%d accepted).' % (
             len(tts), sum(r['status'] == 'ok' for r in tts), sum(r['status'] != 'ok' for r in tts),
             len(rows) - len(tts), sum(r['status'] == 'ok' for r in rows if not r['source'].startswith('tts'))), '',
         '| talker | gender | accepted / takes | median F0 (Hz) | texts with too few accepted takes |', '|---|---|---|---|---|']
    short = {}
    for tk in talkers:
        R = [r for r in tts if r['talker'] == tk]
        acc = [r for r in R if r['status'] == 'ok']
        miss = [k for k, st in stim.items() if sum(1 for r in acc if r['text'] == k) < TAKES_NEEDED[st]]
        short[tk] = miss
        f0s = [float(r['f0']) for r in acc if r['f0']]
        L.append('| %s | %s | %d / %d | %.0f | %s |' % (tk, R[0]['gender'], len(acc), len(R), np.median(f0s) if f0s else float('nan'), ', '.join(miss) or 'none'))
    q = [r for r in tts if r['status'] == 'ok' and r['ref_qc'] and r['ref_qc'] != 'no single vowel' and VOWEL.get(r['key'])]
    L += ['', '## LPC-check reference quality (accepted one-vowel takes)', '',
          'Praat nucleus medians at two formant ceilings agree within 10 %% and lie within +-35 %% (F1) / +-25 %% (F2) of a reference '
          'mean: %d of %d takes usable.' % (sum(r['ref_qc'] == 'ok' for r in q), len(q)), '',
          '| text | talkers x takes usable / accepted |', '|---|---|']
    for k in sorted(set(r['key'] for r in q)):
        Q = [r for r in q if r['key'] == k]; L.append('| %s | %d / %d |' % (k, sum(r['ref_qc'] == 'ok' for r in Q), len(Q)))
    L += ['', '## Rejected takes', '', '| text | talker | take | reason |', '|---|---|---|---|']
    for r in tts:
        if r['status'] == 'rejected': L.append('| %s | %s | %s | %s |' % (r['text'], r['talker'], r['take'], r['reason']))
    L += ['', '## One-vowel words: accepted takes vs Hillenbrand means (median over takes)', '',
          '| text | gender | F1 | F2 | norm F1 | norm F2 | n |', '|---|---|---|---|---|---|---|']
    for k in sorted(stim):
        for gg in 'FM':
            R = [r for r in tts if r['text'] == k and r['gender'] == gg and r['status'] == 'ok' and r['normF1']]
            if R: L.append('| %s | %s | %.0f | %.0f | %s | %s | %d |' % (k, gg, np.median([float(r['F1']) for r in R]), np.median([float(r['F2']) for r in R]), R[0]['normF1'], R[0]['normF2'], len(R)))
    open(os.path.join(B, 'validation.md'), 'w').write('\n'.join(L) + '\n')
    print('\n'.join(L[:20 + len(talkers)]))


if __name__ == '__main__':
    main()
