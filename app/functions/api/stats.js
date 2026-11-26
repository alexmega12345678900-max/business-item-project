export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!env.STATS_KEY || key !== env.STATS_KEY) return new Response('forbidden', { status: 403 });
  const [bySrc, byDay, byKind] = await env.DB.batch([
    env.DB.prepare('select src, ev, count(*) as n, count(distinct uid) as u from events group by src, ev order by src, ev'),
    env.DB.prepare("select date(ts / 1000, 'unixepoch', '+9 hours') as d, ev, count(distinct uid) as u from events group by d, ev order by d"),
    env.DB.prepare("select kind, count(*) as n from events where ev = 'add' group by kind order by n desc"),
  ]);
  return Response.json(
    { bySrc: bySrc.results, byDay: byDay.results, byKind: byKind.results },
    { headers: { 'cache-control': 'no-store' } }
  );
}
