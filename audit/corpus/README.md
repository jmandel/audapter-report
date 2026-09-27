# Real-speech test corpus for Audapter

This directory holds a small corpus of real speech for testing Audapter headlessly. There are 80 short clips (0.44–4.7 s, 197 s in total), each one mono, 48 kHz (Audapter's device rate) and 16-bit.

Every clip may be redistributed under its source's licence. The set was built to exercise:
- formant tracking and perturbation;
- pitch perturbation;
- OST timing.

It covers men, women, children, singers, disordered voices and noisy recordings. The tests that use it live in `../harness/oct/corpus_*.m`, and their results are summarised below. Detailed findings are in `../notes/corpus.md` and in `../FINDINGS-LOG.md` (entries CORPUS-n).

## What is in the set

| Source (licence) | Clips | Speakers | Content | Ground truth / reference shipped |
|---|---|---|---|---|
| CMU ARCTIC, festvox.org (CMU licence: free for any use, keep notice, mark changes) | 19 | 7 adults (5 M, 2 F; US, Canadian, Scottish, Indian English) | 4 short sentences | Forced-alignment phone labels (`gt/*.phones.csv`, original `.lab`) and pitch marks (`gt/*.pm.csv`) |
| speechocean762, OpenSLR 101 (CC BY 4.0) | 8 | Children aged 6–7 (4 F, 4 M), Mandarin L1 reading English | Digit strings, short sentences | Transcript and expert pronunciation scores (manifest) |
| LibriSpeech dev-clean, OpenSLR 12 (CC BY 4.0) | 6 | 6 adults (3 F, 3 M) | 3–4 word phrases | Transcript |
| VoiceBank-DEMAND test set, Edinburgh DataShare doi:10.7488/ds/2117 (CC BY 4.0) | 8 | 2 adults (VCTK p232 M, p257 F) | Short sentences in real noise (bus, cafe, office, living room, public square) at 2.5 and 7.5 dB SNR | Sample-aligned clean counterpart (`gt/vbd_*.clean.wav`), noise type and SNR |
| Perceptual Voice Qualities Database, Mendeley Data doi:10.17632/9dz247gnyb.4 (CC BY 4.0) | 19 | 10 speakers aged 14–69 (5 F, 5 M), 6 typical and 4 dysphonic (tremor, atrophy, 2× MTD) | Sustained /a/ and /i/ (CAPE-V) | CAPE-V severity rating and diagnosis |
| VocalSet, Zenodo 1442513 (CC BY 4.0) | 6 | 3 trained singers (2 F, 1 M) | Sung sustained /a/ and /i/ (F0 ≈ 253–333 Hz) | None (Praat reference) |
| vocadito, Zenodo 5578807 (CC BY 4.0) | 3 | 3 singers | Sung phrases | Expert frame-level F0 annotation (`gt/vocadito_*.f0.csv`) |
| Audapter example trials: shanqing-cai/audapter_matlab `example_data` (MIT) and audapter_mex `mcode` (Apache-2.0) | 3 | 1 F, 2 M (lab participants) | Mandarin syllables (2008); one English sentence (2013) | The online Audapter log from the original session (`gt/*.audapter_online.mat`: fmts, sfmts, rms, ost_stat, full params) |
| elainekearney/audapter_matlab fork (MIT) | 2 | 1 F, 1 M | Sustained /i/, the upstream time-domain pitch-shift demo files | None |
| carrien/free-speech (MIT, Niziolek lab) | 2 | 1 speaker | "dipper" and "tipper" (0.5 s) | None |
| Praat source tree (GPL-3.0-or-later) | 4 | 1 speaker | hVd words heed, hid, hood, hud (11 kHz originals) | None |

By group, the 80 clips are:

| Group | Clips |
|---|---|
| adult male | 30 |
| adult female | 25 |
| child | 8 |
| teen female | 2 |
| singer | 9 |
| unknown-sex adult | 6 |

The highest F0 in the set is about 350 Hz. There is no F0 above 400 Hz, and no hand-measured formants among the redistributable clips (see "Restricted sources" below).

Every clip also has two automatic references, which are not ground truth:
- `ref/<id>.praat.csv`: Praat F0 and F1–F3 every 10 ms. The tests use these only where Praat and an independent LPC agree within 10 %.
- `ref/<id>.energy.csv`: energy-based speech segments.

## Layout
```
audio/<id>.wav            the clips (48 kHz mono PCM16, original level: NOT normalised; tests normalise at load time)
gt/                       ground truth and original label files (see table)
ref/                      automatic Praat / energy references
licenses/                 licence notices that must travel with the clips (CMU ARCTIC)
manifest.csv/.json/.tsv   one row per clip (see below); .tsv is the Octave-friendly subset
fetch.sh                  re-fetch originals from stable URLs, rebuild, verify byte-for-byte
fetch_restricted.sh       fetch the licence-restricted Hillenbrand (1995) data locally (never committed)
tools/                    build_corpus.py, fetch_sources.py, sources.lock.json (pinned sha256 of every original),
                          requirements.txt (pinned toolchain), pvqd_file_ids.json, hillenbrand_index.py
restricted/               (gitignored) local restricted data
.cache/                   (self-ignoring) downloaded originals, python venv, rebuild output
```

Manifest columns:
- **Identity and source:** `id`, `path`, `source`, `source_url`, `license`, `speaker`, `sex`, `age`, `group`, `content`, `orig_file`, `orig_sr`, `orig_url`, `orig_sha256`.
- **Clip:** `clip_start_s` and `clip_end_s` (within the original), `dur_s`, `peak_dbfs`, `rms_dbfs`, `sha256`.
- **References:** `gt_file`, `gt_type`, `ref_praat`, `ref_energy`.
- **Notes:** `notes`, plus per-source extras (`snr_db`, `noise`, `capev_severity`, `diagnosis`).

Clips were cut from the originals, converted to mono and resampled to 48 kHz with `scipy.signal.resample_poly`. That counts as a modification under the CMU and CC BY licences, and is recorded per clip. Original levels are kept, except that a peak at or above 1.0 would be scaled; none needed it.

## Reproducing the corpus
The committed files are fully reproducible from the original sources:
```
./fetch.sh            # downloads ~45 MB of originals (range requests; archives are never fetched whole),
                      # verifies each against tools/sources.lock.json, rebuilds into .cache/rebuild and checks
                      # every clip's sha256 against manifest.csv plus a byte compare of audio/ gt/ ref/ manifest.*
./fetch.sh --install  # same, then overwrite the committed files with the rebuild
```

All sources are pinned. Individual files are read by HTTP range requests.

| Source | Where it is fetched from |
|---|---|
| CMU ARCTIC | festvox.org per-file URLs |
| Hugging Face datasets | Parquet files at a fixed commit: speechocean762 @0638558, openslr/librispeech_asr @71cacbf |
| VoiceBank-DEMAND | DataShare bitstream UUIDs |
| PVQD | Mendeley Data version-4 file ids |
| VocalSet, vocadito | Zenodo record files |
| GitHub files | Raw URLs at a fixed commit |

Rebuilding needs `uv` (or python3 -m venv) and python 3.12. The toolchain is pinned in `tools/requirements.txt`, so the rebuild is byte-identical, including the Praat references and the .mat headers. A checksum mismatch or a moved URL makes `fetch.sh` fail loudly.

## Restricted sources (not committed)
**Hillenbrand, Getty, Clark & Wheeler (1995)** is the only set here with hand-corrected formants: 1,668 hVd tokens from men, women and 10–12-year-old children. The original distribution states no licence or redistribution terms.

`./fetch_restricted.sh` fetches it into `restricted/hillenbrand/`, which is gitignored:
- It downloads the copy that Santiago Barreda hosts "with permission from Jim Hillenbrand" at a pinned commit.
- It prints the terms and the citation.
- It verifies 11 pinned checksums, then unzips and rebuilds `index.tsv`.
- It is idempotent, and it fails loudly on a mismatch.

`harness/oct/corpus_hillenbrand.m` uses the data when it is present and prints `SKIP` otherwise. Its results below are numbers only. Do not publish audio derived from it.

Promising sources that were not used, for licence reasons (nothing was downloaded in bulk):

| Source | Reason not used |
|---|---|
| VTR-TIMIT formant tracks, TIMIT, MOCHA, Saarbruecken Voice Database, PF-STAR / CSLU / CMU Kids / MyST children's corpora | LDC or research-only licences |
| Common Voice | CC0, but downloads need an account and consent |
| VCTK | CC BY 4.0, but only as an 11 GB archive (VoiceBank-DEMAND already covers two VCTK speakers) |
| GitHub copies without a licence: LizHellerMurray/Audapter_schoolage (paediatric Audapter trials, with consent unclear), GuentherLab audapter_matlab and study repos, busplab-VSP hVd samples, SpAA-LAB sustained vowels | No licence stated |
| Alice-Sabrina-Ivy/Syrinx | Re-hosts Hillenbrand as "public domain", which the source does not support |

Also noted but not used:
- Minsk2020 ALS sustained vowels (GPL-3.0): clinical data.
- idiap SustainedVowelBoundaries examples: unknown speakers.
- mmorise/World `vaiueo2d.wav` (BSD): Japanese vowels.
- Parselmouth and praatio sample files: unknown provenance.

## Running the real-speech tests
From `audit/harness`, with the docker image and builds described in `harness/README.md`:
```
./run-corpus.sh                                  # everything; PASS/FAIL/SKIP lines, logs in logs/corpus_*.log
./run-oct.sh corpus_track.m                      # one test
SCEN=pt-5 ./run-oct.sh corpus_report.m           # real-speech re-run of one report finding -> oct/out/report/pt-5/real/
```

| Script | What it does |
|---|---|
| `corpus_track.m` | Audapter's formant tracker against the Praat and independent-LPC references: by speaker group, by vowel (ARCTIC phone labels), and in an nLPC sweep |
| `corpus_hillenbrand.m` | The tracker against Hillenbrand's hand-corrected formants (restricted data; local only) |
| `corpus_shift.m` | Formant shifts (F1 +20 %, F2 −20 %, diagonal) and pitch shifts (pvoc ±2 st; time-domain +1 st with default and demo frame settings): commanded vs logged vs measured in the output |
| `corpus_ost.m` | The example_data `ost` on multi-word utterances against forced-alignment and energy references at three levels, plus cross-trial leak tests |
| `corpus_regress.m` | Replays the three real online Audapter trials with their original parameters |
| `corpus_diff_run.m` / `corpus_diff.m` | blab against upstream 2.1.5, bit-exact, over the whole corpus (8 scenarios), plus an output sanity sweep. `VARIANT=asan SCEN=noost` runs the ASan/UBSan build over the corpus |
| `corpus_report.m` | Re-runs the report's main findings on real speech and exports WAV and JSON |
| `corpus_tdshang.m`, `corpus_pvoc_lf.m` | Minimal reproductions of CORPUS-10 and CORPUS-7 |

Caveats:
- This is Octave, not MATLAB, and the offline `runFrame` path.
- Input levels are normalised to an active-speech RMS of 0.05, with rmsThresh 0.005.
- The Praat references are automatic, so tracker results on non-Hillenbrand clips use "consensus frames", where two independent estimators agree.

## Results
Status as of 2026-09-27, on the blab build unless stated otherwise.

**Formant tracking.** Against Hillenbrand's hand-corrected formants (576 tokens: 12 talkers × 12 vowels × 4 groups):
- The default presets are within 1.3–2.0 % median, i.e. 10–27 Hz. This holds for men, women, boys and girls (10–12 y), and at every F0 band up to 400 Hz. Gross errors (> 20 %) are 0–3.5 %.
- nLPC must be ≥ 15 for men; 13–17 is fine for women and older children.
- Against the consensus references on real connected speech, adult male and female error is 0.5–2.3 %.

Two exceptions:
- **CORPUS-3:** for 6–7-year-old children the female preset underestimates F2 by ~12 % (gross errors 18 %). nLPC 11 gives ~2 %. There is no child preset.
- **CORPUS-4:** on one male sustained /a/ (F1 630, F2 1000 Hz) the male preset reports F3 as F2 for the whole token.

**Formant shifting (78 clips).**
- Logged sfmts/fmts equals the commanded ratio exactly on every clip and in every group.
- The shift measured independently in the output is within a median of 2–3 %.
- Deviations only appear where the measurement is weak: singing at F0 ≥ 260 Hz, and the CORPUS-4 token.

**Pitch shifting.**
- The phase vocoder is accurate to < 3 cents on clean speech.
- **PT-5 on real voices:** 0 st is +3.5 dB. Going to +2 st drops the level by 2.5–10.3 dB (medians 4.3 dB for men, 5.0 dB for women, 4.4 dB for children). The step heard at a mid-utterance onset is 1.2–7.3 dB. The synthetic card quotes 0.8–8.8 dB.
- **CORPUS-7:** the pvoc path also boosts content below 100 Hz, by up to +7 dB. Low-frequency noise therefore rises ~3.8 dB relative to speech.
- **CORPUS-8:** with the default frame settings, the time-domain shifter's pitch tracker (logged `pitchHz`) reports about twice F0 for most voices below ~200 Hz. The heard shift stays close to +1 st. With frameLen 64 / nDelay 7 (the TDS demo settings) the tracker is right.
- At F0 ≈ 262 Hz the time-domain shift is heard as +90 cents instead of +100, which confirms the known 17f.

**Hang (CORPUS-10).** On one real sung clip, changing frameLen/nDelay between trials made `runFrame` loop forever:
- The formant tracker is not rebuilt, so it produces NaN LPC coefficients.
- `hqr_roots` has no iteration cap, so NaN input never terminates.

**OST.**
- **Onset:** the onset rule is robust on real speech. It fires a median 39 ms after the first vowel at nominal level, never early in noise.
- **INTENSITY_FALL as "end of word 1":** it never lands on the true word boundary in connected speech (0/19). It fires at the next pause, 0.3–1.1 s later depending on level, and mostly never fires in 2.5 dB SNR noise.
- **OST-F1** is confirmed on real speech (4 of 6 trial pairs). After a long trial, a short trial's fall came 0.04–0.79 s late or never. An F1 +30 % perturbation was applied for 0.32 s that should not have been applied at all. The example `ost` pattern does not leak.
- **OST-F2** is confirmed exactly (timeout 0.2/0.4/0.6/0.8/1.0 s; 2 ms hold).

**Other report findings on real speech.** Exports are in `harness/oct/out/report/<id>/real/`.
- **F6 dropout fix:** blab perturbs 2.0× as many frames as upstream with a restricted field (61/80 clips). On a sentence, upstream shifts one 0.3 s span and blab shifts seven spans across later words.
- **I-01:** the masking-noise gap (5.1–10.0 s) is confirmed.
- **I-02:** the fb 5 speech-to-playback balance moves by 20·log10(dScale), as predicted.
- **OST-F8:** on real /sh/ onsets the card's thresholds rarely fire, so the hold difference is only visible in 2 of 4 clips.

**Replays and safety.**
- Replaying the 2008 online trials reproduces the logged formant tracks within 0.2–0.4 %.
- **CORPUS-11:** replaying their parameters under today's MATLAB defaults turns the mel-unit pertAmp into a ratio. That gives shifted F1 targets up to 130 kHz and output +24 dB, with no guard.

**Differential and sanitizers.**
- blab is bit-identical to upstream 2.1.5 on all 80 clips for tracking, whole-plane field shift, PCF formant, pvoc, PCF pitch, TDS and DAF. The only difference is the restricted-field dropout fix.
- ASan/UBSan over 480 clip-scenarios found nothing new: the known Audapter.cpp:2124 DAF read (H2), and the known ost.cpp:361 read (OST-F3), which aborts the OST scenarios.
- No NaN, Inf or clipping appeared at sane settings.

## Attribution
- Kominek & Black (2003), CMU ARCTIC databases.
- Zhang et al. (2021), speechocean762, Interspeech.
- Panayotov et al. (2015), LibriSpeech, ICASSP.
- Valentini-Botinhao (2017), Noisy speech database, University of Edinburgh, doi:10.7488/ds/2117.
- Walden (2022), Perceptual Voice Qualities Database, Mendeley Data, doi:10.17632/9dz247gnyb.4.
- Wilkins et al. (2018), VocalSet, ISMIR, doi:10.5281/zenodo.1442513.
- Bittner et al. (2021), vocadito, doi:10.5281/zenodo.5578807.
- Audapter (Cai, Guenther et al.; MIT / Apache-2.0).
- E. Kearney fork of audapter_matlab (MIT).
- C. Niziolek, free-speech (MIT).
- P. Boersma & D. Weenink, Praat (GPL-3.0-or-later).
- Restricted, local use only: Hillenbrand et al. (1995), JASA 97(5):3099-3111.
