const slides = [...document.querySelectorAll('.slide')];
const counter = document.getElementById('counter');
const bar = document.getElementById('bar');
let current = 0;

// data-stage가 있는 슬라이드 상단에 기승전결 표시
const STAGES = [['기', '문제'], ['승', '원인'], ['전', '해결'], ['결', '가치']];
slides.filter((s) => s.dataset.stage).forEach((s) => {
  const ol = document.createElement('ol');
  ol.className = 'stages';
  ol.setAttribute('aria-label', '발표 단계');
  ol.innerHTML = STAGES.map(([k, v]) =>
    `<li class="${k === s.dataset.stage ? 'on' : ''}"><b>${k}</b>${v}</li>`).join('');
  s.prepend(ol);
});

// 발표자 화면(P 키로 새 창): 두 창이 같은 슬라이드를 보도록 서로 알림
const presenter = new URLSearchParams(location.search).has('presenter');
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('nochim-deck') : null;

function show(i, fromOther = false) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  if (channel && !fromOther) channel.postMessage({ slide: current });
  slides.forEach((s, n) => s.classList.toggle('active', n === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  bar.style.width = `${((current + 1) / slides.length) * 100}%`;
  history.replaceState(null, '', `#${current + 1}`);
  // 데모 애니메이션은 슬라이드를 열 때마다 처음부터 다시 재생
  slides[current].querySelectorAll('.demo').forEach((d) => {
    d.classList.remove('play');
    void d.offsetWidth;
    d.classList.add('play');
  });
  if (presenter) renderPresenter();
}
channel?.addEventListener('message', (e) => show(e.data.slide, true));

function openPresenter() {
  window.open(`${location.pathname}?presenter#${current + 1}`, 'presenter', 'width=1280,height=760');
}

// 발표자 화면: 왼쪽에 현재 슬라이드, 오른쪽에 말할 내용·시간·다음 슬라이드
const toSec = (t) => { const [m, s] = (t || '0:0').split(':').map(Number); return (m * 60 + s) || 0; };
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const plan = slides.map((s) => toSec(s.querySelector('.notes')?.dataset.time));
const planEnd = plan.map((_, i) => plan.slice(0, i + 1).reduce((a, b) => a + b, 0));
let started = Date.now();
let panel;

function fitDeck() {
  const deck = document.getElementById('deck');
  const k = Math.min((innerWidth * 0.6 - 40) / 1280, (innerHeight - 40) / 720);
  deck.style.transform = `scale(${k})`;
}
function renderPresenter() {
  const s = slides[current];
  const next = slides[current + 1];
  const title = (el) => {
    const h = el?.querySelector('h1, h2');
    if (!h) return '끝';
    const c = h.cloneNode(true);
    c.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
    return c.textContent.replace(/\s+/g, ' ').trim();
  };
  panel.querySelector('.p-now').textContent =
    `${current + 1} / ${slides.length}${s.dataset.stage ? ` · ${s.dataset.stage}` : ''} · 목표 ${s.querySelector('.notes')?.dataset.time || '—'}`;
  panel.querySelector('.p-notes').innerHTML = s.querySelector('.notes')?.innerHTML || '';
  panel.querySelector('.p-next').textContent = `다음: ${title(next)}`;
  tick();
}
function tick() {
  const el = (Date.now() - started) / 1000;
  const t = panel.querySelector('.p-time');
  t.textContent = `${fmt(el)} / 목표 ${fmt(planEnd[planEnd.length - 1])}`;
  t.classList.toggle('late', el > planEnd[current]);
}
if (presenter) {
  document.body.classList.add('presenter');
  panel = document.createElement('aside');
  panel.className = 'p-panel';
  panel.innerHTML = '<p class="p-now"></p><p class="p-time"></p><div class="p-notes"></div><p class="p-next"></p><p class="p-help">← → 넘기기 · R 시간 초기화 · 발표 화면과 함께 넘어갑니다</p>';
  document.body.append(panel);
  fitDeck();
  addEventListener('resize', fitDeck);
  setInterval(tick, 1000);
}

// 밝게/어둡게: 처음엔 기기 설정을 따르고, 바꾸면 이 브라우저에 기억
const root = document.documentElement;
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
function toggleTheme() {
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
}
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}
document.getElementById('theme').addEventListener('click', toggleTheme);
document.getElementById('full').addEventListener('click', toggleFull);

document.getElementById('prev').addEventListener('click', () => show(current - 1));
document.getElementById('next').addEventListener('click', () => show(current + 1));

document.addEventListener('keydown', (e) => {
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); show(current + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); show(current - 1); }
  if (e.key === 'Home') show(0);
  if (e.key === 't' || e.key === 'T') toggleTheme();
  if (e.key === 'f' || e.key === 'F') toggleFull();
  if ((e.key === 'p' || e.key === 'P') && !presenter) openPresenter();
  if ((e.key === 'r' || e.key === 'R') && presenter) { started = Date.now(); tick(); }
  if (e.key === 'End') show(slides.length - 1);
});

document.getElementById('deck').addEventListener('click', (e) => {
  if (e.target.closest('a, button, table')) return;
  show(e.clientX > window.innerWidth / 2 ? current + 1 : current - 1);
});

let touchX = null;
document.addEventListener('touchstart', (e) => {
  touchX = e.target.closest('.table-wrap') ? null : e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
  touchX = null;
});

show((parseInt(location.hash.slice(1), 10) || 1) - 1);
