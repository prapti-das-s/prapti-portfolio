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
  var view = { y: today.y, m: today.m }, selDate = null, slot = null, reqId = 0, requestMode = false;
  var OWNER = 'das.2006prapti@gmail.com';

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
      if (r.status === 404) { requestMode = true; return localSlots(date); }
      if (r.status === 503) { show('step-fallback'); return null; }
      if (!r.ok) throw 0; return r.json();
    }).then(function (j) {
      if (!j || id !== reqId) return;
      requestMode = j.mode === 'request';
      if (!j.slots.length) { $('side-hint').textContent = 'No open times that day. Try another date.'; return; }
      $('side-hint').textContent = requestMode ? 'Pick a time (IST). I will confirm it by email.' : 'Pick a time (IST). Each call is 30 minutes.';
      var sl = $('slots'); sl.textContent = '';                    /* built with the DOM, never as HTML, so nothing from the API can run as code */
      j.slots.forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.setAttribute('role', 'listitem');
        b.dataset.s = String(s.start); b.dataset.l = String(s.label); b.textContent = String(s.label); sl.appendChild(b);
      });
    }).catch(function () { if (id === reqId) { $('side-hint').textContent = 'Could not load times. Please try again, or email me.'; } });
  }

  /* same hours as the server: Mon-Fri 4-8 PM, Sat 12-5 PM, 30-minute calls (used if the API is not reachable, e.g. a plain static host) */
  function localSlots(date) {
    var p = date.split('-'), w = dow(+p[0], +p[1] - 1, +p[2]), win = w === 0 ? null : (w === 6 ? [12, 17] : [16, 20]), out = [];
    if (win) for (var t = win[0] * 60; t + 30 <= win[1] * 60; t += 30) {
      var h = Math.floor(t / 60), m = t % 60, iso = date + 'T' + pad(h) + ':' + pad(m) + ':00+05:30';
      if (Date.parse(iso) >= Date.now() + 4 * 3600 * 1000) out.push({ start: iso, label: ((h % 12) || 12) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM') });
    }
    return { mode: 'request', slots: out };
  }
  function gcalLink(iso, name) {
    var s = new Date(iso), e = new Date(s.getTime() + 30 * 60000), f = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Call with Prapti Das') + '&dates=' + f(s) + '/' + f(e) +
      '&details=' + encodeURIComponent('Requested through prapti-portfolio. Booked for ' + name + '.') + '&add=' + encodeURIComponent(OWNER);
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
    if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email) || email.length > 120) { err.textContent = 'Please enter a valid email so I can send the invite.'; err.hidden = false; return; }
    if (requestMode) {                      /* calendar not connected: send the request by email and offer an add-to-calendar link */
      var body = 'Hi Prapti,\n\nI would like to book a call on ' + nice(selDate) + ' at ' + slot.label + ' IST.\n\nName: ' + name + '\nEmail: ' + email + ($('f-notes').value ? '\n\nAbout: ' + $('f-notes').value : '') + '\n';
      $('done-when').textContent = nice(selDate) + ' · ' + slot.label + ' IST' + mine(slot.start);
      $('done-mail').textContent = email;
      $('done-title').textContent = 'Request ready to send';
      $('done-text').innerHTML = 'Your email app should open with the request filled in. Press send and I will confirm by email.';
      var ml = 'mailto:' + OWNER + '?subject=' + encodeURIComponent('Call request: ' + nice(selDate) + ' ' + slot.label + ' IST') + '&body=' + encodeURIComponent(body);
      $('done-link').href = ml; $('done-link').textContent = 'Open email request'; $('done-link').removeAttribute('target'); $('done-meet').hidden = false;
      var g = $('done-gcal'); g.href = gcalLink(slot.start, name); g.hidden = false;
      show('step-done'); location.href = ml; return;
    }
    err.hidden = true; var go = $('f-go'); go.disabled = true; go.textContent = 'Booking…';
    fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: slot.start, name: name, email: email, notes: $('f-notes').value, website: $('f-web').value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (r) {
        go.disabled = false; go.textContent = 'Confirm booking';
        if (r.s === 200 && r.j.ok) {
          $('done-when').textContent = nice(selDate) + ' · ' + slot.label + ' IST' + mine(slot.start);
          $('done-mail').textContent = email;
          if (r.j.meet && /^https:\/\//.test(r.j.meet)) { $('done-link').href = r.j.meet; $('done-meet').hidden = false; }
          $('done-title').textContent = "You're booked."; $('done-gcal').hidden = true;
          show('step-done'); selDate = null; render();
        } else if (r.s === 409) {
          err.textContent = 'Someone just booked that time. Please pick another.'; err.hidden = false; show('step-pick'); loadSlots(selDate);
        } else if (r.s === 503) { show('step-fallback'); }
        else if (r.s === 429) { err.textContent = 'Too many attempts. Please wait a little, or email me.'; err.hidden = false; }
        else if (r.j && r.j.error === 'no_links') { err.textContent = 'Please leave links out of your name and note.'; err.hidden = false; }
        else { err.textContent = 'Something went wrong. Please try again, or email me.'; err.hidden = false; }
      }).catch(function () { go.disabled = false; go.textContent = 'Confirm booking'; err.textContent = 'Network problem. Please try again.'; err.hidden = false; });
  });

  render();
})();
