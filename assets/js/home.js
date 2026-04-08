/* ══════════════════════════════════════════
   Tvara — Home Page Logic
   ══════════════════════════════════════════ */

import { initTryARound } from './try-a-round.js';
import { loadUser } from './user.js';

const LS_PP = 'tf_pp_best';
const LS_RR = 'tf_rr_best';
const LS_LL = 'tf_ll_best';
const LS_MG = 'tf_mg_best';
const LS_SM = 'tf_sm_best';
const LS_WS = 'tf_ws_best';
const LS_PS = 'tf_ps_best';
const LS_PC = 'tf_pc_best';

function getBest(key) {
  return parseInt(localStorage.getItem(key) || '0', 10);
}

/* ── Live activity counter ── */
function initLiveCounter() {
  const els = [
    document.getElementById('hero-counter'),
    document.getElementById('landing-counter'),
  ].filter(Boolean);
  if (!els.length) return;

  // Seed a random base in range so different visitors see slightly different numbers
  let count = 118 + Math.floor(Math.random() * 24); // 118–141

  function update(el) {
    el.textContent = count;
  }
  els.forEach(update);

  setInterval(() => {
    // Drift ±1 or ±2, bias slightly upward, clamp to 110–155
    const delta = Math.random() < 0.6 ? 1 : (Math.random() < 0.5 ? 2 : -1);
    count = Math.min(155, Math.max(110, count + delta));
    els.forEach(el => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = count;
        el.style.opacity = '1';
      }, 150);
    });
  }, 3800 + Math.random() * 1400); // 3.8–5.2s interval
}

/* ── Hero mini quiz ── */
function initHeroQuiz() {
  const widget = document.getElementById('hq-widget');
  if (!widget) return;

  const opts     = widget.querySelectorAll('.hq-opt');
  const feedback = document.getElementById('hq-feedback');
  const blank    = widget.querySelector('.hq-blank');

  opts.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Already answered
      if (widget.dataset.answered) return;
      widget.dataset.answered = '1';

      // Ripple effect
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x    = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
      const y    = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
      const rpl  = document.createElement('span');
      rpl.className = 'hq-ripple';
      rpl.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
      btn.appendChild(rpl);
      setTimeout(() => rpl.remove(), 400);

      const isCorrect = btn.dataset.correct === 'true';

      // Style all buttons
      opts.forEach(o => {
        o.disabled = true;
        if (o.dataset.correct === 'true') {
          o.classList.add('correct');
        } else if (o === btn && !isCorrect) {
          o.classList.add('wrong');
        } else {
          o.classList.add('dimmed');
        }
      });

      // Reveal answer in sequence
      if (blank) blank.textContent = '49';
      if (blank) blank.classList.add('revealed');

      // Feedback
      feedback.className = 'hq-feedback ' + (isCorrect ? 'fb-correct' : 'fb-wrong');
      feedback.textContent = isCorrect
        ? "✓ You're faster than 68% of people."
        : '✗ Close. The answer is 49 — perfect squares.';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => feedback.classList.add('show'));
      });
    });
  });
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

  // Prime Sprint
  const psBest = getBest(LS_PS);
  const psEl   = document.getElementById('home-ps-best');
  const psChip = document.getElementById('home-ps-chip');
  if (psEl)   psEl.textContent = psBest > 0 ? psBest : '—';
  if (psChip && psBest > 0) psChip.classList.add('show');

  // Percent Panic
  const pcBest = getBest(LS_PC);
  const pcEl   = document.getElementById('home-pc-best');
  const pcChip = document.getElementById('home-pc-chip');
  if (pcEl)   pcEl.textContent = pcBest > 0 ? pcBest : '—';
  if (pcChip && pcBest > 0) pcChip.classList.add('show');
}

function initTracks() {
  const wrap = document.getElementById('tracks');
  if (!wrap) return;
  const pills = wrap.querySelectorAll('.track-pill');
  const cards = Array.from(document.querySelectorAll('.games-grid .game-card'));
  if (!pills.length || !cards.length) return;

  function setActive(track) {
    pills.forEach(p => {
      const isActive = p.dataset.track === track;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    cards.forEach(card => {
      const t = card.dataset.track || 'all';
      const show = track === 'all' || t === track;
      card.style.display = show ? '' : 'none';
    });
  }

  pills.forEach(p => {
    p.addEventListener('click', () => setActive(p.dataset.track || 'all'));
  });

  setActive('all');
}

function initUserBadge() {
  const user    = loadUser();
  const nameEl  = document.getElementById('user-name');
  const streakEl = document.getElementById('user-streak');
  const bestEl  = document.getElementById('user-best');

  if (nameEl)   nameEl.textContent  = user.username;
  if (streakEl) {
    streakEl.textContent = user.streak >= 1 ? `🔥 ${user.streak}d` : '';
    streakEl.style.display = user.streak >= 1 ? '' : 'none';
  }
  if (bestEl) {
    bestEl.textContent  = user.bestScore > 0 ? `Best: ${user.bestScore}/5` : '';
    bestEl.style.display = user.bestScore > 0 ? '' : 'none';
  }
}

function init() {
  refreshHomeBests();
  initLiveCounter();
  initHeroQuiz();
  initUserBadge();
  initTracks();

  // Landing enter → show home view (existing behaviour)
  // Hero CTA + landing CTA → launch session overlay (imported by session.js)
  const heroBtn = document.getElementById('hero-play-btn');
  if (heroBtn) heroBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('tvara:start-session'));
  });

  // Mock Set banner button
  const mockBtn = document.getElementById('mock-set-btn');
  if (mockBtn) mockBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('tvara:start-mock'));
  });

  // Landing enter button → dismiss splash, show home page
  const landingEnterBtn = document.getElementById('landing-enter-btn');
  const landingView2    = document.getElementById('landing-view');
  const homeView2       = document.getElementById('home-view');
  if (landingEnterBtn && landingView2 && homeView2) {
    // Replace the landing history entry so "back" never returns to it
    history.replaceState({ view: 'landing' }, '');

    landingEnterBtn.addEventListener('click', () => {
      // Push a new entry so the page URL stays the same but back leads here, not landing
      history.pushState({ view: 'home' }, '');

      landingView2.classList.add('landing-exit');
      setTimeout(() => {
        landingView2.style.display = 'none';
        homeView2.classList.remove('home-hidden');
      }, 600);
    });

    // If the user somehow hits the browser back button while on home, intercept it
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view === 'landing') {
        // Don't show landing again — push home state back
        history.pushState({ view: 'home' }, '');
      }
    });
  }

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

  // Prime Sprint card
  const primeCard = document.getElementById('card-prime');
  if (primeCard) primeCard.addEventListener('click', () => { location.href = '/games/prime-sprint'; });

  // Percent Panic card
  const percentCard = document.getElementById('card-percent');
  if (percentCard) percentCard.addEventListener('click', () => { location.href = '/games/percent-panic'; });

  // Try a Round — homepage preview
  initTryARound();
}

document.addEventListener('DOMContentLoaded', init);

