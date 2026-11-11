const { app, BrowserWindow, ipcMain, dialog, shell, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_ID = 'com.hypersoft.nouby';
app.setAppUserModelId(APP_ID);

let win;
const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'nouby-data.json');
const backupDir = () => path.join(dataDir(), 'backups');

function emptyDb() {
  return {
    version: 1,
    settings: {
      shopName: 'النوبي للموبايلات',
      shopPhone: '',
      currency: 'ج.م',
      remindDays: 3,
      roundTo: 5,
      autoStart: false,
      cloudUrl: '',
      cloudAnon: '',
      syncKey: '',
      portalUrl: '',
      reminderDays: [1],
      autoReceipt: true,
      remindBefore: true,
      remindLate: true,
      waMode: 'app',
      tpl: {},
      waTemplate:
        'أهلاً أستاذ {name} 👋\nبنفكّر حضرتك إن قسط {device} بقيمة {amount} {currency} ميعاده {date}.\nإجمالي المتبقي: {remaining} {currency}.\nشكراً لحضرتك 🙏\n{shop}'
    },
    customers: [],
    contracts: [],
    messages: []
  };
}

// optional defaults baked into the build (cloud.json next to main.js)
function cloudDefaults() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'cloud.json'), 'utf8')); } catch { return {}; }
}

function loadDb() {
  const db = loadDbRaw();
  const d = cloudDefaults();
  for (const k of ['cloudUrl', 'cloudAnon', 'portalUrl']) if (!db.settings[k] && d[k]) db.settings[k] = d[k];
  return db;
}

function loadDbRaw() {
  try {
    if (fs.existsSync(dataFile())) {
      const db = JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
      const base = emptyDb();
      db.settings = { ...base.settings, ...(db.settings || {}) };
      db.customers ||= [];
      db.contracts ||= [];
      db.messages ||= [];
      return db;
    }
  } catch (e) {
    // corrupted file -> try last backup
    const b = latestBackup();
    if (b) { const db = JSON.parse(fs.readFileSync(b, 'utf8')); db.settings = { ...emptyDb().settings, ...(db.settings || {}) }; return db; }
  }
  return emptyDb();
}

function latestBackup() {
  try {
    const files = fs.readdirSync(backupDir()).filter(f => f.endsWith('.json')).sort();
    return files.length ? path.join(backupDir(), files[files.length - 1]) : null;
  } catch { return null; }
}

function saveDb(db) {
  fs.mkdirSync(dataDir(), { recursive: true });
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, dataFile());
  return true;
}

// one automatic backup per day, keep last 30
function dailyBackup() {
  try {
    if (!fs.existsSync(dataFile())) return;
    fs.mkdirSync(backupDir(), { recursive: true });
    const d = new Date().toISOString().slice(0, 10);
    const target = path.join(backupDir(), `backup-${d}.json`);
    if (!fs.existsSync(target)) fs.copyFileSync(dataFile(), target);
    const files = fs.readdirSync(backupDir()).filter(f => f.endsWith('.json')).sort();
    while (files.length > 30) fs.unlinkSync(path.join(backupDir(), files.shift()));
  } catch {}
}

function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0c16',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#10121e', symbolColor: '#9aa0b8', height: 40 },
    title: 'النوبي — سيستم الأقساط',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

// ======================= Cloud sync (Supabase) =======================
const sync = { state: 'off', at: null, error: null, timer: null, running: false, again: false };

function cloudCfg(db) {
  const s = (db || loadDb()).settings;
  const url = String(s.cloudUrl || '').trim().replace(/\/+$/, '');
  if (!url || !s.cloudAnon || !s.syncKey) return null;
  return { url, anon: String(s.cloudAnon).trim(), key: String(s.syncKey).trim() };
}

