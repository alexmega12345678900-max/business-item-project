const LABEL = { trial: '무료체험 종료', sub: '구독 갱신', return: '반품 기한', warranty: '보증기간 만료' };
const TIP = {
  trial: '계속 쓸 게 아니면 오늘 해지하세요.',
  sub: '계속 쓸 게 아니면 오늘 해지하세요.',
  return: '반품하려면 오늘까지 신청하세요.',
  warranty: '무상 수리가 필요하면 지금 신청하세요.',
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const enc = new TextEncoder();
const fold = (line) => {
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
};

export function onRequestGet({ request }) {
  const q = new URL(request.url).searchParams;
  const d = q.get('d') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Response('bad date', { status: 400 });
  const t = LABEL[q.get('t')] ? q.get('t') : 'sub';
  const name = (q.get('n') || '').trim().slice(0, 40) || LABEL[t];
  const start = d.replaceAll('-', '');
  const next = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + 1));
  const end = next.toISOString().slice(0, 10).replaceAll('-', '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const summary = esc(`[놓침제로] ${name} ${LABEL[t]}`);
  const alarm = (trigger, when) => [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`${name} ${LABEL[t]} ${when}`)}`,
    `TRIGGER:${trigger}`,
    'END:VALARM',
  ];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//nochimzero//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@nochimzero`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${esc(`${LABEL[t]} 마감일이에요. ${TIP[t]}\nhttps://nochimzero.pages.dev`)}`,
    'TRANSP:TRANSPARENT',
    ...alarm('-P2DT15H', '3일 전'),
    ...alarm('-PT15H', '하루 전'),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `inline; filename="nochimzero-${start}.ics"`,
      'cache-control': 'no-store',
    },
  });
}
