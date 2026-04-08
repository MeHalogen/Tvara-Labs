/* ══════════════════════════════════════════
   Tvara — User Identity & Persistence
   localStorage key: 'tvara_data'
   ══════════════════════════════════════════ */

const LS_KEY = 'tvara_data';
const SETTINGS_KEY = 'tvara_settings';
const DEVICE_KEY = 'tvara_device_id';
const COOKIE_KEY = 'tvara_did';

/* ── Cookie helpers (cross-browser on same device) ── */
function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch (_) { return null; }
}
function setCookie(name, value) {
  try {
    // 2-year expiry, SameSite=Lax, no Secure so it works on http://localhost too
    const exp = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
  } catch (_) {}
}

/* ── Simple deterministic hash (djb2) → number ── */
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

export function getDeviceId() {
  // 1. Check cookie first — shared across all browsers on the device
  const fromCookie = getCookie(COOKIE_KEY);
  if (fromCookie) {
    // Back-fill localStorage for this browser
    try { localStorage.setItem(DEVICE_KEY, fromCookie); } catch (_) {}
    return fromCookie;
  }
  // 2. Fall back to localStorage (may exist from a previous session)
  try {
    const fromLS = localStorage.getItem(DEVICE_KEY);
    if (fromLS) {
      setCookie(COOKIE_KEY, fromLS); // promote to cookie so other browsers pick it up
      return fromLS;
    }
  } catch (_) {}
  // 3. First ever visit on this device — generate, persist everywhere
  const id = 'tv_' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  setCookie(COOKIE_KEY, id);
  try { localStorage.setItem(DEVICE_KEY, id); } catch (_) {}
  return id;
}

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
  // Seed from device ID so all browsers on the same device get the same name
  const seed = hashStr(getDeviceId());
  const adj = ADJECTIVES[seed % ADJECTIVES.length];
  const ani = ANIMALS[Math.floor(seed / ADJECTIVES.length) % ANIMALS.length];
  const num = 10 + (seed % 90); // 10–99
  return `${adj}${ani}${num}`;
}

/* ── Storage helpers ── */
export function loadUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  // First visit on this browser — create profile seeded from device ID
  const fresh = {
    username:   generateUsername(), // deterministic from cookie-based device ID
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

export function setUsername(username) {
  const name = String(username || '').trim();
  if (!name) return { ok: false, error: 'Name cannot be empty.' };
  if (name.length > 24) return { ok: false, error: 'Name must be 24 characters or less.' };
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) return { ok: false, error: 'Use only letters, numbers, spaces, _ or -.' };

  const user = loadUser();
  user.username = name;
  saveUser(user);
  return { ok: true, user };
}

export function resetUser() {
  try { localStorage.removeItem(LS_KEY); } catch (_) {}
  try { localStorage.removeItem(SETTINGS_KEY); } catch (_) {}
  // Also clear per-game bests (home uses these)
  const keys = ['tf_pp_best','tf_rr_best','tf_ll_best','tf_mg_best','tf_sm_best','tf_ws_best','tf_ps_best','tf_pc_best'];
  keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
  // Do NOT call loadUser() here — avoids auto-creating a new profile
  // before import can write the restored one.
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const fresh = { reducedMotion: false, sound: true, theme: 'purple' };
  saveSettings(fresh);
  return fresh;
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

export function exportTvaraData() {
  const payload = {
    v: 1,
    exportedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    user: loadUser(),
    settings: loadSettings(),
    bests: {
      tf_pp_best: localStorage.getItem('tf_pp_best') || '0',
      tf_rr_best: localStorage.getItem('tf_rr_best') || '0',
      tf_ll_best: localStorage.getItem('tf_ll_best') || '0',
      tf_mg_best: localStorage.getItem('tf_mg_best') || '0',
      tf_sm_best: localStorage.getItem('tf_sm_best') || '0',
      tf_ws_best: localStorage.getItem('tf_ws_best') || '0',
      tf_ps_best: localStorage.getItem('tf_ps_best') || '0',
      tf_pc_best: localStorage.getItem('tf_pc_best') || '0',
    }
  };
  return JSON.stringify(payload, null, 2);
}

export function importTvaraData(jsonString) {
  let parsed;
  try { parsed = JSON.parse(jsonString); } catch (_) { return { ok: false, error: 'Invalid JSON.' }; }
  if (!parsed || typeof parsed !== 'object' || !parsed.user) return { ok: false, error: 'Not a valid Tvara export.' };

  try { localStorage.setItem(LS_KEY, JSON.stringify(parsed.user)); } catch (_) {}
  if (parsed.settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed.settings)); } catch (_) {}
  }
  if (parsed.bests && typeof parsed.bests === 'object') {
    Object.entries(parsed.bests).forEach(([k, v]) => {
      if (String(k).startsWith('tf_')) {
        try { localStorage.setItem(k, String(v)); } catch (_) {}
      }
    });
  }
  return { ok: true, user: loadUser(), settings: loadSettings() };
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
