// Playground settings model, shared by the page and the engine worker (no DOM).
// A settings object is small, readable JSON. compile() turns it into exactly what MATLAB would send:
// an ordered list of Audapter setParam calls (blab AudapterIO('init') order) plus OST and PCF texts.
(function (G) {
  'use strict';
  const DEF = G.AUD_DEFAULTS;          // { female: [[name, value], ...], male: [...] } recorded from blab AudapterIO('init')
  const decode = v => (v && typeof v === 'object' && !Array.isArray(v) && 'fill' in v) ? new Array(v.n).fill(v.fill) : v;
  const hz2mel = f => 1127.01048 * Math.log(1 + f / 700);   // Audapter utils.cpp hz2mel
  const clone = o => JSON.parse(JSON.stringify(o));
  const GRID = 257, FMAX = 5000;
  const noiseCache = new Map();

  // ---------- presets: starting points built on the recorded blab defaults
  const PRESETS = {
    female: { label: 'Adult female', sex: 'female', params: {},
      note: 'blab getAudapterDefaultParams(\'female\'): nLPC 15, frameLen 32, nDelay 5.' },
    male: { label: 'Adult male', sex: 'male', params: {},
      note: 'blab getAudapterDefaultParams(\'male\'): nLPC 17. On some low /a/ vowels it reports F3 as F2 (CORPUS-4).' },
    child: { label: 'Child', sex: 'female', params: { nlpc: 11 },
      note: 'Female defaults with nLPC 11. With nLPC 15, F2 of 6-7-year-olds was underestimated by about 12 % (CORPUS-3).' },
    lowvoice: { label: 'Low voice, upstream demo', sex: 'male', params: { framelen: 64, ndelay: 7, bcepslift: 1, pitchlowerboundhz: 80, pitchupperboundhz: 160 },
      note: 'Male defaults with frameLen 64 and nDelay 7, as upstream time_domain_shift_demo.m. A longer analysis window, so pitch below ~180 Hz is tracked (CORPUS-8), at 14 ms more delay.' },
  };

  // ---------- timeline design (the "Timing & design" tab): blocks anchored to events Audapter's level rules can detect
  // ref: {ev: 't0'|'on'|'off'|'dur'|'none', k: sound number (1-based), ms: offset after the event}
  function defaultDesign() {
    return { template: 'step', tpl: { delay: 200, jitter: 0, start: 20, n: 2, at: 300, dur: 150, hold: 500 },
      detect: { auto: true, onDb: -12, offDb: -18, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offMin: 0.02 },
      blocks: [{ start: { ev: 'on', k: 1, ms: 200 }, end: { ev: 'none', k: 1, ms: 0 }, what: { f1: 20, f2: 0, st: 0, db: 0 } }] };
  }
  const TEMPLATES = {
    whole: { label: 'Whole utterance', blurb: 'On for the whole trial.', controls: [],
      blocks: t => [{ start: { ev: 't0', k: 1, ms: 0 }, end: { ev: 'none', k: 1, ms: 0 } }] },
    step: { label: 'Sudden step after voice onset', blurb: 'Turns on a fixed time after the voice starts and stays on.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['jitter', 'Random extra delay, up to', 'ms', 0, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'none', k: 1, ms: 0 } }] },
    vowel: { label: 'During the vowel only', blurb: 'From voice onset to the end of the first sound.', controls: [['start', 'Start after voice onset', 'ms', 20, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.start }, end: { ev: 'off', k: 1, ms: 0 } }] },
    nth: { label: 'Nth word or syllable', blurb: 'Only during one sound, as Audapter\'s level rules count them.', controls: [['n', 'Sound number', '', 1, 20, 1]],
      blocks: t => [{ start: { ev: 'on', k: Math.max(1, t.n | 0), ms: 20 }, end: { ev: 'off', k: Math.max(1, t.n | 0), ms: 0 } }] },
    pulse: { label: 'Brief pulse', blurb: 'A short perturbation some time after voice onset.', controls: [['at', 'Starts after voice onset', 'ms', 20, 3000, 10], ['dur', 'Lasts', 'ms', 10, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.at }, end: { ev: 'dur', k: 1, ms: t.dur } }] },
    stepback: { label: 'Step, then return', blurb: 'On after voice onset, then back to normal while the voice continues.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['hold', 'Stays on for', 'ms', 50, 5000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'dur', k: 1, ms: t.hold } }] },
  };
  const refText = (r, isEnd) => r.ev === 't0' ? (r.ms ? `${r.ms} ms into the trial` : 'the trial start') : r.ev === 'none' ? 'the end of the trial'
    : r.ev === 'dur' ? `${r.ms} ms later` : `${r.ms ? r.ms + ' ms after ' : ''}sound ${r.k} ${r.ev === 'on' ? 'starts' : 'ends'}`;

  // Compile blocks to a linear OST chain. Every "sound ends" rule (INTENSITY_FALL) comes after the matching "sound starts"
  // rule (INTENSITY_RISE_HOLD), which sets Audapter's lastStatEnd within the trial, so no rule depends on the previous
  // trial (OST-F1); no maxIOI (OST-F2) and no AND_RATIO rules (OST-F8) are used.
  function compileDesign(d) {
    const det = d.detect, rules = [], bounds = [], errors = [], notes = [];
    let s = 0, next = { ev: 'on', k: 1 }, known = true, abs = 0;
    const evIdx = r => (r.k - 1) * 2 + (r.ev === 'off' ? 1 : 0), nextIdx = () => evIdx(next);
    const add = (mode, p1, p2, span) => { rules.push({ stat: s, mode, p1, p2, p3: null }); s += span; };
    function to(ref, label, startState) {
      if (ref.ev === 'none') return null;
      if (ref.ev === 't0') {
        if (!known) { errors.push(`${label}: Audapter can only time from the trial start while nothing else has been detected yet. Anchor it to a sound instead.`); return s; }
        const dt = ref.ms / 1000 - abs;
        if (dt < 0) { errors.push(`${label}: it comes before the previous boundary.`); return s; }
        if (dt > 0) add('ELAPSED_TIME', dt, NaN, 1);
        abs = ref.ms / 1000; return s;
      }
      if (ref.ev === 'dur') { if (ref.ms > 0) add('ELAPSED_TIME', ref.ms / 1000, NaN, 1); abs += ref.ms / 1000; return s; }
      const target = evIdx(ref);
      if (target < nextIdx()) { errors.push(`${label}: sound ${ref.k} ${ref.ev === 'on' ? 'start' : 'end'} has already gone by at this point of the design; Audapter's rules only move forward.`); return s; }
      while (nextIdx() <= target) {
        if (next.ev === 'on') { add('INTENSITY_RISE_HOLD', det.onThresh, det.onHold, 2); next = { ev: 'off', k: next.k }; }
        else { add('INTENSITY_FALL', det.offThresh, det.offMin, 1); next = { ev: 'on', k: next.k + 1 }; }
      }
      known = false;
      let extra = ref.ms / 1000 - (ref.ev === 'on' ? det.onHold : 0);
      if (extra < -1e-9) { notes.push(`${label}: Audapter confirms a voice onset only after the ${Math.round(det.onHold * 1000)} ms hold, so the earliest start is onset + ${Math.round(det.onHold * 1000)} ms.`); extra = 0; }
      if (extra > 1e-9) add('ELAPSED_TIME', extra, NaN, 1);
      return s;
    }
    d.blocks.forEach((b, i) => {
      const a = to(b.start, `Block ${i + 1} start`);
      if (a === null) { errors.push(`Block ${i + 1} needs a start.`); return; }
      if (b.end.ev === 'dur' && !(b.end.ms > 0)) errors.push(`Block ${i + 1} has no duration.`);
      const e = to(b.end, `Block ${i + 1} end`);
      bounds.push({ block: i, start: a, end: e === null ? Infinity : e });
      if (e === null && i < d.blocks.length - 1) errors.push(`Block ${i + 1} lasts to the end of the trial, so later blocks can never start.`);
    });
    rules.push({ stat: s, mode: 'OST_END', p1: NaN, p2: NaN, p3: null });
    const nStates = s + 1, whatOf = [];
    for (let k = 0; k < nStates; k++) { const b = bounds.find(x => k >= x.start && k < x.end); whatOf.push(b ? { block: b.block, ...d.blocks[b.block].what } : null); }
    return { ost: { rmsSlopeWin: 0.03, rules, maxIOI: [] }, nStates, whatOf, bounds, errors, notes };
  }

  // ---------- vowel variability field (inward / outward): heard = centre + k (spoken - centre), k = 1 -/+ strength.
  // Compiled to Audapter's 2-D field with absolute units (bRatioShift = 0): sF1 = F1 + amp cos(phi), sF2 = F2 + amp sin(phi)
  // (Audapter.cpp:1858-1860), pertAmp2D[i][j] with i = F1 grid index, j = F2 grid index (MATLAB column-major i + 257 j).
  // Audapter reads the lower-left cell without interpolating (FMT-F3), so each cell holds the value at its centre:
  // the applied shift is piecewise constant, within half a grid step of the intended one per axis.
  const variCache = { key: '', v: null };
  const mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);
  function variField(v) {
    const key = JSON.stringify(v);
    if (variCache.key === key) return variCache.v;
    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f);
    const c1 = cv(v.c1), c2 = cv(v.c2);
    const lo1 = cv(Math.max(60, v.c1 - v.ext1)), hi1 = cv(v.c1 + v.ext1), lo2 = cv(Math.max(200, v.c2 - v.ext2)), hi2 = cv(v.c2 + v.ext2);
    const g1 = Array.from({ length: GRID }, (_, i) => lo1 + (hi1 - lo1) * i / (GRID - 1)), g2 = Array.from({ length: GRID }, (_, j) => lo2 + (hi2 - lo2) * j / (GRID - 1));
    const st1 = g1[1] - g1[0], st2 = g2[1] - g2[0], k = (v.strength || 0) / 100, sign = v.dir === 'out' ? 1 : -1;
    const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0);
    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
      const d1 = g1[i] + st1 / 2 - c1, d2 = g2[j] + st2 / 2 - c2, dist = Math.hypot(d1, d2);
      let amp = k * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);
      A2[i + GRID * j] = amp; P2[i + GRID * j] = dist > 0 ? Math.atan2(sign * d2, sign * d1) : 0;
    }
    const out = { g1, g2, A2, P2, mel, c1, c2, step1: st1, step2: st2, lo1, hi1, lo2, hi2 };
    variCache.key = key; variCache.v = out;
    return out;
  }
  // Audapter's 2-D lookup (locateF1/locateF2 binary search, Audapter.cpp:2675-2727, then the lower-left cell) and shift,
  // for a compiled parameter map. Returns [sF1, sF2] in Hz, or null outside the field bounds.
  function apply2D(m, f1, f2) {
    const g1 = m.get('pertf1'), g2 = m.get('pertf2'), A = m.get('pertamp2d'), P = m.get('pertphi2d');
    const mel = Number([].concat(m.get('bmelshift'))[0]) === 1, ratio = Number([].concat(m.get('bratioshift'))[0]) === 1;
    const x1 = mel ? hz2mel(f1) : f1, x2 = mel ? hz2mel(f2) : f2;
    const b = k => Number([].concat(m.get(k))[0]);
    if (!(x2 >= b('f2min') && x2 <= b('f2max') && x1 >= b('f1min') && x1 <= b('f1max'))) return null;
    const locate = (g, f) => {
      let k = 128; for (let n = 0; n < 7; n++) k += (f >= g[k] ? 1 : -1) * (1 << (6 - n));
      if (f < g[k]) k--;
      let loc = k + (f - g[k]) / (g[k + 1] - g[k]);
      if (loc >= GRID - 1) loc = GRID - 1 - 1e-12; if (loc < 0) loc = 0;
      return Math.floor(loc);
    };
    const i = locate(g1, x1), j = locate(g2, x2), amp = A[i + GRID * j], phi = P[i + GRID * j];
    const s1 = ratio ? x1 * (1 + amp * Math.cos(phi)) : x1 + amp * Math.cos(phi), s2 = ratio ? x2 * (1 + amp * Math.sin(phi)) : x2 + amp * Math.sin(phi);
    return mel ? [mel2hz(s1), mel2hz(s2)] : [s1, s2];
  }
  // The intended (smooth) heard point for the variability field, in Hz.
  function variIntended(v, f1, f2) {
    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f), inv = x => (mel ? mel2hz(x) : x);
    const c1 = cv(v.c1), c2 = cv(v.c2), x1 = cv(f1), x2 = cv(f2), d1 = x1 - c1, d2 = x2 - c2, dist = Math.hypot(d1, d2);
    let amp = (v.strength / 100) * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);
    const sg = v.dir === 'out' ? 1 : -1, u1 = dist ? sg * d1 / dist : 0, u2 = dist ? sg * d2 / dist : 0;
    return [inv(x1 + amp * u1), inv(x2 + amp * u2)];
  }

  // What a custom OST/PCF or a timeline design sets per state, for the cards (so they never show a stale value).
  function pcfShifts(s) {
    const c = compile(s), m = c.map; if (!c.pcf) return null;
    const p = parsePcf(c.pcf), ratio = num(m, 'bratioshift') === 1, mel = num(m, 'bmelshift') === 1;
    const u = ratio ? '%' : mel ? ' mel' : ' Hz', sc = ratio ? 100 : 1, r1 = v => +(v * sc).toFixed(ratio ? 1 : 0), sg = v => (v > 0 ? '+' : '') + v;
    const F = [], P = [], L = [];
    p.rows.forEach((r, k) => {
      if (r.amp) { const f1 = r1(r.amp * Math.cos(r.phi)), f2 = r1(r.amp * Math.sin(r.phi)); F.push(`${[f1 ? `F1 ${sg(f1)}${u}` : '', f2 ? `F2 ${sg(f2)}${u}` : ''].filter(Boolean).join(', ') || `amplitude ${r.amp}`} in state ${k}`); }
      if (r.pitch) P.push(`${sg(r.pitch)} st in state ${k}`);
      if (r.db) L.push(`${sg(r.db)} dB in state ${k}`);
    });
    const Wp = p.warps.map(w => `warp ×${w.rate1} for ${w.dur1} s${w.ostInitState !== null ? ` from state ${w.ostInitState}` : ` at ${w.tBegin} s`}`);
    const src = s.when.mode === 'design' ? 'set by the timeline design' : 'set by the OST/PCF';
    return { src, formant: F, pitch: P, level: L, warp: Wp, bshift: num(m, 'bshift') === 1, bpitch: num(m, 'bpitchshift') === 1 };
  }

  function defaultSettings() {
    return {
      v: 1, preset: 'female', build: 'lite',
      shift: {
        formant: { on: true, units: 'pct', f1: 20, f2: 0, field: 'all',
          region: { f1min: 250, f1max: 1000, f2min: 600, f2max: 3000 },
          curve: [[800, 0, 0], [1500, 20, 0], [2500, 0, 0]],
          painted: { res: 4, cells: [] },
          vari: { dir: 'in', strength: 50, maxShift: 0, centre: 'auto', c1: 600, c2: 1700, units: 'hz', ext1: 450, ext2: 900 } },
        pitch: { on: false, method: 'pvoc', semitones: 2, algorithm: 0, lower: null, upper: null, ramp: 0.05 },
        loudness: { on: false, db: 6 },
        timing: { on: false, rate1: 0.5, dur1: 0.1, hold: 0.1, rate2: 2 },
        delay: { on: false, ms: 100 },
      },
      when: { mode: 'always', after: 0.3, until: 1.0, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offHold: 0.02, onDelay: 0, ost: '', pcf: '' },
      design: defaultDesign(),
      listen: {},
      hear: { fb: 1, noise: { type: 'pink', seconds: 10, level: -20, gain: 1 }, gainDb: 0 },
      raw: {},
    };
  }

  // Deep-merge onto defaults so partial / older JSON loads safely.
  function normalize(s) {
    const d = defaultSettings();
    const merge = (a, b) => {
      if (b === undefined || b === null) return a;
      if (Array.isArray(a) || typeof a !== 'object' || a === null) return b;
      const o = { ...a };
      for (const k of Object.keys(b)) o[k] = (k in a) ? merge(a[k], b[k]) : b[k];
      return o;
    };
    const o = merge(d, s || {});
    if (!PRESETS[o.preset]) o.preset = 'female';
    return o;
  }

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) { const ks = p.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null) a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; return o; }

  // Base parameter map (ordered) for a preset, after the "how Audapter listens" overrides.
  function baseParams(s) {
    const pr = PRESETS[s.preset] || PRESETS.female;
    const m = new Map(DEF[pr.sex].map(([k, v]) => [k.toLowerCase(), decode(v)]));
    const put = (k, v) => { if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v); };
    for (const [k, v] of Object.entries(pr.params)) put(k, v);
    for (const [k, v] of Object.entries(s.listen || {})) put(k, v);
    return m;
  }
  const num = (m, k) => { const v = m.get(k); return Array.isArray(v) ? Number(v[0]) : Number(v); };

  // ---------- OST / PCF text formats
  const OST_MODES = {
    OST_END: { code: 0, span: 0, sets: false, params: [], text: 'Final state: nothing happens after this.' },
    ELAPSED_TIME: { code: 1, span: 1, sets: false, params: ['duration (s)'],
      text: 'Move on after a fixed time in this state.' },
    INTENSITY_RISE_HOLD: { code: 5, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],
      text: 'Level rises above the threshold (next state), and moves on once it has stayed above it for the hold time; drops back if it falls first.' },
    INTENSITY_RISE_HOLD_POS_SLOPE: { code: 6, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],
      text: 'Like the rise-and-hold rule, but the level must also keep rising during the hold.' },
    POS_INTENSITY_SLOPE_STRETCH: { code: 10, span: 2, sets: true, params: ['frames of rising level'],
      text: 'The level keeps rising for more than the given number of frames.' },
    NEG_INTENSITY_SLOPE_STRETCH_SPAN: { code: 11, span: 2, sets: true, params: ['frames of falling level', 'summed slope below'],
      text: 'The level keeps falling for more than the given number of frames, by more than the given total slope.' },
    INTENSITY_SLOPE_BELOW_THRESH: { code: 12, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],
      text: 'The level slope stays below the threshold for the duration.' },
    INTENSITY_SLOPE_ABOVE_THRESH: { code: 13, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],
      text: 'The level slope stays above the threshold for the duration.' },
    INTENSITY_FALL: { code: 20, span: 1, sets: true, params: ['level threshold (RMS)', 'minimum time (s)'],
      text: 'Level has been below the threshold for 10 ms, and more than the minimum time has passed since the last level-based state change.' },
    INTENSITY_BELOW_THRESH_NEG_SLOPE: { code: 21, span: 2, sets: true, params: ['level threshold (RMS)', 'duration (s)'],
      text: 'Level is below the threshold and falling, for the duration.' },
    INTENSITY_RATIO_RISE: { code: 30, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio (high for /s/-like sounds) rises above the threshold, holds, then falls back.' },
    INTENSITY_RATIO_FALL_HOLD: { code: 31, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio falls below the threshold and holds.' },
    INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR: { code: 32, span: 2, sets: false, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio stays above the threshold (ignored when the level is below 0.0003).' },
    INTENSITY_AND_RATIO_ABOVE_THRESH: { code: 40, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],
      text: 'Both level and high-frequency ratio are above their thresholds, for the hold time. Blab reads the hold from the 5th field, where the manual puts {} (OST-F8).' },
    INTENSITY_AND_RATIO_BELOW_THRESH: { code: 45, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],
      text: 'Both level and high-frequency ratio are below their thresholds, for the hold time (hold in the 5th field, OST-F8).' },
  };
  const OST_BY_CODE = Object.fromEntries(Object.entries(OST_MODES).map(([k, v]) => [v.code, k]));
  const fmtNum = v => (v === null || v === undefined || Number.isNaN(v)) ? 'NaN' : String(+Number(v).toPrecision(6));

  function parseOst(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
    const out = { rmsSlopeWin: 0.03, rules: [], maxIOI: [], errors: [] };
    if (!lines.length) return out;
    let i = 0;
    const m0 = /^rmsSlopeWin\s*=\s*(\S+)$/.exec(lines[i]);
    if (!m0) out.errors.push(`line 1: expected "rmsSlopeWin = <s>", got "${lines[i]}"`); else { out.rmsSlopeWin = +m0[1]; i++; }
    const m1 = /^n\s*=\s*(\d+)$/.exec(lines[i] || '');
    if (!m1) { out.errors.push(`expected "n = <number of rules>"`); return out; }
    const n = +m1[1]; i++;
    for (let k = 0; k < n; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean);
      if (it.length !== 5) { out.errors.push(`rule ${k + 1}: expected 5 fields, got ${it.length} ("${lines[i] || ''}")`); continue; }
      let mode = it[1];
      if (/^\d+$/.test(mode)) mode = OST_BY_CODE[+mode] || mode;
      if (!OST_MODES[mode]) out.errors.push(`rule ${k + 1}: unknown mode "${it[1]}"`);
      const p = x => (x === '{}' ? null : x.toLowerCase() === 'nan' ? NaN : +x);
      out.rules.push({ stat: +it[0], mode, p1: p(it[2]), p2: p(it[3]), p3: p(it[4]) });
    }
    const m2 = /^n\s*=\s*(\d+)$/.exec(lines[i] || '');
    if (m2) {
      i++;
      for (let k = 0; k < +m2[1]; k++, i++) {
        const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean);
        if (it.length !== 3) { out.errors.push(`maxIOI line ${k + 1}: expected 3 fields`); continue; }
        out.maxIOI.push({ stat0: +it[0], interval: +it[1], stat1: +it[2] });
      }
    }
    return out;
  }
  function serializeOst(o) {
    const f = v => (v === null || v === undefined) ? '{}' : fmtNum(v);
    return `rmsSlopeWin = ${Number(o.rmsSlopeWin ?? 0.03).toFixed(6)}\n\nn = ${o.rules.length}\n` +
      o.rules.map(r => `${r.stat} ${r.mode} ${f(r.p1)} ${f(r.p2)} ${f(r.p3)}`).join('\n') +
      `\n\nn = ${o.maxIOI.length}\n` + o.maxIOI.map(m => `${m.stat0} ${fmtNum(m.interval)} ${m.stat1}`).join('\n') + (o.maxIOI.length ? '\n' : '');
  }
  function ostStateCount(o) {
    let mx = 0;
    for (const r of o.rules) mx = Math.max(mx, r.stat + (OST_MODES[r.mode] ? OST_MODES[r.mode].span : 0));
    for (const m of o.maxIOI) mx = Math.max(mx, m.stat1, m.stat0);
    return o.rules.length ? mx + 1 : 0;
  }
  function parsePcf(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
    const out = { warps: [], rows: [], errors: [] };
    if (!lines.length) return out;
    let i = 0;
    const nw = +lines[i++];
    if (!Number.isInteger(nw)) { out.errors.push('line 1: expected the number of time-warp events'); return out; }
    for (let k = 0; k < nw; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (it.length === 5) out.warps.push({ ostInitState: null, tBegin: it[0], rate1: it[1], dur1: it[2], hold: it[3], rate2: it[4] });
      else if (it.length === 6) out.warps.push({ ostInitState: it[0], tBegin: it[1], rate1: it[2], dur1: it[3], hold: it[4], rate2: it[5] });
      else out.errors.push(`warp ${k + 1}: expected 5 or 6 fields`);
    }
    const n = +lines[i++];
    if (!Number.isInteger(n)) { out.errors.push('expected the number of state rows'); return out; }
    for (let k = 0; k < n; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (it.length !== 5) { out.errors.push(`row ${k + 1}: expected 5 fields (state, pitch st, level dB, formant amp, formant angle)`); continue; }
      if (it[0] !== k) out.errors.push(`row ${k + 1}: state number must be ${k} (Audapter rejects out-of-order rows)`);
      out.rows.push({ stat: it[0], pitch: it[1], db: it[2], amp: it[3], phi: it[4] });
    }
    return out;
  }
  function serializePcf(o) {
    const w = o.warps.map(x => (x.ostInitState === null || x.ostInitState === undefined ? '' : `${x.ostInitState}, `) +
      [x.tBegin, x.rate1, x.dur1, x.hold, x.rate2].map(fmtNum).join(', '));
    return `${o.warps.length}\n${w.join('\n')}${w.length ? '\n' : ''}\n${o.rows.length}\n` +
      o.rows.map((r, i) => `${i}, ${fmtNum(r.pitch)}, ${fmtNum(r.db)}, ${fmtNum(r.amp)}, ${fmtNum(r.phi)}`).join('\n') + '\n';
  }

  // ---------- formant perturbation vector in Audapter's units
  function fmtVector(fm) {
    if (fm.units === 'pct') return { amp: Math.hypot(fm.f1 / 100, fm.f2 / 100), phi: Math.atan2(fm.f2 / 100, fm.f1 / 100) };
    return { amp: Math.hypot(fm.f1, fm.f2), phi: Math.atan2(fm.f2, fm.f1) };   // Hz or mel
  }
  const unitsFlags = u => (u === 'pct' ? { bratioshift: 1, bmelshift: 0 } : u === 'hz' ? { bratioshift: 0, bmelshift: 0 } : { bratioshift: 0, bmelshift: 1 });

  // ---------- compile: settings -> { list: [[name, value]], ost, pcf, notes, meta }
  function compile(settings) {
    const s = normalize(settings), m = baseParams(s), notes = [];
    const sr = num(m, 'srate'), frameLen = num(m, 'framelen'), nDelay = num(m, 'ndelay');
    const F = s.shift.formant, Pi = s.shift.pitch, L = s.shift.loudness, T = s.shift.timing, D = s.shift.delay, W = s.when;
    const isDesign = W.mode === 'design', cd = isDesign ? compileDesign(s.design) : null;
    const isCustom = W.mode === 'custom', cp = isCustom ? parsePcf(W.pcf || '') : null;
    const cF = isCustom && cp.rows.some(r => r.amp), cP = isCustom && (cp.rows.some(r => r.pitch) || cp.warps.length > 0);
    const anyW = k => isDesign && s.design.blocks.some(b => b.what && b.what[k]);
    const fOn = isDesign ? (anyW('f1') || anyW('f2')) : isCustom ? cF : F.on && (F.f1 !== 0 || F.f2 !== 0 || F.field === 'curve' || F.field === 'painted' || F.field === 'variability');
    const pvoc = isDesign ? anyW('st') : isCustom ? cP : Pi.on && Pi.method === 'pvoc', tds = !isDesign && !isCustom && Pi.on && Pi.method === 'tds';
    const timeWhen = W.mode !== 'always';
    // A PCF is needed for anything per-state: level shifts, time warps, pvoc pitch or formant shifts that are not always on.
    const needPcf = isDesign || W.mode === 'custom' || (L.on && L.db !== 0) || (T.on && !isDesign) || (timeWhen && (fOn || pvoc));
    if (isCustom) {
      if (Pi.on && Pi.method === 'tds') notes.push({ where: 'when', text: 'Time-domain pitch shifting follows its own schedule, not OST states; with a custom OST/PCF the pitch column uses the phase vocoder.' });
      if (T.on) notes.push({ where: 'when', text: 'The time-warp card is not used with a custom OST/PCF; warps come from the PCF.' });
      if (L.on) notes.push({ where: 'when', text: 'The loudness card is not used with a custom OST/PCF; levels come from the PCF.' });
    }
    if (isDesign) {
      if (Pi.on && Pi.method === 'tds' && anyW('st')) notes.push({ where: 'when', text: 'Time-domain pitch shifting follows its own schedule, not OST states, so a timeline design shifts pitch with the phase vocoder.' });
      if (T.on) notes.push({ where: 'when', text: 'The time-warp card is not used by a timeline design.' });
      if (F.on && F.field !== 'all') notes.push({ where: 'when', text: 'A timeline design uses a PCF, so the formant shift is uniform (the field shape is not used).' });
    }
    const vec = fmtVector(F), mel = F.units === 'mel';

    // formant shift
    if (fOn) {
      m.set('bshift', 1);
      for (const [k, v] of Object.entries(unitsFlags(F.units))) m.set(k, v);
      const top = mel ? hz2mel(FMAX) : FMAX, grid = Array.from({ length: GRID }, (_, i) => top * i / (GRID - 1));
      m.set('pertf1', grid); m.set('pertf2', grid);
      const cv = f => (mel ? hz2mel(f) : f);
      if (!needPcf && F.field === 'region') {
        m.set('f1min', cv(F.region.f1min)); m.set('f1max', cv(F.region.f1max)); m.set('f2min', cv(F.region.f2min)); m.set('f2max', cv(F.region.f2max));
      }
      if (!needPcf && F.field === 'curve') {
        const pts = [...F.curve].sort((a, b) => a[0] - b[0]), amp = [], phi = [];
        for (let i = 0; i < GRID; i++) {
          const f2 = FMAX * i / (GRID - 1);
          let d1 = 0, d2 = 0;
          if (pts.length) {
            if (f2 <= pts[0][0]) [, d1, d2] = pts[0];
            else if (f2 >= pts[pts.length - 1][0]) [, d1, d2] = pts[pts.length - 1];
            else for (let k = 0; k < pts.length - 1; k++) if (f2 >= pts[k][0] && f2 <= pts[k + 1][0]) {
              const u = (f2 - pts[k][0]) / Math.max(1e-9, pts[k + 1][0] - pts[k][0]);
              d1 = pts[k][1] + u * (pts[k + 1][1] - pts[k][1]); d2 = pts[k][2] + u * (pts[k + 1][2] - pts[k][2]); break;
            }
          }
          const v = fmtVector({ units: F.units, f1: d1, f2: d2 }); amp.push(v.amp); phi.push(v.phi);
        }
        m.set('pertamp', amp); m.set('pertphi', phi);
      } else if (!needPcf && F.field === 'painted') {
        const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0), r = F.painted.res || 4;
        for (const [ci, cj, d1, d2] of F.painted.cells) {
          const v = fmtVector({ units: F.units, f1: d1, f2: d2 });
          for (let i = ci * r; i < Math.min(GRID, ci * r + r); i++) for (let j = cj * r; j < Math.min(GRID, cj * r + r); j++) {
            A2[i + GRID * j] = v.amp; P2[i + GRID * j] = v.phi;   // MATLAB column-major: row i = F1 index, column j = F2 index
          }
        }
        m.set('bshift2d', 1); m.set('pertamp2d', A2); m.set('pertphi2d', P2);
        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));
      } else {
        m.set('pertamp', new Array(GRID).fill(needPcf ? 0 : vec.amp)); m.set('pertphi', new Array(GRID).fill(needPcf ? 0 : vec.phi));
      }
      if (!needPcf && F.field === 'variability') {
        const V = variField(F.vari);
        m.set('bratioshift', 0); m.set('bmelshift', V.mel ? 1 : 0); m.set('bshift2d', 1);
        m.set('pertf1', V.g1); m.set('pertf2', V.g2); m.set('pertamp2d', V.A2); m.set('pertphi2d', V.P2);
        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));
        m.set('f1min', V.g1[0]); m.set('f1max', V.g1[GRID - 1]); m.set('f2min', V.g2[0]); m.set('f2max', V.g2[GRID - 1]);
      }
      if (needPcf && F.field !== 'all') notes.push({ where: 'formant', text: 'A PCF is in use (for the timing, loudness or "when" settings), so Audapter takes the formant shift from the PCF row and ignores the field shape: the shift is uniform.' });
    }

    // pitch
    if (pvoc || (T.on && !isDesign && !isCustom)) {
      m.set('bpitchshift', 1); m.set('btimedomainshift', 0);
      m.set('pitchshiftratio', pvoc && !needPcf ? Math.pow(2, Pi.semitones / 12) : 1);
    }
    if (tds) {
      m.set('btimedomainshift', 1); m.set('bpitchshift', 0); m.set('bcepslift', 1);
      const sex = PRESETS[s.preset].sex, dl = s.preset === 'child' ? [200, 450] : sex === 'male' ? [80, 160] : [150, 300];
      m.set('pitchlowerboundhz', Pi.lower ?? (num(m, 'pitchlowerboundhz') || dl[0]));
      m.set('pitchupperboundhz', Pi.upper ?? (num(m, 'pitchupperboundhz') || dl[1]));
      const r = Math.pow(2, Pi.semitones / 12), ramp = Math.max(0.001, Pi.ramp || 0.001);
      let sch = [0, r];
      if (W.mode === 'after') sch = [0, 1, W.after, 1, W.after + ramp, r];
      else if (W.mode === 'window') sch = [0, 1, W.after, 1, W.after + ramp, r, Math.max(W.until, W.after + ramp + 0.001), r, Math.max(W.until, W.after + ramp + 0.001) + ramp, 1];
      else if (W.mode === 'vowel' && W.onDelay > 0) sch = [0, 1, W.onDelay, 1, W.onDelay + ramp, r];
      m.set('timedomainpitchshiftschedule', sch);
      m.set('timedomainpitchshiftalgorithm', Pi.algorithm | 0);
    }

    // delay (DAF)
    if (D.on) m.set('delayframes', Math.round(D.ms / 1000 * sr / frameLen));

    // what the participant hears
    const H = s.hear;
    m.set('fb', H.fb | 0);
    if (H.fb >= 2 && H.fb <= 5) {
      const n = Math.min(480000, Math.max(48, Math.round((H.noise.seconds || 10) * 48000)));
      const key = `${n}|${H.noise.type}|${H.noise.level}`;
      if (!noiseCache.has(key)) { noiseCache.clear(); noiseCache.set(key, Array.from(G.DSP.noise(n, { type: H.noise.type, level: H.noise.level, seed: 7 }))); }
      m.set('datapb', noiseCache.get(key));
      const g = H.noise.gain ?? 1;
      if (H.fb === 2) m.set('fb2gain', g);
      if (H.fb === 3) m.set('fb3gain', g);
      if (H.fb === 4) m.set('fb4gaindb', num(m, 'fb4gaindb'));
      if (H.fb === 5) m.set('fb5gain_playback', g);
    }
    if (H.gainDb) m.set('scale', num(m, 'scale') * Math.pow(10, H.gainDb / 20));

    // when: OST + PCF
    let ost = null, pcf = null, perturbStates = [];
    if (W.mode === 'custom') { ost = W.ost || ''; pcf = W.pcf || ''; }
    else if (isDesign) {
      ost = serializeOst(cd.ost);
      pcf = serializePcf({ warps: [], rows: cd.whatOf.map(w => { if (!w) return { pitch: 0, db: 0, amp: 0, phi: 0 };
        const v = fmtVector({ units: F.units, f1: w.f1 || 0, f2: w.f2 || 0 }); return { pitch: w.st || 0, db: w.db || 0, amp: (w.f1 || w.f2) ? v.amp : 0, phi: (w.f1 || w.f2) ? v.phi : 0 }; }) });
      perturbStates = cd.whatOf.map((w, k) => (w ? k : -1)).filter(k => k >= 0);
      for (const e of cd.errors) notes.push({ where: 'design', level: 'error', text: e });
      for (const e of cd.notes) notes.push({ where: 'design', text: e });
    }
    else if (needPcf) {
      const R = [];
      if (W.mode === 'always') { perturbStates = [0]; }
      else if (W.mode === 'after') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null]); perturbStates = [1]; }
      else if (W.mode === 'window') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null], [1, 'ELAPSED_TIME', Math.max(0.002, W.until - W.after), NaN, null]); perturbStates = [1]; }
      else if (W.mode === 'vowel') {
        R.push([0, 'INTENSITY_RISE_HOLD', W.onThresh, W.onHold, null]);
        let st = 2;
        if (W.onDelay > 0) { R.push([2, 'ELAPSED_TIME', W.onDelay, NaN, null]); st = 3; }
        R.push([st, 'INTENSITY_FALL', W.offThresh, W.offHold, null]); perturbStates = [st];
      }
      const endState = R.length ? R[R.length - 1][0] + (OST_MODES[R[R.length - 1][1]].span) : 0;
      R.push([endState, 'OST_END', NaN, NaN, null]);
      ost = serializeOst({ rmsSlopeWin: 0.03, rules: R.map(([stat, mode, p1, p2, p3]) => ({ stat, mode, p1, p2, p3 })), maxIOI: [] });
      const rows = [];
      for (let k = 0; k <= endState; k++) {
        const on = perturbStates.includes(k);
        rows.push({ pitch: on && pvoc ? Pi.semitones : 0, db: on && L.on ? L.db : 0, amp: on && fOn ? vec.amp : 0, phi: on && fOn ? vec.phi : 0 });
      }
      const warps = [];
      if (T.on) {
        const w = { tBegin: 0, rate1: T.rate1, dur1: T.dur1, hold: T.hold, rate2: T.rate2, ostInitState: null };
        if (W.mode === 'after' || W.mode === 'window') w.tBegin = W.after;
        if (W.mode === 'vowel') { w.ostInitState = perturbStates[0]; w.tBegin = 0; }
        warps.push(w);
      }
      pcf = serializePcf({ warps, rows });
    }

    // raw overrides from the full parameter table come last and win
    for (const [k, v] of Object.entries(s.raw || {})) if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v);

    const list = [...m.entries()].map(([k, v]) => [k, v]);
    const g = k => num(m, k);
    const meta = { sr, frameLen: g('framelen'), nDelay: g('ndelay'), downFact: g('downfact'), nLPC: g('nlpc'), rmsThr: g('rmsthr'),
      latencyMs: 1000 * g('ndelay') * g('framelen') / g('srate'), windowMs: 1000 * (g('framelen') + 2 * (g('ndelay') - 1) * g('framelen')) / g('srate'),
      perturbStates, design: cd, needPcf, pvoc: g('bpitchshift') === 1, tds: g('btimedomainshift') === 1 };
    return { list, ost, pcf, notes, meta, map: m };
  }

  // ---------- warnings from the audit's findings, attached to where they apply
  function warnings(settings, c, ctx = {}) {
    const s = normalize(settings), out = [], m = c.map, g = k => num(m, k);
    const W = (where, id, level, text) => out.push({ where, id, level, text });
    const frameLen = g('framelen'), nDelay = g('ndelay'), sr = g('srate');
    for (const n of c.notes || []) W(n.where === 'design' ? 'design' : n.where, null, n.level || 'info', n.text);
    // hard errors Audapter itself raises
    if (2 * (nDelay - 1) * frameLen > 960) W('listen', null, 'error', `2 × (nDelay − 1) × frameLen = ${2 * (nDelay - 1) * frameLen} exceeds Audapter's maxFrameLen 960: Audapter refuses to run.`);
    if (g('btimedomainshift') === 1 && g('bpitchshift') === 1) W('pitch', null, 'error', 'bPitchShift and bTimeDomainShift are mutually exclusive: Audapter refuses to run.');
    if (g('btimedomainshift') === 1 && g('bcepslift') !== 1) W('pitch', null, 'error', 'bTimeDomainShift = 1 requires bCepsLift = 1: Audapter refuses to run.');
    // pitch tracking window (CORPUS-8)
    const minF0 = Math.round(3.2 / (c.meta.windowMs / 1000));
    if (g('btimedomainshift') === 1 && g('pitchlowerboundhz') > 0 && g('pitchlowerboundhz') < minF0)
      W('pitch', 'CORPUS-8', 'warn', `The pitch lower bound (${g('pitchlowerboundhz')} Hz) is below what a ${c.meta.windowMs.toFixed(0)} ms analysis window (frameLen ${frameLen}, nDelay ${nDelay}) can represent (about ${minF0} Hz). The logged pitchHz, and the TDS band-pass centred on it, will be wrong for lower voices. frameLen 64 / nDelay 7 tracks down to about 60 Hz.`);
    if (ctx.f0 && ctx.f0 < minF0 * 1.05) W('listen', 'CORPUS-8', 'warn', `This input's pitch (median ${Math.round(ctx.f0)} Hz) is below what the ${c.meta.windowMs.toFixed(0)} ms analysis window represents (about ${minF0} Hz): Audapter's pitchHz will not be F0. Try the "Low voice" preset (frameLen 64, nDelay 7).`);
    // phase vocoder
    if (g('bpitchshift') === 1) {
      W('pitch', 'PT-5', 'info', 'The phase vocoder plays about 3.5 dB louder even at 0 semitones, and the level at a pitch-shift onset jumps by 0.8–8.8 dB depending on F0 and vowel. bPvocAmpNorm cannot be switched on.');
      if (g('pvocframelen') < frameLen) W('pitch', 'PT-11', 'warn', `pvocFrameLen (${g('pvocframelen')}) is shorter than frameLen (${frameLen}).`);
      if (g('pvochop') < frameLen) W('pitch', '17g', 'error', `pvocHop (${g('pvochop')}) is below frameLen (${frameLen}): Audapter divides by pvocHop / frameLen = 0 and crashes (its own check is broken).`);
    }
    if (g('btimedomainshift') === 1) {
      W('pitch', 'PT-3', 'info', 'The time-domain schedule clock only runs while the level is above rmsThresh: a pause pushes the shift later, and unshifted audio is heard during dips.');
      W('pitch', 'PT-4', 'info', 'For time-domain shifting the logged pitchShiftRatio is not the applied ratio; compare shiftedPitchHz / pitchHz instead (itself unreliable below the window limit).');
    }
    if (s.shift.timing.on && s.shift.pitch.on && s.shift.pitch.method === 'pvoc') W('timing', '17e', 'warn', 'A PCF with both a pitch shift and a time warp silently drops the warp (duplicated condition in Audapter.cpp).');
    if (s.shift.timing.on) W('timing', 'PT-5', 'info', 'Time warping runs through the phase vocoder, which adds its +3.5 dB level offset.');
    // formant units (CORPUS-11)
    const br = g('bratioshift'), bm = g('bmelshift');
    if (g('bshift') === 1) {
      const amps = [].concat(m.get('pertamp') || [], s.when.mode !== 'always' ? [] : []);
      const maxAmp = amps.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
      if (br === 1 && bm === 1) W('formant', 'CORPUS-11', 'warn', 'Both bRatioShift and bMelShift are 1: the ratio is applied to mel values. Audapter\'s C++ defaults are ratio 0 / mel 1, the MATLAB defaults ratio 1 / mel 0.');
      if (br === 1 && maxAmp > 2) W('formant', 'CORPUS-11', 'warn', `Ratio mode with a perturbation amplitude of ${maxAmp.toFixed(2)} (i.e. ${(maxAmp * 100).toFixed(0)} %): Audapter does not bound the shifted targets, and mel-unit values read as ratios have produced targets of 130 kHz and +24 dB bursts.`);
      if (bm === 1 && br === 0 && maxAmp > 0 && maxAmp < 5) W('formant', 'CORPUS-11', 'info', `Mel mode: the amplitude ${maxAmp.toFixed(2)} is in mel, not a ratio. ${maxAmp.toFixed(2)} mel is a tiny shift.`);
      if (s.shift.formant.field === 'region' && !c.meta.needPcf) W('formant', 'F6', 'info', 'With a restricted field, blab\'s dropout fix re-arms the shift every time the formants re-enter the region, and minVowelLen has no effect (upstream shifted only the first entry).');
      if (s.shift.formant.field === 'variability' && !c.meta.needPcf) { const V = variField(s.shift.formant.vari), u = V.mel ? 'mel' : 'Hz';
        W('formant', 'FMT-F3', 'info', `Audapter reads the 2-D field at the lower-left grid cell without interpolating, so the applied shift is piecewise constant: the grid step here is ${V.step1.toFixed(1)} ${u} (F1) × ${V.step2.toFixed(1)} ${u} (F2), and each cell holds the shift at its centre (within half a step of the intended shift). Formants outside ±${s.shift.formant.vari.ext1} Hz (F1) / ±${s.shift.formant.vari.ext2} Hz (F2) around the centre are not shifted.`); }
      if (s.shift.formant.field === 'painted' && !c.meta.needPcf) W('formant', '2D', 'info', 'The 2-D field is looked up at the lower-left grid cell (about 20 Hz steps), not interpolated, and its last row and column are never used.');
    }
    if (g('bclampformants') === 1) W('formant', 'FMT-F1', 'warn', 'Clamping reads 2048 values from clampF1/clampF2 whatever length was passed, and the clamp branch skips the voicing check.');
    // masking noise (I-01, I-02)
    const fb = g('fb');
    if (fb >= 2 && fb <= 5) {
      const pb = (m.get('datapb') || []).length, sec = pb / 48000;
      if (pb && pb < 480000) W('hear', 'I-01', s.build === 'patched' ? 'info' : 'warn', s.build === 'patched'
        ? `Noise is ${sec.toFixed(1)} s long. The patched build loops it at its own length.`
        : `Noise shorter than 10 s (${sec.toFixed(1)} s) is followed by silence until 10 s: the shipped build loops playback at 480 000 samples, not at the noise length. The gap position also carries over between trials. Use 10 s of noise, or the patched build.`);
      if (fb === 3 && (s.hear.noise.gain ?? 1) === 0) W('hear', null, 'info', 'fb3Gain is 0 (Audapter\'s default), so the noise is silent in mode 3.');
      if (fb === 5) W('hear', 'I-02', 'warn', 'Feedback mode 5 applies dScale twice to the speech-modulated part and once to the playback, so the balance depends on each rig\'s calibration.');
    }
    // delay
    if (s.shift.delay.on) {
      const df = Math.round(s.shift.delay.ms / 1000 * sr / frameLen);
      if (df > 600) W('delay', null, 'warn', `${s.shift.delay.ms} ms is ${df} frames; Audapter silently clamps delayFrames to 600 (${(600 * frameLen / sr * 1000).toFixed(0)} ms).`);
    }
    // OST / PCF
    if (c.ost) {
      const o = parseOst(c.ost), p = parsePcf(c.pcf || ''), nS = ostStateCount(o);
      for (const e of o.errors) W('ost', null, 'error', 'OST: ' + e);
      for (const e of p.errors) W('pcf', null, 'error', 'PCF: ' + e);
      if (c.pcf && p.rows.length < nS) W('pcf', 'OST-F4', 'warn', `The PCF has ${p.rows.length} rows but the OST reaches ${nS} states. Audapter reads past the end of the PCF table for the missing states, so heap garbage decides whether and how much to perturb.`);
      o.rules.forEach((r, i) => {
        if (r.mode === 'INTENSITY_FALL' && !o.rules.slice(0, i).some(q => OST_MODES[q.mode] && OST_MODES[q.mode].sets))
          W('ost', 'OST-F1', ctx.sequence ? 'warn' : 'info', `Rule ${i + 1} (INTENSITY_FALL) comes after rules that never set "last state end", so its minimum time counts from ${ctx.sequence ? 'the previous trial: in one Audapter session the offset is detected late, e.g. 1.68 s instead of 0.40 s (fixed in the patched build)' : 'trial start. In a same-session sequence it would count from the previous trial (OST-F1)'}.`);
        if ((r.mode === 'INTENSITY_AND_RATIO_ABOVE_THRESH' || r.mode === 'INTENSITY_AND_RATIO_BELOW_THRESH') && (r.p3 === null || !(r.p3 > 0)))
          W('ost', 'OST-F8', 'warn', `Rule ${i + 1}: blab reads this rule's hold time from the 5th field; with {} the hold is 0 and the rule fires immediately.`);
        if (/SLOPE/.test(r.mode)) W('ost', 'I-05', 'info', `Rule ${i + 1} uses the level slope, which is NaN for the first 14 frames of every trial.`);
      });
      if (o.maxIOI.length) W('ost', 'OST-F2', 'warn', `The maxIOI timeout writes the wrong onset index: a following ELAPSED_TIME fires after 2 ms${ctx.sequence ? ', and without reloading the OST the timeout drifts 0.2 → 0.4 → 0.6 s over trials' : ''} (fixed in the patched build).`);
    }
    if (ctx.sequence) {
      W('run', 'COORD-1', 'info', 'In one session, an OST/PCF loaded by an earlier trial stays active for later trials that do not load one (AudapterIO(\'init\') does not clear them), and silently overrides their field-mode formant shift.');
      if (ctx.frameChange) W('run', 'CORPUS-10', 'warn', 'frameLen or nDelay changes between trials of this sequence. Audapter does not rebuild its formant tracker then; on some voices this hangs the core in an endless loop. The page stops a hung run after a timeout.');
    }
    // recorder length (I-03)
    if (ctx.dur && ctx.recorderSec && ctx.dur > ctx.recorderSec - 0.05) W('run', 'I-03', 'warn', `The input (${ctx.dur.toFixed(1)} s) is longer than this build's recorder (${ctx.recorderSec.toFixed(0)} s): the recorder silently wraps and returns only the end. Choose the full-size build for trials up to 30 s.`);
    return out;
  }

  // ---------- human-readable summary and diff
  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(+Number(v).toPrecision(4));
  function summarize(settings) {
    const s = normalize(settings), S = s.shift, parts = [];
    const u = S.formant.units === 'pct' ? ' %' : S.formant.units === 'hz' ? ' Hz' : ' mel';
    if (s.when.mode === 'design') {
      const B = s.design.blocks, w = b => [b.what.f1 ? `F1 ${sgn(b.what.f1)}${u}` : '', b.what.f2 ? `F2 ${sgn(b.what.f2)}${u}` : '', b.what.st ? `pitch ${sgn(b.what.st)} st` : '', b.what.db ? `level ${sgn(b.what.db)} dB` : ''].filter(Boolean).join(', ') || 'nothing';
      const tl = TEMPLATES[s.design.template];
      const txt = B.length === 1 ? `${w(B[0])} from ${refText(B[0].start)} to ${refText(B[0].end, true)}` : `${B.length} blocks: ` + B.map(w).join('; ');
      const extra = [];
      if (S.delay.on) extra.push(`delay ${S.delay.ms} ms`);
      if (s.hear.fb !== 1) extra.push(`fb ${s.hear.fb}`);
      if (s.design.jitterApplied !== undefined) extra.push(`jitter +${s.design.jitterApplied} ms`);
      return txt + (extra.length ? ', ' + extra.join(', ') : '');
    }
    if (S.formant.on) {
      if (S.formant.field === 'variability') parts.push(`vowel variability ${S.formant.vari.dir === 'in' ? 'inward' : 'outward'} ${S.formant.vari.strength} % (centre ${Math.round(S.formant.vari.c1)}/${Math.round(S.formant.vari.c2)} Hz)`);
      else if (S.formant.field === 'painted') parts.push(`painted field (${S.formant.painted.cells.length} cells)`);
      else if (S.formant.field === 'curve') parts.push('F2-dependent field');
      else if (S.formant.f1 || S.formant.f2) parts.push([S.formant.f1 ? `F1 ${sgn(S.formant.f1)}${u}` : '', S.formant.f2 ? `F2 ${sgn(S.formant.f2)}${u}` : ''].filter(Boolean).join(', ') + (S.formant.field === 'region' ? ' in region' : ''));
    }
    if (S.pitch.on) parts.push(`pitch ${sgn(S.pitch.semitones)} st (${S.pitch.method === 'pvoc' ? 'phase vocoder' : 'time domain'})`);
    if (S.loudness.on && S.loudness.db) parts.push(`level ${sgn(S.loudness.db)} dB`);
    if (S.timing.on) parts.push(`time warp ×${S.timing.rate1}`);
    if (S.delay.on) parts.push(`delay ${S.delay.ms} ms`);
    if (s.hear.fb !== 1) parts.push(['muted', '', 'noise only', 'speech + noise', 'speech-modulated noise', 'fb 5'][s.hear.fb] || `fb ${s.hear.fb}`);
    if (s.hear.gainDb) parts.push(`gain ${sgn(s.hear.gainDb)} dB`);
    if (!parts.length) parts.push('no perturbation');
    const w = s.when;
    const when = w.mode === 'always' ? '' : w.mode === 'after' ? ` after ${w.after} s` : w.mode === 'window' ? ` ${w.after}–${w.until} s` : w.mode === 'vowel' ? ' during the vowel' : ' by custom OST/PCF';
    return parts.join(', ') + when;
  }
  function flatten(o, pre = '', out = {}) {
    for (const [k, v] of Object.entries(o || {})) {
      const p = pre ? pre + '.' + k : k;
      if (k === 'cells' && Array.isArray(v)) out[p] = `${v.length} cells`;
      else if (k === 'curve' && Array.isArray(v)) out[p] = v.map(x => x.join('/')).join('; ');
      else if ((k === 'ost' || k === 'pcf') && typeof v === 'string') out[p] = v.trim() ? v.trim().split('\n').length + ' lines' : '';
      else if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
      else out[p] = Array.isArray(v) ? (v.length > 6 ? `[${v.length} values]` : JSON.stringify(v)) : v;
    }
    return out;
  }
  // Rows where the settings differ (only paths that matter: disabled cards are collapsed to "off").
  function diff(a, b) {
    const pa = flatten(effective(a)), pb = flatten(effective(b)), keys = [...new Set([...Object.keys(pa), ...Object.keys(pb)])];
    return keys.filter(k => JSON.stringify(pa[k]) !== JSON.stringify(pb[k])).map(k => ({ path: k, a: pa[k], b: pb[k] }));
  }
  function effective(settings) {
    const s = normalize(settings), o = { preset: s.preset, build: s.build, shift: {}, when: {}, listen: s.listen, hear: { fb: s.hear.fb, gainDb: s.hear.gainDb }, raw: s.raw };
    for (const [k, v] of Object.entries(s.shift)) o.shift[k] = v.on ? v : { on: false };
    if (o.shift.formant.on && o.shift.formant.field !== 'region') delete o.shift.formant.region;
    if (o.shift.formant.on && o.shift.formant.field !== 'curve') delete o.shift.formant.curve;
    if (o.shift.formant.on && o.shift.formant.field !== 'painted') delete o.shift.formant.painted;
    if (o.shift.formant.on && o.shift.formant.field !== 'variability') delete o.shift.formant.vari;
    if (o.shift.formant.on && o.shift.formant.field === 'variability') { delete o.shift.formant.f1; delete o.shift.formant.f2; delete o.shift.formant.units; }
    const w = s.when; o.when.mode = w.mode;
    if (w.mode === 'after') o.when.after = w.after;
    if (w.mode === 'window') { o.when.after = w.after; o.when.until = w.until; }
    if (w.mode === 'vowel') Object.assign(o.when, { onThresh: w.onThresh, onHold: w.onHold, offThresh: w.offThresh, offHold: w.offHold, onDelay: w.onDelay });
    if (w.mode === 'custom') Object.assign(o.when, { ost: w.ost, pcf: w.pcf });
    if (w.mode === 'design') { o.when.design = { blocks: s.design.blocks, detect: s.design.detect }; for (const k of ['formant', 'pitch', 'loudness', 'timing']) o.shift[k] = { on: false }; if (s.shift.formant.units !== 'pct') o.shift.formant = { units: s.shift.formant.units }; }
    if (s.hear.fb >= 2) o.hear.noise = s.hear.noise;
    return o;
  }

  G.PGS = { PRESETS, OST_MODES, defaultSettings, normalize, clone, getPath, setPath, baseParams, compile, warnings, summarize, diff, flatten, effective,
    parseOst, serializeOst, ostStateCount, pcfShifts, variField, apply2D, variIntended, TEMPLATES, defaultDesign, compileDesign, refText, parsePcf, serializePcf, hz2mel, fmtVector, GRID, FMAX };
})(typeof self !== 'undefined' ? self : globalThis);
