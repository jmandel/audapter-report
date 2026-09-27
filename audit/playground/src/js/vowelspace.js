'use strict';
// F1-F2 vowel space: Peterson & Barney backdrop, the perturbation field as arrows, and one trial's trajectories:
// input formants (grey), shifted targets (hollow), output formants measured independently (blue). Also the 2-D field painter.
PG.Vowel = (() => {
  const { h } = PG, S = PG.S, NS = 'http://www.w3.org/2000/svg';
  let allFrames = false, root, svg, tip, trial = null, paint = false, brush = { d1: 20, d2: 0, radius: 120, erase: false }, liveCells = null, headG = null;
  const M = { l: 58, r: 14, t: 14, b: 44 };
  let W = 600, H = 440, R = { f1: [150, 1150], f2: [3400, 500] };
  const x = f2 => M.l + (R.f2[0] - f2) / (R.f2[0] - R.f2[1]) * (W - M.l - M.r);
  const y = f1 => M.t + (f1 - R.f1[0]) / (R.f1[1] - R.f1[0]) * (H - M.t - M.b);
  const f2Of = px => R.f2[0] - (px - M.l) / (W - M.l - M.r) * (R.f2[0] - R.f2[1]);
  const f1Of = py => R.f1[0] + (py - M.t) / (H - M.t - M.b) * (R.f1[1] - R.f1[0]);
  const el = (tag, a = {}, ...k) => { const e = document.createElementNS(NS, tag); for (const [n, v] of Object.entries(a)) if (v !== null && v !== undefined) e.setAttribute(n, v); for (const c of k) if (c) e.append(c); return e; };

  function mount(container) {
    root = container;
    PG.bus.on('settings', () => { if (root.isConnected && !root.hidden) render(); });
    PG.bus.on('theme', () => root.isConnected && render());
    PG.bus.on('open-painter', () => { paint = true; });
    new ResizeObserver(() => { if (root.isConnected && root.clientWidth && Math.abs(root.clientWidth - W) > 4) render(); }).observe(root);
    requestAnimationFrame(tickHead);
  }
  function setTrial(t) { trial = t; render(); }
  function setPaint(on) { paint = on; render(); }

  // displacement (dF1, dF2) in Hz at (f1, f2) from the settings, or null if no shift there
  function fieldAt(s, f1, f2, uniform) {
    const F = s.shift.formant; if (!F.on) return null;
    if (uniform === undefined) uniform = S.compile(s).meta.needPcf;
    let d1 = F.f1, d2 = F.f2;
    if (!uniform && F.field === 'region') { const r = F.region; if (f1 < r.f1min || f1 > r.f1max || f2 < r.f2min || f2 > r.f2max) return null; }
    if (!uniform && F.field === 'curve') {
      const p = [...F.curve].sort((a, b) => a[0] - b[0]); if (!p.length) return null;
      if (f2 <= p[0][0]) [, d1, d2] = p[0]; else if (f2 >= p[p.length - 1][0]) [, d1, d2] = p[p.length - 1];
      else for (let k = 0; k < p.length - 1; k++) if (f2 >= p[k][0] && f2 <= p[k + 1][0]) { const u = (f2 - p[k][0]) / (p[k + 1][0] - p[k][0]); d1 = p[k][1] + u * (p[k + 1][1] - p[k][1]); d2 = p[k][2] + u * (p[k + 1][2] - p[k][2]); break; }
    }
    if (!uniform && F.field === 'painted') {
      const cells = liveCells || F.painted.cells, res = F.painted.res || 4, ci = Math.floor(f1 / S.FMAX * 256 / res), cj = Math.floor(f2 / S.FMAX * 256 / res);
      const c2 = cells.find(q => q[0] === ci && q[1] === cj); if (!c2) return null; d1 = c2[2]; d2 = c2[3];
    }
    if (!d1 && !d2) return null;
    if (F.units === 'pct') return [f1 * d1 / 100, f2 * d2 / 100];
    if (F.units === 'hz') return [d1, d2];
    const mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);
    return [mel2hz(S.hz2mel(f1) + d1) - f1, mel2hz(S.hz2mel(f2) + d2) - f2];
  }

  function render() {
    if (!root) return;
    PG.clear(root);
    const s = PG.state.settings, talker = PG.talkerFor(s.preset), V = PG.VOWELS[talker];
    R = talker === 'children' ? { f1: [200, 1250], f2: [3700, 600] } : talker === 'women' ? { f1: [200, 1150], f2: [3300, 600] } : { f1: [150, 1000], f2: [2800, 500] };
    const r = trial && trial.result;
    if (r) {   // widen to fit the data
      const f1s = [...r.fmts[0], ...r.sfmts[0]].filter(v => v > 0), f2s = [...r.fmts[1], ...r.sfmts[1]].filter(v => v > 0);
      if (f1s.length) { R.f1 = [Math.max(80, Math.min(R.f1[0], quant(f1s, 0.05) * 0.9)), Math.max(R.f1[1], Math.min(1400, quant(f1s, 0.95) * 1.08))]; R.f2 = [Math.max(R.f2[0], Math.min(4200, quant(f2s, 0.95) * 1.05)), Math.min(R.f2[1], quant(f2s, 0.05) * 0.92)]; }
    }
    W = Math.max(300, root.clientWidth || 600); H = Math.round(Math.min(560, Math.max(300, W * 0.66)));
    const legend = h('div.legend-row', {},
      PG.Views.key('in', 'input formants (fmts)'), PG.Views.key('exp', 'shifted targets (sfmts)'), PG.Views.key('obsdot', 'output formants (independent LPC)'),
      PG.Views.key('arrow', 'perturbation field'),
      h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: allFrames, on: { change: e => { allFrames = e.target.checked; render(); } } }), ' all tracked frames (default: the loudest, within 10 dB of the peak)'),
      h('span.muted', { text: `Backdrop: Peterson & Barney (1952) averages for ${talker}. Click a vowel symbol to use it for the synthetic vowel.` }));
    const tools = paintTools(s);
    svg = el('svg', { class: 'vspace', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'F1–F2 vowel space' });
    svg.append(el('title', {}, document.createTextNode(r ? `Vowel space for ${trial.name}: input, shifted targets and output formants` : 'Vowel space')));
    tip = h('div.tip'); tip.hidden = true;
    root.append(legend, tools || '', h('div.vs-wrap', {}, svg, tip));
    axes();
    // backdrop
    const bg = el('g', { class: 'vs-bg' });
    V.forEach(([f1, f2], i) => {
      const t = el('text', { x: x(f2), y: y(f1), class: 'vs-ipa', 'text-anchor': 'middle', 'dominant-baseline': 'central', tabindex: 0, role: 'button', 'aria-label': `Use /${PG.VOWELS.list[i][0]}/ for the synthetic vowel` }, document.createTextNode(PG.VOWELS.list[i][0]));
      t.addEventListener('click', () => { if (PG.synthPick) { PG.synthPick(f1, f2); PG.toast(`Synthetic vowel set to /${PG.VOWELS.list[i][0]}/. Make it under Input, Synthetic vowel.`); } });
      bg.append(t);
    });
    svg.append(bg);
    field(s);
    if (r) trajectories(r);
    headG = el('g', { class: 'vs-head' }); svg.append(headG);
    if (paint && s.shift.formant.field === 'painted') attachPainter(s);
    else hover();
    if (!r) svg.append(el('text', { x: W / 2, y: H / 2, class: 'vs-empty', 'text-anchor': 'middle' }, document.createTextNode('Run a trial to see its formants here.')));
  }
  const quant = (a, q) => { const v = [...a].sort((p, q2) => p - q2); return v[Math.min(v.length - 1, Math.floor(q * v.length))]; };

  function axes() {
    const g = el('g', { class: 'vs-axes' });
    for (let f2 = Math.ceil(R.f2[1] / 500) * 500; f2 <= R.f2[0]; f2 += 500) { g.append(el('line', { x1: x(f2), x2: x(f2), y1: M.t, y2: H - M.b, class: 'grid' })); g.append(el('text', { x: x(f2), y: H - M.b + 16, 'text-anchor': 'middle' }, document.createTextNode(f2))); }
    for (let f1 = Math.ceil(R.f1[0] / 200) * 200; f1 <= R.f1[1]; f1 += 200) { g.append(el('line', { x1: M.l, x2: W - M.r, y1: y(f1), y2: y(f1), class: 'grid' })); g.append(el('text', { x: M.l - 6, y: y(f1), 'text-anchor': 'end', 'dominant-baseline': 'central' }, document.createTextNode(f1))); }
    g.append(el('text', { x: (M.l + W - M.r) / 2, y: H - 8, 'text-anchor': 'middle', class: 'ax-lab' }, document.createTextNode('F2 (Hz), front ← → back')));
    g.append(el('text', { x: 14, y: (M.t + H - M.b) / 2, 'text-anchor': 'middle', class: 'ax-lab', transform: `rotate(-90 14 ${(M.t + H - M.b) / 2})` }, document.createTextNode('F1 (Hz), close ↑ ↓ open')));
    svg.append(g);
  }
  function arrow(g, f1, f2, d, cls) {
    const x0 = x(f2), y0 = y(f1), x1 = x(f2 + d[1]), y1 = y(f1 + d[0]), L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1.5) return;
    const a = Math.atan2(y1 - y0, x1 - x0), hl = Math.min(6, L * 0.4);
    g.append(el('path', { d: `M${x0},${y0}L${x1},${y1}M${x1 - hl * Math.cos(a - 0.45)},${y1 - hl * Math.sin(a - 0.45)}L${x1},${y1}L${x1 - hl * Math.cos(a + 0.45)},${y1 - hl * Math.sin(a + 0.45)}`, class: cls }));
  }
  function field(s) {
    const g = el('g', { class: 'vs-field' });
    const F = s.shift.formant, uniform = S.compile(s).meta.needPcf;
    if (F.field === 'painted' && !uniform) {
      const res = F.painted.res || 4, step = S.FMAX / 256 * res;
      for (const [ci, cj] of liveCells || F.painted.cells) {
        const a1 = ci * step, a2 = cj * step;
        if (a1 > R.f1[1] || a2 > R.f2[0]) continue;
        g.append(el('rect', { x: x(a2 + step), y: y(a1), width: Math.abs(x(a2) - x(a2 + step)), height: Math.abs(y(a1 + step) - y(a1)), class: 'vs-cell' }));
      }
    }
    const nx = Math.max(6, Math.round((W - M.l - M.r) / 60)), ny = Math.max(5, Math.round((H - M.t - M.b) / 55));
    for (let i = 0; i <= ny; i++) for (let j = 0; j <= nx; j++) {
      const f1 = R.f1[0] + (i + 0.5) / (ny + 1) * (R.f1[1] - R.f1[0]), f2 = R.f2[1] + (j + 0.5) / (nx + 1) * (R.f2[0] - R.f2[1]);
      const d = fieldAt(s, f1, f2, uniform); if (d) arrow(g, f1, f2, d, 'vs-arrow');
    }
    svg.append(g);
  }
  let pts = [];
  function trajectories(r) {
    const A = r.analysis, dt = 1 / r.frameRate, g = el('g', { class: 'vs-traj' });
    pts = [];
    const dec = (n, max) => Math.max(1, Math.ceil(n / max));
    // By default only the loud (vowel-like) frames: Audapter RMS within 10 dB of its maximum.
    let mx = 0; for (const v of r.rms[0]) if (v > mx) mx = v;
    const strong = t => { if (allFrames) return true; const k = Math.round(t * r.frameRate); return k >= 0 && k < r.rms[0].length && r.rms[0][k] >= 0.316 * mx; };
    const addSet = (f1a, f2a, hop, cls, radius, kind, line) => {
      const st = dec(f1a.length, line ? 700 : 260);
      let d = '', prev = -1;
      for (let i = 0; i < f1a.length; i += st) {
        const a = f1a[i], b = f2a[i]; if (!(a > 0 && b > 0) || !strong(i * hop) || a < R.f1[0] || a > R.f1[1] || b > R.f2[0] || b < R.f2[1]) continue;
        if (line) { d += (prev === i - st ? 'L' : 'M') + x(b).toFixed(1) + ',' + y(a).toFixed(1); prev = i; }
        g.append(el('circle', { cx: x(b), cy: y(a), r: radius, class: cls }));
        pts.push({ t: i * hop, f1: a, f2: b, kind, px: x(b), py: y(a) });
      }
      if (d) g.insertBefore(el('path', { d, class: 'vs-line' }), g.firstChild);
    };
    addSet(r.fmts[0], r.fmts[1], dt, 'vs-in', 1.6, 'input (tracked)', true);
    addSet(A.lpcOut.f[0], A.lpcOut.f[1], A.lpcOut.hop, 'vs-out', 2, 'output (LPC)');
    addSet(r.sfmts[0], r.sfmts[1], dt, 'vs-tgt', 3, 'target');
    svg.append(g);
    // medians
    const med = (a, b) => { const k = []; for (let i = 0; i < a.length; i++) if (a[i] > 0 && b[i] > 0) k.push(i); return k.length ? [PG.median(k.map(i => a[i])), PG.median(k.map(i => b[i]))] : null; };
    const mi = med(r.fmts[0], r.fmts[1]), mt = med(r.sfmts[0], r.sfmts[1]), mo = med(A.lpcOut.f[0], A.lpcOut.f[1]);
    const gm = el('g', { class: 'vs-means' });
    if (mi && mt) arrow(gm, mi[0], mi[1], [mt[0] - mi[0], mt[1] - mi[1]], 'vs-mean-arrow');
    if (mi) gm.append(el('circle', { cx: x(mi[1]), cy: y(mi[0]), r: 7, class: 'vs-in m' }, el('title', {}, document.createTextNode(`input median F1 ${Math.round(mi[0])}, F2 ${Math.round(mi[1])} Hz`))));
    if (mt) gm.append(el('circle', { cx: x(mt[1]), cy: y(mt[0]), r: 7, class: 'vs-tgt m' }, el('title', {}, document.createTextNode(`target median F1 ${Math.round(mt[0])}, F2 ${Math.round(mt[1])} Hz`))));
    if (mo) gm.append(el('circle', { cx: x(mo[1]), cy: y(mo[0]), r: 7, class: 'vs-out m' }, el('title', {}, document.createTextNode(`output median F1 ${Math.round(mo[0])}, F2 ${Math.round(mo[1])} Hz (independent LPC)`))));
    svg.append(gm);
  }
  function hover() {
    svg.addEventListener('pointermove', e => {
      const b = svg.getBoundingClientRect(), px = (e.clientX - b.left) * W / b.width, py = (e.clientY - b.top) * H / b.height;
      let best = null, bd = 24 * 24;
      for (const p of pts) { const d = (p.px - px) ** 2 + (p.py - py) ** 2; if (d < bd) { bd = d; best = p; } }
      if (!best) { tip.hidden = true; return; }
      PG.clear(tip); tip.append(h('div.tip-t', { text: `${best.t.toFixed(3)} s, ${best.kind}` }), h('div', { text: `F1 ${Math.round(best.f1)} Hz, F2 ${Math.round(best.f2)} Hz` }));
      tip.hidden = false; tip.style.left = Math.min(b.width - 180, e.clientX - b.left + 12) + 'px'; tip.style.top = (e.clientY - b.top + 8) + 'px';
      svg.dataset.hoverT = best.t;
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    svg.addEventListener('click', () => { if (svg.dataset.hoverT) PG.Tiers.setCursor(+svg.dataset.hoverT); });
  }
  // moving marker at the playhead (or cursor) time
  function tickHead() {
    requestAnimationFrame(tickHead);
    if (!headG || !trial || !trial.result || !svg || !svg.isConnected) return;
    const p = PG.Audio.position(), t = p ? p.t : PG.Tiers.cursor();
    PG.clear(headG);
    if (t === null || t === undefined) return;
    const r = trial.result, i = Math.round(t * r.frameRate);
    if (i < 0 || i >= r.fmts[0].length) return;
    const a = r.fmts[0][i], b = r.fmts[1][i], c = r.sfmts[0][i], d = r.sfmts[1][i];
    if (a > 0 && b > 0) headG.append(el('circle', { cx: x(b), cy: y(a), r: 9, class: 'vs-headring' }));
    if (c > 0 && d > 0) headG.append(el('circle', { cx: x(d), cy: y(c), r: 9, class: 'vs-headring' }));
  }

  function paintTools(s) {
    const F = s.shift.formant;
    if (F.field !== 'painted') return null;
    const u = F.units === 'pct' ? '%' : F.units;
    const num = (k, lab, step) => h('label.syn', {}, h('span', { text: lab }), h('input.num', { type: 'number', step, value: brush[k], on: { change: e => { brush[k] = +e.target.value; } } }), h('span.unit', { text: k === 'radius' ? 'Hz' : u }));
    return h('div.paint-tools', {},
      h('button.btn' + (paint ? '.primary' : ''), { type: 'button', text: paint ? 'Painting: drag on the map' : 'Paint the field', 'aria-pressed': String(paint), on: { click: () => setPaint(!paint) } }),
      num('d1', 'F1 shift', 1), num('d2', 'F2 shift', 1), num('radius', 'Brush radius', 10),
      h('label.syn', {}, h('input', { type: 'checkbox', checked: brush.erase, on: { change: e => { brush.erase = e.target.checked; } } }), h('span', { text: 'Erase' })),
      h('span.muted', { text: `${F.painted.cells.length} cells of ${Math.round(S.FMAX / 256 * (F.painted.res || 4))} Hz. Audapter reads the lower-left 19.5 Hz cell, without interpolation.` }));
  }
  function attachPainter(s) {
    const res = s.shift.formant.painted.res || 4, step = S.FMAX / 256 * res;
    liveCells = s.shift.formant.painted.cells.map(c => [...c]);
    svg.classList.add('painting');
    let down = false;
    const at = e => { const b = svg.getBoundingClientRect(); return [f1Of((e.clientY - b.top) * H / b.height), f2Of((e.clientX - b.left) * W / b.width)]; };
    const apply = e => {
      const [f1, f2] = at(e), rr = brush.radius;
      for (let ci = Math.floor((f1 - rr) / step); ci <= Math.ceil((f1 + rr) / step); ci++) for (let cj = Math.floor((f2 - 2 * rr) / step); cj <= Math.ceil((f2 + 2 * rr) / step); cj++) {
        if (ci < 0 || cj < 0 || ci > 256 / res || cj > 256 / res) continue;
        const c1 = (ci + 0.5) * step, c2 = (cj + 0.5) * step;
        if (Math.hypot(c1 - f1, (c2 - f2) / 2) > rr) continue;
        const k = liveCells.findIndex(q => q[0] === ci && q[1] === cj);
        if (brush.erase) { if (k >= 0) liveCells.splice(k, 1); }
        else if (k >= 0) liveCells[k] = [ci, cj, brush.d1, brush.d2]; else liveCells.push([ci, cj, brush.d1, brush.d2]);
      }
      const old = PG.$('.vs-field', svg); if (old) old.remove();
      field(PG.S.normalize({ ...PG.state.settings, shift: { ...PG.state.settings.shift, formant: { ...PG.state.settings.shift.formant, painted: { res, cells: liveCells } } } }));
      const f = PG.$('.vs-field', svg); svg.insertBefore(f, PG.$('.vs-traj', svg) || headG);
    };
    svg.addEventListener('pointerdown', e => { down = true; svg.setPointerCapture(e.pointerId); apply(e); });
    svg.addEventListener('pointermove', e => { if (down) apply(e); });
    svg.addEventListener('pointerup', () => { if (!down) return; down = false; const cells = liveCells; liveCells = null; PG.editSettings(x2 => { x2.shift.formant.painted.cells = cells; }, 'paint'); });
  }
  return { mount, setTrial, render, setPaint, fieldAt };
})();
