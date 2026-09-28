// The report's test cases for the Playground. Each case replays the command stream that the card's export script
// (audit/harness/oct/report_*.m) sent to Audapter, captured by audit/playground/tools/capture-cases.sh, and compares the
// replay with the numbers the card shows (read from the same export's data.json).
// variants: which captured section to run, in one Audapter session ("session") or each trial in a fresh instance ("fresh").
// checks(data): the card's key numbers -> [{label, variant, trial (0-based), metric, want, tol}]; the page computes metric.
// Every replayable case has an "expected" and an "observed" variant with the same trials, so each trial is one row with an
// Expected/Observed toggle. Expected is, where one exists, the same inputs and sequence on the build with that card's fix
// (audit/report/wasm variants); otherwise what the card uses (the runner's missing lines, correct wiring, the safe pattern).
// variant options: pick (which captured trials, 0-based), ownWarmup (the section's first trial is a warm-up), labels(data).
// diff: how the page marks the difference in orange and words the one-line callout (formant-on, pitch, noise, level, heard,
//   pitchhz, ratio); expWord: the callout's word for expected ('should be', or e.g. 'one-shot alternative:').
const nn = v => (v === null || v === undefined ? NaN : v);
export const CASES = {
  'OST-F1': {
    real: {   // the card's primary example: word 1 a sustained /a/, word 2 a sustained /i/ (PVQD SJ7001), SCEN=real
      capture: 'OST-F1-REAL', inputDesc: 'real voice: PVQD SJ7001 (female) sustained /a/ as word 1 and /i/ as word 2, cut to the design\'s lengths',
      variants: [
        { name: 'expected', section: 'real', mode: 'session', build: 'fix-ost-f1', label: 'Expected: the same session on the build with the OST-F1 fix (the OST state is reset per trial)' },
        { name: 'observed', section: 'real', mode: 'session', label: 'Observed: one Audapter session, as run' }],
      checks: d => d.real.leak.shift_obs.flatMap((v, k) => [
        { label: `trial ${k + 1}: seconds of shift`, variant: 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 },
        { label: `trial ${k + 1}: seconds of shift`, variant: 'expected', trial: k, metric: 'shift_s', want: d.real.leak.shift_exp[k], tol: 0.011 },
        { label: `trial ${k + 1}: shift ends`, variant: 'observed', trial: k, metric: 'off', want: nn(d.real.leak.off_obs[k]), tol: 0.011 },
        { label: `trial ${k + 1}: word 1 end detected (state 3)`, variant: 'observed', trial: k, metric: 't3', want: nn(d.real.leak.t3_obs[k]), tol: 0.011 }]),
      key: 'Real voice, trial 4 (after the 1.20 s catch trial): expected, the shift stops at the end of word 1; observed, it runs on through word 2.',
    },
    focus: { observed: 3, expected: 3 }, spot: ['bmelshift', 'fb', 'fb3gain'],
    title: 'OST state carries over between trials', dir: 'ost-f1',
    summary: 'Shift the first word (F1 +125 mel in OST state 2); after a long catch trial the next trials detect word 1\'s end late, so the shift runs through word 2.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'fix-ost-f1', label: 'Expected: the same session on the build with the OST-F1 fix (the OST state is reset per trial)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: one Audapter session, as run' }],
    checks: d => d.leak.shift_obs.flatMap((v, k) => [
      { label: `trial ${k + 1}: seconds of shift`, variant: 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 },
      { label: `trial ${k + 1}: seconds of shift`, variant: 'expected', trial: k, metric: 'shift_s', want: d.leak.shift_exp[k], tol: 0.011 },
      { label: `trial ${k + 1}: shift ends`, variant: 'observed', trial: k, metric: 'off', want: nn(d.leak.off_obs[k]), tol: 0.011 },
      { label: `trial ${k + 1}: word 1 end detected (state 3)`, variant: 'observed', trial: k, metric: 't3', want: nn(d.leak.t3_obs[k]), tol: 0.011 }]),
    key: 'Trial 4: the shift is expected to stop at 0.53 s (end of word 1); observed, it runs to 1.29 s, through word 2.',
    diff: 'formant-on',
  },
  'OST-F2': {
    real: {   // a soft sustained /a/ (PVQD SJ7001) that stays below the onset threshold
      inputDesc: 'real voice: a soft sustained /a/ (PVQD SJ7001, female), 1.15 s, below the onset threshold',
      variants: [
        { name: 'expected', section: 'real_observed', mode: 'session', build: 'fix-ost-f2', label: 'Expected: the same session on the build with the OST-F2 fix (the timeout writes the right onset index)' },
        { name: 'observed', section: 'real_observed', mode: 'session', label: 'Observed: the maxIOI OST loaded once, three trials with reset only' }],
      trialLabels: () => ['trial 1', 'trial 2', 'trial 3'],
      checks: d => [
        ...d.real.obs_s2.map((v, k) => ({ label: `trial ${k + 1}: timeout (state 2)`, variant: 'observed', trial: k, metric: 'st2', want: v, tol: 0.003 })),
        ...d.real.obs_s3.map((v, k) => ({ label: `trial ${k + 1}: state 3`, variant: 'observed', trial: k, metric: 't3', want: v, tol: 0.003 })),
        ...d.real.obs_on.map((v, k) => ({ label: `trial ${k + 1}: shift starts (first sfmts > 0)`, variant: 'observed', trial: k, metric: 'sfon', want: v, tol: 0.003 })),
        ...d.real.exp_on.map((v, k) => ({ label: `trial ${k + 1}: shift starts, as the intended timing`, variant: 'expected', trial: k, metric: 'sfon', want: v, tol: 0.003 }))],
      key: 'Real voice: the observed shift starts later every trial (the timeout drifts 0.2 → 0.4 → 0.6 s); expected, it starts at the same time on every trial.',
    },
    focus: { observed: 2, expected: 2 }, spot: ['rmsthr', 'bratioshift', 'bshift'], diff: 'formant-on',
    title: 'The maxIOI timeout drifts across trials', dir: 'ost-f2',
    summary: 'A soft vowel never reaches the onset level, so a 0.2 s maxIOI timeout starts the sequence; loaded once, the timeout fires at 0.2, 0.4, 0.6 s and state 3 follows after 2 ms instead of 100 ms.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'fix-ost-f2', label: 'Expected: the same session on the build with the OST-F2 fix (the timeout writes the right onset index)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: the maxIOI OST loaded once, three trials with reset only' }],
    checks: d => [
      ...d.state2_s.map((v, k) => ({ label: `trial ${k + 1}: timeout (state 2)`, variant: 'observed', trial: k, metric: 'st2', want: v, tol: 0.003 })),
      ...d.state3_s.map((v, k) => ({ label: `trial ${k + 1}: state 3`, variant: 'observed', trial: k, metric: 't3', want: v, tol: 0.003 })),
      ...d.shift_on_s.map((v, k) => ({ label: `trial ${k + 1}: shift starts`, variant: 'observed', trial: k, metric: 'on', want: v, tol: 0.003 })),
      ...d.state2_s.flatMap((v, k) => [
        { label: `trial ${k + 1}: timeout (state 2), as the intended timing`, variant: 'expected', trial: k, metric: 'st2', want: d.ctrl_state2_s, tol: 0.003 },
        { label: `trial ${k + 1}: state 3, as the intended timing`, variant: 'expected', trial: k, metric: 't3', want: d.ctrl_state3_s, tol: 0.003 },
        { label: `trial ${k + 1}: shift starts, as the intended timing`, variant: 'expected', trial: k, metric: 'on', want: d.ctrl_shift_on_s, tol: 0.003 }])],
    key: 'Observed timeouts 0.202 / 0.404 / 0.606 s with state 3 two milliseconds later; expected 0.202 s and 0.304 s every trial.',
  },
  'COORD-1': {
    real: {   // a real sentence on every trial (CMU ARCTIC clb a0030)
      inputDesc: 'real voice: CMU ARCTIC clb a0030 "I had faith in them." (female) on every trial',
      variants: [
        { name: 'expected', section: 'real_exp', mode: 'session', label: 'Expected: the runner\'s two clear lines (the OST and PCF are cleared before the experiment); no code fix applies' },
        { name: 'observed', section: 'real_obs', mode: 'session', label: 'Observed: without the two clear lines' }],
      checks: d => ['exp', 'obs'].flatMap(a => d.real[a].shift_s.map((v, k) => ({ label: `trial ${k + 1} (${d.sequence[k]}): seconds of shift`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 }))),
      key: 'Real voice, shift trials 3 and 5: F1 +125 mel expected, not shifted at all observed.',
    },
    focus: { observed: 2, expected: 2 }, spot: ['bmelshift', 'fb', 'fb3gain'], diff: 'formant-on',
    title: 'An OST/PCF from an earlier block overrides a field experiment', dir: 'coord-1',
    summary: 'A calibration block loads measureFormants.ost/.pcf; the field-mode experiment that follows (F1 +125 mel on "shift" trials) never shifts, because the stale PCF wins unless the runner clears it.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'exp', mode: 'session', label: 'Expected: the runner\'s two clear lines (the OST and PCF are cleared before the experiment); no code fix applies' },
      { name: 'observed', section: 'obs', mode: 'session', label: 'Observed: without the two clear lines' }],
    checks: d => ['exp', 'obs'].flatMap(a => d[a].shift_s.map((v, k) => ({ label: `trial ${k + 1} (${d.sequence[k]}): seconds of shift`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'shift_s', want: v, tol: 0.011 }))),
    key: 'Shift trials 3 and 5: 0.44 s of F1 +125 mel expected, 0 s observed.',
  },
  'OST-F5': {
    real: {   // PVQD SJ7001 sustained /a/; shift trials stop mid-phonation
      inputDesc: 'real voice: PVQD SJ7001 (female) sustained /a/, cut to the shift and catch trial lengths',
      variants: [
        { name: 'expected', section: 'real_exp', mode: 'session', label: 'Expected: catch trials load an all-zero PCF (the safe pattern; no fixed build exists for this card)' },
        { name: 'observed', section: 'real_obs', mode: 'session', label: 'Observed: catch trials clear the PCF' }],
      checks: d => ['exp', 'obs'].flatMap(a => d.real[a].st2_on.flatMap((v, k) => [
        { label: `trial ${k + 1} (${d.sequence[k]}): OST state 2 from (s)`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'st2', want: nn(v), tol: 0.003 },
        { label: `trial ${k + 1}: logged pitchShiftRatio`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'ratio_logged', want: d.real[a].ratio_logged[k], tol: 1e-6 }])),
      key: 'Real voice, catch trials 2 and 4: not shifted expected, +2 semitones observed.',
    },
    focus: { observed: 1, expected: 1 }, spot: ['bpitchshift', 'framelen', 'srate'], diff: 'pitch',
    title: 'A PCF pitch shift leaks into catch trials', dir: 'ost-f5',
    summary: 'The PCF\'s +2 st overwrites pitchShiftRatio; when a catch trial clears the PCF instead of loading a zero one, the stale ratio stays and the catch trial is shifted +200 cents.',
    build: 'lite', metric: 'pitch', ostStates: true,
    variants: [
      { name: 'expected', section: 'exp', mode: 'session', label: 'Expected: catch trials load an all-zero PCF (the safe pattern; no fixed build exists for this card)' },
      { name: 'observed', section: 'obs', mode: 'session', label: 'Observed: catch trials clear the PCF' }],
    checks: d => ['exp', 'obs'].flatMap(a => d[a].cents.flatMap((v, k) => [
      { label: `trial ${k + 1} (${d.sequence[k]}): output F0 re input (cents)`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'cents', want: v, tol: 12 },
      { label: `trial ${k + 1}: logged pitchShiftRatio`, variant: a === 'exp' ? 'expected' : 'observed', trial: k, metric: 'ratio_logged', want: d[a].ratio_logged[k], tol: 1e-6 }])),
    key: 'Catch trials 2 and 4: 0 cents expected, +200 cents observed.',
  },
  'I-01': {
    focus: { observed: 0, expected: 0 }, spot: ['fb', 'fb2gain', 'scale'], diff: 'noise',
    title: 'Masking noise shorter than 10 s leaves a silent gap', dir: 'i-01',
    summary: 'Playback loops at 480 000 samples, not at the noise length: 5 s of noise is followed by 5 s of silence, and the gap position carries over between trials.',
    build: 'full', metric: 'noise', ostStates: false,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'fix-i-01', label: 'Expected: the same trial on the build with the I-01 fix (the noise loops at its own length)' },
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
    real: {   // PVQD LA9015 (male) sustained /i/ and /a/, 1.2 s, at strength 0 and 0.5
      vowels: null, focus: { observed: 3, expected: 3 }, inputDesc: 'real voice: PVQD LA9015 (male) sustained /i/ and /a/, 1.2 s each',
      variants: [
        { name: 'expected', section: 'real_sent', mode: 'session', warmup: true, label: 'Expected: the same trials with the field wired correctly (the mel grids sent as pertF1/pertF2, as vsaSentence does); no code fix applies' },
        { name: 'observed', section: 'real_cent', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (/i/ and /a/), after one warm-up trial' }],
      trialLabels: () => ['strength 0, /i/', 'strength 0, /a/', 'strength 0.5, /i/', 'strength 0.5, /a/'],
      checks: d => [['sent', 'expected'], ['cent', 'observed']].flatMap(([sec, vn]) => ['s00', 's05'].flatMap((tag, si) => ['i', 'a'].flatMap((vw, v) => [
        { label: `strength ${si ? 0.5 : 0}, /${vw}/: heard F1 (Hz)`, variant: vn, trial: 1 + si * 2 + v, metric: 'heard_f1:0.2:0.8', want: d.real[sec][tag][vw].heard_hz[0], tol: 3 },
        { label: `strength ${si ? 0.5 : 0}, /${vw}/: heard F2 (Hz)`, variant: vn, trial: 1 + si * 2 + v, metric: 'heard_f2:0.2:0.8', want: d.real[sec][tag][vw].heard_hz[1], tol: 3 }]))),
      key: 'Real voice, strength 0.5, /i/: the heard formants differ from the correctly wired field\'s.',
    },
    focus: { observed: 7, expected: 7 }, spot: ['nlpc', 'bshift2d', 'bmelshift'], diff: 'heard',
    title: 'vsaCentralize: the committed runner\'s field', dir: 'vsa-centralize', dataFrom: 'vsa-centralize',
    summary: 'The public vsaCentralize runner sends the 2-D field with lower-case grid fields; this replays its exact parameter sequence at strength 0 and 0.5 and compares the heard formants with the intended pull toward the centre.',
    build: 'lite', metric: 'formant', ostStates: false, vowels: ['iy', 'ae', 'aa', 'uw', 'ih', 'eh'],
    variants: [
      { name: 'expected', section: 'sent', mode: 'session', ownWarmup: true, label: 'Expected: the same trials with the field wired correctly (the mel grids sent as pertF1/pertF2, as vsaSentence does); no code fix applies' },
      { name: 'observed', section: 'cent', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (six vowels each), after one warm-up trial' }],
    checks: d => [['sent', 'expected'], ['cent', 'observed']].flatMap(([sec, vn]) => ['s00', 's05'].flatMap((tag, si) => d[sec][tag].flatMap((e, v) => [
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F1 (Hz)`, variant: vn, trial: 1 + si * 6 + v, metric: 'heard_f1', want: e.heard_hz[0], tol: 3 },
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F2 (Hz)`, variant: vn, trial: 1 + si * 6 + v, metric: 'heard_f2', want: e.heard_hz[1], tol: 3 }]))),
    intended: d => d.cent.s05.map(e => ({ vowel: e.vowel, prod: e.prod_hz, heard: e.heard_hz, intended: e.intended_hz })),
    key: 'At strength 0.5 the heard formants differ from the intended pull toward the centre; the table lists heard vs intended per vowel.',
  },
  'LAB-2': {
    real: {   // PVQD LA9015 (male) sustained /i/ and /a/, 1.2 s, at strength 0 and 0.5
      vowels: null, focus: { observed: 3, expected: 3 }, inputDesc: 'real voice: PVQD LA9015 (male) sustained /i/ and /a/, 1.2 s each',
      variants: [
        { name: 'expected', section: 'real_sent', mode: 'session', warmup: true, label: 'Expected: the same trials with the field wired correctly (the 2-D field scaled per trial and the grids sent as pertF1/pertF2, as vsaSentence does); no code fix applies' },
        { name: 'observed', section: 'real_gen', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (/i/ and /a/), after one warm-up trial' }],
      trialLabels: () => ['strength 0, /i/', 'strength 0, /a/', 'strength 0.5, /i/', 'strength 0.5, /a/'],
      checks: d => [['sent', 'expected'], ['gen', 'observed']].flatMap(([sec, vn]) => ['s00', 's05'].flatMap((tag, si) => ['i', 'a'].flatMap((vw, v) => [
        { label: `strength ${si ? 0.5 : 0}, /${vw}/: heard F1 (Hz)`, variant: vn, trial: 1 + si * 2 + v, metric: 'heard_f1:0.2:0.8', want: d.real[sec][tag][vw].heard_hz[0], tol: 3 },
        { label: `strength ${si ? 0.5 : 0}, /${vw}/: heard F2 (Hz)`, variant: vn, trial: 1 + si * 2 + v, metric: 'heard_f2:0.2:0.8', want: d.real[sec][tag][vw].heard_hz[1], tol: 3 }]))),
      key: 'Real voice, strength 0.5, /i/: the heard formants differ from the correctly wired field\'s.',
    },
    focus: { observed: 7, expected: 7 }, spot: ['nlpc', 'bshift2d', 'bmelshift'], diff: 'heard',
    title: 'vsaGeneralize: the committed runner\'s field', dir: 'vsa-generalize', capture: 'LAB-1',
    summary: 'The public vsaGeneralize runner scales the 1-D field (all zeros) per trial while the full-strength 2-D field stays loaded; this replays its exact parameter sequence at strength 0 and 0.5.',
    build: 'lite', metric: 'formant', ostStates: false, vowels: ['iy', 'ae', 'aa', 'uw', 'ih', 'eh'],
    variants: [
      { name: 'expected', section: 'sent', mode: 'session', ownWarmup: true, label: 'Expected: the same trials with the field wired correctly (the 2-D field scaled per trial and the grids sent as pertF1/pertF2, as vsaSentence does); no code fix applies' },
      { name: 'observed', section: 'gen', mode: 'session', warmup: true, label: 'Observed: the committed runner, strength 0 then 0.5 (six vowels each), after one warm-up trial' }],
    checks: d => [['sent', 'expected'], ['gen', 'observed']].flatMap(([sec, vn]) => ['s00', 's05'].flatMap((tag, si) => d[sec][tag].flatMap((e, v) => [
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F1 (Hz)`, variant: vn, trial: 1 + si * 6 + v, metric: 'heard_f1', want: e.heard_hz[0], tol: 3 },
      { label: `strength ${si ? 0.5 : 0}, /${e.vowel}/: heard F2 (Hz)`, variant: vn, trial: 1 + si * 6 + v, metric: 'heard_f2', want: e.heard_hz[1], tol: 3 }]))),
    key: 'Already at strength 0 the full-strength 2-D field shifts every vowel; the table lists heard vs produced.',
  },
  'LAB-3': {
    real: {   // fb 4 with a real sentence (CMU ARCTIC bdl a0005): speech-modulated noise follows the voice
      inputDesc: 'real voice: CMU ARCTIC bdl a0005 (male)',
      variants: [
        { name: 'expected', section: 'fb4_real_intended', mode: 'session', label: 'Expected: the setting wired correctly, fb4GainDB = 20 log10(0.98); no code fix applies' },
        { name: 'observed', section: 'fb4_real_committed', mode: 'session', label: 'Observed: the committed runner (fb4GainDB stays 10 dB)' }],
      checks: d => [
        { label: 'output RMS (signalOut; the card\'s real clip, 16-bit)', variant: 'observed', trial: 0, metric: 'rms_out', want: d._wavRms('vsa-meas/fb4_real_committed.wav'), tol: 0.0005 },
        { label: 'output RMS (signalOut; the card\'s real clip, 16-bit)', variant: 'expected', trial: 0, metric: 'rms_out', want: d._wavRms('vsa-meas/fb4_real_intended.wav'), tol: 0.0005 }],
      key: 'Real voice: the committed runner plays the speech-modulated noise about 10 dB louder than intended.',
    },
    focus: { observed: 0, expected: 0 }, spot: ['fb', 'fb4gaindb', 'nlpc'], diff: 'level',
    title: 'vsaGeneralize generalization phases: fb 4 gain not forwarded', dir: 'vsa-fb4', capture: 'LAB-1',
    summary: 'The runner sets p.fb4Gain = 0.98, a field AudapterIO never sends, so the speech-modulated noise plays at Audapter\'s default fb4GainDB of 10 dB instead of about 0 dB.',
    build: 'lite', metric: 'noise', ostStates: false,
    variants: [
      { name: 'expected', section: 'fb4_intended', mode: 'session', label: 'Expected: the setting wired correctly, fb4GainDB = 20 log10(0.98); no code fix applies' },
      { name: 'observed', section: 'fb4_committed', mode: 'session', label: 'Observed: the committed runner (fb4GainDB stays 10 dB)' }],
    checks: d => [
      { label: 'output RMS (signalOut)', variant: 'observed', trial: 0, metric: 'rms_out', want: d.fb4.rms_committed, tol: 0.0005 },
      { label: 'output RMS (signalOut)', variant: 'expected', trial: 0, metric: 'rms_out', want: d.fb4.rms_intended, tol: 0.0005 }],
    key: 'The committed runner plays the noise about 10 dB louder than intended.',
  },
  'F6': {
    focus: { observed: 0, expected: 0 }, spot: ['f1min', 'rmsthr', 'bshift'], diff: 'formant-on', expWord: 'one-shot alternative:',
    title: 'The dropout fix re-arms the field shift on every re-entry', dir: 'f6',
    summary: 'A restricted field (F1 +20 % above F1 600 Hz): on an /a/-/i/-/a/ glide, blab shifts again when the formants re-enter the field (upstream shifted only the first entry); minVowelLen has no effect.',
    build: 'lite', metric: 'formant', ostStates: false,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'alt-f6', label: 'Alternative, not a fix: the same session on a build with the one-shot rule (upstream\'s: shift only the first entry into the field)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: blab as shipped (glide, then the dip input)' }],
    checks: d => [
      { label: 'one-shot alternative, glide: shifted stretches', variant: 'expected', trial: 0, metric: 'nseg', want: 1, tol: 0 },
      { label: 'one-shot alternative, glide: shifted stretch 1 starts', variant: 'expected', trial: 0, metric: 'seg:0:a', want: d.glide_segments[0][0], tol: 0.005 },
      { label: 'one-shot alternative, glide: shifted stretch 1 ends', variant: 'expected', trial: 0, metric: 'seg:0:b', want: d.glide_segments[0][1], tol: 0.005 },
      { label: 'one-shot alternative, dip: shifted stretches', variant: 'expected', trial: 1, metric: 'nseg', want: 1, tol: 0 },
      { label: 'glide: frames with sfmts > 0', variant: 'observed', trial: 0, metric: 'n_sfmts', want: d.glide_n_shifted, tol: 2 },
      ...d.glide_segments.flatMap((sg, i) => [{ label: `glide: shifted stretch ${i + 1} starts`, variant: 'observed', trial: 0, metric: `seg:${i}:a`, want: sg[0], tol: 0.005 },
        { label: `glide: shifted stretch ${i + 1} ends`, variant: 'observed', trial: 0, metric: `seg:${i}:b`, want: sg[1], tol: 0.005 }]),
      ...d.dip_segments.flatMap((sg, i) => [{ label: `dip: shifted stretch ${i + 1} starts`, variant: 'observed', trial: 1, metric: `seg:${i}:a`, want: sg[0], tol: 0.005 }])],
    key: 'On the glide, blab shifts the first /a/ and again the last /a/ (0.88-1.20 s), where upstream shifted only the first.',
  },
  'OST-F8': {
    focus: { observed: 1, expected: 1 }, spot: ['rmsthr', 'bshift', 'framelen'], diff: 'level',
    title: 'AND_RATIO rules read their hold from field 5', dir: 'ost-f8',
    summary: 'An INTENSITY_AND_RATIO_ABOVE_THRESH rule with the hold in field 5 (as blab reads it) vs {} (as the manual writes it): with {} the hold is 0, and a brief click fires the rule.',
    build: 'lite', metric: 'formant', ostStates: true,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', pick: [0, 2], label: 'Expected: the hold in field 5 (0.05 s), as blab reads it; no code fix applies (the manual\'s {} is the problem)' },
      { name: 'observed', section: 'observed', mode: 'session', pick: [1, 3], label: 'Observed: {} in field 5, as the manual writes it' }],
    trialLabels: () => ['the word', 'a 20 ms click, then the word'],
    checks: d => [['hold_state2_s', 'hold in field 5', 'expected', 0], ['braces_state2_s', '{} in field 5', 'observed', 0], ['click_hold_state2_s', 'click, hold in field 5', 'expected', 1], ['click_braces_state2_s', 'click, {} in field 5', 'observed', 1]]
      .map(([k, l, v, i]) => ({ label: `${l}: state 2 reached (s)`, variant: v, trial: i, metric: 'st2', want: d[k], tol: 0.003 })),
    key: 'With {} the rule fires 48 ms earlier, and on a 20 ms click it fires at 0.116 s instead of waiting for the /s/.',
  },
  'CORPUS-11': {
    focus: { observed: 0, expected: 0 }, spot: ['nlpc', 'srate', 'downfact'], diff: 'ratio',
    title: 'No bound on shifted-formant targets', dir: 'corpus-11',
    summary: 'Audapter\'s 2008 example trial replayed with its saved parameters merged into today\'s defaults: under today\'s ratio default its mel-unit pertAmp multiplies F1 by about 100 and the output is +24 dB.',
    build: 'lite', metric: 'formant', ostStates: false,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', pick: [1], label: 'Expected: the saved pertAmp read in mel, the units it was written in (the 2008 binary\'s default); no code fix applies' },
      { name: 'observed', section: 'observed', mode: 'session', pick: [0], label: 'Observed: the same parameters under today\'s ratio default' }],
    trialLabels: () => ['the 2008 example trial'],
    checks: d => [
      { label: 'ratio mode: median sF1 / F1', variant: 'observed', trial: 0, metric: 'ratio_f1', want: d.ratio.ratio_F1, tol: 0.5 },
      { label: 'ratio mode: frames with sfmts > 0', variant: 'observed', trial: 0, metric: 'n_sfmts', want: d.ratio.shifted_frames, tol: 2 },
      { label: 'mel mode: median sF1 / F1', variant: 'expected', trial: 0, metric: 'ratio_f1', want: d.mel.ratio_F1, tol: 0.003 },
      { label: 'mel mode: frames with sfmts > 0', variant: 'expected', trial: 0, metric: 'n_sfmts', want: d.mel.shifted_frames, tol: 2 }],
    key: 'Ratio mode: sF1 / F1 = 103 (targets up to 130 kHz); mel mode: 1.21, as logged in 2008 (1.22).',
  },
  'CORPUS-8': {
    focus: { observed: 1, expected: 1 }, spot: ['framelen', 'ndelay', 'btimedomainshift'], diff: 'pitchhz',
    title: 'Logged pitchHz is not F0 for low voices under the default window', dir: 'corpus-8', capture: 'CORPUS-8-32',
    summary: 'Time-domain pitch shifting on synthetic vowels of known F0: with frameLen 32 / nDelay 5 the logged pitchHz is wrong below about 180 Hz; with frameLen 64 / nDelay 7 it is right from 85 Hz.',
    build: 'lite', metric: 'pitch', ostStates: false,
    variants: [
      { name: 'observed', capture: 'CORPUS-8-32', section: 'observed', mode: 'session', label: 'Observed: frameLen 32, nDelay 5 (blab defaults), one vowel per F0, in one session as the export ran' },
      { name: 'expected', capture: 'CORPUS-8-64', section: 'observed', mode: 'session', label: 'Expected: frameLen 64, nDelay 7 (the longer window the card recommends); no code fix applies' }],
    checks: d => [['cfg32', 'observed'], ['cfg64', 'expected']].flatMap(([c, v]) => d[c].sweep.map((e, i) => ({ label: `F0 ${e.f0} Hz: median logged pitchHz`, variant: v, trial: i, metric: 'pitchhz_med', want: e.median_hz, tol: Math.max(1, 1.1 * e.median_hz * e.median_hz / 16000) }))),
    trialLabels: d => d.cfg32.sweep.map(e => `F0 ${e.f0} Hz`),
    key: 'At frameLen 32 a 90 Hz voice logs pitchHz about 229 Hz; at frameLen 64 it logs 90 Hz.',
    note: 'pitchHz is 16000 / an integer lag, and the median of an even number of frames averages two of them; a single frame decided differently (the replay\'s input is stored at 24 bits, and WASM uses a different libm) moves the median by up to one lag step (F0² / 16000 Hz), which is the tolerance here.',
  },
  'I-02': {
    focus: { observed: 4, expected: 4 }, spot: ['fb', 'fb5gaindb_speech', 'scale'], diff: 'level',
    title: 'fb 5 applies dScale twice to the speech-modulated part', dir: 'i-02',
    summary: 'Feedback mode 5 mixes speech-modulated noise with constant playback; the speech-modulated part is scaled by dScale twice, so the balance moves with each rig\'s calibration.',
    build: 'lite', metric: 'noise', ostStates: false,
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'fix-i-02', label: 'Expected: the same trials on the build with the I-02 fix (dScale applied once)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: dScale 1, bundled calibration (A), +6 dB (B); each with and without the playback part' }],
    checks: d => [...[['ref', 0], ['A', 2], ['B', 4]].map(([t, i]) => ({ label: `mix, speech-modulated re playback (dB), ${t === 'ref' ? 'dScale 1' : 'calibration ' + t}`, variant: 'observed', trial: i, trial2: i + 1, metric: 'mix_db', want: d['mix_db_' + t], tol: 0.1 })),
      ...[['A', 2], ['B', 4]].map(([t, i]) => ({ label: `with the fix: mix at calibration ${t} equals dScale 1 (dB)`, variant: 'expected', trial: i, trial2: i + 1, metric: 'mix_db', want: d.mix_db_ref, tol: 0.1 }))],
    trialLabels: () => ['dScale 1, both parts', 'dScale 1, speech-modulated only', 'A, both parts', 'A, speech-modulated only', 'B, both parts', 'B, speech-modulated only'],
    key: 'Raising the calibration by 6 dB moves the mix by 6 dB (dScale applied twice), where once would leave it unchanged.',
  },
  'PT-5': {
    focus: { observed: 1, expected: 1 }, spot: ['bpitchshift', 'ndelay', 'downfact'], diff: 'level',
    title: 'The phase vocoder changes loudness', dir: 'pt-5', capture: 'PT-5-CEREB',
    summary: 'With bPitchShift on, 0 semitones plays about 3.5 dB louder, and a pitch-shift onset (0 to +2 st at 0.6 s by the OST) steps the level down to about +2 dB.',
    build: 'lite', metric: 'level', ostStates: true,
    sets: [{   // the card's lead (COORD-9): blab's timeWrap and cerebTimeAdapt, pre phase vs later phases (SCEN=timewrap)
      id: 'timewrap', setLabel: 'timeWrap / cerebTimeAdapt', capture: 'PT-5-TW', ostStates: false, diff: 'levellat', focus: { observed: 0, expected: 0 },
      summary: 'blab\'s timeWrap and cerebTimeAdapt (24 kHz, downFact 2, frameLen 32, nDelay 3) run the pre phase with bPitchShift 0 and later phases with bPitchShift 1 and a warp-row PCF: from the first post-pre phase on, participants hear themselves about 3 dB quieter and 13 ms later.',
      inputDesc: 'real voice: CMU ARCTIC clb a0018 "There was a change now." (female), first 1.75 s; a click train for the latency',
      variants: [
        { name: 'expected', section: 'tw_pre', mode: 'session', label: 'Expected: the pre phase (bPitchShift 0, no PCF), i.e. the level and latency participants hear before the switch; no code fix build is used here' },
        { name: 'observed', section: 'tw_later', mode: 'session', pick: [0, 1], label: 'Observed: a later phase (bPitchShift 1, zero-length warp-row PCF), blab\'s timeWrap and cerebTimeAdapt settings (24 kHz, downFact 2, frameLen 32, nDelay 3)' }],
      trialLabels: () => ['speech (ARCTIC clb a0018)', 'click train (latency)'],
      checks: d => [
        { label: 'pre phase: level re input (dB)', variant: 'expected', trial: 0, metric: 'gainrms:0.1', want: d.timewrap.pre_db, tol: 0.1 },
        { label: 'later phases: level re input (dB)', variant: 'observed', trial: 0, metric: 'gainrms:0.1', want: d.timewrap.later_db, tol: 0.1 },
        { label: 'pre phase: click latency (ms)', variant: 'expected', trial: 1, metric: 'clicklat', want: d.timewrap.lat_pre_ms, tol: 0.05 },
        { label: 'later phases: click latency (ms)', variant: 'observed', trial: 1, metric: 'clicklat', want: d.timewrap.lat_later_ms, tol: 0.05 }],
      key: 'From the first post-pre phase on, participants hear themselves about 2.6 dB quieter and 13.3 ms later than in the pre phase.',
    }, {   // the card's time-warp designs (timeAdapt settings: 24 kHz, frameLen 48): control trials with or without a warp row
      id: 'warp', setLabel: 'timeAdapt warp rows', capture: 'PT-5', ostStates: false, diff: 'level', focus: { observed: 0, expected: 0 },
      summary: 'Time-warp designs at blab\'s timeAdapt settings (24 kHz, frameLen 48, bPitchShift 1): control trials that keep a zero-length warp row play at the warp trials\' level; control trials that drop the warp section play louder.',
      inputDesc: 'real voice: CMU ARCTIC clb a0018 "There was a change now." (female), first 1.75 s, on every trial',
      variants: [
        { name: 'expected', section: 'warp_exp', mode: 'session', label: 'Expected: control trials keep a zero-length warp row (as blab\'s timeWrap does); no code fix applies' },
        { name: 'observed', section: 'warp_obs', mode: 'session', label: 'Observed: control trials drop the warp section' }],
      trialLabels: () => ['control', 'warp', 'control', 'warp'],
      checks: d => ['exp', 'obs'].flatMap(a => [1, 2, 3, 4].map(k => ({ label: `trial ${k} (${['control', 'warp', 'control', 'warp'][k - 1]}): level re input (dB; the card's clip)`, variant: a === 'exp' ? 'expected' : 'observed', trial: k - 1, metric: 'gainrms:0.1',
        want: d._wavLevel(`pt-5/meas/warp_${a}_t${k}_out.wav`, 'pt-5/meas/warp_in.wav'), tol: 0.1 }))),
      key: 'Control trials without a warp section play louder than the warp trials around them; with a zero-length warp row they match.',
    }, {   // the card's hypothetical design: a real sentence (CMU ARCTIC clb a0018) in two phases, no PCF
      id: 'cereb', setLabel: 'Hypothetical: no PCF', ostStates: false, spot: ['bpitchshift', 'ndelay', 'downfact'],
      summary: 'A plausible design with the settings of an Audapter runner in blab\'s cerebTypicalProduction folder (24 kHz, frameLen 32, nDelay 3, no PCF; the experiment as wired plays no Audapter feedback): the baseline runs bPitchShift 0, later phases bPitchShift 1 at 0 semitones, and from the first vocoder phase the voice plays about 3.5 dB louder.',
      variants: [
        { name: 'expected', section: 'cereb', mode: 'session', build: 'fix-pt-5', label: 'Expected: the same two phases on the build with the PT-5 fix (the vocoder\'s overlap-add divided by its window sum): both phases at the same level' },
        { name: 'observed', section: 'cereb', mode: 'session', label: 'Observed: the baseline (bPitchShift 0), then a later phase (bPitchShift 1, 0 st), shipped build' }],
      trialLabels: () => ['baseline: bPitchShift 0', 'later phases: bPitchShift 1, 0 st'],
      checks: d => [
        { label: 'baseline: level re input (dB)', variant: 'observed', trial: 0, metric: 'gainrms:0.1', want: d.cereb.b0_db, tol: 0.1 },
        { label: 'later phases: level re input (dB)', variant: 'observed', trial: 1, metric: 'gainrms:0.1', want: d.cereb.b1_db, tol: 0.1 },
        { label: 'with the fix, later phases: level re input equals the baseline (dB)', variant: 'expected', trial: 1, metric: 'gainrms:0.1', want: d.cereb.b0_db, tol: 0.2 }],
      key: 'Hypothetical design: later phases (bPitchShift 1, 0 st, no PCF) play about 3.5 dB louder than the baseline; with the gain-normalised build both phases play at the same level.',
    }],
    variants: [
      { name: 'expected', section: 'observed', mode: 'session', build: 'fix-pt-5', label: 'Expected: the same trials on the build with the PT-5 fix (gain-normalised vocoder)' },
      { name: 'observed', section: 'observed', mode: 'session', label: 'Observed: bypass (bPitchShift 0), vocoder at 0 st, then the 0 to +2 st step at 0.6 s by the OST' }],
    trialLabels: () => ['bypass (bPitchShift 0)', 'vocoder at 0 st', '0 st, then +2 st from OST state 1'],
    checks: d => [
      { label: 'step trial: OST state 1 from (s)', variant: 'observed', trial: 2, metric: 'st1', want: d.ost_onset_s, tol: 0.003 },
      { label: 'step trial: level re input before the step (dB)', variant: 'observed', trial: 2, metric: 'gainwin:0.3:0.55', want: d.gain_before_db, tol: 0.1 },
      { label: 'step trial: level re input after the step (dB)', variant: 'observed', trial: 2, metric: 'gainwin:0.8:1.15', want: d.gain_after_db, tol: 0.1 },
      { label: 'bypass: level re input (dB)', variant: 'observed', trial: 0, metric: 'gainwin:0.8:1.15', want: d.gain_bypass_db, tol: 0.1 }],
    key: 'Synthetic vowel: the vocoder plays +3.5 dB at 0 st and about +2.0 dB after the +2 st onset; bypass is 0 dB.',
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
