// Progressive enhancement only: the page is complete without JS.
(function () {
  // Playhead: a playing clip draws a vertical line on its card's sketch at the clip's current time. Clips tied to an
  // expected-vs-observed figure name their panel (data-sketch) and trial (data-trial): the line is drawn inside that trial's box.
  document.querySelectorAll('audio[data-sketch]').forEach(function (a) {
    function target() {
      var svg = document.getElementById(a.dataset.sketch), narrow = document.getElementById(a.dataset.sketch + '-n');
      if (narrow && (!svg || svg.getBoundingClientRect().width === 0)) svg = narrow;   // phone layout
      if (!svg) return null;
      var g = a.dataset.trial ? svg.querySelector('.ev-trial[data-trial="' + a.dataset.trial + '"]') : null, d = (g || svg).dataset;
      return { ph: svg.querySelector('.sk-playhead'), t0: +d.t0, t1: +d.t1, x0: +d.x0, x1: +d.x1, y0: g ? +d.y0 : null, y1: g ? +d.y1 : null };
    }
    var off = +(a.dataset.offset || 0), T = null;
    function draw() {
      if (!T || !T.ph) return;
      var t = a.currentTime + off;
      if (t < T.t0 || t > T.t1) { T.ph.setAttribute('visibility', 'hidden'); return; }
      var x = T.x0 + (t - T.t0) / (T.t1 - T.t0) * (T.x1 - T.x0);
      T.ph.setAttribute('x1', x); T.ph.setAttribute('x2', x); T.ph.setAttribute('visibility', 'visible');
      if (T.y0 !== null) { T.ph.setAttribute('y1', T.y0); T.ph.setAttribute('y2', T.y1); }
      if (!a.paused) requestAnimationFrame(draw);
    }
    a.addEventListener('play', function () {
      document.querySelectorAll('audio').forEach(function (o) { if (o !== a) o.pause(); });
      document.querySelectorAll('.sk-playhead').forEach(function (p) { p.setAttribute('visibility', 'hidden'); });
      T = target(); requestAnimationFrame(draw);
    });
    a.addEventListener('seeked', function () { T = T || target(); draw(); });
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
