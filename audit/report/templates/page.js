// Progressive enhancement only: the page is complete without JS.
(function () {
  // Playhead. A clip carries its mapping (build.py, from the figure's own trial boxes): data-sketch = the figure panel's svg id,
  // data-trial = the trial box, data-offset = time within that trial where the clip starts. The line is drawn at
  // offset + currentTime inside that trial's box of that panel. Clips without a mapping get no playhead.
  function mapping(a) {
    var svg = document.getElementById(a.dataset.sketch), narrow = document.getElementById(a.dataset.sketch + '-n');
    if (narrow && (!svg || svg.getBoundingClientRect().width === 0)) svg = narrow;   // phone layout
    if (!svg) return null;
    var g = svg.querySelector('.ev-trial[data-trial="' + a.dataset.trial + '"]');
    if (!g) return null;
    var d = g.dataset;
    return { svg: svg, g: g, ph: svg.querySelector('.sk-playhead'), t0: +d.t0, t1: +d.t1, x0: +d.x0, x1: +d.x1, y0: +d.y0, y1: +d.y1 };
  }
  function xAt(T, t) { return T.x0 + (t - T.t0) / (T.t1 - T.t0) * (T.x1 - T.x0); }
  window.AudPlayhead = function (a, clipTime) {          // used by check-render.mjs
    var T = mapping(a); if (!T) return null;
    var t = clipTime + +(a.dataset.offset || 0);
    return { x: xAt(T, t), t: t, x0: T.x0, x1: T.x1, t1: T.t1, trial: T.g.dataset.trial, svg: T.svg.id };
  };
  document.querySelectorAll('audio[data-sketch][data-trial]').forEach(function (a) {
    var off = +(a.dataset.offset || 0), T = null;
    function draw() {
      if (!T || !T.ph) return;
      var t = a.currentTime + off;
      if (t < T.t0 || t > T.t1) { T.ph.setAttribute('visibility', 'hidden'); return; }
      var x = xAt(T, t);
      T.ph.setAttribute('x1', x); T.ph.setAttribute('x2', x); T.ph.setAttribute('y1', T.y0); T.ph.setAttribute('y2', T.y1);
      T.ph.setAttribute('visibility', 'visible');
      if (!a.paused) requestAnimationFrame(draw);
    }
    a.addEventListener('play', function () {
      document.querySelectorAll('audio').forEach(function (o) { if (o !== a) o.pause(); });
      document.querySelectorAll('.sk-playhead').forEach(function (p) { p.setAttribute('visibility', 'hidden'); });
      T = mapping(a); requestAnimationFrame(draw);
    });
    a.addEventListener('seeked', function () { T = T || mapping(a); draw(); });
    a.addEventListener('timeupdate', function () { T = T || mapping(a); draw(); });
    a.addEventListener('ended', function () { if (T && T.ph) T.ph.setAttribute('visibility', 'hidden'); });
  });
  // Copy buttons for reproduce commands.
  document.querySelectorAll('.repro code').forEach(function (c) {
    if (!navigator.clipboard) return;
    var b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy';
    b.addEventListener('click', function () { navigator.clipboard.writeText(c.textContent).then(function () { b.textContent = 'Copied'; }); });
    c.after(b);
  });
  // Print with every data table open.
  window.addEventListener('beforeprint', function () { document.querySelectorAll('details').forEach(function (d) { d.open = true; }); });
})();
