/* ============================================================
   PRAPTI DAS — Portfolio JS
   ============================================================ */

// ── PAGE ROUTING ────────────────────────────────────────────
function _show(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  const link = document.getElementById('nav-' + id);
  if (page) page.classList.add('active');
  if (link) link.classList.add('active');

  window.scrollTo(0, 0);
  history.pushState({}, '', '#' + id);

  // trigger page-specific animations
  pageAnimations(id);
}

// the bird carries you between pages (home lives in index.html)
let current = null;
function showPage(id) {
  if (id === 'home') { Bird.leave('index.html'); return; }
  if (id === current) return;
  if (current === null) { current = id; _show(id); return; }
  current = id;
  Bird.swap(() => _show(id));
}

// restore page on load (no animation: arriving by bird already covers the screen)
(function () {
  const hash = location.hash.replace('#', '');
  const id = document.getElementById('page-' + hash) ? hash : 'works';
  current = id; _show(id);
})();

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '');
  if (hash === '') { Bird.leave('index.html'); return; }
  current = hash; _show(hash);
});

// ── HAMBURGER NAV ────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// close nav on link click (mobile)
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ── DECK CAROUSEL (moves only when a button/arrow key is pressed) ─────────
let currentSlide = 0;
const totalSlides = 3;

function moveCarousel(dir) {
  currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
  updateCarousel();
}
function goToSlide(i) { currentSlide = i; updateCarousel(); }
function updateCarousel() {
  document.querySelectorAll('.deck-card').forEach((el, i) => {
    el.dataset.p = (i - currentSlide + totalSlides) % totalSlides;
  });
  const n = document.getElementById('deck-count');
  if (n) n.textContent = '0' + (currentSlide + 1) + ' / 0' + totalSlides;
}
document.addEventListener('keydown', e => {
  const works = document.getElementById('page-works');
  if (works && works.classList.contains('active')) {
    if (e.key === 'ArrowLeft')  moveCarousel(-1);
    if (e.key === 'ArrowRight') moveCarousel(1);
  }
});

// ── PAGE-SPECIFIC ANIMATIONS ─────────────────────────────────
function pageAnimations(id) {
  clearAnimations();

  /* page-specific themed animations removed: every page shares one look and one bird */
}

function clearAnimations() {
  document.querySelectorAll('.snitch, .raven, .spark, .bolt').forEach(el => el.remove());
}

// HARRY POTTER — golden snitch
function spawnSnitch() {
  const snitch = document.createElement('div');
  snitch.className = 'snitch';
  snitch.innerHTML = `
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="7" fill="#c9a84c" stroke="#f5d478" stroke-width="1.5"/>
      <ellipse cx="5" cy="13" rx="5" ry="3" fill="rgba(201,168,76,0.5)" transform="rotate(-20 5 13)"/>
      <ellipse cx="23" cy="13" rx="5" ry="3" fill="rgba(201,168,76,0.5)" transform="rotate(20 23 13)"/>
      <circle cx="12" cy="12" r="1.5" fill="#f5d478"/>
    </svg>
  `;
  document.body.appendChild(snitch);

  // repeat a few times
  let count = 0;
  const interval = setInterval(() => {
    if (!document.body.contains(snitch)) { clearInterval(interval); return; }
    snitch.style.animation = 'none';
    snitch.offsetHeight; // reflow
    snitch.style.animation = 'snitchFly 5s ease-in-out forwards';
    count++;
    if (count >= 3) clearInterval(interval);
  }, 5500);
}

// BOOK THIEF — raven flying across
function spawnRaven() {
  const raven = document.createElement('div');
  raven.className = 'raven';
  raven.textContent = '🐦‍⬛';
  document.body.appendChild(raven);
}

// MORTAL INSTRUMENTS — portal sparks
function spawnSparks() {
  for (let i = 0; i < 14; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const tx = (Math.random() - 0.5) * 120;
    const ty = -(40 + Math.random() * 80);
    const dur = (3 + Math.random() * 4).toFixed(1) + 's';
    const delay = (Math.random() * 5).toFixed(1) + 's';
    spark.style.cssText = `
      left:${Math.random() * 100}vw;
      bottom:${Math.random() * 40 + 10}vh;
      --tx:${tx}px; --ty:${ty}px;
      --dur:${dur};
      animation-delay:${delay};
      background: hsl(${220 + Math.random() * 60}, 80%, 65%);
    `;
    document.body.appendChild(spark);
  }
}

// PERCY JACKSON — lightning bolts falling
function spawnBolts() {
  for (let i = 0; i < 4; i++) {
    const bolt = document.createElement('div');
    bolt.className = 'bolt';
    bolt.textContent = '⚡';
    const delay = (i * 1.2).toFixed(1) + 's';
    const x = (15 + Math.random() * 70).toFixed(0) + '%';
    bolt.style.cssText = `--bx:${x}; animation-delay:${delay}; animation-duration:${(3.5 + Math.random()).toFixed(1)}s;`;
    document.body.appendChild(bolt);
  }
}

// ── SCROLL REVEAL (lightweight) ─────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.tl-item, .skill-card, .quest-card, .industry-card, .portal-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

// ── REEL CARDS: spotlight follows the pointer ────────────────
document.querySelectorAll('.reel').forEach(r => r.addEventListener('pointermove', e => {
  const b = r.getBoundingClientRect();
  r.style.setProperty('--mx', (e.clientX - b.left) + 'px');
  r.style.setProperty('--my', (e.clientY - b.top) + 'px');
}));

// ── RESUME: click an experience to pop it open ───────────────
document.querySelectorAll('.hp-exp-item').forEach((it, i) => {
  if (i === 0) it.classList.add('open');
  const head = it.querySelector('.hp-exp-company');
  if (!head) return;
  head.setAttribute('role', 'button'); head.tabIndex = 0;
  const tog = () => it.classList.toggle('open');
  head.addEventListener('click', tog);
  head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
});

// ── RESUME: small shapes scattered around the page ───────────
(function () {
  const pg = document.getElementById('page-resume'); if (!pg) return;
  const cols = ['#7a78ff', '#a56cff', '#4f9dff', '#e2b857'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span'); s.className = 'sh'; s.setAttribute('aria-hidden', 'true');
    const z = 8 + Math.random() * 20, c = cols[i % 4];
    s.style.cssText = `left:${Math.random() * 96}%;top:${4 + Math.random() * 92}%;width:${z}px;height:${z}px;border-color:${c};` +
      `border-radius:${Math.random() < .5 ? '50%' : '0'};--t:${(5 + Math.random() * 7).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s;--r:${(Math.random() * 90).toFixed(0)}deg`;
    pg.appendChild(s);
  }
})();

// ── WRITING: reading progress bar ────────────────────────────
(function () {
  const bar = document.createElement('div'); bar.id = 'read-bar'; document.body.appendChild(bar);
  addEventListener('scroll', () => {
    const on = document.getElementById('page-blog')?.classList.contains('active');
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.opacity = on ? 1 : 0; bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  }, { passive: true });
})();
