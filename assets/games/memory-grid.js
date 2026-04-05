/* ══════════════════════════════════════════
   Tvara — Memory Grid Game Logic
   Memorise lit cells → recall them
   ══════════════════════════════════════════ */

const LS_KEY       = 'tf_mg_best';
const SHOW_TIME    = 2200;   // ms the grid stays lit
const RECALL_SECS  = 20;     // seconds to recall per round

// Difficulty ladder: [gridSize, numLit] per round
const ROUNDS = [
  { size: 3, lit: 3 },   // round 1 — 3×3, remember 3
  { size: 3, lit: 4 },   // round 2
  { size: 4, lit: 4 },   // round 3 — 4×4
  { size: 4, lit: 6 },   // round 4
  { size: 4, lit: 8 },   // round 5
  { size: 5, lit: 8 },   // round 6 — 5×5
  { size: 5, lit: 10 },  // round 7
  { size: 5, lit: 12 },  // round 8
];

const state = {
  round:      0,
  score:      0,
  litCells:   [],    // indices of cells that were lit
  selected:   new Set(),
  phase:      'idle',  // idle | show | recall | result
  timerSecs:  RECALL_SECS,
  timerHandle: null,
  running:    false,
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
  show()    { playTone(440,'sine',0.08,0.1); },
  recall()  { playTone(660,'sine',0.1,0.12); },
  tap()     { playTone(600,'sine',0.05,0.08); },
  untap()   { playTone(380,'sine',0.05,0.08); },
  correct() { [440,550,660].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.1,0.12),i*70)); },
  wrong()   { playTone(200,'sawtooth',0.2,0.15); },
  tick()    { playTone(440,'sine',0.04,0.06); },
  win()     { [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.15,0.14),i*100)); },
};

// ── Persistence ───────────────────────────────────────
function getBest()   { return parseInt(localStorage.getItem(LS_KEY)||'0',10); }
function saveBest(n) { if (n > getBest()) localStorage.setItem(LS_KEY, n); }

// ── Toast ─────────────────────────────────────────────
function showToast(msg, dur=2200) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), dur);
}

// ── Screen ────────────────────────────────────────────
function showScreen(id) {
  ['mg-preplay','mg-game','mg-gameover'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

// ── Build the grid DOM ────────────────────────────────
function buildGrid(size) {
  const gridEl = document.getElementById('mg-grid');
  const cellPx = Math.min(Math.floor((320 - (size-1)*8) / size), 72);
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${size}, ${cellPx}px)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'mg-cell';
    cell.dataset.idx = i;
    cell.style.width  = cellPx + 'px';
    cell.style.height = cellPx + 'px';
    gridEl.appendChild(cell);
  }
}

function getCells() { return document.querySelectorAll('.mg-cell'); }

