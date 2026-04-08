/* ══════════════════════════════════════════════════════
   Tvara — Mock Set Engine
   20-question timed set → full scorecard
   Topics: Number Series, Percentages, Arithmetic,
           Logical Sequences, Primes
   ══════════════════════════════════════════════════════ */

import { loadUser, saveUser } from './user.js';

/* ─────────────────────────────────────────
   Question bank — 20 questions, 5 topics
───────────────────────────────────────── */
const QUESTIONS = [
  // ── Number Series ──────────────────────
  { topic: 'Number Series', q: '2 → 5 → 10 → 17 → ?',         answer: 26,   options: [26, 24, 28, 22],    hint: 'Differences: +3, +5, +7, +9…' },
  { topic: 'Number Series', q: '3 → 9 → 27 → 81 → ?',         answer: 243,  options: [243, 162, 200, 270], hint: 'Each term × 3.' },
  { topic: 'Number Series', q: '1 → 4 → 9 → 16 → 25 → ?',     answer: 36,   options: [36, 30, 32, 40],    hint: 'Perfect squares.' },
  { topic: 'Number Series', q: '100 → 92 → 76 → 52 → ?',       answer: 20,   options: [20, 24, 28, 32],    hint: 'Differences: −8, −16, −24, −32…' },
  { topic: 'Number Series', q: '5 → 11 → 23 → 47 → ?',        answer: 95,   options: [95, 91, 99, 89],    hint: 'Each term × 2 + 1.' },

  // ── Percentages ────────────────────────
  { topic: 'Percentages',   q: '25% of 240 = ?',               answer: 60,   options: [60, 48, 72, 55],    hint: '240 ÷ 4 = 60.' },
  { topic: 'Percentages',   q: '15% of 600 = ?',               answer: 90,   options: [90, 80, 100, 85],   hint: '600 × 0.15 = 90.' },
  { topic: 'Percentages',   q: 'A item costs ₹400. After 20% discount, price = ?', answer: 320, options: [320, 300, 340, 360], hint: '400 − 80 = 320.' },
  { topic: 'Percentages',   q: '₹500 increased by 30% = ?',    answer: 650,  options: [650, 600, 580, 625], hint: '500 + 150 = 650.' },
  { topic: 'Percentages',   q: 'What % of 80 is 20?',          answer: 25,   options: [25, 20, 30, 15],    hint: '20/80 × 100 = 25.' },

  // ── Arithmetic ─────────────────────────
  { topic: 'Arithmetic',    q: '17 × 13 = ?',                  answer: 221,  options: [221, 211, 231, 201], hint: '(15+2)(15−2) = 225 − 4 = 221.' },
  { topic: 'Arithmetic',    q: '144 ÷ 12 + 36 = ?',            answer: 48,   options: [48, 44, 52, 46],    hint: '12 + 36 = 48.' },
  { topic: 'Arithmetic',    q: 'Average of 12, 18, 24, 30 = ?', answer: 21,  options: [21, 20, 22, 18],    hint: '(12+18+24+30)/4 = 84/4 = 21.' },
  { topic: 'Arithmetic',    q: '2³ + 3² = ?',                  answer: 17,   options: [17, 15, 19, 13],    hint: '8 + 9 = 17.' },
  { topic: 'Arithmetic',    q: 'If 8x = 96, then x = ?',       answer: 12,   options: [12, 10, 14, 8],     hint: '96 ÷ 8 = 12.' },

  // ── Logical Sequences ──────────────────
  { topic: 'Logical Reasoning', q: 'A, C, F, J, ?',            answer: 'O',  options: ['O', 'N', 'P', 'M'], hint: 'Gaps: +2, +3, +4, +5…' },
  { topic: 'Logical Reasoning', q: 'AZ, BY, CX, DW, ?',        answer: 'EV', options: ['EV', 'EU', 'FV', 'EW'], hint: 'First letter +1, second letter −1.' },
  { topic: 'Logical Reasoning', q: '2, 6, 12, 20, 30, ?',      answer: 42,   options: [42, 40, 44, 38],    hint: 'n×(n+1): 1×2, 2×3, 3×4…' },
  { topic: 'Logical Reasoning', q: 'Odd one out: 11, 13, 17, 19, 21', answer: 21, options: [21, 11, 13, 17], hint: '21 = 3×7, not prime.' },

  // ── Primes ─────────────────────────────
  { topic: 'Number Theory',  q: 'Which is prime: 91, 97, 99, 87?', answer: 97, options: [97, 91, 99, 87],  hint: '97 has no factors other than 1 and itself.' },
];

