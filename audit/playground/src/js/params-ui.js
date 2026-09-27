'use strict';
// Parameters tab: every Audapter parameter from the C++ table (name, type, help text) with validated overrides,
// and the OST/PCF editor (state diagram, rule list with plain-language descriptions, PCF table, text import/export).
PG.ParamsUI = (() => {
  const { h, S } = PG;
  const CPP = 'https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/Audapter.cpp#L';
  let root, q = '', onlyChanged = false, tableBody;

  const LEN = { pertf1: 257, pertf2: 257, pertamp: 257, pertphi: 257, pertamp2d: 66049, pertphi2d: 66049, clampf1: 2048, clampf2: 2048, rmsff_fb: 4 };
  const NOTE = {
    bpvocmpnorm: 'Registered under this misspelling but checked as "bpvocampnorm", so phase-vocoder level normalisation cannot be switched on (PT-5).',
    minvowellen: 'Has no effect in blab (the dropout fix removed its only use; F6), and cannot be changed in upstream either (REPORT-9).',
    pvocwarp: 'Set through the PCF time-warp lines instead.',
    datapb: 'Generated from the noise settings under "What the participant hears". At most 480 000 samples (10 s at 48 kHz).',
    clampf1: 'Audapter copies 2048 values whatever length is passed (FMT-F1).', clampf2: 'Audapter copies 2048 values whatever length is passed (FMT-F1).',
    pertf1: 'Audapter reads 257 values whatever length is passed (I-08).', pertamp: 'Audapter reads 257 values whatever length is passed (I-08).',
    tsgntones: 'The range check tests the old value, so 100 is accepted and overwrites neighbouring parameters (I-14).',
    rmsclipthresh: 'The RMS clip zeroes the wrong buffer slot, so it does not protect (PT-2).', brmsclip: 'The RMS clip zeroes the wrong buffer slot, so it does not protect (PT-2).',
  };
  const PLAIN = Object.fromEntries(PG.allControls().filter(c => c.param).map(c => [c.param, c.desc]));

  function parseVal(p, text) {
    const t = String(text).trim();
    if (t === '') return { v: undefined };
    let v;
    try { v = t.startsWith('[') ? JSON.parse(t) : t.includes(',') || /\s/.test(t) ? t.split(/[\s,]+/).filter(Boolean).map(Number) : Number(t); }
    catch { return { err: 'Not a number or a JSON array.' }; }
    const arr = Array.isArray(v) ? v : [v];
    if (arr.some(x => typeof x !== 'number' || !Number.isFinite(x))) return { err: 'Every value must be a finite number.' };
    const n = p.name;
    if (p.type === 'bool' && (arr.length !== 1 || (arr[0] !== 0 && arr[0] !== 1))) return { err: 'A switch takes 0 or 1.' };
    if ((p.type === 'int' || p.type === 'enum') && (arr.length !== 1 || !Number.isInteger(arr[0]))) return { err: 'Takes one whole number.' };
    if (p.type === 'double' && arr.length !== 1) return { err: 'Takes one number.' };
    if (LEN[n] && arr.length !== LEN[n]) return { err: `Needs exactly ${LEN[n]} values (got ${arr.length}). Audapter ignores the length you pass and reads ${LEN[n]}, past the end of a shorter array.` };
    if (n === 'delayframes' && (arr.length < 1 || arr.length > 4)) return { err: 'One value per voice, 1 to 4 values.' };
    if (n === 'datapb' && arr.length > 480000) return { err: 'At most 480 000 samples.' };
    if (n === 'timedomainpitchshiftschedule' && arr.length > 1) {
      if (arr.length % 2) return { err: 'Pairs of (time, ratio), or a single ratio.' };
      if (arr[0] !== 0) return { err: 'The first time must be 0.' };
      for (let i = 2; i < arr.length; i += 2) if (!(arr[i] > arr[i - 2])) return { err: 'Times must increase.' };
      for (let i = 1; i < arr.length; i += 2) if (!(arr[i] > 0)) return { err: 'Ratios must be positive.' };
    }
    if (n === 'timedomainpitchshiftalgorithm' && ![0, 1, 2].includes(arr[0])) return { err: '0, 1 or 2.' };
    if ((n === 'triallen' || n === 'ramplen') && arr[0] < 0) return { err: 'Audapter rejects negative values.' };
    if (n === 'fb' && !(arr[0] >= 0 && arr[0] <= 5)) return { err: 'Feedback modes are 0 to 5.' };
    return { v: arr.length === 1 && !/\[\]$/.test(p.type) && !LEN[n] ? arr[0] : arr };
  }
  const show = v => {
    if (v === undefined || v === null) return '–';
    if (!Array.isArray(v)) return String(+Number(v).toPrecision(8));
    if (v.length <= 8) return '[' + v.map(x => +Number(x).toPrecision(6)).join(', ') + ']';
    const mn = Math.min(...v.slice(0, 70000)), mx = Math.max(...v.slice(0, 70000));
    return `[${v.length} values${mn === mx ? `, all ${+mn.toPrecision(6)}` : `, ${+mn.toPrecision(4)} … ${+mx.toPrecision(4)}`}]`;
  };

  function mount(el) { root = el; PG.bus.on('settings', () => { if (root.isConnected && !root.closest('[hidden]')) render(); }); PG.bus.on('tab', t => { if (t === 'params') render(); }); }

  function render() {
    if (!root) return;
    const scroll = document.scrollingElement.scrollTop, focusId = document.activeElement && document.activeElement.id;
    PG.clear(root);
    root.append(ostEditor(), paramTable());
    document.scrollingElement.scrollTop = scroll;
    if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus(); if (f.setSelectionRange && f.type === 'search') f.setSelectionRange(f.value.length, f.value.length); } }
  }

  // ---------------- parameter table
  function paramTable() {
    const s = PG.state.settings, c = S.compile(s), eff = c.map;
    const presetMap = S.baseParams({ ...s, listen: {} });
    const search = h('input.filter', { type: 'search', id: 'param-search', placeholder: 'Search parameters', value: q, 'aria-label': 'Search parameters', on: { input: e => { q = e.target.value; fill(); } } });
    const chk = h('label', {}, h('input', { type: 'checkbox', checked: onlyChanged, on: { change: e => { onlyChanged = e.target.checked; fill(); } } }), ' only values that differ from the preset');
    tableBody = h('tbody');
    const wrap = h('section.grp.ptable', { 'aria-labelledby': 'pt-title' },
      h('h2.grp-title', { id: 'pt-title', text: 'All Audapter parameters' }),
      h('p.grp-blurb', { text: `The ${AUD_PARAM_TABLE.length} parameters registered in Audapter's C++ constructor, with their help text. "Sent" is what this page passes to setParam, in AudapterIO('init') order, after the preset, the cards above and your overrides. An override here wins over everything else.` }),
      h('div.pt-tools', {}, search, chk, h('button.linkish', { type: 'button', text: 'Clear all overrides', on: { click: () => PG.editSettings(x => { x.raw = {}; }, 'load') } })),
      h('div.tscroll', {}, h('table.plain.params', {}, h('thead', {}, h('tr', {}, ['Parameter', 'Sent', 'Override', 'What it does'].map(t => h('th', { text: t })))), tableBody)));
    function fill() {
      PG.clear(tableBody);
      const qq = q.trim().toLowerCase();
      for (const p of AUD_PARAM_TABLE) {
        const n = p.name, v = eff.get(n), pv = presetMap.get(n), raw = s.raw[n];
        const changed = raw !== undefined || JSON.stringify(v) !== JSON.stringify(pv);
        if (onlyChanged && !changed) continue;
        if (qq && ![n, p.help, PLAIN[n] || '', NOTE[n] || ''].join(' ').toLowerCase().includes(qq)) continue;
        const err = h('div.p-err', { role: 'alert' });
        const disabled = p.type === 'warp' || n === 'bpvocmpnorm';
        const inp = h('input.num.wide', { type: 'text', id: 'raw-' + n, value: raw === undefined ? '' : Array.isArray(raw) ? JSON.stringify(raw) : raw, placeholder: disabled ? 'not settable here' : 'value', disabled, 'aria-label': `Override ${n}`,
          on: { change: e => { const r = parseVal(p, e.target.value); if (r.err) { err.textContent = r.err; e.target.setAttribute('aria-invalid', 'true'); return; } PG.editSettings(x => { if (r.v === undefined) delete x.raw[n]; else x.raw[n] = r.v; }); } } });
        tableBody.append(h('tr' + (changed ? '.changed' : ''), {},
          h('td', {}, h('code', { text: n }), h('div.muted', { text: p.type })),
          h('td.p-val', { text: v === undefined ? '(C++ default)' : show(v) }, pv !== undefined && JSON.stringify(v) !== JSON.stringify(pv) ? h('div.muted', { text: 'preset ' + show(pv) }) : null),
          h('td', {}, inp, err),
          h('td.p-help', {}, PLAIN[n] ? h('div', { text: PLAIN[n] }) : null, h('div.muted', {}, p.help.split('\n')[0], ' ', h('a', { href: CPP + p.line, target: '_blank', rel: 'noopener', text: `Audapter.cpp:${p.line}` })),
            NOTE[n] ? h('div.p-note', { text: NOTE[n] }) : null)));
      }
      if (!tableBody.children.length) tableBody.append(h('tr', {}, h('td', { colSpan: 4, text: 'No parameter matches.' })));
    }
    fill();
    return wrap;
  }

  // ---------------- OST / PCF editor
  function ostEditor() {
    const s = PG.state.settings, custom = s.when.mode === 'custom', c = S.compile(s);
    const ostText = custom ? s.when.ost : (c.ost || ''), pcfText = custom ? s.when.pcf : (c.pcf || '');
    const o = S.parseOst(ostText), p = S.parsePcf(pcfText), nS = S.ostStateCount(o);
    const commit = (oo, pp) => PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = oo ? S.serializeOst(oo) : x.when.ost || ostText; x.when.pcf = pp ? S.serializePcf(pp) : x.when.pcf || pcfText; });
    const sec = h('section.grp.ost-ed', { id: 'ost-editor', 'aria-labelledby': 'ost-title' },
      h('h2.grp-title', { id: 'ost-title', text: 'When: OST and PCF' }),
      h('p.grp-blurb', { text: 'The online status tracking (OST) file is a small state machine that follows the speech; the perturbation configuration (PCF) says what to change in each state. ' +
        (custom ? 'You are editing a custom pair; it drives the shift whenever "When" is set to Custom.' : 'The pair below is generated from the "When" settings. Editing it switches "When" to Custom.') }));
    if (!ostText.trim()) {
      sec.append(h('p', { text: 'No OST/PCF is in use: the shift is controlled by the perturbation field alone.' }),
        h('button.btn', { type: 'button', text: 'Start a custom OST/PCF', on: { click: () => commit({ rmsSlopeWin: 0.03, rules: [{ stat: 0, mode: 'INTENSITY_RISE_HOLD', p1: 0.02, p2: 0.02, p3: null }, { stat: 2, mode: 'INTENSITY_FALL', p1: 0.01, p2: 0.02, p3: null }, { stat: 3, mode: 'OST_END', p1: NaN, p2: NaN, p3: null }], maxIOI: [] },
          { warps: [], rows: [0, 1, 2, 3].map(i => ({ pitch: 0, db: 0, amp: i === 2 ? 0.2 : 0, phi: 0 })) }) } }));
      return sec;
    }
    sec.append(diagram(o, p, nS));
    // warnings for this pair
    const ws = PG.S.warnings(s, c, { sequence: false }).filter(w => w.where === 'ost' || w.where === 'pcf');
    if (ws.length) sec.append(h('div.warns', {}, ws.map(PG.warnEl)));
    // rules
    const rules = h('tbody');
    o.rules.forEach((r, i) => {
      const md = S.OST_MODES[r.mode] || { params: [], text: 'Unknown mode.' };
      const upd = fn => { const oo = S.clone(o); fn(oo.rules[i]); commit(oo, null); };
      const pin = (k, idx) => h('input.num', { type: 'number', step: 'any', value: r[k] === null || Number.isNaN(r[k]) ? '' : r[k], placeholder: idx < md.params.length ? '' : (k === 'p3' ? '{}' : 'NaN'),
        'aria-label': md.params[idx] || `field ${idx + 3}`, title: md.params[idx] || 'unused', on: { change: e => upd(rr => { rr[k] = e.target.value === '' ? (k === 'p3' ? null : NaN) : +e.target.value; }) } });
      rules.append(h('tr', {},
        h('td', {}, h('input.num.narrow', { type: 'number', min: 0, value: r.stat, 'aria-label': 'From state', on: { change: e => upd(rr => { rr.stat = +e.target.value; }) } })),
        h('td', {}, h('select', { 'aria-label': 'Rule', on: { change: e => upd(rr => { rr.mode = e.target.value; }) } }, Object.keys(S.OST_MODES).map(k => h('option', { value: k, text: k, selected: k === r.mode })))),
        h('td', {}, pin('p1', 0)), h('td', {}, pin('p2', 1)), h('td', {}, pin('p3', 2)),
        h('td.rule-d', {}, md.text, md.params.length ? h('div.muted', { text: 'Fields: ' + md.params.join('; ') }) : null),
        h('td', {}, h('button.linkish', { type: 'button', text: 'remove', on: { click: () => { const oo = S.clone(o); oo.rules.splice(i, 1); commit(oo, null); } } }))));
    });
    const ioi = h('div.ioi', {}, h('h3', { text: 'Timeouts (maxIOI)' }),
      o.maxIOI.map((m, i) => h('div.src-row', {}, 'From state ', h('input.num.narrow', { type: 'number', value: m.stat0, 'aria-label': 'From state', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].stat0 = +e.target.value; commit(oo); } } }),
        ' jump to ', h('input.num.narrow', { type: 'number', value: m.stat1, 'aria-label': 'To state', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].stat1 = +e.target.value; commit(oo); } } }),
        ' after ', h('input.num', { type: 'number', step: 0.01, value: m.interval, 'aria-label': 'Seconds', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].interval = +e.target.value; commit(oo); } } }), ' s ',
        h('button.linkish', { type: 'button', text: 'remove', on: { click: () => { const oo = S.clone(o); oo.maxIOI.splice(i, 1); commit(oo); } } }))),
      h('button.linkish', { type: 'button', text: 'Add a timeout', on: { click: () => { const oo = S.clone(o); oo.maxIOI.push({ stat0: 0, interval: 0.5, stat1: Math.max(1, nS - 1) }); commit(oo); } } }));
    sec.append(h('h3', { text: 'OST rules' }),
      h('div.tscroll', {}, h('table.plain.rules', {}, h('thead', {}, h('tr', {}, ['State', 'Rule', 'Field 3', 'Field 4', 'Field 5', 'What it does', ''].map(t => h('th', { text: t })))), rules)),
      h('div.btnrow', {}, h('button.linkish', { type: 'button', text: 'Add a rule', on: { click: () => { const oo = S.clone(o); const last = oo.rules[oo.rules.length - 1]; const st = last ? last.stat : 0; oo.rules.splice(Math.max(0, oo.rules.length - 1), 0, { stat: st, mode: 'ELAPSED_TIME', p1: 0.1, p2: NaN, p3: null }); if (last && last.mode === 'OST_END') last.stat = st + 1; commit(oo); } } }),
        h('label', {}, 'rmsSlopeWin ', h('input.num', { type: 'number', step: 0.005, value: o.rmsSlopeWin, 'aria-label': 'rmsSlopeWin (s)', on: { change: e => { const oo = S.clone(o); oo.rmsSlopeWin = +e.target.value; commit(oo); } } }), ' s')),
      ioi);
    // PCF table
    const pb = h('tbody');
    const rowsN = Math.max(p.rows.length, nS);
    for (let i = 0; i < rowsN; i++) {
      const r = p.rows[i], missing = !r;
      const upd = (k, v) => { const pp = S.clone(p); while (pp.rows.length <= i) pp.rows.push({ pitch: 0, db: 0, amp: 0, phi: 0 }); pp.rows[i][k] = v; commit(null, pp); };
      const cell = k => h('td', {}, h('input.num', { type: 'number', step: 'any', value: missing ? '' : r[k], placeholder: missing ? 'missing' : '', 'aria-label': `${k} for state ${i}`, on: { change: e => upd(k, +e.target.value || 0) } }));
      const eq = r && r.amp ? `≈ ${s.shift.formant.units === 'pct' || S.compile(s).map.get('bratioshift') === 1 ? `F1 ${PG.fmt.signed(100 * r.amp * Math.cos(r.phi), 1)} %, F2 ${PG.fmt.signed(100 * r.amp * Math.sin(r.phi), 1)} %` : `F1 ${PG.fmt.signed(r.amp * Math.cos(r.phi), 0)}, F2 ${PG.fmt.signed(r.amp * Math.sin(r.phi), 0)} (Hz or mel)`}` : '';
      pb.append(h('tr' + (missing ? '.missing' : ''), {}, h('td', { text: String(i) }), cell('pitch'), cell('db'), cell('amp'), cell('phi'), h('td.muted', { text: missing ? 'no row: Audapter reads past the table (OST-F4)' : eq })));
    }
    sec.append(h('h3', { text: 'PCF: what changes in each state' }),
      h('div.tscroll', {}, h('table.plain.pcf', {}, h('thead', {}, h('tr', {}, ['State', 'Pitch (st)', 'Level (dB)', 'Formant amplitude', 'Formant angle (rad)', ''].map(t => h('th', { text: t })))), pb)),
      p.warps.length ? h('p.muted', { text: `Time warps: ${p.warps.map(w => `${w.ostInitState !== null ? `from state ${w.ostInitState}, ` : ''}start ${w.tBegin} s, ×${w.rate1} for ${w.dur1} s, hold ${w.hold} s, catch up ×${w.rate2}`).join('; ')}.` }) : '',
      h('p.ctl-desc', { text: 'Formant amplitude and angle are a vector in the F1–F2 plane: in ratio mode, amplitude 0.2 at angle 0 is F1 +20 %; angle π/2 moves F2 instead. A PCF overrides the perturbation field.' }));
    // text import/export
    const ta1 = h('textarea.code', { rows: 9, 'aria-label': 'OST text', text: ostText }), ta2 = h('textarea.code', { rows: 9, 'aria-label': 'PCF text', text: pcfText });
    const errs = h('div.p-err', { role: 'alert' });
    const fileIn = (ta, ext) => h('input', { type: 'file', accept: ext, hidden: true, on: { change: async e => { const f = e.target.files[0]; if (f) ta.value = await f.text(); e.target.value = ''; } } });
    const f1 = fileIn(ta1, '.ost,.txt'), f2 = fileIn(ta2, '.pcf,.txt');
    sec.append(h('details.ost-text', {}, h('summary', { text: 'Edit as text, import or export .ost / .pcf files' }),
      h('div.two', {}, h('div', {}, h('h3', { text: 'OST' }), ta1), h('div', {}, h('h3', { text: 'PCF' }), ta2)), errs,
      h('div.btnrow', {},
        h('button.btn.primary', { type: 'button', text: 'Apply text', on: { click: () => {
          const e1 = S.parseOst(ta1.value).errors, e2 = S.parsePcf(ta2.value).errors;
          errs.textContent = [...e1.map(x => 'OST ' + x), ...e2.map(x => 'PCF ' + x)].join('. ');
          if (!e1.length && !e2.length) PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = ta1.value; x.when.pcf = ta2.value; });
        } } }),
        h('button.btn', { type: 'button', text: 'Import .ost', on: { click: () => f1.click() } }), f1,
        h('button.btn', { type: 'button', text: 'Import .pcf', on: { click: () => f2.click() } }), f2,
        h('button.btn', { type: 'button', text: 'Export .ost', on: { click: () => PG.Store.download(new Blob([ta1.value]), 'playground.ost') } }),
        h('button.btn', { type: 'button', text: 'Export .pcf', on: { click: () => PG.Store.download(new Blob([ta2.value]), 'playground.pcf') } }))));
    return sec;
  }

  // State diagram: states left to right, each rule an arrow labelled in words; states the PCF perturbs are annotated.
  function diagram(o, p, nS) {
    const NS = 'http://www.w3.org/2000/svg', el = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (txt !== undefined) e.textContent = txt; return e; };
    const gap = 150, r = 17, Wd = Math.max(320, 40 + (nS - 1) * gap + 60), Hd = 150, yc = 62;
    const svg = el('svg', { class: 'ost-diagram', viewBox: `0 0 ${Wd} ${Hd}`, width: Wd, height: Hd, role: 'img', 'aria-label': `OST state diagram with ${nS} states` });
    const X = i => 30 + i * gap;
    const short = { ELAPSED_TIME: r => `after ${r.p1} s`, INTENSITY_RISE_HOLD: r => [`level > ${r.p1}`, `held ${r.p2} s`], INTENSITY_RISE_HOLD_POS_SLOPE: r => [`level > ${r.p1}, rising`, `held ${r.p2} s`],
      INTENSITY_FALL: r => `level < ${r.p1}`, INTENSITY_AND_RATIO_ABOVE_THRESH: r => [`level & ratio up`, `held ${r.p3 ?? 0} s`], INTENSITY_AND_RATIO_BELOW_THRESH: r => [`level & ratio down`, `held ${r.p3 ?? 0} s`],
      INTENSITY_RATIO_RISE: () => ['ratio up', 'held', 'ratio down'], INTENSITY_RATIO_FALL_HOLD: () => ['ratio down', 'held', 'ratio down'] };
    const defs = el('defs'); const mk = el('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }); mk.append(el('path', { d: 'M0,0L10,5L0,10z', class: 'ah' })); defs.append(mk); svg.append(defs);
    for (const rule of o.rules) {
      const md = S.OST_MODES[rule.mode]; if (!md || !md.span) continue;
      const labs = short[rule.mode] ? [].concat(short[rule.mode](rule)) : [rule.mode.toLowerCase().replace(/_/g, ' ')];
      for (let k = 0; k < md.span; k++) {
        const a = rule.stat + k, b = a + 1;
        svg.append(el('line', { x1: X(a) + r + 2, y1: yc, x2: X(b) - r - 3, y2: yc, class: 'ost-edge', 'marker-end': 'url(#ah)' }));
        svg.append(el('text', { x: (X(a) + X(b)) / 2, y: yc - 10, 'text-anchor': 'middle', class: 'ost-elab' }, labs[Math.min(k, labs.length - 1)]));
      }
    }
    for (const m of o.maxIOI) {
      const a = X(m.stat0), b = X(m.stat1), mid = (a + b) / 2;
      svg.append(el('path', { d: `M${a},${yc + r}Q${mid},${yc + 72} ${b},${yc + r + 2}`, class: 'ost-edge ioi', 'marker-end': 'url(#ah)' }));
      svg.append(el('text', { x: mid, y: yc + 52, 'text-anchor': 'middle', class: 'ost-elab' }, `timeout ${m.interval} s`));
    }
    for (let i = 0; i < nS; i++) {
      const row = p.rows[i], pert = row && (row.pitch || row.db || row.amp);
      svg.append(el('circle', { cx: X(i), cy: yc, r, class: 'ost-node' + (pert ? ' pert' : '') + (!row && p.rows.length ? ' missing' : '') }));
      svg.append(el('text', { x: X(i), y: yc + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'ost-nlab' }, String(i)));
      const bits = [];
      if (row) { if (row.amp) bits.push(`F ${+(row.amp).toPrecision(3)}∠${+(row.phi).toFixed(2)}`); if (row.pitch) bits.push(`${PG.fmt.signed(row.pitch, 1)} st`); if (row.db) bits.push(`${PG.fmt.signed(row.db, 1)} dB`); }
      else if (p.rows.length) bits.push('no PCF row');
      if (bits.length) svg.append(el('text', { x: X(i), y: yc + r + 16, 'text-anchor': 'middle', class: 'ost-plab' + (row ? '' : ' bad') }, bits.join(', ')));
    }
    return h('div.tscroll.ost-dwrap', {}, svg);
  }
  return { mount, render };
})();
