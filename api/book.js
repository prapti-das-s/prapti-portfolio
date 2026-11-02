const L = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!L.sameSite(req)) return res.status(403).json({ error: 'forbidden' });
  if (L.limited(req, res, 'book', 3, 3600000, 40)) return;          // 3 attempts / hour / visitor, 40 / hour overall

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object' || Array.isArray(b)) return res.status(400).json({ error: 'bad_input' });
  if (b.website) return res.status(200).json({ ok: true });            // honeypot: bots fill this in

  const name = L.clean(b.name, 80), email = L.clean(b.email, 120).toLowerCase(), notes = L.clean(b.notes, 600);
  const startMs = typeof b.start === 'string' ? Date.parse(b.start) : NaN;
  if (!name || !L.isEmail(email) || isNaN(startMs)) return res.status(400).json({ error: 'bad_input' });
  if (L.hasLink(name) || L.hasLink(notes)) return res.status(400).json({ error: 'no_links' });

  /* the slot must be one of the real, open slots */
  const date = L.istISO(startMs).slice(0, 10);
  if (!L.baseSlots(date).includes(startMs) || !L.inRange(startMs)) return res.status(400).json({ error: 'bad_slot' });
  if (!L.configured()) return res.status(503).json({ error: 'not_configured' });

  try {
    const end = startMs + L.STEP_MIN * 60000;
    const busy = await L.getBusy(startMs, end);
    if (L.overlaps(busy, startMs, end)) return res.status(409).json({ error: 'slot_taken' });
    const ev = await L.createEvent({ startMs, name, email, notes });
    const meet = ev && typeof ev.hangoutLink === 'string' && ev.hangoutLink.startsWith('https://') ? ev.hangoutLink : null;
    return res.status(200).json({ ok: true, start: L.istISO(startMs), meet });
  } catch (e) {
    if (e && e.message === 'slot_taken') return res.status(409).json({ error: 'slot_taken' });
    return res.status(502).json({ error: 'calendar_unavailable' });
  }
};
