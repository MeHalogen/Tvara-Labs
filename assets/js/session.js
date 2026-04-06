/* ══════════════════════════════════════════════════════
   Tvara — In-Page Session Engine
   SPA challenge flow: hero CTA → 5 challenges → result
   No page reload. Pure state machine.
   ══════════════════════════════════════════════════════ */

import { updateAfterSession, getLeaderboard, loadUser } from './user.js';

/* ─────────────────────────────────────────
   Challenge pool — 5 pattern types
   Each entry: sequence display, answer, distractors, explanation
───────────────────────────────────────── */
const CHALLENGES = [
  {
    seq: '2 → 4 → 8 → 16 → ?',
    answer: 32,
    options: [32, 28, 30, 34],
    hint: 'Each term doubles.',
  },
  {
    seq: '1 → 4 → 9 → 16 → ?',
    answer: 25,
    options: [25, 20, 22, 24],
    hint: 'Perfect squares: 1², 2², 3²…',
  },
  {
    seq: '3 → 6 → 11 → 18 → ?',
    answer: 27,
    options: [27, 24, 26, 29],
    hint: 'Differences: +3, +5, +7, +9…',
  },
  {
    seq: '1 → 1 → 2 → 3 → 5 → ?',
    answer: 8,
    options: [8, 7, 9, 10],
    hint: 'Fibonacci: each term is the sum of the previous two.',
  },
  {
    seq: '100 → 50 → 25 → ?',
    answer: 12.5,
    options: [12.5, 10, 15, 12],
    hint: 'Each term halves.',
  },
  {
    seq: '7 → 14 → 28 → 56 → ?',
    answer: 112,
    options: [112, 96, 104, 120],
    hint: 'Doubles each time.',
  },
  {
    seq: '81 → 27 → 9 → ?',
    answer: 3,
    options: [3, 2, 4, 6],
    hint: 'Divide by 3 each step.',
  },
  {
    seq: '5 → 10 → 20 → 35 → ?',
    answer: 55,
    options: [55, 50, 45, 60],
    hint: 'Differences: +5, +10, +15, +20…',
  },
];

const SESSION_LENGTH = 5;
const QUESTION_TIME  = 10; // seconds

/* ─────────────────────────────────────────
   State
───────────────────────────────────────── */
const state = {
  phase:       'IDLE',   // IDLE | PLAYING | RESULT
  challenges:  [],       // shuffled subset for this session
  round:       0,        // 0-indexed
  scores:      [],       // true/false per round
  times:       [],       // ms taken per round
  roundStart:  0,
  timerRaf:    null,
  autoAdvance: null,
};

/* ─────────────────────────────────────────
   DOM refs (resolved once on DOMContentLoaded)
───────────────────────────────────────── */
let overlay, challengeView, resultView;
let progBar, roundLabel, timerBar;
let sequenceEl, optionsEl, inlineFb;
let resultEmoji, resultTitle, resultScore, resultBadge, resultStreak;
let replayBtn, deeperBtn, backBtn, shareBtn;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSession() {
  return shuffle(CHALLENGES).slice(0, SESSION_LENGTH);
}

function scrambleOptions(ch) {
  return shuffle(ch.options);
}

/* ─────────────────────────────────────────
   View transitions
───────────────────────────────────────── */
function showOverlay() {
  overlay.classList.remove('so-hidden');
  // Double rAF: ensure element is in the paint tree before transition fires
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('so-visible');
      document.body.style.overflow = 'hidden';
    });
  });
}

function hideOverlay() {
  overlay.classList.remove('so-visible');
  setTimeout(() => {
    overlay.classList.add('so-hidden');
    document.body.style.overflow = '';
  }, 350);
}

function switchView(show) {
  const hide = show === challengeView ? resultView : challengeView;
  hide.classList.add('so-view-hidden');
  show.classList.remove('so-view-hidden');
}

/* ─────────────────────────────────────────
   Timer bar
───────────────────────────────────────── */
function startTimer() {
  const duration = QUESTION_TIME * 1000;
  state.roundStart = performance.now();
  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';

  // kick off raf loop
  function tick(now) {
    const elapsed = now - state.roundStart;
    const pct     = Math.max(0, 1 - elapsed / duration);
    timerBar.style.width = (pct * 100) + '%';

    // colour shift: green → amber → red
    if (pct > 0.5) {
      timerBar.style.background = 'linear-gradient(90deg,#6366f1,#818cf8)';
    } else if (pct > 0.25) {
      timerBar.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    } else {
      timerBar.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
    }

    if (pct > 0) {
      state.timerRaf = requestAnimationFrame(tick);
    } else {
      onTimeout();
    }
  }
  state.timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  if (state.timerRaf) {
    cancelAnimationFrame(state.timerRaf);
    state.timerRaf = null;
  }
}

