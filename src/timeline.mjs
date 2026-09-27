function parseAt(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('Timestamp requires an ISO timezone');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp');
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) throw new Error('Invalid calendar date');
  return date;
}

export function buildTimeline(source) {
  if (!Array.isArray(source)) throw new TypeError('Events must be an array');
  const seen = new Set();
  const events = source.map(event => {
    if (!event || typeof event.id !== 'string' || !event.id || typeof event.note !== 'string' || !['OPENED', 'MITIGATED', 'RESOLVED'].includes(event.type)) throw new Error('Invalid incident event');
    if (seen.has(event.id)) throw new Error(`Duplicate event ID: ${event.id}`);
    seen.add(event.id);
    return { ...event, at: parseAt(event.at).toISOString() };
  }).sort((a, b) => a.at.localeCompare(b.at));
  let state = 'NEW', opened = null, mitigated = null, resolved = null;
  for (const event of events) {
    if (event.type === 'OPENED') {
      if (state !== 'NEW') throw new Error('Only one OPENED event is allowed');
      state = 'OPEN'; opened = event.at;
    } else if (event.type === 'MITIGATED') {
      if (state !== 'OPEN') throw new Error('MITIGATED requires OPENED');
      state = 'MITIGATED'; mitigated = event.at;
    } else {
      if (state !== 'OPEN' && state !== 'MITIGATED') throw new Error('RESOLVED requires OPENED');
      state = 'RESOLVED'; resolved = event.at;
    }
  }
  const minutes = (a, b) => a && b ? (Date.parse(b) - Date.parse(a)) / 60000 : null;
  return { status: state, response_minutes: minutes(opened, mitigated), resolution_minutes: minutes(opened, resolved), events };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderHtml(report) {
  const items = report.events.map(event => `<li><time>${escapeHtml(event.at)}</time><strong>${event.type}</strong><p>${escapeHtml(event.note)}</p></li>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Incident timeline</title><style>body{font:16px system-ui;max-width:800px;margin:3rem auto;color:#1a2636}li{border-left:4px solid #007c91;padding:1rem;margin:1rem 0;list-style:none;background:#eef6f7}time{display:block;color:#526273}strong{display:block;margin-top:.3rem}</style><h1>Incident timeline</h1><p>Status: ${report.status} · Response: ${report.response_minutes ?? '—'} min · Resolution: ${report.resolution_minutes ?? '—'} min</p><ol>${items}</ol></html>\n`;
}