const MOCK_LENGTH   = 20;
const QUESTION_TIME = 30; // seconds — more than session, less than exam

/* ─────────────────────────────────────────
   State
───────────────────────────────────────── */
const ms = {
  phase:      'IDLE',
  questions:  [],
  round:      0,
  answers:    [], // { correct, timeTaken, topic }
  roundStart: 0,
  timerRaf:   null,
  autoNext:   null,
};

/* ─────────────────────────────────────────
   DOM refs
───────────────────────────────────────── */
let overlay, questionView, scorecardView;
let mProgBar, mRoundLabel, mTimerBar, mTimerLabel;
let mTopicTag, mQuestionEl, mOptionsEl, mInlineFb;
let mBackBtn;

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

function pickQuestions() {
  return shuffle(QUESTIONS).slice(0, MOCK_LENGTH);
}

/* ─────────────────────────────────────────
   Overlay visibility
───────────────────────────────────────── */
function showOverlay() {
  overlay.classList.remove('ms-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('ms-visible');
    document.body.style.overflow = 'hidden';
  }));
}

function hideOverlay() {
  overlay.classList.remove('ms-visible');
  setTimeout(() => {
    overlay.classList.add('ms-hidden');
    document.body.style.overflow = '';
  }, 350);
}

function switchView(show) {
  [questionView, scorecardView].forEach(v => v.classList.add('ms-view-hidden'));
  show.classList.remove('ms-view-hidden');
}

/* ─────────────────────────────────────────
   Timer
───────────────────────────────────────── */
function startTimer() {
  const duration = QUESTION_TIME * 1000;
  ms.roundStart = performance.now();
  mTimerBar.style.transition = 'none';
  mTimerBar.style.width = '100%';

  function tick(now) {
    const elapsed = now - ms.roundStart;
    const pct = Math.max(0, 1 - elapsed / duration);
    mTimerBar.style.width = (pct * 100) + '%';
    const secLeft = Math.ceil(pct * QUESTION_TIME);
    if (mTimerLabel) mTimerLabel.textContent = secLeft + 's';

    if (pct > 0.5)       mTimerBar.style.background = 'linear-gradient(90deg,#6366f1,#818cf8)';
    else if (pct > 0.25) mTimerBar.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    else                 mTimerBar.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';

    if (pct > 0) {
      ms.timerRaf = requestAnimationFrame(tick);
    } else {
      onTimeout();
    }
  }
  ms.timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  if (ms.timerRaf) { cancelAnimationFrame(ms.timerRaf); ms.timerRaf = null; }
}

/* ─────────────────────────────────────────
   Round logic
───────────────────────────────────────── */
function loadRound(idx) {
  ms.round = idx;
  const q = ms.questions[idx];

  // progress
  const pct = (idx / MOCK_LENGTH) * 100;
  mProgBar.style.width = pct + '%';
  mRoundLabel.textContent = `Q ${idx + 1} / ${MOCK_LENGTH}`;

  // topic tag
  mTopicTag.textContent = q.topic;

  // question
  mQuestionEl.textContent = q.q;
  mQuestionEl.classList.remove('ms-q-in');
  void mQuestionEl.offsetWidth;
  mQuestionEl.classList.add('ms-q-in');

  // options
  mOptionsEl.innerHTML = '';
  shuffle(q.options).forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'ms-opt';
    btn.textContent = val;
    btn.dataset.val = String(val);
    btn.addEventListener('click', () => onAnswer(btn, q));
    mOptionsEl.appendChild(btn);
  });

  // feedback reset
  mInlineFb.className = 'ms-inline-fb';
  mInlineFb.textContent = '';

  stopTimer();
  startTimer();
}

