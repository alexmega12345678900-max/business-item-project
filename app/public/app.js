const TYPES = {
  trial:    { label: '무료체험 종료', base: '가입일', n: 7, unit: 'd' },
  sub:      { label: '구독 갱신',     base: '결제일', n: 1, unit: 'm' },
  return:   { label: '반품 기한',     base: '수령일', n: 7, unit: 'd' },
  warranty: { label: '보증기간',      base: '구매일', n: 1, unit: 'y' },
};
const UNIT = { d: '일', m: '개월', y: '년' };

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const md = (d) => `${d.getFullYear() !== today().getFullYear() ? `${d.getFullYear()}.` : ''}${d.getMonth() + 1}/${d.getDate()}`;
const addRule = (base, n, unit) => {
  const d = new Date(base);
  if (unit === 'd') d.setDate(d.getDate() + n);
  if (unit === 'm') d.setMonth(d.getMonth() + n);
  if (unit === 'y') d.setFullYear(d.getFullYear() + n);
  return d;
};
const dday = (d) => Math.round((d - today()) / 86400000);
const label = (n) => (n === 0 ? 'D-day' : n > 0 ? `D-${n}` : `${-n}일 지남`);

function samples() {
  const t = today();
  const ago = (n) => { const d = new Date(t); d.setDate(d.getDate() - n); return d; };
  return [
    ['무료체험', `[Web발신] 영상편집 Pro 7일 무료체험이 시작되었습니다(${md(ago(5))}). 체험 종료 후 연 79,000원이 자동결제됩니다.`],
    ['구독', `[Web발신] 음악 스트리밍 정기결제 ${md(ago(27))} 10,900원 승인. 다음 결제는 매월 같은 날입니다.`],
    ['반품', `[쇼핑몰] 주문하신 러닝화가 ${md(ago(4))} 배송완료 되었습니다. 받은 날부터 7일 이내 반품 신청 가능합니다.`],
    ['보증', `[전자랜드] 무선 이어폰 구매 ${ago(340).getFullYear()}.${String(ago(340).getMonth() + 1).padStart(2, '0')}.${String(ago(340).getDate()).padStart(2, '0')} 159,000원 결제완료. 품질보증기간 1년.`],
  ];
}

function parse(text) {
  const t = text.replace(/\s+/g, ' ');
  let type = 'sub';
  if (/무료\s*체험|체험\s*기간|무료\s*이용/.test(t)) type = 'trial';
  else if (/배송\s*완료|수령|도착|반품|교환/.test(t)) type = 'return';
  else if (/보증|구매\s*확정|품질/.test(t)) type = 'warranty';
  else if (/정기\s*결제|구독|자동\s*결제|갱신|멤버십/.test(t)) type = 'sub';

  const dates = [];
  const y0 = today().getFullYear();
  const push = (y, m, d, i) => {
    const dt = new Date(y ?? y0, m - 1, d);
    if (dt.getMonth() !== m - 1) return;
    if (y == null && dt - today() > 300 * 86400000) dt.setFullYear(y0 - 1);
    dates.push({ dt, i });
  };
  for (const m of t.matchAll(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g)) push(+m[1], +m[2], +m[3], m.index);
  const rest = t.replace(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g, (s) => ' '.repeat(s.length));
  for (const m of rest.matchAll(/(?<![\d,])(\d{1,2})\s*(?:\/|월\s*)(\d{1,2})(?:일)?(?![\d,])/g)) push(null, +m[1], +m[2], m.index);
  dates.sort((a, b) => a.i - b.i);

  let n = null, unit = null;
  const dur = t.match(/(\d+)\s*(일|개월|달|년)\s*(?:무료|체험|이내|간|보증|동안)/) || t.match(/(?:보증\s*기간|품질\s*보증\s*기간)\s*(\d+)\s*(일|개월|달|년)/);
  if (dur) { n = +dur[1]; unit = { 일: 'd', 개월: 'm', 달: 'm', 년: 'y' }[dur[2]]; }
  else if (/한\s*달/.test(t)) { n = 1; unit = 'm'; }
  else if (/두\s*달/.test(t)) { n = 2; unit = 'm'; }
  else if (/일주일/.test(t)) { n = 7; unit = 'd'; }
  if (type === 'sub' && /연\s*[\d,]+\s*원|매년|연간/.test(t)) { n = 1; unit = 'y'; }
  if (type === 'sub' && !n) { n = 1; unit = 'm'; }

  const amount = (t.match(/(?:연|월)?\s*([\d,]{3,})\s*원/) || [])[0]?.trim() || '';
  const head = t.replace(/^\s*(?:\[[^\]]*\]\s*)+/, '').replace(/^(?:주문하신|고객님의|고객님)\s*/, '');
  let name = (head.match(/^([가-힣A-Za-z+ ]{2,20}?)(?=\s*(?:\d|월\s|연\s|한\s*달|두\s*달|일주일|정기|구독|구매|무료|결제|배송|가\s|이\s))/) || [])[1]?.trim() || '';
  if (!name) name = TYPES[type].label;

  const def = TYPES[type];
  n = n ?? def.n; unit = unit ?? def.unit;
  let base = dates[0]?.dt || today();
  if (type === 'trial' && dates.length === 1 && /^\D{0,3}(?:부터|에|이후)/.test(t.slice(dates[0].i).replace(/^[\d/.월일\s]+/, ''))) {
    base = addRule(base, -n, unit);
  }
  if (type === 'sub') while (addRule(base, n, unit) < today()) base = addRule(base, n, unit);
  return { type, name, base, baseFound: !!dates[0], n, unit, ruleFound: !!dur || type === 'sub', amount };
}

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

