#!/usr/bin/env python3
"""Generate AI (text-to-speech) takes of labrun stimuli with OpenAI gpt-audio-1.5 (default; chat completions with
audio output) or gpt-4o-mini-tts (fallback; /v1/audio/speech), cached.

  tts.py STIMULI.tsv BANKDIR [--model M] [--voices a,b,...] [--takes N] [--jobs N] [--dry-run]

STIMULI.tsv: columns text, style (word | sentence | emphasis | sustained). Only the stimulus text (and the
speaking instructions below) is sent to the API. Takes are written to BANKDIR/audio/raw/<id>.wav (24 kHz mono
PCM16, as returned) and recorded in BANKDIR/manifest.tsv (text, style, voice, model, instructions, take, the model's
transcript of what it said (gpt-audio-1.5 only), sha256).
A take whose id is already in the manifest with a matching file is never requested again, so reruns are
deterministic and offline. The API key is read from the environment (OPENAI_API_KEY) and never written anywhere.
"""
import argparse, base64, concurrent.futures as cf, csv, hashlib, json, os, sys, time, urllib.request, wave

MODELS = ('gpt-audio-1.5', 'gpt-4o-mini-tts')
# perceived gender of each voice (checked against the takes' F0 in build_bank.py)
VOICES = {'marin': 'F', 'coral': 'F', 'sage': 'F', 'shimmer': 'F', 'nova': 'F',
          'cedar': 'M', 'ash': 'M', 'echo': 'M', 'onyx': 'M', 'verse': 'M'}
TAKES = {'word': 4, 'sentence': 2, 'emphasis': 3, 'sustained': 4}
VARIANTS = ['Speak at a normal, relaxed pace.',
            'Speak a little more slowly and carefully than usual.',
            'Speak a little more briskly than usual.',
            'Speak with slightly more vocal effort, as if the microphone were a little farther away.']
# pronunciation hints for nonwords and ambiguous spellings (sent as instructions, not spoken)
HINTS = {'bod': "'bod' rhymes with 'odd' and 'nod'.", 'bayed': "'bayed' rhymes with 'made'.", 'bode': "'bode' rhymes with 'road'.",
         'booed': "'booed' rhymes with 'food'.", 'bead': "'bead' rhymes with 'need'.", 'bide': "'bide' rhymes with 'ride'.",
         'ted': "'Ted' is the name, rhyming with 'bed'.", 'ed': "'Ed' is the name, rhyming with 'bed'.",
         'sapper': "'sapper' rhymes with 'tapper'.", 'zapper': "'zapper' rhymes with 'tapper'.", 'sop': "'sop' rhymes with 'top'.",
         'meta': "'meta' is pronounced MEH-tuh.", 'beta': "'beta' is pronounced BAY-tuh.", 'sever': "'sever' is pronounced SEV-er (to cut).",
         'abate': "'abate' is pronounced uh-BATE.", 'adept': "'adept' is pronounced uh-DEPT."}
SPOKEN = {'ted': 'Ted', 'ed': 'Ed', 'ah': 'Ahhhhhhhh.'}
BASE = {'word': ('You are a research participant in a quiet speech lab, reading a single word aloud from a computer screen into a '
                 'microphone. Say only the word, once, clearly, in natural citation form with falling intonation. Do not add any '
                 'other words, sounds or breaths.'),
        'sentence': ('You are a research participant in a quiet speech lab, reading a sentence aloud from a computer screen into a '
                     'microphone. Read it once, naturally and clearly. Say nothing else.'),
        'emphasis': ('You are a research participant in a quiet speech lab, reading a short phrase aloud from a computer screen. Read '
                     'it once, putting contrastive stress on the word in capital letters. Say nothing else.'),
        'sustained': None}
SUSTAINED = {'ah': ("You are a research participant in a quiet speech lab doing a voice task. Produce one steady, sustained 'ah' vowel "
                    "(as in 'father') for about two seconds, at a comfortable, constant pitch and loudness, like a voice test at the "
                    "doctor's. No other sounds."),
             'bod': ("You are a research participant in a quiet speech lab. Say the word 'bod' (rhymes with 'odd') once, drawing out "
                     "the vowel so that the word lasts about one and a half seconds, at a steady pitch. Say nothing else.")}


# gpt-audio-1.5: a system prompt (the stimulus text alone is the user message)
ACTOR = ('You are a voice actor reading stimuli in a speech experiment, as a participant would read them from a screen. '
         'Say exactly the {what} given, once, {how}, and nothing else.')
ACTOR_HOW = {'word': ('word', 'in natural citation form with falling intonation'),
             'sentence': ('sentence', 'naturally and clearly'),
             'emphasis': ('phrase', 'naturally, with contrastive stress on the word in capital letters')}
ACTOR_SUSTAINED = {'ah': ("You are a voice actor doing a voice task in a speech experiment. Produce one steady, sustained 'ah' vowel "
                          "(as in 'father') for about two seconds, at a comfortable, constant pitch and loudness, like a voice test at "
                          "the doctor's. No words and no other sounds."),
                   'bod': ("You are a voice actor reading a stimulus in a speech experiment. Say the word given once, drawing out its "
                           "vowel, the 'ah' of 'father' and 'odd' (not 'oo', not 'oh'), so that the word lasts about one and a half "
                           "seconds, at a steady pitch, and nothing else.")}


