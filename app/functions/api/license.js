// 프리미엄 라이선스 키 확인: Polar 고객용 검증 API에 물어보고 결과만 돌려줌 (키는 저장하지 않음)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export async function onRequestPost({ request, env }) {
  let key = '';
  try { key = String((await request.json()).key || '').trim().slice(0, 100); } catch (e) {}
  if (!key || !env.POLAR_ORG_ID) return Response.json({ valid: false }, { headers: CORS });
  const base = env.POLAR_API || 'https://api.polar.sh';
  const r = await fetch(`${base}/v1/customer-portal/license-keys/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: env.POLAR_ORG_ID }),
  });
  if (!r.ok) return Response.json({ valid: false }, { headers: CORS });
  const d = await r.json();
  const valid = d.status === 'granted' && (!d.expires_at || new Date(d.expires_at) > new Date());
  return Response.json({ valid, expires_at: d.expires_at || null }, { headers: CORS });
}