const params = new URLSearchParams(location.search);
if (params.has('test')) store.set('nz-test', params.get('test') !== '0');
const testing = store.get('nz-test', false);
let uid = store.get('nz-uid', null);
if (!uid) { uid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(36).slice(2)}`; store.set('nz-uid', uid); }
const fromParam = (params.get('from') || params.get('utm_source') || '').replace(/[^\w\-가-힣]/g, '').slice(0, 40);
if (fromParam) store.set('nz-src', fromParam);
const src = store.get('nz-src', 'direct');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if ([...params.keys()].length) history.replaceState(null, '', location.pathname);

function track(ev, kind = '') {
  if (testing) return;
  const body = JSON.stringify({ ev, kind, uid, src });
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/e', body))) fetch('/api/e', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch (e) {}
}

let items = store.get('nz-items', []);
if (!Array.isArray(items)) items = [];
const save = () => store.set('nz-items', items);

function preview() {
  const type = $('f-type').value;
  const base = $('f-base').value ? fromIso($('f-base').value) : today();
  const n = Math.max(1, +$('f-n').value || 1);
  const unit = $('f-unit').value;
  const end = addRule(base, n, unit);
  $('l-base').textContent = TYPES[type].base;
  $('calc').innerHTML = `${TYPES[type].base} ${md(base)} + ${n}${UNIT[unit]} = <b>${TYPES[type].label} ${md(end)}</b> (${label(dday(end))})`;
  return end;
}

const guideQuery = (it) => (it.type === 'return' ? `${it.name} 반품 신청 방법` : it.type === 'warranty' ? `${it.name} 무상 수리 AS 신청` : `${it.name} 해지 방법`);
const guideText = (it) => (it.type === 'return' ? '반품 방법' : it.type === 'warranty' ? 'AS 방법' : '해지 방법');

function render() {
  const list = $('list');
  list.innerHTML = '';
  const sorted = [...items].sort((a, b) => a.end.localeCompare(b.end));
  $('hero').classList.toggle('compact', sorted.length > 0);
  if (!sorted.length) list.innerHTML = '<li class="empty">아직 등록된 기한이 없어요.<br>위에서 예시를 눌러 보세요.</li>';
  for (const it of sorted) {
    const d = dday(fromIso(it.end));
    const li = document.createElement('li');
    li.className = `item${d >= 0 && d <= 3 ? ' urgent' : ''}${d < 0 ? ' past' : ''}`;
    li.innerHTML = '<span class="dday"></span><div class="info"><b></b><small></small></div><div class="acts"><button class="bell"></button><a class="btnlike guide" target="_blank" rel="noopener"></a><button class="del" aria-label="삭제">삭제</button></div>';
    li.querySelector('.dday').textContent = label(d);
    li.querySelector('b').textContent = it.name;
    li.querySelector('small').textContent = `${TYPES[it.type].label} · ${md(fromIso(it.end))}${it.amount ? ` · ${it.amount}` : ''}`;
    const bell = li.querySelector('.bell');
    bell.textContent = it.cal ? '✓ 알림 넣음' : '🔔 알림 넣기';
    bell.classList.toggle('done', !!it.cal);
    bell.onclick = () => openCal(it);
    const g = li.querySelector('.guide');
    g.textContent = guideText(it);
    g.href = `https://www.google.com/search?q=${encodeURIComponent(guideQuery(it))}`;
    g.onclick = () => track('guide', it.type);
    li.querySelector('.del').onclick = () => { items = items.filter((x) => x !== it); save(); track('delete', it.type); render(); };
    list.append(li);
  }
  const soon = sorted.find((it) => { const d = dday(fromIso(it.end)); return d >= 0 && d <= 3; });
  const a = $('alert');
  a.hidden = !soon;
  if (soon) {
    a.textContent = `🔔 "${soon.name}" ${TYPES[soon.type].label}까지 ${label(dday(fromIso(soon.end)))}. ${soon.type === 'return' ? '반품하려면 지금 신청하세요.' : soon.type === 'warranty' ? '무상 수리가 필요하면 지금 신청하세요.' : '계속 쓸 게 아니면 지금 해지하세요.'}`;
  }
  $('ios-tip').hidden = !(isIOS && !standalone && sorted.length > 0);
}

