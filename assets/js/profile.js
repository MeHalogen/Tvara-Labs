/* ══════════════════════════════════════════
   Tvara — Profile / Settings
   ══════════════════════════════════════════ */

import {
  loadUser,
  setUsername,
  resetUser,
  exportTvaraData,
  importTvaraData,
  loadSettings,
  saveSettings
} from './user.js';

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function render() {
  const user = loadUser();
  const settings = loadSettings();

  const name = document.getElementById('pf-name');
  const streak = document.getElementById('pf-streak');
  const best = document.getElementById('pf-best');
  const last = document.getElementById('pf-last');
  const rm = document.getElementById('pf-reduced-motion');
  const sound = document.getElementById('pf-sound');

  if (name) name.value = user.username || '';
  if (streak) streak.textContent = user.streak ? `${user.streak} day(s)` : '—';
  if (best) best.textContent = (user.bestScore || 0) > 0 ? `${user.bestScore}/5` : '—';
  if (last) last.textContent = user.lastPlayed || '—';

  if (rm) rm.checked = !!settings.reducedMotion;
  if (sound) sound.checked = settings.sound !== false;

  // Apply reduced motion immediately for this page
  document.documentElement.dataset.reduceMotion = settings.reducedMotion ? '1' : '';
}

function shouldShowDevTools() {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const debug = new URLSearchParams(location.search).get('debug') === '1';
  return isLocal || debug;
}

function takeLocalSnapshot() {
  // Snapshot only Tvara-related keys so we don't touch other sites/apps.
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k === 'tvara_data' || k === 'tvara_settings' || k === 'tvara_device_id' || k.startsWith('tf_')) {
      keys.push(k);
    }
  }
  keys.sort();
  const map = {};
  keys.forEach((k) => { map[k] = localStorage.getItem(k); });
  return map;
}

function restoreLocalSnapshot(snapshot) {
  // Remove current Tvara keys, then re-add snapshot values.
  const currentKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k === 'tvara_data' || k === 'tvara_settings' || k === 'tvara_device_id' || k.startsWith('tf_')) {
      currentKeys.push(k);
    }
  }
  currentKeys.forEach((k) => { try { localStorage.removeItem(k); } catch (_) {} });
  Object.entries(snapshot || {}).forEach(([k, v]) => {
    try {
      if (v === null || typeof v === 'undefined') return;
      localStorage.setItem(k, String(v));
    } catch (_) {}
  });
}

function stableExportString() {
  // Strip the exportedAt timestamp before comparing — it changes every call
  // and is irrelevant to data integrity. Parse → delete → re-serialize with
  // sorted keys so the comparison is deterministic.
  try {
    const raw = JSON.parse(exportTvaraData());
    delete raw.exportedAt;
    return JSON.stringify(raw, Object.keys(raw).sort());
  } catch (_) {
    return exportTvaraData().replace(/\r\n/g, '\n').trim();
  }
}

