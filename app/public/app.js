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
  let name = (head.match(/^([가-힣A-Za-z+ ]{2,20}?)(?=\s*(?:\d|월\s|연\s|한\s*달|두\s*달|일주일|정기|구독|구매|무료|결제|배송|가\s(?!\d)|이\s(?!\d)))/) || [])[1]?.trim() || '';
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

const cap = window.Capacitor;
const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
const platform = native ? cap.getPlatform() : '';
const notif = native && cap.Plugins ? cap.Plugins.LocalNotifications : null;
const SITE = 'https://nochimzero.pages.dev';
const API = native ? SITE : '';

const params = new URLSearchParams(location.search);
if (params.has('test')) store.set('nz-test', params.get('test') !== '0');
const testing = store.get('nz-test', false);
let uid = store.get('nz-uid', null);
if (!uid) { uid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(36).slice(2)}`; store.set('nz-uid', uid); }
const fromParam = (params.get('from') || params.get('utm_source') || '').replace(/[^\w\-가-힣]/g, '').slice(0, 40);
if (fromParam) store.set('nz-src', fromParam);
const src = store.get('nz-src', native ? `app_${platform}` : 'direct');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if ([...params.keys()].length) history.replaceState(null, '', location.pathname);

function track(ev, kind = '') {
  if (testing) return;
  const body = JSON.stringify({ ev, kind, uid, src });
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon(`${API}/api/e`, body))) fetch(`${API}/api/e`, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch (e) {}
}

let items = store.get('nz-items', []);
if (!Array.isArray(items)) items = [];
const save = () => store.set('nz-items', items);

// 프리미엄: 무료는 진행 중인 기한 5개까지, 프리미엄은 무제한 + 절약 리포트
const FREE_LIMIT = 5;
const proInfo = () => store.get('nz-pro', null);
const isPro = () => { const p = proInfo(); return !!(p && p.valid && (!p.exp || new Date(p.exp) > new Date())); };
const won = (s) => +String(s || '').replace(/[^\d]/g, '') || 0;
const fmt = (n) => `${n.toLocaleString('ko-KR')}원`;
const doneText = (t) => (t === 'return' ? '반품했어요' : t === 'warranty' ? '수리받았어요' : '해지했어요');
async function checkLicense(key) {
  const r = await fetch(`${API}/api/license`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
  const d = await r.json().catch(() => ({}));
  return { key, valid: !!d.valid, exp: d.expires_at || null, at: Date.now() };
}

function preview() {
  const type = $('f-type').value;
  const base = $('f-base').value ? fromIso($('f-base').value) : today();
  const n = Math.max(1, +$('f-n').value || 1);
  const unit = $('f-unit').value;
  const end = addRule(base, n, unit);
  $('l-base').textContent = TYPES[type].base;
  $('calc').innerHTML = `${TYPES[type].base} ${md(base)} + ${n}${UNIT[unit]} → <b>${md(end)} · ${label(dday(end))}</b>`;
  $('found').textContent = `${$('f-name').value.trim() || TYPES[type].label} · ${TYPES[type].label}`;
  return end;
}

const guideQuery = (it) => (it.type === 'return' ? `${it.name} 반품 신청 방법` : it.type === 'warranty' ? `${it.name} 무상 수리 AS 신청` : `${it.name} 해지 방법`);
const guideText = (it) => (it.type === 'return' ? '반품 방법' : it.type === 'warranty' ? 'AS 방법' : '해지 방법');

const BELL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
const soonText = (t) => (t === 'return' ? '반품하려면 지금' : t === 'warranty' ? '수리 맡기려면 지금' : '안 쓸 거면 지금 해지');

function render() {
  const list = $('list');
  list.innerHTML = '';
  const sorted = items.filter((x) => !x.done).sort((a, b) => a.end.localeCompare(b.end));
  const any = items.length > 0;
  $('hero').hidden = any;
  $('board').hidden = !any;
  for (const it of sorted) {
    const d = dday(fromIso(it.end));
    const li = document.createElement('li');
    li.className = `${d >= 0 && d <= 3 ? 'urgent' : ''}${d < 0 ? ' past' : ''}`;
    li.innerHTML = '<button class="item-btn"><span class="dday"></span><span class="info"><b></b><small></small></span><span class="state"></span></button>';
    li.querySelector('.dday').textContent = label(d);
    li.querySelector('b').textContent = it.name;
    li.querySelector('small').textContent = `${TYPES[it.type].label} · ${md(fromIso(it.end))}`;
    const st = li.querySelector('.state');
    if (it.cal) { st.innerHTML = BELL; st.classList.add('on'); st.title = '알림 켜짐'; }
    li.querySelector('button').onclick = () => openItem(it);
    list.append(li);
  }
  const soon = sorted.find((it) => { const d = dday(fromIso(it.end)); return d >= 0 && d <= 3; });
  renderSaved();
  $('family').hidden = !sorted.length;
  $('pro-badge').hidden = !isPro();
}

// 기한 하나를 누르면 아래에서 할 일이 올라옴
let curItem = null;
function openItem(it) {
  curItem = it;
  const end = fromIso(it.end), d = dday(end);
  $('item-name').textContent = it.name;
  $('item-dday').textContent = label(d);
  $('item-dday').classList.toggle('urgent', d >= 0 && d <= 3);
  $('item-meta').textContent = `${TYPES[it.type].label} · ${md(end)}${it.amount ? ` · ${it.amount}` : ''}`;
  $('item-bell').textContent = it.cal ? '알림 다시 설정' : '알림 켜기';
  $('item-guide').textContent = guideText(it);
  $('item-guide').href = `https://www.google.com/search?q=${encodeURIComponent(guideQuery(it))}`;
  $('item-done').textContent = `✓ ${doneText(it.type)}`;
  $('item').showModal();
}
$('item-bell').onclick = () => { if (!curItem) return; $('item').close(); if (native) scheduleNotif(curItem); else openCal(curItem); };
$('item-guide').addEventListener('click', () => curItem && track('guide', curItem.type));
$('item-done').onclick = () => { if (!curItem) return; $('item').close(); markDone(curItem); };
$('item-del').onclick = () => {
  if (!curItem) return;
  const it = curItem; cancelNotif(it); items = items.filter((x) => x !== it); save(); track('delete', it.type);
  $('item').close(); render();
};