let calItem = null;
function openCal(it) {
  calItem = it;
  const end = fromIso(it.end);
  const next = new Date(end); next.setDate(next.getDate() + 1);
  const compact = (d) => iso(d).replaceAll('-', '');
  $('cal-title').textContent = `${it.name} · ${TYPES[it.type].label}`;
  $('cal-when').textContent = `${md(end)} (${label(dday(end))}) · 3일 전·하루 전 알림`;
  $('cal-ics').href = `/ics?${new URLSearchParams({ n: it.name, t: it.type, d: it.end })}`;
  $('cal-google').href = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: `[놓침제로] ${it.name} ${TYPES[it.type].label}`,
    dates: `${compact(end)}/${compact(next)}`,
    details: `${TYPES[it.type].label} 마감일이에요.\nhttps://nochimzero.pages.dev`,
  })}`;
  const ics = $('cal-ics'), google = $('cal-google');
  ics.className = `wide btnlike${isIOS ? ' primary' : ''}`;
  google.className = `wide btnlike${isIOS ? '' : ' primary'}`;
  if (!isIOS) ics.parentNode.insertBefore(google, ics); else ics.parentNode.insertBefore(ics, google);
  $('cal').showModal();
}
const markCal = (ev) => {
  if (!calItem) return;
  calItem.cal = true; save(); track(ev, calItem.type);
  setTimeout(() => { $('cal').close(); render(); }, 300);
};
$('cal-ics').addEventListener('click', () => markCal('cal_ics'));
$('cal-google').addEventListener('click', () => markCal('cal_google'));
$('cal').addEventListener('click', (e) => { if (e.target === $('cal')) $('cal').close(); });
$('ios').addEventListener('click', (e) => { if (e.target === $('ios')) $('ios').close(); });

$('read').onclick = () => {
  const text = $('text').value.trim();
  if (!text) { $('text').focus(); return; }
  const p = parse(text);
  $('f-name').value = p.name;
  $('f-type').value = p.type;
  $('f-base').value = iso(p.base);
  $('f-n').value = p.n;
  $('f-unit').value = p.unit;
  $('found').textContent = `✨ 기한을 찾았어요 · ${TYPES[p.type].label}` +
    (p.baseFound ? '' : ' (날짜를 못 찾아 오늘로 넣었어요)') +
    (p.ruleFound ? '' : ` (기간은 기본값 ${p.n}${UNIT[p.unit]})`);
  $('confirm').classList.add('show');
  preview();
  track('parse', p.type);
  $('confirm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
['f-type', 'f-base', 'f-n', 'f-unit'].forEach((id) => $(id).addEventListener('input', preview));
$('f-type').addEventListener('change', () => {
  const d = TYPES[$('f-type').value]; $('f-n').value = d.n; $('f-unit').value = d.unit; preview();
});
$('add').onclick = () => {
  const end = preview();
  const type = $('f-type').value;
  const it = {
    id: uid.slice(0, 8) + Date.now().toString(36),
    name: $('f-name').value.trim() || TYPES[type].label,
    type, end: iso(end), amount: parse($('text').value).amount, cal: false,
  };
  items.push(it);
  save(); track('add', type); render();
  $('confirm').classList.remove('show'); $('text').value = '';
  openCal(it);
};
$('cancel').onclick = () => $('confirm').classList.remove('show');

for (const [k, v] of samples()) {
  const b = document.createElement('button');
  b.className = 'chip'; b.textContent = k;
  b.onclick = () => { $('text').value = v; $('read').click(); };
  $('samples').append(b);
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('install').hidden = false; });
window.addEventListener('appinstalled', () => { $('install').hidden = true; track('installed'); });
if (isIOS && !standalone) $('install').hidden = false;
$('install').onclick = async () => {
  if (deferredPrompt) {
    track('install_prompt', 'android');
    deferredPrompt.prompt();
    const r = await deferredPrompt.userChoice.catch(() => null);
    if (r && r.outcome === 'accepted') $('install').hidden = true;
    deferredPrompt = null;
  } else {
    track('install_prompt', 'ios');
    $('ios').showModal();
  }
};

$('share').onclick = async () => {
  const url = `${location.origin}/?from=share`;
  const text = '결제 문자 붙여넣기 한 번이면 무료체험·구독·반품 마감 전에 알려 줘요';
  track('share');
  if (navigator.share) {
    try { await navigator.share({ title: '놓침제로', text, url }); } catch (e) {}
  } else {
    try { await navigator.clipboard.writeText(`${text} ${url}`); $('share').textContent = '링크를 복사했어요'; } catch (e) {}
  }
};

track('visit', standalone ? 'pwa' : '');
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
