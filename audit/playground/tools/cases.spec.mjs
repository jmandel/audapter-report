// The report's test cases for the Playground. Each case replays the command stream that the card's export script
// (audit/harness/oct/report_*.m) sent to Audapter, captured by audit/playground/tools/capture-cases.sh, and compares the
// replay with the numbers the card shows (read from the same export's data.json).
// variants: which captured section to run, in one Audapter session ("session") or each trial in a fresh instance ("fresh").
// checks(data): the card's key numbers -> [{label, variant, trial (0-based), metric, want, tol}]; the page computes metric.
const nn = v => (v === null || v === undefined ? NaN : v);
export const CASES = {
  'OST-F1': {
    title: 'OST state carries over between trials', dir: 'ost-f1',
    summary: 'Shift the first word (F1 +125 mel in OST state 2); after a long catch trial the next trials detect word 1\'s end late, so the shift runs through word 2.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'observed', mode: 'fresh', label: 'Expected: every trial in a fresh Audapter (what the one-line fix gives)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: one Audapter session, as run' }],
    checks: d => d.leak.shift_obs.flatMap((v, k) => [
      { label: `trial ${k + 1}: seconds of shift`, variant: 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 },
      { label: `trial ${k + 1}: seconds of shift`, variant: 'expected', trial: k, metric: 'shift_s', want: d.leak.shift_exp[k], tol: 0.011 },
      { label: `trial ${k + 1}: shift ends`, variant: 'observed', trial: k, metric: 'off', want: nn(d.leak.off_obs[k]), tol: 0.011 },
      { label: `trial ${k + 1}: word 1 end detected (state 3)`, variant: 'observed', trial: k, metric: 't3', want: nn(d.leak.t3_obs[k]), tol: 0.011 }]),
    key: 'Trial 4: the shift is expected to stop at 0.53 s (end of word 1); observed, it runs to 1.29 s, through word 2.',
  },
  'OST-F2': {
    title: 'The maxIOI timeout drifts across trials', dir: 'ost-f2',
    summary: 'A soft vowel never reaches the onset level, so a 0.2 s maxIOI timeout starts the sequence; loaded once, the timeout fires at 0.2, 0.4, 0.6 s and state 3 follows after 2 ms instead of 100 ms.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'expected', mode: 'session', label: 'Expected: the intended timing (two ELAPSED_TIME rules, no maxIOI; its states renumbered to match)', stateOffset: 1 },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: the maxIOI OST loaded once, three trials with reset only' }],
    checks: d => [
      ...d.state2_s.map((v, k) => ({ label: `trial ${k + 1}: timeout (state 2)`, variant: 'observed', trial: k, metric: 'st2', want: v, tol: 0.003 })),
      ...d.state3_s.map((v, k) => ({ label: `trial ${k + 1}: state 3`, variant: 'observed', trial: k, metric: 't3', want: v, tol: 0.003 })),
      ...d.shift_on_s.map((v, k) => ({ label: `trial ${k + 1}: shift starts`, variant: 'observed', trial: k, metric: 'on', want: v, tol: 0.003 })),
      { label: 'control: state 2 (timeout)', variant: 'expected', trial: 0, metric: 'st2', want: d.ctrl_state2_s, tol: 0.003 },
      { label: 'control: shift starts', variant: 'expected', trial: 0, metric: 'on', want: d.ctrl_shift_on_s, tol: 0.003 }],
    key: 'Observed timeouts 0.202 / 0.404 / 0.606 s with state 3 two milliseconds later; expected 0.202 s and 0.304 s every trial.',
  },
  'COORD-1': {
    title: 'An OST/PCF from an earlier block overrides a field experiment', dir: 'coord-1',
    summary: 'A calibration block loads measureFormants.ost/.pcf; the field-mode experiment that follows (F1 +125 mel on "shift" trials) never shifts, because the stale PCF wins unless the runner clears it.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'exp', mode: 'session', label: 'Expected: the runner clears the OST and PCF before the experiment' },
      { name: 'observed', section: 'obs', mode: 'session', label: 'Observed: without the two clear lines' }],
    checks: d => ['exp', 'obs'].flatMap(a => d[a].shift_s.map((v, k) => ({ label: `trial ${k + 1} (${d.sequence[k]}): seconds of shift`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 }))),
    key: 'Shift trials 3 and 5: 0.44 s of F1 +125 mel expected, 0 s observed.',
  },
  'OST-F5': {
    title: 'A PCF pitch shift leaks into catch trials', dir: 'ost-f5',
    summary: 'The PCF\'s +2 st overwrites pitchShiftRatio; when a catch trial clears the PCF instead of loading a zero one, the stale ratio stays and the catch trial is shifted +200 cents.',
    build: 'lite', metric: 'pitch', ostStates: true,
    variants: [
      { name: 'expected', section: 'exp', mode: 'session', label: 'Expected: catch trials load an all-zero PCF' },
      { name: 'observed', section: 'obs', mode: 'session', label: 'Observed: catch trials clear the PCF' }],
    checks: d => ['exp', 'obs'].flatMap(a => d[a].cents.flatMap((v, k) => [
      { label: `trial ${k + 1} (${d.sequence[k]}): output F0 re input (cents)`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'cents', want: v, tol: 12 },
      { label: `trial ${k + 1}: logged pitchShiftRatio`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'ratio_logged', want: d[a].ratio_logged[k], tol: 1e-6 }])),
    key: 'Catch trials 2 and 4: 0 cents expected, +200 cents observed.',
  },
  'I-01': {
    title: 'Masking noise shorter than 10 s leaves a silent gap', dir: 'i-01',
    summary: 'Playback loops at 480 000 samples, not at the noise length: 5 s of noise is followed by 5 s of silence, and the gap position carries over between trials.',
    build: 'full', metric: 'noise', ostStates: false,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'patched', label: 'Expected: the noise loops at its own length (patched build)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: shipped build (fb 2, noise only, 5 s noise)' },
      { name: 'carryover', section: 'carryover', mode: 'session', label: 'Observed: two 4 s trials, noise loaded once' }],
    checks: d => { const g = Array.isArray(d.gaps[0]) ? d.gaps[0] : d.gaps; return [
      { label: 'noise stops (s)', variant: 'observed', trial: 0, metric: 'gap_start', want: g[0], tol: 0.021 },
      { label: 'noise resumes (s)', variant: 'observed', trial: 0, metric: 'gap_end', want: g[1], tol: 0.021 },
      { label: 'patched: silent stretches longer than 20 ms', variant: 'expected', trial: 0, metric: 'gap_count', want: 0, tol: 0 },
      { label: 'second trial: noise stops (s into the trial)', variant: 'carryover', trial: 1, metric: 'gap_start', want: d.trial2_gap_start_s, tol: 0.021 }]; },
    key: 'Noise from 0 to 5 s, silence from 5 to 10 s; in a second trial the noise stops 1.0 s in.',
  },
  'LAB-1': {
    title: 'vsaCentralize: the committed runner\'s field', dir: 'vsa-centralize', dataFrom: 'vsa-centralize',
    summary: 'The public vsaCentralize runner sends the 2-D field with lower-case grid fields; this replays its exact parameter sequence at strength 0 and 0.5 and compares the heard formants with the intended pull toward the centre.',
    build: 'lite', metric: 'formant', ostStates: false, vowels: ['iy', 'ae', 'aa', 'uw', 'ih', 'eh'],
    variants: [
      { name: 'observed', section: 'cent', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (six vowels each), after one warm-up trial' }],
    checks: d => ['s00', 's05'].flatMap((tag, si) => d.cent[tag].flatMap((e, v) => [
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F1 (Hz)`, variant: 'observed', trial: 1 + si * 6 + v, metric: 'heard_f1', want: e.heard_hz[0], tol: 3 },
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F2 (Hz)`, variant: 'observed', trial: 1 + si * 6 + v, metric: 'heard_f2', want: e.heard_hz[1], tol: 3 }])),
    intended: d => d.cent.s05.map(e => ({ vowel: e.vowel, prod: e.prod_hz, heard: e.heard_hz, intended: e.intended_hz })),
    key: 'At strength 0.5 the heard formants differ from the intended pull toward the centre; the table lists heard vs intended per vowel.',
  },
  'LAB-2': {
    title: 'vsaGeneralize: the committed runner\'s field', dir: 'vsa-generalize', capture: 'LAB-1',
    summary: 'The public vsaGeneralize runner scales the 1-D field (all zeros) per trial while the full-strength 2-D field stays loaded; this replays its exact parameter sequence at strength 0 and 0.5.',
    build: 'lite', metric: 'formant', ostStates: false, vowels: ['iy', 'ae', 'aa', 'uw', 'ih', 'eh'],
    variants: [
      { name: 'observed', section: 'gen', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (six vowels each), after one warm-up trial' }],
    checks: d => ['s00', 's05'].flatMap((tag, si) => d.gen[tag].flatMap((e, v) => [
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F1 (Hz)`, variant: 'observed', trial: 1 + si * 6 + v, metric: 'heard_f1', want: e.heard_hz[0], tol: 3 },
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F2 (Hz)`, variant: 'observed', trial: 1 + si * 6 + v, metric: 'heard_f2', want: e.heard_hz[1], tol: 3 }])),
    key: 'Already at strength 0 the full-strength 2-D field shifts every vowel; the table lists heard vs produced.',
  },
  'LAB-3': {
    title: 'vsaGeneralize generalization phases: fb 4 gain not forwarded', dir: 'vsa-fb4', capture: 'LAB-1',
    summary: 'The runner sets p.fb4Gain = 0.98, a field AudapterIO never sends, so the speech-modulated noise plays at Audapter\'s default fb4GainDB of 10 dB instead of about 0 dB.',
    build: 'lite', metric: 'noise', ostStates: false,
    variants: [
      { name: 'expected', section: 'fb4_intended', mode: 'session', label: 'Expected: fb4GainDB = 20 log10(0.98)' },
      { name: 'observed', section: 'fb4_committed', mode: 'session', label: 'Observed: the committed runner (fb4GainDB stays 10 dB)' }],
    checks: d => [
      { label: 'output RMS (signalOut)', variant: 'observed', trial: 0, metric: 'rms_out', want: d.fb4.rms_committed, tol: 0.0005 },
      { label: 'output RMS (signalOut)', variant: 'expected', trial: 0, metric: 'rms_out', want: d.fb4.rms_intended, tol: 0.0005 }],
    key: 'The committed runner plays the noise about 10 dB louder than intended.',
  },
  'F6': {
    title: 'The dropout fix re-arms the field shift on every re-entry', dir: 'f6',
    summary: 'A restricted field (F1 +20 % above F1 600 Hz): on an /a/-/i/-/a/ glide, blab shifts again when the formants re-enter the field (upstream shifted only the first entry); minVowelLen has no effect.',
    build: 'lite', metric: 'formant', ostStates: false,
    variants: [{ name: 'observed', section: 'observed', mode: 'session', label: 'Observed: blab as shipped (glide, then the dip input)' }],
    checks: d => [
      { label: 'glide: frames with sfmts > 0', variant: 'observed', trial: 0, metric: 'n_sfmts', want: d.glide_n_shifted, tol: 2 },
      ...d.glide_segments.flatMap((sg, i) => [{ label: `glide: shifted stretch ${i + 1} starts`, variant: 'observed', trial: 0, metric: `seg:${i}:a`, want: sg[0], tol: 0.005 },
        { label: `glide: shifted stretch ${i + 1} ends`, variant: 'observed', trial: 0, metric: `seg:${i}:b`, want: sg[1], tol: 0.005 }]),
      ...d.dip_segments.flatMap((sg, i) => [{ label: `dip: shifted stretch ${i + 1} starts`, variant: 'observed', trial: 1, metric: `seg:${i}:a`, want: sg[0], tol: 0.005 }])],
    key: 'On the glide, blab shifts the first /a/ and again the last /a/ (0.88-1.20 s), where upstream shifted only the first.',
  },
  'OST-F8': {
    title: 'AND_RATIO rules read their hold from field 5', dir: 'ost-f8',
    summary: 'An INTENSITY_AND_RATIO_ABOVE_THRESH rule with the hold in field 5 (as blab reads it) vs {} (as the manual writes it): with {} the hold is 0, and a brief click fires the rule.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [{ name: 'observed', section: 'observed', mode: 'session', label: 'Observed: hold in field 5, {}, then both with a 20 ms click before the /s/' }],
    checks: d => [['hold_state2_s', 'hold in field 5'], ['braces_state2_s', '{} in field 5'], ['click_hold_state2_s', 'click, hold in field 5'], ['click_braces_state2_s', 'click, {} in field 5']]
      .map(([k, l], i) => ({ label: `${l}: state 2 reached (s)`, variant: 'observed', trial: i, metric: 'st2', want: d[k], tol: 0.003 })),
    key: 'With {} the rule fires 48 ms earlier, and on a 20 ms click it fires at 0.116 s instead of waiting for the /s/.',
  },
  'CORPUS-11': {
    title: 'No bound on shifted-formant targets', dir: 'corpus-11',
    summary: 'Audapter\'s 2008 example trial replayed with its saved parameters merged into today\'s defaults: under today\'s ratio default its mel-unit pertAmp multiplies F1 by about 100 and the output is +24 dB.',
    build: 'lite', metric: 'formant', ostStates: false,
    variants: [{ name: 'observed', section: 'observed', mode: 'session', label: 'Observed: ratio shift (today\'s default), then mel shift (the 2008 binary\'s)' }],
    checks: d => [
      { label: 'ratio mode: median sF1 / F1', variant: 'observed', trial: 0, metric: 'ratio_f1', want: d.ratio.ratio_F1, tol: 0.5 },
      { label: 'ratio mode: frames with sfmts > 0', variant: 'observed', trial: 0, metric: 'n_sfmts', want: d.ratio.shifted_frames, tol: 2 },
      { label: 'mel mode: median sF1 / F1', variant: 'observed', trial: 1, metric: 'ratio_f1', want: d.mel.ratio_F1, tol: 0.003 },
      { label: 'mel mode: frames with sfmts > 0', variant: 'observed', trial: 1, metric: 'n_sfmts', want: d.mel.shifted_frames, tol: 2 }],
    key: 'Ratio mode: sF1 / F1 = 103 (targets up to 130 kHz); mel mode: 1.21, as logged in 2008 (1.22).',
  },
  'CORPUS-8': {
    title: 'Logged pitchHz is not F0 for low voices under the default window', dir: 'corpus-8', capture: 'CORPUS-8-32',
    summary: 'Time-domain pitch shifting on synthetic vowels of known F0: with frameLen 32 / nDelay 5 the logged pitchHz is wrong below about 180 Hz; with frameLen 64 / nDelay 7 it is right from 85 Hz.',
    build: 'lite', metric: 'pitch', ostStates: false,
    variants: [
      { name: 'observed', capture: 'CORPUS-8-32', section: 'observed', mode: 'session', label: 'Observed: frameLen 32, nDelay 5 (blab defaults), one vowel per F0, in one session as the export ran' },
      { name: 'expected', capture: 'CORPUS-8-64', section: 'observed', mode: 'session', label: 'Expected: frameLen 64, nDelay 7 (the longer window)' }],
    checks: d => [['cfg32', 'observed'], ['cfg64', 'expected']].flatMap(([c, v]) => d[c].sweep.map((e, i) => ({ label: `F0 ${e.f0} Hz: median logged pitchHz`, variant: v, trial: i, metric: 'pitchhz_med', want: e.median_hz, tol: Math.max(1, 1.1 * e.median_hz * e.median_hz / 16000) }))),
    trialLabels: d => d.cfg32.sweep.map(e => `F0 ${e.f0} Hz`),
    key: 'At frameLen 32 a 90 Hz voice logs pitchHz about 229 Hz; at frameLen 64 it logs 90 Hz.',
    note: 'pitchHz is 16000 / an integer lag, and the median of an even number of frames averages two of them; a single frame decided differently (the replay\'s input is stored at 24 bits, and WASM uses a different libm) moves the median by up to one lag step (F0² / 16000 Hz), which is the tolerance here.',
  },
  'I-02': {
    title: 'fb 5 applies dScale twice to the speech-modulated part', dir: 'i-02',
    summary: 'Feedback mode 5 mixes speech-modulated noise with constant playback; the speech-modulated part is scaled by dScale twice, so the balance moves with each rig\'s calibration.',
    build: 'lite', metric: 'noise', ostStates: false,
    variants: [{ name: 'observed', section: 'observed', mode: 'session', label: 'Observed: dScale 1, bundled calibration (A), +6 dB (B); each with and without the playback part' }],
    checks: d => [['ref', 0], ['A', 2], ['B', 4]].map(([t, i]) => ({ label: `mix, speech-modulated re playback (dB), ${t === 'ref' ? 'dScale 1' : 'calibration ' + t}`, variant: 'observed', trial: i, trial2: i + 1, metric: 'mix_db', want: d['mix_db_' + t], tol: 0.1 })),
    trialLabels: () => ['dScale 1, both parts', 'dScale 1, speech-modulated only', 'A, both parts', 'A, speech-modulated only', 'B, both parts', 'B, speech-modulated only'],
    key: 'Raising the calibration by 6 dB moves the mix by 6 dB (dScale applied twice), where once would leave it unchanged.',
  },
  'PT-5': {
    title: 'The phase vocoder changes loudness', dir: 'pt-5',
    summary: 'With bPitchShift on, 0 semitones plays about 3.5 dB louder, and a pitch-shift onset (0 to +2 st at 0.6 s by the OST) steps the level down to about +2 dB.',
    build: 'lite', metric: 'pitch', ostStates: true,
    variants: [{ name: 'observed', section: 'observed', mode: 'session', label: 'Observed: bypass (bPitchShift 0), vocoder at 0 st, then the 0 to +2 st step' }],
    checks: d => [
      { label: 'step trial: OST state 1 from (s)', variant: 'observed', trial: 2, metric: 'st1', want: d.ost_onset_s, tol: 0.003 },
      { label: 'step trial: level re input before the step (dB)', variant: 'observed', trial: 2, metric: 'gainwin:0.3:0.55', want: d.gain_before_db, tol: 0.1 },
      { label: 'step trial: level re input after the step (dB)', variant: 'observed', trial: 2, metric: 'gainwin:0.8:1.15', want: d.gain_after_db, tol: 0.1 },
      { label: 'bypass: level re input (dB)', variant: 'observed', trial: 0, metric: 'gainwin:0.8:1.15', want: d.gain_bypass_db, tol: 0.1 }],
    trialLabels: () => ['bypass (bPitchShift 0)', 'vocoder at 0 st', '0 st, then +2 st from OST state 1'],
    key: 'The vocoder plays +3.5 dB at 0 st and about +2.0 dB after the +2 st onset; bypass is 0 dB.',
  },
};
// Cards the Playground cannot replay, and why (shown in the picker and on the card).
export const NOT_REPLAYABLE = {
  'LIVE-1': 'needs the live audio path (a crash in the audio callback).', 'LIVE-3': 'needs the live audio path.', 'LIVE-6': 'needs the live audio path.',
  'CORPUS-10': 'the core hangs in an endless loop; the Playground stops a hung worker but cannot show the hang meaningfully.',
  'FMT-F1': 'reads past the end of an array; the values it reads are heap garbage that differs between runs and machines.',
  'OST-F4': 'reads past the end of the PCF table; the values are heap garbage that differs between runs and machines.',
  'I-04': 'about MATLAB passing the same array to two conditions; the Playground never reuses input arrays.',
  'I-03': 'needs a 35 s trial; use the full-size build with your own long recording.',
};