// 앱(안드로이드·아이폰): 캘린더 대신 폰 알림을 마감 3일 전·하루 전 오전 9시에 예약
const nid = (it, k) => { let h = 0; for (const c of it.id) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 100000000) * 10 + k; };
const notifText = (it) => (it.type === 'return' ? '반품하려면 지금 신청하세요.' : it.type === 'warranty' ? '무상 수리가 필요하면 지금 신청하세요.' : '계속 쓸 게 아니면 지금 해지하세요.');
async function scheduleNotif(it) {
  if (!notif) return;
  try {
    let p = await notif.checkPermissions();
    if (p.display !== 'granted') p = await notif.requestPermissions();
    if (p.display !== 'granted') { alert('알림 권한이 꺼져 있어요. 폰 설정에서 놓침제로 알림을 켜 주세요.'); return; }
    const end = fromIso(it.end);
    const now = Date.now();
    const list = [];
    for (const [before, k] of [[3, 1], [1, 2]]) {
      const at = new Date(end); at.setDate(at.getDate() - before); at.setHours(9, 0, 0, 0);
      if (at.getTime() > now) list.push({ id: nid(it, k), title: `${it.name} ${TYPES[it.type].label} D-${before}`, body: `${md(end)}까지예요. ${notifText(it)}`, schedule: { at, allowWhileIdle: true } });
    }
    if (!list.length) list.push({ id: nid(it, 3), title: `${it.name} ${TYPES[it.type].label} ${label(dday(end))}`, body: `${md(end)}까지예요. ${notifText(it)}`, schedule: { at: new Date(now + 5000), allowWhileIdle: true } });
    await cancelNotif(it);
    await notif.schedule({ notifications: list });
    it.cal = true; save(); track('notif', it.type); render();
  } catch (e) {
    alert('알림을 예약하지 못했어요. 다시 시도해 주세요.');
  }
}
async function cancelNotif(it) {
  if (!notif) return;
  try { await notif.cancel({ notifications: [1, 2, 3].map((k) => ({ id: nid(it, k) })) }); } catch (e) {}
}

// 처리 완료: 해지·반품·수리를 끝낸 기한을 기록하고 아낀 돈을 모음
function markDone(it) {
  it.done = true; it.saved = won(it.amount); it.doneAt = iso(today());
  cancelNotif(it); save(); track('done', it.type); render();
}
function renderSaved() {
  const year = String(today().getFullYear());
  const thisYear = items.filter((x) => x.done && (x.doneAt || '').startsWith(year));
  $('saved').hidden = !thisYear.length;
  if (!thisYear.length) return;
  const total = thisYear.reduce((a, x) => a + (x.saved || 0), 0);
  $('saved-count').textContent = `${thisYear.length}건`;
  const ul = $('saved-detail'); ul.innerHTML = '';
  if (!isPro()) {
    $('saved').innerHTML = '올해 아낀 돈 <b>보기</b>';
    $('saved-total').textContent = '●●,●●●원';
    $('saved-total').classList.add('locked');
    $('saved-lock').hidden = false;
    return;
  }
  $('saved').innerHTML = `올해 <b>${fmt(total)}</b> 아꼈어요`;
  $('saved-total').textContent = fmt(total);
  $('saved-total').classList.remove('locked');
  $('saved-lock').hidden = true;
  const byMonth = {};
  for (const x of thisYear) { const m = +x.doneAt.slice(5, 7); byMonth[m] = (byMonth[m] || 0) + (x.saved || 0); }
  for (const [m, v] of Object.entries(byMonth).sort((a, b) => b[0] - a[0])) { const li = document.createElement('li'); li.textContent = `${m}월  ${fmt(v)}`; ul.append(li); }
  for (const x of thisYear.slice(-5).reverse()) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = `${x.name} · ${fmt(x.saved || 0)}`; ul.append(li); }
}
$('saved').onclick = () => $('report').showModal();

