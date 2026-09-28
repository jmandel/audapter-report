# Voice bank: realistic speakers for labrun

labrun's default participant is synthetic: one Klatt vowel per syllable of the word on screen. The voice bank replaces it
with voices saying what each trial asks for (the word or sentence from `expt.listWords` or the screen), so the lab's
experiments can be run as if a person read the stimuli. **Every voice used in the runs is AI-generated** (OpenAI text to
speech). The voices are neural renditions, not recordings of people.

## Contents

| Path | What | Committed |
|---|---|---|
| `stimuli.tsv` | the texts of the public experiments (32 words, 20 Harvard sentences) with a style: `word`, `sentence` | yes |
| `tts.py` | generator: one API call per take; cache and manifest; the key comes from `OPENAI_API_KEY` | yes |
| `manifest.tsv` | every take requested: text, style, voice, model, take number, the exact speaking instructions, the model's own transcript, sha256 of the returned audio | yes |
| `tracks.praat` | Praat script (run in the `audapter-labrun` image): intensity, F0 and F1-F3 every 10 ms | yes |
| `build_bank.py` | validation, trimming and the index | yes |
| `bank.tsv` | one row per take: talker, gender, source, take, status (`ok`, `rejected`, `spare`) and reason, word onset/offset, vowel nucleus, F0, F1/F2 against reference means, nucleus RMS | yes |
| `validation.md` | per-talker acceptance, every rejected take with its reason, vowel formants against reference means | yes |
| `audio/raw/`, `audio/tok/`, `audio/tracks/` | the takes as returned (24 kHz), the trimmed tokens, the Praat tracks | no (about 100 MB; see below) |
| `restricted/` | Hillenbrand et al. (1995) "head"/"hood" tokens and their index | never (licence) |

Unpublished experiments have their own stimulus list, manifest and bank under `audit/private/labrun/voices/`
(gitignored). labrun loads both banks when present.

## How the takes were made

- **Model.** `gpt-audio-1.5` through `/v1/chat/completions` with audio output (`pcm16`, 24 kHz mono). The system prompt
  asks a voice actor to read the stimulus as a participant would from a screen, once, in citation form (words) or
  naturally (sentences), and nothing else; the user message is the stimulus text alone. Pronunciation hints for
  non-words and ambiguous spellings (`bod` rhymes with *odd*, `bayed` with *made*, ...) are part of the system prompt.
  Four takes per word (two per sentence) vary the instruction: normal pace, a little slower, a little brisker,
  slightly more vocal effort. `gpt-4o-mini-tts` (`/v1/audio/speech`) was tried first; its takes stay in the manifest and
  are used only where a talker lacks accepted `gpt-audio-1.5` takes (none of the talkers used in the runs needed it).
- **Only stimulus text is sent**: words and sentences as shown on screen, plus the speaking instructions in `tts.py`.
- **Voices.** Ten voices, five perceived female (marin, coral, sage, nova, shimmer) and five perceived male (cedar,
  verse, echo, ash, onyx). The labrun reruns use eight: **marin, coral, sage, nova** (F; median F0 151-184 Hz) and
  **cedar, verse, echo, ash** (M; 94-126 Hz). shimmer (median F0 146 Hz) and onyx (82 Hz) are kept as spares.
- **Cache.** A take is identified by a hash of (model, text, style, voice, take number, instructions). Rerunning
  `tts.py` requests only takes that are not in the manifest with a matching file, so runs are reproducible offline once
  the audio is cached. The audio is not committed (about 100 MB); `manifest.tsv` holds the sha256 of every take used.
  Requesting the same takes again gives different audio: the model is not deterministic.
- **Licensing.** The generated audio is ours to use under OpenAI's terms. Anywhere it is played or plotted it is labelled
  AI-generated.

## Validation (build_bank.py)

For each take, from its Praat tracks:
- **Word boundaries.** The word is the loudest run of 10 ms frames within 35 dB of the take's peak (gaps up to 0.2 s
  merged; 0.5 s in sentences). A take is rejected if other sound within 25 dB of the peak lies outside it (a second
  word, a repetition, a spoken reply), if the word touches the start or end of the file, or if it is too short or too
  long for its style. Weaker leading or trailing sound is cut off.
- **What was said.** `gpt-audio-1.5` returns a transcript of its own audio; it must equal the stimulus (case and
  punctuation ignored). Stage directions (`*sighs*`, `[sigh]`) reject the take: the model performed the word instead of
  reading it. This caught, for example, "Help the woman get back to her feet." answered as a request, and "sigh" sighed.
- **Signal.** No sample at or above 0.99 of full scale (clipping), not silent, at least 80 ms of voicing (1 s for the
  sustained "ah").
