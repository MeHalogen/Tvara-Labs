/* ══════════════════════════════════════════
   Tvara — Speed Math Game Logic
   Solve equations as fast as possible.
   Chain streak for multiplier. One wrong = end.
   ══════════════════════════════════════════ */

const LS_KEY = 'tf_sm_best';

// Time per question (ms) — user override takes priority
function getTimeMs(questions) {
  if (state.timerSec) return state.timerSec * 1000;
  if (questions >= 30) return 3500;
  if (questions >= 20) return 4500;
  if (questions >= 12) return 5500;
  if (questions >= 6)  return 7000;
  return 9000;
}

// Points per question = base × multiplier
function getBase(score) {
  if (score >= 20) return 12;
  if (score >= 10) return 8;
  return 5;
}

const state = {
  score:       0,
  streak:      0,
  bestStreak:  0,
  questions:   0,
  answer:      0,
  inputStr:    '',
  timerHandle: null,
  timerStart:  0,
  timeLimitMs: 9000,
  running:     false,
  // User-configurable
  timerSec:   0,   // 0 = adaptive
  maxRounds:  0,   // 0 = infinite survive mode
};

// ── Audio ─────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudio() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }
function playTone(freq, type, dur, vol = 0.14) {
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
  start()   { playTone(520,'sine',0.1,0.1); setTimeout(()=>playTone(660,'sine',0.12,0.1),110); },
  correct() { playTone(660,'sine',0.08,0.1); setTimeout(()=>playTone(880,'sine',0.1,0.1),70); },
  streak()  { [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.08,0.12),i*55)); },
  wrong()   { playTone(160,'sawtooth',0.25,0.18); },
  tick()    { playTone(440,'sine',0.04,0.06); },
};

// ── Persistence ───────────────────────────────────────
function getBest()   { return parseInt(localStorage.getItem(LS_KEY)||'0',10); }
function saveBest(n) { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Toast ─────────────────────────────────────────────
function showToast(msg, dur=2000) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), dur);
}

