/* ══════════════════════════════════════════
   Tvara — Logic Lock Game Logic
   Mastermind-style 4-digit code breaker
   ══════════════════════════════════════════ */

const LS_KEY    = 'tf_ll_best';
const CODE_LEN  = 4;
const MAX_ATT   = 8;   // attempts before game over
const TIME_PER  = 45;  // seconds per attempt (counts down)

// ── State ────────────────────────────────────────────
const state = {
  secret:      [],   // 4-digit secret code
  current:     [],   // digits typed so far (up to 4)
  attempts:    0,    // guesses used
  activeCell:  0,    // which input cell is "focused"
  history:     [],   // [{digits, pips:[{type}]}]
  timerSecs:   TIME_PER,
  timerHandle: null,
  running:     false,
  won:         false,
};

// ── Audio ────────────────────────────────────────────
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
  key()    { playTone(600, 'sine', 0.05, 0.08); },
  del()    { playTone(300, 'sine', 0.06, 0.08); },
  submit() { playTone(500, 'triangle', 0.08, 0.1); },
  hit()    { playTone(880, 'sine', 0.09, 0.12); setTimeout(() => playTone(1100, 'sine', 0.12, 0.1), 70); },
  near()   { playTone(540, 'triangle', 0.1, 0.1); },
  wrong()  { playTone(180, 'sawtooth', 0.18, 0.14); },
  win()    { [440,550,660,880].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.15,0.14), i*110)); },
  lose()   { playTone(200, 'sawtooth', 0.3, 0.16); },
  start()  { playTone(520, 'sine', 0.1, 0.1); setTimeout(() => playTone(660, 'sine', 0.12, 0.1), 110); },
};

