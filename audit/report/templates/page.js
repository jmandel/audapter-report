// Progressive enhancement only: the page is complete without JS.
(function () {
  // Playhead: a playing clip draws a vertical line on its card's sketch at the clip's current time.
  document.querySelectorAll('audio[data-sketch]').forEach(function (a) {
    var svg = document.getElementById(a.dataset.sketch);
    var narrow = document.getElementById(a.dataset.sketch + '-n');
    if (narrow && svg && svg.getBoundingClientRect().width === 0) svg = narrow;   // phone layout
    if (!svg) return;
    var ph = svg.querySelector('.sk-playhead');
    var t0 = +svg.dataset.t0, t1 = +svg.dataset.t1, x0 = +svg.dataset.x0, x1 = +svg.dataset.x1;
    var off = +(a.dataset.offset || 0);
    function draw() {
      var t = a.currentTime + off;
      if (t < t0 || t > t1) { ph.setAttribute('visibility', 'hidden'); return; }
      var x = x0 + (t - t0) / (t1 - t0) * (x1 - x0);
      ph.setAttribute('x1', x); ph.setAttribute('x2', x); ph.setAttribute('visibility', 'visible');
      if (!a.paused) requestAnimationFrame(draw);
    }
    a.addEventListener('play', function () {
      document.querySelectorAll('audio').forEach(function (o) { if (o !== a) o.pause(); });
      requestAnimationFrame(draw);
    });
    a.addEventListener('seeked', draw);
    a.addEventListener('ended', function () { ph.setAttribute('visibility', 'hidden'); });
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
