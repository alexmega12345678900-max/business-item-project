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

function show(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
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
