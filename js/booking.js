/* Booking calendar: month view -> open slots -> details -> confirmed.
   Talks to /api/availability and /api/book (Google Calendar behind the scenes). IST throughout. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var MAX_DAYS = 60, MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DOWS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ymd = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };

  /* "today" in India, whatever the visitor's timezone */
  var ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  var today = { y: ist.getUTCFullYear(), m: ist.getUTCMonth(), d: ist.getUTCDate() };
  var todayKey = ymd(today.y, today.m, today.d);
  var lastKey = (function () { var t = new Date(Date.UTC(today.y, today.m, today.d + MAX_DAYS)); return ymd(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()); })();
  var view = { y: today.y, m: today.m }, selDate = null, slot = null, reqId = 0;

  var grid = $('cal-grid'), steps = ['step-pick', 'step-form', 'step-done', 'step-fallback'];
  function show(id) { steps.forEach(function (s) { $(s).hidden = s !== id; }); }
  function dow(y, m, d) { return new Date(Date.UTC(y, m, d)).getUTCDay(); }

  function render() {
    $('cal-month').textContent = MONTHS[view.m] + ' ' + view.y;
    var first = (dow(view.y, view.m, 1) + 6) % 7, days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate(), html = '';
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var key = ymd(view.y, view.m, d), w = dow(view.y, view.m, d);
      var open = w !== 0 && key >= todayKey && key <= lastKey;
      html += '<button type="button" class="day' + (open ? ' open' : '') + (key === todayKey ? ' today' : '') + (key === selDate ? ' sel' : '') +
        '" data-d="' + key + '"' + (open ? '' : ' disabled aria-disabled="true"') + ' aria-label="' + d + ' ' + MONTHS[view.m] + '">' + d + '</button>';
    }
    grid.innerHTML = html;
    $('cal-prev').disabled = view.y === today.y && view.m === today.m;
    var lm = +lastKey.slice(5, 7) - 1, ly = +lastKey.slice(0, 4);
    $('cal-next').disabled = view.y === ly && view.m === lm || view.y > ly;
  }
  $('cal-prev').onclick = function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); };
  $('cal-next').onclick = function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); };

  function nice(key) { var p = key.split('-'); return DOWS[dow(+p[0], +p[1] - 1, +p[2])] + ', ' + (+p[2]) + ' ' + MONTHS[+p[1] - 1]; }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.day.open'); if (!b) return;
    selDate = b.dataset.d; render(); loadSlots(selDate);
  });

  function loadSlots(date) {
    var id = ++reqId; show('step-pick');
    $('side-title').textContent = nice(date);
    $('side-hint').textContent = 'Looking up open times…'; $('slots').innerHTML = '';
    fetch('/api/availability?date=' + date, { cache: 'no-store' }).then(function (r) {
      if (id !== reqId) return null;
      if (r.status === 503 || r.status === 404) { show('step-fallback'); return null; }
      if (!r.ok) throw 0; return r.json();
    }).then(function (j) {
      if (!j || id !== reqId) return;
      if (!j.slots.length) { $('side-hint').textContent = 'No open times that day. Try another date.'; return; }
      $('side-hint').textContent = 'Pick a time (IST). Each call is 30 minutes.';
      $('slots').innerHTML = j.slots.map(function (s) { return '<button type="button" class="slot" role="listitem" data-s="' + s.start + '" data-l="' + s.label + '">' + s.label + '</button>'; }).join('');
    }).catch(function () { if (id === reqId) { $('side-hint').textContent = 'Could not load times. Please try again, or email me.'; } });
  }

  function mine(iso) { /* the visitor's own local time, only if it differs from IST */
    try {
      var d = new Date(iso); if (new Date().getTimezoneOffset() === -330) return '';
      return ' (your time: ' + d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + ')';
    } catch (e) { return ''; }
  }
  $('slots').addEventListener('click', function (e) {
    var b = e.target.closest('.slot'); if (!b) return;
    slot = { start: b.dataset.s, label: b.dataset.l };
    $('chosen').textContent = nice(selDate) + ' · ' + slot.label + ' IST' + mine(slot.start);
    $('f-err').hidden = true; show('step-form'); $('f-name').focus();
  });
  $('f-back').onclick = function () { show('step-pick'); };

  $('step-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('f-name').value.trim(), email = $('f-email').value.trim(), err = $('f-err');
    if (!name) { err.textContent = 'Please add your name.'; err.hidden = false; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email so I can send the invite.'; err.hidden = false; return; }
    err.hidden = true; var go = $('f-go'); go.disabled = true; go.textContent = 'Booking…';
    fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: slot.start, name: name, email: email, notes: $('f-notes').value, website: $('f-web').value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (r) {
        go.disabled = false; go.textContent = 'Confirm booking';
        if (r.s === 200 && r.j.ok) {
          $('done-when').textContent = nice(selDate) + ' · ' + slot.label + ' IST' + mine(slot.start);
          $('done-mail').textContent = email;
          if (r.j.meet) { $('done-link').href = r.j.meet; $('done-meet').hidden = false; }
          show('step-done'); selDate = null; render();
        } else if (r.s === 409) {
          err.textContent = 'Someone just booked that time. Please pick another.'; err.hidden = false; show('step-pick'); loadSlots(selDate);
        } else if (r.s === 503) { show('step-fallback'); }
        else { err.textContent = 'Something went wrong. Please try again, or email me.'; err.hidden = false; }
      }).catch(function () { go.disabled = false; go.textContent = 'Confirm booking'; err.textContent = 'Network problem. Please try again.'; err.hidden = false; });
  });

  render();
})();