// ── Persistence ──────────────────────────────────────
function getBest()   { return parseInt(localStorage.getItem(LS_KEY) || '0', 10); }
function saveBest(n) { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Score: attempts used when solved (lower = better), max = MAX_ATT ──
// We store "attempts remaining when solved" so higher = better
function calcScore(attemptsUsed, won) {
  if (!won) return 0;
  return MAX_ATT - attemptsUsed + 1; // 1–8
}

// ── Helpers ──────────────────────────────────────────
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function generateSecret() {
  // 4 unique digits 1-9 (no zeros to keep UX clean)
  const pool = [1,2,3,4,5,6,7,8,9];
  const code = [];
  while (code.length < CODE_LEN) {
    const i = rand(0, pool.length - 1);
    code.push(pool.splice(i, 1)[0]);
  }
  return code;
}

// Grade a guess: returns array of CODE_LEN pip types: 'hit'|'near'|'miss'
function grade(guess, secret) {
  const pips   = Array(CODE_LEN).fill('miss');
  const sCopy  = [...secret];
  const gCopy  = [...guess];

  // pass 1: hits
  for (let i = 0; i < CODE_LEN; i++) {
    if (gCopy[i] === sCopy[i]) {
      pips[i]  = 'hit';
      sCopy[i] = null;
      gCopy[i] = null;
    }
  }
  // pass 2: nears
  for (let i = 0; i < CODE_LEN; i++) {
    if (gCopy[i] === null) continue;
    const j = sCopy.indexOf(gCopy[i]);
    if (j !== -1) {
      pips[i]  = 'near';
      sCopy[j] = null;
    }
  }
  return pips;
}

// ── Toast ────────────────────────────────────────────
function showToast(msg, dur = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// ── Screen management ────────────────────────────────
function showScreen(id) {
  ['ll-preplay','ll-game','ll-gameover'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

// ── Attempts badge ───────────────────────────────────
function updateAttemptsBadge() {
  const el = document.getElementById('ll-attempts');
  const rem = MAX_ATT - state.attempts;
  el.textContent = `${rem} left`;
  el.classList.toggle('danger', rem <= 2);
}

// ── Timer ────────────────────────────────────────────
function startTimer() {
  state.timerSecs = TIME_PER;
  renderTimer();
  clearInterval(state.timerHandle);
  state.timerHandle = setInterval(() => {
    state.timerSecs--;
    renderTimer();
    if (state.timerSecs <= 0) {
      clearInterval(state.timerHandle);
      // timeout = auto-submit or game over
      if (state.current.length < CODE_LEN) {
        // fill remaining with 0 and submit
        while (state.current.length < CODE_LEN) state.current.push(0);
      }
      submitGuess();
    }
  }, 1000);
}

function renderTimer() {
  const pct = state.timerSecs / TIME_PER;
  const bar = document.getElementById('ll-timer-bar');
  const lbl = document.getElementById('ll-timer-count');
  lbl.textContent = state.timerSecs + 's';
  bar.style.width = (pct * 100) + '%';
  bar.className = 'll-timer-bar ' + (pct > 0.5 ? 'safe' : pct > 0.25 ? 'warning' : '');
}

// ── Input cell rendering ─────────────────────────────
function renderInputCells() {
  for (let i = 0; i < CODE_LEN; i++) {
    const cell = document.getElementById('ll-ic-' + i);
    cell.textContent = state.current[i] !== undefined ? state.current[i] : '';
    cell.className = 'll-input-cell'
      + (i === state.activeCell ? ' active' : '')
      + (state.current[i] !== undefined ? ' filled' : '');
  }
  // submit button enabled only when all 4 filled
  document.getElementById('ll-submit-btn').disabled = state.current.length < CODE_LEN;
}

function bumpCell(idx) {
  const cell = document.getElementById('ll-ic-' + idx);
  cell.classList.add('bump');
  cell.addEventListener('animationend', () => cell.classList.remove('bump'), { once: true });
}

// ── Numpad input ─────────────────────────────────────
function pressKey(digit) {
  if (!state.running) return;
  if (state.current.length >= CODE_LEN) return;
  SFX.key();
  state.current.push(digit);
  bumpCell(state.current.length - 1);
  // advance active cell
  state.activeCell = Math.min(state.current.length, CODE_LEN - 1);
  renderInputCells();
}

function pressDelete() {
  if (!state.running) return;
  if (state.current.length === 0) return;
  SFX.del();
  state.current.pop();
  state.activeCell = Math.max(0, state.current.length);
  renderInputCells();
}

// ── Submit guess ─────────────────────────────────────
function submitGuess() {
  if (!state.running) return;
  if (state.current.length < CODE_LEN) return;

  clearInterval(state.timerHandle);
  SFX.submit();

  const guess = [...state.current];
  const pips  = grade(guess, state.secret);
  const hits  = pips.filter(p => p === 'hit').length;

  state.attempts++;
  state.history.push({ digits: guess, pips });

  // classify each digit cell
  const classified = guess.map((d, i) => ({ digit: d, type: pips[i] }));
  addHistoryRow(classified, pips, state.attempts);

  // play feedback sound
  if (hits === CODE_LEN) { SFX.win(); }
  else if (hits > 0)     { SFX.hit(); }
  else if (pips.some(p => p === 'near')) { SFX.near(); }
  else { SFX.wrong(); }

  updateAttemptsBadge();

  if (hits === CODE_LEN) {
    state.won = true;
    state.running = false;
    setTimeout(() => triggerGameOver(true), 600);
  } else if (state.attempts >= MAX_ATT) {
    state.running = false;
    setTimeout(() => triggerGameOver(false), 600);
  } else {
    // reset input
    state.current  = [];
    state.activeCell = 0;
    renderInputCells();
    startTimer();
  }
}

// ── History board ─────────────────────────────────────
function addHistoryRow(classified, pips, rowNum) {
  const board = document.getElementById('ll-board');

  const row = document.createElement('div');
  row.className = 'll-row';

  const numEl = document.createElement('div');
  numEl.className = 'll-row-num';
  numEl.textContent = rowNum;
  row.appendChild(numEl);

  const digitsEl = document.createElement('div');
  digitsEl.className = 'll-digits';
  classified.forEach(({ digit, type }) => {
    const cell = document.createElement('div');
    cell.className = 'll-digit-cell ' + type;
    cell.textContent = digit;
    digitsEl.appendChild(cell);
  });
  row.appendChild(digitsEl);

  // pips (sorted: hits first, then nears)
  const sortedPips = [...pips].sort((a, b) => {
    const order = { hit: 0, near: 1, miss: 2 };
    return order[a] - order[b];
  });
  const pipsEl = document.createElement('div');
  pipsEl.className = 'll-pips';
  sortedPips.forEach(type => {
    const pip = document.createElement('div');
    pip.className = 'll-pip ' + type;
    pipsEl.appendChild(pip);
  });
  row.appendChild(pipsEl);

  board.appendChild(row);
  // scroll to bottom
  board.scrollTop = board.scrollHeight;
}

// ── Game over ─────────────────────────────────────────
function triggerGameOver(won) {
  clearInterval(state.timerHandle);
  state.running = false;

  const score = calcScore(state.attempts, won);
  if (won) saveBest(score);

  renderGameOver(won, score);
}

function renderGameOver(won, score) {
  const best  = getBest();
  const isNew = won && score >= best && score > 0;

  const winTiers = [
    { min: 1, emoji: '🧩', msg: "Code cracked! 🧩" },
    { min: 4, emoji: '🔥', msg: "Sharp logic. 🔥" },
    { min: 6, emoji: '⚡', msg: "Fast deduction. ⚡" },
    { min: 8, emoji: '🏆', msg: "Perfect solve. 🏆" },
  ];
  const loseTier = { emoji: '⚡', msg: "Speed matters. Train again. 🔒" };
  const tier = won
    ? ([...winTiers].reverse().find(t => score >= t.min) || winTiers[0])
    : loseTier;

  document.getElementById('ll-go-emoji').textContent = tier.emoji;
  document.getElementById('ll-go-msg').textContent   = tier.msg;
  document.getElementById('ll-go-title').textContent = won ? 'Code Cracked!' : 'Session Complete';
  document.getElementById('ll-go-sub').textContent   = won
    ? `Solved in ${state.attempts} attempt${state.attempts > 1 ? 's' : ''}!`
    : `The code was ${state.secret.join(' - ')}.`;

  // toggle win/lose class for colour theming
  const goEl = document.getElementById('ll-gameover');
  goEl.classList.toggle('win', won);
  goEl.classList.toggle('lose', !won);

  // reveal the code
  const revealEl = document.getElementById('ll-code-reveal');
  revealEl.innerHTML = '';
  state.secret.forEach(d => {
    const el = document.createElement('div');
    el.className = 'll-code-digit';
    el.textContent = d;
    revealEl.appendChild(el);
  });

  document.getElementById('ll-final-score').textContent = score;
  document.getElementById('ll-best-display').textContent = Math.max(best, score);

  const bestEl = document.getElementById('ll-best-display');
  bestEl.classList.remove('new-best');
  if (isNew) {
    void bestEl.offsetWidth;
    bestEl.classList.add('new-best');
    document.getElementById('ll-beat-best').textContent = '🎉 New personal best!';
  } else if (best > 0) {
    document.getElementById('ll-beat-best').textContent = `Best: ${best} pts — can you beat it?`;
  } else {
    document.getElementById('ll-beat-best').textContent = '';
  }

  document.getElementById('ll-stat-attempts').textContent = state.attempts;
  document.getElementById('ll-stat-score').textContent    = score;
  document.getElementById('ll-stat-result').textContent   = won ? '✅' : '❌';

  const sb = document.getElementById('ll-share-btn');
  sb.textContent = '🔗 Share Score'; sb.classList.remove('copied');

  showScreen('ll-gameover');
}

// ── Share ─────────────────────────────────────────────
function shareScore() {
  const score  = parseInt(document.getElementById('ll-final-score').textContent, 10);
  const att    = document.getElementById('ll-stat-attempts').textContent;
  const result = document.getElementById('ll-stat-result').textContent;
  const text   = `I scored ${score} pts on Logic Lock (${result} in ${att} attempts) — beat me!\nTrain on Tvara: ${location.origin}`;
  const btn    = document.getElementById('ll-share-btn');
  if (navigator.share) {
    navigator.share({ title: 'Tvara · Logic Lock', text }).catch(() => {});
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

// ── Launch ────────────────────────────────────────────
function launchGame() {
  state.secret      = generateSecret();
  state.current     = [];
  state.attempts    = 0;
  state.activeCell  = 0;
  state.history     = [];
  state.running     = true;
  state.won         = false;

  // clear board
  document.getElementById('ll-board').innerHTML = '';
  renderInputCells();
  updateAttemptsBadge();

  SFX.start();
  showScreen('ll-game');
  startTimer();
}

// ── Init ─────────────────────────────────────────────
function init() {
  document.getElementById('ll-best').textContent = getBest() || '—';

  // numpad keys
  document.querySelectorAll('.ll-key[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => pressKey(parseInt(btn.dataset.digit, 10)));
  });
  document.getElementById('ll-del-btn').addEventListener('click', pressDelete);

  // input cells — click to set active cell
  for (let i = 0; i < CODE_LEN; i++) {
    document.getElementById('ll-ic-' + i).addEventListener('click', () => {
      state.activeCell = i;
      renderInputCells();
    });
  }

  // keyboard support
  document.addEventListener('keydown', e => {
    if (!state.running) return;
    const d = parseInt(e.key, 10);
    if (d >= 1 && d <= 9) pressKey(d);
    else if (e.key === 'Backspace' || e.key === 'Delete') pressDelete();
    else if (e.key === 'Enter') submitGuess();
  });

  document.getElementById('ll-submit-btn').addEventListener('click', submitGuess);
  document.getElementById('ll-play-btn').addEventListener('click', launchGame);
  document.getElementById('ll-restart-btn').addEventListener('click', launchGame);
  document.getElementById('ll-share-btn').addEventListener('click', shareScore);
  document.getElementById('ll-menu-btn').addEventListener('click', () => { location.href = '/'; });
}

document.addEventListener('DOMContentLoaded', init);