def instructions(model, text, style, take):
    key = text.lower()
    if model == 'gpt-4o-mini-tts':
        base = SUSTAINED[key] if style == 'sustained' else BASE[style] + (' Pronunciation: ' + HINTS[key] if key in HINTS else '')
    elif style == 'sustained':
        base = ACTOR_SUSTAINED[key]
    else:
        base = ACTOR.format(what=ACTOR_HOW[style][0], how=ACTOR_HOW[style][1]) + (' Pronunciation: ' + HINTS[key] if key in HINTS else '')
    return base + ' ' + VARIANTS[take % len(VARIANTS)]


def take_id(model, text, style, voice, take, instr):
    k = [model, text, style, voice, take, instr]
    return hashlib.sha256(json.dumps(k).encode()).hexdigest()[:16]


def request(model, text, voice, instr, key):
    """-> (pcm16 bytes at 24 kHz, transcript or '')."""
    if model == 'gpt-4o-mini-tts':
        url = 'https://api.openai.com/v1/audio/speech'
        body = {'model': model, 'voice': voice, 'input': text, 'instructions': instr, 'response_format': 'pcm'}
    else:
        url = 'https://api.openai.com/v1/chat/completions'
        body = {'model': model, 'modalities': ['text', 'audio'], 'audio': {'voice': voice, 'format': 'pcm16'},
                'messages': [{'role': 'system', 'content': instr}, {'role': 'user', 'content': text}]}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            if model == 'gpt-4o-mini-tts': return data, ''
            a = json.loads(data)['choices'][0]['message'].get('audio') or {}
            return base64.b64decode(a.get('data', '')), a.get('transcript', '') or ''
        except Exception as e:  # noqa: BLE001  (rate limits, transient errors)
            msg = str(e)
            if attempt == 4: raise RuntimeError(msg.replace(key, '***'))
            time.sleep(2 + 4 * attempt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stimuli'); ap.add_argument('bank')
    ap.add_argument('--model', default=MODELS[0], choices=MODELS)
    ap.add_argument('--voices', default=','.join(VOICES)); ap.add_argument('--jobs', type=int, default=6)
    ap.add_argument('--takes', type=int, help='takes per text (default by style); extra takes only add to the cache')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    raw = os.path.join(a.bank, 'audio', 'raw'); os.makedirs(raw, exist_ok=True)
    mpath = os.path.join(a.bank, 'manifest.tsv')
    cols = ['id', 'text', 'spoken', 'style', 'voice', 'voice_gender', 'take', 'model', 'instructions', 'transcript', 'sha256', 'bytes', 'created']
    have = {}
    if os.path.exists(mpath):
        for r in csv.DictReader(open(mpath), delimiter='\t'): have[r['id']] = r
    stim = [r for r in csv.DictReader(open(a.stimuli), delimiter='\t')]
    todo = []
    for s in stim:
        for v in a.voices.split(','):
            for t in range(a.takes or TAKES[s['style']]):
                ins = instructions(a.model, s['text'], s['style'], t); i = take_id(a.model, s['text'], s['style'], v, t, ins)
                f = os.path.join(raw, i + '.wav')
                if i in have and os.path.exists(f) and hashlib.sha256(open(f, 'rb').read()).hexdigest() == have[i]['sha256']: continue
                todo.append((i, s['text'], s['style'], v, t, ins, f))
    print(f'{len(todo)} takes to request ({sum(1 for _ in have)} cached)', file=sys.stderr)
    if a.dry_run or not todo: return
    key = os.environ['OPENAI_API_KEY']

    def one(job):
        i, text, style, v, t, ins, f = job
        spoken = SPOKEN.get(text.lower(), text)
        pcm, tr = request(a.model, spoken, v, ins, key)
        with wave.open(f, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
        return {'id': i, 'text': text, 'spoken': spoken, 'style': style, 'voice': v, 'voice_gender': VOICES[v], 'take': t,
                'model': a.model, 'instructions': ins, 'transcript': tr, 'sha256': hashlib.sha256(open(f, 'rb').read()).hexdigest(),
                'bytes': len(pcm), 'created': time.strftime('%Y-%m-%dT%H:%M:%S')}

    def save():
        with open(mpath, 'w', newline='') as o:
            w = csv.DictWriter(o, cols, delimiter='\t', extrasaction='ignore'); w.writeheader()
            for k in sorted(have, key=lambda k: (have[k]['text'], have[k]['model'], have[k]['voice'], int(have[k]['take']))): w.writerow(have[k])
    n = 0
    with cf.ThreadPoolExecutor(a.jobs) as ex:
        for fut in cf.as_completed([ex.submit(one, j) for j in todo]):
            try:
                r = fut.result(); have[r['id']] = r; n += 1
                if n % 50 == 0: save()
            except Exception as e:  # noqa: BLE001
                print('failed:', e, file=sys.stderr)
    save()
    print(f'{n} takes requested', file=sys.stderr)


if __name__ == '__main__':
    main()
