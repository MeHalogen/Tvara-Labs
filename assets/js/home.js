/* ══════════════════════════════════════════
   ThinkFast — Home Page Logic
   ══════════════════════════════════════════ */

import { initCarousel } from './carousel.js';

const LS_PP = 'tf_pp_best';
const LS_RR = 'tf_rr_best';

function getBest(key) {
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function refreshHomeBests() {
  // Pattern Pulse
  const ppBest = getBest(LS_PP);
  const ppEl   = document.getElementById('home-best');
  const ppChip = document.getElementById('home-best-chip');
  if (ppEl)   ppEl.textContent = ppBest > 0 ? ppBest : '—';
  if (ppChip && ppBest > 0) ppChip.classList.add('show');

  // Reflex Rush
  const rrBest = getBest(LS_RR);
  const rrEl   = document.getElementById('home-rr-best');
  const rrChip = document.getElementById('home-rr-chip');
  if (rrEl)   rrEl.textContent = rrBest > 0 ? rrBest : '—';
  if (rrChip && rrBest > 0) rrChip.classList.add('show');
}

function init() {
  refreshHomeBests();
  initCarousel('games-carousel', 'carousel-dots');

  // Hero CTA → Pattern Pulse
  const heroBtn = document.getElementById('hero-play-btn');
  if (heroBtn) heroBtn.addEventListener('click', () => { location.href = 'games/pattern-pulse.html'; });

  // Pattern Pulse card
  const pulseCard = document.getElementById('card-pulse');
  if (pulseCard) pulseCard.addEventListener('click', () => { location.href = 'games/pattern-pulse.html'; });

  // Reflex Rush card
  const reflexCard = document.getElementById('card-reflex');
  if (reflexCard) reflexCard.addEventListener('click', () => { location.href = 'games/reflex-rush.html'; });
}

document.addEventListener('DOMContentLoaded', init);

