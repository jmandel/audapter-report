'use strict';
// Time-aligned tiers in the Praat TextGrid style: labels in a left column, one shared time axis, hairline boundaries.
// Tier kinds: 'wave', 'spec' (spectrogram + formant overlays), 'lines' (continuous values), 'intervals'.
// Encodings (the report's): input grey, expected hollow ink, observed blue, discrepancy orange.
PG.Tiers = (() => {
  const { h } = PG;
  const zoom = { t0: 0, t1: 1, dur: 1 };
  let cursor = null;   // time the user clicked (playback starts there)
  const stacks = new Set();

  function col() {
    return { ink: PG.css('--ink'), ink2: PG.css('--ink-2'), ink3: PG.css('--ink-3'), paper: PG.css('--paper'), surface: PG.css('--surface'), rule: PG.css('--rule'),
      input: PG.css('--input'), obs: PG.css('--observed'), disc: PG.css('--disc'), discFill: PG.css('--disc-fill'), context: PG.css('--context'), dark: PG.theme.dark() };
  }
  function setDuration(d, keep) { const nd = Math.max(0.05, d), same = Math.abs(nd - zoom.dur) < 1e-6; zoom.dur = nd; if (!keep || !same || zoom.t1 > zoom.dur + 1e-9) { zoom.t0 = 0; zoom.t1 = zoom.dur; } redrawAll(); }
  function setZoom(t0, t1) {
    const span = Math.max(0.02, Math.min(zoom.dur, t1 - t0));
    t0 = Math.max(0, Math.min(zoom.dur - span, t0)); zoom.t0 = t0; zoom.t1 = t0 + span; redrawAll(); PG.bus.emit('zoom', zoom);
  }
  const zoomBy = (f, at) => { const c = at ?? (zoom.t0 + zoom.t1) / 2, s = (zoom.t1 - zoom.t0) * f; setZoom(c - (c - zoom.t0) * f, c - (c - zoom.t0) * f + s); };
  const fit = () => setZoom(0, zoom.dur);
  function redrawAll() { for (const s of stacks) s.draw(); }

  // A stack of tiers sharing the zoom, hover crosshair, cursor and playhead.
  function Stack(container, { tiers, compact = false, axis = true, t0Offset = 0 } = {}) {
    const narrow = !compact && container.clientWidth > 0 && container.clientWidth < 560, LW = compact || narrow ? 0 : 150;
    const rowsEl = h('div.tiers-rows');
    const hair = h('div.hair', { 'aria-hidden': 'true' }), play = h('div.playhead', { 'aria-hidden': 'true' }), cur = h('div.cursor', { 'aria-hidden': 'true' });
    const tip = h('div.tip', { role: 'status' });
    const axisC = axis ? h('canvas.axis') : null;
    const plot = h('div.tiers-plot', {}, rowsEl, hair, cur, play);
    const el = h('div.tiers' + (narrow ? '.narrow' : ''), {}, plot, axisC ? h('div.axis-row', {}, LW ? h('div.axis-lab', { text: 'time (s)' }) : null, axisC) : null, tip);
    el.style.setProperty('--lw', LW + 'px');
    container.append(el);
    const T = tiers.map(t => {
      const cv = h('canvas.tier-c', { role: 'img', 'aria-label': t.alt || t.label });
      const lab = compact ? null : h('div.tier-lab', {}, h('div.tl-name', { text: t.label }), t.sub ? h('div.tl-sub', { text: t.sub }) : null, t.key ? t.key() : null);
      const row = h('div.tier', { style: { height: t.height + 'px', minHeight: compact ? '' : '40px' } }, lab, cv);
      rowsEl.append(row);
      return { ...t, cv, row };
    });
    const W = () => Math.max(50, rowsEl.clientWidth - LW);
    const xOf = (t, w) => (t - zoom.t0) / (zoom.t1 - zoom.t0) * w;
    const tOf = px => zoom.t0 + px / W() * (zoom.t1 - zoom.t0);
    const api = {
      el,
      draw() {
        const w = W(), dpr = Math.min(2, self.devicePixelRatio || 1), C = col();
        for (const t of T) {
          const hgt = t.height;
          t.cv.width = Math.round(w * dpr); t.cv.height = Math.round(hgt * dpr); t.cv.style.width = w + 'px'; t.cv.style.height = hgt + 'px';
          const g = t.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, hgt);
          try { t.draw(g, w, hgt, tt => xOf(tt, w), C, zoom); } catch (e) { console.error('tier', t.label, e); }
          g.strokeStyle = C.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(0, hgt - 0.5); g.lineTo(w, hgt - 0.5); g.stroke();
        }
        if (axisC) drawAxis(axisC, w, C);
        api.placeCursor();
      },
      placeCursor() { if (cursor === null) { cur.hidden = true; return; } const x = xOf(cursor, W()); cur.hidden = x < 0 || x > W(); cur.style.left = (LW + x) + 'px'; },
      playhead(t) { if (t === null) { play.hidden = true; return; } const x = xOf(t, W()); play.hidden = x < 0 || x > W(); play.style.left = (LW + x) + 'px'; },
      destroy() { stacks.delete(api); ro.disconnect(); el.remove(); },
    };
    function drawAxis(c, w, C) {
      const dpr = Math.min(2, self.devicePixelRatio || 1); c.width = w * dpr; c.height = 22 * dpr; c.style.width = w + 'px'; c.style.height = '22px';
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const span = zoom.t1 - zoom.t0, steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10];
      const st = steps.find(s => w / (span / s) >= 60) || 10;
      g.fillStyle = C.ink3; g.strokeStyle = C.rule; g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'top';
      for (let t = Math.ceil(zoom.t0 / st) * st; t <= zoom.t1 + 1e-9; t += st) {
        const x = xOf(t, w); g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 4); g.stroke();
        const s = (t + t0Offset).toFixed(st < 0.1 ? 2 : st < 1 ? 1 : 0);
        g.fillText(s, Math.min(w - g.measureText(s).width, Math.max(0, x - g.measureText(s).width / 2)), 6);
      }
    }
    // interaction: hover crosshair + readout, click to place the cursor, drag to pan, wheel/pinch to zoom
    let drag = null;
    plot.addEventListener('pointermove', e => {
      const r = rowsEl.getBoundingClientRect(), px = e.clientX - r.left - LW;
      if (drag) { const dt = (drag.x - e.clientX) / W() * (drag.t1 - drag.t0); if (Math.abs(drag.x - e.clientX) > 3) drag.moved = true; setZoom(drag.t0 + dt, drag.t1 + dt); return; }
      if (px < 0 || px > W()) { hair.hidden = true; tip.hidden = true; return; }
      const t = tOf(px); hair.hidden = false; hair.style.left = (LW + px) + 'px';
      showTip(t, e.clientX - el.getBoundingClientRect().left, e.clientY - el.getBoundingClientRect().top);
    });
    plot.addEventListener('pointerleave', () => { hair.hidden = true; tip.hidden = true; });
    plot.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { x: e.clientX, t0: zoom.t0, t1: zoom.t1, moved: false }; plot.setPointerCapture(e.pointerId); });
    plot.addEventListener('pointerup', e => {
      const d = drag; drag = null; if (!d || d.moved) return;
      const r = rowsEl.getBoundingClientRect(), px = e.clientX - r.left - LW; if (px < 0) return;
      setCursor(tOf(px));
    });
    plot.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey)) return;
      e.preventDefault();
      const r = rowsEl.getBoundingClientRect(), t = tOf(e.clientX - r.left - LW);
      if (e.ctrlKey || e.metaKey) zoomBy(Math.exp(e.deltaY * 0.01), t);
      else { const dt = (e.deltaX || e.deltaY) / W() * (zoom.t1 - zoom.t0); setZoom(zoom.t0 + dt, zoom.t1 + dt); }
    }, { passive: false });
    plot.addEventListener('dblclick', () => fit());
    function showTip(t, x, y) {
      const lines = [];
      for (const tr of T) if (tr.readout) for (const r of tr.readout(t) || []) lines.push(r);
      if (!lines.length) { tip.hidden = true; return; }
      PG.clear(tip);
      tip.append(h('div.tip-t', { text: `${(t + t0Offset).toFixed(3)} s` }));
      for (const r of lines) tip.append(h('div.tip-r', {}, h(`span.key.k-${r.style || 'none'}`), h('b', { text: r.value }), h('span', { text: ' ' + r.label })));
      tip.hidden = false;
      const tw = tip.offsetWidth, ew = el.clientWidth;
      tip.style.left = Math.min(ew - tw - 4, x + 14) + 'px'; tip.style.top = Math.max(0, y - 10) + 'px';
    }
    const ro = new ResizeObserver(() => api.draw()); ro.observe(rowsEl);
    stacks.add(api);
    hair.hidden = true; tip.hidden = true; play.hidden = true;
    api.draw();
    return api;
  }
  function setCursor(t) { cursor = t; for (const s of stacks) s.placeCursor(); PG.bus.emit('cursor', t); }

  // playhead animation
  function tick() {
    const p = PG.Audio.position();
    for (const s of stacks) s.playhead(p ? p.t - (p.h.offset || 0) : null);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  PG.bus.on('theme', redrawAll);

  // ---------- drawing primitives
  const isNum = v => Number.isFinite(v) && v > 0;
  // series: {t(i) or dt, y: array, style: 'observed'|'target'|'input'|'obsDots'|'inDots'|'refLine', yOf}
  function drawSeries(g, s, xOf, yOf, C, w) {
    const n = s.y.length, tAt = s.t || (i => i * s.dt + (s.tOff || 0));
    const i0 = Math.max(0, Math.floor((zoom.t0 - (s.tOff || 0)) / (s.dt || 1e9)) - 2), i1 = s.dt ? Math.min(n, Math.ceil((zoom.t1 - (s.tOff || 0)) / s.dt) + 2) : n;
    const ok = s.ok || isNum;
    if (/Dots$/.test(s.style)) {
      g.fillStyle = s.style === 'obsDots' ? C.obs : C.input;
      const r = s.r || 2;
      const stride = Math.max(1, Math.floor((i1 - i0) / (w * 1.2)));
      for (let i = i0; i < i1; i += stride) { const v = s.y[i]; if (!ok(v)) continue; const x = xOf(tAt(i)); g.beginPath(); g.arc(x, yOf(v), r, 0, 2 * Math.PI); g.fill(); }
      return;
    }
    const path = () => {
      g.beginPath(); let pen = false;
      for (let i = i0; i < i1; i++) { const v = s.y[i]; if (!ok(v)) { pen = false; continue; } const x = xOf(tAt(i)), y = yOf(v); if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; } }
    };
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (s.style === 'target') {   // hollow tube: ink outline, paper core
      path(); g.strokeStyle = C.ink; g.lineWidth = 4.5; g.stroke();
      path(); g.strokeStyle = C.dark ? '#0d0f12' : '#ffffff'; g.lineWidth = 2; g.stroke();
    } else {
      path(); g.strokeStyle = s.style === 'observed' ? C.obs : s.style === 'input' ? C.input : C.ink2; g.lineWidth = s.lw || (s.style === 'input' ? 1.5 : 2); g.stroke();
    }
  }
  function spectroImage(spec, fmax, C) {   // offscreen canvas (frames x bins), grey ramp; cached per theme
    const key = (C.dark ? 'd' : 'l') + fmax;
    if (spec._img && spec._img.key === key) return spec._img.c;
    const nb = Math.min(spec.nBins, Math.round(fmax / spec.fmax * (spec.nBins - 1)) + 1);
    const c = document.createElement('canvas'); c.width = spec.nFrames; c.height = nb;
    const g = c.getContext('2d'), im = g.createImageData(spec.nFrames, nb);
    const lo = C.dark ? [21, 24, 28] : [255, 255, 255], hi = C.dark ? [225, 230, 236] : [22, 28, 36];
    for (let f = 0; f < spec.nFrames; f++) for (let b = 0; b < nb; b++) {
      const v = spec.data[f * spec.nBins + b] / 255, q = v * v * (3 - 2 * v) * 0.85 + v * 0.15, o = ((nb - 1 - b) * spec.nFrames + f) * 4;
      im.data[o] = lo[0] + (hi[0] - lo[0]) * q; im.data[o + 1] = lo[1] + (hi[1] - lo[1]) * q; im.data[o + 2] = lo[2] + (hi[2] - lo[2]) * q; im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); spec._img = { key, c };
    return c;
  }
  function drawSpec(g, spec, xOf, w, hgt, fmax, C) {
    if (!spec) return;
    const img = spectroImage(spec, fmax, C), dur = spec.nFrames * spec.hop;
    const x0 = xOf(-spec.hop / 2), x1 = xOf(dur - spec.hop / 2);
    g.imageSmoothingEnabled = true; g.drawImage(img, x0, 0, x1 - x0, hgt);
  }
  function gridY(g, w, yOf, vals, C, fmt) {
    g.font = '11px ' + PG.css('--serif'); g.textBaseline = 'bottom';
    for (const v of vals) { const y = Math.round(yOf(v)) + 0.5; g.strokeStyle = C.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillStyle = C.ink3; g.fillText(fmt(v), 3, y - 1); }
  }
  function bands(g, list, xOf, hgt, C, label) {   // discrepancy bands
    for (const [a, b] of list) { const x0 = xOf(a), x1 = xOf(b); g.fillStyle = C.discFill; g.fillRect(x0, 0, Math.max(1, x1 - x0), hgt); g.fillStyle = C.disc; g.fillRect(x0, 0, Math.max(1, x1 - x0), 2); }
    if (label && list.length) { g.fillStyle = C.ink; g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'top'; const x = Math.max(2, Math.min(xOf(list[0][0]) + 3, g.canvas.width / 2)); g.fillText(label, x, 4); }
  }
  // intervals: [{a, b, label, kind:'obs'|'exp'|'ctx'|'disc'}], two lanes (expected above, observed below) when both exist
  function drawIntervals(g, items, xOf, w, hgt, C) {
    const lanes = [...new Set(items.map(i => i.lane || 0))].sort(), lh = (hgt - 4) / Math.max(1, lanes.length);
    g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'middle';
    for (const it of items) {
      const li = lanes.indexOf(it.lane || 0), y = 2 + li * lh + 2, hh = lh - 4, x0 = Math.max(-2, xOf(it.a)), x1 = Math.min(w + 2, xOf(it.b));
      if (x1 < 0 || x0 > w || x1 - x0 < 0.5) continue;
      if (it.kind === 'obs') { g.fillStyle = C.obs; g.fillRect(x0, y, x1 - x0, hh); }
      else if (it.kind === 'ctx') { g.fillStyle = C.context; g.fillRect(x0, y, x1 - x0, hh); }
      else if (it.kind === 'disc') { g.fillStyle = C.discFill; g.fillRect(x0, y, x1 - x0, hh); }
      else { g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(x0 + 0.75, y + 0.75, x1 - x0 - 1.5, hh - 1.5); }
      g.strokeStyle = C.paper; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(x0) + 0.5, y); g.lineTo(Math.round(x0) + 0.5, y + hh); g.stroke();
      if (it.label && x1 - x0 > g.measureText(it.label).width + 8) {
        g.fillStyle = it.kind === 'obs' ? PG.css('--on-observed') : C.ink;
        g.fillText(it.label, Math.max(x0, 0) + 4, y + hh / 2 + 1);
      }
    }
  }
  // Run-length intervals of a per-frame array.
  function runs(arr, dt, pred, labelOf) {
    const out = []; let a = null, lab = null;
    for (let i = 0; i <= arr.length; i++) {
      const on = i < arr.length && pred(arr[i], i), l = on ? (labelOf ? labelOf(arr[i]) : '') : null;
      if (a !== null && (!on || l !== lab)) { out.push({ a: a * dt, b: i * dt, label: lab }); a = null; }
      if (on && a === null) { a = i; lab = l; }
    }
    return out;
  }
  return { Stack, zoom, setDuration, setZoom, zoomBy, fit, redrawAll, setCursor, cursor: () => cursor, drawSeries, drawSpec, gridY, bands, drawIntervals, runs, col, isNum };
})();
