const slides = [...document.querySelectorAll('.slide')];
const counter = document.getElementById('counter');
const bar = document.getElementById('bar');
let current = 0;

function show(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, n) => s.classList.toggle('active', n === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  bar.style.width = `${((current + 1) / slides.length) * 100}%`;
  history.replaceState(null, '', `#${current + 1}`);
}

document.getElementById('prev').addEventListener('click', () => show(current - 1));
document.getElementById('next').addEventListener('click', () => show(current + 1));

document.addEventListener('keydown', (e) => {
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); show(current + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); show(current - 1); }
  if (e.key === 'Home') show(0);
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
