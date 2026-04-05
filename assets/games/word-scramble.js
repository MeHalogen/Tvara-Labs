/* ══════════════════════════════════════════
   Tvara — Word Scramble Sprint Game Logic
   Tap scrambled letters to spell the word.
   ══════════════════════════════════════════ */

const LS_KEY = 'tf_ws_best';

// Time per word (ms) — shrinks as streak grows
function getTimeMs(streak) {
  if (streak >= 12) return 5000;
  if (streak >= 8)  return 6500;
  if (streak >= 5)  return 8000;
  return 10000;
}

// Word bank — categorised for the hint display
const WORD_BANK = [
  // 4-letter
  { word: 'BOLD', cat: 'Adjective' },
  { word: 'GRIP', cat: 'Action' },
  { word: 'FLUX', cat: 'Science' },
  { word: 'MIST', cat: 'Nature' },
  { word: 'GLOW', cat: 'Light' },
  { word: 'HUSK', cat: 'Nature' },
  { word: 'VIBE', cat: 'Feeling' },
  { word: 'RUST', cat: 'Nature' },
  { word: 'DUSK', cat: 'Time' },
  { word: 'LENS', cat: 'Object' },
  { word: 'OATH', cat: 'Concept' },
  { word: 'PULP', cat: 'Material' },
  { word: 'RAMP', cat: 'Structure' },
  { word: 'HAZE', cat: 'Weather' },
  // 5-letter
  { word: 'BRAVE', cat: 'Trait' },
  { word: 'FLINT', cat: 'Material' },
  { word: 'GLOOM', cat: 'Feeling' },
  { word: 'PRISM', cat: 'Science' },
  { word: 'SOLAR', cat: 'Astronomy' },
  { word: 'SWIRL', cat: 'Motion' },
  { word: 'QUILT', cat: 'Object' },
  { word: 'GRAZE', cat: 'Action' },
  { word: 'FLARE', cat: 'Light' },
  { word: 'CRISP', cat: 'Texture' },
  { word: 'BLAZE', cat: 'Fire' },
  { word: 'CHORD', cat: 'Music' },
  { word: 'DWARF', cat: 'Size' },
  { word: 'EPOCH', cat: 'Time' },
  { word: 'FROST', cat: 'Weather' },
  { word: 'GRAFT', cat: 'Action' },
  { word: 'LYMPH', cat: 'Biology' },
  { word: 'PLUNK', cat: 'Sound' },
  { word: 'QUIRK', cat: 'Trait' },
  { word: 'SCORN', cat: 'Feeling' },
  { word: 'SHARD', cat: 'Material' },
  { word: 'SHRUB', cat: 'Nature' },
  { word: 'SKULK', cat: 'Action' },
  { word: 'SPUNK', cat: 'Trait' },
  { word: 'SQUAB', cat: 'Nature' },
  { word: 'STOMP', cat: 'Action' },
  { word: 'SWAMP', cat: 'Nature' },
  { word: 'TRYST', cat: 'Event' },
  // 6-letter
  { word: 'COBALT', cat: 'Chemistry' },
  { word: 'FATHOM', cat: 'Measure' },
  { word: 'GALLOP', cat: 'Motion' },
  { word: 'GLACIAL', cat: 'Temperature' },
  { word: 'IGNITE', cat: 'Action' },
  { word: 'JIGSAW', cat: 'Object' },
  { word: 'LOCKET', cat: 'Object' },
  { word: 'MORTAL', cat: 'Biology' },
  { word: 'NEBULA', cat: 'Astronomy' },
  { word: 'NIMBLE', cat: 'Trait' },
  { word: 'OPAQUE', cat: 'Optical' },
  { word: 'PELLET', cat: 'Object' },
  { word: 'REFLEX', cat: 'Action' },
  { word: 'RIPPLE', cat: 'Motion' },
  { word: 'SCULPT', cat: 'Art' },
  { word: 'SHREWD', cat: 'Trait' },
  { word: 'SIGNAL', cat: 'Concept' },
  { word: 'SMUDGE', cat: 'Action' },
  { word: 'SQUALL', cat: 'Weather' },
  { word: 'STOKER', cat: 'Person' },
  { word: 'STRIDE', cat: 'Motion' },
  { word: 'TANGLE', cat: 'State' },
  { word: 'TUNDRA', cat: 'Geography' },
  { word: 'VORTEX', cat: 'Physics' },
  { word: 'WRAITH', cat: 'Myth' },
];

