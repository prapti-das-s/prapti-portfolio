const L = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const date = (req.query && req.query.date) || '';
  if (!L.validDate(date)) return res.status(400).json({ error: 'bad_date' });
  const base = L.baseSlots(date).filter(L.inRange);
  if (!base.length) return res.status(200).json({ slots: [] });
  if (!L.configured()) {   // calendar not connected yet: still show the real working hours, as requests
    return res.status(200).json({ mode: 'request', slots: base.map(s => ({ start: L.istISO(s), label: L.label(s) })) });
  }
  try {
    const step = L.STEP_MIN * 60000;
    const busy = await L.getBusy(base[0], base[base.length - 1] + step);
    const slots = base.filter(s => !L.overlaps(busy, s, s + step)).map(s => ({ start: L.istISO(s), label: L.label(s) }));
    return res.status(200).json({ mode: 'live', slots });
  } catch (e) {
    return res.status(502).json({ error: 'calendar_unavailable' });
  }
};
