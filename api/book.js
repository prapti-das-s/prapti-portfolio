const L = require('./_lib');
const clean = (v, max) => String(v || '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, max);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true });            // honeypot: bots fill this in

  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), notes = clean(b.notes, 600);
  const startMs = Date.parse(b.start || '');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || isNaN(startMs)) return res.status(400).json({ error: 'bad_input' });

  /* the slot must be one of the real, open slots */
  const date = L.istISO(startMs).slice(0, 10);
  if (!L.baseSlots(date).includes(startMs) || !L.inRange(startMs)) return res.status(400).json({ error: 'bad_slot' });
  if (!L.configured()) return res.status(503).json({ error: 'not_configured' });

  try {
    const end = startMs + L.STEP_MIN * 60000;
    const busy = await L.getBusy(startMs, end);
    if (L.overlaps(busy, startMs, end)) return res.status(409).json({ error: 'slot_taken' });
    const ev = await L.createEvent({ startMs, name, email, notes });
    return res.status(200).json({ ok: true, start: L.istISO(startMs), meet: ev.hangoutLink || null });
  } catch (e) {
    return res.status(502).json({ error: 'calendar_unavailable' });
  }
};
