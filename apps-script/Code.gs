/**
 * Prapti's booking helper. Runs on HER Google account and talks to HER calendar.
 * Deploy: script.google.com -> New project -> paste this -> set KEY below ->
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone -> copy the Web app URL.
 * Then in Vercel set BOOKING_SCRIPT_URL (that URL) and BOOKING_SCRIPT_KEY (the same KEY as below).
 */
var KEY = 'CHANGE-ME-to-a-long-random-string';

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// GET ?action=busy&from=ISO&to=ISO&key=...  -> {busy:[{start,end}]}
function doGet(e) {
  var p = e.parameter || {};
  if (p.key !== KEY) return out_({ error: 'unauthorized' });
  if (p.action !== 'busy') return out_({ error: 'bad_action' });
  var evs = CalendarApp.getDefaultCalendar().getEvents(new Date(p.from), new Date(p.to));
  var busy = evs
    .filter(function (ev) { return ev.getMyStatus() !== CalendarApp.GuestStatus.NO; })
    .map(function (ev) { return { start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString() }; });
  return out_({ busy: busy });
}

// POST {action:'book', key, start, end, name, email, notes} -> creates the event and emails the guest an invite
function doPost(e) {
  var b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) {}
  if (b.key !== KEY) return out_({ error: 'unauthorized' });
  if (b.action !== 'book') return out_({ error: 'bad_action' });
  var okEmail = typeof b.email === 'string' && b.email.length <= 120 && /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(b.email);
  if (!okEmail || typeof b.name !== 'string' || !b.name || b.name.length > 80 || (b.notes && String(b.notes).length > 600)) return out_({ error: 'bad_input' });  // one plain address only
  var s = new Date(b.start), en = new Date(b.end);
  if (isNaN(s) || isNaN(en) || en - s !== 30 * 60000 || s < new Date()) return out_({ error: 'bad_input' });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var cal = CalendarApp.getDefaultCalendar();
    if (cal.getEvents(s, en).length) return out_({ error: 'slot_taken' });
    var ev = cal.createEvent('Call with ' + b.name, s, en, {
      description: 'Booked through the portfolio site.\n\nName: ' + b.name + '\nEmail: ' + b.email + (b.notes ? '\n\nNotes:\n' + b.notes : ''),
      guests: b.email,
      sendInvites: true
    });
    return out_({ ok: true, id: ev.getId() });
  } finally { lock.releaseLock(); }
}
