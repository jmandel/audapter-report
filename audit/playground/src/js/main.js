'use strict';
// Page wiring: tabs, run control (auto-run, Run, sweeps, sessions), transport, views, warnings, persistence, test hooks.
(() => {
  const { h, S, $ } = PG;
  const st = PG.state;
  let counter = 0, pending = false, stack = null;

  PG.toast = (msg, kind = 'info') => {
    const t = h(`div.toast.t-${kind}`, { role: kind === 'error' ? 'alert' : 'status', text: msg });
    $('#toasts').append(t); setTimeout(() => t.remove(), kind === 'error' ? 9000 : 4000);
  };

  // ---------------- layout
  function layout() {
    const app = $('#app');
    const tabs = [['explore', 'Explore'], ['design', 'Timing & design'], ['about', 'About']];
    const nav = $('#tabs');
    for (const [k, t] of tabs) nav.append(h('button', { type: 'button', role: 'tab', id: 'tab-' + k, 'aria-controls': 'panel-' + k, 'aria-selected': String(k === 'explore'), text: t, on: { click: () => PG.bus.emit('tab', k) } }));
    $('#theme-btn').addEventListener('click', () => PG.theme.toggle());
    PG.bus.on('tab', k => {
      for (const [x] of tabs) { $('#tab-' + x).setAttribute('aria-selected', String(x === k)); $('#panel-' + x).hidden = x !== k; }
      if (k === 'explore') showView();
    });
    PG.SettingsUI.mount($('#settings'));
    PG.InputUI.mount($('#input-panel'));
    PG.TrialsUI.mount($('#trials'));
    PG.DesignUI.mount($('#panel-design'));
    PG.Cases.mount($('#case-banner'), $('#case-pick'));
    PG.Compare.mount($('#v-compare'));
    PG.Vowel.mount($('#v-vowel'));
    runBar(); PG.Transport.mount($('#transport')); viewTabs();
    PG.bus.on('engine-stats', s => { $('#mem').textContent = `WASM heap ${PG.fmt.mb(s.lastWasmBytes)}, one instance at a time${s.mode === 'main' ? ' (main thread)' : ''}`; });
  }

  // ---------------- run bar
  function runBar() {
    const bar = $('#runbar');
    const run = h('button.btn.primary.big', { type: 'button', id: 'run-btn', text: 'Run', title: 'Run the current settings on the current input and keep the trial', on: { click: () => runCurrent(true) } });
    const auto = h('label.auto', {}, h('input', { type: 'checkbox', id: 'auto-run', checked: st.autoRun, on: { change: e => { st.autoRun = e.target.checked; if (st.autoRun) schedule(); } } }), ' Update as I change settings');
    const stop = h('button.btn', { type: 'button', id: 'stop-btn', text: 'Stop', hidden: true, on: { click: () => PG.Engine.cancel() } });
    const prog = h('div.progress', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Processing' }, h('div.progress-fill'));
    const status = h('span#run-status.muted', { 'aria-live': 'polite' });
    bar.append(run, auto, stop, prog, status);
    PG.bus.on('run-state', s => {
      stop.hidden = !s.running; prog.hidden = !s.running; run.disabled = !!s.running && !s.canQueue;
      if (s.frac !== undefined) { prog.firstChild.style.width = (100 * s.frac).toFixed(0) + '%'; prog.setAttribute('aria-valuenow', (100 * s.frac).toFixed(0)); }
      if (s.text !== undefined) status.textContent = s.text;
    });
    prog.hidden = true;
  }

  // ---------------- running
  const schedule = PG.debounce(() => { if (st.autoRun && st.input) runCurrent(false); }, 450);
  PG.bus.on('settings', why => { PG.Store.saveSettings(st.settings); updateWarnings(); if (why !== 'noauto' && why !== 'case' && !PG.Cases.owns()) schedule(); });
  PG.bus.on('input', inp => { updateWarnings(); analyseInput(inp); schedule(); });

  function nextName(extra) { counter++; return `T${counter}${extra ? ' ' + extra : ''}`; }
  function recSec(v) { return v === 'full' ? 30 : 10; }

  async function runCurrent(kept) {
    if (!st.input) { PG.toast('Choose an input first: a clip, a synthetic vowel, a recording or a file.'); return; }
    return runSpecs([{ inputId: st.input.id, settings: S.clone(st.settings) }], { kept });
  }
  // specs: [{inputId, settings, name?}]
  // A timeline design's random extra delay is drawn once per trial and stored in that trial's settings (reproducible).
  function resolveJitter(s) {
    const d = s.design;
    if (s.when.mode === 'design' && d && d.jitterMs > 0 && d.blocks[0]) {
      const j = Math.round(Math.random() * d.jitterMs / 10) * 10;
      d.blocks[0].start.ms += j; d.jitterApplied = j; d.jitterMs = 0;
    }
    return s;
  }
  async function runSpecs(specs, { kept = true, sequence = false, clearAbsent = false, sweep = null, noCompare = false } = {}) {
    specs.forEach(sp => resolveJitter(sp.settings));
    const errs = PG.S.warnings(specs[0].settings, S.compile(specs[0].settings), {}).filter(w => w.level === 'error');
    if (errs.length) { PG.bus.emit('run-state', { running: false, text: 'Not run: ' + errs[0].text }); return; }
    if (PG.Engine.busy()) { if (!kept && !sequence && !sweep) { pending = true; return; } PG.toast('A run is in progress; press Stop first or wait.'); return; }
    st.running = true;
    const variant = specs[0].settings.build || 'lite';
    const seq = sequence ? { id: PG.uid(), n: 1 + new Set(st.trials.filter(t => t.seq).map(t => t.seq.id)).size } : null;
    const label = sequence ? `session of ${specs.length} trials` : specs.length > 1 ? `${specs.length} trials` : 'trial';
    PG.bus.emit('run-state', { running: true, frac: 0, text: `Running ${label} on the ${variant === 'lite' ? 'shipped' : variant} build…` });
    const t0 = performance.now(), made = [];
    try {
      const res = await PG.Engine.run({ variant, sequence, clearAbsent,
        trials: specs.map(s => ({ input: st.inputs.get(s.inputId).x, settings: s.settings })),
        onProgress: (i, f) => PG.bus.emit('run-state', { running: true, frac: (i + f) / specs.length }),
        onResult: (i, r) => { made.push(addTrial(specs[i], r, { kept, seq: seq && { ...seq, index: i }, sweep })); PG.bus.emit('run-state', { running: true, text: `Running ${label}: ${made.length} of ${specs.length} done…` }); },
        onError: (i, m) => { PG.toast(`Trial ${i + 1} failed: ${m}`, 'error'); },
      });
      const ms = performance.now() - t0, last = made[made.length - 1];
      PG.bus.emit('run-state', { running: false, text: last ? `${last.name}: ${last.summary}. ${ms < 1000 ? ms.toFixed(0) + ' ms' : (ms / 1000).toFixed(1) + ' s'}${res.errors.length ? `, ${res.errors.length} failed` : ''}.` : 'No result.' });
    } catch (e) {
      PG.bus.emit('run-state', { running: false, text: e.cancelled ? 'Stopped.' : '' });
      if (!e.cancelled) PG.toast(e.message, 'error');
      if (e.hang) for (let i = made.length; i < specs.length; i++) addFailed(specs[i], e.message, seq && { ...seq, index: i });
    } finally {
      st.running = false;
      if (!noCompare && (made.length > 1 || sequence)) { made.forEach(t => st.selected.add(t.id)); if (sequence) PG.Compare.setLayout('timeline'); PG.bus.emit('trials'); PG.bus.emit('view', 'compare'); }
      if (pending) { pending = false; schedule(); }
    }
    return made;
  }
  PG.runSpecs = runSpecs;
  function addTrial(spec, r, { kept, seq, sweep }) {
    // an automatic run replaces the previous draft
    if (!kept) { const i = st.trials.findIndex(t => !t.kept && !t.seq); if (i >= 0) { st.selected.delete(st.trials[i].id); st.trials.splice(i, 1); } }
    const inp = st.inputs.get(spec.inputId);
    const t = { id: PG.uid(), name: spec.name || nextName(sweep ? `(${sweep})` : ''), created: Date.now(), kept, tags: sweep ? ['sweep'] : spec.sched ? ['schedule', spec.sched.phase] : [], notes: '', sched: spec.sched || null, inputId: spec.inputId, inputLen: inp.x.length,
      settings: spec.settings, summary: S.summarize(spec.settings), variant: spec.settings.build || 'lite', seq, result: r };
    st.trials.push(t); st.currentId = t.id;
    if (kept) PG.Store.saveTrial(t);
    PG.bus.emit('trials'); PG.bus.emit('current');
    return t;
  }
  function addFailed(spec, msg, seq) {
    const t = { id: PG.uid(), name: nextName('(hung)'), created: Date.now(), kept: false, tags: [], notes: msg, inputId: spec.inputId, inputLen: st.inputs.get(spec.inputId).x.length,
      settings: spec.settings, summary: S.summarize(spec.settings), variant: spec.settings.build, seq, result: null, error: msg, hang: true };
    st.trials.push(t); PG.bus.emit('trials');
  }

  // sweep: one control across several values, each a fresh trial
  PG.bus.on('sweep', ({ control, values }) => {
    if (!st.input) return PG.toast('Choose an input first.');
    const specs = values.map(v => { const s = S.clone(st.settings); if (control.param) s.listen[control.param] = v; else S.setPath(s, control.path, v);
      if (control.card) S.setPath(s, control.card.on, true); return { inputId: st.input.id, settings: s, sweepLabel: `${control.label} ${v}` }; });
    st.selected.clear();
    runSweep(specs);
  });
  async function runSweep(specs) {
    const made = [];
    for (const s of specs) { const m = await runSpecs([s], { kept: true, sweep: s.sweepLabel }); if (!m) break; made.push(...m); }
    st.selected.clear(); made.forEach(t => st.selected.add(t.id)); PG.Compare.setLayout('grid'); PG.bus.emit('trials'); PG.bus.emit('view', 'compare');
  }
  // same-session sequence of the ticked trials (their inputs and settings, in list order)
  PG.bus.on('run-sequence', ids => {
    const T = st.trials.filter(t => ids.includes(t.id)).sort((a, b) => a.created - b.created);
    const variants = new Set(T.map(t => t.settings.build || 'lite'));
    if (variants.size > 1) return PG.toast('The ticked trials use different Audapter builds; a session runs on one build.', 'error');
    const fr = new Set(T.map(t => { const m = S.compile(t.settings).meta; return m.frameLen + '/' + m.nDelay; }));
    const ws = PG.S.warnings(T[0].settings, S.compile(T[T.length - 1].settings), { sequence: true, frameChange: fr.size > 1 }).filter(w => w.where === 'run' || w.id === 'OST-F1' || w.id === 'OST-F2');
    for (const w of ws) if (w.level !== 'info') PG.toast(`${w.id ? w.id + ': ' : ''}${w.text}`, 'error');
    const loads = T.map(t => S.compile(t.settings).ost !== null);
    if (loads.some((l, i) => l && loads.slice(i + 1).some(x => !x))) PG.toast('COORD-1: an earlier trial in this session loads an OST/PCF and a later one does not; the later trial keeps the earlier OST/PCF, as in MATLAB.', 'error');
    st.selected.clear();
    runSpecs(T.map(t => ({ inputId: t.inputId, settings: S.clone(t.settings), name: `${t.name} in session` })), { kept: true, sequence: true });
  });

  // ---------------- vowel variability: resolve the field centre (median of the input, or of the ticked trials)
  const med = a => PG.median(Array.from(a).filter(v => v > 0));
  async function resolveCentre() {
    const F = st.settings.shift.formant; if (!F.on || F.field !== 'variability') return;
    let c = null;
    if (F.vari.centre === 'auto' && st.input) {
      try { const d = await PG.Engine.dryRun(st.input, st.settings); c = [med(d.fmts[0]), med(d.fmts[1])]; } catch { return; }
    } else if (F.vari.centre === 'trials') {
      const T = st.trials.filter(t => st.selected.has(t.id) && t.result);
      if (!T.length) return;
      c = [PG.median(T.map(t => med(t.result.fmts[0]))), PG.median(T.map(t => med(t.result.fmts[1])))];
    }
    if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return;
    const v = st.settings.shift.formant.vari;
    if (Math.abs(v.c1 - c[0]) > 0.5 || Math.abs(v.c2 - c[1]) > 0.5) PG.editSettings(x => { x.shift.formant.vari.c1 = Math.round(c[0] * 10) / 10; x.shift.formant.vari.c2 = Math.round(c[1] * 10) / 10; }, 'centre');
  }
  PG.bus.on('settings', why => { if (why !== 'centre') resolveCentre(); });
  PG.bus.on('input', () => resolveCentre());
  PG.bus.on('selection', () => { if (st.settings.shift.formant.vari.centre === 'trials') resolveCentre(); });
  PG.resolveCentre = resolveCentre;

  // ---------------- synthetic vowel cloud: N tokens with random F1/F2 around a vowel, optional unshifted baseline pass
  PG.bus.on('cloud', async o => {
    const R = PG.DSP.rng(o.seed || (Date.now() & 0xffff)), g = () => { const u = Math.max(R(), 1e-9), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const n = new Set(st.trials.filter(t => t.cloud).map(t => t.cloud)).size + 1, ids = [];
    for (let k = 0; k < o.n; k++) {
      const f1 = o.f1 + o.sd1 * g(), f2 = o.f2 + o.sd2 * g();
      const x = PG.DSP.synthVowel({ dur: o.dur, onset: 0.1, offset: o.dur - 0.1, f0: o.f0 * Math.pow(2, 0.03 * g()), formants: [f1, f2, o.f3, o.f3 + 900], level: -20, seed: k + 1 });
      const inp = { id: PG.uid(), kind: 'synth', label: `Cloud ${n} token ${k + 1} (F1 ${Math.round(f1)}, F2 ${Math.round(f2)} Hz synthesised)`, x, meta: { synth: { f1, f2 } } };
      st.inputs.set(inp.id, inp); ids.push(inp.id);
    }
    const tag = (arr, phase) => arr.forEach(t => { t.cloud = n; t.tags = [...(t.tags || []), 'cloud ' + n, phase]; PG.Store.saveTrial(t); });
    if (o.baseline) {
      const base = S.clone(st.settings); base.shift.formant.on = false; base.when.mode = 'always';
      const made = await runSpecs(ids.map((id, k) => ({ inputId: id, settings: S.clone(base), name: `C${n} baseline ${k + 1}` })), { kept: true, noCompare: true });
      if (!made) return;
      tag(made, 'baseline');
      const c = [PG.median(made.map(t => med(t.result.fmts[0]))), PG.median(made.map(t => med(t.result.fmts[1])))];
      PG.editSettings(x => { const v = x.shift.formant.vari; v.c1 = Math.round(c[0] * 10) / 10; v.c2 = Math.round(c[1] * 10) / 10; v.centre = 'manual'; }, 'noauto');
      PG.toast(`Vowel centre set from the baseline tokens: F1 ${Math.round(c[0])}, F2 ${Math.round(c[1])} Hz.`);
    }
    const made = await runSpecs(ids.map((id, k) => ({ inputId: id, settings: S.clone(st.settings), name: `C${n} token ${k + 1}` })), { kept: true, noCompare: true });
    if (!made) return;
    tag(made, 'shifted');
    st.selected.clear(); made.forEach(t => st.selected.add(t.id));
    PG.Vowel.setMode('tokens'); PG.bus.emit('trials'); PG.bus.emit('view', 'vowel');
  });

  // ---------------- warnings (settings + input context)
  function updateWarnings() {
    const s = st.settings, c = S.compile(s);
    const ctx = { f0: st.input && st.input.f0med, dur: st.input ? st.input.x.length / 48000 : 0, recorderSec: recSec(s.build) };
    PG.bus.emit('warnings', S.warnings(s, c, ctx));
  }
  function analyseInput(inp) {
    if (!inp || inp.f0med !== undefined) return;
    setTimeout(() => {
      const x = inp.x, n = Math.floor(x.length / 3), y = new Float64Array(n);
      for (let i = 0; i < n; i++) y[i] = (x[3 * i] + x[3 * i + 1] + x[3 * i + 2]) / 3;
      inp.f0med = PG.median(PG.DSP.yin(y, 16000, { hop: 0.01 }).f0) || null;
      if (inp === st.input) updateWarnings();
    }, 30);
  }

  // ---------------- views
  function viewTabs() {
    const tabs = [['pair', 'Expected vs observed'], ['spectro', 'Spectrograms'], ['pitch', 'Pitch and level'], ['vowel', 'Vowel space'], ['compare', 'Compare']];
    const bar = $('#viewtabs');
    for (const [k, t] of tabs) bar.append(h('button', { type: 'button', role: 'tab', id: 'vt-' + k, 'aria-selected': String(k === st.view), text: t, on: { click: () => PG.bus.emit('view', k) } }));
    const zoom = h('div.zoom', { role: 'group', 'aria-label': 'Time zoom' },
      h('button.icon', { type: 'button', 'aria-label': 'Zoom in', text: '+', on: { click: () => PG.Tiers.zoomBy(0.5) } }),
      h('button.icon', { type: 'button', 'aria-label': 'Zoom out', text: '−', on: { click: () => PG.Tiers.zoomBy(2) } }),
      h('button.icon.wide', { type: 'button', text: 'Fit', on: { click: () => PG.Tiers.fit() } }));
    bar.append(zoom);
    PG.bus.on('view', k => { st.view = k; for (const [x] of tabs) $('#vt-' + x).setAttribute('aria-selected', String(x === k)); showView(); });
    PG.bus.on('current', () => { $('#vt-pair').hidden = !PG.Cases.pairFor(PG.current()); showView(); });
    $('#vt-pair').hidden = true;
    PG.bus.on('show-trial', id => { st.currentId = id; PG.bus.emit('current'); if (st.view === 'compare') PG.bus.emit('view', 'spectro'); });
    PG.bus.on('selection', () => { if (st.view === 'compare') showView(); });
  }
  function showView() {
    if (st.view === 'pair' && !PG.Cases.pairFor(PG.current())) { st.view = 'spectro'; $('#vt-pair').setAttribute('aria-selected', 'false'); $('#vt-spectro').setAttribute('aria-selected', 'true'); }
    const k = st.view, t = PG.current();
    for (const v of ['tiers', 'vowel', 'compare']) $('#v-' + v).hidden = !((v === 'tiers' && (k === 'spectro' || k === 'pitch' || k === 'pair')) || v === k);
    $('.zoom').hidden = k === 'vowel';
    if (stack) { stack.destroy(); stack = null; }
    const holder = $('#v-tiers'); PG.clear(holder);
    const nums = $('#numbers'); PG.clear(nums);
    PG.Transport.render();
    if (k === 'compare') { PG.Compare.render(); return; }
    if (!t || !t.result) {
      const msg = t && t.error ? `This trial did not finish: ${t.error}` : 'Choose an input. The current settings then run automatically, and the result appears here.';
      if (k === 'vowel') PG.Vowel.setTrial(null);
      holder.append(h('p.empty', { text: msg }));
      return;
    }
    if (k === 'vowel') { PG.Vowel.setTrial(t); }
    else if (k === 'pair') { stack = PG.Cases.renderPair(holder); }
    else {
      PG.Tiers.setDuration(t.inputLen / 48000, true);
      holder.append(h('div.trial-title', {}, h('b', { text: t.name }), h('span', { text: ' ' + t.summary }), t.kept ? null : h('span.badge.draft', { text: 'draft' }),
        h('span.muted', { text: `  ${(st.inputs.get(t.inputId) || {}).label || ''}` })));
      stack = PG.Tiers.Stack(holder, { tiers: PG.Views.tiersFor(t, k) });
      holder.append(h('p.hint', { text: 'Hover for values. Click to set where playback starts; drag to pan; ctrl + wheel or the + / − buttons to zoom; double-click to fit.' }));
    }
    nums.append(h('details', {}, h('summary', { text: 'Numbers behind this view' }),
      h('table.plain', {}, h('tbody', {}, PG.Views.numbers(t).map(([a, b]) => h('tr', {}, h('th', { text: a }), h('td', { text: b }))))),
      h('div.btnrow', {},
        h('button.linkish', { type: 'button', text: 'Download output WAV', on: { click: () => PG.Store.download(new Blob([PG.DSP.encodeWav(t.result.output, 48000, { float: true })], { type: 'audio/wav' }), `${t.name}-output.wav`) } }),
        h('button.linkish', { type: 'button', text: 'Download data (JSON)', on: { click: () => PG.Store.download(PG.Store.exportSession([t]), `${t.name}.zip`) } }))));
  }

  // ---------------- session persistence
  PG.bus.on('export-session', () => { const T = st.trials.filter(t => t.result && (t.kept || st.selected.has(t.id))); PG.Store.download(PG.Store.exportSession(T), `audapter-playground-session-${new Date().toISOString().slice(0, 10)}.zip`); });
  PG.bus.on('import-session', async u8 => {
    try {
      const { inputs, trials } = await PG.Store.importSession(u8);
      for (const [k, v] of inputs) st.inputs.set(k, v);
      await attachAnalysis(trials);
      for (const t of trials) { t.inputLen = st.inputs.get(t.inputId).x.length; st.trials.push(t); PG.Store.saveTrial(t); }
      counter += trials.length;
      if (trials.length) st.currentId = trials[trials.length - 1].id;
      PG.bus.emit('trials'); PG.bus.emit('current'); PG.toast(`Imported ${trials.length} trials.`);
    } catch (e) { PG.toast('Import failed: ' + e.message, 'error'); }
  });
  async function attachAnalysis(trials) {
    const need = trials.filter(t => t.result && !t.result.analysis);
    if (!need.length) return;
    const an = await PG.Engine.analyse(need.map(t => ({ input: st.inputs.get(t.inputId).x, result: t.result })));
    need.forEach((t, i) => { t.result.analysis = an[i]; });
  }
  async function restore() {
    const hashS = PG.Store.settingsFromHash();
    const saved = await PG.Store.load();
    for (const i of saved.inputs) st.inputs.set(i.id, i);
    const T = saved.trials.filter(t => st.inputs.has(t.inputId));
    for (const t of T) { t.inputLen = st.inputs.get(t.inputId).x.length; st.trials.push(t); }
    counter = T.reduce((m, t) => Math.max(m, +(/^T(\d+)/.exec(t.name) || [0, 0])[1]), 0);
    if (hashS) PG.setSettings(hashS, 'load'); else if (saved.settings) PG.setSettings(saved.settings, 'load');
    if (T.length) { st.currentId = T[T.length - 1].id; const inp = st.inputs.get(T[T.length - 1].inputId); st.input = inp; PG.bus.emit('input-quiet', inp); }
    PG.bus.emit('trials'); PG.bus.emit('current');
    return T.length;
  }

  // keyboard: space play/stop, x switch A/B, o original, p processed
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#panel-explore') || $('#panel-explore').hidden) return;
    if (e.key === ' ') { e.preventDefault(); PG.Audio.playing() ? PG.Audio.stop() : PG.Transport.play('out'); }
    else if (e.key === 'x' || e.key === 'X') PG.Transport.toggle();
    else if (e.key === 'o') PG.Transport.play('in');
    else if (e.key === 'p') PG.Transport.play('out');
  });

  // ---------------- start
  async function start() {
    PG.theme.init();
    layout();
    const had = await restore();
    PG.bus.on('input-quiet', () => {});
    PG.InputUI.render();
    updateWarnings();
    PG.Engine.prewarm(st.settings.build);
    if (!had && !st.input) {
      const first = PG.CLIPS.find(c => c.id === 'arctic_slt_a0030') || PG.CLIPS[0];
      if (first) PG.InputUI.loadClip(first.id).catch(e => PG.toast(e.message, 'error'));
    }
    showView();
    if (/[#&]case=/.test(location.hash)) setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 50);
  }

  // Test hooks (used by audit/playground/test/run.mjs); harmless in normal use.
  self.PG_TEST = {
    runAndWait: async (kept = true) => { const m = await runSpecs([{ inputId: st.input.id, settings: S.clone(st.settings) }], { kept }); return m && m[0] && m[0].id; },
    idle: () => !PG.Engine.busy() && !st.running,
    trial: id => { const t = PG.trial(id); if (!t) return null; const r = t.result, inp = st.inputs.get(t.inputId);
      return { name: t.name, settings: t.settings, compiled: S.compile(t.settings).list.map(([k, v]) => [k, Array.isArray(v) ? Array.from(v) : v]), ost: S.compile(t.settings).ost, pcf: S.compile(t.settings).pcf,
        input: Array.from(inp.x), output: Array.from(r.output), fmts: r.fmts.map(a => Array.from(a)), sfmts: r.sfmts.map(a => Array.from(a)), ost_stat: Array.from(r.ost_stat), info: r.info }; },
    stats: () => PG.Engine.stats,
    // test-case workspace state: selected trials, the settings panel vs the case's own parameters, and the drawn views
    caseState: () => {
      const c = PG.Cases.current(), t = PG.current(); if (!c || !t) return null;
      const w = PG.Cases.work(), v = w.variants.find(x => x.name === (t.caseRef && t.caseRef.base));
      const map = PG.S.compile(PG.state.settings).map, P = t.caseRef && v ? PG.Cases.paramsAt(v, t.caseRef.trial).P : new Map();
      const first = x => (Array.isArray(x) ? x[0] : x);
      const spot = c.spot.map(n => ({ name: n, settings: first(map.get(n)), case: P.get(n) && P.get(n).value ? P.get(n).value[0] : undefined }));
      const cv = [...document.querySelectorAll('#v-tiers canvas.tier-c')];
      const rgb = name => { const hex = PG.css(name).replace('#', ''); return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)); };
      const count = (el, col, tol = 40) => { if (!el) return -1; const d = el.getContext('2d').getImageData(0, 0, el.width, el.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - col[0]) < tol && Math.abs(d[i + 1] - col[1]) < tol && Math.abs(d[i + 2] - col[2]) < tol) n++; return n; };
      const labs = [...document.querySelectorAll('#v-tiers .tl-name')].map(e => e.textContent);
      const at = l => cv[labs.indexOf(l)], blue = rgb('--observed'), orange = rgb('--disc');
      const P2 = PG.Cases.pairFor(t);
      const rows = [...document.querySelectorAll('#trials li.case-row[data-group="case"]')];
      return { current: t.name, caseRef: t.caseRef, selected: PG.state.trials.filter(q => PG.state.selected.has(q.id)).map(q => q.name), view: PG.state.view,
        tierLabels: labs, stacks: document.querySelectorAll('#v-tiers .tiers').length,
        bluePixelsExpected: count(at((P2 ? P2.eLab : 'Expected') + ' · heard'), blue), bluePixelsObserved: count(at((P2 ? P2.oLab : 'Observed') + ' · heard'), blue),
        orangePixelsObserved: count(at((P2 ? P2.oLab : 'Observed') + ' · heard'), orange, 30), callout: ($('#pair-callout') || {}).textContent || '',
        playButtons: ['#pair-play-exp', '#pair-play-obs', '#pair-ab'].filter(q => $(q)).length,
        diffBands: P2 ? PG.Cases.diffOf(P2.e, P2.o).bands.length : -1,
        pair: P2 ? { e: P2.e.name, o: P2.o.name, eBuild: P2.e.variant, oBuild: P2.o.variant } : null,
        rows: rows.length, toggles: rows.filter(r => r.querySelectorAll('.case-tog button').length === 2).length,
        caseTrials: PG.state.trials.filter(q => q.caseRef && q.caseRef.group === 'case').length,
        expectedMeans: ($('#case-expected-means') || {}).textContent || '',
        forks: PG.Cases.forks().map(f => ({ name: f.name, n: f.results.filter(Boolean).length, seqIds: [...new Set(f.results.filter(Boolean).map(q => q.seq && q.seq.id))].length, key: f.key })),
        spot, set: c.set, sets: c.sets.map(x => x.id), banner: !document.getElementById('case-banner').hidden, whenMode: PG.state.settings.when.mode };
    },
    // design check: predicted (OST replay on the dry run) vs logged on-frames for the current trial
    designCheck: id => {
      const t = PG.trial(id), r = t.result, P = new Set(r.compiled.meta.perturbStates);
      const pred = PG.DesignUI.predict(); if (!pred) return null;
      const n = Math.min(pred.states.length, r.ost_stat.length);
      let stateMis = 0, predOn = 0, logOn = 0, onMis = 0, shiftOutside = 0, shiftIn = 0, trackedIn = 0;
      for (let i = 0; i < n; i++) {
        const a = P.has(pred.states[i]), b = P.has(r.ost_stat[i]);
        if (pred.states[i] !== r.ost_stat[i]) stateMis++; if (a) predOn++; if (b) logOn++; if (a !== b) onMis++;
        const sh = r.sfmts[0][i] > 0 && (Math.abs(r.sfmts[0][i] - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5);
        if (sh && !a) shiftOutside++; if (sh && a) shiftIn++; if (a && r.fmts[0][i] > 0) trackedIn++;
      }
      const spans = pred.spans.map(sp => sp.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
      return { n, stateMis, predOn, logOn, onMis, shiftOutside, shiftIn, trackedIn, spans, frameDur: r.compiled.meta.frameLen / r.compiled.meta.sr };
    },
    setAutoRun: on => { st.autoRun = on; const c = $('#auto-run'); if (c) c.checked = on; },
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();

// ---------------- transport: original / processed / A/B, loop, level match, loud-output warning
PG.Transport = (() => {
  const { h } = PG;
  let root, loop = false, match = false, pair = null;
  const LIMIT = 0.89;   // -1 dBFS
  function mount(el) { root = el; render(); PG.bus.on('play', () => sync()); PG.bus.on('current', render); }
  function gains(tracks) {
    const g = tracks.map(() => 1), notes = [];
    if (match && tracks.length) { const ref = PG.DSP.activeRms(tracks[0].x) || 1; tracks.forEach((t, i) => { const a = PG.DSP.activeRms(t.x); if (a) g[i] = ref / a; }); }
    tracks.forEach((t, i) => { const pk = PG.DSP.peak(t.x) * g[i]; if (pk > LIMIT) { g[i] *= LIMIT / pk; notes.push(`${t.label} turned down ${(20 * Math.log10(pk / LIMIT)).toFixed(1)} dB to stay below −1 dBFS`); } });
    return { g, notes };
  }
  function range() { const z = PG.Tiers.zoom, c = PG.Tiers.cursor(); const from = c !== null && c >= z.t0 && c < z.t1 ? c : z.t0; return { from, to: z.t1 < z.dur - 1e-6 || loop ? z.t1 : null }; }
  function start(tracks, which = 0) {
    const { g, notes } = gains(tracks);
    tracks.forEach((t, i) => { t.gain = g[i]; });
    const r = range();
    PG.Audio.play(tracks, { which, loop, from: r.from, to: r.to });
    const n = root && root.querySelector('.tp-note');
    if (n) n.textContent = [match && tracks.length > 1 ? `Level-matched: ${tracks.slice(1).map((t, i) => `${t.label} ${PG.fmt.db(20 * Math.log10(g[i + 1] / g[0]))}`).join(', ')} relative to ${tracks[0].label}` : '', ...notes].filter(Boolean).join('. ');
  }
  function current() { const t = PG.current(); return t && t.result ? t : null; }
  function play(kind) {
    const t = current(); if (!t) return;
    const inp = PG.state.inputs.get(t.inputId).x, tr = [{ x: inp, label: 'original' }, { x: t.result.output, label: 'processed' }];
    pair = null;
    start(tr, kind === 'in' ? 0 : 1);
  }
  function playTracks(tracks) { pair = null; start(tracks.map(t => ({ ...t })), 0); }
  function playPair(a, b) {
    pair = [a, b];
    start([{ x: a.x, label: 'A' }, { x: b.x, label: 'B' }], 0);
  }
  function toggle() { const p = PG.Audio.playing(); if (p) p.toggle(); }
  function sync() {
    if (!root) return;
    const p = PG.Audio.playing();
    root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(!!p && ((b.dataset.k === 'in' && !pair && p.which === 0) || (b.dataset.k === 'out' && !pair && p.which === 1)))));
    const sw = root.querySelector('.tp-switch'); if (sw) { sw.disabled = !p; sw.textContent = p ? (pair ? `Now: ${p.which ? 'B' : 'A'}. Switch (X)` : `Now: ${p.which ? 'processed' : 'original'}. Switch (X)`) : 'Switch (X)'; }
  }
  function render() {
    if (!root) return;
    PG.clear(root);
    const t = current(), A = t && t.result.analysis;
    const warn = [];
    if (A && A.outPeak >= 0.999) warn.push(`The output clips (peak ${A.outPeak.toFixed(2)}).`);
    if (A && A.burstDb > 20) warn.push(`Loud burst: a 20 ms stretch is ${A.burstDb.toFixed(0)} dB above the average level.`);
    root.append(
      h('button.btn', { type: 'button', 'data-k': 'in', text: 'Play original', disabled: !t, on: { click: () => play('in') } }),
      h('button.btn.primary', { type: 'button', 'data-k': 'out', text: 'Play processed', disabled: !t, on: { click: () => play('out') } }),
      h('button.btn.tp-switch', { type: 'button', text: 'Switch (X)', disabled: true, on: { click: toggle } }),
      h('button.btn', { type: 'button', text: 'Stop', on: { click: () => PG.Audio.stop() } }),
      h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: loop, on: { change: e => { loop = e.target.checked; } } }), ' Loop'),
      h('label.tp-opt', { title: 'Scale playback so both have the same average level (active RMS). Off plays true levels.' }, h('input', { type: 'checkbox', checked: match, on: { change: e => { match = e.target.checked; } } }), ' Level-match'),
      warn.length ? h('div.warn.w-warn.tp-loud', {}, h('span.w-glyph'), h('span.w-lvl', { text: 'Loud' }), h('span.w-text', { text: warn.join(' ') + ' Playback is capped at −1 dBFS peak.' })) : '',
      h('p.tp-note.muted', { 'aria-live': 'polite' }));
    sync();
  }
  return { mount, render, play, playPair, playTracks, toggle };
})();