async function runSelfTest(logEl, btnEl) {
  const log = [];
  const write = (s) => {
    log.push(s);
    if (logEl) logEl.value = log.join('\n');
  };

  if (!logEl) return;
  write('Tvara self-test');
  write(`Started: ${new Date().toISOString()}`);
  write('');

  const originalSnapshot = takeLocalSnapshot();
  const originalExport = stableExportString();
  write(`Snapshot keys: ${Object.keys(originalSnapshot).length}`);
  write('Step 1/4: Export current data… OK');

  try {
    if (btnEl) btnEl.disabled = true;

    // Step 2: Reset
    write('Step 2/4: Resetting…');
    resetUser();
    const afterReset = takeLocalSnapshot();
    const hasUserAfterReset = Object.prototype.hasOwnProperty.call(afterReset, 'tvara_data');
    write(`- After reset: keys=${Object.keys(afterReset).length} (tvara_data present=${hasUserAfterReset})`);

    // Step 3: Import the previously exported data
    write('Step 3/4: Importing export…');
    const res = importTvaraData(originalExport);
    if (!res || !res.ok) {
      write(`FAIL: import returned error: ${(res && res.error) || 'unknown'}`);
      throw new Error('Import failed');
    }
    write('OK');

    // Step 4: Verify equality (export -> reset -> import should be lossless)
    write('Step 4/4: Verifying lossless roundtrip…');
    const roundtripExport = stableExportString();
    if (roundtripExport !== originalExport) {
      write('FAIL: Export mismatch after roundtrip.');
      write('Hint: this would mean export/import/reset isn’t perfectly reversible.');
      throw new Error('Roundtrip mismatch');
    }
    write('PASS: Export matches exactly after roundtrip.');

    write('');
    write('Restoring your original local data snapshot…');
    restoreLocalSnapshot(originalSnapshot);
    write('Restore OK.');
    write('');
    write('Self-test complete.');
    toast('Self-test passed.');
  } catch (e) {
    write('');
    write(`ERROR: ${String(e && e.message ? e.message : e)}`);
    write('Restoring your original local data snapshot…');
    restoreLocalSnapshot(originalSnapshot);
    write('Restore attempted.');
    toast('Self-test failed (restored).');
  } finally {
    if (btnEl) btnEl.disabled = false;
    render();
  }
}

function bind() {
  const saveBtn = document.getElementById('pf-save-name');
  const name = document.getElementById('pf-name');
  const exportBtn = document.getElementById('pf-export');
  const copyBtn = document.getElementById('pf-copy-export');
  const importBtn = document.getElementById('pf-import');
  const box = document.getElementById('pf-export-box');
  const resetBtn = document.getElementById('pf-reset');
  const rm = document.getElementById('pf-reduced-motion');
  const sound = document.getElementById('pf-sound');
  const devWrap = document.getElementById('pf-devtools');
  const selfTestBtn = document.getElementById('pf-selftest');
  const selfTestLog = document.getElementById('pf-selftest-log');

  if (devWrap && shouldShowDevTools()) devWrap.style.display = '';
  if (selfTestBtn && selfTestLog) {
    selfTestBtn.addEventListener('click', () => runSelfTest(selfTestLog, selfTestBtn));
  }

  if (saveBtn && name) {
    saveBtn.addEventListener('click', () => {
      const res = setUsername(name.value);
      if (!res.ok) return toast(res.error || 'Could not update name.');
      toast('Saved.');
      render();
    });
    name.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveBtn.click();
    });
  }

  if (exportBtn && box) {
    exportBtn.addEventListener('click', () => {
      box.value = exportTvaraData();
      toast('Export generated.');
    });
  }

  if (copyBtn && box) {
    copyBtn.addEventListener('click', async () => {
      if (!box.value.trim()) box.value = exportTvaraData();
      try {
        await navigator.clipboard.writeText(box.value);
        toast('Copied.');
      } catch (_) {
        toast('Copy failed — select and copy manually.');
      }
    });
  }

  if (importBtn && box) {
    importBtn.addEventListener('click', () => {
      const txt = box.value.trim();
      if (!txt) return toast('Paste an export JSON first.');
      const res = importTvaraData(txt);
      if (!res.ok) return toast(res.error || 'Import failed.');
      toast('Imported.');
      render();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetUser();
      toast('Reset complete.');
      render();
    });
  }

  function persistSettings() {
    const s = loadSettings();
    if (rm) s.reducedMotion = !!rm.checked;
    if (sound) s.sound = !!sound.checked;
    saveSettings(s);
    document.documentElement.dataset.reduceMotion = s.reducedMotion ? '1' : '';
  }

  if (rm) rm.addEventListener('change', () => { persistSettings(); toast('Updated.'); });
  if (sound) sound.addEventListener('change', () => { persistSettings(); toast('Updated.'); });
}

document.addEventListener('DOMContentLoaded', () => {
  bind();
  render();
});

