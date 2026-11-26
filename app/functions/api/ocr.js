// 프리미엄: 결제 화면 캡처에서 글자만 읽어 돌려줌. 사진은 저장하지 않고 읽은 뒤 바로 버림
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });
const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
const PROMPT = '이 휴대폰 화면 캡처에 보이는 글자를 그대로 옮겨 적어 줘. 결제, 구독, 무료체험, 배송, 보증과 관련된 문장과 날짜, 금액, 서비스 이름은 빠짐없이 적어. 설명이나 요약은 붙이지 말고 화면의 글자만 줄바꿈해서 적어.';

async function licensed(key, env) {
  if (env.OCR_TEST_TOKEN && key === env.OCR_TEST_TOKEN) return true;
  if (!key || !env.POLAR_ORG_ID) return false;
  const r = await fetch(`${env.POLAR_API || 'https://api.polar.sh'}/v1/customer-portal/license-keys/validate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: env.POLAR_ORG_ID }),
  });
  if (!r.ok) return false;
  const d = await r.json();
  return d.status === 'granted' && (!d.expires_at || new Date(d.expires_at) > new Date());
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return Response.json({ error: 'bad' }, { status: 400, headers: CORS }); }
  const image = String(body.image || '');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 2_000_000) return Response.json({ error: 'image' }, { status: 400, headers: CORS });
  if (!(await licensed(String(body.key || '').trim(), env))) return Response.json({ error: 'pro' }, { status: 402, headers: CORS });
  try {
    const out = await env.AI.run(MODEL, {
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image } }] }],
      max_tokens: 600, temperature: 0,
    });
    const text = String(out.response ?? out.choices?.[0]?.message?.content ?? '').trim().slice(0, 3000);
    return Response.json({ text }, { headers: CORS });
  } catch (e) {
    return Response.json({ error: 'ai' }, { status: 502, headers: CORS });
  }
}
