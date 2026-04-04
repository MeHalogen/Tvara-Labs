/* ══════════════════════════════════════════
   ThinkFast — Reflex Rush Game Logic
   ══════════════════════════════════════════ */

const LS_KEY = 'tf_rr_best';
const ROUNDS  = 10; // hits needed to finish one game

// ── Colour variants ──────────────────────────────────
const COLOURS = ['c-green', 'c-blue', 'c-purple', 'c-amber', 'c-red', 'c-cyan'];
const EMOJIS  = ['🎯', '⭐', '💎', '🔥', '❄️', '💜'];

// ── Speed tiers (ms window to tap) ──────────────────
const SPEED_TIERS = [
  { label: 'Slow',   class: 'slow',   window: 2200, minScore: 0  },
  { label: 'Medium', class: 'medium', window: 1600, minScore: 4  },
  { label: 'Fast',   class: 'fast',   window: 1100, minScore: 7  },
  { label: 'Insane', class: 'insane', window: 750,  minScore: 10 },
];

const state = {
  score:      0,
  misses:     0,
  totalTaps:  0,   // correct taps (for avg reaction time)
  totalMs:    0,   // sum of reaction times
  roundHits:  [],  // 'hit' | 'miss' per round (last 7 shown)
  running:    false,
  targetTimer: null,
  waitTimer:   null,
  ringInterval: null,
  targetShown: 0,  // timestamp when target appeared
};

