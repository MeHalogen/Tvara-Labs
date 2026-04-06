/* ══════════════════════════════════════════
   Tvara — User Identity & Persistence
   localStorage key: 'tvara_data'
   ══════════════════════════════════════════ */

const LS_KEY = 'tvara_data';

const ADJECTIVES = [
  'Quick','Sharp','Rapid','Bold','Swift',
  'Keen','Bright','Fast','Clear','Agile',
  'Calm','Fierce','Laser','Hyper','Steel',
];
const ANIMALS = [
  'Falcon','Tiger','Eagle','Wolf','Fox',
  'Hawk','Lion','Puma','Bear','Lynx',
  'Cobra','Raven','Orca','Viper','Crane',
];

function generateUsername() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const ani  = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num  = 10 + Math.floor(Math.random() * 90); // 10–99
  return `${adj}${ani}${num}`;
}

/* ── Storage helpers ── */
export function loadUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  // First visit — create profile
  const fresh = {
    username:   generateUsername(),
    bestScore:  0,
    lastScore:  0,
    streak:     0,
    lastPlayed: '',
  };
  saveUser(fresh);
  return fresh;
}

export function saveUser(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) {}
}

/* ── Day-based streak logic ── */
function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ── Called after every session ── */
export function updateAfterSession(correct, total) {
  const user   = loadUser();
  const today  = todayStr();
  const isNewBest = correct > user.bestScore;

  // Streak: +1 if previous play was yesterday or today, reset otherwise
  if (user.lastPlayed === today) {
    // Same day — no change to streak count
  } else if (user.lastPlayed === yesterdayStr()) {
    // Consecutive day
    if (correct >= Math.ceil(total / 2)) user.streak += 1;
  } else {
    // Gap or first time
    user.streak = correct >= Math.ceil(total / 2) ? 1 : 0;
  }

  user.lastPlayed = today;
  user.lastScore  = correct;
  if (isNewBest) user.bestScore = correct;

  saveUser(user);
  return { user, isNewBest };
}

/* ── Simulated leaderboard (injects real user) ── */
const PEERS = [
  { name: 'NeonFalcon88',  score: 5 },
  { name: 'BrainSpark77',  score: 4 },
  { name: 'ClearHawk99',   score: 4 },
  { name: 'SwiftMind44',   score: 3 },
  { name: 'SpeedTiger21',  score: 3 },
  { name: 'SteelLynx55',   score: 2 },
  { name: 'LaserCrane30',  score: 2 },
];

export function getLeaderboard(userData) {
  // Build list with user injected
  const board = [
    ...PEERS,
    { name: userData.username, score: userData.bestScore, isUser: true },
  ];
  // Sort descending, stable: user wins ties
  board.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.isUser) return -1;
    if (b.isUser) return 1;
    return 0;
  });
  return board;
}
