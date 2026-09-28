'use strict';
// Trial list: every run, newest first by default; sort by a setting, filter, tick for compare / session runs,
// keep or discard drafts, rename, tag and annotate.
PG.TrialsUI = (() => {
  const { h, S } = PG;
  let root, listEl, filter = '', sortKey = 'new';

  function mount(el) {
    root = el;
    PG.bus.on('trials', render); PG.bus.on('current', render);
    render();
  }
  const sortable = () => [['new', 'Newest first'], ['old', 'Oldest first'], ['name', 'Name'],
    ...PG.allControls().filter(c => c.kind === 'range' || c.kind === 'number' || c.kind === 'select' || c.kind === 'seg').map(c => ['p:' + c.path, `${c.card ? c.card.title + ': ' : ''}${c.label}`])];
  const valueOf = (t, path) => { const c = PG.controlByPath(path); const s = S.normalize(t.settings); return c ? PG.controlValue(s, c) : S.getPath(s, path); };

  function render() {
    if (!root) return;
    PG.clear(root);
    const all = PG.state.trials;
    const head = h('div.tl-head', {},
      h('h2.grp-title', {}, 'Trials ', h('span.count', { text: String(all.length) })),
      h('input.filter', { type: 'search', placeholder: 'Filter by name, setting or tag', value: filter, 'aria-label': 'Filter trials',
        on: { input: e => { filter = e.target.value; renderList(); } } }),
      h('select', { 'aria-label': 'Sort trials', on: { change: e => { sortKey = e.target.value; renderList(); } } }, sortable().map(([v, l]) => h('option', { value: v, text: 'Sort: ' + l, selected: v === sortKey }))));
    const n = PG.state.selected.size;
    const actions = h('div.tl-actions', {},
      h('button.btn', { type: 'button', text: n >= 2 ? `Compare ${n}` : 'Compare', disabled: all.length < 2, on: { click: () => PG.bus.emit('view', 'compare') } }),
      h('button.btn', { type: 'button', text: 'Run ticked as one session', disabled: n < 2, title: 'Run the ticked trials in order in ONE Audapter instance, so state carries over between them',
        on: { click: () => PG.bus.emit('run-sequence', [...PG.state.selected]) } }),
      h('button.linkish', { type: 'button', text: n ? 'Untick all' : 'Tick all', on: { click: () => { if (n) PG.state.selected.clear(); else all.forEach(t => PG.state.selected.add(t.id)); render(); PG.bus.emit('selection'); } } }),
      h('button.linkish', { type: 'button', text: 'Delete ticked', disabled: !n, on: { click: () => { for (const id of [...PG.state.selected]) remove(id); PG.state.selected.clear(); PG.bus.emit('trials'); } } }));
    listEl = h('ol.tl-list', { 'aria-label': 'Trials' });
    const fileIn = h('input', { type: 'file', accept: '.zip', hidden: true, on: { change: async e => { const f = e.target.files[0]; if (f) PG.bus.emit('import-session', new Uint8Array(await f.arrayBuffer())); e.target.value = ''; } } });
    const io = h('div.tl-io', {},
      h('button.linkish', { type: 'button', text: 'Export session (zip)', disabled: !all.some(t => t.result), on: { click: () => PG.bus.emit('export-session') } }),
      h('button.linkish', { type: 'button', text: 'Import session', on: { click: () => fileIn.click() } }), fileIn,
      h('span.muted', { text: 'Kept trials are saved in this browser.' }));
    root.append(head, actions, listEl, editor(), io);
    renderList();
  }

  function renderList() {
    PG.clear(listEl);
    PG.Cases.renderGroups(listEl, render);   // a loaded test case: one row per trial under a case header
    let T = PG.state.trials.filter(t => !t.caseRef);
    const q = filter.trim().toLowerCase();
    if (q) T = T.filter(t => [t.name, t.summary, (t.tags || []).join(' '), t.notes, (PG.state.inputs.get(t.inputId) || {}).label].join(' ').toLowerCase().includes(q));
    const sk = sortKey.startsWith('p:') ? sortKey.slice(2) : null;
    if (sortKey === 'new') T.reverse();
    else if (sortKey === 'name') T.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    else if (sk) T.sort((a, b) => { const va = valueOf(a, sk), vb = valueOf(b, sk); return (typeof va === 'number' && typeof vb === 'number') ? va - vb : String(va).localeCompare(String(vb)); });
    if (!T.length) { if (!listEl.children.length) listEl.append(h('li.empty', { text: PG.state.trials.length ? 'No trial matches the filter.' : 'No trials yet. Choose an input: the current settings run automatically.' })); return; }
    if (listEl.children.length) listEl.append(h('li.case-head', {}, h('b', { text: 'Other trials' })));
    for (const t of T) {
      const cur = t.id === PG.state.currentId;
      const cb = h('input', { type: 'checkbox', checked: PG.state.selected.has(t.id), 'aria-label': `Tick ${t.name}`,
        on: { change: e => { if (e.target.checked) PG.state.selected.add(t.id); else PG.state.selected.delete(t.id); render(); PG.bus.emit('selection'); } } });
      const inp = PG.state.inputs.get(t.inputId);
      const badges = [];
      if (!t.kept) badges.push(h('span.badge.draft', { text: 'draft' }));
      if (t.error) badges.push(h('span.badge.err', { text: t.hang ? 'hung' : 'failed' }));
      if (t.seq) badges.push(h('span.badge', { text: `session ${t.seq.n}, #${t.seq.index + 1}` }));
      if (t.variant && t.variant !== 'lite') badges.push(h('span.badge', { text: t.variant }));
      if (sk) badges.push(h('span.badge.val', { text: `${String(valueOf(t, sk))}` }));
      listEl.append(h('li.tl-item' + (cur ? '.current' : ''), { 'aria-current': cur ? 'true' : null }, cb,
        h('button.tl-open', { type: 'button', on: { click: () => PG.bus.emit('show-trial', t.id) } },
          h('span.tl-name', { text: t.name }), badges,
          h('span.tl-sum', { text: t.summary }),
          h('span.tl-inp', { text: inp ? inp.label : '' })),
        !t.kept ? h('button.linkish.keep', { type: 'button', text: 'Keep', on: { click: () => keep(t) } }) : null));
    }
  }

  function editor() {
    const t = PG.current();
    if (!t) return h('div');
    const name = h('input', { type: 'text', value: t.name, 'aria-label': 'Trial name', on: { change: e => { t.name = e.target.value || t.name; save(t); render(); } } });
    const tags = h('input', { type: 'text', value: (t.tags || []).join(', '), placeholder: 'tags, comma separated', 'aria-label': 'Tags', on: { change: e => { t.tags = e.target.value.split(',').map(x => x.trim()).filter(Boolean); save(t); render(); } } });
    const notes = h('textarea', { rows: 2, placeholder: 'Notes', 'aria-label': 'Notes', text: t.notes || '', on: { change: e => { t.notes = e.target.value; save(t); } } });
    return h('details.tl-edit', { open: false }, h('summary', { text: `This trial: ${t.name}` }),
      h('div.tl-edit-grid', {}, name, tags, notes),
      h('div.btnrow', {},
        h('button.btn', { type: 'button', text: 'Use these settings', title: 'Load this trial\'s settings into the controls', on: { click: () => { PG.setSettings(S.clone(t.settings), 'load'); PG.toast(`Settings of ${t.name} loaded.`); } } }),
        h('button.btn', { type: 'button', text: 'Use this input', on: { click: () => { const i = PG.state.inputs.get(t.inputId); if (i) { PG.state.input = i; PG.bus.emit('input', i); } } } }),
        !t.kept ? h('button.btn', { type: 'button', text: 'Keep', on: { click: () => keep(t) } }) : null,
        h('button.linkish', { type: 'button', text: 'Delete', on: { click: () => { remove(t.id); PG.bus.emit('trials'); } } })));
  }
  function keep(t) { t.kept = true; save(t); PG.bus.emit('trials'); }
  function save(t) { if (t.kept) PG.Store.saveTrial(t); }
  function remove(id) {
    const i = PG.state.trials.findIndex(t => t.id === id); if (i < 0) return;
    PG.state.trials.splice(i, 1); PG.state.selected.delete(id); PG.Store.deleteTrial(id);
    if (PG.state.currentId === id) { const last = PG.state.trials[PG.state.trials.length - 1]; PG.state.currentId = last ? last.id : null; PG.bus.emit('current'); }
  }
  return { mount, render, keep, remove };
})();
