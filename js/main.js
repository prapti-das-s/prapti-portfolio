/* ============================================================
   PRAPTI DAS — Portfolio JS
   ============================================================ */

// ── PAGE ROUTING ────────────────────────────────────────────
function showPage(id) {
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

// restore page on load
(function () {
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
})();

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
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

// ── CAROUSEL ────────────────────────────────────────────────
let currentSlide = 0;
const totalSlides = 3;

function moveCarousel(dir) {
  currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
  updateCarousel();
}

function goToSlide(i) {
  currentSlide = i;
  updateCarousel();
}

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
  document.querySelectorAll('.c-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// auto-advance
setInterval(() => moveCarousel(1), 5500);

// keyboard arrows on works page
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

  if (id === 'resume') {
    spawnSnitch();
  }
  if (id === 'blog') {
    spawnRaven();
  }
  if (id === 'skills') {
    spawnSparks();
  }
  if (id === 'experience') {
    spawnBolts();
  }
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

document.querySelectorAll('.tl-item, .skill-card, .quest-card, .industry-card, .video-card, .portal-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

// ── INLINE VIDEO PLAYBACK ─────────────────────────────────────
function playInline(videoId) {
  const card  = document.getElementById('card-' + videoId);
  const thumb = card.querySelector('.video-thumb-inner');

  thumb.innerHTML = '';
  thumb.style.padding = '0';
  thumb.style.background = '#000';
  thumb.style.cursor = 'default';
  thumb.style.position = 'relative';
  thumb.onclick = null;

  // iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.cssText = 'width:100%; height:100%; position:absolute; inset:0; border:none; z-index:1;';
  thumb.appendChild(iframe);

  // stop button — sits on top of the iframe
  const stopBtn = document.createElement('button');
  stopBtn.textContent = '✕ Stop';
  stopBtn.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    background: rgba(13,10,6,.88);
    border: 1px solid var(--gold, #c9a84c);
    color: var(--gold, #c9a84c);
    font-family: 'Special Elite', monospace;
    font-size: .6rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    padding: .35rem .9rem;
    cursor: pointer;
    transition: all .2s;
    white-space: nowrap;
  `;
  stopBtn.onmouseenter = () => {
    stopBtn.style.background = 'rgba(201,168,76,.18)';
  };
  stopBtn.onmouseleave = () => {
    stopBtn.style.background = 'rgba(13,10,6,.88)';
  };
  stopBtn.onclick = () => stopInline(videoId);
  thumb.appendChild(stopBtn);
}

function stopInline(videoId) {
  const card  = document.getElementById('card-' + videoId);
  const thumb = card.querySelector('.video-thumb-inner');
  const label = card.querySelector('.video-label').textContent;

  // restore the original thumb
  thumb.innerHTML = `
    <span class="video-play-btn">&#9654;</span>
    <span class="video-thumb-label">${label}</span>
  `;
  thumb.style.background = '';
  thumb.style.cursor = 'pointer';
  thumb.onclick = () => playInline(videoId);
}
