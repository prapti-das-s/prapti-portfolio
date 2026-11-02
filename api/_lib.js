/* Shared helpers for the booking API (Vercel serverless, no dependencies).
   Availability rules (India Standard Time, UTC+05:30, no DST):
     Mon-Fri 4:00 PM - 8:00 PM, Sat 12:00 PM - 5:00 PM, Sunday closed. 30-minute slots. */
const OFFSET_MS = 5.5 * 3600 * 1000;
const STEP_MIN = 30;
const MIN_NOTICE_MS = 4 * 3600 * 1000;   // no bookings inside the next 4 hours
const MAX_DAYS_AHEAD = 60;
const WINDOWS = { 1: [16, 20], 2: [16, 20], 3: [16, 20], 4: [16, 20], 5: [16, 20], 6: [12, 17] }; // getDay(): 0 = Sunday

const pad = n => String(n).padStart(2, '0');
const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(Date.parse(d + 'T00:00:00+05:30'));

function istISO(ms) {
  const d = new Date(ms + OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00+05:30`;
}
function label(ms) {
  const d = new Date(ms + OFFSET_MS), h = d.getUTCHours(), m = d.getUTCMinutes();
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
/* all candidate slot start times (ms) for a YYYY-MM-DD day in IST */
function baseSlots(date) {
  const dow = new Date(date + 'T12:00:00+05:30').getUTCDay();
  const w = WINDOWS[dow];
  if (!w) return [];
  const out = [];
  for (let t = w[0] * 60; t + STEP_MIN <= w[1] * 60; t += STEP_MIN) {
    out.push(Date.parse(`${date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00+05:30`));
  }
  return out;
}
const inRange = ms => ms >= Date.now() + MIN_NOTICE_MS && ms <= Date.now() + MAX_DAYS_AHEAD * 86400000;

/* ---- Google Calendar (OAuth refresh token for Prapti's own account) ---- */
const env = process.env;
const useScript = () => !!(env.BOOKING_SCRIPT_URL && env.BOOKING_SCRIPT_KEY);   // easy mode: a Google Apps Script web app on Prapti's account
const useOAuth = () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
const configured = () => useScript() || useOAuth();
const CAL = encodeURIComponent(env.GOOGLE_CALENDAR_ID || 'primary');

let cached = { token: null, exp: 0 };
async function accessToken() {
  if (cached.token && Date.now() < cached.exp - 60000) return cached.token;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token'
    })
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('google_auth_failed');
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}
async function gfetch(url, opts = {}) {
  const t = await accessToken();
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('google_error_' + r.status);
  return j;
}
/* busy intervals [{start,end}] in ms between two ms timestamps */
async function scriptCall(params, body) {
  const u = new URL(env.BOOKING_SCRIPT_URL);
  u.searchParams.set('key', env.BOOKING_SCRIPT_KEY);
  Object.keys(params || {}).forEach(k => u.searchParams.set(k, params[k]));
  const r = await fetch(u, body
    ? { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, key: env.BOOKING_SCRIPT_KEY }) }
    : { redirect: 'follow' });
  const j = await r.json().catch(() => null);
  if (j && j.error === 'slot_taken') throw new Error('slot_taken');
  if (!r.ok || !j || j.error) throw new Error('script_error');
  return j;
}
async function getBusy(fromMs, toMs) {
  if (useScript()) {
    const j = await scriptCall({ action: 'busy', from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() });
    return (j.busy || []).map(b => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
  }
  const j = await gfetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    body: JSON.stringify({ timeMin: new Date(fromMs).toISOString(), timeMax: new Date(toMs).toISOString(), items: [{ id: decodeURIComponent(CAL) }] })
  });
  const cal = Object.values(j.calendars || {})[0] || {};
  return (cal.busy || []).map(b => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}
const overlaps = (busy, s, e) => busy.some(b => s < b.end && e > b.start);
async function createEvent({ startMs, name, email, notes }) {
  if (useScript()) {
    return scriptCall({}, { action: 'book', start: istISO(startMs), end: istISO(startMs + STEP_MIN * 60000), name, email, notes });
  }
  return gfetch(`https://www.googleapis.com/calendar/v3/calendars/${CAL}/events?sendUpdates=all&conferenceDataVersion=1`, {
    method: 'POST',
    body: JSON.stringify({
      summary: `Call with ${name}`,
      description: `Booked through praptidas portfolio.\n\nName: ${name}\nEmail: ${email}` + (notes ? `\n\nNotes:\n${notes}` : ''),
      start: { dateTime: istISO(startMs), timeZone: 'Asia/Kolkata' },
      end: { dateTime: istISO(startMs + STEP_MIN * 60000), timeZone: 'Asia/Kolkata' },
      attendees: [{ email, displayName: name }],
      conferenceData: { createRequest: { requestId: 'bk' + startMs + Math.random().toString(36).slice(2, 8), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }, { method: 'email', minutes: 60 }] }
    })
  });
}
module.exports = { STEP_MIN, baseSlots, inRange, istISO, label, validDate, configured, getBusy, overlaps, createEvent };