function onTimeout() {
  stopTimer();
  const q = ms.questions[ms.round];
  ms.answers.push({ correct: false, timeTaken: QUESTION_TIME * 1000, topic: q.topic });

  mOptionsEl.querySelectorAll('.ms-opt').forEach(b => {
    b.disabled = true;
    if (String(b.dataset.val) === String(q.answer)) b.classList.add('ms-opt-correct');
    else b.classList.add('ms-opt-dimmed');
  });

  showFb(false, `⏱ Time's up · Answer: ${q.answer} · ${q.hint}`);
  scheduleNext();
}

function onAnswer(btn, q) {
  if (btn.disabled) return;
  stopTimer();

  const elapsed = performance.now() - ms.roundStart;
  const isCorrect = String(btn.dataset.val) === String(q.answer);

  ms.answers.push({ correct: isCorrect, timeTaken: elapsed, topic: q.topic });

  mOptionsEl.querySelectorAll('.ms-opt').forEach(b => {
    b.disabled = true;
    if (String(b.dataset.val) === String(q.answer)) b.classList.add('ms-opt-correct');
    else if (b === btn && !isCorrect) {
      b.classList.add('ms-opt-wrong');
      b.classList.add('ms-shake');
      setTimeout(() => b.classList.remove('ms-shake'), 500);
    } else b.classList.add('ms-opt-dimmed');
  });

  showFb(isCorrect, isCorrect ? '✓ Correct!' : `✗ Answer: ${q.answer} · ${q.hint}`);
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(ms.autoNext);
  ms.autoNext = setTimeout(() => {
    const next = ms.round + 1;
    if (next < MOCK_LENGTH) loadRound(next);
    else showScorecard();
  }, 1800);
}

function showFb(correct, text) {
  mInlineFb.className = 'ms-inline-fb ' + (correct ? 'ms-fb-correct' : 'ms-fb-wrong');
  mInlineFb.textContent = text;
  requestAnimationFrame(() => requestAnimationFrame(() => mInlineFb.classList.add('ms-fb-show')));
}

