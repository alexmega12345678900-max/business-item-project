const EVENTS = new Set(['visit', 'parse', 'add', 'delete', 'cal_ics', 'cal_google', 'guide', 'install_prompt', 'installed', 'share']);
const clean = (v, n) => String(v ?? '').replace(/[^\w\-가-힣]/g, '').slice(0, n);

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = JSON.parse(await request.text());
  } catch (e) {
    return new Response(null, { status: 400 });
  }
  const ev = clean(body.ev, 20);
  if (!EVENTS.has(ev)) return new Response(null, { status: 400 });
  await env.DB.prepare('insert into events (ts, uid, src, ev, kind) values (?, ?, ?, ?, ?)')
    .bind(Date.now(), clean(body.uid, 40), clean(body.src, 40) || 'direct', ev, clean(body.kind, 20))
    .run();
  return new Response(null, { status: 204 });
}
