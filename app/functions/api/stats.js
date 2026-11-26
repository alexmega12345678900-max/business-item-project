export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!env.STATS_KEY || key !== env.STATS_KEY) return new Response('forbidden', { status: 403 });
  const [bySrc, byDay, byKind, pro, visitors] = await env.DB.batch([
    env.DB.prepare('select src, ev, count(*) as n, count(distinct uid) as u from events group by src, ev order by src, ev'),
    env.DB.prepare("select date(ts / 1000, 'unixepoch', '+9 hours') as d, ev, count(distinct uid) as u from events group by d, ev order by d"),
    env.DB.prepare("select kind, count(*) as n from events where ev = 'add' group by kind order by n desc"),
    // 프리미엄 지불 의향: 사전 신청(월/연)과 적정 가격 답변. 같은 사람은 마지막 답만 셈
    env.DB.prepare("select ev, kind, count(distinct uid) as u from events e where ev in ('premium_view', 'premium_intent') or (ev = 'price_vote' and ts = (select max(ts) from events x where x.uid = e.uid and x.ev = 'price_vote')) group by ev, kind"),
    env.DB.prepare("select count(distinct uid) as u from events where ev = 'visit'"),
  ]);
  return Response.json(
    { bySrc: bySrc.results, byDay: byDay.results, byKind: byKind.results, pro: pro.results, visitors: visitors.results[0]?.u || 0 },
    { headers: { 'cache-control': 'no-store' } }
  );
}
