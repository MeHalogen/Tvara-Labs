/* ══════════════════════════════════════════════════════
   Tvara — Mock Set Engine
   20-question timed set → full scorecard
   Question bank: 100 questions, 5 topics (20 each)
   Every set is freshly shuffled — no two sets alike
   ══════════════════════════════════════════════════════ */

import { loadUser, saveUser } from './user.js';

/* ─────────────────────────────────────────
   Question bank — 100 questions, 5 topics
   20 per topic — every mock set is fresh
───────────────────────────────────────── */
const QUESTIONS = [

  // ══ NUMBER SERIES (20) ══════════════════
  { topic: 'Number Series', q: '2 → 5 → 10 → 17 → ?',           answer: 26,   options: [26, 24, 28, 22],       hint: 'Differences: +3, +5, +7, +9…' },
  { topic: 'Number Series', q: '3 → 9 → 27 → 81 → ?',           answer: 243,  options: [243, 162, 200, 270],   hint: 'Each term × 3.' },
  { topic: 'Number Series', q: '1 → 4 → 9 → 16 → 25 → ?',       answer: 36,   options: [36, 30, 32, 40],       hint: 'Perfect squares: 1², 2², 3²…' },
  { topic: 'Number Series', q: '100 → 92 → 76 → 52 → ?',         answer: 20,   options: [20, 24, 28, 32],       hint: 'Differences: −8, −16, −24, −32…' },
  { topic: 'Number Series', q: '5 → 11 → 23 → 47 → ?',          answer: 95,   options: [95, 91, 99, 89],       hint: 'Each term × 2 + 1.' },
  { topic: 'Number Series', q: '1 → 1 → 2 → 3 → 5 → 8 → ?',    answer: 13,   options: [13, 11, 14, 12],       hint: 'Fibonacci: sum of previous two.' },
  { topic: 'Number Series', q: '6 → 11 → 21 → 41 → ?',          answer: 81,   options: [81, 71, 61, 91],       hint: 'Each term × 2 − 1.' },
  { topic: 'Number Series', q: '4 → 8 → 24 → 96 → ?',           answer: 480,  options: [480, 384, 240, 192],   hint: 'Multiply by 2, 3, 4, 5…' },
  { topic: 'Number Series', q: '729 → 243 → 81 → 27 → ?',       answer: 9,    options: [9, 6, 3, 12],          hint: 'Divide by 3 each step.' },
  { topic: 'Number Series', q: '2 → 3 → 5 → 9 → 17 → ?',        answer: 33,   options: [33, 31, 35, 29],       hint: 'Each term = previous × 2 − 1.' },
  { topic: 'Number Series', q: '7 → 12 → 19 → 28 → ?',          answer: 39,   options: [39, 37, 41, 35],       hint: 'Differences: +5, +7, +9, +11…' },
  { topic: 'Number Series', q: '1 → 8 → 27 → 64 → ?',           answer: 125,  options: [125, 100, 144, 216],   hint: 'Perfect cubes: 1³, 2³, 3³…' },
  { topic: 'Number Series', q: '256 → 64 → 16 → 4 → ?',         answer: 1,    options: [1, 2, 0.5, 0],         hint: 'Divide by 4 each step.' },
  { topic: 'Number Series', q: '3 → 7 → 15 → 31 → ?',           answer: 63,   options: [63, 61, 59, 65],       hint: 'Each term × 2 + 1.' },
  { topic: 'Number Series', q: '10 → 9 → 7 → 4 → ?',            answer: 0,    options: [0, 1, -1, 2],          hint: 'Differences: −1, −2, −3, −4…' },
  { topic: 'Number Series', q: '2 → 6 → 18 → 54 → ?',           answer: 162,  options: [162, 108, 144, 216],   hint: 'Each term × 3.' },
  { topic: 'Number Series', q: '1 → 2 → 6 → 24 → ?',            answer: 120,  options: [120, 96, 48, 72],      hint: 'Factorials: 1!, 2!, 3!, 4!, 5!' },
  { topic: 'Number Series', q: '5 → 5 → 10 → 30 → ?',           answer: 120,  options: [120, 60, 90, 150],     hint: 'Multiply by 1, 2, 3, 4…' },
  { topic: 'Number Series', q: '11 → 13 → 17 → 19 → 23 → ?',    answer: 29,   options: [29, 27, 25, 31],       hint: 'Consecutive prime numbers.' },
  { topic: 'Number Series', q: '144 → 121 → 100 → 81 → ?',      answer: 64,   options: [64, 49, 36, 72],       hint: 'Descending perfect squares: 12², 11², 10²…' },

  // ══ PERCENTAGES (20) ════════════════════
  { topic: 'Percentages',   q: '25% of 240 = ?',                  answer: 60,   options: [60, 48, 72, 55],       hint: '240 ÷ 4 = 60.' },
  { topic: 'Percentages',   q: '15% of 600 = ?',                  answer: 90,   options: [90, 80, 100, 85],      hint: '600 × 0.15 = 90.' },
  { topic: 'Percentages',   q: '₹400 after 20% discount = ?',     answer: 320,  options: [320, 300, 340, 360],   hint: '400 − 80 = 320.' },
  { topic: 'Percentages',   q: '₹500 increased by 30% = ?',       answer: 650,  options: [650, 600, 580, 625],   hint: '500 + 150 = 650.' },
  { topic: 'Percentages',   q: 'What % of 80 is 20?',             answer: 25,   options: [25, 20, 30, 15],       hint: '20 / 80 × 100 = 25.' },
  { topic: 'Percentages',   q: '40% of 350 = ?',                  answer: 140,  options: [140, 120, 150, 130],   hint: '350 × 0.4 = 140.' },
  { topic: 'Percentages',   q: 'Price rises from ₹200 to ₹250. % increase = ?', answer: 25, options: [25, 20, 30, 15], hint: '50/200 × 100 = 25.' },
  { topic: 'Percentages',   q: '₹1200 after 15% GST = ?',         answer: 1380, options: [1380, 1320, 1260, 1440], hint: '1200 + 180 = 1380.' },
  { topic: 'Percentages',   q: '60% of 450 = ?',                  answer: 270,  options: [270, 240, 300, 225],   hint: '450 × 0.6 = 270.' },
  { topic: 'Percentages',   q: 'What % of 500 is 125?',           answer: 25,   options: [25, 20, 30, 40],       hint: '125/500 × 100 = 25.' },
  { topic: 'Percentages',   q: '₹800 after 12.5% discount = ?',   answer: 700,  options: [700, 720, 680, 750],   hint: '800 − 100 = 700.' },
  { topic: 'Percentages',   q: 'Salary ₹50,000 raised by 8% = ?', answer: 54000, options: [54000, 52000, 56000, 58000], hint: '50000 × 1.08 = 54000.' },
  { topic: 'Percentages',   q: '35% of 700 = ?',                  answer: 245,  options: [245, 210, 280, 260],   hint: '700 × 0.35 = 245.' },
  { topic: 'Percentages',   q: 'If 20% of x = 50, then x = ?',    answer: 250,  options: [250, 200, 300, 100],   hint: 'x = 50 / 0.2 = 250.' },
  { topic: 'Percentages',   q: 'Price drops from ₹600 to ₹480. % decrease = ?', answer: 20, options: [20, 25, 15, 30], hint: '120/600 × 100 = 20.' },
  { topic: 'Percentages',   q: '75% of 96 = ?',                   answer: 72,   options: [72, 64, 80, 68],       hint: '96 × 0.75 = 72.' },
  { topic: 'Percentages',   q: '₹2000 at 5% profit. Selling price = ?', answer: 2100, options: [2100, 2050, 2200, 1900], hint: '2000 + 100 = 2100.' },
  { topic: 'Percentages',   q: '18% of 450 = ?',                  answer: 81,   options: [81, 72, 90, 63],       hint: '450 × 0.18 = 81.' },
  { topic: 'Percentages',   q: 'A coat costs ₹3000, 10% discount then 5% GST. Final price = ?', answer: 2835, options: [2835, 2850, 2700, 3150], hint: '3000 × 0.9 × 1.05 = 2835.' },
  { topic: 'Percentages',   q: 'What % is 45 of 180?',            answer: 25,   options: [25, 20, 30, 15],       hint: '45/180 × 100 = 25.' },

  // ══ ARITHMETIC (20) ═════════════════════
  { topic: 'Arithmetic',    q: '17 × 13 = ?',                     answer: 221,  options: [221, 211, 231, 201],   hint: '(15+2)(15−2) = 225 − 4 = 221.' },
  { topic: 'Arithmetic',    q: '144 ÷ 12 + 36 = ?',               answer: 48,   options: [48, 44, 52, 46],       hint: '12 + 36 = 48.' },
  { topic: 'Arithmetic',    q: 'Average of 12, 18, 24, 30 = ?',   answer: 21,   options: [21, 20, 22, 18],       hint: '84 ÷ 4 = 21.' },
  { topic: 'Arithmetic',    q: '2³ + 3² = ?',                     answer: 17,   options: [17, 15, 19, 13],       hint: '8 + 9 = 17.' },
  { topic: 'Arithmetic',    q: 'If 8x = 96, then x = ?',          answer: 12,   options: [12, 10, 14, 8],        hint: '96 ÷ 8 = 12.' },
  { topic: 'Arithmetic',    q: 'LCM of 12 and 18 = ?',            answer: 36,   options: [36, 24, 72, 18],       hint: 'LCM(12, 18) = 36.' },
  { topic: 'Arithmetic',    q: 'HCF of 48 and 36 = ?',            answer: 12,   options: [12, 6, 18, 24],        hint: 'HCF(48, 36) = 12.' },
  { topic: 'Arithmetic',    q: '√324 = ?',                        answer: 18,   options: [18, 16, 20, 14],       hint: '18 × 18 = 324.' },
  { topic: 'Arithmetic',    q: 'Sum of first 10 natural numbers = ?', answer: 55, options: [55, 45, 50, 60],     hint: 'n(n+1)/2 = 10×11/2 = 55.' },
  { topic: 'Arithmetic',    q: 'If train travels 360 km in 4 h, speed = ?', answer: 90, options: [90, 80, 100, 70], hint: '360 ÷ 4 = 90 km/h.' },
  { topic: 'Arithmetic',    q: '19² = ?',                         answer: 361,  options: [361, 341, 381, 401],   hint: '(20−1)² = 400 − 40 + 1 = 361.' },
  { topic: 'Arithmetic',    q: 'Average of 5, 10, 15, 20, 25 = ?', answer: 15,  options: [15, 12, 18, 20],       hint: '75 ÷ 5 = 15.' },
  { topic: 'Arithmetic',    q: '3/4 of 200 = ?',                  answer: 150,  options: [150, 120, 160, 140],   hint: '200 × 0.75 = 150.' },
  { topic: 'Arithmetic',    q: 'Work done in 6 days if 5 days = 30 units rate: total in 8 days?', answer: 48, options: [48, 40, 36, 56], hint: '6 units/day × 8 = 48.' },
  { topic: 'Arithmetic',    q: '(48 + 36) ÷ 7 = ?',              answer: 12,   options: [12, 14, 10, 8],        hint: '84 ÷ 7 = 12.' },
  { topic: 'Arithmetic',    q: 'P can do a job in 10 days, Q in 15 days. Together in = ?', answer: 6, options: [6, 5, 8, 4], hint: '1/10 + 1/15 = 1/6.' },
  { topic: 'Arithmetic',    q: '√(225 + 175) = ?',                answer: 20,   options: [20, 18, 22, 24],       hint: '225 + 175 = 400. √400 = 20.' },
  { topic: 'Arithmetic',    q: 'Ratio 3:5. Total 160. Larger share = ?', answer: 100, options: [100, 90, 80, 60], hint: '5/8 × 160 = 100.' },
  { topic: 'Arithmetic',    q: 'Simple interest: P=1000, R=5%, T=3 years. SI = ?', answer: 150, options: [150, 100, 200, 175], hint: 'SI = 1000×5×3/100 = 150.' },
  { topic: 'Arithmetic',    q: '7! ÷ 5! = ?',                     answer: 42,   options: [42, 56, 21, 35],       hint: '7! / 5! = 7 × 6 = 42.' },

  // ══ LOGICAL REASONING (20) ══════════════
  { topic: 'Logical Reasoning', q: 'A, C, F, J, ?',               answer: 'O',  options: ['O', 'N', 'P', 'M'],  hint: 'Gaps: +2, +3, +4, +5…' },
  { topic: 'Logical Reasoning', q: 'AZ, BY, CX, DW, ?',           answer: 'EV', options: ['EV', 'EU', 'FV', 'EW'], hint: 'First +1, second −1.' },
  { topic: 'Logical Reasoning', q: '2, 6, 12, 20, 30, ?',         answer: 42,   options: [42, 40, 44, 38],       hint: 'n×(n+1): 6×7 = 42.' },
  { topic: 'Logical Reasoning', q: 'Odd one out: 11, 13, 17, 19, 21', answer: 21, options: [21, 11, 13, 17],    hint: '21 = 3×7, not prime.' },
  { topic: 'Logical Reasoning', q: 'If FLOWER = GMPXFS, then GARDEN = ?', answer: 'HBSEFS', options: ['HBSEFS', 'HARDEN', 'IBSEFS', 'HBSDFS'], hint: 'Each letter +1.' },
  { topic: 'Logical Reasoning', q: 'All Cats are Dogs. All Dogs are Birds. Are all Cats Birds?', answer: 'Yes', options: ['Yes', 'No', 'Maybe', 'Cannot say'], hint: 'Transitive syllogism: Cats→Dogs→Birds.' },
  { topic: 'Logical Reasoning', q: 'Odd one out: 36, 49, 64, 80, 81', answer: 80, options: [80, 36, 49, 64],   hint: '80 is not a perfect square.' },
  { topic: 'Logical Reasoning', q: 'BCDE : WXYZ → FGHI : ?',      answer: 'STUV', options: ['STUV', 'RSTU', 'TUVW', 'UVWX'], hint: 'Mirror pairing from both ends of alphabet.' },
  { topic: 'Logical Reasoning', q: 'If Monday = 2, Wednesday = 4, then Saturday = ?', answer: 7, options: [7, 6, 5, 8], hint: 'Days of week numbered Mon=2…Sun=8.' },
  { topic: 'Logical Reasoning', q: 'Pointing to a girl: "She is the daughter of my mother\'s only son." Relation = ?', answer: 'Daughter', options: ['Daughter', 'Niece', 'Sister', 'Cousin'], hint: 'Mother\'s only son = me. So she is my daughter.' },
  { topic: 'Logical Reasoning', q: 'Z, X, V, T, ?',               answer: 'R',  options: ['R', 'S', 'Q', 'P'],  hint: 'Every other letter backwards.' },
  { topic: 'Logical Reasoning', q: 'Odd one out: 2, 5, 10, 17, 26, 36', answer: 36, options: [36, 26, 17, 10], hint: 'n²+1 pattern: 36 should be 37.' },
  { topic: 'Logical Reasoning', q: 'If CAT = 24, DOG = 26, then COT = ?', answer: 34, options: [34, 32, 36, 30], hint: 'C+A+T positional values.' },
  { topic: 'Logical Reasoning', q: 'Some Pens are Books. All Books are Bags. Some Pens are Bags?', answer: 'True', options: ['True', 'False', 'Maybe', 'Cannot say'], hint: 'Some pens = books = bags → some pens are bags.' },
  { topic: 'Logical Reasoning', q: 'QPO, NML, KJI, ?',            answer: 'HGF', options: ['HGF', 'GFE', 'IHG', 'FED'], hint: 'Each group is 3 consecutive letters going backward.' },
  { topic: 'Logical Reasoning', q: 'Odd one out: Rose, Lotus, Marigold, Mango, Jasmine', answer: 'Mango', options: ['Mango', 'Rose', 'Lotus', 'Jasmine'], hint: 'All others are flowers.' },
  { topic: 'Logical Reasoning', q: 'If 6 × 4 = 46 and 8 × 3 = 38, then 5 × 7 = ?', answer: 75, options: [75, 57, 35, 53], hint: 'Result = second × first + second: 7×5+? No — swap & concat: 75.' },
  { topic: 'Logical Reasoning', q: 'A is taller than B, B is taller than C. Who is shortest?', answer: 'C', options: ['C', 'A', 'B', 'Cannot say'], hint: 'A > B > C.' },
  { topic: 'Logical Reasoning', q: 'Odd one out: 16, 25, 36, 48, 64', answer: 48, options: [48, 16, 25, 36], hint: '48 is not a perfect square.' },
  { topic: 'Logical Reasoning', q: 'BDF, GIK, LNP, ?',            answer: 'QSU', options: ['QSU', 'QRT', 'RST', 'PRT'], hint: 'Each group skips one letter; groups advance by 5.' },

  // ══ NUMBER THEORY (20) ══════════════════
  { topic: 'Number Theory',  q: 'Which is prime: 91, 97, 99, 87?',     answer: 97,  options: [97, 91, 99, 87],    hint: '97 has no factors other than 1 and itself.' },
  { topic: 'Number Theory',  q: 'Which is NOT prime: 23, 29, 31, 33?', answer: 33,  options: [33, 23, 29, 31],    hint: '33 = 3 × 11.' },
  { topic: 'Number Theory',  q: 'How many prime numbers between 1 and 20?', answer: 8, options: [8, 7, 9, 6],    hint: '2,3,5,7,11,13,17,19 — eight primes.' },
  { topic: 'Number Theory',  q: 'LCM of 4, 6, 8 = ?',               answer: 24,  options: [24, 12, 48, 16],    hint: 'LCM(4,6,8) = 24.' },
  { topic: 'Number Theory',  q: 'HCF of 24, 36, 48 = ?',             answer: 12,  options: [12, 6, 8, 24],      hint: 'HCF(24,36,48) = 12.' },
  { topic: 'Number Theory',  q: 'How many factors does 36 have?',     answer: 9,   options: [9, 6, 8, 12],       hint: '1,2,3,4,6,9,12,18,36 — nine factors.' },
  { topic: 'Number Theory',  q: 'Sum of all factors of 28 (excl. 28) = ?', answer: 28, options: [28, 14, 56, 32], hint: '1+2+4+7+14 = 28. 28 is a perfect number.' },
  { topic: 'Number Theory',  q: 'Which is prime: 143, 149, 147, 153?', answer: 149, options: [149, 143, 147, 153], hint: '149 is prime. 143=11×13, 147=3×49, 153=9×17.' },
  { topic: 'Number Theory',  q: '2^10 = ?',                           answer: 1024, options: [1024, 512, 2048, 256], hint: '2^10 = 1024.' },
  { topic: 'Number Theory',  q: 'What is the smallest prime number?',  answer: 2,   options: [2, 1, 3, 0],        hint: '2 is the only even prime.' },
  { topic: 'Number Theory',  q: 'Which is a perfect square: 50, 64, 72, 80?', answer: 64, options: [64, 50, 72, 80], hint: '64 = 8².' },
  { topic: 'Number Theory',  q: 'GCD of 100 and 75 = ?',              answer: 25,  options: [25, 50, 5, 15],     hint: 'GCD(100, 75) = 25.' },
  { topic: 'Number Theory',  q: 'Remainder when 100 ÷ 7 = ?',         answer: 2,   options: [2, 1, 3, 4],        hint: '7 × 14 = 98; 100 − 98 = 2.' },
  { topic: 'Number Theory',  q: 'Which is NOT a perfect cube: 8, 27, 64, 72?', answer: 72, options: [72, 8, 27, 64], hint: '8=2³, 27=3³, 64=4³. 72 is not.' },
  { topic: 'Number Theory',  q: 'How many even primes exist?',         answer: 1,   options: [1, 0, 2, 'Infinite'], hint: 'Only 2 is an even prime.' },
  { topic: 'Number Theory',  q: 'Remainder when 2^8 ÷ 5 = ?',         answer: 1,   options: [1, 2, 3, 4],        hint: '256 ÷ 5 = 51 rem 1.' },
  { topic: 'Number Theory',  q: 'Co-prime pair among: (4,9), (6,9), (12,8), (15,25)?', answer: '(4,9)', options: ['(4,9)', '(6,9)', '(12,8)', '(15,25)'], hint: 'GCD(4,9)=1 — they are co-prime.' },
  { topic: 'Number Theory',  q: 'Sum of prime factors of 60 = ?',      answer: 10,  options: [10, 12, 8, 14],     hint: '60 = 2²×3×5; prime factors: 2+3+5 = 10.' },
  { topic: 'Number Theory',  q: 'Which is prime: 51, 53, 57, 55?',     answer: 53,  options: [53, 51, 57, 55],    hint: '51=3×17, 55=5×11, 57=3×19. 53 is prime.' },
  { topic: 'Number Theory',  q: 'LCM × HCF of two numbers = 480. One number = 24. Other = ?', answer: 20, options: [20, 16, 30, 40], hint: 'Other = 480 ÷ 24 = 20.' },

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
  // Pick 4 questions from each topic (5 topics × 4 = 20), then shuffle the combined set
  const byTopic = {};
  QUESTIONS.forEach(q => {
    if (!byTopic[q.topic]) byTopic[q.topic] = [];
    byTopic[q.topic].push(q);
  });
  const picked = [];
  Object.values(byTopic).forEach(pool => {
    shuffle(pool).slice(0, 4).forEach(q => picked.push(q));
  });
  return shuffle(picked);
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