let calItem = null;
function openCal(it) {
  calItem = it;
  const end = fromIso(it.end);
  const next = new Date(end); next.setDate(next.getDate() + 1);
  const compact = (d) => iso(d).replaceAll('-', '');
  $('cal-title').textContent = `${it.name} · ${TYPES[it.type].label}`;
  $('cal-when').textContent = `${md(end)} · 3일 전·하루 전에 알려요`;
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
// 시트 바깥(어두운 부분)을 누르면 닫기
document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

$('read').onclick = () => {
  const text = $('text').value.trim();
  if (!text) { $('text').focus(); return; }
  const p = parse(text);
  $('f-name').value = p.name;
  $('f-type').value = p.type;
  $('f-base').value = iso(p.base);
  $('f-n').value = p.n;
  $('f-unit').value = p.unit;
  $('confirm').classList.add('show'); $('paste-area').classList.add('hide');
  preview();
  $('confirm').querySelector('.edit').open = !p.baseFound;
  track('parse', p.type);
};
['f-name', 'f-type', 'f-base', 'f-n', 'f-unit'].forEach((id) => $(id).addEventListener('input', preview));
$('f-type').addEventListener('change', () => {
  const d = TYPES[$('f-type').value]; $('f-n').value = d.n; $('f-unit').value = d.unit; preview();
});
$('add').onclick = () => {
  if (!isPro() && items.filter((x) => !x.done).length >= FREE_LIMIT) { track('limit_hit'); lockDialog('무료는 5개까지예요', '끝난 기한을 완료로 옮기거나 프리미엄을 써 보세요.'); return; }
  const end = preview();
  const type = $('f-type').value;
  const it = {
    id: uid.slice(0, 8) + Date.now().toString(36),
    name: $('f-name').value.trim() || TYPES[type].label,
    type, end: iso(end), amount: parse($('text').value).amount, cal: false,
  };
  items.push(it);
  save(); track('add', type); render();
  $('confirm').classList.remove('show'); $('paste-area').classList.remove('hide'); $('text').value = '';
  $('add-sheet').close();
  if (native) scheduleNotif(it); else openCal(it);
};
$('cancel').onclick = () => { $('confirm').classList.remove('show'); $('paste-area').classList.remove('hide'); $('text').focus(); };

// 프리미엄: 결제 화면 캡처를 올리면 글자를 읽어 붙여넣기 칸에 채우고 바로 기한 찾기
function shrink(file) {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); ok(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = no; img.src = URL.createObjectURL(file);
  });
}
function lockDialog(title, body) { $('limit-title').textContent = title; $('limit-body').textContent = body; $('limit').showModal(); }
$('photo').addEventListener('click', (e) => {
  if (!isPro()) { e.preventDefault(); track('ocr_lock'); lockDialog('캡처 올리기는 프리미엄', '앱 결제 화면을 캡처만 올리면 기한을 찾아요.'); }
});