async function rpc(cfg, fn, body) {
  const r = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: cfg.anon, Authorization: `Bearer ${cfg.anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000)
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!r.ok) {
    const msg = (json && json.message) || text || `HTTP ${r.status}`;
    const err = new Error(msg); err.http = r.status; throw err;
  }
  return json;
}

function friendlyError(e) {
  const m = String(e && e.message || e);
  if (m.includes('would_wipe')) return 'السحابة فيها بيانات والجهاز ده فاضي — استرجعها من الإعدادات';
  if (m.includes('unauthorized')) return 'مفتاح المزامنة غلط';
  if (e && e.http === 401) return 'مفتاح Supabase (anon key) غلط';
  if (e && e.http === 404) return 'الداتابيز لسه متجهزتش (شغّل setup.sql)';
  if (/fetch failed|ENOTFOUND|ECONN|timeout|network|EAI_AGAIN/i.test(m)) return 'offline';
  return m.slice(0, 160);
}

function setSync(state, extra = {}) {
  Object.assign(sync, { state }, extra);
  if (win && !win.isDestroyed()) win.webContents.send('sync:status', { state: sync.state, at: sync.at, error: sync.error });
}

function snapshot(db) {
  const s = db.settings;
  return { shop: { name: s.shopName, phone: s.shopPhone, currency: s.currency }, customers: db.customers, contracts: db.contracts };
}

async function doSync() {
  const db = loadDb();
  const cfg = cloudCfg(db);
  if (!cfg) return setSync('off', { error: null });
  if (sync.running) { sync.again = true; return; }
  sync.running = true;
  setSync('syncing');
  try {
    const res = await rpc(cfg, 'sync_push', { p_key: cfg.key, p_data: snapshot(db) });
    setSync('ok', { at: res.at || new Date().toISOString(), error: null, pending: false });
  } catch (e) {
    const fe = friendlyError(e);
    setSync(fe === 'offline' ? 'offline' : 'error', { error: fe === 'offline' ? null : fe, pending: true });
  } finally {
    sync.running = false;
    if (sync.again) { sync.again = false; scheduleSync(1500); }
  }
}

function scheduleSync(ms = 3000) {
  clearTimeout(sync.timer);
  sync.timer = setTimeout(doSync, ms);
}

app.whenReady().then(() => {
  dailyBackup();
  createWindow();
  scheduleSync(4000);
  // retry every minute while there are unsent changes (no internet etc.)
  setInterval(() => { if (sync.pending && !sync.running) doSync(); }, 60 * 1000);
});
app.on('window-all-closed', () => app.quit());

// ---------- IPC ----------
ipcMain.handle('db:load', () => loadDb());
ipcMain.handle('db:save', (_e, db) => { saveDb(db); sync.pending = true; scheduleSync(); return true; });

ipcMain.handle('sync:status', () => ({ state: sync.state, at: sync.at, error: sync.error }));
ipcMain.handle('sync:now', () => { scheduleSync(0); return true; });
ipcMain.handle('sync:test', async (_e, s) => {
  const cfg = cloudCfg({ settings: s });
  if (!cfg) return { ok: false, error: 'كمّل البيانات الـ 3 الأول' };
  try { const r = await rpc(cfg, 'sync_ping', { p_key: cfg.key }); return { ok: true, customers: r.customers, synced_at: r.synced_at }; }
  catch (e) { const fe = friendlyError(e); return { ok: false, error: fe === 'offline' ? 'مفيش اتصال بالنت أو اللينك غلط' : fe }; }
});
ipcMain.handle('sync:pull', async () => {
  const cfg = cloudCfg();
  if (!cfg) throw new Error('السحابة مش متظبطة');
  return rpc(cfg, 'sync_pull', { p_key: cfg.key });
});

ipcMain.handle('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, icon: path.join(__dirname, 'build', 'icon.png') });
    n.on('click', () => { if (win) { win.show(); win.focus(); } });
    n.show();
  }
  return true;
});

ipcMain.handle('open-external', (_e, url) => {
  if (/^(https?:\/\/|tel:|whatsapp:\/\/)/.test(url)) shell.openExternal(url);
  return true;
});

ipcMain.handle('backup:export', async (_e, db) => {
  const d = new Date().toISOString().slice(0, 10);
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'حفظ نسخة احتياطية',
    defaultPath: `النوبي-نسخة-احتياطية-${d}.json`,
    filters: [{ name: 'Backup', extensions: ['json'] }]
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf8');
  return true;
});

ipcMain.handle('backup:import', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(win, {
    title: 'استرجاع نسخة احتياطية',
    filters: [{ name: 'Backup', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;
  const db = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
  if (!Array.isArray(db.customers) || !Array.isArray(db.contracts)) throw new Error('ملف غير صالح');
  return db;
});

ipcMain.handle('export:csv', async (_e, { name, csv }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'تصدير Excel',
    defaultPath: `${name}.csv`,
    filters: [{ name: 'Excel CSV', extensions: ['csv'] }]
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, '﻿' + csv, 'utf8');
  return true;
});

ipcMain.handle('print', async () => {
  win.webContents.print({ printBackground: true });
  return true;
});

ipcMain.handle('autostart', (_e, on) => {
  try { app.setLoginItemSettings({ openAtLogin: !!on }); } catch {}
  return true;
});

ipcMain.handle('open-data-folder', () => shell.openPath(dataDir()));
ipcMain.handle('theme', (_e, t) => {
  try { win.setTitleBarOverlay(t === 'light' ? { color: '#eef0f6', symbolColor: '#4a4f66' } : { color: '#10121e', symbolColor: '#9aa0b8' }); } catch {}
  return true;
});