// ── Pick random lit indices ────────────────────────────
function pickLit(total, count) {
  const indices = Array.from({length: total}, (_,i)=>i);
  for (let i = indices.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

// ── Render timer ──────────────────────────────────────
function renderTimer() {
  const pct = state.timerSecs / RECALL_SECS;
  const bar = document.getElementById('mg-timer-bar');
  bar.style.width = (pct * 100) + '%';
  bar.className = 'mg-timer-bar' + (pct < 0.35 ? ' warning' : '');
}

// ── Update strip ──────────────────────────────────────
function updateStrip() {
  document.getElementById('mg-score-val').textContent = state.score;
  document.getElementById('mg-round-val').textContent = state.round + 1;
  document.getElementById('mg-round-badge').textContent = `Round ${state.round + 1} of ${ROUNDS.length}`;
}

// ── Phase: SHOW ───────────────────────────────────────
function startShowPhase() {
  const { size, lit } = ROUNDS[state.round];
  buildGrid(size);
  state.litCells = pickLit(size * size, lit);
  state.selected = new Set();
  state.phase    = 'show';

  setPhaseLabel('Memorise!', 'memorise');
  document.getElementById('mg-timer-bar').style.width = '100%';
  document.getElementById('mg-timer-bar').className = 'mg-timer-bar';
  document.getElementById('mg-submit-btn').style.display = 'none';

  // light up
  SFX.show();
  getCells().forEach(c => {
    if (state.litCells.includes(+c.dataset.idx)) c.classList.add('lit');
  });

  // after SHOW_TIME, hide and start recall
  setTimeout(() => {
    getCells().forEach(c => c.classList.remove('lit'));
    startRecallPhase();
  }, SHOW_TIME);
}

// ── Phase: RECALL ─────────────────────────────────────
function startRecallPhase() {
  state.phase      = 'recall';
  state.timerSecs  = RECALL_SECS;
  state.running    = true;

  setPhaseLabel('Recall the cells!', 'recall');
  SFX.recall();

  // make cells clickable
  getCells().forEach(cell => {
    cell.classList.add('clickable');
    cell.addEventListener('click', onCellClick);
  });

  document.getElementById('mg-submit-btn').style.display = 'block';
  renderTimer();

  clearInterval(state.timerHandle);
  state.timerHandle = setInterval(()=>{
    state.timerSecs--;
    SFX.tick();
    renderTimer();
    if (state.timerSecs <= 0) {
      clearInterval(state.timerHandle);
      submitRecall();
    }
  }, 1000);
}

function onCellClick(e) {
  if (state.phase !== 'recall') return;
  const idx = +e.currentTarget.dataset.idx;
  if (state.selected.has(idx)) {
    state.selected.delete(idx);
    e.currentTarget.classList.remove('selected');
    SFX.untap();
  } else {
    state.selected.add(idx);
    e.currentTarget.classList.add('selected');
    SFX.tap();
  }
}

// ── Submit recall ─────────────────────────────────────
function submitRecall() {
  clearInterval(state.timerHandle);
  state.running = false;
  state.phase   = 'result';

  const { lit } = ROUNDS[state.round];
  const litSet  = new Set(state.litCells);

  let correct = 0;
  getCells().forEach(cell => {
    cell.classList.remove('clickable', 'selected');
    cell.removeEventListener('click', onCellClick);
    const idx = +cell.dataset.idx;
    const wasLit   = litSet.has(idx);
    const selected = state.selected.has(idx);
    if (wasLit && selected)  { cell.classList.add('correct'); correct++; }
    else if (wasLit)         { cell.classList.add('missed'); }
    else if (selected)       { cell.classList.add('wrong'); }
  });

  const roundScore = Math.round((correct / lit) * 100);
  const perfect    = correct === lit && state.selected.size === lit;

  if (perfect) SFX.correct();
  else         SFX.wrong();

  setPhaseLabel(
    perfect ? `✅ Perfect! +${roundScore}` : `${correct}/${lit} correct — +${roundScore}`,
    perfect ? 'recall' : ''
  );
  state.score += roundScore;
  updateStrip();

  setTimeout(() => {
    state.round++;
    if (state.round >= ROUNDS.length) {
      // All rounds done — game complete
      SFX.win();
      setTimeout(() => triggerGameOver(true), 400);
    } else if (!perfect && correct < Math.ceil(lit * 0.5)) {
      // Less than 50% correct — end game
      setTimeout(() => triggerGameOver(false), 400);
    } else {
      // Next round
      startShowPhase();
    }
  }, 1800);
}

// ── Phase label ───────────────────────────────────────
function setPhaseLabel(text, cls) {
  const el = document.getElementById('mg-phase-label');
  el.textContent = text;
  el.className = 'mg-phase-label' + (cls ? ' ' + cls : '');
}

// ── Game over ─────────────────────────────────────────
function triggerGameOver(completed) {
  clearInterval(state.timerHandle);
  const best  = getBest();
  const score = state.score;
  if (score > 0) saveBest(score);
  renderGameOver(completed, score, best);
}

function renderGameOver(completed, score, prevBest) {
  const best   = getBest();
  const isNew  = score >= best && score > prevBest;

  const tiers = [
    { min: 0,   emoji: '🧠', msg: 'Keep training. Your memory will grow.' },
    { min: 200, emoji: '⚡', msg: 'Good recall! Push further.' },
    { min: 500, emoji: '🔥', msg: 'Sharp memory. Impressive focus.' },
    { min: 700, emoji: '🏆', msg: 'Elite recall. Flawless.' },
  ];
  const tier = [...tiers].reverse().find(t => score >= t.min) || tiers[0];

  document.getElementById('mg-go-emoji').textContent  = tier.emoji;
  document.getElementById('mg-go-msg').textContent    = tier.msg;
  document.getElementById('mg-go-title').textContent  = completed ? 'All Rounds Complete!' : 'Session Over';
  document.getElementById('mg-go-sub').textContent    = `You reached round ${state.round} of ${ROUNDS.length}`;
  document.getElementById('mg-final-score').textContent = score;
  document.getElementById('mg-best-display').textContent = Math.max(best, score);

  const goEl = document.getElementById('mg-gameover');
  goEl.classList.toggle('win', completed);

  const bestEl = document.getElementById('mg-best-display');
  bestEl.classList.remove('new-best');
  if (isNew) {
    void bestEl.offsetWidth;
    bestEl.classList.add('new-best');
    document.getElementById('mg-beat-best').textContent = '🎉 New personal best!';
  } else if (best > 0) {
    document.getElementById('mg-beat-best').textContent = `Best: ${best} pts — can you beat it?`;
  } else {
    document.getElementById('mg-beat-best').textContent = '';
  }

  document.getElementById('mg-stat-rounds').textContent  = state.round;
  document.getElementById('mg-stat-score').textContent   = score;
  document.getElementById('mg-stat-result').textContent  = completed ? '✅' : '❌';

  const sb = document.getElementById('mg-share-btn');
  sb.textContent = '🔗 Share Score'; sb.classList.remove('copied');

  showScreen('mg-gameover');
}

// ── Share ─────────────────────────────────────────────
function shareScore() {
  const score  = document.getElementById('mg-final-score').textContent;
  const rounds = document.getElementById('mg-stat-rounds').textContent;
  const text   = `I scored ${score} pts on Memory Grid (${rounds} rounds) on Tvara!\nCan you beat it? ${location.origin}`;
  const btn    = document.getElementById('mg-share-btn');
  if (navigator.share) {
    navigator.share({ title: 'Tvara · Memory Grid', text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text)
      .then(()=>{ btn.textContent='✅ Copied!'; btn.classList.add('copied'); showToast('Score copied!'); setTimeout(()=>{btn.textContent='🔗 Share Score';btn.classList.remove('copied');},2500); })
      .catch(()=>showToast('Could not copy.'));
  }
}

// ── Launch ────────────────────────────────────────────
function launchGame() {
  state.round  = 0;
  state.score  = 0;
  state.phase  = 'idle';
  state.running = false;

  updateStrip();
  SFX.start();
  showScreen('mg-game');
  startShowPhase();
}

// ── Init ─────────────────────────────────────────────
function init() {
  document.getElementById('mg-best').textContent = getBest() || '—';

  document.getElementById('mg-play-btn').addEventListener('click', launchGame);
  document.getElementById('mg-restart-btn').addEventListener('click', launchGame);
  document.getElementById('mg-share-btn').addEventListener('click', shareScore);
  document.getElementById('mg-submit-btn').addEventListener('click', ()=>{ if(state.phase==='recall') submitRecall(); });
  document.getElementById('mg-menu-btn').addEventListener('click', ()=>{ location.href='../index.html'; });
}

document.addEventListener('DOMContentLoaded', init);