const state = {
  score:       0,
  streak:      0,
  bestStreak:  0,
  lives:       3,
  solved:      0,
  word:        '',
  tiles:       [],      // { letter, idx, used }
  selected:    [],      // indices into tiles
  hintUsed:    false,
  running:     false,
  timerStart:  0,
  timeLimitMs: 10000,
  rafHandle:   null,
  usedWords:   new Set(),
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
  tap()     { playTone(700,'sine',0.04,0.08); },
  untap()   { playTone(400,'sine',0.04,0.07); },
  correct() { [440,550,660].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.1,0.12),i*70)); },
  streak()  { [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.12,0.14),i*80)); },
  wrong()   { playTone(200,'sawtooth',0.2,0.15); },
  hint()    { playTone(520,'triangle',0.12,0.1); },
};

// ── Persistence ───────────────────────────────────────
function getBest()   { return parseInt(localStorage.getItem(LS_KEY)||'0',10); }
function saveBest(n) { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Screen ────────────────────────────────────────────
function showScreen(id) {
  ['ws-preplay','ws-game','ws-gameover'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

// ── Helpers ───────────────────────────────────────────
function rand(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = rand(0,i); [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function pickWord() {
  const available = WORD_BANK.filter(w => !state.usedWords.has(w.word));
  if (available.length === 0) state.usedWords.clear();
  const pool = available.length > 0 ? available : WORD_BANK;
  // Weight towards longer words as streak increases
  const minLen = state.streak >= 8 ? 6 : state.streak >= 4 ? 5 : 4;
  const filtered = pool.filter(w => w.word.length >= minLen);
  const final = filtered.length > 0 ? filtered : pool;
  return final[rand(0, final.length - 1)];
}

function scramble(word) {
  // ensure scramble is always different from the word
  let attempts = 0;
  let s;
  do {
    s = shuffle(word.split('')).join('');
    attempts++;
  } while (s === word && attempts < 20);
  return s;
}

// ── Timer bar ─────────────────────────────────────────
function startTimerBar(limitMs) {
  const bar = document.getElementById('ws-timer-bar');
  state.timerStart  = performance.now();
  state.timeLimitMs = limitMs;
  cancelAnimationFrame(state.rafHandle);

  function tick() {
    const elapsed = performance.now() - state.timerStart;
    const pct = Math.max(0, 1 - elapsed / limitMs);
    bar.style.width = (pct * 100) + '%';
    bar.classList.toggle('warning', pct < 0.3);
    if (elapsed < limitMs && state.running) {
      state.rafHandle = requestAnimationFrame(tick);
    } else if (elapsed >= limitMs && state.running) {
      handleTimeout();
    }
  }
  state.rafHandle = requestAnimationFrame(tick);
}

// ── Build UI for a word ───────────────────────────────
function buildWordUI(entry) {
  state.word     = entry.word;
  state.selected = [];
  state.hintUsed = false;
  state.usedWords.add(entry.word);

  const scrambled = scramble(entry.word);
  state.tiles = scrambled.split('').map((letter, idx) => ({ letter, idx, used: false }));

  // Category
  document.getElementById('ws-category').textContent = entry.cat.toUpperCase();

  // Answer slots
  const answerRow = document.getElementById('ws-answer-row');
  answerRow.innerHTML = '';
  for (let i = 0; i < entry.word.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'ws-answer-slot';
    slot.dataset.pos = i;
    slot.addEventListener('click', () => untapSlot(i));
    answerRow.appendChild(slot);
  }

  // Scrambled tiles
  const tilesEl = document.getElementById('ws-tiles');
  tilesEl.innerHTML = '';
  state.tiles.forEach((t, i) => {
    const tile = document.createElement('div');
    tile.className = 'ws-tile';
    tile.dataset.tileIdx = i;
    tile.textContent = t.letter;
    tile.style.animationDelay = (i * 50) + 'ms';
    tile.addEventListener('click', () => tapTile(i));
    tilesEl.appendChild(tile);
  });

  // Hint button reset
  const hintBtn = document.getElementById('ws-hint-btn');
  hintBtn.disabled = false;
  hintBtn.textContent = '💡 Hint (−5)';
}

// ── Tile interaction ──────────────────────────────────
function tapTile(idx) {
  if (!state.running) return;
  const tile = state.tiles[idx];
  if (tile.used) return;

  tile.used = true;
  state.selected.push(idx);
  SFX.tap();

  // Visually mark tile
  const tileEl = document.querySelector(`[data-tile-idx="${idx}"]`);
  if (tileEl) tileEl.classList.add('used');

  // Fill next slot
  const pos = state.selected.length - 1;
  const slot = document.querySelector(`[data-pos="${pos}"]`);
  if (slot) {
    slot.textContent = tile.letter;
    slot.classList.add('filled');
  }

  // Auto-check when all slots filled
  if (state.selected.length === state.word.length) {
    setTimeout(checkAnswer, 120);
  }
}

function untapSlot(pos) {
  if (!state.running) return;
  // Remove from pos backwards — only allow untapping last slot for simplicity
  if (state.selected.length === 0) return;
  const lastPos = state.selected.length - 1;
  if (pos !== lastPos) return;

  const tileIdx = state.selected.pop();
  state.tiles[tileIdx].used = false;
  SFX.untap();

  const tileEl = document.querySelector(`[data-tile-idx="${tileIdx}"]`);
  if (tileEl) tileEl.classList.remove('used');

  const slot = document.querySelector(`[data-pos="${pos}"]`);
  if (slot) { slot.textContent = ''; slot.classList.remove('filled'); }
}

// ── Check answer ──────────────────────────────────────
function checkAnswer() {
  if (!state.running) return;
  const guess = state.selected.map(i => state.tiles[i].letter).join('');
  cancelAnimationFrame(state.rafHandle);

  const slots = document.querySelectorAll('.ws-answer-slot');

  if (guess === state.word) {
    // Correct!
    slots.forEach(s => s.classList.add('correct'));
    state.score += Math.max(10, 20 - state.streak);
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.solved++;

    if (state.streak > 1 && state.streak % 4 === 0) SFX.streak();
    else SFX.correct();

    updateHeader();
    setTimeout(nextWord, 600);
  } else {
    // Wrong word
    slots.forEach(s => s.classList.add('wrong'));
    SFX.wrong();
    state.lives--;
    state.streak = 0;
    updateLives();
    if (state.lives <= 0) {
      setTimeout(showGameOver, 700);
    } else {
      setTimeout(() => {
        // Show correct word briefly then move on
        state.selected = [];
        state.tiles.forEach(t => t.used = false);
        slots.forEach((s, i) => {
          s.className = 'ws-answer-slot';
          s.textContent = state.word[i]; // reveal answer
          s.style.color = '#94a3b8';
        });
        setTimeout(nextWord, 900);
      }, 400);
    }
  }
}

function handleTimeout() {
  if (!state.running) return;
  state.lives--;
  state.streak = 0;
  SFX.wrong();
  updateLives();

  // Reveal answer
  const slots = document.querySelectorAll('.ws-answer-slot');
  slots.forEach((s, i) => {
    s.className = 'ws-answer-slot wrong';
    s.textContent = state.word[i];
    s.style.color = '#94a3b8';
  });

  if (state.lives <= 0) {
    setTimeout(showGameOver, 700);
  } else {
    setTimeout(nextWord, 900);
  }
}

// ── Hint ──────────────────────────────────────────────
function useHint() {
  if (!state.running || state.hintUsed) return;
  state.hintUsed = true;
  state.score = Math.max(0, state.score - 5);
  SFX.hint();

  // Reveal first unplaced letter
  const nextPos = state.selected.length;
  const correctLetter = state.word[nextPos];

  // Find an unused tile with that letter
  const tileIdx = state.tiles.findIndex((t, i) => !t.used && t.letter === correctLetter);
  if (tileIdx !== -1) tapTile(tileIdx);

  document.getElementById('ws-hint-btn').disabled = true;
  document.getElementById('ws-hint-btn').textContent = '💡 Used';
  document.getElementById('ws-score').textContent = state.score;
}

// ── UI helpers ────────────────────────────────────────
function updateHeader() {
  document.getElementById('ws-score').textContent  = state.score;
  document.getElementById('ws-streak').textContent = state.streak;
}
function updateLives() {
  const h = '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, 3 - state.lives));
  document.getElementById('ws-lives').textContent = h;
}

// ── Next word ─────────────────────────────────────────
function nextWord() {
  if (!state.running) return;
  const entry = pickWord();
  buildWordUI(entry);
  startTimerBar(getTimeMs(state.streak));
}

// ── Game start ────────────────────────────────────────
function launchGame() {
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.lives = 3;
  state.solved = 0;
  state.running = true;
  state.usedWords.clear();

  updateHeader();
  updateLives();
  showScreen('ws-game');
  SFX.start();
  setTimeout(nextWord, 300);
}

// ── Game over ─────────────────────────────────────────
function showGameOver() {
  state.running = false;
  cancelAnimationFrame(state.rafHandle);

  const prev = getBest();
  saveBest(state.score);
  const isNew = state.score > prev;

  document.getElementById('ws-go-score').textContent      = state.score;
  document.getElementById('ws-go-solved').textContent     = state.solved;
  document.getElementById('ws-go-best-streak').textContent = state.bestStreak;
  document.getElementById('ws-go-best').textContent       = Math.max(state.score, prev) || '—';
  document.getElementById('ws-go-new-best').style.display = isNew ? 'block' : 'none';

  document.getElementById('ws-go-emoji').textContent = state.solved >= 10 ? '🏆' : state.solved >= 5 ? '🔥' : '🔤';
  document.getElementById('ws-go-title').textContent = state.solved >= 10 ? 'Wordsmith!' : state.solved >= 5 ? 'Sharp Mind' : 'Session Over';
  document.getElementById('ws-go-sub').textContent   = `${state.solved} word${state.solved !== 1 ? 's' : ''} solved`;

  const goEl = document.getElementById('ws-gameover');
  goEl.className = state.solved >= 8 ? 'win' : '';

  showScreen('ws-gameover');
}

// ── Init ──────────────────────────────────────────────
function init() {
  document.getElementById('ws-best').textContent = getBest() || '—';

  document.getElementById('ws-play-btn').addEventListener('click', launchGame);
  document.getElementById('ws-restart-btn').addEventListener('click', launchGame);
  document.getElementById('ws-menu-btn').addEventListener('click', () => {
    state.running = false;
    cancelAnimationFrame(state.rafHandle);
    showScreen('ws-preplay');
    document.getElementById('ws-best').textContent = getBest() || '—';
  });
  document.getElementById('ws-clear-btn').addEventListener('click', () => {
    if (!state.running) return;
    // Unselect all
    [...state.selected].reverse().forEach((_, i) => {
      const pos = state.selected.length - 1 - i;
      untapSlot(pos);
    });
    state.selected = [];
    state.tiles.forEach(t => t.used = false);
    document.querySelectorAll('.ws-tile').forEach(t => t.classList.remove('used'));
    document.querySelectorAll('.ws-answer-slot').forEach(s => { s.textContent = ''; s.classList.remove('filled'); });
  });
  document.getElementById('ws-hint-btn').addEventListener('click', useHint);
}

document.addEventListener('DOMContentLoaded', init);
