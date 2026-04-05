/* ══════════════════════════════════════════
   Tvara — Live Thinking Moment
   Fully automated, no user input.
   ══════════════════════════════════════════ */

// ── Helpers ──────────────────────────────────────────
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ── Pattern generators (visually clear, distinct) ────
const patterns = {
  geometric()      { const s=rand(2,4), r=rand(2,3);  return { seq:[s, s*r, s*r**2, s*r**3, s*r**4], answer:s*r**5 }; },
  arithmetic()     { const s=rand(2,12), d=rand(3,9); return { seq:[s, s+d, s+2*d, s+3*d, s+4*d], answer:s+5*d }; },
  squares()        { const s=rand(1,5);  return { seq:[s**2,(s+1)**2,(s+2)**2,(s+3)**2,(s+4)**2], answer:(s+5)**2 }; },
  increasingDiff() {
    const s=rand(1,6), d=rand(2,4);
    const seq=[s]; let gap=d;
    for(let i=1;i<5;i++){ seq.push(seq[i-1]+gap); gap+=d; }
    return { seq, answer: seq[4]+gap };
  },
  fibonacci()      { const a=rand(1,4), b=rand(a+1,a+5); return { seq:[a,b,a+b,a+2*b,a+3*b], answer:(a+b)+(a+3*b) }; },
  doubling()       { const s=rand(1,3); return { seq:[s,s*2,s*4,s*8,s*16], answer:s*32 }; },
};

const POOL = Object.keys(patterns);

// Never repeat same pattern type back-to-back
let _lastType = '';
function pickPattern() {
  let type;
  do { type = POOL[rand(0, POOL.length - 1)]; } while (type === _lastType);
  _lastType = type;
  return patterns[type]();
}

// ── DOM refs ──────────────────────────────────────────
let tokensEl, revealEl;
let _loopTimer = null;

function schedule(fn, ms) {
  clearTimeout(_loopTimer);
  _loopTimer = setTimeout(fn, ms);
}

// ── Chip factory ─────────────────────────────────────
function createChip(text, cls) {
  const span = document.createElement('span');
  span.className = 'ltm-chip ' + cls;
  span.textContent = text;
  return span;
}

// ── Core loop ─────────────────────────────────────────
function runSequence() {
  const { seq, answer } = pickPattern();

  // Reset
  revealEl.classList.remove('ltm-reveal-show');
  tokensEl.innerHTML = '';

  // Build token list: num → num → … → ?
  const items = [];
  seq.forEach(n => {
    items.push({ text: String(n), cls: 'ltm-num' });
    items.push({ text: '→',       cls: 'ltm-arrow' });
  });
  items.push({ text: '?', cls: 'ltm-question' });

  const STEP = rand(440, 580); // ms between chips
  let cursor = 0;

  function dropNext() {
    if (cursor >= items.length) {
      // All chips shown — pause, then reveal answer
      schedule(revealAnswer, 1100);
      return;
    }
    const chip = createChip(items[cursor].text, items[cursor].cls);
    tokensEl.appendChild(chip);
    requestAnimationFrame(() => requestAnimationFrame(() => chip.classList.add('ltm-chip-in')));
    cursor++;
    schedule(dropNext, STEP);
  }

  dropNext();

  function revealAnswer() {
    const qChip = tokensEl.querySelector('.ltm-question');
    if (qChip) {
      // Fade ? out, swap text, fade answer in
      qChip.classList.add('ltm-chip-out');
      setTimeout(() => {
        qChip.textContent = String(answer);
        qChip.className   = 'ltm-chip ltm-answer';
        requestAnimationFrame(() => requestAnimationFrame(() => qChip.classList.add('ltm-chip-in')));
      }, 200);
    }

    // Show prompt + CTA shortly after
    schedule(() => {
      revealEl.classList.add('ltm-reveal-show');
      // Auto-advance after 2.6s
      schedule(runSequence, 2600);
    }, 380);
  }
}

// ── Init (exported, called by home.js) ───────────────
export function initTryARound() {
  const section = document.getElementById('live-thinking-moment');
  if (!section) return;

  tokensEl = document.getElementById('ltm-tokens');
  revealEl = document.getElementById('ltm-reveal');

  // Small boot delay so page paint completes first
  schedule(runSequence, 700);
}
