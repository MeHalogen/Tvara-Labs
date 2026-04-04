/* ══════════════════════════════════════════
   ThinkFast — Home Page Logic
   ══════════════════════════════════════════ */

import { initCarousel } from './carousel.js';

const LS_PP = 'tf_pp_best';
const LS_RR = 'tf_rr_best';
const LS_LL = 'tf_ll_best';

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

  // Logic Lock
  const llBest = getBest(LS_LL);
  const llEl   = document.getElementById('home-ll-best');
  const llChip = document.getElementById('home-ll-chip');
  if (llEl)   llEl.textContent = llBest > 0 ? llBest : '—';
  if (llChip && llBest > 0) llChip.classList.add('show');
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

  // Logic Lock card
  const logicCard = document.getElementById('card-logic');
  if (logicCard) logicCard.addEventListener('click', () => { location.href = 'games/logic-lock.html'; });
}

document.addEventListener('DOMContentLoaded', init);