// ── Screen ────────────────────────────────────────────
function showScreen(id) {
  ['sm-preplay','sm-game','sm-gameover'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

// ── Equation generator ────────────────────────────────
function rand(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }

function genEquation(score) {
  // Progressive difficulty
  const ops = score >= 15 ? ['+','-','×','÷'] :
               score >= 6  ? ['+','-','×'] :
               ['+','-'];
  const op = ops[rand(0, ops.length - 1)];

  let a, b, ans;
  switch(op) {
    case '+':
      a = score >= 10 ? rand(10, 99) : rand(1, 20);
      b = score >= 10 ? rand(10, 99) : rand(1, 20);
      ans = a + b; break;
    case '-':
      a = score >= 10 ? rand(20, 99) : rand(5, 30);
      b = score >= 10 ? rand(1,  a)  : rand(1, a);
      ans = a - b; break;
    case '×':
      a = score >= 18 ? rand(6, 15) : rand(2, 9);
      b = score >= 18 ? rand(6, 12) : rand(2, 9);
      ans = a * b; break;
    case '÷':
      b = rand(2, 9);
      ans = rand(2, 12);
      a = b * ans; break;
  }
  return { text: `${a} ${op} ${b}`, answer: ans };
}

// ── Timer bar ─────────────────────────────────────────
let rafHandle = null;
function startTimerBar(limitMs) {
  const bar = document.getElementById('sm-timer-bar');
  state.timerStart = performance.now();
  state.timeLimitMs = limitMs;
  cancelAnimationFrame(rafHandle);

  function tick() {
    const elapsed = performance.now() - state.timerStart;
    const pct = Math.max(0, 1 - elapsed / limitMs);
    bar.style.width = (pct * 100) + '%';
    if (pct < 0.25) bar.style.background = '#ef4444';
    else bar.style.background = '';
    if (elapsed < limitMs && state.running) {
      rafHandle = requestAnimationFrame(tick);
    } else if (elapsed >= limitMs && state.running) {
      // Timeout = wrong answer
      handleWrong(true);
    }
  }
  rafHandle = requestAnimationFrame(tick);
}

// ── Input handling ────────────────────────────────────
function updateDisplay() {
  const d = document.getElementById('sm-answer-display');
  d.textContent = state.inputStr === '' ? '_' : state.inputStr;
}

function handleKey(val) {
  if (!state.running) return;
  if (val === 'del') {
    state.inputStr = state.inputStr.slice(0, -1);
  } else if (val === 'neg') {
    if (state.inputStr.startsWith('-')) state.inputStr = state.inputStr.slice(1);
    else if (state.inputStr !== '') state.inputStr = '-' + state.inputStr;
  } else {
    if (state.inputStr.replace('-','').length >= 4) return; // max 4 digits
    state.inputStr += val;
  }
  updateDisplay();
}

// ── Correct / Wrong ───────────────────────────────────
function flash(type, msg) {
  const el = document.getElementById('sm-flash');
  el.textContent = msg;
  el.className = 'sm-flash ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; el.className = 'sm-flash'; }, 600);
}

function handleCorrect() {
  state.streak++;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  const mult = Math.min(state.streak, 8);
  const pts  = getBase(state.score) * mult;
  state.score += pts;
  state.questions++;

  if (state.streak > 1 && state.streak % 3 === 0) SFX.streak();
  else SFX.correct();

  flash('correct', state.streak > 1 ? `+${pts} ×${mult} 🔥` : `+${pts} ✓`);
  updateHeader();
  nextQuestion();
}

function handleWrong(timeout = false) {
  cancelAnimationFrame(rafHandle);
  SFX.wrong();
  state.running = false;
  flash('wrong', timeout ? '⏱ Too slow!' : '✗ Wrong!');
  setTimeout(() => showGameOver(), 700);
}

function handleSubmit() {
  if (!state.running || state.inputStr === '' || state.inputStr === '-') return;
  const guess = parseInt(state.inputStr, 10);
  state.inputStr = '';
  updateDisplay();
  if (guess === state.answer) handleCorrect();
  else handleWrong(false);
}

// ── UI updates ────────────────────────────────────────
function updateHeader() {
  document.getElementById('sm-score').textContent = state.score;
  document.getElementById('sm-q-count').textContent = `Q${state.questions + 1}`;
  const mult = Math.min(state.streak + 1, 8);
  const sv = document.getElementById('sm-streak');
  sv.textContent = `×${mult}`;
  sv.classList.add('bump');
  setTimeout(() => sv.classList.remove('bump'), 200);
}

// ── Next question ─────────────────────────────────────
function nextQuestion() {
  // Check round limit
  if (state.maxRounds > 0 && state.questions >= state.maxRounds) {
    showGameOver();
    return;
  }

  const eq = genEquation(state.questions);
  state.answer = eq.answer;
  state.inputStr = '';
  updateDisplay();

  const eqEl = document.getElementById('sm-equation');
  eqEl.style.opacity = '0';
  setTimeout(() => {
    eqEl.textContent = eq.text;
    eqEl.style.opacity = '1';
  }, 80);

  startTimerBar(getTimeMs(state.questions));
}

// ── Game start ────────────────────────────────────────
function getPillValue(id, fallback) {
  const el = document.getElementById(id);
  return el ? (el.dataset.selected || fallback) : fallback;
}

function launchGame() {
  state.timerSec  = parseInt(getPillValue('sm-timer-sel', '0'), 10);
  state.maxRounds = parseInt(getPillValue('sm-rounds-sel', '0'), 10);
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.questions = 0;
  state.inputStr = '';
  state.running = true;

  document.getElementById('sm-best').textContent = getBest() || '—';
  updateHeader();
  showScreen('sm-game');
  SFX.start();

  // Bind keyboard
  document.addEventListener('keydown', onKeyDown);

  nextQuestion();
}

function onKeyDown(e) {
  if (!state.running) return;
  if (e.key >= '0' && e.key <= '9') handleKey(e.key);
  else if (e.key === 'Backspace') handleKey('del');
  else if (e.key === '-') handleKey('neg');
  else if (e.key === 'Enter') handleSubmit();
}

// ── Game over ─────────────────────────────────────────
function showGameOver() {
  document.removeEventListener('keydown', onKeyDown);
  const prev = getBest();
  saveBest(state.score);
  const isNew = state.score > prev;

  document.getElementById('sm-go-score').textContent = state.score;
  document.getElementById('sm-go-questions').textContent = state.questions;
  document.getElementById('sm-go-best-streak').textContent = state.bestStreak;
  document.getElementById('sm-go-best').textContent = Math.max(state.score, prev) || '—';

  const newBestEl = document.getElementById('sm-go-new-best');
  newBestEl.style.display = isNew ? 'block' : 'none';

  const goEl = document.getElementById('sm-gameover');
  goEl.className = state.questions >= 10 ? 'win' : '';

  document.getElementById('sm-go-emoji').textContent = state.questions >= 15 ? '🏆' : state.questions >= 8 ? '💪' : '💥';
  document.getElementById('sm-go-title').textContent = state.questions >= 15 ? 'On Fire!' : state.questions >= 8 ? 'Good Run' : 'Game Over';
  document.getElementById('sm-go-sub').textContent = `${state.questions} question${state.questions !== 1 ? 's' : ''} answered`;

  showScreen('sm-gameover');
}

// ── Init ──────────────────────────────────────────────
function initPillGroups() {
  document.querySelectorAll('.gs-pill-group').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.gs-pill');
      if (!btn) return;
      group.querySelectorAll('.gs-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      group.dataset.selected = btn.dataset.value;
    });
    const active = group.querySelector('.gs-pill.active');
    if (active) group.dataset.selected = active.dataset.value;
  });
}

function init() {
  document.getElementById('sm-best').textContent = getBest() || '—';
  initPillGroups();

  document.getElementById('sm-play-btn').addEventListener('click', launchGame);
  document.getElementById('sm-restart-btn').addEventListener('click', launchGame);
  document.getElementById('sm-menu-btn').addEventListener('click', () => {
    document.removeEventListener('keydown', onKeyDown);
    state.running = false;
    cancelAnimationFrame(rafHandle);
    showScreen('sm-preplay');
    document.getElementById('sm-best').textContent = getBest() || '—';
  });
  document.getElementById('sm-submit-btn').addEventListener('click', handleSubmit);

  // Numpad
  document.getElementById('sm-numpad').addEventListener('click', e => {
    const btn = e.target.closest('.sm-key');
    if (btn) handleKey(btn.dataset.val);
  });
}

document.addEventListener('DOMContentLoaded', init);
