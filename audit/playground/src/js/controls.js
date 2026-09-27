'use strict';
// The settings controls: one plain-language line per control, with units and a sensible range.
// path: where the value lives in the settings object. Controls under "listen." default to the preset's value.
(() => {
  const S = PG.S;
  const vOn = s => s.shift.formant.field === 'variability';
  const fOn = s => s.shift.formant.on, pOn = s => s.shift.pitch.on, tdsOn = s => pOn(s) && s.shift.pitch.method === 'tds';
  const unitRange = { pct: [-50, 50, 1, '%'], hz: [-400, 400, 5, 'Hz'], mel: [-300, 300, 5, 'mel'] };
  const u = s => unitRange[s.shift.formant.units] || unitRange.pct;

  PG.GROUPS = [
    { id: 'shift', title: 'What gets shifted', blurb: 'Switch on one or more changes to the speech the participant hears.', cards: [
      { id: 'formant', title: 'Formants', on: 'shift.formant.on', blurb: 'Move F1 and F2, the resonances that make vowels sound different.',
        summary: s => { const f = s.shift.formant, un = u(s)[3]; if (f.field === 'variability') return `variability ${f.vari.dir === 'in' ? 'inward' : 'outward'} ${f.vari.strength} %`; return f.field === 'painted' ? `painted field, ${f.painted.cells.length} cells` : f.field === 'curve' ? 'depends on F2' : `F1 ${PG.fmt.signed(f.f1, 0)} ${un}, F2 ${PG.fmt.signed(f.f2, 0)} ${un}`; },
        controls: [
          { path: 'shift.formant.units', label: 'Units', kind: 'seg', show: s => s.shift.formant.field !== 'variability', options: [['pct', '% (ratio)'], ['hz', 'Hz'], ['mel', 'mel']],
            desc: 'Percent multiplies each formant; Hz and mel add a fixed amount. Audapter calls these bRatioShift and bMelShift.' },
          { path: 'shift.formant.f1', label: 'F1 shift', kind: 'range', range: u, sweep: true, show: s => s.shift.formant.field === 'all' || s.shift.formant.field === 'region',
            desc: 'Positive raises F1 (a more open vowel, /ɪ/ towards /ɛ/).' },
          { path: 'shift.formant.f2', label: 'F2 shift', kind: 'range', range: s => { const r = u(s); return [r[0] * (r[3] === '%' ? 1 : 2), r[1] * (r[3] === '%' ? 1 : 2), r[2], r[3]]; }, sweep: true, show: s => s.shift.formant.field === 'all' || s.shift.formant.field === 'region',
            desc: 'Positive raises F2 (more front, /u/ towards /i/).' },
          { path: 'shift.formant.field', label: 'Where on the vowel map', kind: 'select',
            options: [['all', 'Everywhere'], ['region', 'Only inside an F1–F2 region'], ['curve', 'Varies with F2 (1-D field)'], ['painted', 'Painted on the vowel map (2-D field)'], ['variability', 'Vowel variability: inward / outward (2-D field)']],
            desc: 'Audapter looks the shift up from the current F1/F2. A restricted field only shifts vowels inside it.' },
          { path: 'shift.formant.region', kind: 'region', show: s => s.shift.formant.field === 'region', desc: 'Shift only while F1 and F2 are both inside these bounds (f1Min … f2Max).' },
          { path: 'shift.formant.curve', kind: 'curve', show: s => s.shift.formant.field === 'curve', desc: 'The shift at each F2, interpolated between points (pertAmp/pertPhi over pertF2).' },
          { path: 'shift.formant.vari.dir', label: 'Direction', kind: 'seg', show: vOn, options: [['in', 'Inward'], ['out', 'Outward']],
            desc: 'Inward pulls every production toward the vowel centre (the heard vowel varies less); outward pushes it away (varies more).' },
          { path: 'shift.formant.vari.strength', label: 'Strength', kind: 'range', show: vOn, range: [0, 100, 5, '%'], sweep: true,
            desc: 'Fraction of the distance to the centre. 50 % inward: heard = centre + 0.5 × (spoken − centre); outward: centre + 1.5 × (spoken − centre).' },
          { path: 'shift.formant.vari.maxShift', label: 'Maximum shift', kind: 'number', show: vOn, range: [0, 1000, 5, 'Hz'], desc: 'Cap on the size of the shift (in mel when the units are mel). 0 means no cap.' },
          { path: 'shift.formant.vari.centre', label: 'Vowel centre', kind: 'select', show: vOn, options: [['auto', 'Median of the current input'], ['trials', 'Median of the ticked trials (baseline)'], ['manual', 'Entered by hand']],
            desc: 'In these designs the centre is usually the median of baseline productions of the same vowel.' },
          { path: 'shift.formant.vari.c1', label: 'Centre F1', kind: 'number', show: vOn, range: [150, 1200, 1, 'Hz'], also: x => { x.shift.formant.vari.centre = 'manual'; }, desc: 'Typing a value switches the centre to "entered by hand".' },
          { path: 'shift.formant.vari.c2', label: 'Centre F2', kind: 'number', show: vOn, range: [400, 3500, 1, 'Hz'], also: x => { x.shift.formant.vari.centre = 'manual'; } },
          { path: 'shift.formant.vari.units', label: 'Space', kind: 'seg', show: vOn, options: [['hz', 'Hz'], ['mel', 'mel']], desc: 'Scale distances in Hz or in mel (bMelShift).' },
          { path: 'shift.formant.vari.ext1', label: 'Field reach, F1', kind: 'number', show: vOn, range: [50, 1000, 10, '± Hz'], desc: 'The field covers the centre ± this; formants outside are not shifted. Its 257 grid points set the step.' },
          { path: 'shift.formant.vari.ext2', label: 'Field reach, F2', kind: 'number', show: vOn, range: [100, 2000, 10, '± Hz'] },
          { path: 'shift.formant.painted', kind: 'painter', show: s => s.shift.formant.field === 'painted', desc: 'Paint shift vectors onto the F1–F2 plane (pertAmp2D/pertPhi2D, 257 × 257 cells of 19.5 Hz).' },
        ] },
      { id: 'pitch', title: 'Pitch', on: 'shift.pitch.on', blurb: 'Raise or lower the voice pitch (F0).',
        summary: s => `${PG.fmt.signed(s.shift.pitch.semitones, 1)} st, ${s.shift.pitch.method === 'pvoc' ? 'phase vocoder' : 'time domain'}`,
        controls: [
          { path: 'shift.pitch.semitones', label: 'Shift', kind: 'range', range: [-12, 12, 0.5, 'st'], sweep: true, desc: '100 cents per semitone; +12 is an octave up.' },
          { path: 'shift.pitch.method', label: 'Method', kind: 'seg', options: [['pvoc', 'Phase vocoder'], ['tds', 'Time domain']],
            desc: 'The phase vocoder shifts the whole spectrum in 16 ms blocks (more delay). Time domain resamples pitch periods, follows a schedule and needs a good pitch range.' },
          { path: 'shift.pitch.algorithm', label: 'Period alignment', kind: 'select', show: tdsOn, options: [[0, 'None'], [1, 'Peaks'], [2, 'Valleys']],
            desc: 'How the time-domain shifter aligns pitch periods (timeDomainPitchShiftAlgorithm).' },
          { path: 'shift.pitch.lower', label: 'Pitch range, low', kind: 'number', show: tdsOn, range: [40, 500, 5, 'Hz'], nullable: true,
            desc: 'Expected lowest F0 of the talker (pitchLowerBoundHz). Empty uses the preset (men 80, women 150, children 200 Hz).' },
          { path: 'shift.pitch.upper', label: 'Pitch range, high', kind: 'number', show: tdsOn, range: [80, 1000, 5, 'Hz'], nullable: true,
            desc: 'Expected highest F0 (pitchUpperBoundHz).' },
          { path: 'shift.pitch.ramp', label: 'Onset ramp', kind: 'number', show: tdsOn, range: [0.001, 2, 0.01, 's'], desc: 'Time to reach the full shift when it is scheduled to start later.' },
        ] },
      { id: 'loudness', title: 'Loudness', on: 'shift.loudness.on', blurb: 'Make the feedback louder or quieter while the perturbation is on.',
        summary: s => PG.fmt.db(s.shift.loudness.db),
        controls: [{ path: 'shift.loudness.db', label: 'Level change', kind: 'range', range: [-20, 20, 0.5, 'dB'], sweep: true,
          desc: 'Applied at zero crossings through the PCF "intensity" column (gainPerturb).' }] },
      { id: 'timing', title: 'Timing', on: 'shift.timing.on', blurb: 'Slow the feedback down, then let it catch up (a phase-vocoder time warp). It starts at the "When" start time, at voice onset, or at trial start.',
        summary: s => `×${s.shift.timing.rate1} for ${s.shift.timing.dur1} s`,
        controls: [
          { path: 'shift.timing.rate1', label: 'Slow-down rate', kind: 'range', range: [0.1, 1, 0.05, '×'], sweep: true, desc: '0.5 plays the feedback at half speed during the slow-down.' },
          { path: 'shift.timing.dur1', label: 'Slow-down length', kind: 'number', range: [0.01, 1, 0.01, 's'], desc: 'How long the feedback is slowed.' },
          { path: 'shift.timing.hold', label: 'Hold', kind: 'number', range: [0, 1, 0.01, 's'], desc: 'Time the lag is held before catching up.' },
          { path: 'shift.timing.rate2', label: 'Catch-up rate', kind: 'number', range: [1.05, 4, 0.05, '×'], desc: 'Faster than real time until the feedback is back in sync.' },
        ] },
      { id: 'delay', title: 'Delay', on: 'shift.delay.on', blurb: 'Delayed auditory feedback (DAF): the participant hears themselves late.',
        summary: s => `${s.shift.delay.ms} ms`,
        controls: [{ path: 'shift.delay.ms', label: 'Delay', kind: 'range', range: [0, 1000, 10, 'ms'], sweep: true,
          desc: 'Added on top of Audapter\'s own processing delay (delayFrames, in frames of frameLen).' }] },
    ] },
    { id: 'when', title: 'When', blurb: 'When the shift is on during each trial.', controls: [
      { path: 'when.mode', label: 'Perturb', kind: 'choice', options: [
        ['always', 'Always', 'Whenever the voice is above the tracking threshold.'],
        ['after', 'After a delay', 'From a fixed time into the trial (an OST ELAPSED_TIME rule).'],
        ['window', 'In a time window', 'Between two times (two ELAPSED_TIME rules).'],
        ['vowel', 'During the vowel', 'From voice onset (level rises and holds) until the level falls (INTENSITY_RISE_HOLD, INTENSITY_FALL).'],
        ['design', 'As designed on the Timing & design tab', 'Blocks drawn on a timeline, anchored to the sounds Audapter detects.'],
        ['custom', 'Custom OST/PCF', 'Your own online status tracking (OST) and perturbation (PCF) files, under Timing & design, advanced.']] },
      { path: 'when.after', label: 'Start', kind: 'number', range: [0, 10, 0.05, 's'], sweep: true, show: s => s.when.mode === 'after' || s.when.mode === 'window', desc: 'Time from the start of the trial.' },
      { path: 'when.until', label: 'End', kind: 'number', range: [0, 10, 0.05, 's'], show: s => s.when.mode === 'window', desc: 'Time from the start of the trial.' },
      { path: 'when.onThresh', label: 'Onset level', kind: 'number', range: [0.001, 0.2, 0.001, 'RMS'], show: s => s.when.mode === 'vowel', desc: 'Voice onset: level above this…' },
      { path: 'when.onHold', label: 'Onset hold', kind: 'number', range: [0, 0.5, 0.005, 's'], show: s => s.when.mode === 'vowel', desc: '…for at least this long.' },
      { path: 'when.onDelay', label: 'Start after onset', kind: 'number', range: [0, 2, 0.01, 's'], show: s => s.when.mode === 'vowel', desc: 'Wait this long after onset before shifting (an extra ELAPSED_TIME state).' },
      { path: 'when.offThresh', label: 'Offset level', kind: 'number', range: [0.001, 0.2, 0.001, 'RMS'], show: s => s.when.mode === 'vowel', desc: 'Stop when the level falls below this…' },
      { path: 'when.offHold', label: 'Offset minimum', kind: 'number', range: [0, 0.5, 0.005, 's'], show: s => s.when.mode === 'vowel', desc: '…and more than this has passed since onset.' },
      { kind: 'ostlink', show: s => s.when.mode !== 'always' && s.when.mode !== 'design' },
      { kind: 'designlink', show: s => s.when.mode === 'design' },
    ] },
    { id: 'listen', title: 'How Audapter listens', blurb: 'Tracking settings. Presets set these; change them to see how tracking and shifting respond.', controls: [
      { path: 'listen.nlpc', param: 'nlpc', label: 'LPC order', kind: 'number', range: [6, 24, 1, ''], sweep: true, int: true,
        desc: 'Model complexity for formant tracking. Too high splits a formant, too low merges them: about 11 for children, 15 women, 17 men.' },
      { path: 'listen.framelen', param: 'framelen', label: 'Frame length', kind: 'select', options: [[16, '16 samples (1 ms)'], [32, '32 samples (2 ms)'], [48, '48 samples (3 ms)'], [64, '64 samples (4 ms)'], [96, '96 samples (6 ms)']], num: true,
        desc: 'Audapter processes the 16 kHz signal in frames of this size. Longer frames lengthen the analysis window.' },
      { path: 'listen.ndelay', param: 'ndelay', label: 'Look-ahead frames', kind: 'number', range: [2, 12, 1, 'frames'], sweep: true, int: true,
        desc: 'nDelay: Audapter\'s processing delay in frames; also sets the analysis window.' },
      { kind: 'derived' },
      { path: 'listen.rmsthr', param: 'rmsthr', label: 'Tracking threshold', kind: 'number', range: [0.0005, 0.2, 0.0005, 'RMS'], sweep: true,
        desc: 'rmsThresh: quieter frames are not tracked or shifted (and the time-domain schedule clock pauses).' },
      { path: 'listen.rmsratio', param: 'rmsratio', label: 'Voicing ratio threshold', kind: 'number', range: [0, 5, 0.05, ''],
        desc: 'rmsRatioThresh: frames with more high-frequency energy than this (like /s/) are treated as unvoiced.' },
      { path: 'listen.fn1', param: 'fn1', label: 'F1 prior', kind: 'number', range: [200, 1200, 10, 'Hz'], desc: 'Where the tracker expects F1 when it starts (fn1).' },
      { path: 'listen.fn2', param: 'fn2', label: 'F2 prior', kind: 'number', range: [600, 3000, 10, 'Hz'], desc: 'Where the tracker expects F2 (fn2).' },
      { path: 'listen.avglen', param: 'avglen', label: 'Formant smoothing', kind: 'number', range: [1, 30, 1, 'frames'], int: true, desc: 'Moving-average length for tracked formants (avgLen).' },
      { path: 'listen.bcepslift', param: 'bcepslift', label: 'Cepstral liftering', kind: 'toggle', desc: 'Smooth the spectrum before LPC; required for time-domain pitch shifting (bCepsLift).' },
      { path: 'listen.cepswinwidth', param: 'cepswinwidth', label: 'Lifter width', kind: 'number', range: [5, 100, 1, ''], int: true, show: s => PG.effParam(s, 'bcepslift') === 1, desc: 'cepsWinWidth: wider keeps more spectral detail.' },
      { path: 'listen.btrack', param: 'btrack', label: 'Formant tracking', kind: 'toggle', desc: 'Off disables tracking, and with it formant shifting (bTrack).' },
    ] },
    { id: 'hear', title: 'What the participant hears', blurb: 'The mix sent to the headphones.', controls: [
      { path: 'hear.fb', label: 'Feedback', kind: 'select', num: true, options: [[1, 'Speech (normal)'], [0, 'Nothing (muted)'], [2, 'Noise only'], [3, 'Speech + noise'], [4, 'Speech-modulated noise'], [5, 'Speech-modulated + constant noise (blab)']],
        desc: 'Feedback mode (fb). Modes 2–5 play the noise below.' },
      { path: 'hear.noise.type', label: 'Noise', kind: 'seg', options: [['pink', 'Pink'], ['white', 'White']], show: s => s.hear.fb >= 2, desc: 'Generated here and loaded as datapb.' },
      { path: 'hear.noise.seconds', label: 'Noise length', kind: 'number', range: [0.5, 10, 0.5, 's'], sweep: true, show: s => s.hear.fb >= 2, desc: 'Audapter loops the noise; 10 s is the maximum it holds.' },
      { path: 'hear.noise.level', label: 'Noise level', kind: 'range', range: [-60, 0, 1, 'dBFS'], sweep: true, show: s => s.hear.fb >= 2, desc: 'RMS of the generated noise.' },
      { path: 'hear.noise.gain', label: 'Noise gain', kind: 'number', range: [0, 4, 0.05, '×'], show: s => s.hear.fb === 2 || s.hear.fb === 3 || s.hear.fb === 5, desc: 'fb2Gain / fb3Gain / fb5Gain_playback. Audapter\'s own default for mode 3 is 0 (silent).' },
      { path: 'hear.gainDb', label: 'Output gain', kind: 'range', range: [-20, 20, 0.5, 'dB'], sweep: true, desc: 'Scales dScale, the output calibration factor (0.795 in the blab defaults).' },
    ] },
  ];

  // Effective Audapter parameter value (after preset + listen overrides + raw), for display.
  PG.effParam = (s, name) => { const m = S.compile(s).map, v = m.get(name); return Array.isArray(v) ? v[0] : v; };
  PG.controlValue = (s, c) => {
    if (c.param) { const v = s.listen[c.param]; if (v !== undefined && v !== null && v !== '') return v; const b = S.baseParams(s).get(c.param); return Array.isArray(b) ? b[0] : b; }
    return S.getPath(s, c.path);
  };
  PG.controlRange = (s, c) => (typeof c.range === 'function' ? c.range(s) : c.range);
  PG.allControls = () => { const out = []; for (const g of PG.GROUPS) { for (const c of g.controls || []) if (c.path) out.push({ ...c, group: g }); for (const cd of g.cards || []) for (const c of cd.controls) if (c.path) out.push({ ...c, group: g, card: cd }); } return out; };
  PG.controlByPath = p => PG.allControls().find(c => c.path === p);
})();
