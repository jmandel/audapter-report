'use strict';
// Compare: small multiples of several trials on shared axes, the settings that differ, A/B listening,
// and a session timeline that lays trials end to end (never as rows that look simultaneous).
PG.Compare = (() => {
  const { h, S } = PG;
  let root, metric = 'formants', layout = 'grid', stacks = [];

  function mount(el) { root = el; }
  function trials() {
    const sel = PG.state.trials.filter(t => PG.state.selected.has(t.id) && t.result);
    if (sel.length >= 2) return sel;
    return PG.state.trials.filter(t => t.result).slice(-4);
  }
  const labelFor = path => {
    const c = PG.controlByPath(path);
    if (c && c.label) { const un = c.range ? (typeof c.range === 'function' ? c.range(PG.state.settings) : c.range)[3] : ''; return { label: c.label, unit: un || '' }; }
    return { label: path.replace(/^shift\./, '').replace(/\./g, ' '), unit: '' };
  };
  const show = v => (v === true ? 'on' : v === false ? 'off' : v === undefined || v === '' ? '–' : String(v));

  function render() {
    if (!root) return;
    for (const s of stacks) s.destroy(); stacks = [];
    PG.clear(root);
    const T = trials();
    const selNote = PG.state.selected.size >= 2 ? `${T.length} ticked trials` : `the ${T.length} most recent trials (tick trials in the list to choose)`;
    const seg = (opts, cur, set, lab) => h('div.seg', { role: 'radiogroup', 'aria-label': lab }, opts.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === cur), text: t, on: { click: () => { set(v); render(); } } })));
    root.append(h('div.cmp-head', {},
      h('p.muted', { text: `Comparing ${selNote}.` }),
      seg([...(PG.Cases.current() ? [['case', `Test case ${PG.Cases.current().id}`]] : []), ['grid', 'Side by side'], ['timeline', 'Session timeline']], layout, v => { layout = v; }, 'Layout'),
      layout === 'grid' ? seg([['formants', 'Formants'], ['pitch', 'Pitch'], ['level', 'Level'], ['ost', 'OST state']], metric, v => { metric = v; }, 'Show') : null));
    if (T.length < 2) { root.append(h('p.empty', { text: 'Run at least two trials to compare them. Try "Sweep" next to any setting: it runs several values at once.' })); return; }
    if (layout === 'case' && PG.Cases.current()) {   // the case's session timeline and card-vs-replay numbers, then the ticked trials side by side
      stacks.push(...PG.Cases.renderSummary(root));
      root.append(abPanel(T), diffTable(T)); grid(T); return;
    }
    if (layout === 'case') layout = 'grid';
    root.append(abPanel(T), diffTable(T));
    if (layout === 'timeline') timeline(T); else grid(T);
  }

  function abPanel(T) {
    const opts = [];
    for (const t of T) { opts.push([`${t.id}:out`, `${t.name}, processed`]); opts.push([`${t.id}:in`, `${t.name}, original`]); }
    const a = h('select', { 'aria-label': 'A' }, opts.map(([v, l], i) => h('option', { value: v, text: l, selected: i === 0 })));
    const b = h('select', { 'aria-label': 'B' }, opts.map(([v, l], i) => h('option', { value: v, text: l, selected: i === 2 })));
    const get = v => { const [id, k] = v.split(':'), t = PG.trial(id); return { x: k === 'in' ? PG.state.inputs.get(t.inputId).x : t.result.output, trial: t, kind: k }; };
    return h('div.ab', {}, h('span.ab-lab', { text: 'Listen' }), h('label', {}, 'A ', a), h('label', {}, 'B ', b),
      h('button.btn.primary', { type: 'button', text: 'Play A/B', on: { click: () => PG.Transport.playPair(get(a.value), get(b.value)) } }),
      h('span.muted', { text: 'While it plays, press X (or the switch button) to swap between A and B without a gap.' }));
  }

  function diffTable(T) {
    const base = T[0], rows = new Map();
    for (const t of T.slice(1)) for (const d of S.diff(base.settings, t.settings)) rows.set(d.path, true);
    const paths = [...rows.keys()];
    const inputsDiffer = new Set(T.map(t => t.inputId)).size > 1, buildsDiffer = new Set(T.map(t => t.variant)).size > 1;
    const flat = T.map(t => S.flatten(S.effective(t.settings)));
    const tb = h('tbody');
    if (inputsDiffer) tb.append(h('tr', {}, h('th', { text: 'Input' }), T.map(t => h('td', { text: (PG.state.inputs.get(t.inputId) || {}).label || '–' }))));
    for (const p of paths) { const { label, unit } = labelFor(p); tb.append(h('tr', {}, h('th', {}, label, unit ? h('span.muted', { text: ` (${unit})` }) : null), flat.map(f => h('td', { text: show(f[p]) })))); }
    if (!paths.length && !inputsDiffer) tb.append(h('tr', {}, h('td', { colSpan: T.length + 1, text: buildsDiffer ? 'Same settings; different Audapter builds.' : 'These trials have identical settings.' })));
    return h('details.diff', { open: true }, h('summary', { text: `Settings that differ (${paths.length + (inputsDiffer ? 1 : 0)})` }),
      h('div.tscroll', {}, h('table.plain.diff-t', {}, h('thead', {}, h('tr', {}, h('th', { text: '' }), T.map(t => h('th', { text: t.name })))), tb)));
  }

  function tierFor(t, fmaxOrNull) {
    const V = PG.Views;
    if (metric === 'pitch') return V.pitchTier(t);
    if (metric === 'level') return V.levelTier(t);
    if (metric === 'ost') { const d = V.derive(t); return d.hasOst ? V.ostTier(t) : V.shiftTier(t); }
    const tr = V.specTier(t, 'out', 4000); tr.height = 130; return tr;
  }
  function grid(T) {
    const dur = Math.max(...T.map(t => t.inputLen / 48000));
    PG.Tiers.setDuration(dur, true);
    const g = h('div.smult');
    root.append(g);
    const base = T[0];
    for (const t of T) {
      const diffs = t === base ? [] : S.diff(base.settings, t.settings).map(d => `${labelFor(d.path).label} ${show(d.b)}`);
      const cell = h('figure.sm', {}, h('figcaption', {}, h('b', { text: t.name }), h('span.muted', { text: ' ' + (t === base || (t.tags || []).includes('sweep') ? t.summary : (diffs.join(', ') || t.summary)) })));
      g.append(cell);
      const tr = tierFor(t); tr.label = ''; tr.height = Math.min(tr.height, 130);
      stacks.push(PG.Tiers.Stack(cell, { tiers: [tr], compact: true, axis: true }));
      cell.addEventListener('dblclick', () => PG.bus.emit('show-trial', t.id));
    }
    root.append(h('p.muted', { text: 'Panels share one time axis and one scale. Double-click a panel to open that trial.' }));
  }

  // Trials end to end on one time axis. For a same-session sequence this is what Audapter experienced in order.
  function timeline(T) {
    const offs = [], sr = 48000; let o = 0;
    for (const t of T) { offs.push(o); o += t.inputLen / sr; }
    const seqIds = new Set(T.map(t => t.seq && t.seq.id)), oneSeq = seqIds.size === 1 && !seqIds.has(undefined) && !seqIds.has(null);
    root.append(h('p.timeline-note', { text: oneSeq ? 'These trials ran in order in one Audapter session: anything that carries over (OST state, PCF, playback position) carries over here.'
      : 'These trials ran independently (a fresh Audapter for each). They are placed end to end for reading, not because they ran together.' }));
    PG.Tiers.setDuration(o, false);
    const C = PG.Tiers;
    const trialTier = { label: 'Trial', sub: oneSeq ? 'one session' : 'independent runs', height: 28,
      draw(g, w, hgt, xOf, Cc) { C.drawIntervals(g, T.map((t, i) => ({ a: offs[i], b: offs[i] + t.inputLen / sr, label: t.name, kind: i % 2 ? 'ctx' : 'exp' })), xOf, w, hgt, Cc); } };
    const concat = (get, dtOf) => ({ get, dtOf });
    const ostTier = { label: 'OST state', sub: 'ost_stat', height: 30,
      draw(g, w, hgt, xOf, Cc) {
        const items = [];
        T.forEach((t, i) => { const r = t.result; for (const x of C.runs(r.ost_stat, 1 / r.frameRate, () => true, v => String(v))) items.push({ a: x.a + offs[i], b: x.b + offs[i], label: x.label, kind: x.label === '0' ? 'ctx' : 'obs' }); });
        C.drawIntervals(g, items, xOf, w, hgt, Cc);
      } };
    const shiftTier = { label: 'Formant shift on', sub: 'sfmts ≠ fmts', height: 26,
      draw(g, w, hgt, xOf, Cc) {
        const items = [];
        T.forEach((t, i) => { const r = t.result; for (const x of C.runs(r.sfmts[0], 1 / r.frameRate, (v, k) => v > 0 && (Math.abs(v - r.fmts[0][k]) > 0.5 || Math.abs(r.sfmts[1][k] - r.fmts[1][k]) > 0.5))) items.push({ a: x.a + offs[i], b: x.b + offs[i], kind: 'obs', label: 'shifted' }); });
        C.drawIntervals(g, items, xOf, w, hgt, Cc);
      } };
    const levelTier = { label: 'Level', sub: 'input grey, output blue', height: 90,
      draw(g, w, hgt, xOf, Cc) {
        const lo = -75, yOf = v => hgt - 3 - (v - lo) / -lo * (hgt - 6), ok = v => Number.isFinite(v) && v > lo - 5;
        C.gridY(g, w, yOf, [-60, -40, -20], Cc, v => v + ' dB');
        T.forEach((t, i) => { const A = t.result.analysis;
          C.drawSeries(g, { y: A.levIn.db, dt: A.levIn.hop, tOff: offs[i], style: 'input', ok, lw: 2 }, xOf, yOf, Cc, w);
          C.drawSeries(g, { y: A.levOut.db, dt: A.levOut.hop, tOff: offs[i], style: 'observed', ok }, xOf, yOf, Cc, w); });
        g.strokeStyle = Cc.ink; g.lineWidth = 1; for (const x0 of offs.slice(1)) { const x = Math.round(xOf(x0)) + 0.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hgt); g.stroke(); }
      } };
    const f1Tier = { label: 'F1', sub: 'tracked blue, target hollow', height: 110,
      draw(g, w, hgt, xOf, Cc) {
        const all = T.flatMap(t => [...t.result.fmts[0], ...t.result.sfmts[0]].filter(v => v > 0)), hi = Math.max(1000, ...all.slice(0, 20000)) * 1.05, lo = 100;
        const yOf = v => hgt - 3 - (v - lo) / (hi - lo) * (hgt - 6);
        C.gridY(g, w, yOf, [300, 600, 900].filter(v => v < hi), Cc, v => v + ' Hz');
        T.forEach((t, i) => { const r = t.result;
          C.drawSeries(g, { y: r.sfmts[0], dt: 1 / r.frameRate, tOff: offs[i], style: 'target' }, xOf, yOf, Cc, w);
          C.drawSeries(g, { y: r.fmts[0], dt: 1 / r.frameRate, tOff: offs[i], style: 'observed' }, xOf, yOf, Cc, w); });
        g.strokeStyle = Cc.ink; g.lineWidth = 1; for (const x0 of offs.slice(1)) { const x = Math.round(xOf(x0)) + 0.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hgt); g.stroke(); }
      } };
    const tiers = [trialTier, ostTier, shiftTier, f1Tier, levelTier];
    const holder = h('div'); root.append(holder);
    stacks.push(PG.Tiers.Stack(holder, { tiers }));
  }
  return { mount, render, setLayout: l => { layout = l; } };
})();
