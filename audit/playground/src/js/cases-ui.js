'use strict';
// Report test cases in the main workspace. A case holds the exact command stream the card's export script sent to
// Audapter (captured with a recording shim), its inputs, an "expected" and an "observed" variant with the same trials
// (plus, for some cards, extra variants), and the card's key numbers. Opening a case replays every variant; each trial
// becomes one row in the trial list with an Expected/Observed toggle, the key trial opens side by side ("Expected vs
// observed" view), and any edit while a case is loaded forks an editable copy that re-runs the whole sequence.
PG.Cases = (() => {
  const { h, S } = PG, TT = PG.Tiers;
  const loaded = {}, waiting = {}, resCache = {}, resWait = {};
  let banner, cur = null, results = {}, running = false, runId = 0, showAll = false;
  const forks = [], shown = {};   // shown[groupKey] = variant name the group's rows show
  PG.caseLoaded = c => { loaded[c.id] = c; if (waiting[c.id]) waiting[c.id](c); };
  PG.caseRes = (sha, r) => { resCache[sha] = r; if (resWait[sha]) resWait[sha](r); };
  const script = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => { s.remove(); res(); }; s.onerror = () => rej(new Error('could not load ' + src)); document.head.append(s); });
  async function loadCase(id) {
    if (loaded[id]) return loaded[id];
    const p = new Promise(r => { waiting[id] = r; });
    await script(`cases/${id}.js`); return p;
  }
  const decoded = {};
  async function resource(sha) {
    if (decoded[sha]) return decoded[sha];
    if (!resCache[sha]) { const p = new Promise(r => { resWait[sha] = r; }); await script(`cases/res/${sha}.js`); await p; }
    const r = resCache[sha]; let x;
    if (r.kind === 'zeros') x = new Float64Array(r.n);
    else {
      const bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      if (r.kind === 'f32') x = Float64Array.from(new Float32Array(u8.buffer));
      else {
        let y = r.kind === 'wav24' ? PG.DSP.decodeWav(u8).x : null;
        if (!y) { const oc = new OfflineAudioContext(1, Math.max(1, r.n), 48000); const ab = await oc.decodeAudioData(u8.buffer); y = ab.getChannelData(0); }
        x = new Float64Array(r.n); for (let i = 0; i < r.n; i++) x[i] = (y[i] || 0) * r.scale;
      }
    }
    return (decoded[sha] = x);
  }

  // ---------- metrics: what the card measures, computed on the replay the same way the export did
  const frameDt = r => 1 / r.frameRate;
  const shifted = (r, i) => r.sfmts[0][i] > 0 && Math.abs(r.sfmts[0][i] - r.fmts[0][i]) > 1;   // exp_trial.m
  const hz2mel = f => 1127.01048 * Math.log(1 + f / 700), mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);
  const medianAll = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); if (!v.length) return NaN; const k = v.length >> 1; return v.length % 2 ? v[k] : (v[k - 1] + v[k]) / 2; };
  function states(r, variant) { const off = (variant && variant.stateOffset) || 0; return Array.from(r.ost_stat, s => (s >= 1 ? s + off : s)); }
  function blocksDb(x, B = 960) { const out = []; for (let i = 0; i + B <= x.length; i += B) { let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k]; out.push(10 * Math.log10(e / B + 1e-30)); } return out; }
  const rmsOf = (s, a) => { let e = 0; for (let i = a; i < s.length; i++) e += s[i] * s[i]; return Math.sqrt(e / Math.max(1, s.length - a)); };
  function metric(name, r, variant) {
    const dt = frameDt(r), n = r.fmts[0].length;
    if (name === 'shift_s') { let c = 0; for (let i = 0; i < n; i++) if (shifted(r, i)) c++; return c * dt; }
    if (name === 'on') { for (let i = 0; i < n; i++) if (shifted(r, i)) return i * dt; return NaN; }
    if (name === 'sfon') { for (let i = 0; i < n; i++) if (r.sfmts[0][i] > 0) return i * dt; return NaN; }   // report_ost_f2.m shon
    if (name === 'off') { for (let i = n - 1; i >= 0; i--) if (shifted(r, i)) return (i + 1) * dt; return NaN; }
    if (name === 'st1') { const s = states(r, variant), i = s.findIndex(v => v >= 1); return i < 0 ? NaN : i * dt; }
    if (name === 'n_sfmts') { let c = 0; for (let i = 0; i < n; i++) if (r.sfmts[0][i] > 0) c++; return c; }
    if (name === 'nseg') return TT.runs(r.sfmts[0], dt, v => v > 0).length;
    if (name.startsWith('seg:')) { const [, k, e] = name.split(':'), R = TT.runs(r.sfmts[0], dt, v => v > 0); const g = R[+k]; return g ? (e === 'a' ? g.a : g.b) : NaN; }
    if (name === 'ratio_f1') { const q = []; for (let i = 0; i < n; i++) if (r.sfmts[0][i] > 0) q.push(r.sfmts[0][i] / r.fmts[0][i]); return medianAll(q); }
    if (name === 'pitchhz_med') return medianAll(Array.from(r.pitchHz).filter(v => v > 0));
    if (name === 'rms_out') { let e = 0; for (const v of r.signalOut) e += v * v; return Math.sqrt(e / r.signalOut.length); }
    if (name.startsWith('gainrms:')) {   // report_pt5.m (cereb): RMS of signalOut re signalIn from a (s) to the end, in dB
      const a = Math.round(+name.split(':')[1] * r.params.srate) - 1;
      return 20 * Math.log10(rmsOf(r.signalOut, a) / rmsOf(r.signalIn, a));
    }
    if (name.startsWith('gainwin:')) {   // report_pt5.m: 20 ms blocks of signalOut re signalIn (dB, rounded to 0.01), mean over the window
      const [, a, b] = name.split(':').map(Number), W = Math.round(0.02 * r.params.srate), nb = Math.floor(r.signalIn.length / W);
      const blk = s => { const o = []; for (let k = 0; k < nb; k++) { let e = 0; for (let i = k * W; i < (k + 1) * W; i++) e += s[i] * s[i]; o.push(Math.sqrt(e / W)); } return o; };
      const bi = blk(r.signalIn), bo = blk(r.signalOut), lv = bo.map((v, k) => Math.round(20 * Math.log10(v / Math.max(bi[k], 1e-9)) * 100) / 100);
      const m = []; for (let k = Math.round(a / 0.02); k <= Math.round(b / 0.02); k++) m.push(lv[k - 1]);
      return m.reduce((s2, v) => s2 + v, 0) / m.length;
    }
    if (name === 't3' || name === 'st2') { const s = states(r, variant), th = name === 't3' ? 3 : 2; const i = s.findIndex(v => v >= th); return i < 0 ? NaN : i * dt; }
    if (name === 'ratio_logged') return r.params ? r.params.pitchshiftratio : NaN;
    if (name === 'cents') { const fi = PG.median(r.analysis.f0In.f0), fo = PG.median(r.analysis.f0Out.f0); return 1200 * Math.log2(fo / fi); }
    if (/^(heard|prod)_f[12]/.test(name)) {   // heard_f1 (window 0.3-0.7 of the tracked frames) or heard_f1:0.2:0.8
      const [nm, wa, wb] = name.split(':'), j = nm.endsWith('1') ? 0 : 1, src = nm.startsWith('heard') ? r.sfmts : r.fmts;
      const ix = []; for (let i = 0; i < n; i++) if (r.fmts[0][i] > 0 && r.sfmts[0][i] > 0) ix.push(i);
      const a = Math.round(ix.length * (+wa || 0.3)), b = Math.round(ix.length * (+wb || 0.7)), sel = ix.slice(Math.max(0, a - 1), b);   // Octave ix(round(end*a):round(end*b))
      return mel2hz(medianAll(sel.map(i => hz2mel(src[j][i]))));
    }
    if (name.startsWith('gap')) {
      const on = blocksDb(r.output).map(d => d > -80), gaps = []; let a = null;
      for (let k = 0; k <= on.length; k++) { const o = k < on.length ? on[k] : true; if (!o && a === null) a = k; if (o && a !== null) { if (k - a > 1 && a > 0) gaps.push([a * 0.02, k * 0.02]); a = null; } }
      if (name === 'gap_count') return gaps.length;
      if (!gaps.length) return NaN;
      return name === 'gap_start' ? gaps[0][0] : gaps[0][1];
    }
    return NaN;
  }

  // ---------- settings a case trial ran with, as far as the Playground's settings can express them
  const LISTEN = new Set(['nlpc', 'framelen', 'ndelay', 'rmsthr', 'rmsratio', 'fn1', 'fn2', 'avglen', 'bcepslift', 'cepswinwidth', 'btrack']);
  const decodeDef = v => (v && typeof v === 'object' && !Array.isArray(v) && 'fill' in v ? new Array(v.n).fill(v.fill) : v);
  const same = (a, b) => JSON.stringify(Array.isArray(a) ? Array.from(a) : a) === JSON.stringify(Array.isArray(b) ? Array.from(b) : b);
  function paramsAt(v, k) {   // final setParam values and OST/PCF after the setup and trials 0..k of a variant
    const P = new Map(); let ost = null, pcf = null;
    for (const o of [...v.setup, ...v.trials.slice(0, k + 1).flatMap(t => t.ops)]) {
      if (o.op === 'setParam') P.set(o.name.toLowerCase(), o);
      if (o.op === 'ost') ost = o.text || ''; if (o.op === 'pcf') pcf = o.text || '';
    }
    return { P, ost, pcf };
  }
  function caseSettings(v, k) {
    const { P, ost, pcf } = paramsAt(v, k), val = n => { const o = P.get(n); const vv = o && (o.value || (o.res && decoded[o.res] && Array.from(decoded[o.res]))); return vv ? (vv.length === 1 ? vv[0] : vv) : undefined; };
    const sex = val('nlpc') === 17 ? 'male' : 'female';
    const D = new Map(AUD_DEFAULTS[sex].map(([n, x]) => [n.toLowerCase(), decodeDef(x)]));
    const s = S.defaultSettings(); s.preset = sex; s.build = v.build; s.listen = {}; s.raw = {};
    const big = [], want = new Map();
    for (const [n, o] of P) {
      const vv = o.res ? (decoded[o.res] && decoded[o.res].length <= 2048 ? Array.from(decoded[o.res]) : null) : o.value;
      if (!vv) { big.push(n); continue; }
      const x = vv.length === 1 ? vv[0] : vv;
      want.set(n, x);
      if (same(x, D.get(n))) continue;
      if (LISTEN.has(n) && vv.length === 1) s.listen[n] = x; else s.raw[n] = x;
    }
    const F = s.shift.formant;
    F.on = val('bshift') === 1; F.field = 'all';
    F.units = val('bratioshift') === 0 ? (val('bmelshift') === 1 ? 'mel' : 'hz') : 'pct';
    const amp = val('pertamp'), phi = val('pertphi');
    const cst = a => (Array.isArray(a) ? (a.every(x => x === a[0]) ? a[0] : null) : a);
    const A0 = cst(amp), P0 = cst(phi);
    if (A0 !== null && P0 !== null && A0 !== undefined) { const sc = F.units === 'pct' ? 100 : 1; F.f1 = +(A0 * Math.cos(P0 || 0) * sc).toFixed(6); F.f2 = +(A0 * Math.sin(P0 || 0) * sc).toFixed(6); }
    else if (F.on) F.f1 = F.f2 = 0;
    const Pi = s.shift.pitch;
    Pi.on = val('bpitchshift') === 1 || val('btimedomainshift') === 1;
    Pi.method = val('btimedomainshift') === 1 ? 'tds' : 'pvoc';
    const psr = cst(val('pitchshiftratio')); if (psr) Pi.semitones = +(12 * Math.log2(psr)).toFixed(6);
    s.hear.fb = val('fb') ?? 1;
    s.when = ost || pcf ? { ...s.when, mode: 'custom', ost: ost || '', pcf: pcf || '' } : { ...s.when, mode: 'always' };
    // keep a raw override only where the structured settings do not already compile to the case's value, so that the
    // controls (not a hidden raw value) decide what an edit changes
    for (const n of Object.keys(s.raw)) {
      const x = s.raw[n]; delete s.raw[n];
      if (!same(S.compile(s).map.get(n), want.get(n))) s.raw[n] = x;
    }
    return { settings: S.normalize(s), big, noise: s.hear.fb >= 2 };
  }

  // ---------- open a case into the main workspace
  function mount(bannerEl, pickerEl) {
    banner = bannerEl;
    if (pickerEl) {
      const sel = h('select', { id: 'case-picker', 'aria-label': 'Open a test case from the report', on: { change: e => { if (e.target.value) location.hash = 'case=' + e.target.value; e.target.value = ''; } } },
        h('option', { value: '', text: 'Test cases from the report…' }),
        (PG.CASES || []).filter(c => c.available).map(c => h('option', { value: c.id, text: `${c.id}: ${c.title}` })),
        h('optgroup', { label: 'Not replayable' }, (PG.CASES || []).filter(c => !c.available).map(c => h('option', { value: '', disabled: true, text: `${c.id}: ${c.why}` }))));
      pickerEl.append(sel);
    }
    window.addEventListener('hashchange', fromHash);
    PG.bus.on('current', onCurrent);
    PG.bus.on('settings', onSettings);
    render();
  }
  function fromHash() {
    const m = /[#&]case=([A-Za-z0-9-]+)/.exec(location.hash), v = /[#&]voice=([a-z]+)/.exec(location.hash);
    if (m && !(cur && cur.id === m[1] && (!v || cur.set === v[1]) && (running || Object.keys(results).length))) open(m[1], v && v[1]);
  }
  // A case has one or two example sets (real voice, the card's primary example, and synthetic); the page works on one.
  async function open(id, setId) {
    const idx = (PG.CASES || []).find(c => c.id === id);
    if (!idx || !idx.available) { PG.toast(`Test case ${id} is not available${idx && idx.why ? ': ' + idx.why : '.'}`, 'error'); return; }
    try {
      const c = await loadCase(id), set = c.sets.find(x => x.id === setId) || c.sets[0];
      cur = { ...c, ...set, id: c.id, set: set.id, setLabel: set.label }; results = {};
      // a case replaces the previous case's trials in the list (its forks go with it)
      dropTrials(t => t.caseRef);
      forks.length = 0;
      PG.bus.emit('tab', 'explore');
      if (PG.state.autoRun) { PG.state.autoRun = false; const cb = document.getElementById('auto-run'); if (cb) cb.checked = false; }
      render(); await run();
    } catch (e) { PG.toast(e.message, 'error'); }
  }
  function dropTrials(pred) {
    for (const t of PG.state.trials.filter(pred)) { PG.state.selected.delete(t.id); PG.Store.deleteTrial(t.id); }
    const keep = PG.state.trials.filter(t => !pred(t)); PG.state.trials.length = 0; PG.state.trials.push(...keep);
    if (!PG.trial(PG.state.currentId)) PG.state.currentId = keep.length ? keep[keep.length - 1].id : null;
  }
  const cardUrl = id => `../#${id}`;
  const vName = n => ({ expected: 'Expected', observed: 'Observed' })[n] || n[0].toUpperCase() + n.slice(1);
  const trialOf = (variant, k) => { const T = results[variant]; return T && T[k] ? T[k] : null; };
  const keyIndex = () => (cur.focus || {}).observed ?? 0;
  // The key trial (the one that shows the bug): both variants ticked, observed current, side by side.
  function focus() {
    const k = keyIndex(), o = trialOf('observed', k), e = trialOf('expected', (cur.focus || {}).expected ?? k);
    PG.state.selected.clear();
    for (const t of [e, o]) if (t) PG.state.selected.add(t.id);
    if (o) PG.state.currentId = o.id;
    PG.bus.emit('trials'); PG.bus.emit('current'); PG.bus.emit('view', e && o ? 'pair' : 'spectro');
    const row = document.querySelector('#trials li.case-row.current'), col = row && row.closest('.trials-col');
    if (col) col.scrollTop = Math.max(0, row.offsetTop - 160);   // the list column scrolls on its own on wide screens
  }
  function onCurrent() {
    const t = PG.current();
    if (!cur || !t || !t.caseRef || t.caseRef.id !== cur.id) { render(); return; }
    PG.setSettings(S.clone(t.settings), 'case');   // the settings panel shows this trial's settings
    const inp = PG.state.inputs.get(t.inputId); if (inp && PG.state.input !== inp) { PG.state.input = inp; PG.bus.emit('input', inp); }
    render();
  }
  // True when the case handles a settings edit (the page then does not auto-run a separate trial).
  const owns = () => { const t = PG.current(); return !!(cur && t && t.caseRef && t.caseRef.id === cur.id && Object.keys(results).length); };

  // ---------- forks: any edit while a case is loaded makes an editable copy that re-runs the whole sequence
  function variantOf(t) {
    if (t.caseRef.group === 'case') return cur.variants.find(v => v.name === t.caseRef.variant);
    const f = forks.find(x => x.key === t.caseRef.group); return f ? f.variant : null;
  }
  function ensureFork(from) {
    const t = from || PG.current();
    if (t && t.caseRef && t.caseRef.group !== 'case') { const f = forks.find(x => x.key === t.caseRef.group); if (f) return f; }
    const vn = t && t.caseRef && t.caseRef.group === 'case' && cur.variants.some(v => v.name === t.caseRef.variant) ? t.caseRef.variant : 'observed';
    const base = cur.variants.find(v => v.name === vn) || cur.variants[cur.variants.length - 1];
    const n = forks.length + 1;
    const f = { key: 'fork-' + PG.uid(), name: `${cur.id} · my edit${n > 1 ? ' ' + n : ''}`, base: base.name, orig: base, variant: S.clone(base),
      params: new Map(), ost: undefined, pcf: undefined, build: undefined, structural: [], switch: 'captured', results: [], ran: false };
    forks.push(f); shown[f.key] = 'edit';
    return f;
  }
  function onSettings(why) {
    if (['case', 'noauto', 'centre', 'load'].includes(why) || !owns() || running) return;
    const t = PG.current(), f = ensureFork(t), k = t.caseRef.trial;
    const base = caseSettings(f.orig, Math.min(k, f.orig.trials.length - 1)).settings;
    const A = S.compile(base), B = S.compile(PG.state.settings);
    f.params = new Map();
    for (const [n, x] of B.map) if (!same(A.map.get(n), x)) f.params.set(n, { from: A.map.get(n), to: x });
    f.ost = B.ost !== A.ost ? (B.ost || '') : undefined; f.pcf = B.pcf !== A.pcf ? (B.pcf || '') : undefined;
    f.build = PG.state.settings.build !== f.orig.build ? PG.state.settings.build : undefined;
    PG.bus.emit('trials'); render();
    forkRun(f);
  }
  const forkRun = PG.debounce(f => runFork(f), 700);
  // The fork's ops: the base variant's (as edited in the trial table) with the settings edits applied after every
  // trial's own commands, so they win over per-trial parameters; OST/PCF edits replace the texts the case loads.
  function forkVariant(f) {
    const v = S.clone(f.variant);
    v.build = f.build || v.build;
    const over = [...f.params].map(([n, d]) => ({ op: 'setParam', name: n, value: Array.isArray(d.to) ? d.to : [d.to] }));
    const swap = (ops, kind, text) => { let hit = false; for (const o of ops) if (o.op === kind) { o.text = text; hit = true; } return hit; };
    for (const [kind, text] of [['ost', f.ost], ['pcf', f.pcf]]) {
      if (text === undefined) continue;
      const hit = [v.setup, ...v.trials.map(t => t.ops)].map(ops => swap(ops, kind, text)).some(Boolean);
      if (!hit) v.setup.push({ op: kind, text });
    }
    v.setup.push(...S.clone(over));
    v.trials.forEach(t => { t.ops.push(...S.clone(over)); });
    return v;
  }
  function forkDiff(f) {
    const fmt = x => (Array.isArray(x) || ArrayBuffer.isView(x) ? `[${x.length} values]` : String(+(+x).toPrecision(6)));
    const d = [...f.params].map(([n, x]) => `${n} ${x.from === undefined ? '(default)' : fmt(x.from)} → ${fmt(x.to)}`);
    if (f.ost !== undefined) d.push('OST text edited'); if (f.pcf !== undefined) d.push('PCF text edited');
    if (f.build) d.push(`build ${f.orig.build} → ${f.build}`);
    return [...d, ...f.structural];
  }
  async function runFork(f) {
    if (running) { forkRun(f); return; }
    running = true; render();
    const me = ++runId;
    try {
      const v = forkVariant(f);
      const old = new Set(f.results.filter(Boolean).map(t => t.id)), wasCur = old.has(PG.state.currentId) ? f.results.findIndex(t => t && t.id === PG.state.currentId) : -1;
      const got = await runVariant(v, f.name);
      if (me !== runId) return;
      dropTrials(t => old.has(t.id));
      f.results = got.map((r, i) => r && addCaseTrial(v, i, r, f, got.inputs[i]));
      f.ran = true;
      const k = wasCur >= 0 ? wasCur : keyIndex(), t = f.results[Math.min(k, f.results.length - 1)];
      if (t) { PG.state.currentId = t.id; PG.state.selected.clear(); PG.state.selected.add(t.id); const e = pairFor(t); if (e) PG.state.selected.add(e.e.id); }
      PG.bus.emit('run-state', { running: false, text: `${f.name}: the whole sequence re-ran as ${v.mode === 'session' ? 'one Audapter session' : 'fresh trials'} (${f.results.length} trials).` });
    } catch (e) { PG.bus.emit('run-state', { running: false, text: '' }); PG.toast(`${f.name}: ${e.message}`, 'error'); }
    finally { running = false; PG.bus.emit('trials'); PG.bus.emit('current'); render(); }
  }
  function discardFork(f) {
    dropTrials(t => t.caseRef && t.caseRef.group === f.key);
    forks.splice(forks.indexOf(f), 1); PG.bus.emit('trials'); PG.bus.emit('current'); render();
  }

  // ---------- running a variant (original or fork): inputs and long arrays decoded, one engine run
  async function runVariant(v, what) {
    const c = cur, trials = [];
    for (const t of v.trials) {
      const x = typeof t.input === 'number' ? await resource(c.inputs[t.input].res) : (await PG.InputUI.loadClipInput(String(t.input).slice(5))).x;
      const ops = [];
      for (const o of t.ops) ops.push(o.res ? { op: o.op, name: o.name, value: await resource(o.res) } : o);
      trials.push({ input: x, ops, clip: typeof t.input === 'number' ? null : String(t.input).slice(5) });
    }
    const setup = [];
    for (const o of v.setup) setup.push(o.res ? { op: o.op, name: o.name, value: await resource(o.res) } : o);
    PG.bus.emit('run-state', { running: true, frac: 0, text: `${what}: running "${v.label}"…` });
    const got = [];
    const { errors } = await PG.Engine.run({ variant: v.build, sequence: v.mode === 'session', setup, trials: trials.map(t => ({ input: t.input, ops: t.ops })),
      onProgress: (i, f) => PG.bus.emit('run-state', { running: true, frac: (i + f) / trials.length }),
      onResult: (i, r) => { got[i] = r; } });
    if (errors.length) PG.toast(`${what}: ${errors.length} of ${trials.length} trials failed (${v.build} build): ${errors[0].message}`, 'error');
    got.inputs = trials;
    return got;
  }
  async function run() {
    if (running) return;
    running = true; results = {}; render();
    const me = ++runId, c = cur;
    try {
      for (const v of c.variants) {
        const got = await runVariant(v, c.id);
        if (me !== runId) return;
        results[v.name] = got.map((r, i) => r && addCaseTrial(v, i, r, null, got.inputs[i]));
      }
      const C = comparisons();
      PG.bus.emit('run-state', { running: false, text: `${c.id}: replayed; ${C.filter(x => x.ok).length} of ${C.length} numbers match the card.` });
    } catch (e) { PG.bus.emit('run-state', { running: false, text: '' }); PG.toast(`${c.id}: ${e.message}`, 'error'); }
    finally {
      running = false; if (me === runId && Object.keys(results).length) focus(); render();
      // on a narrow screen the first view is the key trial itself, below the banner
      if (me === runId && self.innerWidth < 860) setTimeout(() => { const el = document.querySelector('.pair-head'); if (el) el.scrollIntoView({ block: 'start' }); }, 100);
    }
  }
  function addCaseTrial(v, i, r, fork, tin) {
    const c = cur, vt = v.trials[i], clip = typeof vt.input === 'number' ? null : String(vt.input).slice(5);
    const inp = { id: PG.uid(), kind: 'case', label: clip ? `bundled clip ${clip}` : `${c.id} ${c.inputs[vt.input] ? c.inputs[vt.input].label : 'input'}`, x: tin.input, meta: { note: `test case ${c.id}` } };
    PG.state.inputs.set(inp.id, inp);
    const cs = caseSettings(v, i), group = fork ? fork.key : 'case';
    const name = fork ? `${fork.name} · trial ${i + 1} (${vt.label})` : `${c.id} · ${vName(v.name).toLowerCase()} · trial ${i + 1} (${vt.label})`;
    const tr = { id: PG.uid(), name, created: Date.now() + i, kept: true,   // kept (never replaced as a draft), not saved in the browser
      tags: ['test case', c.id, fork ? 'my edit' : v.name], notes: `${fork ? fork.name + ' (from ' + fork.base + '). ' : ''}${v.label}. ${vt.label}.`, inputId: inp.id, inputLen: inp.x.length, settings: cs.settings,
      summary: `${c.id} ${fork ? fork.name.split(' · ')[1] : v.name}: ${vt.label}`, variant: v.build, seq: v.mode === 'session' ? { id: group + ':' + v.name, n: `${c.id} ${fork ? 'my edit' : v.name}`, index: i } : null, result: r,
      caseRef: { id: c.id, group, variant: fork ? 'edit' : v.name, trial: i, base: fork ? fork.base : v.name } };
    PG.state.trials.push(tr);
    return tr;
  }

  // ---------- the trial list: one row per trial under a case header, with an Expected/Observed toggle
  function rowsOf(groupKey) {
    if (groupKey === 'case') {
      const V = cur.variants.filter(v => v.name === 'expected' || v.name === 'observed'), n = Math.max(0, ...V.map(v => (results[v.name] || []).length));
      return Array.from({ length: n }, (_, k) => ({ k, label: (V.map(v => v.trials[k]).find(Boolean) || {}).label || `trial ${k + 1}`,
        opts: V.map(v => ({ name: v.name, label: vName(v.name), t: trialOf(v.name, k) })).filter(o => o.t) }));
    }
    const f = forks.find(x => x.key === groupKey);
    if (f) return f.results.map((t, k) => t && ({ k, label: f.variant.trials[k].label, opts: [{ name: 'orig', label: 'Original', t: trialOf(f.base, k) }, { name: 'edit', label: 'My edit', t }].filter(o => o.t) })).filter(Boolean);
    return (results[groupKey] || []).map((t, k) => t && ({ k, label: cur.variants.find(v => v.name === groupKey).trials[k].label, opts: [{ name: groupKey, label: vName(groupKey), t }] })).filter(Boolean);
  }
  function renderGroups(listEl, rerender) {
    if (!cur || !Object.keys(results).length) return;
    const curT = PG.current();
    const group = (key, head, sub, extra) => {
      const rows = rowsOf(key); if (!rows.length) return;
      listEl.append(h('li.case-head', { 'data-group': key }, h('div', {}, h('b', { text: head }), sub ? h('span.muted', { text: ' ' + sub }) : null), extra || null));
      for (const r of rows) {
        const ts = r.opts.map(o => o.t), isCur = ts.some(t => t.id === PG.state.currentId);
        const show = r.opts.find(o => o.t.id === PG.state.currentId) || r.opts.find(o => o.name === (shown[key] || 'observed')) || r.opts[r.opts.length - 1];
        const cb = h('input', { type: 'checkbox', checked: ts.some(t => PG.state.selected.has(t.id)), 'aria-label': `Tick trial ${r.k + 1} of ${head}`,
          on: { change: e => { ts.forEach(t => (e.target.checked ? PG.state.selected.add(t.id) : PG.state.selected.delete(t.id))); rerender(); PG.bus.emit('selection'); } } });
        const pick = o => { shown[key] = o.name; PG.state.currentId = o.t.id; PG.bus.emit('current'); PG.bus.emit('trials'); };
        const tog = r.opts.length > 1 ? h('div.seg.case-tog', { role: 'radiogroup', 'aria-label': `Variant shown for trial ${r.k + 1}` },
          r.opts.map(o => h('button', { type: 'button', role: 'radio', 'data-variant': o.name, 'aria-checked': String(o === show), text: o.label, on: { click: () => pick(o) } }))) : null;
        const hasErr = ts.some(t => t.error);
        listEl.append(h('li.tl-item.case-row' + (isCur ? '.current' : ''), { 'aria-current': isCur ? 'true' : null, 'data-group': key, 'data-trial': String(r.k) }, cb,
          h('button.tl-open', { type: 'button', on: { click: () => pick(show) } },
            h('span.tl-name', {}, h('span.case-k', { text: `Trial ${r.k + 1}` }), ' ', r.label),
            h('span.tl-sum', { text: [r.k === keyIndex() && key === 'case' ? 'key trial' : '', hasErr ? 'failed' : '', r.opts.map(o => `${o.label.toLowerCase()}: ${o.t.variant === 'lite' ? 'shipped' : o.t.variant}`).join(', ')].filter(Boolean).join(' · ') })),
          tog));
      }
    };
    const expV = cur.variants.find(v => v.name === 'expected');
    group('case', `${cur.id}: test case`, expV ? `(${cur.variants.find(v => v.name === 'observed') ? 'expected and observed' : ''})` : '');
    for (const v of cur.variants) if (v.name !== 'expected' && v.name !== 'observed') group(v.name, `${cur.id} · ${v.name}`, `(${v.label})`);
    for (const f of forks) {
      const d = forkDiff(f);
      group(f.key, f.name, d.length ? `changes vs the original ${f.base}: ${d.join('; ')}` : '(no changes yet)',
        h('div.btnrow', {}, h('button.linkish', { type: 'button', text: 'Re-run', on: { click: () => runFork(f) } }), h('button.linkish', { type: 'button', text: 'Discard', on: { click: () => discardFork(f) } })));
      if (!f.ran) listEl.append(h('li.tl-item.muted', { text: running ? `${f.name}: running the whole sequence…` : `${f.name}: waiting to run…` }));
    }
  }

  // ---------- the side-by-side view of one row: expected on top, observed below, one time axis
  function pairFor(t) {
    if (!cur || !t || !t.caseRef || t.caseRef.id !== cur.id) return null;
    const k = t.caseRef.trial;
    if (t.caseRef.group === 'case') {
      if (t.caseRef.variant !== 'expected' && t.caseRef.variant !== 'observed') return null;
      const e = trialOf('expected', k), o = trialOf('observed', k);
      return e && o ? { e, o, k, eLab: 'Expected', oLab: 'Observed', eV: cur.variants.find(v => v.name === 'expected'), oV: cur.variants.find(v => v.name === 'observed') } : null;
    }
    const f = forks.find(x => x.key === t.caseRef.group); if (!f) return null;
    const ft = f.results[k]; if (!ft) return null;
    const e = trialOf('expected', k) || trialOf(f.base, k);
    return e ? { e, o: ft, k, eLab: trialOf('expected', k) ? 'Expected (original case)' : `Original ${f.base}`, oLab: 'My edit', eV: cur.variants.find(v => v.name === (trialOf('expected', k) ? 'expected' : f.base)), oV: { label: `${f.name}: ${forkDiff(f).join('; ') || 'no changes'}` } } : null;
  }
  // Where and how observed differs from expected: orange bands (seconds) and a one-line callout.
  function diffOf(e, o) {
    const kind = cur.diff || 'formant-on', word = cur.expWord || 'should be';
    const re = e.result, ro = o.result, dur = Math.max(e.inputLen, o.inputLen) / 48000, G = 0.01, n = Math.ceil(dur / G);
    const at = (r, arr, tt) => { const i = Math.floor(tt * r.frameRate); return i >= 0 && i < arr.length ? arr[i] : NaN; };
    const grid = f => Array.from({ length: n }, (_, i) => f(i * G));
    const bandsOf = (flags, minDur = 0.02) => { const R = TT.runs(flags, G, x => x).filter(x => x.b - x.a >= minDur); const out = []; for (const x of R) { if (out.length && x.a - out[out.length - 1][1] < 0.03) out[out.length - 1][1] = x.b; else out.push([x.a, x.b]); } return out; };
    const biggest = B => B.reduce((m, x) => (!m || x[1] - x[0] > m[1] - m[0] ? x : m), null);
    const span = x => `${x[0].toFixed(2)}–${x[1].toFixed(2)} s`;
    const sgn = (v, d = 0) => { const r = +v.toFixed(d); return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r).toFixed(d); };
    if (kind === 'formant-on') {
      const sh = r => tt => { const i = Math.floor(tt * r.frameRate); return i < r.sfmts[0].length && shifted(r, i); };
      const se = grid(sh(re)), so = grid(sh(ro)), B = bandsOf(se.map((x, i) => x !== so[i]));
      if (!B.length) return { bands: [], text: 'The shift runs at the same times in both.' };
      const b = biggest(B);
      const pct = r => { const q = [], i0 = Math.floor(b[0] * r.frameRate), i1 = Math.min(r.fmts[0].length, Math.ceil(b[1] * r.frameRate)); for (let i = i0; i < i1; i++) if (shifted(r, i)) q.push(Math.abs(r.sfmts[1][i] / r.fmts[1][i] - 1) > Math.abs(r.sfmts[0][i] / r.fmts[0][i] - 1) ? ['F2', 100 * (r.sfmts[1][i] / r.fmts[1][i] - 1)] : ['F1', 100 * (r.sfmts[0][i] / r.fmts[0][i] - 1)]);
        return q.length > (i1 - i0) / 2 ? [q[0][0], medianAll(q.map(x => x[1]))] : null; };   // shifted for most of the stretch
      const po = pct(ro), pe = pct(re), what = x => (x ? `${x[0]} shifted ${sgn(x[1])} %` : 'unchanged');
      return { bands: B, text: `${span(b)}: ${what(po)} (${word} ${what(pe)})` };
    }
    if (kind === 'pitch') {
      const cents = r => { const A = r.analysis; return tt => { const k = Math.round(tt / A.f0In.hop), a = A.f0In.f0[k], b2 = A.f0Out.f0[k]; return a > 0 && b2 > 0 ? 1200 * Math.log2(b2 / a) : NaN; }; };
      const ce = grid(cents(re)), co = grid(cents(ro)), B = bandsOf(ce.map((x, i) => Number.isFinite(x) && Number.isFinite(co[i]) && Math.abs(x - co[i]) > 50), 0.03);
      if (!B.length) return { bands: [], text: 'Pitch is shifted the same in both.' };
      const b = biggest(B), m = (a) => medianAll(a.slice(Math.round(b[0] / G), Math.round(b[1] / G)));
      return { bands: B, text: `${span(b)}: pitch ${sgn(m(co))} cents (${word} ${sgn(m(ce))} cents)` };
    }
    if (kind === 'noise') {
      const on = r => { const d = blocksDb(r.output); return tt => (d[Math.floor(tt / 0.02)] ?? -200) > -80; };
      const ne = grid(on(re)), no = grid(on(ro)), B = bandsOf(ne.map((x, i) => x !== no[i]), 0.04);
      if (!B.length) return { bands: [], text: 'Noise plays at the same times in both.' };
      const b = biggest(B), i = Math.round((b[0] + b[1]) / 2 / G);
      return { bands: B, text: `${span(b)}: ${no[i] ? 'noise' : 'silence'} (${word} ${ne[i] ? 'noise' : 'silence'})` };
    }
    if (kind === 'level') {
      const de = blocksDb(re.output), dd = blocksDb(ro.output), nb = Math.min(de.length, dd.length), act = [], diff = [];
      for (let k = 0; k < nb; k++) { const a = Math.max(de[k], dd[k]) > -50; act.push(a); diff.push(a ? dd[k] - de[k] : NaN); }
      const flags = grid(tt => { const k = Math.floor(tt / 0.02); return act[k] && Math.abs(diff[k]) > 1; });
      const B = bandsOf(flags, 0.04);
      if (!B.length) return { bands: [], text: 'The output level is the same in both (within 1 dB).' };
      const b = biggest(B), m = medianAll(diff.slice(Math.floor(b[0] / 0.02), Math.ceil(b[1] / 0.02)));
      return { bands: B, text: `${span(b)}: output ${Math.abs(m).toFixed(1)} dB ${m > 0 ? 'louder' : 'quieter'} than expected (${word} the same level)` };
    }
    if (kind === 'heard') {
      const f1 = [metric('heard_f1', ro), metric('heard_f2', ro)], f2 = [metric('heard_f1', re), metric('heard_f2', re)];
      const flags = grid(tt => { const a = at(ro, ro.sfmts[0], tt), b = at(re, re.sfmts[0], tt), a2 = at(ro, ro.sfmts[1], tt), b2 = at(re, re.sfmts[1], tt);
        return a > 0 && b > 0 && (Math.abs(a / b - 1) > 0.03 || Math.abs(a2 / b2 - 1) > 0.03); });
      return { bands: bandsOf(flags), text: `heard F1/F2 ${f1.map(Math.round).join('/')} Hz (${word} ${f2.map(Math.round).join('/')} Hz)` };
    }
    if (kind === 'pitchhz') {
      const mo = metric('pitchhz_med', ro), me = metric('pitchhz_med', re);
      const flags = grid(tt => { const a = at(ro, ro.pitchHz, tt), b = at(re, re.pitchHz, tt); return a > 0 && b > 0 && (a / b > 1.25 || a / b < 0.8); });
      return { bands: bandsOf(flags), text: `logged pitchHz ${Math.round(mo)} Hz (${word} ${Math.round(me)} Hz)` };
    }
    if (kind === 'ratio') {
      const mo = metric('ratio_f1', ro), me = metric('ratio_f1', re);
      const flags = grid(tt => { const a = at(ro, ro.sfmts[0], tt), b = at(re, re.sfmts[0], tt); return (a > 0 || b > 0) && !(a > 0 && b > 0 && Math.abs(a / b - 1) < 0.1); });
      return { bands: bandsOf(flags), text: `F1 target ×${mo >= 10 ? mo.toFixed(0) : mo.toFixed(2)} (${word} ×${me.toFixed(2)})` };
    }
    return { bands: [], text: '' };
  }
  function pairTiers(P, D) {
    const V = PG.Views, isPitch = cur.metric === 'pitch' || cur.diff === 'pitch' || cur.diff === 'pitchhz', isLevel = ['level', 'noise'].includes(cur.diff) || cur.metric === 'noise' || cur.metric === 'level';
    const withBands = (tier, on) => (on && D.bands.length ? { ...tier, draw(g, w, hh, xOf, C, z) { tier.draw(g, w, hh, xOf, C, z); TT.bands(g, D.bands, xOf, hh, C, null); } } : tier);
    const spec = (t, lab, on) => {
      const r = t.result, A = r.analysis, d = V.derive(t), fmax = 5000;
      return withBands({ id: 'pair-spec-' + lab, label: `${lab} · heard`, height: 150,
        sub: 'output spectrogram; grey: formants spoken (tracked), hollow: shifted target, blue dots: heard (LPC on the output)',
        alt: `${lab}: spectrogram of the output with the tracked, target and heard formants`,
        key: () => h('div.tl-keys', {}, V.key('in', 'spoken'), V.key('exp', 'target'), V.key('obsdot', 'heard')),
        draw(g, w, hh, xOf, C) {
          TT.drawSpec(g, A.specOut, xOf, w, hh, fmax, C);
          const yOf = v => hh - v / fmax * hh;
          TT.gridY(g, w, yOf, [1000, 2000, 3000, 4000], C, v => v / 1000 + ' kHz');
          for (const k of [0, 1]) TT.drawSeries(g, { y: r.fmts[k], dt: d.dt, style: 'input', lw: 1.5 }, xOf, yOf, C, w);
          for (const k of [0, 1]) TT.drawSeries(g, { y: r.sfmts[k], dt: d.dt, style: 'target' }, xOf, yOf, C, w);
          for (const k of [0, 1]) TT.drawSeries(g, { y: A.lpcOut.f[k], dt: A.lpcOut.hop, style: 'obsDots', r: 1.6 }, xOf, yOf, C, w);
        },
        readout: tt => [{ label: `${lab}: F1 heard (LPC)`, value: Math.round(A.lpcOut.f[0][Math.round(tt / A.lpcOut.hop)] || 0) + ' Hz', style: 'obsdot' }] }, on);
    };
    const tiersOf = (t, lab, on) => {
      const out = [spec(t, lab, on)];
      if (isPitch) { const p = V.pitchTier(t); p.label = `${lab} · pitch`; p.height = 110; out.push(withBands(p, on)); }
      if (isLevel) { const l = V.levelTier(t); l.label = `${lab} · level`; l.height = 100; out.push(withBands(l, on)); }
      if (cur.ostStates && V.derive(t).hasOst) { const s = V.ostTier(t); s.label = `${lab} · OST state`; out.push(s); }
      const sh = V.shiftTier(t); sh.label = `${lab} · shift on`; out.push(withBands(sh, on));
      return out;
    };
    return [...tiersOf(P.e, P.eLab, false), ...tiersOf(P.o, P.oLab, true)];
  }
  function renderPair(holder) {
    const t = PG.current(), P = pairFor(t);
    if (!P) return null;
    const D = diffOf(P.e, P.o), lab = (P.oV && P.oV.trials && P.oV.trials[P.k]) ? P.oV.trials[P.k].label : (P.eV && P.eV.trials[P.k] ? P.eV.trials[P.k].label : '');
    PG.Tiers.setDuration(Math.max(P.e.inputLen, P.o.inputLen) / 48000, true);
    const playOne = (x, label) => PG.Transport.playTracks([{ x, label }]);
    holder.append(h('div.pair-head', {},
      h('h3.pair-title', {}, h('span.cb-id', { text: cur.id }), ` Trial ${P.k + 1}: ${lab}`),
      h('p.pair-callout' + (D.bands.length ? '' : '.same'), { id: 'pair-callout', role: 'note' }, D.bands.length ? h('span.key.k-disc') : null, h('b', { text: D.text || 'No difference found.' })),
      h('div.btnrow.pair-play', {},
        h('button.btn', { type: 'button', id: 'pair-play-exp', text: `Play ${P.eLab.toLowerCase()}`, on: { click: () => playOne(P.e.result.output, P.eLab) } }),
        h('button.btn', { type: 'button', id: 'pair-play-obs', text: `Play ${P.oLab.toLowerCase()}`, on: { click: () => playOne(P.o.result.output, P.oLab) } }),
        h('button.btn.primary', { type: 'button', id: 'pair-ab', text: 'A/B', title: 'Play both in sync, starting with A (expected); press X or the switch button to swap without a gap', on: { click: () => PG.Transport.playPair({ x: P.e.result.output, trial: P.e, label: P.eLab }, { x: P.o.result.output, trial: P.o, label: P.oLab }) } }),
        h('button.btn', { type: 'button', text: 'Switch (X)', on: { click: () => PG.Transport.toggle() } }),
        h('button.btn', { type: 'button', text: 'Stop', on: { click: () => PG.Audio.stop() } }),
        h('button.linkish', { type: 'button', text: 'Session timeline', on: { click: () => showCompare() } }),
        h('button.linkish', { type: 'button', text: 'Numbers vs card', on: { click: () => showCompare(true) } })),
      h('p.pair-means.muted', {}, h('b', { text: `${P.eLab}: ` }), (P.eV && P.eV.label || '').replace(/^Expected: |^Alternative, not a fix: /, m => (m.startsWith('Alt') ? 'alternative, not a fix: ' : '')), h('br'),
        h('b', { text: `${P.oLab}: ` }), (P.oV && P.oV.label || '').replace(/^Observed: /, ''))));
    const st = TT.Stack(holder, { tiers: pairTiers(P, D) });
    holder.append(h('p.hint', { text: 'One time axis for both; orange marks where the lower run differs from the upper one. Hover for values; click to set where playback starts; drag to pan; ctrl + wheel to zoom.' }));
    st.diff = D;
    return st;
  }

  // ---------- banner at the top of Explore
  function render() {
    if (!banner) return;
    PG.clear(banner); banner.hidden = !cur;
    const c = cur, t = PG.current(), inCase = !!(c && t && t.caseRef && t.caseRef.id === c.id);
    const ip = document.getElementById('input-panel'); if (ip) ip.hidden = inCase;   // a case trial brings its own input
    if (!cur) return;
    const k = keyIndex(), ko = trialOf('observed', k);
    const C = Object.keys(results).length ? comparisons() : [], ok = C.filter(x => x.ok).length;
    const varies = c.variants.some(v => v.trials.some((q, j) => j > 0 && q.ops.some(o => o.op !== 'reset')));
    const info = inCase ? caseSettings(variantOf(t) || c.variants[0], t.caseRef.trial) : null;
    const expV = c.variants.find(v => v.name === 'expected');
    banner.append(
      h('div.cb-head', {}, h('span.cb-id', { text: c.id }), h('b', { text: c.title }),
        h('a.cb-card', { href: cardUrl(c.id), text: 'Back to report card' }),
        h('button.linkish', { type: 'button', text: 'Close case', on: { click: () => { cur = null; history.replaceState(null, '', location.pathname); PG.bus.emit('trials'); render(); } } })),
      c.sets.length > 1 ? h('div.cb-sets', {}, h('span.muted', { text: 'Example: ' }), h('div.seg', { role: 'radiogroup', 'aria-label': 'Example', id: 'case-set' },
        c.sets.map(x => h('button', { type: 'button', role: 'radio', 'data-set': x.id, 'aria-checked': String(x.id === c.set), text: x.label, disabled: running,
          on: { click: () => { if (x.id !== c.set) location.hash = `case=${c.id}&voice=${x.id}`; } } }))),
        c.inputDesc ? h('span.muted.cb-input', { text: ' ' + c.inputDesc }) : null) : null,
      h('p.cb-key', { text: c.key }),
      expV ? h('p.cb-means', { id: 'case-expected-means' }, h('b', { text: 'What "expected" means here: ' }), expV.label.replace(/^Expected: /, '')) : null,
      h('div.btnrow.cb-actions', {},
        ko ? h('button.btn.primary', { type: 'button', id: 'case-key-btn', text: `Key trial ${k + 1}: expected vs observed`, on: { click: () => focus() } }) : null,
        h('button.btn', { type: 'button', id: 'case-timeline-btn', text: 'Show session timeline', disabled: !C.length, on: { click: () => showCompare() } }),
        h('button.btn', { type: 'button', id: 'case-numbers-btn', text: C.length ? `Numbers vs card: ${ok} of ${C.length} match` : 'Numbers vs card', disabled: !C.length, on: { click: () => showCompare(true) } }),
        running ? h('span.muted', { text: 'Running…' }) : null),
      inCase ? h('details.cb-trial' + (varies ? '.varies' : ''), {}, h('summary', {}, h('b', { text: 'Settings panel: ' }), `shows ${t.name}${varies ? ' (settings change between trials in this case)' : ''}. Input: ${(PG.state.inputs.get(t.inputId) || {}).label || '–'}.`),
        varies ? 'This case changes settings between trials (per-trial loads or parameters), so the settings panel follows the selected trial. ' : '',
        info.big.length ? `Set by the case and not shown in the controls: ${info.big.join(', ')} (long arrays). ` : '',
        info.noise ? 'The case plays its own masking noise (the lab\'s babble); a fresh run from Explore uses generated pink noise. ' : '',
        'Changing any setting makes an editable copy of the case ("my edit") and re-runs the whole sequence with the case\'s switching, so effects between trials are kept; the original stays in the list. Each trial runs on the case\'s own input; choose other inputs in the trial table below.') : null,
      editor());
  }
  function showCompare(numbers) {
    const ids = cur.variants.flatMap(v => (results[v.name] || []).filter(Boolean).map(t => t.id));
    PG.state.selected.clear(); ids.forEach(i => PG.state.selected.add(i));
    PG.Compare.setLayout('case'); PG.bus.emit('trials'); PG.bus.emit('view', 'compare');
    setTimeout(() => { const el = document.getElementById(numbers ? 'case-numbers' : 'case-summary'); if (el) el.scrollIntoView({ block: 'start' }); }, 80);
  }
  // The trial table edits the copy (created on the first edit); every change re-runs the copy's whole sequence.
  function editor() {
    const c = cur, t = PG.current(), inFork = t && t.caseRef && t.caseRef.group !== 'case' ? forks.find(x => x.key === t.caseRef.group) : null;
    const f = inFork || forks[forks.length - 1] || null, V = f ? f.variant : (t && t.caseRef && variantOf(t)) || c.variants.find(v => v.name === 'observed') || c.variants[0];
    const det = h('details.cb-edit', { open: showAll, on: { toggle: e => { showAll = e.target.open; } } }, h('summary', { text: f ? `Edit ${f.name}: trials, inputs, switching, build` : 'Edit the trials, inputs, switching or build (makes an editable copy)' }));
    det.append(h('dl.setsum', {}, h('dt', { text: 'Between trials' }), h('dd', { text: c.switching || '–' }), h('dt', { text: 'Input' }), h('dd', { text: c.inputDesc || '–' }),
      h('dt', { text: 'Source' }), h('dd', { text: c.source }), c.note ? h('dt', { text: 'Tolerance' }) : '', c.note ? h('dd', { text: c.note }) : ''));
    const edit = (what, fn) => { const F = ensureFork(f ? (f.results.find(Boolean) || null) : t); fn(F.variant, F); if (!F.structural.includes(what)) F.structural.push(what); PG.bus.emit('trials'); render(); forkRun(F); };
    const inputOpts = [...c.inputs.map((q, i) => [`case:${i}`, q.label]), ...PG.CLIPS.map(cl => [`clip:${cl.id}`, `bundled clip: ${cl.label}`])];
    const tb = h('tbody');
    V.trials.forEach((q, k) => {
      tb.append(h('tr', {}, h('td', { text: String(k + 1) }), h('td', { text: q.label }),
        h('td', {}, h('select', { 'aria-label': `Input for trial ${k + 1}`, on: { change: e => edit('inputs changed', v => { v.trials[k].input = e.target.value.startsWith('case:') ? +e.target.value.slice(5) : e.target.value; }) } },
          inputOpts.map(([val, lab]) => h('option', { value: val, text: lab, selected: (typeof q.input === 'number' ? `case:${q.input}` : q.input) === val })))),
        h('td.case-ops', { text: q.ops.map(o => o.op === 'setParam' ? o.name : o.op).join(', ').slice(0, 80) || '–' }),
        h('td', {}, h('button.linkish', { type: 'button', text: 'up', disabled: k === 0, on: { click: () => edit('trial order changed', v => { const T = v.trials; [T[k - 1], T[k]] = [T[k], T[k - 1]]; }) } }), ' ',
          h('button.linkish', { type: 'button', text: 'duplicate', on: { click: () => edit('trials added', v => v.trials.splice(k + 1, 0, S.clone(v.trials[k]))) } }), ' ',
          h('button.linkish', { type: 'button', text: 'remove', disabled: V.trials.length < 2, on: { click: () => edit('trials removed', v => v.trials.splice(k, 1)) } }))));
    });
    const sw = h('select', { id: 'case-switch', 'aria-label': 'Between trials', on: { change: e => edit('switching changed', (v, F) => applySwitch(F, e.target.value)) } },
      [['captured', 'as the export ran'], ['clear', 'also clear the OST and PCF before each trial'], ['init', 'also re-send the setup parameters (AudapterIO init) before each trial'], ['reset', 'reset only: drop per-trial loads and parameters']].map(([v2, x]) => h('option', { value: v2, text: x, selected: ((f && f.switch) || 'captured') === v2 })));
    const mode = h('select', { id: 'case-mode', 'aria-label': 'Sessions', on: { change: e => edit('session mode changed', v => { v.mode = e.target.value; }) } },
      [['session', 'one Audapter session'], ['fresh', 'fresh Audapter per trial']].map(([m, x]) => h('option', { value: m, text: x, selected: V.mode === m })));
    det.append(h('div.tscroll', {}, h('table.plain.case-trials', {}, h('thead', {}, h('tr', {}, ['#', 'Trial', 'Input', 'Commands before the trial', ''].map(x => h('th', { text: x })))), tb)),
      h('div.btnrow', {}, h('label.syn', {}, h('span', { text: 'Between trials' }), sw), h('label.syn', {}, h('span', { text: 'Run as' }), mode),
        f ? h('button.btn.primary', { type: 'button', id: 'case-run', text: running ? 'Running…' : `Re-run ${f.name}`, disabled: running, on: { click: () => runFork(f) } }) : null,
        f ? h('button.linkish', { type: 'button', text: 'Discard this copy', on: { click: () => discardFork(f) } }) : null),
      h('p.ctl-desc', { text: 'The build is chosen in the settings panel (Audapter build); changing it also makes a copy.' }));
    return det;
  }
  function applySwitch(f, mode) {
    f.switch = mode; const orig = f.orig;
    f.variant.trials.forEach((t, k) => {
      const o = S.clone((orig.trials[k] || t).ops);
      if (mode === 'captured') t.ops = o;
      else if (mode === 'clear') t.ops = [{ op: 'ost', text: '' }, { op: 'pcf', text: '' }, ...o];
      else if (mode === 'init') t.ops = [...S.clone(orig.setup.filter(x => x.op === 'setParam')), ...o];
      else t.ops = o.filter(x => x.op === 'reset');
    });
  }

  // ---------- card vs replay, and the session timeline (used by Compare)
  // I-02 (report_i02.m): speech-modulated re playback in voiced 20 ms blocks; playback = total output - speech-only output
  function mixDb(tot, sp, x) {
    const W = 960, nb = Math.floor(x.length / W), blk = s => { const o = []; for (let k = 0; k < nb; k++) { let e = 0; for (let i = k * W; i < (k + 1) * W; i++) e += s[i] * s[i]; o.push(Math.sqrt(e / W)); } return o; };
    const act = blk(x).map(v => 20 * Math.log10(v) > -40), rs = blk(sp), rp = blk(Float64Array.from(tot, (v, i) => v - sp[i]));
    let a = 0, b = 0; for (let k = 0; k < nb; k++) if (act[k]) { a += rs[k] * rs[k]; b += rp[k] * rp[k]; }
    return 20 * Math.log10(Math.sqrt(a / b));
  }
  function comparisons() {
    const c = cur;
    return c.checks.map(k => {
      const v = c.variants.find(x => x.name === k.variant), T = results[k.variant], t = T && T[k.trial];
      let got = t && t.result ? metric(k.metric, t.result, v) : NaN;
      if (k.metric === 'mix_db') { const t2 = T && T[k.trial2]; got = t && t2 ? mixDb(t.result.output, t2.result.output, PG.state.inputs.get(t.inputId).x) : NaN; }
      const want = k.want === null ? NaN : k.want;
      const ok = Number.isNaN(want) ? Number.isNaN(got) : Math.abs(got - want) <= k.tol + 1e-9;
      return { ...k, got, want, ok };
    });
  }
  function numbersTable() {
    const C = comparisons(), bad = C.filter(x => !x.ok);
    const fmt = v => (Number.isFinite(v) ? (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3)) : 'none');
    return h('div', { id: 'case-numbers' }, h('h4', { text: `Card vs replay: ${C.length - bad.length} of ${C.length} numbers reproduce` }),
      h('div.tscroll', {}, h('table.plain.case-cmp', {}, h('thead', {}, h('tr', {}, ['Number', 'Variant', 'Card', 'Replay', ''].map(t => h('th', { text: t })))),
        h('tbody', {}, C.map(x => h('tr' + (x.ok ? '' : '.bad'), {}, h('td', { text: x.label }), h('td', { text: x.variant }), h('td', { text: fmt(x.want) }), h('td', { text: fmt(x.got) }),
          h('td', {}, h('span.res.' + (x.ok ? 'res-pass' : 'res-fail'), { text: x.ok ? 'matches' : `differs by ${fmt(Math.abs(x.got - x.want))}` }))))))),
      cur.extra && cur.extra.intended ? h('p.ctl-desc', { text: 'Intended pull toward the centre at strength 0.5, per vowel (card): ' + cur.extra.intended.map(e => `/${e.vowel}/ heard ${e.heard.map(Math.round).join('/')} vs intended ${e.intended.map(Math.round).join('/')} Hz`).join('; ') + '.' }) : '');
  }
  // The case section of Compare: session timeline (expected hollow, observed blue, orange where they differ) and numbers.
  function renderSummary(container) {
    if (!cur || !Object.keys(results).length) return [];
    const sec = h('section.case-summary', { id: 'case-summary' }, h('h3', {}, `${cur.id}: ${cur.title} `, h('a', { href: cardUrl(cur.id), text: '(report card)' })),
      h('p.ctl-desc', { text: 'Session timeline: every trial of the case end to end, as it ran. Each variant has its own rows; expected is hollow, observed blue, and orange marks where the observed row differs from the expected one at the same time.' }));
    const holder = h('div'); sec.append(holder); container.append(sec);
    const st = timeline(holder);
    sec.append(numbersTable());
    return st ? [st] : [];
  }
  function timeline(holder) {
    const V = cur.variants.filter(v => results[v.name] && results[v.name].some(Boolean));
    if (!V.length) return;
    const R = { ...results };   // this stack draws the results it was made for, even after the case is re-run
    const lens = v => R[v.name].map(t => (t ? t.inputLen / 48000 : 0));
    const offs = v => { let o = 0; return lens(v).map(d => { const a = o; o += d; return a; }); };
    const total = Math.max(...V.map(v => lens(v).reduce((a, b) => a + b, 0)));
    const onRuns = (v) => {   // intervals where the case's quantity is on, absolute time
      const out = [], O = offs(v);
      R[v.name].forEach((t, k) => { if (!t) return; const r = t.result, dt = 1 / r.frameRate;
        if (cur.metric === 'noise') { const b = blocksDb(r.output); TT.runs(b, 0.02, d => d > -80).forEach(x => out.push([x.a + O[k], x.b + O[k]])); }
        else if (cur.metric === 'level') { const bo = blocksDb(r.output), bi = blocksDb(PG.state.inputs.get(t.inputId).x); TT.runs(bo.map((d, i) => d > -50 && Math.abs(d - bi[i]) > 1), 0.02, x => x).forEach(x => out.push([x.a + O[k], x.b + O[k]])); }
        else if (cur.metric === 'pitch') { const A = r.analysis, f = A.f0In.f0, g = A.f0Out.f0, c = new Float32Array(f.length).map((_, i) => (f[i] > 0 && g[i] > 0 ? 1200 * Math.log2(g[i] / f[i]) : NaN));
          TT.runs(c, A.f0In.hop, x => Math.abs(x) > 50).filter(x => x.b - x.a > 0.03).forEach(x => out.push([x.a + O[k], x.b + O[k]])); }
        else TT.runs(r.sfmts[0], dt, (x, i) => shifted(r, i)).forEach(x => out.push([x.a + O[k], x.b + O[k]])); });
      return out;
    };
    const what = { formant: 'formant shift on (sfmts ≠ fmts)', pitch: 'pitch shifted (measured, > 50 cents)', noise: 'noise heard (output above −80 dB)', level: 'output level ≠ input (more than 1 dB)' }[cur.metric];
    const exp = V.find(v => v.name === 'expected'), expOn = exp ? onRuns(exp) : null;
    const tiers = [];
    for (const v of V) {
      const O = offs(v), L = lens(v), isExp = v.name === 'expected';
      tiers.push({ label: vName(v.name), sub: 'trials', height: 26,
        draw(g, w, hh, xOf, C) { TT.drawIntervals(g, L.map((d, k) => ({ a: O[k], b: O[k] + d, label: String(k + 1), kind: k % 2 ? 'ctx' : 'exp' })), xOf, w, hh, C); } });
      const on = onRuns(v);
      tiers.push({ label: ' ', sub: what, height: 30,
        draw(g, w, hh, xOf, C) {
          if (!isExp && expOn && exp && lens(exp).length === L.length) {   // discrepancy vs expected
            const grid = 0.01, n = Math.ceil(total / grid), A = new Uint8Array(n), B = new Uint8Array(n);
            for (const [a, b] of expOn) for (let i = Math.floor(a / grid); i < Math.min(n, Math.ceil(b / grid)); i++) A[i] = 1;
            for (const [a, b] of on) for (let i = Math.floor(a / grid); i < Math.min(n, Math.ceil(b / grid)); i++) B[i] = 1;
            const d = TT.runs(Array.from(A, (x, i) => x !== B[i]), grid, x => x).filter(x => x.b - x.a > 0.015).map(x => [x.a, x.b]);
            TT.bands(g, d, xOf, hh, C, null);
          }
          TT.drawIntervals(g, on.map(([a, b]) => ({ a, b, kind: isExp ? 'exp' : 'obs', label: '' })), xOf, w, hh, C);
        } });
      if (cur.ostStates) tiers.push({ label: ' ', sub: 'OST state', height: 26,
        draw(g, w, hh, xOf, C) { const items = []; R[v.name].forEach((t, k) => { if (!t) return; const r = t.result, s = states(r, v); TT.runs(s, 1 / r.frameRate, () => true, x => String(x)).forEach(x => items.push({ a: x.a + O[k], b: x.b + O[k], label: x.label, kind: x.label === '0' ? 'ctx' : isExp ? 'exp' : 'obs' })); }); TT.drawIntervals(g, items, xOf, w, hh, C); } });
    }
    return TT.Stack(holder, { tiers, ownDuration: total });
  }
  return { mount, open, render, metric, comparisons, renderSummary, renderGroups, renderPair, pairFor, diffOf, owns, focus,
    results: () => results, current: () => cur, running: () => running, caseSettings, paramsAt, forks: () => forks, work: () => ({ variants: cur ? cur.variants : [] }) };
})();
