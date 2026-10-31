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
    '#reel{position:fixed;inset:0;z-index:99998;display:grid;place-items:center;padding:4vw;visibility:hidden;opacity:0;transition:opacity .35s,visibility .35s;background:radial-gradient(circle at 50% 50%,rgba(60,50,170,.35),rgba(2,2,12,.94))}' +
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
    frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="' + (title || 'Reel') + '"></iframe>';
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

  var PAL = [[110, 150, 255], [140, 230, 255], [90, 200, 250], [235, 247, 255], [226, 184, 87]];
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

  var m = { x: W / 2, y: H / 2, seen: false };
  var b = { x: -200, y: H / 2, vx: 0, vy: 0, face: 1, fs: 1, scale: 0, alpha: 1, ta: 1, hold: 0 };
  var trail = [], bits = [];

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (!m.seen) { m.seen = true; var side = R() < .5 ? -1 : 1; b.x = m.x = e.clientX; b.y = e.clientY; b.x += side * W * .55; b.y -= H * .3; }
    m.x = e.clientX; m.y = e.clientY;
    var t = e.target;
    b.ta = t && t.closest && t.closest('h1,h2,h3,p,li,.sub,.label,.stat,small,.tags,.list a') ? .22 : 1;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { b.ta = 0; });

  function burst(x, y) {
    for (var i = 0; i < 420; i++) {
      var a = R() * TAU, sp = 2 + Math.pow(R(), 1.6) * 15;
      bits.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, d: .012 + R() * .018, c: R() < .15 ? 4 : R() * 4 | 0, z: 1 + R() * 2.4, tri: R() < .4 });
    }
    b.hold = 55; b.scale = 0; b.x = x; b.y = y;
  }

  var t0 = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    c.clearRect(0, 0, W, H);
    var t = (now - t0) / 1000;
    if (FINE && m.seen && !RM) {
      if (b.hold > 0) b.hold--; else {
        b.vx += (m.x - b.x) * .014; b.vy += (m.y - b.y) * .014; b.vx *= .87; b.vy *= .87;
        b.x += b.vx; b.y += b.vy; b.scale += (1 - b.scale) * .05;
      }
      var sp = Math.hypot(b.vx, b.vy);
      if (Math.abs(b.vx) > .5) b.face = b.vx > 0 ? 1 : -1;
      b.fs += (b.face - b.fs) * .12;
      b.alpha += (b.ta - b.alpha) * .08;
      /* trail */
      if (b.hold === 0 && sp > 1.2) for (var k = 0; k < Math.min(5, 1 + sp * .25); k++)
        trail.push({ x: b.x - b.face * 30 * b.scale + (R() - .5) * 18, y: b.y + (R() - .5) * 18, vx: -b.vx * .05 + (R() - .5) * .8, vy: -b.vy * .05 + (R() - .5) * .8 - .1, l: 1, c: R() * 5 | 0, z: .8 + R() * 1.8 });
      /* bird */
      var L = 56 * b.scale, flapT = t * (7 + Math.min(sp, 30) * .45), rot = Math.max(-.5, Math.min(.5, b.vy * .03)) * b.fs;
      if (b.scale > .02 && b.alpha > .01) {
        c.save(); c.translate(b.x, b.y); c.rotate(rot);
        for (var i = 0; i < P.length; i++) {
          var p = P[i], q = pos(p, flapT + p.seed * .4, L), x = q[0] * b.fs, y = q[1];
          var a = (.5 + .5 * Math.sin(t * 5 + p.seed * 60)) * b.alpha * Math.min(b.scale * 1.4, 1), col = PAL[p.c];
          c.fillStyle = c.strokeStyle = 'rgba(' + col + ',' + a.toFixed(2) + ')';
          if (p.tri) { c.beginPath(); var z = p.sz * 1.6; c.moveTo(x, y - z); c.lineTo(x + z, y + z); c.lineTo(x - z, y + z); c.closePath(); c.stroke(); }
          else c.fillRect(x, y, p.sz, p.sz);
        }
        c.restore();
      }
    }
    for (var j = trail.length - 1; j >= 0; j--) {
      var r = trail[j]; r.x += r.vx; r.y += r.vy; r.l -= .018;
      if (r.l <= 0) { trail.splice(j, 1); continue; }
      c.fillStyle = 'rgba(' + PAL[r.c] + ',' + (r.l * .8 * b.alpha).toFixed(2) + ')'; c.fillRect(r.x, r.y, r.z, r.z);
    }
    for (var n = bits.length - 1; n >= 0; n--) {
      var s = bits[n]; s.x += s.vx; s.y += s.vy; s.vx *= .955; s.vy *= .955; s.vy += .03; s.l -= s.d;
      if (s.l <= 0) { bits.splice(n, 1); continue; }
      c.fillStyle = c.strokeStyle = 'rgba(' + PAL[s.c] + ',' + s.l.toFixed(2) + ')';
      if (s.tri) { c.beginPath(); c.moveTo(s.x, s.y - s.z * 1.6); c.lineTo(s.x + s.z * 1.6, s.y + s.z * 1.6); c.lineTo(s.x - s.z * 1.6, s.y + s.z * 1.6); c.closePath(); c.stroke(); }
      else c.fillRect(s.x, s.y, s.z, s.z);
    }
  })(t0);

  /* click on [data-reel] -> burst, then reel */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-reel]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    var x = e.clientX || W / 2, y = e.clientY || H / 2;
    if (!RM) burst(x, y);
    setTimeout(function () { openReel(el.getAttribute('data-reel'), el.getAttribute('data-title') || ''); }, RM ? 0 : 480);
  }, true);

  window.Patronus = { burst: burst, openReel: openReel, closeReel: closeReel };
})();
