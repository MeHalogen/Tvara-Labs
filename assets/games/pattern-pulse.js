/* ══════════════════════════════════════════
   Tvara — Pattern Pulse Game Logic
   ══════════════════════════════════════════ */

const LS_KEY = 'tf_pp_best';

const state = {
  score:    0,
  answer:   0,
  timer:    null,
  timeLeft: 10,
  running:  false,
};

// ── Audio ────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}
function playTone(freq, type, dur, vol = 0.18) {
  try {
    const ctx  = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}
const SFX = {
  correct() {
    playTone(660, 'sine', 0.12, 0.15);
    setTimeout(() => playTone(880, 'sine', 0.15, 0.12), 80);
  },
  wrong()  { playTone(200, 'sawtooth', 0.22, 0.18); },
  tick()   { playTone(440, 'sine', 0.04, 0.06); },
  start()  {
    playTone(520, 'sine', 0.1, 0.12);
    setTimeout(() => playTone(660, 'sine', 0.12, 0.1), 100);
  },
};

// ── Persistence ──────────────────────────────────────
function getBest()    { return parseInt(localStorage.getItem(LS_KEY) || '0', 10); }
function saveBest(n)  { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Difficulty ───────────────────────────────────────
function getDiff(score) { return score <= 3 ? 'easy' : score <= 8 ? 'medium' : 'hard'; }
function getTime(diff)  { return diff === 'hard' ? 8 : diff === 'medium' ? 9 : 10; }

// ── Pattern generators ───────────────────────────────
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const patterns = {
  arithmetic()     { const s = rand(1,15), d = rand(2,8); const q = [s, s+d, s+2*d, s+3*d]; return { seq: q, answer: s+4*d }; },
  multiplication() { const s = rand(1,4),  r = rand(2,4); return { seq: [s, s*r, s*r**2, s*r**3], answer: s*r**4 }; },
  squares()        { const s = rand(2,6);  return { seq: [s**2, (s+1)**2, (s+2)**2, (s+3)**2], answer: (s+4)**2 }; },
  increasingDiff() {
    const s = rand(1,5), d = rand(1,3);
    const seq = [s]; let diff = d;
    for (let i = 1; i < 4; i++) { seq.push(seq[i-1] + diff); diff += d; }
    return { seq, answer: seq[3] + diff };
  },
  alternating() {
    const a = rand(2,6), b = rand(7,14);
    const seq = [a, b, a + rand(1,3), b + rand(1,3)];
    return { seq, answer: seq[2] + (seq[3] - seq[1]) };
  },
  fibonacci()  { const a = rand(1,5), b = rand(a+1, a+6); return { seq: [a, b, a+b, a+2*b], answer: (a+b)+(a+2*b) }; },
  mixedOps()   {
    const s = rand(2,6), d = rand(2,4), r = rand(2,3);
    return { seq: [s, s+d, (s+d)*r, (s+d)*r+d], answer: ((s+d)*r+d)*r };
  },
  cubes()      { const s = rand(2,4); return { seq: [s**3, (s+1)**3, (s+2)**3, (s+3)**3], answer: (s+4)**3 }; },
};

const POOL = {
  easy:   ['arithmetic', 'multiplication'],
  medium: ['arithmetic', 'multiplication', 'squares', 'increasingDiff', 'alternating'],
  hard:   ['squares', 'increasingDiff', 'alternating', 'fibonacci', 'mixedOps', 'cubes'],
};

function buildQuestion(diff) {
  const pool = POOL[diff];
  return patterns[pool[rand(0, pool.length - 1)]]();
}

function buildOptions(answer) {
  const used = new Set([answer]);
  const opts = [answer];
  const spread = Math.max(5, Math.floor(answer * 0.25));
  let tries = 0;
  while (opts.length < 4 && tries++ < 200) {
    let w = answer + rand(-spread, spread);
    if (w <= 0) w = answer + rand(1, spread);
    if (!used.has(w)) { used.add(w); opts.push(w); }
  }
  return opts.sort(() => Math.random() - 0.5);
}

// ── Screen management ────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Toast ────────────────────────────────────────────
function showToast(msg, dur = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// ── UI helpers ───────────────────────────────────────
function updateScoreBadge() {
  const b = document.getElementById('score');
  b.textContent = 'Score: ' + state.score;
  b.classList.remove('pop');
  void b.offsetWidth;
  b.classList.add('pop');
}
function updateDiffBadge(diff) {
  const el = document.getElementById('diff-badge');
  el.className = 'diff-badge ' + diff;
  document.getElementById('diff-label').textContent =
    diff.charAt(0).toUpperCase() + diff.slice(1);
}
function updateTimerUI() {
  const bar = document.getElementById('timer-bar');
  const pct = (state.timeLeft / getTime(getDiff(state.score))) * 100;
  document.getElementById('timer-count').textContent = state.timeLeft + 's';
  bar.style.width = pct + '%';
  bar.classList.remove('warning', 'danger');
  if (state.timeLeft <= 3)      bar.classList.add('danger');
  else if (state.timeLeft <= 5) bar.classList.add('warning');
}

// ── Timer ────────────────────────────────────────────
function startTimer(total) {
  state.timeLeft = total;
  updateTimerUI();
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft === 3) SFX.tick();
    if (state.timeLeft <= 0) { clearInterval(state.timer); triggerGameOver(); }
  }, 1000);
}