/* ─────────────────────────────────────────
   Round logic
───────────────────────────────────────── */
function loadRound(idx) {
  state.round = idx;
  const ch    = state.challenges[idx];

  // Progress bar + label
  const pct = (idx / SESSION_LENGTH) * 100;
  progBar.style.width = pct + '%';
  roundLabel.textContent = `Round ${idx + 1} of ${SESSION_LENGTH}`;

  // Sequence
  sequenceEl.textContent = ch.seq;
  sequenceEl.classList.remove('so-seq-in');
  void sequenceEl.offsetWidth; // reflow
  sequenceEl.classList.add('so-seq-in');

  // Options
  optionsEl.innerHTML = '';
  scrambleOptions(ch).forEach(val => {
    const btn = document.createElement('button');
    btn.className   = 'so-opt';
    btn.textContent = val;
    btn.dataset.val = val;
    btn.addEventListener('click', () => onAnswer(btn, ch));
    optionsEl.appendChild(btn);
  });

  // Feedback reset
  inlineFb.className = 'so-inline-fb';
  inlineFb.textContent = '';

  // Timer
  stopTimer();
  startTimer();
}

function onTimeout() {
  stopTimer();
  const ch = state.challenges[state.round];
  state.scores.push(false);
  state.times.push(QUESTION_TIME * 1000);

  // show correct answer
  optionsEl.querySelectorAll('.so-opt').forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.val) === ch.answer) b.classList.add('so-opt-correct');
    else b.classList.add('so-opt-dimmed');
  });

  showInlineFeedback(false, `Time's up. Answer: ${ch.answer}  ·  ${ch.hint}`);
  scheduleNextRound();
}

function onAnswer(btn, ch) {
  if (btn.disabled) return;
  stopTimer();

  const elapsed   = performance.now() - state.roundStart;
  const isCorrect = Number(btn.dataset.val) === ch.answer;

  state.scores.push(isCorrect);
  state.times.push(elapsed);

  // Ripple
  spawnRipple(btn);

  // Style buttons
  optionsEl.querySelectorAll('.so-opt').forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.val) === ch.answer) {
      b.classList.add('so-opt-correct');
    } else if (b === btn && !isCorrect) {
      b.classList.add('so-opt-wrong');
      b.classList.add('so-shake');
      setTimeout(() => b.classList.remove('so-shake'), 500);
    } else {
      b.classList.add('so-opt-dimmed');
    }
  });

  if (isCorrect) {
    showInlineFeedback(true, '✓ Correct!');
  } else {
    showInlineFeedback(false, `✗ Answer: ${ch.answer}  ·  ${ch.hint}`);
  }

  scheduleNextRound();
}

function scheduleNextRound() {
  clearTimeout(state.autoAdvance);
  state.autoAdvance = setTimeout(() => {
    const next = state.round + 1;
    if (next < SESSION_LENGTH) {
      loadRound(next);
    } else {
      showResult();
    }
  }, 1600);
}

function showInlineFeedback(correct, text) {
  inlineFb.className = 'so-inline-fb ' + (correct ? 'so-fb-correct' : 'so-fb-wrong');
  inlineFb.textContent = text;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => inlineFb.classList.add('so-fb-show'));
  });
}

function spawnRipple(btn) {
  const rpl  = document.createElement('span');
  rpl.className = 'so-ripple';
  const r = btn.getBoundingClientRect();
  const s = Math.max(r.width, r.height);
  rpl.style.cssText = `width:${s}px;height:${s}px;left:${r.width/2 - s/2}px;top:${r.height/2 - s/2}px`;
  btn.appendChild(rpl);
  setTimeout(() => rpl.remove(), 420);
}

