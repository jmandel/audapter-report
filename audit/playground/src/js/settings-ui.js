'use strict';
// The settings column: presets, the four groups of controls, inline warnings, sweeps, and settings files/links.
PG.SettingsUI = (() => {
  const { h, S } = PG;
  let root, rows = [];   // rows: {c, el, sync()}

  function mount(el) { root = el; render(); PG.bus.on('settings', why => (why === 'load' || why === 'preset' ? render() : refresh())); PG.bus.on('warnings', showWarnings); }

  function render() {
    const s = PG.state.settings; rows = [];
    PG.clear(root);
    root.append(presetBar(s));
    for (const g of PG.GROUPS) root.append(group(g, s));
    root.append(footer());
    refresh();
  }

  function presetBar(s) {
    const note = h('p.preset-note');
    const bar = h('div.seg.presets', { role: 'radiogroup', 'aria-label': 'Starting point' },
      Object.entries(S.PRESETS).map(([k, p]) => h('button', { type: 'button', role: 'radio', 'data-preset': k, text: p.label,
        on: { click: () => PG.editSettings(x => { x.preset = k; x.listen = {}; x.raw = {}; }, 'preset') } })));
    const row = h('div.presetrow', {}, h('h2.grp-title', { text: 'Starting point' }), bar, note);
    rows.push({ sync(s) { PG.$$('button', bar).forEach(b => b.setAttribute('aria-checked', String(b.dataset.preset === s.preset))); note.textContent = S.PRESETS[s.preset].note; } });
    return row;
  }

  function group(g, s) {
    const sec = h('section.grp', { id: 'grp-' + g.id, 'aria-labelledby': 'gt-' + g.id },
      h('h2.grp-title', { id: 'gt-' + g.id, text: g.title }), h('p.grp-blurb', { text: g.blurb }));
    if (g.id === 'shift') { const ban = h('p.derived'); ban.append('A timeline design is in use: when and how much to shift come from its blocks. The switches below still set units and the time-domain / phase-vocoder choice. ', h('button.linkish', { type: 'button', text: 'Open Timing & design', on: { click: () => PG.bus.emit('tab', 'design') } })); sec.append(ban); rows.push({ sync(s) { ban.hidden = s.when.mode !== 'design'; } }); }
    if (g.cards) for (const cd of g.cards) sec.append(card(cd, s));
    if (g.controls) { const body = h('div.ctl-list'); for (const c of g.controls) body.append(control(c, s)); sec.append(body); }
    sec.append(h('div.warns', { 'data-where': g.id }));
    return sec;
  }

  function card(cd, s) {
    const sw = h('input.switch', { type: 'checkbox', id: 'sw-' + cd.id, 'aria-describedby': 'cb-' + cd.id,
      on: { change: e => PG.editSettings(x => S.setPath(x, cd.on, e.target.checked)) } });
    const sum = h('span.card-sum');
    const body = h('div.card-body');
    for (const c of cd.controls) body.append(control(c, s));
    body.append(h('div.warns', { 'data-where': cd.id }));
    const el = h('div.card', { 'data-card': cd.id },
      h('div.card-head', {}, sw, h('label.card-title', { for: 'sw-' + cd.id, text: cd.title }), sum),
      h('p.card-blurb', { id: 'cb-' + cd.id, text: cd.blurb }), body);
    rows.push({ sync(s) { const on = !!S.getPath(s, cd.on); sw.checked = on; el.classList.toggle('on', on); body.hidden = !on; sum.textContent = on ? cd.summary(s) : 'off'; } });
    return el;
  }

  function control(c, s) {
    if (c.kind === 'derived') return derived();
    if (c.kind === 'ostlink') return ostlink(c);
    if (c.kind === 'designlink') { const p = h('p.derived'); rows.push({ sync(s) { p.textContent = 'Timeline: ' + S.summarize(s) + '. '; p.append(h('button.linkish', { type: 'button', text: 'Open Timing & design', on: { click: () => PG.bus.emit('tab', 'design') } })); } }); return p; }
    const id = 'c-' + (c.path || '').replace(/\./g, '-');
    const desc = h('p.ctl-desc', { id: id + '-d', text: c.desc || '' });
    const unit = h('span.unit');
    const reset = c.param ? h('button.linkish.reset', { type: 'button', text: 'preset value', title: 'Use the preset\'s value',
      on: { click: () => PG.editSettings(x => { delete x.listen[c.param]; }) } }) : null;
    const sweepBtn = c.sweep ? h('button.linkish.sweep', { type: 'button', text: 'Sweep', title: 'Run this setting at several values and compare',
      'aria-expanded': 'false', on: { click: () => toggleSweep() } }) : null;
    let sweepBox = null;
    const set = v => PG.editSettings(x => { if (c.param) x.listen[c.param] = v; else S.setPath(x, c.path, v); });
    let widget, sync;
    const rg = () => PG.controlRange(PG.state.settings, c) || [0, 1, 0.01, ''];
    if (c.kind === 'range' || c.kind === 'number') {
      const numIn = h('input.num', { type: 'number', id, 'aria-describedby': id + '-d', inputMode: 'decimal',
        on: { change: e => { const v = e.target.value === '' ? (c.nullable ? null : 0) : +e.target.value; set(c.int ? Math.round(v) : v); } } });
      const slider = c.kind === 'range' ? h('input.slider', { type: 'range', 'aria-label': c.label, on: { input: e => { numIn.value = e.target.value; set(+e.target.value); } } }) : null;
      widget = h('div.ctl-w', {}, slider, numIn, unit);
      sync = s => {
        const [mn, mx, st, un] = rg(), v = PG.controlValue(s, c);
        for (const e of [slider, numIn]) if (e) { e.min = mn; e.max = mx; e.step = st; }
        if (document.activeElement !== numIn) numIn.value = v === null || v === undefined ? '' : v;
        if (slider && document.activeElement !== slider) slider.value = v ?? 0;
        numIn.placeholder = c.nullable ? 'preset' : '';
        unit.textContent = un || '';
      };
    } else if (c.kind === 'select') {
      const sel = h('select', { id, 'aria-describedby': id + '-d', on: { change: e => set(c.num || typeof c.options[0][0] === 'number' ? +e.target.value : e.target.value) } },
        c.options.map(([v, t]) => h('option', { value: v, text: t })));
      widget = h('div.ctl-w', {}, sel); sync = s => { sel.value = String(PG.controlValue(s, c)); };
    } else if (c.kind === 'seg') {
      const bs = c.options.map(([v, t]) => h('button', { type: 'button', role: 'radio', text: t, on: { click: () => set(v) } }));
      widget = h('div.seg', { role: 'radiogroup', 'aria-label': c.label }, bs);
      sync = s => { const v = PG.controlValue(s, c); bs.forEach((b, i) => b.setAttribute('aria-checked', String(c.options[i][0] === v))); };
    } else if (c.kind === 'toggle') {
      const cb = h('input.switch', { type: 'checkbox', id, 'aria-describedby': id + '-d', on: { change: e => set(e.target.checked ? 1 : 0) } });
      widget = h('div.ctl-w', {}, cb); sync = s => { cb.checked = +PG.controlValue(s, c) === 1; };
    } else if (c.kind === 'choice') {
      const items = c.options.map(([v, t, d]) => h('label.choice', {}, h('input', { type: 'radio', name: id, value: v, on: { change: () => set(v) } }), h('span.choice-t', { text: t }), h('span.choice-d', { text: d })));
      widget = h('div.choices', { role: 'radiogroup', 'aria-label': c.label }, items);
      sync = s => { const v = PG.controlValue(s, c); items.forEach((it, i) => { it.firstChild.checked = c.options[i][0] === v; }); };
    } else if (c.kind === 'region') {
      const f = (k, lab) => { const i = h('input.num', { type: 'number', step: 10, 'aria-label': lab, on: { change: e => PG.editSettings(x => { x.shift.formant.region[k] = +e.target.value; }) } }); return [h('span.rlab', { text: lab }), i]; };
      const parts = [f('f1min', 'F1 from'), f('f1max', 'to'), f('f2min', 'F2 from'), f('f2max', 'to')];
      widget = h('div.region', {}, parts.map(([l, i], k) => h('span.rg', {}, l, i, k % 2 ? h('span.unit', { text: 'Hz' }) : null)));
      sync = s => { const r = s.shift.formant.region; ['f1min', 'f1max', 'f2min', 'f2max'].forEach((k, i) => { if (document.activeElement !== parts[i][1]) parts[i][1].value = r[k]; }); };
    } else if (c.kind === 'curve') {
      const tb = h('tbody');
      widget = h('div.curve', {}, h('table.mini', {}, h('thead', {}, h('tr', {}, h('th', { text: 'at F2 (Hz)' }), h('th', { text: 'F1 shift' }), h('th', { text: 'F2 shift' }), h('th'))), tb),
        h('button.linkish', { type: 'button', text: 'Add a point', on: { click: () => PG.editSettings(x => { const c2 = x.shift.formant.curve; c2.push([(c2.length ? c2[c2.length - 1][0] : 500) + 500, 0, 0]); }, 'curve') } }));
      sync = s => {
        if (tb.contains(document.activeElement)) return;
        PG.clear(tb);
        s.shift.formant.curve.forEach((p, i) => tb.append(h('tr', {}, [0, 1, 2].map(k => h('td', {}, h('input.num', { type: 'number', value: p[k], step: k ? 1 : 50, 'aria-label': ['F2', 'F1 shift', 'F2 shift'][k] + ' ' + (i + 1),
          on: { change: e => PG.editSettings(x => { x.shift.formant.curve[i][k] = +e.target.value; }) } }))),
          h('td', {}, h('button.linkish', { type: 'button', text: 'remove', on: { click: () => PG.editSettings(x => { x.shift.formant.curve.splice(i, 1); }) } })))));
      };
    } else if (c.kind === 'painter') {
      const info = h('span.muted');
      widget = h('div.painter-ctl', {},
        h('button.btn', { type: 'button', text: 'Paint on the vowel map', on: { click: () => PG.bus.emit('open-painter') } }),
        h('button.linkish', { type: 'button', text: 'Clear', on: { click: () => PG.editSettings(x => { x.shift.formant.painted.cells = []; }) } }), info);
      sync = s => { info.textContent = `${s.shift.formant.painted.cells.length} cells painted`; };
    }
    const lab = c.label ? h('label.ctl-label', { for: id, text: c.label }) : null;
    const stacked = ['choice', 'region', 'curve', 'painter'].includes(c.kind) || (c.kind === 'seg' && c.options.map(o => o[1]).join('').length > 18);
    const el = h('div.ctl' + (stacked ? '.stacked' : ''), { 'data-path': c.path || '' }, h('div.ctl-row', {}, lab, widget), h('div.ctl-foot', {}, c.desc ? desc : h('span'), h('span.ctl-extra', {}, reset, sweepBtn)));
    function toggleSweep() {
      if (sweepBox) { sweepBox.remove(); sweepBox = null; sweepBtn.setAttribute('aria-expanded', 'false'); return; }
      const [mn, mx, st] = rg(), v = +PG.controlValue(PG.state.settings, c) || 0;
      let vals;
      if (c.path === 'shift.formant.f1' || c.path === 'shift.formant.f2') vals = [-2, -1, 0, 1, 2].map(k => v + k * (PG.state.settings.shift.formant.units === 'pct' ? 10 : 100));
      else { const span = (mx - mn) / 8; vals = [-2, -1, 0, 1, 2].map(k => v + k * Math.max(st, Math.round(span / st) * st)); }
      vals = [...new Set(vals.map(x => Math.min(mx, Math.max(mn, +x.toFixed(4)))))];
      const inp = h('input.sweep-vals', { type: 'text', value: vals.join(', '), 'aria-label': `Values of ${c.label} to try` });
      sweepBox = h('div.sweep-box', {}, h('label', { text: 'Try these values' }), inp,
        h('button.btn.primary', { type: 'button', text: 'Run sweep', on: { click: () => {
          const vs = inp.value.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);
          if (vs.length) PG.bus.emit('sweep', { control: c, values: vs.slice(0, 8) });
          toggleSweep();
        } } }),
        h('p.ctl-desc', { text: 'Each value runs as its own trial from the current input; the results open side by side in Compare.' }));
      el.append(sweepBox); sweepBtn.setAttribute('aria-expanded', 'true'); inp.focus();
    }
    rows.push({ sync(s) {
      const vis = !c.show || c.show(s); el.hidden = !vis; if (!vis) return;
      sync && sync(s);
      if (reset) reset.hidden = !(c.param in s.listen);
      el.classList.toggle('changed', !!c.param && c.param in s.listen);
    } });
    return el;
  }

  function derived() {
    const el = h('p.derived');
    rows.push({ sync(s) {
      const m = S.compile(s).meta, minF0 = Math.round(3.2 / (m.windowMs / 1000));
      el.textContent = `Processing delay ${m.latencyMs.toFixed(1)} ms (nDelay × frame), before sound-card latency. Analysis window ${m.windowMs.toFixed(0)} ms: pitch below about ${minF0} Hz is not tracked reliably.`;
    } });
    return el;
  }

  function ostlink() {
    const pre = h('pre.ost-preview'), btn = h('button.btn', { type: 'button', on: { click: () => {
      const s = PG.state.settings;
      if (s.when.mode !== 'custom') { const c = S.compile(s); PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = c.ost || ''; x.when.pcf = c.pcf || ''; }); }
      PG.bus.emit('tab', 'design'); setTimeout(() => { const d = document.querySelector('.dz-adv'); if (d) { d.open = true; d.scrollIntoView(); } }, 80);
    } } });
    const el = h('div.ostlink', {}, h('details', {}, h('summary', { text: 'The OST and PCF this generates' }), pre), btn);
    rows.push({ sync(s) {
      const c = S.compile(s);
      pre.textContent = c.ost ? `# OST\n${c.ost}\n# PCF\n${c.pcf}` : 'No OST/PCF needed: the shift is set through the perturbation field.';
      btn.textContent = s.when.mode === 'custom' ? 'Edit the OST and PCF' : 'Copy to a custom OST/PCF and edit';
    } });
    return el;
  }

  function footer() {
    const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, on: { change: async e => {
      const f = e.target.files[0]; if (!f) return;
      try { PG.setSettings(JSON.parse(await f.text()), 'load'); PG.toast('Settings loaded.'); } catch (err) { PG.toast('That file is not a settings JSON: ' + err.message, 'error'); }
      e.target.value = '';
    } } });
    const build = h('select', { id: 'build-sel', on: { change: e => PG.editSettings(x => { x.build = e.target.value; }) } },
      Object.entries(PG.ENGINES).map(([v, i]) => h('option', { value: v, text: { lite: 'Shipped (recorders 10 s)', patched: 'Patched: OST-F1, OST-F2, I-01 fixed', full: 'Shipped, full size (30 s, ~310 MB)' }[v] || i.label })));
    rows.push({ sync(s) { build.value = s.build; } });
    return h('section.grp.grp-foot', {},
      h('div.ctl', {}, h('div.ctl-row', {}, h('label.ctl-label', { for: 'build-sel', text: 'Audapter build' }), h('div.ctl-w', {}, build)),
        h('p.ctl-desc', { text: 'The blab-lab core compiled to WebAssembly. "Patched" adds three one-line fixes from the audit; use it to see whether a result depends on those bugs.' })),
      h('div.btnrow', {},
        h('button.btn', { type: 'button', text: 'Save settings', on: { click: () => PG.Store.download(new Blob([JSON.stringify(PG.S.effective(PG.state.settings), null, 1)], { type: 'application/json' }), 'audapter-settings.json') } }),
        h('button.btn', { type: 'button', text: 'Load settings', on: { click: () => fileIn.click() } }), fileIn,
        h('button.btn', { type: 'button', text: 'Copy link', on: { click: async () => {
          const l = PG.Store.settingsLink(PG.state.settings);
          if (!l) return PG.toast('These settings are too large for a link (a painted field). Use Save settings.', 'error');
          history.replaceState(null, '', l); try { await navigator.clipboard.writeText(l); PG.toast('Link copied.'); } catch { PG.toast('Link is in the address bar.'); }
        } } }),
        h('button.btn', { type: 'button', text: 'Reset', on: { click: () => PG.setSettings(PG.S.defaultSettings(), 'load') } })),
      h('p.expert-link', {}, h('button.linkish', { type: 'button', text: 'Expert: all 87 Audapter parameters', on: { click: () => PG.ParamsUI.openExpert() } })));
  }

  function refresh() { const s = PG.state.settings; for (const r of rows) r.sync(s); PG.bus.emit('settings-rendered'); }

  // Warnings are computed by main (they need the input); place each under the card or group it concerns.
  function showWarnings(list) {
    if (!root) return;
    const map = { formant: 'formant', pitch: 'pitch', loudness: 'loudness', timing: 'timing', delay: 'delay', when: 'when', ost: 'when', pcf: 'when', listen: 'listen', hear: 'hear', run: 'run', build: 'hear' };
    for (const box of PG.$$('.warns', root)) PG.clear(box);
    const runBox = PG.$('#run-warns');
    if (runBox) PG.clear(runBox);
    for (const w of list) {
      const where = map[w.where] || 'listen';
      const box = where === 'run' ? runBox : PG.$(`.warns[data-where="${where}"]`, root) || PG.$('.warns[data-where="listen"]', root);
      if (!box) continue;
      box.append(PG.warnEl(w));
    }
  }
  return { mount, render, refresh };
})();

PG.warnEl = w => PG.h(`div.warn.w-${w.level}`, { role: w.level === 'error' ? 'alert' : null },
  PG.h('span.w-glyph', { 'aria-hidden': 'true' }), PG.h('span.w-lvl', { text: w.level === 'error' ? 'Will not run' : w.level === 'warn' ? 'Caution' : 'Note' }),
  w.id ? PG.h('span.w-id', { text: w.id }) : null, PG.h('span.w-text', { text: w.text }));