// ── Question generation ──────────────────────────────
function generateQuestion() {
  const diff = getDiff(state.score);
  const { seq, answer } = buildQuestion(diff);
  state.answer = answer;
  updateDiffBadge(diff);

  const qa = document.getElementById('question-area');
  qa.style.opacity   = '0';
  qa.style.transform = 'scale(0.97)';
  setTimeout(() => {
    document.getElementById('question').textContent = seq.join('  →  ') + '  →  ?';
    qa.style.opacity   = '1';
    qa.style.transform = 'scale(1)';
    renderOptions(buildOptions(answer));
    startTimer(getTime(diff));
  }, 150);
}

function renderOptions(opts) {
  const div = document.getElementById('options');
  div.innerHTML = '';
  opts.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = val;
    btn.addEventListener('click', () => handleAnswer(btn, val === state.answer));
    div.appendChild(btn);
  });
}

function handleAnswer(btn, isCorrect) {
  if (!state.running) return;
  clearInterval(state.timer);
  state.running = false;
  document.querySelectorAll('.option').forEach(b => (b.disabled = true));

  if (isCorrect) {
    btn.classList.add('correct');
    SFX.correct();
    state.score++;
    updateScoreBadge();
    setTimeout(() => { state.running = true; generateQuestion(); }, 520);
  } else {
    btn.classList.add('wrong');
    SFX.wrong();
    document.querySelectorAll('.option').forEach(b => {
      if (Number(b.textContent) === state.answer) b.classList.add('correct');
    });
    setTimeout(triggerGameOver, 900);
  }
}

function triggerGameOver() {
  clearInterval(state.timer);
  state.running = false;
  saveBest(state.score);
  renderGameOver(state.score);
}

function renderGameOver(finalScore) {
  const best  = getBest();
  const isNew = finalScore > 0 && finalScore >= best;

  const tiers = [
    { min: 0,  emoji: '⚡', msg: "Keep training. 📈" },
    { min: 3,  emoji: '⚡', msg: "Push harder. You can do better." },
    { min: 6,  emoji: '🎯', msg: "Good session. 🎯" },
    { min: 9,  emoji: '⚡', msg: "Sharp thinking. ⚡" },
    { min: 12, emoji: '🔥', msg: "Strong performance. 🔥" },
    { min: 16, emoji: '🏆', msg: "Exam-ready speed. 🏆" },
  ];
  const tier = [...tiers].reverse().find(t => finalScore >= t.min) || tiers[0];

  document.getElementById('go-emoji').textContent           = tier.emoji;
  document.getElementById('go-msg').textContent             = tier.msg;
  document.getElementById('final-score').textContent        = finalScore;
  document.getElementById('best-score-display').textContent = best;
  document.getElementById('go-sub').textContent             = finalScore === 0
    ? 'Speed matters. Try again.'
    : `You answered ${finalScore} correctly.`;

  const bestEl = document.getElementById('best-score-display');
  bestEl.classList.remove('new-best');
  if (isNew) {
    void bestEl.offsetWidth;
    bestEl.classList.add('new-best');
    document.getElementById('beat-best').textContent = '🎉 New personal best!';
  } else if (best > 0) {
    document.getElementById('beat-best').textContent = `Can you beat your best of ${best}?`;
  } else {
    document.getElementById('beat-best').textContent = '';
  }

  const sb = document.getElementById('share-btn');
  sb.textContent = '🔗 Share Score';
  sb.classList.remove('copied');

  showScreen('gameover-screen');
}

// ── Share ────────────────────────────────────────────
function shareScore() {
  const score = parseInt(document.getElementById('final-score').textContent, 10);
  const text  = `I scored ${score} on Pattern Pulse — beat me!\nTrain on Tvara: ${location.origin}`;
  const btn   = document.getElementById('share-btn');

  if (navigator.share) {
    navigator.share({ title: 'Tvara · Pattern Pulse', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => {
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        showToast('Score copied to clipboard!');
        setTimeout(() => {
          btn.textContent = '🔗 Share Score';
          btn.classList.remove('copied');
        }, 2500);
      })
      .catch(() => showToast('Could not copy — try manually!'));
  }
}

// ── Launch ───────────────────────────────────────────
function launchGame() {
  state.score   = 0;
  state.running = true;
  updateScoreBadge();
  document.getElementById('timer-bar').style.width   = '100%';
  document.getElementById('timer-bar').className     = 'timer-bar';
  SFX.start();
  showScreen('game-screen');
  generateQuestion();
}

// ── Init ─────────────────────────────────────────────
function init() {
  document.getElementById('pp-best').textContent = getBest() || '—';
  document.getElementById('play-btn').addEventListener('click', launchGame);
  document.getElementById('restart-btn').addEventListener('click', launchGame);
  document.getElementById('share-btn').addEventListener('click', shareScore);
  document.getElementById('menu-btn').addEventListener('click', () => {
    location.href = '/';
  });
}

document.addEventListener('DOMContentLoaded', init);