// ── Audio ────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudio() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }
function playTone(freq, type, dur, vol = 0.15) {
  try {
    const ctx = getAudio(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}
const SFX = {
  hit()   { playTone(800, 'sine', 0.08, 0.14); setTimeout(() => playTone(1050, 'sine', 0.1, 0.1), 60); },
  miss()  { playTone(180, 'sawtooth', 0.2, 0.16); },
  start() { playTone(520, 'sine', 0.1, 0.1); setTimeout(() => playTone(700, 'sine', 0.12, 0.1), 110); },
  finish(){ playTone(440,'sine',0.1,0.1); setTimeout(()=>playTone(550,'sine',0.12,0.1),120); setTimeout(()=>playTone(660,'sine',0.18,0.12),260); },
};

// ── Persistence ──────────────────────────────────────
function getBest()    { return parseInt(localStorage.getItem(LS_KEY) || '0', 10); }
function saveBest(n)  { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Helpers ───────────────────────────────────────────
function rand(a, b)   { return Math.floor(Math.random() * (b - a + 1)) + a; }

function getSpeedTier(score) {
  return [...SPEED_TIERS].reverse().find(t => score >= t.minScore) || SPEED_TIERS[0];
}

function showToast(msg, dur = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// ── Screen management ────────────────────────────────
function showScreen(id) {
  ['rr-preplay', 'rr-game', 'rr-gameover'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

// ── Score badge ──────────────────────────────────────
function updateScore() {
  const b = document.getElementById('rr-score');
  b.textContent = 'Score: ' + state.score;
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
}

// ── Speed badge ──────────────────────────────────────
function updateSpeedBadge() {
  const tier = getSpeedTier(state.score);
  const el   = document.getElementById('rr-speed-badge');
  el.className  = 'rr-speed-badge ' + tier.class;
  el.textContent = tier.label;
}

// ── Streak dots (last 7) ─────────────────────────────
function updateStreak() {
  const wrap  = document.getElementById('rr-streak-dots');
  const last7 = state.roundHits.slice(-7);
  wrap.innerHTML = '';
  last7.forEach(r => {
    const d = document.createElement('div');
    d.className = 'rr-streak-dot ' + (r === 'hit' ? 'hit-dot' : 'miss-dot');
    wrap.appendChild(d);
  });
  // fill remaining empty
  for (let i = last7.length; i < 7; i++) {
    const d = document.createElement('div');
    d.className = 'rr-streak-dot';
    wrap.appendChild(d);
  }
}

// ── Ring countdown ───────────────────────────────────
function startRing(windowMs) {
  const fill = document.getElementById('rr-timer-fill');
  const CIRC = 100; // matches stroke-dasharray
  let elapsed = 0;
  const TICK  = 60;
  clearInterval(state.ringInterval);
  fill.style.strokeDashoffset = '0';
  fill.classList.remove('warning', 'danger');

  state.ringInterval = setInterval(() => {
    elapsed += TICK;
    const pct    = elapsed / windowMs;
    fill.style.strokeDashoffset = (pct * CIRC).toFixed(2);
    if (pct >= 0.75)      fill.classList.add('danger');
    else if (pct >= 0.5)  { fill.classList.remove('danger'); fill.classList.add('warning'); }
    if (elapsed >= windowMs) clearInterval(state.ringInterval);
  }, TICK);
}

// ── Place & show target ──────────────────────────────
function showTarget() {
  if (!state.running) return;
  const arena  = document.getElementById('rr-arena');
  const target = document.getElementById('rr-target');
  const aw     = arena.clientWidth;
  const ah     = arena.clientHeight;
  const tier   = getSpeedTier(state.score);
  const size   = rand(52, 78); // px

  // random position keeping target inside arena
  const margin = 10;
  const x = rand(margin, aw - size - margin);
  const y = rand(margin, ah - size - margin);

  // pick random colour + emoji
  const ci     = rand(0, COLOURS.length - 1);
  target.className = 'rr-target ' + COLOURS[ci];
  target.textContent = EMOJIS[ci];
  target.style.width  = size + 'px';
  target.style.height = size + 'px';
  target.style.left   = x + 'px';
  target.style.top    = y + 'px';
  target.style.fontSize = (size * 0.42) + 'px';

  // hide "get ready"
  document.getElementById('rr-get-ready').style.opacity = '0';

  // show with spring animation
  requestAnimationFrame(() => target.classList.add('visible'));
  state.targetShown = performance.now();

  startRing(tier.window);

  // auto-miss if not tapped in time
  state.targetTimer = setTimeout(() => {
    if (!state.running) return;
    registerMiss();
  }, tier.window);
}

// ── Schedule next target ─────────────────────────────
function scheduleNext() {
  if (!state.running) return;
  const ready = document.getElementById('rr-get-ready');
  ready.style.opacity = '1';

  // inter-target gap gets slightly shorter as score rises
  const gap = Math.max(500, 900 - state.score * 20);
  state.waitTimer = setTimeout(showTarget, gap);
}

// ── Register hit ─────────────────────────────────────
function registerHit() {
  if (!state.running) return;
  clearTimeout(state.targetTimer);
  clearInterval(state.ringInterval);

  const reactionMs = Math.round(performance.now() - state.targetShown);
  state.totalTaps++;
  state.totalMs += reactionMs;

  const target = document.getElementById('rr-target');
  target.classList.add('pop-out');
  setTimeout(() => target.classList.remove('visible', 'pop-out'), 250);

  const arena = document.getElementById('rr-arena');
  arena.classList.add('hit');
  setTimeout(() => arena.classList.remove('hit'), 350);

  state.score++;
  state.roundHits.push('hit');
  SFX.hit();
  updateScore();
  updateSpeedBadge();
  updateStreak();

  if (state.score >= ROUNDS) {
    setTimeout(triggerGameOver, 200);
  } else {
    scheduleNext();
  }
}

// ── Register miss ────────────────────────────────────
function registerMiss() {
  if (!state.running) return;
  clearInterval(state.ringInterval);

  const target = document.getElementById('rr-target');
  target.classList.remove('visible');

  const arena = document.getElementById('rr-arena');
  arena.classList.add('miss');
  setTimeout(() => arena.classList.remove('miss'), 350);

  state.misses++;
  state.roundHits.push('miss');
  SFX.miss();
  updateStreak();

  // 3 misses = game over
  if (state.misses >= 3) {
    setTimeout(triggerGameOver, 300);
  } else {
    scheduleNext();
  }
}

// ── Game over ────────────────────────────────────────
function triggerGameOver() {
  state.running = false;
  clearTimeout(state.targetTimer);
  clearTimeout(state.waitTimer);
  clearInterval(state.ringInterval);

  // hide target
  const target = document.getElementById('rr-target');
  target.classList.remove('visible');

  saveBest(state.score);
  SFX.finish();
  renderGameOver();
}

function renderGameOver() {
  const best   = getBest();
  const isNew  = state.score > 0 && state.score >= best;
  const avgMs  = state.totalTaps > 0 ? Math.round(state.totalMs / state.totalTaps) : 0;
  const acc    = state.roundHits.length > 0
    ? Math.round((state.score / state.roundHits.length) * 100)
    : 0;

  const tiers = [
    { min: 0,  emoji: '😴', msg: "Warming up! 💤" },
    { min: 3,  emoji: '👀', msg: "Stay sharp! 👀" },
    { min: 6,  emoji: '⚡', msg: "Good reflexes! ⚡" },
    { min: 8,  emoji: '🔥', msg: "Quick hands! 🔥" },
    { min: 10, emoji: '🏆', msg: "Reflex master! 🏆" },
  ];
  const tier = [...tiers].reverse().find(t => state.score >= t.min) || tiers[0];

  document.getElementById('rr-go-emoji').textContent = tier.emoji;
  document.getElementById('rr-go-msg').textContent   = tier.msg;
  document.getElementById('rr-final-score').textContent = state.score;
  document.getElementById('rr-best-display').textContent = best;
  document.getElementById('rr-go-sub').textContent = state.score === 0
    ? 'Better luck next time!'
    : `You hit ${state.score} of ${state.roundHits.length} targets.`;

  // stat row
  document.getElementById('rr-stat-avg').textContent  = avgMs > 0 ? avgMs + 'ms' : '—';
  document.getElementById('rr-stat-acc').textContent  = acc + '%';
  document.getElementById('rr-stat-miss').textContent = state.misses;

  const bestEl = document.getElementById('rr-best-display');
  bestEl.classList.remove('new-best');
  if (isNew) {
    void bestEl.offsetWidth;
    bestEl.classList.add('new-best');
    document.getElementById('rr-beat-best').textContent = '🎉 New personal best!';
  } else if (best > 0) {
    document.getElementById('rr-beat-best').textContent = `Can you beat ${best}?`;
  } else {
    document.getElementById('rr-beat-best').textContent = '';
  }

  const sb = document.getElementById('rr-share-btn');
  sb.textContent = '🔗 Share Score'; sb.classList.remove('copied');

  showScreen('rr-gameover');
}

// ── Share ────────────────────────────────────────────
function shareScore() {
  const score = parseInt(document.getElementById('rr-final-score').textContent, 10);
  const avg   = document.getElementById('rr-stat-avg').textContent;
  const text  = `I scored ${score}/10 on Reflex Rush ⚡🎯 (avg reaction: ${avg}) — beat me!\nPlay ThinkFast: ${location.origin}`;
  const btn   = document.getElementById('rr-share-btn');
  if (navigator.share) {
    navigator.share({ title: 'ThinkFast · Reflex Rush', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => {
        btn.textContent = '✅ Copied!'; btn.classList.add('copied');
        showToast('Score copied to clipboard!');
        setTimeout(() => { btn.textContent = '🔗 Share Score'; btn.classList.remove('copied'); }, 2500);
      })
      .catch(() => showToast('Could not copy — try manually!'));
  }
}

// ── Launch ───────────────────────────────────────────
function launchGame() {
  state.score      = 0;
  state.misses     = 0;
  state.totalTaps  = 0;
  state.totalMs    = 0;
  state.roundHits  = [];
  state.running    = true;

  updateScore();
  updateSpeedBadge();
  updateStreak();

  document.getElementById('rr-round-label').textContent = `0 / ${ROUNDS} hits`;
  document.getElementById('rr-get-ready').style.opacity = '1';

  // hide target
  const target = document.getElementById('rr-target');
  target.classList.remove('visible', 'pop-out');

  SFX.start();
  showScreen('rr-game');
  scheduleNext();
}

// watch score for round label
const _origUpdateScore = updateScore;
function updateScoreAndRound() {
  _origUpdateScore();
  document.getElementById('rr-round-label').textContent = `${state.score} / ${ROUNDS} hits`;
}
// override
Object.defineProperty(window, '_rrUpdateScore', { value: updateScoreAndRound });

// ── Init ─────────────────────────────────────────────
function init() {
  document.getElementById('rr-best').textContent = getBest() || '—';

  // intercept hit on target
  document.getElementById('rr-target').addEventListener('click', () => {
    if (!state.running) return;
    registerHit();
  });
  // tap on arena background = miss (only when target is visible)
  document.getElementById('rr-arena').addEventListener('click', e => {
    if (!state.running) return;
    if (e.target === document.getElementById('rr-target')) return;
    if (!document.getElementById('rr-target').classList.contains('visible')) return;
    registerMiss();
  });

  document.getElementById('rr-play-btn').addEventListener('click', launchGame);
  document.getElementById('rr-restart-btn').addEventListener('click', launchGame);
  document.getElementById('rr-share-btn').addEventListener('click', shareScore);
  document.getElementById('rr-menu-btn').addEventListener('click', () => {
    location.href = '../index.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
