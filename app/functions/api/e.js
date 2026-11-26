const EVENTS = new Set(['visit', 'parse', 'add', 'delete', 'cal_ics', 'cal_google', 'guide', 'install_prompt', 'installed', 'share', 'notif', 'apk']);
const clean = (v, n) => String(v ?? '').replace(/[^\w\-가-힣]/g, '').slice(0, n);

// 앱(capacitor://localhost, https://localhost)에서도 기록을 보낼 수 있게 허용
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

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
  return new Response(null, { status: 204, headers: CORS });
}
