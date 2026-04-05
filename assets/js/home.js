/* ══════════════════════════════════════════
   Tvara — Home Page Logic
   ══════════════════════════════════════════ */

import { initTryARound } from './try-a-round.js';

const LS_PP = 'tf_pp_best';
const LS_RR = 'tf_rr_best';
const LS_LL = 'tf_ll_best';
const LS_MG = 'tf_mg_best';
const LS_SM = 'tf_sm_best';
const LS_WS = 'tf_ws_best';

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

  // Memory Grid
  const mgBest = getBest(LS_MG);
  const mgEl   = document.getElementById('home-mg-best');
  const mgChip = document.getElementById('home-mg-chip');
  if (mgEl)   mgEl.textContent = mgBest > 0 ? mgBest : '—';
  if (mgChip && mgBest > 0) mgChip.classList.add('show');

  // Speed Math
  const smBest = getBest(LS_SM);
  const smEl   = document.getElementById('home-sm-best');
  const smChip = document.getElementById('home-sm-chip');
  if (smEl)   smEl.textContent = smBest > 0 ? smBest : '—';
  if (smChip && smBest > 0) smChip.classList.add('show');

  // Word Scramble
  const wsBest = getBest(LS_WS);
  const wsEl   = document.getElementById('home-ws-best');
  const wsChip = document.getElementById('home-ws-chip');
  if (wsEl)   wsEl.textContent = wsBest > 0 ? wsBest : '—';
  if (wsChip && wsBest > 0) wsChip.classList.add('show');
}

function init() {
  // ── Landing page enter button ──
  const landingView = document.getElementById('landing-view');
  const homeView    = document.getElementById('home-view');
  const enterBtn    = document.getElementById('landing-enter-btn');

  if (enterBtn && landingView && homeView) {
    enterBtn.addEventListener('click', () => {
      landingView.classList.add('landing-exit');
      setTimeout(() => {
        landingView.style.display = 'none';
        homeView.classList.remove('home-hidden');
      }, 600);
    });
  }

  refreshHomeBests();

  // Hero CTA → Pattern Pulse
  const heroBtn = document.getElementById('hero-play-btn');
  if (heroBtn) heroBtn.addEventListener('click', () => { location.href = '/games/pattern-pulse'; });

  // Pattern Pulse card
  const pulseCard = document.getElementById('card-pulse');
  if (pulseCard) pulseCard.addEventListener('click', () => { location.href = '/games/pattern-pulse'; });

  // Reflex Rush card
  const reflexCard = document.getElementById('card-reflex');
  if (reflexCard) reflexCard.addEventListener('click', () => { location.href = '/games/reflex-rush'; });

  // Logic Lock card
  const logicCard = document.getElementById('card-logic');
  if (logicCard) logicCard.addEventListener('click', () => { location.href = '/games/logic-lock'; });

  // Memory Grid card
  const memoryCard = document.getElementById('card-memory');
  if (memoryCard) memoryCard.addEventListener('click', () => { location.href = '/games/memory-grid'; });

  // Speed Math card
  const speedMathCard = document.getElementById('card-speedmath');
  if (speedMathCard) speedMathCard.addEventListener('click', () => { location.href = '/games/speed-math'; });

  // Word Scramble card
  const wsCard = document.getElementById('card-wordscramble');
  if (wsCard) wsCard.addEventListener('click', () => { location.href = '/games/word-scramble'; });

  // Try a Round — homepage preview
  initTryARound();
}

document.addEventListener('DOMContentLoaded', init);