// 프리미엄: 진행 중인 기한을 링크 하나로 가족에게 보내기 (서버에 저장하지 않고 링크 안에만 담김)
const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
$('family').onclick = async () => {
  $('menu').close();
  if (!isPro()) { track('family_lock'); lockDialog('가족 공유는 프리미엄', '같이 챙길 기한을 링크 하나로 보내요.'); return; }
  const list = items.filter((x) => !x.done).map(({ name, type, end, amount }) => [name, type, end, amount || '']);
  const url = `${SITE}/#share=${b64(JSON.stringify(list))}`;
  const text = `놓침제로 기한 ${list.length}개`;
  track('family_out', String(list.length));
  if (navigator.share) { try { await navigator.share({ title: '놓침제로 기한 목록', text, url }); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(`${text} ${url}`); $('family').textContent = '링크 복사됨'; } catch (e) {} }
};
let incoming = [];
function readShare() {
  try {
    const m = location.hash.match(/share=([\w-]+)/);
    if (!m) return;
    incoming = JSON.parse(unb64(m[1])).filter((x) => Array.isArray(x) && TYPES[x[1]] && /^\d{4}-\d{2}-\d{2}$/.test(x[2])).slice(0, 50)
      .map(([name, type, end, amount]) => ({ name: String(name).slice(0, 40), type, end, amount: String(amount).slice(0, 20) }));
    history.replaceState(null, '', location.pathname);
  } catch (e) { incoming = []; }
  if (!incoming.length) return;
  $('import-title').textContent = `받은 기한 ${incoming.length}개`;
  $('import-list').innerHTML = '';
  for (const x of incoming) { const li = document.createElement('li'); li.textContent = `${x.name} · ${TYPES[x.type].label} ${md(fromIso(x.end))}`; $('import-list').append(li); }
  setTimeout(() => $('import').showModal(), 300);
}
readShare();
window.addEventListener('hashchange', readShare);
$('import-ok').onclick = (e) => {
  e.preventDefault();
  let n = 0;
  for (const x of incoming) {
    if (items.some((y) => !y.done && y.name === x.name && y.end === x.end)) continue;
    items.push({ id: uid.slice(0, 8) + Date.now().toString(36) + n, ...x, cal: false }); n++;
  }
  save(); track('family_in', String(n)); $('import').close(); render();
};
$('photo').addEventListener('change', async () => {
  const f = $('photo').files[0]; $('photo').value = '';
  if (!f) return;
  const msg = $('photo-msg'); msg.hidden = false; msg.textContent = '읽는 중…';
  try {
    const image = await shrink(f);
    const r = await fetch(`${API}/api/ocr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, key: (proInfo() || {}).key }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.text) { msg.textContent = r.status === 402 ? '프리미엄 키를 다시 확인해 주세요.' : '못 읽었어요. 문자를 붙여 넣어 주세요.'; return; }
    msg.hidden = true; $('text').value = d.text; track('ocr'); $('read').click();
  } catch (e) { msg.textContent = '사진을 열 수 없어요.'; }
});

// 다른 앱에서 공유로 보낸 글: 웹(홈 화면 앱)은 주소의 text, 안드로이드 앱은 NzAndroid로 받음
window.nzShared = (t) => {
  if (!t) return;
  openAdd(); $('text').value = String(t).slice(0, 2000); track('share_in', native ? platform : 'web');
  setTimeout(() => $('read').click(), 200);
};
nzShared([params.get('title'), params.get('text')].filter(Boolean).join(' '));
try { if (window.NzAndroid) nzShared(window.NzAndroid.takeShared()); } catch (e) {}

function openAdd() {
  if ($('add-sheet').open) return;
  $('confirm').classList.remove('show'); $('paste-area').classList.remove('hide'); $('photo-msg').hidden = true; $('text').value = '';
  $('add-sheet').showModal();
}
// ＋를 누르면 복사해 둔 결제 문자를 바로 읽어서 기한까지 찾음 (못 읽으면 붙여넣기 칸)
$('open-add').onclick = async () => {
  openAdd();
  try {
    const t = navigator.clipboard && navigator.clipboard.readText ? (await navigator.clipboard.readText()).trim() : '';
    if (t && /\d/.test(t) && t.length >= 10) { $('text').value = t.slice(0, 2000); track('clip'); $('read').click(); return; }
  } catch (e) {}
  $('text').focus();
};
$('menu-btn').onclick = () => $('menu').showModal();

{
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'text-btn'; b.textContent = '예시로 해 보기';
  let i = 0;
  b.onclick = () => { const list = samples(); $('text').value = list[i++ % list.length][1]; $('read').click(); };
  $('samples').append(b);
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('install').hidden = !$('apk').hidden; });
window.addEventListener('appinstalled', () => { $('install').hidden = true; track('installed'); });
if (isIOS && !standalone && !native) $('install').hidden = false;
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
  const url = `${native ? SITE : location.origin}/?from=share`;
  const text = '무료체험·구독 마감 전에 알려 주는 앱';
  track('share');
  if (navigator.share) {
    try { await navigator.share({ title: '놓침제로', text, url }); } catch (e) {}
  } else {
    try { await navigator.clipboard.writeText(`${text} ${url}`); $('share').textContent = '링크 복사됨'; } catch (e) {}
  }
};

// 앱 안에서는 설치 안내 대신 폰 알림 문구로 바꾸기
if (native) {
  document.body.classList.add('native');
}
// 안드로이드 브라우저로 들어온 사람에게 앱 받기 버튼 보여 주기
const apk = $('apk');
if (apk && !native && /Android/i.test(navigator.userAgent)) { apk.hidden = false; apk.onclick = () => track('apk'); $('install').hidden = true; }

track('visit', native ? platform : standalone ? 'pwa' : '');
render();
// 프리미엄 키는 사흘마다 다시 확인 (구독이 끝나면 무료로 돌아감)
{ const p = proInfo(); if (p && p.key && Date.now() - (p.at || 0) > 3 * 86400000) checkLicense(p.key).then((r) => { store.set('nz-pro', r); render(); }).catch(() => {}); }
if (!native && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
