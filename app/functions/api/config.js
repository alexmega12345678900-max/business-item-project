// 결제 링크 같은 공개 설정 (Cloudflare Pages 환경 변수에서 읽음)
export const onRequestGet = ({ env }) =>
  Response.json({ checkout: env.POLAR_CHECKOUT_URL || '', portal: env.POLAR_PORTAL_URL || '' }, { headers: { 'Access-Control-Allow-Origin': '*', 'cache-control': 'no-store' } });