- **F0** plausible for the voice's gender: median over voiced frames 120-320 Hz (F) or 70-190 Hz (M).
- **Vowel formants** of one-vowel words (median F1/F2 over voiced frames within 6 dB of the word's peak) near the mean
  for that vowel and gender in Hillenbrand et al. (1995) or Peterson & Barney (1952): F1 0.65-1.5x, F2 0.7-1.35x. /u/
  and /U/ may have F2 up to 2.3x and /o/ up to 1.65x (fronted in current American English, more so after /s t d/); before
  a nasal coda only F1 is checked (the nasalised vowel's F2 is not measurable this way). Two references are used because
  Hillenbrand's Michigan talkers have a raised /ae/: the AI voices' "bat"/"bad" (F1 about 1050 Hz, F2 about 1800 Hz for
  the female voices) are far from Hillenbrand's /ae/ but close to Peterson & Barney's.
- **Accepted takes** are cut from 30 ms before the word to 50 ms after it, with 5 ms fades. The index records the word
  onset within the cut token, the vowel nucleus (voiced frames within 15 dB of the peak) and the nucleus RMS (20 ms frames
  within 10 dB of the loudest).

Result (public stimuli): 1665 of 1842 takes accepted; each of the ten voices has at least two accepted takes of every
word and one of every sentence. Private stimuli: see `audit/private/labrun/voices/validation.md`. Per-talker counts,
every rejection and the formant table are in `validation.md`.

## How labrun uses it

`LR_VOICE=<talker> labrun PLAN.m` (or `tools/runvoices.sh`, which runs plans x talkers into
`results/<plan>_voices/<talker>/`) makes that talker the participant for the whole session; its gender replaces the
plan's (the "above 5' 8''" question and the lab's gender-dependent LPC order follow it). Per trial
(`shim/core/lr_input_voice.m`):
- the text requested (word from the script's list at its trial index, else the on-screen text) selects the talker's
  accepted takes of that text; repetitions cycle through them, so consecutive repetitions differ;
- the token is scaled so that its vowel nucleus has RMS 0.05, as the synthetic vowels are, with 0.30 s (+-15 %, seeded)
  of silence before it and 0.25 s after, plus the plan's microphone floor (-80 dBFS) throughout;
- on-screen feedback: "louder"/"softer" scale the level (+-3 dB, as before). "Slower"/"faster" pick one of the talker's
  longer or shorter takes; no time-stretching is applied (it would alter the formants);
- rest trials ("xx", "+", no text) are silent; a text with no accepted take falls back to the synthetic vowel and is
  flagged `FALLBACK` in the trial's input description (no run used a fallback);
- plans may set `plan.voiceStyle = 'sustained'` (sustained-phonation tasks) to use the sustained takes;
- the trial's input description gives the token, talker, take, word onset, duration and vowel nucleus.

## Limits

- **AI voices are not people.** They are clean, steady studio renditions: no breath noise, no room, no microphone
  distance changes, and less token-to-token variability than a participant. They say the words as
  a fluent American speaker would, with the vowel qualities of current American English (e.g. a low /ae/, fronted /u/).
- **Sibilants.** The AI voices' /s/ is loud: median /s/ RMS 5.8 dB below the vowel peak in s-initial words, against
  12-22 dB in the human recordings we have. Anything that depends on /s/ level relative to the vowel (for example an
  OST intensity rule placed at /s/ offset) is not representative with these voices.
- **Sustained vowels.** The sustained "ah" takes start abruptly, like the synthetic vowel; they do not reproduce soft or
  breathy onsets.
- **Bandwidth.** Output is 24 kHz, so there is nothing above 12 kHz. That covers Audapter's internal rates (16 or
  24 kHz) but not a 48 kHz analysis of the device signal.
- **Real recordings of the exact words** exist only for "head" and "hood" (Hillenbrand et al. 1995; licence-restricted,
  16 kHz, so nothing above 8 kHz and not usable for /s/ or other high-frequency analyses). They are indexed separately
  under `restricted/`, never committed, and used only for the check below, not in a session (one token per person cannot
  make a participant who repeats a word). No other corpus in `audit/corpus` has the stimulus words with alignments (its
  ARCTIC and LibriSpeech clips are four sentences and six short phrases).

## Check against real recordings

`check_head.m` runs "head" through Audapter at the lab's formant settings (getAudapterDefaultParams, field mode, F1
+-125 mel, bGainAdapt 0 as sent) and compares the output level of the shifted trial with the unshifted trial of the same
token, over the frames Audapter logged as shifted (median [range]):

| tokens | tracked F1 / F2 (Hz) | F1 +125 mel | F1 -125 mel | down minus up |
|---|---|---|---|---|
| AI, 4 female voices x 2 takes | 786 / 2139 | -1.9 [-3.0, -0.3] dB | +4.3 [+2.5, +5.9] dB | +6.5 [+3.4, +8.1] dB |
| Hillenbrand, 34 women | 698 / 2008 | -1.3 [-4.3, +1.6] dB | +5.3 [+2.3, +8.8] dB | +6.1 [+1.3, +13.1] dB |
| AI, 4 male voices x 2 takes | 662 / 1878 | -2.6 [-3.4, -1.9] dB | +3.9 [+2.6, +4.2] dB | +6.6 [+4.6, +7.4] dB |
| Hillenbrand, 27 men | 574 / 1758 | -2.2 [-4.9, +2.8] dB | +7.0 [+3.8, +12.3] dB | +9.2 [+6.8, +17.2] dB |

The AI voices fall inside the range of the real talkers, with less spread; for men they sit at the low end. (Of the 186
Hillenbrand tokens indexed, 63 were rejected, mostly for samples at full scale.)

## Rebuilding

```
set -a; . <file with OPENAI_API_KEY>; set +a
python3 tts.py stimuli.tsv .                      # only missing takes are requested
python3 build_bank.py . stimuli.tsv [--hillenbrand]
LR_TALKERS="marin coral sage nova cedar verse echo ash" ../tools/runvoices.sh ../plans/coAdapt.m
python3 ../tools/compare_voices.py ../results/coAdapt ../results/coAdapt_voices --by cond,word
```
