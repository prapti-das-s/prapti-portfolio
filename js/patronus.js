/* Cursor bird: a particle bird zooms in from off-screen, follows the pointer and leaves a glittering trail.
   It dims over text so copy stays readable. Click anything marked data-reel and the bird bursts apart,
   then the reel pops up. Shared by index.html and site.html. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var FINE = matchMedia('(pointer:fine)').matches;
  var R = Math.random, TAU = Math.PI * 2;

  /* ---------- reel modal ---------- */
  var st = document.createElement('style');
  st.textContent =
    '#reel{position:fixed;inset:0;z-index:99998;display:grid;place-items:center;padding:4vw;visibility:hidden;opacity:0;transition:opacity .35s,visibility .35s;background:radial-gradient(circle at 50% 50%,rgba(90,50,190,.35),rgba(2,2,12,.94))}' +
    '#reel.on{visibility:visible;opacity:1}' +
    '#reel .box{position:relative;width:min(1000px,92vw);transform:scale(.6) rotate(-2deg);opacity:0;transition:transform .7s cubic-bezier(.2,.9,.2,1.15),opacity .4s}' +
    '#reel.on .box{transform:none;opacity:1}' +
    '#reel .frame{aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#000;border:1px solid rgba(122,120,255,.55);box-shadow:0 0 0 6px rgba(122,120,255,.08),0 40px 120px rgba(80,60,255,.35)}' +
    '#reel iframe{width:100%;height:100%;border:0;display:block}' +
    '#reel .cap{display:flex;justify-content:space-between;align-items:center;margin-top:14px;color:#cfd0ff;font:500 13px/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}' +
    '#reel button{all:unset;cursor:pointer;color:#e2b857;border:1px solid #e2b857;border-radius:24px;padding:10px 16px;font:500 13px/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}' +
    '#reel button:hover{background:rgba(226,184,87,.15)}';
  document.head.appendChild(st);
  var modal = document.createElement('div');
  modal.id = 'reel';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = '<div class="box"><div class="frame"></div><div class="cap"><span></span><button type="button">Close ✕</button></div></div>';
  document.body.appendChild(modal);
  var frame = modal.querySelector('.frame'), capText = modal.querySelector('.cap span');
  function openReel(id, title) {
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(String(id))) return;          /* only a plain YouTube id is ever put into the page */
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.allowFullscreen = true; f.title = title || 'Reel';
    frame.textContent = ''; frame.appendChild(f);
    capText.textContent = title || '';
    modal.classList.add('on');
  }
  function closeReel() { modal.classList.remove('on'); setTimeout(function () { frame.innerHTML = ''; }, 380); }
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.tagName === 'BUTTON') closeReel(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeReel(); });

  /* ---------- canvas ---------- */
  var cv = document.createElement('canvas'), c = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9990;pointer-events:none';
  document.body.appendChild(cv);
  var W, H, D;
  function size() { D = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; c.setTransform(D, 0, 0, D, 0, 0); }
  size(); addEventListener('resize', size);

  var PAL = [[140, 110, 255], [190, 150, 255], [160, 110, 245], [245, 238, 255], [226, 184, 87]];
  var P = [];
  for (var i = 0; i < 620; i++) {
    P.push({ k: i < 470 ? 0 : i < 570 ? 1 : 2, s: Math.pow(R(), .8), v: R(), side: R() < .5 ? 0 : 1, seed: R(), c: R() < .1 ? 4 : R() < .4 ? 3 : (R() * 3 | 0), sz: 1 + R() * 1.8, tri: R() < .3 });
  }
  function pos(p, t, L) {
    var x, y, flap = Math.sin(t), ph = -.55 + (flap * .5 + .5) * 1.75;
    if (p.k === 0) {
      var r = p.s * L, sw = p.side ? .12 : -.04, dx = -Math.sin(ph) * .45 - .18 + sw;
      x = dx * r - (p.v * L * .2) * (1 - p.s * .5) * Math.cos(ph * .4);
      y = -Math.sin(ph) * r + p.v * L * .07 * p.s + (p.side ? L * .03 : 0);
    } else if (p.k === 1) {
      var a = p.seed * TAU, rr = Math.sqrt(p.v); x = Math.cos(a) * rr * L * .42; y = Math.sin(a) * rr * L * .1 + flap * L * .02;
    } else if (p.s < .5) { var a2 = p.seed * TAU; x = L * .46 + Math.cos(a2) * L * .08 * p.v; y = -L * .02 + Math.sin(a2) * L * .08 * p.v; }
    else { x = -L * .42 - p.v * L * .3; y = (p.seed - .5) * L * .08 * (1 + p.v) + flap * L * .03 * p.v; }
    return [x, y];
  }

  var m = { x: 0, y: 0, px: 0, py: 0, seen: false };
  var trail = [], bits = [], fl = [], busy = false;

  /* cursor: no bird, just a glittering trail that follows the pointer */
  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (!m.seen) { m.seen = true; m.px = e.clientX; m.py = e.clientY; }
    m.x = e.clientX; m.y = e.clientY;
    var dx = m.x - m.px, dy = m.y - m.py, sp = Math.hypot(dx, dy); m.px = m.x; m.py = m.y;
    if (!FINE || RM) return;
    for (var k = 0, n = Math.min(6, 1 + (sp * .12 | 0)); k < n; k++)
      trail.push({ x: m.x + (R() - .5) * 10, y: m.y + (R() - .5) * 10, vx: -dx * .04 + (R() - .5) * .8, vy: -dy * .04 + (R() - .5) * .8 - .1, l: 1, c: R() * 5 | 0, z: .8 + R() * 1.8 });
  }, { passive: true });

  function burst(x, y) {
    for (var i = 0; i < 380; i++) {
      var a = R() * TAU, sp = 2 + Math.pow(R(), 1.6) * 15;
      bits.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, d: .012 + R() * .018, c: R() < .15 ? 4 : R() * 4 | 0, z: 1 + R() * 2.4, tri: R() < .4 });
    }
  }
  /* a bird that flies in from the edge, toward the click, then goes boom */
  function launch(x, y, i) {
    var side = i % 2 ? -1 : 1;
    fl.push({ sx: side > 0 ? W + 140 : -140, sy: y + (R() - .5) * H * .7, tx: x + (R() - .5) * 150, ty: y + (R() - .5) * 100, t: -i * .1, dur: .5 + R() * .08, bend: (R() - .5) * 220, L: 46 + R() * 22, px: 0, py: 0 });
  }

  var t0 = performance.now(), last = t0;
  (function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min((now - last) / 1000, .05); last = now;
    c.clearRect(0, 0, W, H);
    var t = (now - t0) / 1000;
    for (var f = fl.length - 1; f >= 0; f--) {
      var o = fl[f]; o.t += dt; var u = o.t / o.dur;
      if (u < 0) continue;
      if (u >= 1) { burst(o.tx, o.ty); fl.splice(f, 1); continue; }
      var e = Math.pow(u, 1.7), x = o.sx + (o.tx - o.sx) * e, y = o.sy + (o.ty - o.sy) * e + Math.sin(u * Math.PI) * o.bend;
      var face = o.tx > o.sx ? 1 : -1, rot = Math.max(-.6, Math.min(.6, Math.atan2(y - (o.py || y), Math.abs(x - (o.px || x)) + .01))) * face;
      o.px = x; o.py = y;
      var L = o.L * (.6 + .4 * u), flapT = t * 16;
      c.save(); c.translate(x, y); c.rotate(rot);
      for (var i = 0; i < P.length; i++) {
        var p = P[i], q = pos(p, flapT + p.seed * .4, L), qx = q[0] * face, qy = q[1];
        var a = .55 + .45 * Math.sin(t * 6 + p.seed * 60), col = PAL[p.c];
        c.fillStyle = c.strokeStyle = 'rgba(' + col + ',' + a.toFixed(2) + ')';
        if (p.tri) { c.beginPath(); var z = p.sz * 1.6; c.moveTo(qx, qy - z); c.lineTo(qx + z, qy + z); c.lineTo(qx - z, qy + z); c.closePath(); c.stroke(); }
        else c.fillRect(qx, qy, p.sz, p.sz);
      }
      c.restore();
      /* streak behind the bird */
      for (var k = 0; k < 4; k++) trail.push({ x: x - face * L * .4 + (R() - .5) * 14, y: y + (R() - .5) * 14, vx: -face * (1 + R() * 2), vy: (R() - .5) * 1.4, l: 1, c: R() * 5 | 0, z: 1 + R() * 2 });
    }
    for (var j = trail.length - 1; j >= 0; j--) {
      var r = trail[j]; r.x += r.vx; r.y += r.vy; r.l -= .02;
      if (r.l <= 0) { trail.splice(j, 1); continue; }
      c.fillStyle = 'rgba(' + PAL[r.c] + ',' + (r.l * .8).toFixed(2) + ')'; c.fillRect(r.x, r.y, r.z, r.z);
    }
    for (var n = bits.length - 1; n >= 0; n--) {
      var s = bits[n]; s.x += s.vx; s.y += s.vy; s.vx *= .955; s.vy *= .955; s.vy += .03; s.l -= s.d;
      if (s.l <= 0) { bits.splice(n, 1); continue; }
      c.fillStyle = c.strokeStyle = 'rgba(' + PAL[s.c] + ',' + s.l.toFixed(2) + ')';
      if (s.tri) { c.beginPath(); c.moveTo(s.x, s.y - s.z * 1.6); c.lineTo(s.x + s.z * 1.6, s.y + s.z * 1.6); c.lineTo(s.x - s.z * 1.6, s.y + s.z * 1.6); c.closePath(); c.stroke(); }
      else c.fillRect(s.x, s.y, s.z, s.z);
    }
  })(t0);

  /* click on [data-reel] -> birds fly in and go boom, then the reel opens */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-reel]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (busy) return; busy = true;
    var x = e.clientX || W / 2, y = e.clientY || H / 2;
    if (RM) { burst(x, y); }
    else for (var i = 0; i < 3; i++) launch(x, y, i);
    setTimeout(function () { busy = false; openReel(el.getAttribute('data-reel'), el.getAttribute('data-title') || ''); }, RM ? 0 : 850);
  }, true);

  window.Patronus = { burst: burst, openReel: openReel, closeReel: closeReel };
})();