/* ─────────────────────────────────────────
   Scorecard
───────────────────────────────────────── */
function showScorecard() {
  stopTimer();
  mProgBar.style.width = '100%';

  const total   = ms.answers.length;
  const correct = ms.answers.filter(a => a.correct).length;
  const totalMs = ms.answers.reduce((s, a) => s + a.timeTaken, 0);
  const avgSec  = (totalMs / total / 1000).toFixed(1);
  const pct     = Math.round((correct / total) * 100);

  // per-topic breakdown
  const topicMap = {};
  ms.answers.forEach(a => {
    if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0 };
    topicMap[a.topic].total++;
    if (a.correct) topicMap[a.topic].correct++;
  });

  // persist best score
  const user = loadUser();
  const prev = user.mockBest || 0;
  const isNewBest = correct > prev;
  if (isNewBest) { user.mockBest = correct; saveUser(user); }

  // grade
  let grade, gradeClass, emoji;
  if (pct >= 90)      { grade = 'Exceptional'; gradeClass = 'ms-grade-a'; emoji = '🏆'; }
  else if (pct >= 75) { grade = 'Strong';      gradeClass = 'ms-grade-b'; emoji = '🔥'; }
  else if (pct >= 60) { grade = 'Decent';      gradeClass = 'ms-grade-c'; emoji = '⚡'; }
  else if (pct >= 40) { grade = 'Needs work';  gradeClass = 'ms-grade-d'; emoji = '🎯'; }
  else                { grade = 'Keep going';  gradeClass = 'ms-grade-e'; emoji = '💡'; }

  // weakest topic
  let weakest = null, weakestPct = 101;
  Object.entries(topicMap).forEach(([t, v]) => {
    const tp = v.correct / v.total;
    if (tp < weakestPct) { weakestPct = tp; weakest = t; }
  });

  // render
  const sc = scorecardView;
  sc.innerHTML = `
    <div class="ms-sc-inner">
      <div class="ms-sc-emoji">${emoji}</div>
      <div class="ms-sc-grade ${gradeClass}">${grade}</div>
      <div class="ms-sc-score">${correct} / ${total}</div>
      <div class="ms-sc-meta">${pct}% accuracy · avg ${avgSec}s per question${isNewBest ? ' · ⭐ New best!' : ''}</div>

      <div class="ms-sc-breakdown">
        ${Object.entries(topicMap).map(([t, v]) => {
          const tp = Math.round((v.correct / v.total) * 100);
          const barW = tp;
          const barCol = tp >= 75 ? '#22c55e' : tp >= 50 ? '#f59e0b' : '#ef4444';
          return `
            <div class="ms-sc-topic-row">
              <div class="ms-sc-topic-name">${t}</div>
              <div class="ms-sc-topic-bar-wrap">
                <div class="ms-sc-topic-bar" style="width:${barW}%;background:${barCol}"></div>
              </div>
              <div class="ms-sc-topic-score">${v.correct}/${v.total}</div>
            </div>`;
        }).join('')}
      </div>

      ${weakest ? `<div class="ms-sc-tip">💡 Focus area: <strong>${weakest}</strong> — your weakest section this set.</div>` : ''}

      <div class="ms-sc-actions">
        <button class="ms-sc-btn ms-sc-btn-primary" id="ms-retake-btn">Retake Mock Set →</button>
        <button class="ms-sc-btn" id="ms-home-btn">Back to practice</button>
      </div>
    </div>
  `;

  switchView(sc);

  document.getElementById('ms-retake-btn').addEventListener('click', () => {
    resetMock();
    startMock();
  });
  document.getElementById('ms-home-btn').addEventListener('click', () => {
    resetMock();
    hideOverlay();
  });
}

/* ─────────────────────────────────────────
   Lifecycle
───────────────────────────────────────── */
function startMock() {
  ms.phase     = 'PLAYING';
  ms.questions = pickQuestions();
  ms.answers   = [];

  switchView(questionView);
  showOverlay();
  loadRound(0);
}

function resetMock() {
  stopTimer();
  clearTimeout(ms.autoNext);
  ms.phase = 'IDLE';
}

/* ─────────────────────────────────────────
   Boot
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  overlay       = document.getElementById('ms-overlay');
  questionView  = document.getElementById('ms-question-view');
  scorecardView = document.getElementById('ms-scorecard-view');
  mProgBar      = document.getElementById('ms-prog-bar');
  mRoundLabel   = document.getElementById('ms-round-label');
  mTimerBar     = document.getElementById('ms-timer-bar');
  mTimerLabel   = document.getElementById('ms-timer-label');
  mTopicTag     = document.getElementById('ms-topic-tag');
  mQuestionEl   = document.getElementById('ms-question');
  mOptionsEl    = document.getElementById('ms-options');
  mInlineFb     = document.getElementById('ms-inline-fb');
  mBackBtn      = document.getElementById('ms-back');

  if (!overlay) return;

  // Triggered from home page card
  document.addEventListener('tvara:start-mock', startMock);

  mBackBtn.addEventListener('click', () => { resetMock(); hideOverlay(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ms.phase !== 'IDLE') { resetMock(); hideOverlay(); }
  });
});
