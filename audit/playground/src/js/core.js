'use strict';
// Namespace, DOM helpers, small event bus, formatting, app state.
PG.DSP = self.DSP; PG.S = self.PGS;

PG.h = function h(tag, attrs, ...kids) {
  let [t, ...cls] = tag.split('.'), id = null;
  if (t.includes('#')) [t, id] = t.split('#');
  const el = t === 'svg' || PG.h.svgTags.has(t) ? document.createElementNS('http://www.w3.org/2000/svg', t) : document.createElement(t || 'div');
  if (cls.length) el.setAttribute('class', cls.join(' '));
  if (id) el.id = id;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.setAttribute('class', (el.getAttribute('class') ? el.getAttribute('class') + ' ' : '') + v);
    else if (k in el && !(el instanceof SVGElement) && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};
PG.h.svgTags = new Set(['g', 'path', 'line', 'rect', 'circle', 'text', 'polyline', 'polygon', 'title', 'desc', 'defs', 'marker', 'tspan', 'clipPath', 'use']);
PG.$ = (s, r = document) => r.querySelector(s);
PG.$$ = (s, r = document) => [...r.querySelectorAll(s)];
PG.clear = el => { el.replaceChildren(); return el; };

PG.bus = (() => {
  const m = new Map();
  return {
    on(ev, fn) { if (!m.has(ev)) m.set(ev, new Set()); m.get(ev).add(fn); return () => m.get(ev).delete(fn); },
    emit(ev, ...a) { for (const fn of m.get(ev) || []) { try { fn(...a); } catch (e) { console.error(ev, e); } } },
  };
})();

PG.fmt = {
  s: t => (t < 10 ? t.toFixed(2) : t.toFixed(1)) + ' s',
  hz: f => (Number.isFinite(f) && f > 0 ? Math.round(f) + ' Hz' : '–'),
  db: d => (Number.isFinite(d) ? (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(1) + ' dB' : '–'),
  mb: b => (b / 1048576).toFixed(0) + ' MB',
  signed: (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d),
  num: (v, d = 3) => (Number.isFinite(+v) ? String(+Number(v).toPrecision(d)) : String(v)),
};
PG.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
PG.debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.cancel = () => clearTimeout(t); return d; };
PG.median = a => { const v = Array.from(a).filter(x => Number.isFinite(x) && x > 0).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };

// ---------- application state
PG.state = {
  settings: PG.S.defaultSettings(),
  input: null,            // {id, kind, label, x: Float64Array @48k, meta}
  inputs: new Map(),      // id -> input (trials reference inputs by id)
  trials: [],             // every run; trial.kept marks the ones the user kept
  currentId: null,        // trial shown in the views
  selected: new Set(),    // trials ticked for compare / sequence
  view: 'spectro',
  autoRun: true,
  running: false,
};
PG.trial = id => PG.state.trials.find(t => t.id === id) || null;
PG.current = () => PG.trial(PG.state.currentId);
PG.setSettings = (s, why) => { PG.state.settings = PG.S.normalize(s); PG.bus.emit('settings', why); };
PG.editSettings = (fn, why) => { const s = PG.S.clone(PG.state.settings); fn(s); PG.setSettings(s, why || 'edit'); };

// Theme follows the OS unless the user picks one.
PG.theme = {
  init() { const t = localStorage.getItem('pg-theme'); if (t) document.documentElement.dataset.theme = t; },
  toggle() {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx; localStorage.setItem('pg-theme', nx); PG.bus.emit('theme');
  },
  dark() { return (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'; },
};
PG.css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