/* ─────────────────────────────────────────
   Result screen
───────────────────────────────────────── */
function showResult() {
  stopTimer();
  progBar.style.width = '100%';

  const correct  = state.scores.filter(Boolean).length;
  const total    = SESSION_LENGTH;
  const avgMs    = state.times.reduce((a, b) => a + b, 0) / total;
  const avgSec   = (avgMs / 1000).toFixed(1);

  // Persist + get updated user data
  const { user, isNewBest } = updateAfterSession(correct, total);

  // Percentile copy (deterministic from score)
  const percentiles = ['', 'Top 85%', 'Top 72%', 'Top 54%', 'Top 31%', 'Top 12%'];
  const pctText = percentiles[correct] || '';

  // Emoji + title
  let emoji = '⚡', title = '';
  if (correct === SESSION_LENGTH) {
    emoji = '🏆'; title = 'Perfect Round';
  } else if (correct >= 4) {
    emoji = '🔥'; title = 'Sharp Mind';
  } else if (correct >= 3) {
    emoji = '⚡'; title = 'Solid Run';
  } else if (correct >= 2) {
    emoji = '🎯'; title = 'Keep Pushing';
  } else {
    emoji = '💡'; title = 'Warm Up Done';
  }

  resultEmoji.textContent = emoji;
  resultTitle.textContent = title;
  resultScore.textContent = `${correct} / ${total} correct  ·  avg ${avgSec}s`;
  resultBadge.textContent = pctText;
  resultBadge.style.display = pctText ? '' : 'none';

  let streakText = '';
  if (user.streak >= 2) streakText = `🔥 ${user.streak}-day streak`;
  else if (isNewBest && correct > 0) streakText = '⭐ New best!';
  resultStreak.textContent = streakText;
  resultStreak.style.display = streakText ? '' : 'none';

  // Leaderboard
  renderLeaderboard(user);

  // Switch view
  switchView(resultView);
}

function renderLeaderboard(user) {
  const board = getLeaderboard(user);
  const el    = document.getElementById('so-leaderboard');
  if (!el) return;

  el.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'so-lb-header';
  header.textContent = 'Today\'s Leaderboard';
  el.appendChild(header);

  board.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'so-lb-row' + (entry.isUser ? ' so-lb-you' : '');

    const rank = document.createElement('span');
    rank.className = 'so-lb-rank';
    rank.textContent = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

    const name = document.createElement('span');
    name.className = 'so-lb-name';
    name.textContent = entry.name + (entry.isUser ? ' (you)' : '');

    const score = document.createElement('span');
    score.className = 'so-lb-score';
    score.textContent = `${entry.score}/${SESSION_LENGTH}`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);
    el.appendChild(row);
  });
}

/* ─────────────────────────────────────────
   Session lifecycle
───────────────────────────────────────── */
function startSession() {
  state.phase      = 'PLAYING';
  state.challenges = pickSession();
  state.scores     = [];
  state.times      = [];

  switchView(challengeView);
  showOverlay();
  loadRound(0);
}

function resetSession() {
  stopTimer();
  clearTimeout(state.autoAdvance);
  state.phase = 'IDLE';
}

/* ─────────────────────────────────────────
   Boot
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  overlay       = document.getElementById('session-overlay');
  challengeView = document.getElementById('so-challenge-view');
  resultView    = document.getElementById('so-result-view');
  progBar       = document.getElementById('so-prog-bar');
  roundLabel    = document.getElementById('so-round-label');
  timerBar      = document.getElementById('so-timer-bar');
  sequenceEl    = document.getElementById('so-sequence');
  optionsEl     = document.getElementById('so-options');
  inlineFb      = document.getElementById('so-inline-fb');
  resultEmoji   = document.getElementById('so-result-emoji');
  resultTitle   = document.getElementById('so-result-title');
  resultScore   = document.getElementById('so-result-score');
  resultBadge   = document.getElementById('so-result-badge');
  resultStreak  = document.getElementById('so-result-streak');
  replayBtn     = document.getElementById('so-replay-btn');
  deeperBtn     = document.getElementById('so-deeper-btn');
  backBtn       = document.getElementById('so-back');
  shareBtn      = document.getElementById('so-share-btn');

  if (!overlay) return;

  // External trigger from home.js
  document.addEventListener('tvara:start-session', startSession);

  // Replay
  replayBtn.addEventListener('click', () => {
    resetSession();
    startSession();
  });

  // Try full game
  deeperBtn.addEventListener('click', () => {
    resetSession();
    hideOverlay();
    location.href = '/games/pattern-pulse';
  });

  // Back / close
  backBtn.addEventListener('click', () => {
    resetSession();
    hideOverlay();
  });

  // Share
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const user    = loadUser();
      const correct = state.scores.filter(Boolean).length;
      const text    = `I scored ${correct}/${SESSION_LENGTH} on Tvara — train your brain at tvaralabs.in 🧠⚡`;
      if (navigator.share) {
        navigator.share({ title: 'Tvara Brain Training', text, url: 'https://tvaralabs.in' })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          const orig = shareBtn.textContent;
          shareBtn.textContent = '✓ Copied!';
          setTimeout(() => { shareBtn.textContent = orig; }, 2000);
        }).catch(() => {});
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.phase !== 'IDLE') {
      resetSession();
      hideOverlay();
    }
  });
});
