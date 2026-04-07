/* ══════════════════════════════════════════
   Tvara — Word Scramble Sprint Game Logic
   Tap scrambled letters to spell the word.
   ══════════════════════════════════════════ */

const LS_KEY = 'tf_ws_best';

// Time per word — user-set timer overrides the adaptive default
function getTimeMs(streak) {
  // If user set a fixed timer, always use that
  if (state.timerSec) return state.timerSec * 1000;
  if (streak >= 12) return 5000;
  if (streak >= 8)  return 6500;
  if (streak >= 5)  return 8000;
  return 10000;
}

// Word bank — easy, recognisable everyday words
const WORD_BANK = [
  // 3-letter (Easy tier)
  { word: 'CAT',   cat: 'Animal',   tier: 'easy' },
  { word: 'DOG',   cat: 'Animal',   tier: 'easy' },
  { word: 'SUN',   cat: 'Nature',   tier: 'easy' },
  { word: 'MAP',   cat: 'Object',   tier: 'easy' },
  { word: 'CUP',   cat: 'Object',   tier: 'easy' },
  { word: 'RUN',   cat: 'Action',   tier: 'easy' },
  { word: 'FLY',   cat: 'Action',   tier: 'easy' },
  { word: 'BOX',   cat: 'Object',   tier: 'easy' },
  { word: 'JAM',   cat: 'Food',     tier: 'easy' },
  { word: 'PEN',   cat: 'Object',   tier: 'easy' },
  // 4-letter (Easy/Medium)
  { word: 'JUMP',  cat: 'Action',   tier: 'easy' },
  { word: 'CAKE',  cat: 'Food',     tier: 'easy' },
  { word: 'BIRD',  cat: 'Animal',   tier: 'easy' },
  { word: 'BOOK',  cat: 'Object',   tier: 'easy' },
  { word: 'FISH',  cat: 'Animal',   tier: 'easy' },
  { word: 'MILK',  cat: 'Food',     tier: 'easy' },
  { word: 'RAIN',  cat: 'Weather',  tier: 'easy' },
  { word: 'STAR',  cat: 'Nature',   tier: 'easy' },
  { word: 'DOOR',  cat: 'Object',   tier: 'easy' },
  { word: 'SHIP',  cat: 'Vehicle',  tier: 'easy' },
  { word: 'WOLF',  cat: 'Animal',   tier: 'easy' },
  { word: 'FARM',  cat: 'Place',    tier: 'easy' },
  { word: 'HAND',  cat: 'Body',     tier: 'easy' },
  { word: 'TREE',  cat: 'Nature',   tier: 'easy' },
  { word: 'WIND',  cat: 'Weather',  tier: 'easy' },
  { word: 'FIRE',  cat: 'Element',  tier: 'easy' },
  { word: 'CAVE',  cat: 'Place',    tier: 'easy' },
  { word: 'FROG',  cat: 'Animal',   tier: 'easy' },
  { word: 'LAMP',  cat: 'Object',   tier: 'easy' },
  { word: 'ROAD',  cat: 'Place',    tier: 'easy' },
  // 5-letter (Medium)
  { word: 'BRAVE', cat: 'Trait',    tier: 'medium' },
  { word: 'CLOUD', cat: 'Nature',   tier: 'medium' },
  { word: 'DANCE', cat: 'Action',   tier: 'medium' },
  { word: 'EAGLE', cat: 'Animal',   tier: 'medium' },
  { word: 'FLAME', cat: 'Element',  tier: 'medium' },
  { word: 'GLOBE', cat: 'Object',   tier: 'medium' },
  { word: 'HEART', cat: 'Body',     tier: 'medium' },
  { word: 'IMAGE', cat: 'Concept',  tier: 'medium' },
  { word: 'JUICE', cat: 'Food',     tier: 'medium' },
  { word: 'KNIFE', cat: 'Object',   tier: 'medium' },
  { word: 'LIGHT', cat: 'Physics',  tier: 'medium' },
  { word: 'MONEY', cat: 'Concept',  tier: 'medium' },
  { word: 'NIGHT', cat: 'Time',     tier: 'medium' },
  { word: 'OCEAN', cat: 'Nature',   tier: 'medium' },
  { word: 'PLANT', cat: 'Nature',   tier: 'medium' },
  { word: 'QUEEN', cat: 'Person',   tier: 'medium' },
  { word: 'RIVER', cat: 'Nature',   tier: 'medium' },
  { word: 'SMILE', cat: 'Feeling',  tier: 'medium' },
  { word: 'TIGER', cat: 'Animal',   tier: 'medium' },
  { word: 'UNCLE', cat: 'Person',   tier: 'medium' },
  { word: 'VOICE', cat: 'Sound',    tier: 'medium' },
  { word: 'WATER', cat: 'Nature',   tier: 'medium' },
  { word: 'EXTRA', cat: 'Concept',  tier: 'medium' },
  { word: 'YOUNG', cat: 'Trait',    tier: 'medium' },
  { word: 'ZEBRA', cat: 'Animal',   tier: 'medium' },
  { word: 'ARROW', cat: 'Object',   tier: 'medium' },
  { word: 'BEACH', cat: 'Place',    tier: 'medium' },
  { word: 'CHAIR', cat: 'Object',   tier: 'medium' },
  { word: 'DREAM', cat: 'Concept',  tier: 'medium' },
  { word: 'EARTH', cat: 'Nature',   tier: 'medium' },
  // 6-letter (Hard)
  { word: 'BRIDGE', cat: 'Structure', tier: 'hard' },
  { word: 'CAMERA', cat: 'Object',    tier: 'hard' },
  { word: 'DESERT', cat: 'Place',     tier: 'hard' },
  { word: 'ENGINE', cat: 'Machine',   tier: 'hard' },
  { word: 'FOREST', cat: 'Nature',    tier: 'hard' },
  { word: 'GARDEN', cat: 'Place',     tier: 'hard' },
  { word: 'HAMMER', cat: 'Object',    tier: 'hard' },
  { word: 'ISLAND', cat: 'Place',     tier: 'hard' },
  { word: 'JUNGLE', cat: 'Nature',    tier: 'hard' },
  { word: 'KETTLE', cat: 'Object',    tier: 'hard' },
  { word: 'LADDER', cat: 'Object',    tier: 'hard' },
  { word: 'MIRROR', cat: 'Object',    tier: 'hard' },
  { word: 'NEEDLE', cat: 'Object',    tier: 'hard' },
  { word: 'ORANGE', cat: 'Food',      tier: 'hard' },
  { word: 'PENCIL', cat: 'Object',    tier: 'hard' },
  { word: 'RABBIT', cat: 'Animal',    tier: 'hard' },
  { word: 'SCHOOL', cat: 'Place',     tier: 'hard' },
  { word: 'TEMPLE', cat: 'Place',     tier: 'hard' },
  { word: 'BOTTLE', cat: 'Object',    tier: 'hard' },
  { word: 'WINDOW', cat: 'Object',    tier: 'hard' },
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
  // User-configurable settings (read from pre-play selectors)
  difficulty:  'easy',  // 'easy' | 'medium' | 'hard' | 'mixed'
  timerSec:    10,      // seconds per word
  lives_cfg:   3,       // number of lives
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
  const pool = (available.length > 0 ? available : WORD_BANK);

  // Filter by difficulty tier
  let filtered;
  if (state.difficulty === 'mixed') {
    // Progressive: start easy, shift to harder as streak grows
    const tier = state.streak >= 8 ? 'hard' : state.streak >= 4 ? 'medium' : 'easy';
    filtered = pool.filter(w => w.tier === tier);
  } else {
    filtered = pool.filter(w => w.tier === state.difficulty);
  }
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
  // Read user-chosen settings from pill groups
  state.difficulty = getSettingValue('ws-diff-sel',  'easy');
  state.timerSec   = parseInt(getSettingValue('ws-timer-sel', '10'), 10);
  state.lives_cfg  = parseInt(getSettingValue('ws-lives-sel', '3'),  10);

  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.lives = state.lives_cfg;
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
function initPillGroups() {
  document.querySelectorAll('.gs-pill-group').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.gs-pill');
      if (!btn) return;
      group.querySelectorAll('.gs-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Store selected value as data attribute on the group for easy reading
      group.dataset.selected = btn.dataset.value;
    });
    // Init data-selected from the initially active pill
    const active = group.querySelector('.gs-pill.active');
    if (active) group.dataset.selected = active.dataset.value;
  });
}

// Wrapper so launchGame reads from data-selected
function getSettingValue(id, fallback) {
  const el = document.getElementById(id);
  return el ? (el.dataset.selected || fallback) : fallback;
}

function init() {
  document.getElementById('ws-best').textContent = getBest() || '—';

  initPillGroups();

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
