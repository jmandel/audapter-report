'use strict';
// "Test cases" tab: the report's examples as replayable test cases. A case holds the exact command stream the card's
// export script sent to Audapter (captured with a recording shim), its inputs, one or more variants (observed as run,
// expected), and the card's key numbers. The page replays each variant in one Audapter session (or fresh per trial),
// shows expected and observed on one session timeline, and compares the replay with the card.
PG.Cases = (() => {
  const { h, S } = PG, TT = PG.Tiers;
  const loaded = {}, waiting = {}, resCache = {}, resWait = {};
  let root, cur = null, work = null, results = {}, stack = null, running = false, runId = 0;
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
  function states(r, variant) { const off = variant.stateOffset || 0; return Array.from(r.ost_stat, s => (s >= 1 ? s + off : s)); }
  function blocksDb(x, B = 960) { const out = []; for (let i = 0; i + B <= x.length; i += B) { let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k]; out.push(10 * Math.log10(e / B + 1e-30)); } return out; }
  function metric(name, r, variant) {
    const dt = frameDt(r), n = r.fmts[0].length;
    if (name === 'shift_s') { let c = 0; for (let i = 0; i < n; i++) if (shifted(r, i)) c++; return c * dt; }
    if (name === 'on') { for (let i = 0; i < n; i++) if (shifted(r, i)) return i * dt; return NaN; }
    if (name === 'off') { for (let i = n - 1; i >= 0; i--) if (shifted(r, i)) return (i + 1) * dt; return NaN; }
    if (name === 'st1') { const s = states(r, variant), i = s.findIndex(v => v >= 1); return i < 0 ? NaN : i * dt; }
    if (name === 'n_sfmts') { let c = 0; for (let i = 0; i < n; i++) if (r.sfmts[0][i] > 0) c++; return c; }
    if (name.startsWith('seg:')) { const [, k, e] = name.split(':'), R = TT.runs(r.sfmts[0], dt, v => v > 0); const g = R[+k]; return g ? (e === 'a' ? g.a : g.b) : NaN; }
    if (name === 'ratio_f1') { const q = []; for (let i = 0; i < n; i++) if (r.sfmts[0][i] > 0) q.push(r.sfmts[0][i] / r.fmts[0][i]); return medianAll(q); }
    if (name === 'pitchhz_med') return medianAll(Array.from(r.pitchHz).filter(v => v > 0));
    if (name === 'rms_out') { let e = 0; for (const v of r.signalOut) e += v * v; return Math.sqrt(e / r.signalOut.length); }
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
    if (name === 'heard_f1' || name === 'heard_f2' || name === 'prod_f1' || name === 'prod_f2') {
      const j = name.endsWith('1') ? 0 : 1, src = name.startsWith('heard') ? r.sfmts : r.fmts;
      const ix = []; for (let i = 0; i < n; i++) if (r.fmts[0][i] > 0 && r.sfmts[0][i] > 0) ix.push(i);
      const a = Math.round(ix.length * 0.3), b = Math.round(ix.length * 0.7), sel = ix.slice(Math.max(0, a - 1), b);   // Octave ix(round(end*0.3):round(end*0.7))
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

  // ---------- picker and case view
  function mount(el) {
    root = el;
    PG.bus.on('tab', t => { if (t === 'cases') render(); });
    window.addEventListener('hashchange', fromHash);
  }
  function fromHash() {
    const m = /[#&]case=([A-Za-z0-9-]+)/.exec(location.hash);
    if (m) { PG.bus.emit('tab', 'cases'); open(m[1], true); }
  }
  async function open(id, autorun) {
    const idx = (PG.CASES || []).find(c => c.id === id);
    if (!idx || !idx.available) { cur = null; render(); PG.toast(`Test case ${id} is not available${idx && idx.why ? ': ' + idx.why : '.'}`, 'error'); return; }
    try { const c = await loadCase(id); cur = c; work = S.clone({ variants: c.variants }); results = {}; render(); if (autorun) run(); }
    catch (e) { PG.toast(e.message, 'error'); }
  }
  const cardUrl = id => `../#${id}`;
  function render() {
    if (!root) return;
    if (stack) { stack.destroy(); stack = null; }
    PG.clear(root);
    root.append(h('section.dz-head', {}, h('h2.dz-title', { text: 'Test cases from the audit report' }),
      h('p.grp-blurb', { text: 'Each report example as a replayable test: the exact commands the card\'s export sent to Audapter (every parameter, OST and PCF load, reset and input), run here on the same core. Run it, compare with the card, then change the trial order, the inputs or the build and run again.' })));
    const list = h('ul.case-list');
    for (const c of PG.CASES || []) {
      list.append(h('li.case-item' + (cur && cur.id === c.id ? '.current' : ''), {},
        h('div.ci-head', {}, h('code.ci-id', { text: c.id }), c.available ? h('button.btn' + (cur && cur.id === c.id ? '.primary' : ''), { type: 'button', text: cur && cur.id === c.id ? 'Open' : 'Open', 'data-case': c.id, on: { click: () => { history.replaceState(null, '', '#case=' + c.id); open(c.id, true); } } }) : null,
          h('a.ci-card', { href: cardUrl(c.id), text: 'report card' })),
        h('div.ci-t', { text: c.available ? c.title : `Not replayable: ${c.why}` }), c.available ? h('div.ci-s', { text: c.summary }) : null));
    }
    root.append(h('section.dz-sec.case-pick', {}, h('h3', { text: 'Cases' }), list));
    if (cur) root.append(view());
  }
  function view() {
    const c = cur, sec = h('section.dz-sec.case-view', { id: 'case-view' });
    sec.append(h('h3', {}, `${c.id}: ${c.title} `, h('a', { href: cardUrl(c.id), text: '(report card)' })),
      h('p', { text: c.summary }), h('p.ctl-desc', { text: `Key result: ${c.key}` }), c.note ? h('p.ctl-desc', { text: 'Tolerance: ' + c.note }) : '',
      h('dl.setsum', {}, h('dt', { text: 'Between trials' }), h('dd', { text: c.switching || '–' }), h('dt', { text: 'Input' }), h('dd', { text: c.inputDesc || '–' }), h('dt', { text: 'Source' }), h('dd', { text: c.source })));
    // variants: build and mode
    const vt = h('tbody');
    work.variants.forEach((v, i) => vt.append(h('tr', {}, h('th', { text: v.label }),
      h('td', {}, h('select', { 'aria-label': `Build for ${v.name}`, on: { change: e => { v.build = e.target.value; } } }, Object.keys(PG.ENGINES).map(b => h('option', { value: b, text: { lite: 'shipped', patched: 'patched (3 fixes)', full: 'shipped, full size' }[b], selected: v.build === b })))),
      h('td', {}, h('select', { 'aria-label': `Mode for ${v.name}`, on: { change: e => { v.mode = e.target.value; } } }, [['session', 'one Audapter session'], ['fresh', 'fresh Audapter per trial']].map(([m, t]) => h('option', { value: m, text: t, selected: v.mode === m })))),
      h('td', { text: `${v.trials.length} trial${v.trials.length === 1 ? '' : 's'}` }))));
    sec.append(h('h4', { text: 'Variants' }), h('div.tscroll', {}, h('table.plain.case-var', {}, vt)));
    // trials: order, input, duplicate, remove (applied to every variant that has that trial)
    const max = Math.max(...work.variants.map(v => v.trials.length)), tb = h('tbody');
    const inputOpts = [...c.inputs.map((q, i) => [`case:${i}`, q.label]), ...PG.CLIPS.map(cl => [`clip:${cl.id}`, `bundled clip: ${cl.label}`])];
    for (let k = 0; k < max; k++) {
      const t0 = work.variants.find(v => v.trials[k]).trials[k];
      const each = fn => work.variants.forEach(v => { if (v.trials[k]) fn(v); });
      tb.append(h('tr', {}, h('td', { text: String(k + 1) }), h('td', { text: t0.label }),
        h('td', {}, h('select', { 'aria-label': `Input for trial ${k + 1}`, on: { change: e => each(v => { v.trials[k].input = e.target.value.startsWith('case:') ? +e.target.value.slice(5) : e.target.value; }) } },
          inputOpts.map(([val, lab]) => h('option', { value: val, text: lab, selected: (typeof t0.input === 'number' ? `case:${t0.input}` : t0.input) === val })))),
        h('td.case-ops', { text: t0.ops.map(o => o.op === 'setParam' ? o.name : o.op).join(', ').slice(0, 80) || '–' }),
        h('td', {}, h('button.linkish', { type: 'button', text: 'up', disabled: k === 0, on: { click: () => { each(v => { const T = v.trials; if (T[k - 1]) [T[k - 1], T[k]] = [T[k], T[k - 1]]; }); render(); } } }), ' ',
          h('button.linkish', { type: 'button', text: 'duplicate', on: { click: () => { each(v => v.trials.splice(k + 1, 0, S.clone(v.trials[k]))); render(); } } }), ' ',
          h('button.linkish', { type: 'button', text: 'remove', disabled: max < 2, on: { click: () => { each(v => v.trials.splice(k, 1)); render(); } } }))));
    }
    const sw = h('select', { id: 'case-switch', 'aria-label': 'Between trials', on: { change: e => applySwitch(e.target.value) } },
      [['captured', 'as the export ran'], ['clear', 'also clear the OST and PCF before each trial'], ['init', 'also re-send the setup parameters (AudapterIO init) before each trial'], ['reset', 'reset only: drop per-trial loads and parameters']].map(([v2, t]) => h('option', { value: v2, text: t, selected: (work.switch || 'captured') === v2 })));
    sec.append(h('h4', { text: 'Trials' }), h('div.tscroll', {}, h('table.plain.case-trials', {}, h('thead', {}, h('tr', {}, ['#', 'Trial', 'Input', 'Commands before the trial', ''].map(t => h('th', { text: t })))), tb)),
      h('div.btnrow', {}, h('label.syn', {}, h('span', { text: 'Between trials' }), sw),
        h('button.btn.primary', { type: 'button', id: 'case-run', text: running ? 'Running…' : 'Run all variants', disabled: running, on: { click: run } }),
        h('button.linkish', { type: 'button', text: 'Undo my edits', on: { click: () => { work = S.clone({ variants: cur.variants }); results = {}; render(); } } })));
    const out = h('div#case-results'); sec.append(out);
    if (Object.keys(results).length) showResults(out);
    return sec;
  }
  function applySwitch(mode) {
    work.switch = mode; const base = S.clone({ variants: cur.variants });
    work.variants.forEach((v, vi) => {
      const orig = base.variants[vi];
      v.trials.forEach((t, k) => {
        const o = (orig.trials[k] || t).ops.filter(x => true);
        if (mode === 'captured') t.ops = o;
        else if (mode === 'clear') t.ops = [{ op: 'ost', text: '' }, { op: 'pcf', text: '' }, ...o];
        else if (mode === 'init') t.ops = [...orig.setup.filter(x => x.op === 'setParam'), ...o];
        else t.ops = o.filter(x => x.op === 'reset');
      });
    });
    render();
  }

  // ---------- run
  async function run() {
    if (running) return;
    running = true; results = {}; render();
    const me = ++runId, c = cur;
    try {
      for (const v of work.variants) {
        const trials = [];
        for (const t of v.trials) {
          const x = typeof t.input === 'number' ? await resource(c.inputs[t.input].res) : (await PG.InputUI.loadClipInput(String(t.input).slice(5))).x;
          const ops = [];
          for (const o of t.ops) ops.push(o.res ? { op: o.op, name: o.name, value: await resource(o.res) } : o);
          trials.push({ input: x, ops, label: t.label });
        }
        const setup = [];
        for (const o of v.setup) setup.push(o.res ? { op: o.op, name: o.name, value: await resource(o.res) } : o);
        PG.bus.emit('run-state', { running: true, frac: 0, text: `${c.id}: running "${v.label}"…` });
        const seq = { id: PG.uid(), n: `${c.id} ${v.name}` };
        const got = [];
        await PG.Engine.run({ variant: v.build, sequence: v.mode === 'session', setup, trials: trials.map(t => ({ input: t.input, ops: t.ops })),
          onProgress: (i, f) => PG.bus.emit('run-state', { running: true, frac: (i + f) / trials.length }),
          onResult: (i, r) => { got[i] = r; } });
        if (me !== runId) return;
        results[v.name] = got.map((r, i) => r && addCaseTrial(c, v, i, trials[i], r, seq));
      }
      PG.bus.emit('run-state', { running: false, text: `${c.id}: replayed ${work.variants.length} variant${work.variants.length > 1 ? 's' : ''}.` });
    } catch (e) { PG.bus.emit('run-state', { running: false, text: '' }); PG.toast(`${c.id}: ${e.message}`, 'error'); }
    finally { running = false; PG.bus.emit('trials'); render(); const el = document.getElementById('case-results'); if (el && location.hash.includes('case=')) el.scrollIntoView({ block: 'start' }); }
  }
  // Put a replayed trial in the trial list, with approximate Playground settings (the final parameter values and OST/PCF).
  function addCaseTrial(c, v, i, t, r, seq) {
    const inp = { id: PG.uid(), kind: 'case', label: `${c.id} ${t.label}`, x: t.input, meta: { note: `test case ${c.id}` } };
    PG.state.inputs.set(inp.id, inp);
    const raw = {}; let ost = '', pcf = '';
    for (const o of [...v.setup, ...v.trials.slice(0, i + 1).flatMap(q => q.ops)]) {
      if (o.op === 'setParam' && !o.res && o.value && o.value.length <= 8) raw[o.name.toLowerCase()] = o.value.length === 1 ? o.value[0] : o.value;
      if (o.op === 'ost') ost = o.text; if (o.op === 'pcf') pcf = o.text;
    }
    const s = S.normalize({ preset: 'female', build: v.build, raw, when: ost || pcf ? { mode: 'custom', ost, pcf } : { mode: 'always' }, shift: { formant: { on: false }, pitch: { on: false } } });
    const tr = { id: PG.uid(), name: `${c.id} ${v.name} ${i + 1}`, created: Date.now(), kept: true, tags: ['test case', c.id, v.name], notes: `${v.label}; ${t.label}. Replayed from the captured commands; "Use these settings" loads an approximation (final parameters and OST/PCF, fresh).`,
      inputId: inp.id, inputLen: inp.x.length, settings: s, summary: `${c.id} ${v.name}: ${t.label}`, variant: v.build, seq: v.mode === 'session' ? { ...seq, index: i } : null, result: r, caseRef: { id: c.id, variant: v.name, trial: i } };
    PG.state.trials.push(tr);
    return tr;
  }

  // ---------- results: key numbers vs the card, and the session timeline (expected hollow, observed blue)
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
      const v = work.variants.find(x => x.name === k.variant), T = results[k.variant], t = T && T[k.trial];
      let got = t && t.result ? metric(k.metric, t.result, v) : NaN;
      if (k.metric === 'mix_db') { const t2 = T && T[k.trial2]; got = t && t2 ? mixDb(t.result.output, t2.result.output, PG.state.inputs.get(t.inputId).x) : NaN; }
      const want = k.want === null ? NaN : k.want;
      const ok = Number.isNaN(want) ? Number.isNaN(got) : Math.abs(got - want) <= k.tol + 1e-9;
      return { ...k, got, want, ok };
    });
  }
  function showResults(out) {
    const C = comparisons(), bad = C.filter(x => !x.ok);
    const fmt = v => (Number.isFinite(v) ? (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3)) : 'none');
    out.append(h('h4', { text: 'Session timeline' }),
      h('p.ctl-desc', { text: 'Trials end to end, as they ran. Each variant has its own rows; expected is hollow, observed blue, and orange marks where an observed row differs from the expected one at the same time.' }));
    const holder = h('div'); out.append(holder);
    timeline(holder);
    out.append(h('h4', { text: `Card vs replay: ${C.length - bad.length} of ${C.length} numbers reproduce` }),
      h('div.tscroll', {}, h('table.plain.case-cmp', {}, h('thead', {}, h('tr', {}, ['Number', 'Variant', 'Card', 'Replay', ''].map(t => h('th', { text: t })))),
        h('tbody', {}, C.map(x => h('tr' + (x.ok ? '' : '.bad'), {}, h('td', { text: x.label }), h('td', { text: x.variant }), h('td', { text: fmt(x.want) }), h('td', { text: fmt(x.got) }),
          h('td', {}, h('span.res.' + (x.ok ? 'res-pass' : 'res-fail'), { text: x.ok ? 'matches' : `differs by ${fmt(Math.abs(x.got - x.want))}` }))))))));
    if (cur.extra && cur.extra.intended) out.append(h('p.ctl-desc', { text: 'Intended pull toward the centre at strength 0.5, per vowel (card): ' + cur.extra.intended.map(e => `/${e.vowel}/ heard ${e.heard.map(Math.round).join('/')} vs intended ${e.intended.map(Math.round).join('/')} Hz`).join('; ') + '.' }));
  }
  function timeline(holder) {
    const V = work.variants.filter(v => results[v.name] && results[v.name].some(Boolean));
    if (!V.length) return;
    const lens = v => results[v.name].map(t => (t ? t.inputLen / 48000 : 0));
    const offs = v => { let o = 0; return lens(v).map(d => { const a = o; o += d; return a; }); };
    const total = Math.max(...V.map(v => lens(v).reduce((a, b) => a + b, 0)));
    TT.setDuration(total, false);
    const onRuns = (v) => {   // intervals where the case's quantity is on, absolute time
      const out = [], O = offs(v);
      results[v.name].forEach((t, k) => { if (!t) return; const r = t.result, dt = 1 / r.frameRate;
        if (cur.metric === 'noise') { const b = blocksDb(r.output); TT.runs(b, 0.02, d => d > -80).forEach(x => out.push([x.a + O[k], x.b + O[k]])); }
        else if (cur.metric === 'pitch') { const A = r.analysis, f = A.f0In.f0, g = A.f0Out.f0, c = new Float32Array(f.length).map((_, i) => (f[i] > 0 && g[i] > 0 ? 1200 * Math.log2(g[i] / f[i]) : NaN));
          TT.runs(c, A.f0In.hop, x => Math.abs(x) > 50).filter(x => x.b - x.a > 0.03).forEach(x => out.push([x.a + O[k], x.b + O[k]])); }
        else TT.runs(r.sfmts[0], dt, (x, i) => shifted(r, i)).forEach(x => out.push([x.a + O[k], x.b + O[k]])); });
      return out;
    };
    const what = { formant: 'formant shift on (sfmts ≠ fmts)', pitch: 'pitch shifted (measured, > 50 cents)', noise: 'noise heard (output above −80 dB)' }[cur.metric];
    const exp = V.find(v => v.name === 'expected'), expOn = exp ? onRuns(exp) : null;
    const tiers = [];
    for (const v of V) {
      const O = offs(v), L = lens(v), isExp = v.name === 'expected';
      tiers.push({ label: v.name === 'expected' ? 'Expected' : v.name === 'observed' ? 'Observed' : v.name, sub: 'trials', height: 26,
        draw(g, w, hh, xOf, C) { TT.drawIntervals(g, L.map((d, k) => ({ a: O[k], b: O[k] + d, label: String(k + 1), kind: k % 2 ? 'ctx' : 'exp' })), xOf, w, hh, C); } });
      const on = onRuns(v);
      tiers.push({ label: ' ', sub: what, height: 30,
        draw(g, w, hh, xOf, C) {
          if (!isExp && expOn && V.every(q => lens(q).length === L.length)) {   // discrepancy vs expected
            const grid = 0.01, n = Math.ceil(total / grid), A = new Uint8Array(n), B = new Uint8Array(n);
            for (const [a, b] of expOn) for (let i = Math.floor(a / grid); i < Math.min(n, Math.ceil(b / grid)); i++) A[i] = 1;
            for (const [a, b] of on) for (let i = Math.floor(a / grid); i < Math.min(n, Math.ceil(b / grid)); i++) B[i] = 1;
            const d = TT.runs(Array.from(A, (x, i) => x !== B[i]), grid, x => x).filter(x => x.b - x.a > 0.015).map(x => [x.a, x.b]);
            TT.bands(g, d, xOf, hh, C, null);
          }
          TT.drawIntervals(g, on.map(([a, b]) => ({ a, b, kind: isExp ? 'exp' : 'obs', label: '' })), xOf, w, hh, C);
        } });
      if (cur.ostStates) tiers.push({ label: ' ', sub: 'OST state', height: 26,
        draw(g, w, hh, xOf, C) { const items = []; results[v.name].forEach((t, k) => { if (!t) return; const r = t.result, s = states(r, v); TT.runs(s, 1 / r.frameRate, () => true, x => String(x)).forEach(x => items.push({ a: x.a + O[k], b: x.b + O[k], label: x.label, kind: x.label === '0' ? 'ctx' : isExp ? 'exp' : 'obs' })); }); TT.drawIntervals(g, items, xOf, w, hh, C); } });
    }
    stack = TT.Stack(holder, { tiers });
  }
  return { mount, open, render, metric, comparisons, results: () => results, current: () => cur, running: () => running };
})();
