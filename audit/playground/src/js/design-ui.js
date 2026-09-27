'use strict';
// "Timing & design" tab: draw WHEN the perturbation happens on the current input, from events Audapter's own level rules
// detect (a dry run of the real core gives the per-frame level; PG.OstSim replays the OST rules on it). Templates,
// draggable blocks, a prediction of the resulting states, the generated OST/PCF (advanced), and an experiment schedule.
PG.DesignUI = (() => {
  const { h, S } = PG, TT = PG.Tiers;
  let advOpen = false, root, dry = null, dryErr = null, dryKey = '', stack = null, drag = null, schedRes = null, lastSchedId = null;
  const sched = { base: 10, ramp: 10, hold: 10, wash: 10, catchPct: 0, clips: 'current', clipIds: [], session: false };

  const D = () => PG.state.settings.design;
  const edit = (fn, why) => PG.editSettings(s => { fn(s.design, s); s.when.mode = 'design'; }, why);
  const round10 = v => Math.round(v / 10) * 10;
  const asDesign = () => { const x = S.clone(PG.state.settings); x.when.mode = 'design'; return x; };
  const fd = () => (dry ? dry.frameDur : 0.002);

  function mount(el) {
    root = el;
    PG.bus.on('tab', t => { if (t === 'design') { render(); ensureDry(); } });
    PG.bus.on('settings', why => { if (visible()) { if (why !== 'drag') render(); ensureDry(); } });
    PG.bus.on('input', () => { if (visible()) { render(); ensureDry(); } });
    PG.bus.on('current', () => { if (visible() && stack) stack.draw(); });
    PG.bus.on('trials', () => { if (visible() && schedRes) renderSchedPlot(); });
  }
  const visible = () => root && !root.closest('[hidden]');

  // ---------- dry run (Audapter's level per frame) and events
  async function ensureDry() {
    const inp = PG.state.input; if (!inp) return;
    const s = PG.state.settings, key = inp.id + '|' + JSON.stringify([s.preset, s.listen, s.raw, s.build]);
    if (key === dryKey && dry) return;
    dryKey = key;
    try {
      const d = await PG.Engine.dryRun(inp, s);
      if (dryKey !== key) return;
      dry = d; dryErr = null;
      const det = D().detect;
      if (det.auto !== false) {   // fit detection levels to this input's peak (Audapter's own RMS)
        let pk = 0; for (const v of d.rms) if (v > pk) pk = v;
        const on = +(pk * Math.pow(10, (det.onDb ?? -12) / 20)).toPrecision(3), off = +(pk * Math.pow(10, (det.offDb ?? -18) / 20)).toPrecision(3);
        if (on !== det.onThresh || off !== det.offThresh) { PG.editSettings(x => { x.design.detect.onThresh = on; x.design.detect.offThresh = off; }, 'fit'); return; }
      }
      render();
    } catch (e) { dryErr = e.message; render(); }
  }
  const sounds = () => (dry ? PG.OstSim.sounds(dry, dry.frameDur, D().detect) : []);
  function refTime(ref, snd, startT, dur) {
    if (ref.ev === 't0') return ref.ms / 1000;
    if (ref.ev === 'none') return dur;
    if (ref.ev === 'dur') return startT === null ? null : startT + ref.ms / 1000;
    const z = snd[ref.k - 1]; if (!z) return null;
    return (ref.ev === 'on' ? z.on : z.off) + ref.ms / 1000;
  }
  function intended(snd, dur) {
    return D().blocks.map(b => { const a = refTime(b.start, snd, null, dur); const e = refTime(b.end, snd, a, dur); return { a, b: e === null ? null : Math.min(dur, e) }; });
  }
  // Predicted spans per block from simulating the compiled OST on the dry-run level.
  function predict() {
    if (!dry) return null;
    const c = S.compile(asDesign()); if (!c.ost || !c.meta.design) return null;
    const st = PG.OstSim.run(c.ost, dry, dry.frameDur, { patched: PG.state.settings.build === 'patched' }).states;
    const W = c.meta.design.whatOf, spans = D().blocks.map(() => []);
    let cur = -1, a = 0;
    for (let i = 0; i <= st.length; i++) {
      const b = i < st.length && W[st[i]] ? W[st[i]].block : -1;
      if (b !== cur) { if (cur >= 0) spans[cur].push([a * dry.frameDur, i * dry.frameDur]); cur = b; a = i; }
    }
    return { states: st, spans, compiled: c };
  }

  // ---------- rendering
  let rendering = false;
  function render() {
    if (!root || rendering) return;
    rendering = true;
    try { render1(); } finally { rendering = false; }
  }
  function render1() {
    if (stack) { stack.destroy(); stack = null; }
    const scroll = document.scrollingElement.scrollTop;
    PG.clear(root);
    const s = PG.state.settings, d = s.design, inUse = s.when.mode === 'design';
    root.append(h('section.dz-head', {},
      h('h2.dz-title', { text: 'When the perturbation happens' }),
      h('p.grp-blurb', { text: 'Pick a common design, then drag the blocks on the timeline. Blocks snap to the sounds Audapter detects in this input, and the row below them predicts when Audapter will actually switch the perturbation on.' }),
      h('div.dz-status' + (inUse ? '.on' : ''), {}, inUse
        ? h('span', {}, h('b', { text: 'In use. ' }), 'Every run uses this timing (Explore, "When": as designed here).')
        : [h('span', { text: `Not in use: Explore's "When" is set to "${({ always: 'always', after: 'after a delay', window: 'a time window', vowel: 'during the vowel', custom: 'custom OST/PCF' })[s.when.mode]}". ` }),
           h('button.btn.primary', { type: 'button', text: 'Use this timing', on: { click: () => edit(() => {}) } })])));
    root.append(templates(d));
    const inp = PG.state.input;
    const tl = h('div.dz-timeline');
    root.append(h('section.dz-sec', {}, h('h3', { text: inp ? `Timeline: ${inp.label}` : 'Timeline' }), tl));
    if (!inp) tl.append(h('p.empty', { text: 'Choose an input on the Explore tab first.' }));
    else if (dryErr) tl.append(h('p.empty', { text: 'Could not analyse this input: ' + dryErr }));
    else if (!dry) tl.append(h('p.empty', { text: 'Analysing the input with Audapter…' }));
    else timeline(tl);
    root.append(blockList(), detection(), notesBox(), advanced(), schedule(),
      h('p.expert-link', {}, h('button.linkish', { type: 'button', text: 'Expert: all 87 Audapter parameters', on: { click: () => PG.ParamsUI.openExpert() } })));
    document.scrollingElement.scrollTop = scroll;
  }

  function sketch(key) {   // tiny picture of each template: a voice bar (grey) and when the shift is on (hollow block)
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 22'); svg.setAttribute('class', 'tpl-sk'); svg.setAttribute('aria-hidden', 'true');
    const r = (x, y, w, hh, cls) => { const e = document.createElementNS(NS, 'rect'); Object.entries({ x, y, width: w, height: hh, class: cls, rx: 1 }).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); };
    const voice = key === 'nth' ? [[8, 14], [26, 14], [44, 14]] : [[10, 48]];
    voice.forEach(([x, w]) => r(x, 15, w, 5, 'sk-voice'));
    const on = { whole: [[1, 62]], step: [[22, 41]], vowel: [[12, 46]], nth: [[26, 14]], pulse: [[30, 9]], stepback: [[20, 22]] }[key] || [];
    on.forEach(([x, w]) => r(x, 3, w, 8, 'sk-on'));
    return svg;
  }
  function templates(d) {
    const T = S.TEMPLATES;
    const grid = h('div.tpl-grid', { role: 'group', 'aria-label': 'Designs' }, Object.entries(T).map(([k, t]) =>
      h('button.tpl', { type: 'button', 'aria-pressed': String(d.template === k), title: t.blurb, on: { click: () => applyTemplate(k) } }, sketch(k), h('span.tpl-l', { text: t.label }))));
    const cur = T[d.template];
    const ctl = h('div.tpl-ctl');
    if (cur && cur.controls.length) for (const [key, label, unit, mn, mx, step] of cur.controls)
      ctl.append(h('label.syn', {}, h('span', { text: label }), h('input.num', { type: 'number', min: mn, max: mx, step, value: d.tpl[key], id: 'tpl-' + key,
        on: { change: e => { const v = +e.target.value; edit(dd => { dd.tpl[key] = v; if (key === 'jitter') dd.jitterMs = v; else rebuild(dd); }); } } }), h('span.unit', { text: unit })));
    else if (!cur) ctl.append(h('p.muted', { text: 'Adjusted by hand. Pick a design above to start again from a template.' }));
    return h('section.dz-sec', {}, h('h3', { text: 'Common designs' }), grid,
      cur ? h('p.ctl-desc', { text: cur.blurb + (d.template === 'nth' ? ' A "sound" is a stretch where the level stays above the detection level; a word with a stop consonant can be two sounds.' : '') }) : null, ctl);
  }
  function currentWhat() {
    const b = D().blocks[0];
    if (b && b.what && (b.what.f1 || b.what.f2 || b.what.st || b.what.db)) return { ...b.what };
    const sh = PG.state.settings.shift;
    const w = { f1: sh.formant.on ? sh.formant.f1 : 0, f2: sh.formant.on ? sh.formant.f2 : 0, st: sh.pitch.on ? sh.pitch.semitones : 0, db: sh.loudness.on ? sh.loudness.db : 0 };
    return w.f1 || w.f2 || w.st || w.db ? w : { f1: 20, f2: 0, st: 0, db: 0 };
  }
  function rebuild(dd) { const T = S.TEMPLATES[dd.template]; if (!T) return; const w = currentWhat(); dd.blocks = T.blocks(dd.tpl).map(b => ({ ...b, what: { ...w } })); }
  function applyTemplate(k) { edit(dd => { dd.template = k; dd.jitterMs = k === 'step' ? dd.tpl.jitter || 0 : 0; rebuild(dd); }); }

  // ---------- timeline tiers
  function timeline(el) {
    const snd = sounds(), dur = dry.n * dry.frameDur, pred = predict(), I = intended(snd, dur);
    TT.setDuration(dur, true);
    const inp = PG.state.input, det = D().detect;
    const t = PG.current(), lastRun = t && t.result && t.inputId === inp.id && t.settings.when.mode === 'design' && JSON.stringify(t.settings.design.blocks) === JSON.stringify(D().blocks) ? t : null;
    const lvlDb = Float32Array.from(dry.rms, v => (v > 0 ? 20 * Math.log10(v) : NaN));
    const tiers = [
      { label: 'Input', sub: 'waveform; Audapter\'s level (ink line) with the start and end levels', height: 84, alt: 'Input waveform and level',
        draw(g, w, hh, xOf, C, z) {
          const x = inp.x, mid = hh / 2; g.fillStyle = C.input; g.beginPath();
          const top = [], bot = [];
          for (let px = 0; px < w; px++) { const a = Math.floor((z.t0 + px / w * (z.t1 - z.t0)) * 48000), b = Math.ceil((z.t0 + (px + 1) / w * (z.t1 - z.t0)) * 48000); let mn = 0, mx = 0; for (let i = Math.max(0, a); i < Math.min(x.length, b); i++) { if (x[i] < mn) mn = x[i]; if (x[i] > mx) mx = x[i]; } top.push(mid - mx * (mid - 2)); bot.push(mid - mn * (mid - 2)); }
          g.moveTo(0, top[0]); top.forEach((yy, i) => g.lineTo(i, yy)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(i, bot[i]); g.fill();
          const lo = -70, yOf = v => hh - 2 - (v - lo) / -lo * (hh - 4);
          TT.drawSeries(g, { y: lvlDb, dt: dry.frameDur, style: 'ref', lw: 1.2, ok: v => Number.isFinite(v) }, xOf, yOf, C, w);
          for (const [v, lab] of [[det.onThresh, 'starts above'], [det.offThresh, 'ends below']]) { const yy = Math.round(yOf(20 * Math.log10(v))) + 0.5; g.strokeStyle = C.ink2; g.lineWidth = 1; g.setLineDash([]); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); g.fillStyle = C.ink2; g.font = '11px ' + PG.css('--serif'); g.textBaseline = lab === 'starts above' ? 'bottom' : 'top'; g.fillText(lab, w - 80, lab === 'starts above' ? yy - 1 : yy + 1); }
        },
        readout: tt => { const i = Math.round(tt / dry.frameDur); return [{ label: 'Audapter level', value: (dry.rms[i] || 0).toFixed(4) + ' RMS', style: 'ref' }]; } },
      { label: 'Sounds', sub: 'detected by level', height: 40, alt: 'Detected sounds',
        draw(g, w, hh, xOf, C) { TT.drawIntervals(g, snd.map(z => ({ a: z.on, b: z.off, label: `sound ${z.k}`, kind: 'ctx' })), xOf, w, hh, C); },
        readout: tt => { const z = snd.find(q => tt >= q.on && tt < q.off); return z ? [{ label: `sound ${z.k}: ${z.on.toFixed(2)}–${z.off.toFixed(2)} s`, value: '', style: 'none' }] : [{ label: 'silence', value: '', style: 'none' }]; } },
      { label: 'Your design', sub: 'drag; double-click adds', height: 44, alt: 'Designed perturbation blocks',
        draw(g, w, hh, xOf, C) {
          const items = I.map((iv, i) => { const o = drag && drag.i === i ? drag.iv : iv; return o.a === null || o.b === null ? null : { a: o.a, b: o.b, kind: 'exp', label: `${i + 1}: ${whatText(D().blocks[i].what)}` }; }).filter(Boolean);
          TT.drawIntervals(g, items, xOf, w, hh, C);
          for (const it of items) for (const x0 of [xOf(it.a), xOf(it.b)]) { g.fillStyle = C.ink; g.fillRect(x0 - 2, hh / 2 - 7, 4, 14); }
        },
        attach: (cv, H) => attachDrag(cv, H, snd, dur) },
      { label: 'Predicted', sub: 'Audapter\'s rules, replayed', height: 40, alt: 'Predicted perturbation on-times',
        draw(g, w, hh, xOf, C) {
          if (!pred) return;
          const items = []; pred.spans.forEach((sp, i) => sp.forEach(([a, b]) => items.push({ a, b, kind: 'obs', label: `${i + 1} on` })));
          const disc = [];
          I.forEach((iv, i) => { if (iv.a === null || iv.b === null) return; const sp = pred.spans[i]; const pa = sp.length ? sp[0][0] : null, pb = sp.length ? sp[sp.length - 1][1] : null;
            if (pa === null) disc.push([iv.a, iv.b]); else { if (Math.abs(pa - iv.a) > 0.012) disc.push([Math.min(pa, iv.a), Math.max(pa, iv.a)]); if (Math.abs(pb - iv.b) > 0.012) disc.push([Math.min(pb, iv.b), Math.max(pb, iv.b)]); } });
          TT.bands(g, disc, xOf, hh, C, null);
          TT.drawIntervals(g, items, xOf, w, hh, C);
        },
        readout: tt => { if (!pred) return []; const i = Math.round(tt / dry.frameDur); return [{ label: 'predicted OST state', value: String(pred.states[i] ?? ''), style: 'obs' }]; } },
    ];
    if (lastRun) {
      const r = lastRun.result, P = new Set((r.compiled && r.compiled.meta && r.compiled.meta.perturbStates) || []), dt = 1 / r.frameRate;
      tiers.push({ label: 'Last run', sub: `${lastRun.name}: states logged (blue), formants shifted (ink)`, height: 40, alt: 'Logged on-times in the last run',
        draw(g, w, hh, xOf, C) {
          const on = TT.runs(r.ost_stat, dt, v => P.has(v)).map(x => ({ ...x, kind: 'obs', label: 'state on', lane: 0 }));
          const sh = TT.runs(r.sfmts[0], dt, (v, i) => v > 0 && (Math.abs(v - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5)).map(x => ({ ...x, kind: 'exp', label: '', lane: 1 }));
          TT.drawIntervals(g, [...on, ...sh], xOf, w, hh, C);
        } });
    }
    stack = TT.Stack(el, { tiers });
    const legend = h('div.legend-row', {}, PG.Views.key('exp', 'your design'), PG.Views.key('obs', 'predicted on'), h('span.lk', {}, h('span.key.k-disc'), 'differs from the drawn block by more than 12 ms'),
      h('span.muted', { text: 'Onsets count once the level has stayed up for the hold time; ends need 10 ms of quiet.' }));
    el.append(legend);
  }
  const whatText = w => [w.f1 ? `F1 ${PG.fmt.signed(w.f1, 0)}` : '', w.f2 ? `F2 ${PG.fmt.signed(w.f2, 0)}` : '', w.st ? `${PG.fmt.signed(w.st, 1)} st` : '', w.db ? `${PG.fmt.signed(w.db, 1)} dB` : ''].filter(Boolean).join(', ') || 'no change';

  // ---------- dragging
  function snapRef(t, snd, which, startT, dur) {
    const ev = [{ ev: 't0', k: 1, t: 0 }]; snd.forEach(z => { ev.push({ ev: 'on', k: z.k, t: z.on }); ev.push({ ev: 'off', k: z.k, t: z.off }); });
    if (which === 'end' && t > dur - 0.02) return { ev: 'none', k: 1, ms: 0 };
    const near = ev.filter(e => e.ev !== 't0' || which === 'start').sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];
    const hold = Math.round(D().detect.onHold * 1000);
    if (near && Math.abs(near.t - t) < 0.03) return { ev: near.ev, k: near.k, ms: near.ev === 'on' ? hold : 0 };
    if (which === 'end' && startT !== null) return { ev: 'dur', k: 1, ms: Math.max(10, round10((t - startT) * 1000)) };
    const before = ev.filter(e => e.t <= t).sort((a, b) => b.t - a.t)[0] || ev[0];
    return { ev: before.ev, k: before.k, ms: Math.max(before.ev === 'on' ? hold : 0, round10((t - before.t) * 1000)) };
  }
  function attachDrag(cv, H, snd, dur) {
    cv.style.cursor = 'grab';
    const I = () => intended(snd, dur);
    cv.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, t = H.tOf(px), iv = I();
      let hit = null;
      iv.forEach((q, i) => { if (q.a === null || q.b === null) return; const xa = H.xOf(q.a), xb = H.xOf(q.b); if (Math.abs(px - xa) < 8) hit = { i, which: 'start' }; else if (Math.abs(px - xb) < 8) hit = { i, which: 'end' }; else if (!hit && px > xa && px < xb) hit = { i, which: 'body', off: t - q.a }; });
      if (!hit) return;
      drag = { ...hit, iv: { ...iv[hit.i] }, t0: t }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = cv.getBoundingClientRect(), t = Math.max(0, Math.min(dur, H.tOf(e.clientX - r.left))), q = I()[drag.i];
      if (drag.which === 'start') drag.iv = { a: Math.min(t, q.b - 0.01), b: q.b };
      else if (drag.which === 'end') drag.iv = { a: q.a, b: Math.max(t, q.a + 0.01) };
      else { const len = q.b - q.a, a = Math.max(0, Math.min(dur - len, t - drag.off)); drag.iv = { a, b: a + len }; }
      H.redraw();
    });
    cv.addEventListener('pointerup', () => {
      if (!drag) return;
      const g = drag; drag = null; cv.style.cursor = 'grab';
      edit(dd => {
        const b = dd.blocks[g.i];
        if (g.which !== 'end') b.start = snapRef(g.iv.a, snd, 'start', null, dur);
        if (g.which !== 'start') { if (!(g.which === 'body' && b.end.ev === 'dur')) b.end = snapRef(g.iv.b, snd, 'end', g.iv.a, dur); }
        dd.template = 'custom';
        sortBlocks(dd, snd, dur);
      });
    });
    cv.addEventListener('dblclick', e => {
      e.stopPropagation();
      const r = cv.getBoundingClientRect(), t = H.tOf(e.clientX - r.left);
      if (I().some(q => q.a !== null && t >= q.a && t <= q.b)) return;
      edit(dd => { dd.blocks.push({ start: snapRef(t, snd, 'start', null, dur), end: { ev: 'dur', k: 1, ms: 200 }, what: { ...currentWhat() } }); dd.template = 'custom'; sortBlocks(dd, snd, dur); });
    });
  }
  function sortBlocks(dd, snd, dur) {
    const t = b => { const v = refTime(b.start, snd, null, dur); return v === null ? 1e9 : v; };
    dd.blocks.sort((a, b) => t(a) - t(b));
  }

  // ---------- block list (plain controls for each block)
  function refSelect(ref, which, snd, onChange) {
    const opts = [];
    if (which === 'start') opts.push(['t0|1', 'the trial start']);
    const nS = Math.max(snd.length, ref.k || 1, 1);
    for (let k = 1; k <= nS; k++) { const z = snd[k - 1], at = z ? '' : ' (not in this input)'; opts.push([`on|${k}`, `sound ${k} starts${z ? ` (${z.on.toFixed(2)} s)` : at}`]); opts.push([`off|${k}`, `sound ${k} ends${z ? ` (${z.off.toFixed(2)} s)` : at}`]); }
    if (which === 'end') { opts.push(['dur|1', 'a fixed time after the start']); opts.push(['none|1', 'the end of the trial']); }
    const sel = h('select', { 'aria-label': which === 'start' ? 'Starts at' : 'Ends at', on: { change: e => { const [ev, k] = e.target.value.split('|'); onChange({ ev, k: +k, ms: ev === 'dur' ? 200 : ev === 'on' ? Math.round(D().detect.onHold * 1000) : 0 }); } } },
      opts.map(([v, t]) => h('option', { value: v, text: t, selected: v === `${ref.ev}|${ref.ev === 't0' || ref.ev === 'dur' || ref.ev === 'none' ? 1 : ref.k}` })));
    const ms = ref.ev === 'none' ? null : h('input.num', { type: 'number', step: 10, min: 0, value: ref.ms, 'aria-label': 'milliseconds', on: { change: e => onChange({ ...ref, ms: Math.max(0, +e.target.value || 0) }) } });
    return h('span.refsel', {}, ref.ev === 'dur' ? null : sel, ms ? h('span.unit', { text: ref.ev === 'dur' ? '' : ref.ev === 't0' ? 'at' : 'plus' }) : null, ms, ms ? h('span.unit', { text: 'ms' }) : null, ref.ev === 'dur' ? [h('span.unit', { text: 'later' }), sel] : null);
  }
  function blockList() {
    const d = D(), snd = dry ? sounds() : [], u = PG.state.settings.shift.formant.units, un = u === 'pct' ? '%' : u;
    const list = h('ol.blocks');
    d.blocks.forEach((b, i) => {
      const set = fn => edit(dd => { fn(dd.blocks[i]); dd.template = 'custom'; });
      const num = (k, lab, unit, step) => h('label.syn', { title: { f1: 'First formant shift', f2: 'Second formant shift', st: 'Pitch shift in semitones (phase vocoder)', db: 'Level change in decibels' }[k] },
        h('span', { text: lab }), h('input.num', { type: 'number', step, value: b.what[k] || 0, 'aria-label': `Block ${i + 1} ${lab}`, on: { change: e => set(bb => { bb.what[k] = +e.target.value || 0; }) } }), h('span.unit', { text: unit }));
      list.append(h('li.block', {},
        h('div.b-when', {}, h('b', { text: `Block ${i + 1}` }), ' starts at ', refSelect(b.start, 'start', snd, r => set(bb => { bb.start = r; })), ', ends at ', refSelect(b.end, 'end', snd, r => set(bb => { bb.end = r; }))),
        h('div.b-what', {}, h('span.muted', { text: 'What changes' }), num('f1', 'F1', un, 1), num('f2', 'F2', un, 1), num('st', 'Pitch', 'st', 0.5), num('db', 'Level', 'dB', 0.5),
          h('button.linkish', { type: 'button', text: 'remove', disabled: d.blocks.length < 2, on: { click: () => edit(dd => { dd.blocks.splice(i, 1); dd.template = 'custom'; }) } }))));
    });
    return h('section.dz-sec', {}, h('h3', { text: 'Blocks' }), list,
      h('div.btnrow', {}, h('button.linkish', { type: 'button', text: 'Add a block', on: { click: () => edit(dd => { const last = dd.blocks[dd.blocks.length - 1]; dd.blocks.push({ start: last && last.end.ev !== 'none' ? { ...last.end, ms: (last.end.ms || 0) + 100 } : { ev: 'on', k: 1, ms: 200 }, end: { ev: 'dur', k: 1, ms: 200 }, what: { ...currentWhat() } }); dd.template = 'custom'; }) } }),
        h('span.muted', { text: `Formant shifts are in ${un === '%' ? 'percent' : un}, set by "Units" on the Explore tab. Pitch uses the phase vocoder.` })));
  }

  function detection() {
    const det = D().detect;
    const f = (k, lab, step, unit, tip) => h('label.syn', { title: tip }, h('span', { text: lab }), h('input.num', { type: 'number', step, value: det[k], 'aria-label': lab, on: { change: e => edit(dd => { dd.detect[k] = +e.target.value; if (k === 'onThresh' || k === 'offThresh') dd.detect.auto = false; }) } }), h('span.unit', { text: unit }));
    return h('details.dz-sec.dz-det', {}, h('summary', { text: 'How sounds are detected' }),
      h('p.ctl-desc', { text: 'Audapter follows speech with level rules: a sound starts when its level (smoothed RMS) rises above the start level and stays there for the hold time, and ends when it has been below the end level for 10 ms. These are the same rules the design compiles to (INTENSITY_RISE_HOLD and INTENSITY_FALL).' }),
      h('div.syn-grid', {}, f('onThresh', 'Starts above', 0.001, 'RMS', 'Level for "sound starts"'), f('onHold', 'Hold', 0.005, 's', 'How long the level must stay up before the onset counts'),
        f('offThresh', 'Ends below', 0.001, 'RMS', 'Level for "sound ends"'), f('offMin', 'Minimum length', 0.005, 's', 'A sound cannot end sooner than this after its onset is confirmed')),
      h('div.btnrow', {}, h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: det.auto !== false, on: { change: e => edit(dd => { dd.detect.auto = e.target.checked; }) } }), ' Fit the levels to each input (start 12 dB, end 18 dB below its peak)')));
  }

  function notesBox() {
    const s = PG.state.settings, c = S.compile(asDesign()), box = h('div.warns');
    for (const n of c.notes) box.append(PG.warnEl({ level: n.level || 'info', text: n.text }));
    if (dry && c.meta.design) {
      const snd = sounds(), I = intended(snd, dry.n * dry.frameDur), P = predict();
      D().blocks.forEach((b, i) => {
        for (const [r, w] of [[b.start, 'start'], [b.end, 'end']]) if ((r.ev === 'on' || r.ev === 'off') && !snd[r.k - 1]) box.append(PG.warnEl({ level: 'warn', text: `Block ${i + 1} ${w}s at sound ${r.k}, but this input has ${snd.length} sound${snd.length === 1 ? '' : 's'} at the current detection levels, so it never ${w}s.` }));
        const iv = I[i], sp = P && P.spans[i];
        if (iv.a !== null && iv.b !== null && sp) {
          const pa = sp.length ? sp[0][0] : null, pb = sp.length ? sp[sp.length - 1][1] : null;
          if (pa === null) box.append(PG.warnEl({ level: 'warn', text: `Block ${i + 1} is predicted never to switch on: Audapter's rules do not reach it on this input. This can happen when an earlier wait outlasts the sound it waits in, so the next "sound ends" rule catches a later sound.` }));
          else if (Math.abs(pa - iv.a) > 0.012 || Math.abs(pb - iv.b) > 0.012) box.append(PG.warnEl({ level: 'info', text: `Block ${i + 1}: drawn ${iv.a.toFixed(3)}–${iv.b.toFixed(3)} s, predicted ${pa.toFixed(3)}–${pb.toFixed(3)} s. Audapter counts an onset only after the hold and an end only after 10 ms of quiet, and timers restart at each detected event.` }));
        }
      });
    }
    box.append(PG.warnEl({ level: 'info', text: 'Rule choice: every "sound ends" rule follows a "sound starts" rule in the same trial, so no rule depends on the previous trial (avoids OST-F1). No maxIOI timeouts (OST-F2) or level-and-ratio rules (OST-F8) are used.' }));
    return h('section.dz-sec', { hidden: !box.children.length }, box);
  }

  function advanced() {
    const s = PG.state.settings, c = S.compile(s);
    const det = h('details.dz-sec.dz-adv', {}, h('summary', { text: 'Show generated OST/PCF (advanced)' }));
    const fill = () => {
      if (det.dataset.filled) return; det.dataset.filled = '1';
      det.append(h('p.ctl-desc', { text: 'Audapter runs the timing as an OST file (online status tracking: a small state machine that follows the level) and a PCF (perturbation configuration: what to change in each state). The design above compiles to these. Import your own files to use them instead ("When": custom).' }),
        PG.ParamsUI.ostEditor());
    };
    det.addEventListener('toggle', () => { advOpen = det.open; if (det.open) fill(); });
    if (advOpen) { det.open = true; fill(); }
    if (!c.ost && s.when.mode !== 'custom') det.append(h('p.muted', { text: 'No OST/PCF is generated for the current Explore settings.' }));
    return det;
  }

  // ---------- experiment schedule (across trials)
  function schedule() {
    const n = sched.base + sched.ramp + sched.hold + sched.wash;
    const f = (k, lab, tip) => h('label.syn', { title: tip }, h('span', { text: lab }), h('input.num.narrow', { type: 'number', min: 0, max: 200, value: sched[k], 'aria-label': lab + ' trials', id: 'sch-' + k, on: { change: e => { sched[k] = Math.max(0, +e.target.value | 0); render(); } } }), h('span.unit', { text: k === 'catchPct' ? '%' : 'trials' }));
    const clipSel = h('div.sch-clips', { hidden: sched.clips !== 'set' }, PG.CLIPS.map(cl => h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: sched.clipIds.includes(cl.id), on: { change: e => { if (e.target.checked) sched.clipIds.push(cl.id); else sched.clipIds = sched.clipIds.filter(x => x !== cl.id); } } }), ` ${cl.label} (${cl.id})`)));
    const radio = (name, v, cur, lab, set) => h('label.tp-opt', {}, h('input', { type: 'radio', name, checked: cur === v, on: { change: () => { set(v); render(); } } }), ' ' + lab);
    const sec = h('section.dz-sec.sched', { id: 'schedule' }, h('h3', { text: 'Across trials: experiment schedule' }),
      h('p.ctl-desc', { text: 'A common adaptation design. Every trial uses the timing above; only the size of the change varies: none in baseline, growing to the full value over the ramp, full in hold, none in washout. Catch trials are randomly chosen ramp or hold trials run without the change.' }),
      h('div.syn-grid', {}, f('base', 'Baseline', 'Trials with no change'), f('ramp', 'Ramp', 'Change grows to the full value'), f('hold', 'Hold', 'Full change'), f('wash', 'Washout', 'No change again'), f('catchPct', 'Catch trials', 'Share of ramp and hold trials run unperturbed')),
      h('div.btnrow', {}, h('span.muted', { text: 'Input' }), radio('sch-in', 'current', sched.clips, 'the current input for every trial', v => { sched.clips = v; }), radio('sch-in', 'set', sched.clips, 'cycle through chosen clips', v => { sched.clips = v; })), clipSel,
      h('div.btnrow', {}, h('span.muted', { text: 'Run as' }), radio('sch-mode', false, sched.session, 'fresh Audapter per trial', v => { sched.session = v; }), radio('sch-mode', true, sched.session, 'one Audapter session (state carries over)', v => { sched.session = v; })),
      h('div.btnrow', {}, h('button.btn.primary', { type: 'button', id: 'sch-run', text: `Create and run ${n} trials`, disabled: !n, on: { click: runSchedule } }), h('span.muted', { text: `About ${Math.max(1, Math.round(n * 0.5))} s.` })));
    const plot = h('div#sched-plot'); sec.append(plot);
    setTimeout(renderSchedPlot, 0);
    return sec;
  }
  function makeSchedule(rng) {
    const out = [], ph = [['baseline', sched.base], ['ramp', sched.ramp], ['hold', sched.hold], ['washout', sched.wash]];
    for (const [name, N] of ph) for (let i = 0; i < N; i++) {
      let f = name === 'ramp' ? (i + 1) / N : name === 'hold' ? 1 : 0, isCatch = false;
      if ((name === 'ramp' || name === 'hold') && sched.catchPct > 0 && rng() * 100 < sched.catchPct) { f = 0; isCatch = true; }
      out.push({ phase: name, idx: i + 1, factor: f, isCatch });
    }
    return out;
  }
  async function runSchedule() {
    const s = PG.state.settings;
    if (!PG.state.input && sched.clips === 'current') return PG.toast('Choose an input first.', 'error');
    const ids = sched.clips === 'set' ? sched.clipIds.slice() : [];
    if (sched.clips === 'set' && !ids.length) return PG.toast('Tick at least one clip.', 'error');
    const inputs = [];
    for (const id of ids) inputs.push(await PG.InputUI.loadClipInput(id));
    if (!inputs.length) inputs.push(PG.state.input);
    const plan = makeSchedule(PG.DSP.rng(Date.now() & 0xffff)), sid = 'S' + (1 + new Set(PG.state.trials.filter(t => t.sched).map(t => t.sched.id)).size);
    lastSchedId = sid;
    const specs = plan.map((p, i) => {
      const x = S.clone(s); x.when.mode = 'design';
      for (const b of x.design.blocks) for (const k of ['f1', 'f2', 'st', 'db']) b.what[k] = +(b.what[k] * p.factor).toFixed(4);
      return { inputId: inputs[i % inputs.length].id, settings: x, name: `${sid} ${p.phase} ${p.idx}${p.isCatch ? ' (catch)' : ''}`, sched: { id: sid, n: i + 1, ...p } };
    });
    schedRes = sid;
    await PG.runSpecs(specs, { kept: true, sequence: sched.session, noCompare: true });
    renderSchedPlot();
    const pl = document.getElementById('sched-plot'); if (pl) pl.scrollIntoView({ block: 'nearest' });
  }
  // Produced vs heard, per trial, in the design's perturbation window.
  function trialMeasure(t) {
    const r = t.result; if (!r) return null;
    const P = new Set((r.compiled && r.compiled.meta && r.compiled.meta.perturbStates) || []), A = r.analysis;
    const w = t.settings.design.blocks[0].what, useF = t.settings.design.blocks.some(b => b.what.f1 || b.what.f2) || !t.settings.design.blocks.some(b => b.what.st || b.what.db);
    const key = useF ? (Math.abs(w.f2) > Math.abs(w.f1) ? 'F2' : 'F1') : t.settings.design.blocks.some(b => b.what.st) ? 'F0' : 'level';
    // "Measured in the output": the SAME independent estimator (LPC for formants, YIN for F0) on input and output over the
    // same voiced frames of the perturbation window, the output read one processing delay later. Its bias cancels in the
    // per-frame ratio out/in, which is applied to the produced value. Too few paired frames: no dot, with the reason.
    const lag = ((r.compiled && r.compiled.meta && r.compiled.meta.latencyMs) || 10) / 1000;
    const prod = [], heard = [], ratio = [];
    for (let i = 0; i < r.ost_stat.length; i++) {
      if (!P.has(r.ost_stat[i])) continue;
      const tt = i / r.frameRate;
      if (key === 'F1' || key === 'F2') {
        const j = key === 'F1' ? 0 : 1, f = r.fmts[j][i]; if (!(f > 0)) continue;
        prod.push(f); heard.push(r.sfmts[j][i] > 0 ? r.sfmts[j][i] : f);
        const a = A.lpcIn.f[j][Math.round(tt / A.lpcIn.hop)], b = A.lpcOut.f[j][Math.round((tt + lag) / A.lpcOut.hop)];
        if (a > 0 && b > 0) ratio.push(b / a);
      } else if (key === 'F0') {
        const a = A.f0In.f0[Math.round(tt / A.f0In.hop)], b = A.f0Out.f0[Math.round((tt + lag) / A.f0Out.hop)];
        if (a > 0) prod.push(a); if (a > 0 && b > 0) ratio.push(b / a);
      } else {
        const a = A.levIn.db[Math.round(tt / A.levIn.hop)], b = A.levOut.db[Math.round((tt + lag) / A.levOut.hop)];
        if (Number.isFinite(a) && a > -60) { prod.push(a); if (Number.isFinite(b)) ratio.push(b - a); }
      }
    }
    const med = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };
    const p = med(prod), rq = med(ratio);
    let meas = NaN, why = '';
    if (ratio.length < 20) why = `only ${ratio.length} frames where both the input and the output estimate exist`;
    else if (key !== 'level' && !(rq > 0.5 && rq < 2)) why = `the output/input estimate ratio ${rq.toFixed(2)} is implausible`;
    else meas = key === 'level' ? p + rq : p * rq;
    return { key, prod: p, heard: heard.length ? med(heard) : NaN, meas, ratio: rq, pairs: ratio.length, why, frames: prod.length };
  }
  function renderSchedPlot() {
    const el = document.getElementById('sched-plot'); if (!el) return;
    PG.clear(el);
    const all = PG.state.trials.filter(t => t.sched), sid = schedRes || lastSchedId || (all.length ? all[all.length - 1].sched.id : null);
    const T = all.filter(t => t.sched.id === sid && t.result).sort((a, b) => a.sched.n - b.sched.n);
    if (!T.length) { el.append(h('p.muted', { text: 'Run a schedule to see produced and heard values trial by trial here.' })); return; }
    const M = T.map(trialMeasure), key = M[0].key, unit = key === 'level' ? 'dB' : 'Hz';
    const vals = M.flatMap(m => [m.prod, m.heard, m.meas]).filter(Number.isFinite);
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || 10;
    const W = Math.max(320, el.clientWidth || 700), Hh = 240, ml = 56, mr = 12, mt = 34, mb = 30;
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    const E = (tag, a, txt) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (txt !== undefined) e.textContent = txt; svg.append(e); return e; };
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.setAttribute('class', 'sched-svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Schedule ${sid}: ${key} produced and heard per trial`);
    const x = i => ml + (i + 0.5) / T.length * (W - ml - mr), y = v => mt + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (Hh - mt - mb);
    // phases as TextGrid-style intervals on top
    let i0 = 0;
    for (let i = 1; i <= T.length; i++) if (i === T.length || T[i].sched.phase !== T[i0].sched.phase) {
      const a = ml + i0 / T.length * (W - ml - mr), b = ml + i / T.length * (W - ml - mr);
      E('rect', { x: a + 1, y: 4, width: Math.max(1, b - a - 2), height: 20, class: T[i0].sched.phase === 'hold' || T[i0].sched.phase === 'ramp' ? 'sp-on' : 'sp-off' });
      E('text', { x: a + 5, y: 18, class: 'sp-lab' }, T[i0].sched.phase);
      if (i < T.length) E('line', { x1: b, x2: b, y1: 4, y2: Hh - mb, class: 'sp-div' });
      i0 = i;
    }
    for (const g of [lo, (lo + hi) / 2, hi]) { E('line', { x1: ml, x2: W - mr, y1: y(g), y2: y(g), class: 'grid' }); E('text', { x: ml - 6, y: y(g) + 4, 'text-anchor': 'end', class: 'ax' }, `${Math.round(g)}`); }
    E('text', { x: 4, y: mt - 6, class: 'ax' }, `${key} (${unit})`);
    M.forEach((m, i) => {
      const t = T[i];
      if (Number.isFinite(m.prod)) E('circle', { cx: x(i), cy: y(m.prod), r: 4, class: 'sd-prod' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: produced ${m.prod.toFixed(0)}` }));
      if (Number.isFinite(m.heard) && key !== 'F0' && key !== 'level') E('circle', { cx: x(i), cy: y(m.heard), r: 4.5, class: 'sd-heard' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: heard target ${m.heard.toFixed(0)}` }));
      if (Number.isFinite(m.meas)) E('circle', { cx: x(i), cy: y(m.meas), r: 3, class: 'sd-meas' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: measured in the output ${m.meas.toFixed(0)}` }));
      if (t.sched.isCatch) E('text', { x: x(i), y: Hh - mb + 14, 'text-anchor': 'middle', class: 'ax' }, 'c');
    });
    E('text', { x: W - mr, y: Hh - 6, 'text-anchor': 'end', class: 'ax' }, `trial 1–${T.length}${T.some(t => t.sched.isCatch) ? '; c = catch trial' : ''}`);
    const est = key === 'F0' ? 'YIN' : key === 'level' ? 'level' : 'LPC';
    const hidden = M.map((m, i) => (Number.isFinite(m.meas) ? null : `${T[i].name}: ${m.why}`)).filter(Boolean);
    el.append(h('div.legend-row', {}, PG.Views.key('indot', `produced ${key} (Audapter's tracking of the input, in the perturbation window)`), key !== 'F0' && key !== 'level' ? PG.Views.key('exp', `heard target (sfmts)`) : null,
      PG.Views.key('obsdot', `measured in the output (independent ${est}, relative to the input)`)), svg,
      h('p.ctl-desc', { text: `The output dot is the produced value times the median ratio of the same ${est} estimate on output and input, over the same voiced frames (output read one processing delay later), so the estimator's own bias cancels. With a recorded input the produced values cannot adapt; the plot shows what Audapter delivered on each trial.` }),
      hidden.length ? h('p.ctl-desc', { text: `No output dot for ${hidden.join('; ')}.` }) : '');
  }
  return { mount, render, ensureDry, predict, sounds, intended, trialMeasure, state: () => ({ dry, sched }) };
})();
