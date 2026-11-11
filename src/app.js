/* النوبي — سيستم الأقساط */
'use strict';

// ======================= State =======================
let DB = null;
let state = { page: 'dashboard', dueFilter: 'now', contractFilter: 'active', custFilter: '', reportMonth: null };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const round2 = (n) => Math.round((+n || 0) * 100) / 100;

// ======================= Icons (inline SVG, stroke) =======================
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  message: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 14h4.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
  wa: '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1z"/><path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1.2-1.4-1.9-1-1 .9a4.5 4.5 0 0 1-2.6-2.6l.9-1-1-1.9z"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9m-5 5 5-5 5 5M4 3h16"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17.5 18z"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  receipt: '<path d="M5 3h14v18l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5L5 21z"/><path d="M9 8h6M9 12h6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.2v.1"/>',
  skip: '<path d="m6 6 12 12M18 6 6 18"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  party: '<path d="M4 20 9 7l8 8z"/><path d="M14 4.5c.5 1.5 0 3-1.5 4M19.5 10c-1.5-.5-3 0-4 1.5M17 3v2M21 7h-2M18.5 4.5 20 3"/>'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ======================= Dates =======================
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => toStr(new Date());
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
const fmtD = (s) => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (s) => { const d = parseD(s); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
function addMonths(s, n, anchorDay) {
  const d = parseD(s);
  const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last));
  return toStr(t);
}
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
function relDay(s) {
  const n = daysBetween(todayStr(), s);
  if (n === 0) return 'النهارده';
  if (n === 1) return 'بكرة';
  if (n === -1) return 'امبارح';
  if (n < 0) return `متأخر ${-n} يوم`;
  return `بعد ${n} يوم`;
}

// ======================= Money =======================
const money = (n) => (round2(n)).toLocaleString('en-US', { maximumFractionDigits: 2 });
const cur = () => DB.settings.currency;
const M = (n) => `${money(n)} <small>${esc(cur())}</small>`;

// ======================= Core logic =======================
function buildSchedule({ total, down, months, firstDate, roundTo }) {
  const remaining = round2(total - down);
  months = Math.max(1, parseInt(months) || 1);
  if (remaining <= 0) return [];
  const r = Math.max(1, +roundTo || 1);
  let monthly = Math.ceil(remaining / months / r) * r;
  let last = round2(remaining - monthly * (months - 1));
  if (last <= 0) { monthly = round2(remaining / months); last = round2(remaining - monthly * (months - 1)); }
  const anchor = parseD(firstDate).getDate();
  return Array.from({ length: months }, (_, i) => ({
    n: i + 1,
    due: addMonths(firstDate, i, anchor),
    amount: i === months - 1 ? last : monthly,
    paid: 0
  }));
}

function instState(inst, today = todayStr()) {
  const left = round2(inst.amount - inst.paid);
  if (left <= 0) return 'paid';
  const d = daysBetween(today, inst.due);
  if (d < 0) return 'over';
  if (d === 0) return 'today';
  if (d <= (+DB.settings.remindDays || 3)) return 'soon';
  return inst.paid > 0 ? 'part' : 'later';
}
const PILL = {
  paid: ['p-paid', 'مدفوع'], over: ['p-over', 'متأخر'], today: ['p-today', 'النهارده'],
  soon: ['p-soon', 'قرّب'], later: ['p-later', 'لسه'], part: ['p-part', 'مدفوع جزئي'], done: ['p-paid', 'خلص'], active: ['p-soon', 'شغّال']
};
const pill = (k, txt) => `<span class="pill ${PILL[k][0]}">${txt || PILL[k][1]}</span>`;

function cStats(c) {
  const paidInst = c.installments.reduce((s, i) => s + i.paid, 0);
  const instTotal = c.installments.reduce((s, i) => s + i.amount, 0);
  const remaining = round2(instTotal - paidInst);
  const next = c.installments.find(i => i.amount - i.paid > 0.001);
  const over = c.installments.filter(i => instState(i) === 'over');
  const overAmt = over.reduce((s, i) => s + (i.amount - i.paid), 0);
  const paidCount = c.installments.filter(i => i.amount - i.paid <= 0.001).length;
  const collected = round2(c.downPayment + paidInst);
  const pct = c.totalPrice ? Math.min(100, (collected / c.totalPrice) * 100) : 100;
  return { remaining, next, over, overAmt: round2(overAmt), paidCount, collected, pct, done: remaining <= 0.001 };
}
const custOf = (c) => DB.customers.find(x => x.id === c.customerId) || { name: '—', phone: '' };
const contractsOf = (custId) => DB.contracts.filter(c => c.customerId === custId);

function applyPayment(c, amount, date, note) {
  amount = round2(amount);
  const st = cStats(c);
  if (amount <= 0) throw new Error('المبلغ لازم يكون أكبر من صفر');
  if (amount > st.remaining + 0.001) throw new Error(`المبلغ أكبر من المتبقي (${money(st.remaining)})`);
  let left = amount; const alloc = [];
  for (const i of c.installments) {
    if (left <= 0) break;
    const need = round2(i.amount - i.paid);
    if (need <= 0) continue;
    const take = Math.min(need, left);
    i.paid = round2(i.paid + take);
    if (i.paid >= i.amount) i.paidAt = date;
    alloc.push({ n: i.n, amt: round2(take) });
    left = round2(left - take);
  }
  const p = { id: uid(), date, amount, note: note || '', alloc };
  c.payments.push(p);
  return p;
}
function undoPayment(c, pid) {
  const p = c.payments.find(x => x.id === pid);
  if (!p) return;
  for (const a of p.alloc) {
    const i = c.installments.find(x => x.n === a.n);
    if (i) { i.paid = round2(i.paid - a.amt); delete i.paidAt; }
  }
  c.payments = c.payments.filter(x => x.id !== pid);
}

// all unpaid installments with context
function dueItems() {
  const out = [];
  for (const c of DB.contracts) {
    const cu = custOf(c);
    for (const i of c.installments) {
      const left = round2(i.amount - i.paid);
      if (left <= 0) continue;
      out.push({ c, cu, i, left, st: instState(i) });
    }
  }
  return out.sort((a, b) => a.i.due.localeCompare(b.i.due));
}

async function save() { await window.api.save(DB); updateBadge(); }

// ======================= UI helpers =======================
function toast(msg, kind = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = `${ic(kind === 'ok' ? 'check' : 'alert')}<span>${esc(msg)}</span>`;
  $('#toasts').append(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2800);
}
function openModal(html, cls = '') {
  const m = $('#modal'); m.className = 'modal ' + cls; m.innerHTML = html;
  $('#modalBack').classList.add('open');
  setTimeout(() => { const f = m.querySelector('[autofocus]') || m.querySelector('input'); f && f.focus(); }, 60);
}
function closeModal() { $('#modalBack').classList.remove('open'); $('#modal').innerHTML = ''; }
function confirmBox(title, text, okTxt = 'تأكيد', danger = true) {
  return new Promise(res => {
    openModal(`
      <div class="m-head"><h2>${esc(title)}</h2><button class="x" data-cf="0" aria-label="إغلاق">×</button></div>
      <div class="m-body"><p style="color:var(--muted);line-height:1.9">${text}</p></div>
      <div class="m-foot"><button class="btn ${danger ? 'danger' : 'primary'}" data-cf="1">${esc(okTxt)}</button><button class="btn ghost" data-cf="0">إلغاء</button></div>`, 'sm');
    $$('#modal [data-cf]').forEach(b => b.onclick = () => { const v = b.dataset.cf === '1'; closeModal(); res(v); });
  });
}
const initials = (n) => (n || '?').trim().charAt(0);
const telDigits = (p) => String(p || '').replace(/\D/g, '');
function waNumber(p) {
  let d = telDigits(p);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '20' + d.slice(1);
  if (d.length === 10 && d.startsWith('1')) d = '20' + d;
  return d;
}
function openWa(phone, text) {
  const n = waNumber(phone), t = encodeURIComponent(text), mode = DB.settings.waMode || 'app';
  const url = mode === 'web' ? `https://web.whatsapp.com/send?phone=${n}&text=${t}`
    : mode === 'link' ? `https://wa.me/${n}?text=${t}` : `whatsapp://send?phone=${n}&text=${t}`;
  window.api.openExternal(url);
}
function openWhatsApp(c) {
  const cu = custOf(c);
  if (!cu.phone) return toast('مفيش رقم موبايل للعميل', 'bad');
  const type = cStats(c).over.length ? 'overdue' : 'reminder';
  const m = newMsg(type, c, { key: `${type}:${c.id}:manual:${Date.now()}` });
  sendMsg(m);
}
const nidOk = (cu) => telDigits(cu.nationalId).length >= 4;
function sendPortalLink(cu) {
  const s = DB.settings;
  if (!s.portalUrl) return toast('حط لينك موقع العملاء في الإعدادات الأول', 'bad');
  if (!cu.phone) return toast('مفيش رقم موبايل للعميل', 'bad');
  if (!nidOk(cu)) return toast('سجّل الرقم القومي للعميل الأول', 'bad');
  const msg = `أهلاً أستاذ ${cu.name} 👋\nتقدر تتابع أقساطك وتعرف عليك كام والقسط الجاي امتى من اللينك ده:\n${s.portalUrl}\n\nادخل برقم موبايلك ده وآخر 4 أرقام من رقمك القومي.\n${s.shopName}`;
  openWa(cu.phone, msg);
}

// ======================= Sync status =======================
function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'دلوقتي';
  if (m < 60) return `من ${m} دقيقة`;
  const d = new Date(iso);
  return `${d.getHours()}:${pad(d.getMinutes())} ${fmtShort(toStr(d))}`;
}
function syncText(st) {
  st ||= { state: 'off' };
  return {
    off: 'السحابة مش متظبطة. الداتا محفوظة على الجهاز بس.',
    syncing: 'بيرفع على السحابة…',
    ok: `<span style="color:var(--mint)">●</span> كل حاجة مترفوعة على السحابة. آخر رفع ${timeAgo(st.at)}`,
    offline: '<span style="color:var(--gold)">●</span> مفيش نت. التعديلات محفوظة على الجهاز وهتترفع أول ما النت يرجع.',
    error: `<span style="color:var(--coral)">●</span> ${esc(st.error || 'حصلت مشكلة في الرفع')}`
  }[st.state] || '';
}
function showSync(st) {
  state.sync = st;
  const chip = $('#syncChip');
  chip.className = 'sync-chip ' + st.state;
  chip.querySelector('span').textContent = {
    off: 'السحابة مش متظبطة', syncing: 'بيرفع…', ok: `مترفوع ${timeAgo(st.at)}`, offline: 'مستني النت', error: 'مشكلة في الرفع'
  }[st.state];
  const cs = $('#cloudStatus'); if (cs) cs.innerHTML = syncText(st);
}

// ======================= Messages =======================
const DEF_TPL = {
  receipt: 'إيصال دفع من {المحل} ✅\n\nأهلاً أستاذ {الاسم}\nاستلمنا من حضرتك {المدفوع} {العملة} يوم {تاريخ_الدفع}\nالجهاز: {الجهاز}\n\nإجمالي اللي دفعته: {إجمالي_المدفوع} {العملة}\nالمتبقي عليك: {المتبقي} {العملة}\nالقسط الجاي: {القسط} {العملة} يوم {الميعاد}\n{سطر_الخلاص}\n\nتفاصيل حسابك كلها من هنا: {اللينك}\nشكراً لحضرتك 🙏',
  reminder: 'أهلاً أستاذ {الاسم} 👋\nبنفكّر حضرتك إن قسط {الجهاز} بقيمة {القسط} {العملة} ميعاده {الميعاد}.\nالمتبقي عليك: {المتبقي} {العملة}\n\nتابع حسابك من هنا: {اللينك}\n{المحل}',
  overdue: 'أهلاً أستاذ {الاسم}\nبرجاء سداد القسط المتأخر 🙏\nعليك {عدد_المتأخر} قسط متأخر لـ {الجهاز} بإجمالي {المتأخر} {العملة}، أقدمهم من {أقدم_متأخر}.\nالمتبقي الكلي: {المتبقي} {العملة}\n\nللتواصل: {رقم_المحل}\n{المحل}'
};
const AR_KEYS = { 'الاسم': 'name', 'الجهاز': 'device', 'العملة': 'currency', 'المحل': 'shop', 'رقم_المحل': 'shopPhone', 'اللينك': 'portal',
  'المتبقي': 'remaining', 'إجمالي_المدفوع': 'totalPaid', 'القسط': 'amount', 'الميعاد': 'date', 'المتأخر': 'overdue', 'عدد_المتأخر': 'overdueCount',
  'أقدم_متأخر': 'oldestDate', 'المدفوع': 'paid', 'تاريخ_الدفع': 'payDate', 'سطر_الخلاص': 'doneLine' };
const MSG_T = { receipt: ['t-receipt', 'إيصال دفع'], reminder: ['t-reminder', 'تذكير بالقسط'], overdue: ['t-overdue', 'قسط متأخر'] };
const tplOf = (type) => (DB.settings.tpl && DB.settings.tpl[type]) || DEF_TPL[type];

// lines whose placeholder has no value are dropped (e.g. no portal link yet)
function fillTpl(tpl, vars) {
  return tpl.split('\n').filter(line => {
    const keys = [...line.matchAll(/\{([^{}\s]+)\}/g)].map(m => AR_KEYS[m[1]] || m[1]);
    return keys.every(k => vars[k] !== undefined && vars[k] !== null && vars[k] !== '');
  }).map(line => line.replace(/\{([^{}\s]+)\}/g, (_, k) => vars[AR_KEYS[k] || k])).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function msgVars(c, extra = {}) {
  const cu = custOf(c), st = cStats(c), s = DB.settings, nx = st.next, oldest = st.over[0];
  return {
    name: cu.name, device: c.device, currency: s.currency, shop: s.shopName, shopPhone: s.shopPhone || '', portal: s.portalUrl || '',
    remaining: money(st.remaining), totalPaid: money(st.collected),
    amount: nx ? money(nx.amount - nx.paid) : '', date: nx ? fmtD(nx.due) : '',
    nextAmount: nx ? money(nx.amount - nx.paid) : '', nextDate: nx ? fmtD(nx.due) : '',
    overdue: money(st.overAmt), overdueCount: String(st.over.length), oldestDate: oldest ? fmtD(oldest.due) : '',
    doneLine: st.done ? '🎉 مبروك! كده حضرتك خلّصت كل الأقساط' : '', ...extra
  };
}
const msgContract = (m) => DB.contracts.find(x => x.id === m.contractId);
function msgText(m) {
  if (m.text) return m.text;               // receipts and edited messages keep their text
  const c = msgContract(m); return c ? fillTpl(tplOf(m.type), msgVars(c)) : '';
}
function newMsg(type, c, opt = {}) {
  DB.messages ||= [];
  const m = { id: uid(), key: opt.key || `${type}:${c.id}:${todayStr()}`, type, customerId: c.customerId, contractId: c.id,
    status: 'pending', createdAt: new Date().toISOString(), forDate: todayStr(), text: opt.text || '' };
  DB.messages.push(m);
  if (DB.messages.length > 2000) DB.messages = DB.messages.slice(-2000);
  return m;
}
const pendingMsgs = () => (DB.messages || []).filter(m => m.status === 'pending' && msgContract(m));
async function sendMsg(m) {
  const c = msgContract(m); const cu = c && custOf(c);
  if (!cu || !cu.phone) return toast('مفيش رقم موبايل للعميل', 'bad');
  if (!m.text && m.type !== 'receipt') m.text = msgText(m); // freeze what was actually sent
  openWa(cu.phone, msgText(m));
  m.status = 'sent'; m.sentAt = new Date().toISOString();
  await save();
  if (state.page === 'messages' || state.page === 'dashboard') render();
}
function reminderDayToday(d = new Date()) {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return (DB.settings.reminderDays || []).some(x => Math.min(+x, last) === d.getDate());
}
// builds today's reminders once (keys are per contract per day)
function generateReminders() {
  const t = todayStr(), s = DB.settings; let added = 0;
  DB.messages ||= [];
  const isDay = reminderDayToday();
  for (const c of DB.contracts) {
    const st = cStats(c); if (st.done) continue;
    let type = null;
    if (isDay) {
      if (st.over.length) type = 'overdue';
      else if (st.next && daysBetween(t, st.next.due) <= 31) type = 'reminder';
    }
    if (!type && s.remindBefore && st.next && !st.over.length && daysBetween(t, st.next.due) === +s.remindDays) type = 'reminder';
    if (!type && s.remindLate && st.over.some(i => daysBetween(i.due, t) === 1)) type = 'overdue';
    if (!type) continue;
    const key = `${type}:${c.id}:${t}`;
    if (DB.messages.some(m => m.key === key)) continue;
    DB.messages.forEach(m => { if (m.contractId === c.id && m.status === 'pending' && m.type !== 'receipt') m.status = 'skipped'; });
    newMsg(type, c, { key }); added++;
  }
  return added;
}

// ======================= Navigation =======================
const TITLES = { dashboard: 'الرئيسية', due: 'التحصيل والأقساط المستحقة', messages: 'الرسايل', customers: 'العملاء', contracts: 'عقود التقسيط', reports: 'التقارير', settings: 'الإعدادات' };
function go(page) {
  state.page = page;
  $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('#pageTitle').textContent = TITLES[page];
  render();
}
function render() {
  const v = $('#view');
  const fn = { dashboard: viewDashboard, due: viewDue, messages: viewMessages, customers: viewCustomers, contracts: viewContracts, reports: viewReports, settings: viewSettings }[state.page];
  v.innerHTML = `<div>${fn()}</div>`;
  if (state.page === 'settings') bindSettings();
  if (state.page === 'dashboard') animateDashboard();
  $('#brandName').textContent = DB.settings.shopName.split(' ')[0] || 'النوبي';
}
// the one orchestrated moment: numbers count up + ring fills, first visit only
function animateDashboard() {
  const ring = $('.ring .bar');
  if (ring) requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = ring.dataset.to; }));
  if (state.animated) { if (ring) ring.style.transition = 'none'; return; }
  state.animated = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 900;
    const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = money(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function updateBadge() {
  const n = dueItems().filter(x => x.st === 'over' || x.st === 'today').length;
  const b = $('#dueBadge'); b.hidden = !n; b.textContent = n;
  const pm = pendingMsgs().length; const mb = $('#msgBadge'); mb.hidden = !pm; mb.textContent = pm;
}

// ======================= Views =======================
function kpi(label, val, sub, color, hero) {
  if (hero) return `<div class="kpi hero"><div class="screen"><div class="meta"><div class="lbl">${label}</div><div class="val">${val}</div><div class="sub">${sub || ''}</div></div></div></div>`;
  return `<div class="card kpi"><div class="lbl">${color ? `<span class="dot" style="background:${color};color:${color}"></span>` : ''}${label}</div><div class="val">${val}</div><div class="sub">${sub || ''}</div></div>`;
}
const MC = (n) => `<span data-count="${round2(n)}">${money(n)}</span> <small>${esc(cur())}</small>`;
function heroRing(label, amount, sub, pct) {
  const C = 2 * Math.PI * 40, off = C * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="kpi hero"><div class="screen">
    <div class="ring"><svg viewBox="0 0 96 96"><circle class="trk" cx="48" cy="48" r="40"/><circle class="bar" cx="48" cy="48" r="40" stroke-dasharray="${C}" style="stroke-dashoffset:${C}" data-to="${off}"/></svg><div class="c"><div>${Math.round(pct)}%<small>اتحصّل</small></div></div></div>
    <div class="meta"><div class="lbl">${label}</div><div class="val">${MC(amount)}</div><div class="sub">${sub}</div></div>
  </div></div>`;
}
function dueRow(x, compact) {
  const { c, cu, i, left, st } = x;
  return `<div class="li" data-act="cust" data-id="${cu.id}">
    <div class="avatar">${esc(initials(cu.name))}</div>
    <div class="meta"><div class="name">${esc(cu.name)}</div><div class="sub">${esc(c.device)} · قسط ${i.n}/${c.installments.length} · ${relDay(i.due)}</div></div>
    ${pill(st)}
    <div class="amt">${M(left)}</div>
    ${compact ? '' : `<button class="btn sm green" data-act="pay" data-cid="${c.id}">${ic('cash')}تحصيل</button><button class="btn sm wa" data-act="wa" data-cid="${c.id}" title="تذكير واتساب">${ic('wa')}</button>`}
  </div>`;
}

function groupByContract(items) {
  const m = new Map();
  for (const x of items) {
    if (!m.has(x.c.id)) m.set(x.c.id, { c: x.c, cu: x.cu, items: [], left: 0, st: x.st, due: x.i.due });
    const g = m.get(x.c.id); g.items.push(x); g.left = round2(g.left + x.left);
    if (x.st === 'over') g.st = 'over';
  }
  return [...m.values()].sort((a, b) => (a.st === 'over' ? 0 : 1) - (b.st === 'over' ? 0 : 1) || a.due.localeCompare(b.due));
}
function groupRow(g) {
  const { c, cu, items, left, st } = g;
  const n = items.length;
  const sub = n > 1 ? `${n} أقساط (${items.map(x => x.i.n).join('، ')}) · أقدمهم ${relDay(items[0].i.due)}` : `قسط ${items[0].i.n}/${c.installments.length} · ${relDay(items[0].i.due)}`;
  return `<div class="li" data-act="cust" data-id="${cu.id}">
    <div class="avatar">${esc(initials(cu.name))}</div>
    <div class="meta"><div class="name">${esc(cu.name)}</div><div class="sub">${esc(c.device)} · ${sub}</div></div>
    ${pill(st, st === 'over' && n > 1 ? `${items.filter(x => x.st === 'over').length} متأخر` : undefined)}
    <div class="amt">${M(left)}</div>
    <button class="btn sm green" data-act="pay" data-cid="${c.id}">${ic('cash')}تحصيل</button><button class="btn sm wa" data-act="wa" data-cid="${c.id}" title="تذكير واتساب">${ic('wa')}</button>
  </div>`;
}

function viewDashboard() {
  const items = dueItems();
  const now = items.filter(x => x.st === 'over' || x.st === 'today');
  const over = items.filter(x => x.st === 'over');
  const soon = items.filter(x => x.st === 'soon');
  const ym = todayStr().slice(0, 7);
  const collectedMonth = DB.contracts.reduce((s, c) => s + c.payments.filter(p => p.date.startsWith(ym)).reduce((a, p) => a + p.amount, 0)
    + (c.date.startsWith(ym) ? c.downPayment : 0), 0);
  const outstanding = DB.contracts.reduce((s, c) => s + cStats(c).remaining, 0);
  const totalAll = DB.contracts.reduce((s, c) => s + c.totalPrice, 0);
  const collectedAll = totalAll - outstanding;
  const active = DB.contracts.filter(c => !cStats(c).done).length;
  const pct = totalAll ? Math.round(collectedAll / totalAll * 100) : 0;

  const pm = pendingMsgs().length;
  const banner = (over.length ? `<div class="banner"><span class="bi">${ic('bell')}</span><div>فيه <b>${over.length} قسط متأخر</b> بإجمالي <b>${money(over.reduce((s, x) => s + x.left, 0))} ${esc(cur())}</b> لازم يتحصّلوا.</div><span style="flex:1"></span><button class="btn sm" data-go="due">افتح التحصيل</button></div>` : '')
    + (pm ? `<div class="banner gold"><span class="bi">${ic('message')}</span><div>فيه <b>${pm} رسالة</b> جاهزة تتبعت للعملاء.</div><span style="flex:1"></span><button class="btn sm primary" data-go="messages">${ic('send')}ابعتهم</button></div>` : '');

  if (!DB.customers.length) {
    return `<div class="card" style="padding:64px;text-align:center">
      <div class="empty"><div class="big">${ic('phone')}</div></div><h2 style="font-family:var(--display);font-size:24px;font-weight:700;margin:0 0 8px">أهلاً بيك في سيستم ${esc(DB.settings.shopName)}</h2>
      <p style="color:var(--muted);margin-bottom:22px">ابدأ بإضافة أول عميل، وبعدين اعمله عقد قسط والسيستم هيقسّم ويفكّرك بكل قسط.</p>
      <button class="btn primary" data-act="newCust">${ic('plus')}إضافة أول عميل</button></div>`;
  }
  const t = todayStr();
  const collectedToday = DB.contracts.reduce((s, c) => s + c.payments.filter(p => p.date === t).reduce((a, p) => a + p.amount, 0), 0);
  const nowAmt = now.reduce((s, x) => s + x.left, 0);
  const ringPct = collectedToday + nowAmt ? collectedToday / (collectedToday + nowAmt) * 100 : 100;

  return `${banner}
  <div class="grid kpis">
    ${heroRing('المطلوب تحصيله النهارده', nowAmt, `${now.length} قسط مستحق ومتأخر · اتحصّل النهارده ${money(collectedToday)}`, ringPct)}
    ${kpi('اتحصّل الشهر ده', MC(collectedMonth), `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`, 'var(--mint)')}
    ${kpi('الفلوس اللي برّه', MC(outstanding), `في ${active} عقد شغّال`, 'var(--gold)')}
    ${kpi('العملاء', `<span data-count="${DB.customers.length}">${DB.customers.length}</span>`, `${DB.contracts.length} عقد إجمالي`, 'var(--sky)')}
  </div>
  <div class="grid row2">
    <div class="card"><h3>مستحق النهارده والمتأخر <button class="link" data-go="due">عرض الكل</button></h3>
      <div class="list">${groupByContract(now).slice(0, 8).map(groupRow).join('') || `<div class="empty"><div class="big">${ic('party')}</div>مفيش أقساط مستحقة النهارده</div>`}</div>
    </div>
    <div class="grid" style="align-content:start">
      <div class="card"><h3>نسبة التحصيل الكلية</h3>
        <div class="donut-wrap">
          <div class="donut" style="background:conic-gradient(from 0deg, #f2b544, #ff8a3d ${pct * 3.6}deg, var(--glass2) 0)"><div class="ctr">${pct}%<small>اتحصّل</small></div></div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div><div class="muted" style="color:var(--muted);font-size:12.5px">اتحصّل</div><div class="num">${M(collectedAll)}</div></div>
            <div><div style="color:var(--muted);font-size:12.5px">متبقي</div><div class="num">${M(outstanding)}</div></div>
          </div>
        </div>
      </div>
      <div class="card"><h3>جاي خلال ${DB.settings.remindDays} أيام</h3>
        <div class="list">${soon.slice(0, 5).map(x => dueRow(x, true)).join('') || `<div class="empty" style="padding:16px">مفيش أقساط قريبة</div>`}</div>
      </div>
    </div>
  </div>`;
}

function viewDue() {
  const items = dueItems();
  const ym = todayStr().slice(0, 7);
  const F = {
    now: ['المطلوب دلوقتي', x => x.st === 'over' || x.st === 'today'],
    over: ['متأخر', x => x.st === 'over'],
    today: ['النهارده', x => x.st === 'today'],
    soon: [`خلال ${DB.settings.remindDays} أيام`, x => x.st === 'soon'],
    month: ['الشهر ده', x => x.i.due.startsWith(ym)],
    all: ['كل الجاي', () => true]
  };
  const list = items.filter(F[state.dueFilter][1]);
  const total = list.reduce((s, x) => s + x.left, 0);
  return `<div class="toolbar">
    <div class="seg">${Object.entries(F).map(([k, [t, f]]) => `<button class="${state.dueFilter === k ? 'on' : ''}" data-due="${k}">${t}<span class="c">${items.filter(f).length}</span></button>`).join('')}</div>
    <span class="spacer"></span>
    <div style="color:var(--muted)">الإجمالي: <b style="color:var(--text);font-size:18px">${money(total)}</b> ${esc(cur())}</div>
    <button class="btn" data-act="exportDue">${ic('download')}Excel</button>
  </div>
  <div class="table-wrap">${list.length ? `<table><thead><tr><th>العميل</th><th>الجهاز</th><th>القسط</th><th>الميعاد</th><th>المبلغ المطلوب</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${list.map(({ c, cu, i, left, st }) => `<tr class="click" data-act="cust" data-id="${cu.id}">
      <td><div class="strong">${esc(cu.name)}</div><div class="muted" dir="ltr" style="text-align:right">${esc(cu.phone)}</div></td>
      <td>${esc(c.device)}</td><td>${i.n} من ${c.installments.length}</td>
      <td><div>${fmtD(i.due)}</div><div class="muted">${relDay(i.due)}</div></td>
      <td class="num">${M(left)}</td><td>${pill(st)}</td>
      <td style="white-space:nowrap"><button class="btn sm green" data-act="pay" data-cid="${c.id}">${ic('cash')}تحصيل</button> <button class="btn sm wa" data-act="wa" data-cid="${c.id}" title="تذكير واتساب">${ic('wa')}</button></td>
    </tr>`).join('')}</tbody></table>` : `<div class="empty"><div class="big">${ic('check')}</div>مفيش أقساط هنا</div>`}</div>`;
}

function viewCustomers() {
  const q = state.custFilter.trim();
  const rows = DB.customers
    .filter(cu => !q || cu.name.includes(q) || telDigits(cu.phone).includes(telDigits(q) || '§'))
    .map(cu => {
      const cs = contractsOf(cu.id).map(cStats);
      const rem = cs.reduce((s, x) => s + x.remaining, 0);
      const over = cs.reduce((s, x) => s + x.over.length, 0);
      const nexts = cs.map(x => x.next).filter(Boolean).sort((a, b) => a.due.localeCompare(b.due));
      return { cu, n: cs.length, rem, over, next: nexts[0] };
    }).sort((a, b) => b.over - a.over || a.cu.name.localeCompare(b.cu.name, 'ar'));
  return `<div class="toolbar">
    <div class="search" style="width:340px;max-width:none">${ic('search')}<input id="custSearch" placeholder="فلترة العملاء" value="${esc(state.custFilter)}" style="padding-left:14px"></div>
    <span class="spacer"></span><button class="btn" data-act="exportCust">${ic('download')}Excel</button><button class="btn primary" data-act="newCust">${ic('plus')}عميل جديد</button>
  </div>
  <div class="table-wrap">${rows.length ? `<table><thead><tr><th>العميل</th><th>الموبايل</th><th>العقود</th><th>المتبقي عليه</th><th>القسط الجاي</th><th>الحالة</th></tr></thead><tbody>
  ${rows.map(r => `<tr class="click" data-act="cust" data-id="${r.cu.id}">
    <td><div style="display:flex;gap:12px;align-items:center"><div class="avatar">${esc(initials(r.cu.name))}</div><div class="strong">${esc(r.cu.name)}</div></div></td>
    <td dir="ltr" style="text-align:right">${esc(r.cu.phone)}</td><td>${r.n}</td><td class="num">${M(r.rem)}</td>
    <td>${r.next ? `${fmtD(r.next.due)}<div class="muted">${relDay(r.next.due)}</div>` : '—'}</td>
    <td>${r.over ? pill('over', `${r.over} متأخر`) : r.n && r.rem > 0 ? pill('active', 'منتظم') : r.n ? pill('done') : pill('later', 'من غير عقود')}</td>
  </tr>`).join('')}</tbody></table>` : `<div class="empty"><div class="big">${ic('users')}</div>مفيش عملاء ${q ? 'بالاسم ده' : 'لسه'}</div>`}</div>`;
}

function viewContracts() {
  const F = { active: ['شغّال', s => !s.done], late: ['عليه متأخرات', s => s.over.length > 0], done: ['خلص', s => s.done], all: ['الكل', () => true] };
  const all = DB.contracts.map(c => ({ c, s: cStats(c), cu: custOf(c) }));
  const list = all.filter(x => F[state.contractFilter][1](x.s)).sort((a, b) => b.c.date.localeCompare(a.c.date));
  return `<div class="toolbar">
    <div class="seg">${Object.entries(F).map(([k, [t, f]]) => `<button class="${state.contractFilter === k ? 'on' : ''}" data-cf2="${k}">${t}<span class="c">${all.filter(x => f(x.s)).length}</span></button>`).join('')}</div>
    <span class="spacer"></span><button class="btn" data-act="exportContracts">${ic('download')}Excel</button><button class="btn primary" data-act="newContract">${ic('plus')}عقد جديد</button>
  </div>
  <div class="table-wrap">${list.length ? `<table><thead><tr><th>العميل</th><th>الجهاز</th><th>تاريخ العقد</th><th>سعر التقسيط</th><th>المقدم</th><th>القسط</th><th>المدفوع</th><th style="width:180px">التقدم</th><th>المتبقي</th></tr></thead><tbody>
  ${list.map(({ c, s, cu }) => `<tr class="click" data-act="cust" data-id="${cu.id}">
    <td class="strong">${esc(cu.name)}</td><td>${esc(c.device)}${c.imei ? `<div class="muted" dir="ltr" style="text-align:right">${esc(c.imei)}</div>` : ''}</td>
    <td>${fmtShort(c.date)}</td><td class="num">${money(c.totalPrice)}</td><td>${money(c.downPayment)}</td>
    <td>${money(c.installments[0]?.amount || 0)} × ${c.installments.length}</td><td>${s.paidCount}/${c.installments.length}</td>
    <td><div class="progress"><i style="width:${s.pct}%"></i></div></td>
    <td>${s.done ? pill('done') : `<span class="num">${money(s.remaining)}</span>${s.over.length ? `<div>${pill('over', `${s.over.length} متأخر`)}</div>` : ''}`}</td>
  </tr>`).join('')}</tbody></table>` : `<div class="empty"><div class="big">${ic('phone')}</div>مفيش عقود</div>`}</div>`;
}

function monthKeys(n) {
  const out = []; const d = new Date(); d.setDate(1);
  for (let k = n - 1; k >= 0; k--) { const t = new Date(d.getFullYear(), d.getMonth() - k, 1); out.push(toStr(t).slice(0, 7)); }
  return out;
}
function viewReports() {
  const keys = monthKeys(6);
  state.reportMonth ||= todayStr().slice(0, 7);
  const data = keys.map(k => {
    const exp = DB.contracts.reduce((s, c) => s + c.installments.filter(i => i.due.startsWith(k)).reduce((a, i) => a + i.amount, 0), 0);
    const got = DB.contracts.reduce((s, c) => s + c.payments.filter(p => p.date.startsWith(k)).reduce((a, p) => a + p.amount, 0), 0);
    const downs = DB.contracts.filter(c => c.date.startsWith(k)).reduce((s, c) => s + c.downPayment, 0);
    return { k, exp, got, downs };
  });
  const mx = Math.max(1, ...data.map(d => Math.max(d.exp, d.got)));
  const sales = DB.contracts.reduce((s, c) => s + c.totalPrice, 0);
  const cash = DB.contracts.reduce((s, c) => s + (c.cashPrice || 0), 0);
  const outstanding = DB.contracts.reduce((s, c) => s + cStats(c).remaining, 0);
  const overAmt = DB.contracts.reduce((s, c) => s + cStats(c).overAmt, 0);
  const rm = state.reportMonth;
  const pays = [];
  DB.contracts.forEach(c => {
    const cu = custOf(c);
    if (c.date.startsWith(rm) && c.downPayment > 0) pays.push({ date: c.date, cu, c, amount: c.downPayment, note: 'مقدم' });
    c.payments.filter(p => p.date.startsWith(rm)).forEach(p => pays.push({ date: p.date, cu, c, amount: p.amount, note: p.note || `قسط ${p.alloc.map(a => a.n).join('، ')}` }));
  });
  pays.sort((a, b) => b.date.localeCompare(a.date));
  state._pays = pays;
  const label = (k) => { const [y, m] = k.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
  return `<div class="grid kpis">
    ${kpi('إجمالي مبيعات التقسيط', M(sales), `${DB.contracts.length} عقد`, 'var(--gold)')}
    ${kpi('مكسب الزيادة', M(sales - cash), 'الفرق بين سعر القسط والكاش', 'var(--green)')}
    ${kpi('الفلوس برّه', M(outstanding), 'لسه هتتحصّل', 'var(--gold)')}
    ${kpi('متأخرات', M(overAmt), 'عدّى ميعادها', 'var(--red)')}
  </div>
  <div class="grid row2">
    <div class="card"><h3>المتوقع مقابل المحصّل (آخر 6 شهور) <span class="legend"><span><i style="background:var(--surface2);border:1px solid var(--line2)"></i>المفروض</span><span><i style="background:var(--grad)"></i>اتحصّل</span></span></h3>
      <div class="bars">${data.map(d => `<div class="b" title="المفروض ${money(d.exp)} — اتحصّل ${money(d.got)}">
        <div class="col"><i class="exp" style="height:${d.exp / mx * 100}%"></i><i class="got" style="height:${d.got / mx * 100}%"></i></div>
        <div class="lb">${MONTHS[+d.k.split('-')[1] - 1]}</div></div>`).join('')}</div>
    </div>
    <div class="card"><h3>ملخص الشهر</h3>
      <div class="field" style="margin-bottom:14px"><select id="repMonth">${monthKeys(12).reverse().map(k => `<option value="${k}" ${k === rm ? 'selected' : ''}>${label(k)}</option>`).join('')}</select></div>
      <div class="list">
        <div class="li" style="cursor:default"><div class="meta">أقساط اتحصّلت</div><div class="amt">${M(pays.filter(p => p.note !== 'مقدم').reduce((s, p) => s + p.amount, 0))}</div></div>
        <div class="li" style="cursor:default"><div class="meta">مقدمات عقود جديدة</div><div class="amt">${M(pays.filter(p => p.note === 'مقدم').reduce((s, p) => s + p.amount, 0))}</div></div>
        <div class="li" style="cursor:default"><div class="meta">عقود جديدة</div><div class="amt">${DB.contracts.filter(c => c.date.startsWith(rm)).length}</div></div>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:16px;padding:0">
    <h3 style="padding:18px 20px 0">حركة التحصيل في ${label(rm)} <button class="btn sm" data-act="exportPays">${ic('download')}Excel</button></h3>
    ${pays.length ? `<table><thead><tr><th>التاريخ</th><th>العميل</th><th>الجهاز</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>
    ${pays.map(p => `<tr class="click" data-act="cust" data-id="${p.cu.id}"><td>${fmtD(p.date)}</td><td class="strong">${esc(p.cu.name)}</td><td>${esc(p.c.device)}</td><td>${esc(p.note)}</td><td class="num">${M(p.amount)}</td></tr>`).join('')}
    </tbody></table>` : `<div class="empty">مفيش حركة في الشهر ده</div>`}
  </div>`;
}

function viewSettings() {
  const s = DB.settings;
  return `<div class="settings-grid">
  <div class="card"><h3>بيانات المحل</h3><div class="form">
    <div class="field full"><label>اسم المحل</label><input data-set="shopName" value="${esc(s.shopName)}"></div>
    <div class="field"><label>رقم المحل (واتساب)</label><input data-set="shopPhone" value="${esc(s.shopPhone)}" dir="ltr" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>العملة</label><input data-set="currency" value="${esc(s.currency)}"></div>
  </div></div>
  <div class="card"><h3>الأقساط والتنبيهات</h3><div class="form">
    <div class="field"><label>نبّهني قبل القسط بـ (أيام)</label><input type="number" min="0" max="30" data-set="remindDays" value="${s.remindDays}"></div>
    <div class="field"><label>تقريب القسط الشهري لأقرب</label><select data-set="roundTo">${[1, 5, 10, 50, 100].map(v => `<option value="${v}" ${+s.roundTo === v ? 'selected' : ''}>${v} ${esc(s.currency)}</option>`).join('')}</select></div>
    <div class="full switch"><div><b>يفتح مع تشغيل الويندوز</b><div class="hint">عشان التنبيهات تظهر أول ما الجهاز يفتح</div></div><input type="checkbox" id="autoStart" ${s.autoStart ? 'checked' : ''}></div>
  </div></div>
  <div class="card" style="grid-column:1/-1"><h3>الرسايل والتذكير</h3>
    <div class="settings-grid" style="gap:22px">
      <div>
        <div class="field"><label>أيام التذكير في الشهر</label></div>
        <div class="days" id="dayPicker">${Array.from({ length: 31 }, (_, i) => i + 1).map(d => `<button type="button" data-day="${d}" class="${(s.reminderDays || []).includes(d) ? 'on' : ''}">${d}</button>`).join('')}</div>
        <div class="hint">في الأيام دي البرنامج بيجهّز رسالة تذكير لكل عميل عليه قسط الشهر ده، ورسالة "برجاء السداد" لأي حد عليه متأخرات. لو اخترت يوم 31 والشهر 30 يوم، هتتجهّز آخر يوم في الشهر.</div>
      </div>
      <div>
        <div class="switch"><div><b>إيصال بعد كل تحصيل</b><div class="hint">بعد ما تأكّد الدفع يظهرلك الإيصال جاهز تبعته</div></div><input type="checkbox" data-flag="autoReceipt" ${s.autoReceipt !== false ? 'checked' : ''}></div>
        <div class="switch"><div><b>تذكير قبل ميعاد القسط بـ ${s.remindDays} أيام</b><div class="hint">عدد الأيام بيتغيّر من "الأقساط والتنبيهات"</div></div><input type="checkbox" data-flag="remindBefore" ${s.remindBefore ? 'checked' : ''}></div>
        <div class="switch"><div><b>رسالة لما القسط يتأخر يوم</b><div class="hint">تتجهّز تاني يوم الميعاد لو مااتدفعش</div></div><input type="checkbox" data-flag="remindLate" ${s.remindLate ? 'checked' : ''}></div>
        <div class="field" style="margin-top:10px"><label>الرسايل تتفتح في</label><select data-set="waMode">
          <option value="app" ${(s.waMode || 'app') === 'app' ? 'selected' : ''}>تطبيق واتساب على الكمبيوتر</option>
          <option value="web" ${s.waMode === 'web' ? 'selected' : ''}>واتساب ويب (المتصفح)</option>
          <option value="link" ${s.waMode === 'link' ? 'selected' : ''}>لينك wa.me</option></select>
          <div class="hint">الرسايل بتتبعت من رقم الواتساب المتسجّل على الكمبيوتر ده، فسجّل عليه رقم المحل.</div></div>
      </div>
    </div>
    <div class="form form3" style="margin-top:18px">
      ${['receipt', 'reminder', 'overdue'].map(k => `<div class="field"><label>${MSG_T[k][1]} <button class="btn sm ghost" data-act="tplReset" data-k="${k}" style="padding:2px 8px;margin-inline-start:6px">الأصلي</button></label><textarea data-tpl="${k}" rows="11">${esc(tplOf(k))}</textarea></div>`).join('')}
    </div>
    <div class="hint" style="display:block">الكلمات اللي بين القوسين بتتبدّل لوحدها: ${Object.keys(AR_KEYS).map(k => `{${k}}`).join('  ')}<br>أي سطر قيمته فاضية بيتشال لوحده، زي سطر اللينك لو موقع العملاء لسه مش متظبط.</div>
  </div>
  <div class="card" style="grid-column:1/-1"><h3>الربط بالسحابة وموقع العملاء</h3>
    <ol class="steps">
      <li>اعمل مشروع على <b>supabase.com</b>، وافتح <b>SQL Editor</b> والصق ملف <b>setup.sql</b> ودوس Run، وانسخ <b>مفتاح المزامنة</b> اللي هيطلع.</li>
      <li>من <b>Project Settings ← API</b> انسخ <b>Project URL</b> و <b>anon public key</b>.</li>
      <li>حط التلاتة هنا ودوس <b>اختبار الاتصال</b>. بعد كده كل تعديل بيترفع لوحده أول ما يكون فيه نت.</li>
    </ol>
    <div class="form">
      <div class="field"><label>Project URL</label><input data-set="cloudUrl" dir="ltr" placeholder="https://xxxx.supabase.co" value="${esc(s.cloudUrl)}"></div>
      <div class="field"><label>anon public key</label><input data-set="cloudAnon" dir="ltr" type="password" placeholder="eyJhbGciOi..." value="${esc(s.cloudAnon)}"></div>
      <div class="field"><label>مفتاح المزامنة (سري)</label><input data-set="syncKey" dir="ltr" type="password" value="${esc(s.syncKey)}"></div>
      <div class="field"><label>لينك موقع العملاء</label><input data-set="portalUrl" dir="ltr" placeholder="https://nouby.netlify.app" value="${esc(s.portalUrl)}"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
      <button class="btn primary" data-act="cloudTest">${ic('zap')}اختبار الاتصال</button>
      <button class="btn" data-act="cloudSync">${ic('upload')}ارفع دلوقتي</button>
      <button class="btn ghost" data-act="cloudPull">${ic('download')}استرجاع من السحابة</button>
    </div>
    <div class="cloud-status" id="cloudStatus">${syncText(state.sync)}</div>
  </div>
  <div class="card" style="grid-column:1/-1"><h3>النسخ الاحتياطي</h3>
    <p style="color:var(--muted);margin-bottom:14px">السيستم بيعمل نسخة احتياطية أوتوماتيك كل يوم على الجهاز (آخر 30 يوم). وكمان تقدر تاخد نسخة على فلاشة.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" data-act="backup">${ic('download')}حفظ نسخة احتياطية</button>
      <button class="btn" data-act="restore">${ic('upload')}استرجاع نسخة</button>
      <button class="btn ghost" data-act="dataFolder">${ic('folder')}فتح فولدر البيانات</button>
    </div>
  </div></div>`;
}
function bindSettings() {
  $$('[data-set]').forEach(el => el.addEventListener('change', async () => {
    let v = el.tagName === 'TEXTAREA' ? el.value : el.value.trim();
    if (el.type === 'number' || el.dataset.set === 'roundTo') v = +v;
    DB.settings[el.dataset.set] = v;
    await save(); toast('اتحفظ'); if (el.dataset.set === 'shopName') $('#brandName').textContent = v.split(' ')[0];
  }));
  $$('[data-flag]').forEach(el => el.addEventListener('change', async () => { DB.settings[el.dataset.flag] = el.checked; await save(); toast('اتحفظ'); }));
  $$('[data-tpl]').forEach(el => el.addEventListener('change', async () => { DB.settings.tpl ||= {}; DB.settings.tpl[el.dataset.tpl] = el.value; await save(); toast('الرسالة اتحفظت'); }));
  $$('#dayPicker [data-day]').forEach(b => b.addEventListener('click', async () => {
    const d = +b.dataset.day; const set = new Set(DB.settings.reminderDays || []);
    set.has(d) ? set.delete(d) : set.add(d); DB.settings.reminderDays = [...set].sort((a, c) => a - c);
    b.classList.toggle('on'); await save(); if (generateReminders()) { await save(); } updateBadge();
  }));
  $('#autoStart').addEventListener('change', async (e) => {
    DB.settings.autoStart = e.target.checked; await window.api.autostart(e.target.checked); await save(); toast('اتحفظ');
  });
}

// ======================= Customer drawer =======================
function openCustomer(id) {
  const cu = DB.customers.find(x => x.id === id); if (!cu) return;
  const cs = contractsOf(id).sort((a, b) => b.date.localeCompare(a.date));
  const totRem = cs.reduce((s, c) => s + cStats(c).remaining, 0);
  const info = [['الموبايل', cu.phone], ['موبايل تاني', cu.phone2], ['الرقم القومي', cu.nationalId], ['العنوان', cu.address], ['الضامن', cu.guarantorName], ['موبايل الضامن', cu.guarantorPhone]].filter(x => x[1]);
  $('#drawer').innerHTML = `
  <div class="d-head">
    <div class="avatar">${esc(initials(cu.name))}</div>
    <div style="flex:1"><h2>${esc(cu.name)}</h2><div class="sub"><span dir="ltr">${esc(cu.phone)}</span><span>${cs.length} عقد</span><span>متبقي: <b style="color:var(--text)">${money(totRem)}</b> ${esc(cur())}</span></div></div>
    ${DB.settings.portalUrl ? `<button class="btn sm wa" data-act="portalLink" data-id="${cu.id}" title="ابعتله لينك يتابع منه حسابه">${ic('link')}لينك الحساب</button>` : ''}
    <button class="btn sm" data-act="editCust" data-id="${cu.id}">${ic('edit')}تعديل</button>
    <button class="x" data-act="closeDrawer">×</button>
  </div>
  <div class="d-body">
    ${info.length ? `<div class="info-grid">${info.map(([t, v]) => `<div class="i"><div class="t">${t}</div><div class="v">${esc(v)}</div></div>`).join('')}</div>` : ''}
    ${DB.settings.portalUrl && !nidOk(cu) ? `<div class="warn-line">العميل ده مش هيقدر يدخل موقع الحسابات لأن رقمه القومي مش متسجّل. دوس تعديل وضيفه.</div>` : ''}
    ${cu.notes ? `<div class="card" style="padding:14px"><b>ملاحظات:</b> <span style="color:var(--muted)">${esc(cu.notes)}</span></div>` : ''}
    <div style="display:flex;gap:10px"><button class="btn primary" data-act="newContract" data-cust="${cu.id}">${ic('plus')}عقد قسط جديد للعميل</button><span style="flex:1"></span><button class="btn sm danger" data-act="delCust" data-id="${cu.id}">${ic('trash')}حذف العميل</button></div>
    ${cs.map(contractCard).join('') || `<div class="empty card">العميل ده ملوش عقود لسه</div>`}
  </div>`;
  $('#drawerBack').classList.add('open');
}
function contractCard(c) {
  const s = cStats(c);
  return `<div class="contract-card">
    <div class="cc-head">
      <div class="devic">${ic('phone')}</div>
      <div style="flex:1"><div class="dev">${esc(c.device)}</div><div class="sub">عقد ${fmtD(c.date)}${c.imei ? ` · IMEI <span dir="ltr">${esc(c.imei)}</span>` : ''}</div></div>
      ${s.done ? pill('done', 'خلص') : s.over.length ? pill('over', `${s.over.length} متأخر`) : pill('active', 'منتظم')}
    </div>
    <div class="cc-stats">
      <div><div class="t">سعر التقسيط</div><div class="v">${money(c.totalPrice)}</div></div>
      <div><div class="t">المقدم</div><div class="v">${money(c.downPayment)}</div></div>
      <div><div class="t">اتدفع لحد دلوقتي</div><div class="v" style="color:var(--green)">${money(s.collected)}</div></div>
      <div><div class="t">المتبقي</div><div class="v" style="color:var(--gold)">${money(s.remaining)}</div></div>
    </div>
    <div style="padding:10px 18px"><div class="progress"><i style="width:${s.pct}%"></i></div></div>
    <table class="sched"><thead><tr><th>#</th><th>الميعاد</th><th>القسط</th><th>المدفوع</th><th>الحالة</th></tr></thead><tbody>
      ${c.installments.map(i => { const st = instState(i); return `<tr><td>${i.n}</td><td>${fmtD(i.due)}${st !== 'paid' && st !== 'later' ? ` <span class="muted">· ${relDay(i.due)}</span>` : ''}</td><td class="num">${money(i.amount)}</td><td>${money(i.paid)}</td><td>${pill(st)}</td></tr>`; }).join('')}
    </tbody></table>
    ${c.payments.length ? `<div style="padding:12px 18px;border-top:1px solid var(--line)"><div style="font-weight:700;margin-bottom:8px">سجل المدفوعات</div>
      ${c.payments.slice().reverse().map(p => `<div style="display:flex;gap:10px;align-items:center;padding:5px 0;font-size:13.5px"><span style="color:var(--muted);width:120px">${fmtD(p.date)}</span><b>${money(p.amount)}</b><span style="color:var(--muted);flex:1">${esc(p.note || `قسط ${p.alloc.map(a => a.n).join('، ')}`)}</span><button class="btn sm ghost" data-act="receiptAgain" data-cid="${c.id}" data-pid="${p.id}" title="الإيصال">${ic('receipt')}</button><button class="btn sm ghost" data-act="undoPay" data-cid="${c.id}" data-pid="${p.id}" title="إلغاء الدفعة">${ic('undo')}إلغاء</button></div>`).join('')}
    </div>` : ''}
    ${c.notes ? `<div style="padding:10px 18px;color:var(--muted);border-top:1px solid var(--line)">${esc(c.notes)}</div>` : ''}
    <div class="cc-actions">
      ${s.done ? '' : `<button class="btn green" data-act="pay" data-cid="${c.id}">${ic('cash')}تحصيل قسط</button><button class="btn wa" data-act="wa" data-cid="${c.id}">${ic('wa')}تذكير واتساب</button>`}
      <button class="btn" data-act="print" data-cid="${c.id}">${ic('print')}طباعة كشف</button>
      <span style="flex:1"></span>
      <button class="btn sm danger" data-act="delContract" data-cid="${c.id}">${ic('trash')}حذف العقد</button>
    </div>
  </div>`;
}
function closeDrawer() { $('#drawerBack').classList.remove('open'); }
function refresh() { render(); updateBadge(); const open = $('#drawerBack').classList.contains('open'); if (open && state.drawerCust) openCustomer(state.drawerCust); }

// ======================= Forms =======================
function customerForm(cu = {}) {
  const f = (k, label, req, attrs = '') => `<div class="field ${attrs.includes('full') ? 'full' : ''}"><label>${label}${req ? ' <span class="req">*</span>' : ''}</label><input name="${k}" value="${esc(cu[k] || '')}" ${attrs.replace('full', '')}></div>`;
  openModal(`
  <div class="m-head"><h2>${cu.id ? 'تعديل بيانات العميل' : 'عميل جديد'}</h2><button class="x" data-act="closeModal">×</button></div>
  <form class="m-body" id="custForm"><div class="form">
    ${f('name', 'اسم العميل', 1, 'autofocus full')}
    ${f('phone', 'رقم الموبايل', 1, 'dir="ltr" inputmode="tel" placeholder="01xxxxxxxxx"')}
    ${f('phone2', 'موبايل تاني', 0, 'dir="ltr"')}
    <div class="field"><label>الرقم القومي</label><input name="nationalId" value="${esc(cu.nationalId || '')}" dir="ltr" maxlength="14" inputmode="numeric"><div class="hint">آخر 4 أرقام منه = كود دخول العميل على الموقع</div></div>
    ${f('address', 'العنوان', 0)}
    <div class="section-t">الضامن (اختياري)</div>
    ${f('guarantorName', 'اسم الضامن', 0)}
    ${f('guarantorPhone', 'موبايل الضامن', 0, 'dir="ltr"')}
    <div class="field full"><label>ملاحظات</label><textarea name="notes">${esc(cu.notes || '')}</textarea></div>
  </div></form>
  <div class="m-foot"><button class="btn primary" id="saveCust">${cu.id ? 'حفظ التعديل' : 'حفظ العميل'}</button>${cu.id ? '' : '<button class="btn" id="saveCustContract">حفظ وعمل عقد قسط</button>'}<button class="btn ghost" data-act="closeModal">إلغاء</button></div>`);
  const submit = async (thenContract) => {
    const fd = Object.fromEntries(new FormData($('#custForm')));
    Object.keys(fd).forEach(k => fd[k] = fd[k].trim());
    let bad = false;
    $$('#custForm input').forEach(i => i.classList.remove('err'));
    if (!fd.name) { $('[name=name]').classList.add('err'); bad = true; }
    if (telDigits(fd.phone).length < 10) { $('[name=phone]').classList.add('err'); bad = true; }
    if (bad) return toast('اكتب الاسم ورقم موبايل صحيح', 'bad');
    if (fd.nationalId && telDigits(fd.nationalId).length !== 14) { $('[name=nationalId]').classList.add('err'); return toast('الرقم القومي لازم يكون 14 رقم', 'bad'); }
    const dup = DB.customers.find(x => x.id !== cu.id && telDigits(x.phone) === telDigits(fd.phone));
    if (dup && !(await confirmBox('رقم متكرر', `الرقم ده متسجل للعميل <b>${esc(dup.name)}</b>. تكمّل برضه؟`, 'كمّل', false))) return;
    let id = cu.id;
    if (id) Object.assign(DB.customers.find(x => x.id === id), fd);
    else { id = uid(); DB.customers.push({ id, ...fd, createdAt: todayStr() }); }
    await save(); closeModal(); toast(cu.id ? 'اتعدّل' : 'العميل اتضاف');
    state.drawerCust = id; refresh();
    if (thenContract) contractForm(id);
    else if (!cu.id) openCustomer(id);
  };
  $('#saveCust').onclick = () => submit(false);
  const sc = $('#saveCustContract'); if (sc) sc.onclick = () => submit(true);
  $('#custForm').onsubmit = (e) => { e.preventDefault(); submit(false); };
}

function contractForm(custId) {
  if (!DB.customers.length) { toast('ضيف عميل الأول', 'bad'); return customerForm(); }
  const t = todayStr();
  openModal(`
  <div class="m-head"><h2>عقد قسط جديد</h2><button class="x" data-act="closeModal">×</button></div>
  <form class="m-body" id="cForm"><div class="form form3">
    <div class="field full"><label>العميل <span class="req">*</span></label>
      <select name="customerId">${DB.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar')).map(c => `<option value="${c.id}" ${c.id === custId ? 'selected' : ''}>${esc(c.name)} — ${esc(c.phone)}</option>`).join('')}</select></div>
    <div class="section-t">الجهاز</div>
    <div class="field" style="grid-column:span 2"><label>نوع الموبايل <span class="req">*</span></label><input name="device" placeholder="مثلاً: iPhone 15 Pro 256GB" autofocus></div>
    <div class="field"><label>IMEI / السيريال</label><input name="imei" dir="ltr"></div>
    <div class="section-t">الحساب</div>
    <div class="field"><label>سعر الكاش <span class="req">*</span></label><input name="cashPrice" type="number" min="0" step="any"></div>
    <div class="field"><label>نسبة زيادة التقسيط %</label><input name="interestPct" type="number" min="0" step="any" value="0"></div>
    <div class="field"><label>سعر التقسيط الإجمالي</label><input name="totalPrice" type="number" min="0" step="any"><div class="hint">بيتحسب لوحده، وتقدر تكتبه بإيدك</div></div>
    <div class="field"><label>المقدم المدفوع</label><input name="downPayment" type="number" min="0" step="any" value="0"></div>
    <div class="field"><label>عدد الشهور <span class="req">*</span></label><input name="months" type="number" min="1" max="60" value="10"></div>
    <div class="field"><label>تاريخ أول قسط</label><input name="firstDate" type="date" value="${addMonths(t, 1)}"></div>
    <div class="field"><label>تاريخ العقد</label><input name="date" type="date" value="${t}"></div>
    <div class="field" style="grid-column:span 2"><label>ملاحظات</label><input name="notes"></div>
    <div class="calc" id="calc"></div>
    <div class="sched-mini" id="schedMini"></div>
  </div></form>
  <div class="m-foot"><button class="btn primary" id="saveContract">حفظ العقد</button><button class="btn ghost" data-act="closeModal">إلغاء</button></div>`, 'wide');
  const form = $('#cForm');
  const g = (n) => form.elements[n];
  const read = () => ({
    cash: +g('cashPrice').value || 0, pct: +g('interestPct').value || 0, total: +g('totalPrice').value || 0,
    down: +g('downPayment').value || 0, months: parseInt(g('months').value) || 0, firstDate: g('firstDate').value || addMonths(t, 1)
  });
  const recalc = (src) => {
    const v = read();
    if (src === 'total') { if (v.cash) g('interestPct').value = round2((v.total / v.cash - 1) * 100); }
    else if (src === 'cashPrice' || src === 'interestPct') g('totalPrice').value = v.cash ? round2(v.cash * (1 + v.pct / 100)) : '';
    const x = read();
    const sched = x.total > 0 && x.months > 0 ? buildSchedule({ total: x.total, down: x.down, months: x.months, firstDate: x.firstDate, roundTo: DB.settings.roundTo }) : [];
    const rem = Math.max(0, x.total - x.down);
    $('#calc').innerHTML = `
      <div class="c-item"><div class="t">الباقي بعد المقدم</div><div class="v">${money(rem)}</div></div>
      <div class="c-item hl"><div class="t">القسط الشهري</div><div class="v">${money(sched[0]?.amount || 0)}</div></div>
      <div class="c-item"><div class="t">آخر قسط</div><div class="v">${money(sched.at(-1)?.amount || 0)}</div></div>
      <div class="c-item"><div class="t">مكسب الزيادة</div><div class="v" style="color:var(--green)">${money(Math.max(0, x.total - x.cash))}</div></div>`;
    $('#schedMini').innerHTML = sched.map(i => `<span>${i.n}. ${fmtShort(i.due)} — <b>${money(i.amount)}</b></span>`).join('');
  };
  ['cashPrice', 'interestPct', 'totalPrice', 'downPayment', 'months', 'firstDate'].forEach(n =>
    g(n).addEventListener('input', () => recalc(n === 'totalPrice' ? 'total' : ['cashPrice', 'interestPct'].includes(n) ? n : 'other')));
  recalc('other');
  form.onsubmit = (e) => { e.preventDefault(); $('#saveContract').click(); };
  $('#saveContract').onclick = async () => {
    const v = read();
    const errs = [];
    if (!g('device').value.trim()) errs.push('device');
    if (v.cash <= 0) errs.push('cashPrice');
    if (v.total <= 0) errs.push('totalPrice');
    if (v.months < 1) errs.push('months');
    if (v.down > v.total) errs.push('downPayment');
    $$('#cForm input').forEach(i => i.classList.toggle('err', errs.includes(i.name)));
    if (errs.length) return toast(errs.includes('downPayment') ? 'المقدم أكبر من سعر التقسيط' : 'كمّل البيانات المطلوبة', 'bad');
    const c = {
      id: uid(), customerId: g('customerId').value, device: g('device').value.trim(), imei: g('imei').value.trim(),
      cashPrice: round2(v.cash), interestPct: round2(+g('interestPct').value || 0), totalPrice: round2(v.total), downPayment: round2(v.down),
      date: g('date').value || t, notes: g('notes').value.trim(),
      installments: buildSchedule({ total: v.total, down: v.down, months: v.months, firstDate: v.firstDate, roundTo: DB.settings.roundTo }),
      payments: [], createdAt: new Date().toISOString()
    };
    DB.contracts.push(c);
    await save(); closeModal(); toast('العقد اتسجّل والأقساط اتقسّمت');
    state.drawerCust = c.customerId; refresh(); openCustomer(c.customerId);
  };
}

function payForm(cid) {
  const c = DB.contracts.find(x => x.id === cid); if (!c) return;
  const s = cStats(c); const cu = custOf(c);
  const nextAmt = s.next ? round2(s.next.amount - s.next.paid) : 0;
  openModal(`
  <div class="m-head"><h2>تحصيل — ${esc(cu.name)}</h2><button class="x" data-act="closeModal">×</button></div>
  <div class="m-body">
    <div class="calc" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">
      <div class="c-item"><div class="t">الجهاز</div><div class="v" style="font-size:15px">${esc(c.device)}</div></div>
      <div class="c-item"><div class="t">القسط الجاي</div><div class="v">${s.next ? `${money(nextAmt)}` : '—'}</div><div class="t">${s.next ? fmtD(s.next.due) : ''}</div></div>
      <div class="c-item hl"><div class="t">إجمالي المتبقي</div><div class="v">${money(s.remaining)}</div></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <button class="btn sm" data-q="${nextAmt}">قسط واحد (${money(nextAmt)})</button>
      ${s.overAmt > 0 ? `<button class="btn sm" data-q="${s.overAmt}">كل المتأخر (${money(s.overAmt)})</button>` : ''}
      <button class="btn sm" data-q="${s.remaining}">سداد الكل (${money(s.remaining)})</button>
    </div>
    <div class="form">
      <div class="field"><label>المبلغ المدفوع</label><input id="pAmt" type="number" step="any" value="${nextAmt}" autofocus></div>
      <div class="field"><label>تاريخ الدفع</label><input id="pDate" type="date" value="${todayStr()}"></div>
      <div class="field full"><label>ملاحظة</label><input id="pNote" placeholder="اختياري"></div>
    </div>
  </div>
  <div class="m-foot"><button class="btn primary" id="doPay">${ic('check')}تأكيد التحصيل</button><button class="btn ghost" data-act="closeModal">إلغاء</button></div>`, 'sm');
  $$('#modal [data-q]').forEach(b => b.onclick = () => { $('#pAmt').value = b.dataset.q; $('#pAmt').focus(); });
  const go = async () => {
    try {
      const amt = +$('#pAmt').value;
      const p = applyPayment(c, amt, $('#pDate').value || todayStr(), $('#pNote').value.trim());
      // customer just paid: older reminders for this contract are no longer needed
      (DB.messages || []).forEach(m => { if (m.contractId === c.id && m.status === 'pending' && m.type !== 'receipt') m.status = 'skipped'; });
      let rm = null;
      if (DB.settings.autoReceipt !== false) rm = newMsg('receipt', c, { key: `receipt:${p.id}`, text: receiptText(c, p) });
      await save(); refresh();
      showReceipt(c, p, rm);
    } catch (e) { toast(e.message, 'bad'); }
  };
  $('#doPay').onclick = go;
  $('#pAmt').onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

function receiptText(c, p) {
  return fillTpl(tplOf('receipt'), msgVars(c, { paid: money(p.amount), payDate: fmtD(p.date) }));
}
function showReceipt(c, p, m) {
  const cu = custOf(c), s = cStats(c);
  openModal(`
  <div class="receipt">
    <div class="ok"><svg class="i" viewBox="0 0 24 24">${ICONS.check}</svg></div>
    <h2>اتحصّل من ${esc(cu.name)}</h2>
    <div class="big">${money(p.amount)} <small>${esc(cur())}</small></div>
    <div style="color:var(--muted);font-size:13.5px">${fmtD(p.date)}</div>
    <div class="rc-lines">
      <div><span>الجهاز</span><b>${esc(c.device)}</b></div>
      <div><span>إجمالي اللي دفعه</span><b>${money(s.collected)}</b></div>
      <div><span>المتبقي عليه</span><b style="color:var(--gold)">${money(s.remaining)}</b></div>
      <div><span>القسط الجاي</span><b>${s.done ? 'خلّص كل الأقساط 🎉' : `${money(s.next.amount - s.next.paid)} يوم ${fmtD(s.next.due)}`}</b></div>
    </div>
  </div>
  <div class="m-foot">
    <button class="btn wa" id="rcSend">${ic('wa')}ابعت الإيصال واتساب</button>
    <button class="btn" id="rcPrint">${ic('print')}اطبع</button>
    <span style="flex:1"></span>
    <button class="btn ghost" data-act="closeModal" title="${m ? 'هيفضل مستني في صفحة الرسايل' : ''}">${m ? 'بعدين' : 'تمام'}</button>
  </div>`, 'sm');
  $('#rcSend').onclick = async () => {
    const msg = m || newMsg('receipt', c, { key: `receipt:${p.id}:${Date.now()}`, text: receiptText(c, p) });
    closeModal(); await sendMsg(msg); toast('الإيصال اتفتح في الواتساب'); refresh();
  };
  $('#rcPrint').onclick = () => printReceipt(c, p);
}
function printReceipt(c, p) {
  const cu = custOf(c), s = cStats(c);
  const pa = $('#printArea'); pa.className = 'small';
  pa.innerHTML = `<h1>${esc(DB.settings.shopName)}</h1><div class="pmeta">إيصال استلام نقدية${DB.settings.shopPhone ? `<br>ت: ${esc(DB.settings.shopPhone)}` : ''}</div>
    <table><tr><th>العميل</th><td>${esc(cu.name)}</td></tr><tr><th>الجهاز</th><td>${esc(c.device)}</td></tr>
    <tr><th>المبلغ</th><td><b>${money(p.amount)} ${esc(cur())}</b></td></tr><tr><th>التاريخ</th><td>${fmtD(p.date)}</td></tr>
    <tr><th>إجمالي المدفوع</th><td>${money(s.collected)}</td></tr><tr><th>المتبقي</th><td>${money(s.remaining)}</td></tr>
    ${s.next ? `<tr><th>القسط الجاي</th><td>${money(s.next.amount - s.next.paid)} يوم ${fmtD(s.next.due)}</td></tr>` : ''}</table>
    <div class="sig" style="margin-top:28px"><span>توقيع المستلم: ..............</span></div>`;
  window.api.print();
}

// ======================= Messages page =======================
function msgCard(m) {
  const c = msgContract(m), cu = custOf(c), [cls, lbl] = MSG_T[m.type];
  const when = m.status === 'sent' ? `اتبعتت ${timeAgo(m.sentAt)}` : m.status === 'skipped' ? 'اتلغت' : `اتجهّزت ${timeAgo(m.createdAt)}`;
  return `<div class="card msg ${m.status}">
    <div class="mh"><div class="avatar">${esc(initials(cu.name))}</div>
      <div class="meta"><div class="name">${esc(cu.name)}</div><div class="sub" dir="ltr" style="text-align:right">${esc(cu.phone)}</div></div>
      <span class="pill ${cls}">${lbl}</span></div>
    <div class="bubble">${esc(msgText(m))}</div>
    <div class="mf">
      ${m.status === 'pending' ? `<button class="btn sm wa" data-act="msgSend" data-id="${m.id}">${ic('send')}ابعت</button>
        <button class="btn sm" data-act="msgEdit" data-id="${m.id}">${ic('edit')}تعديل</button>
        <button class="btn sm ghost" data-act="msgSkip" data-id="${m.id}" title="مش هبعتها">${ic('skip')}</button>`
      : `<button class="btn sm" data-act="msgSend" data-id="${m.id}">${ic('send')}ابعت تاني</button>`}
      <span class="when">${when}</span>
    </div>
  </div>`;
}
function viewMessages() {
  const all = (DB.messages || []).filter(m => msgContract(m));
  const F = { pending: 'مستنية تتبعت', sent: 'اتبعتت', skipped: 'اتلغت' };
  state.msgFilter ||= 'pending';
  let list = all.filter(m => m.status === state.msgFilter);
  list = state.msgFilter === 'pending' ? list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : list.sort((a, b) => (b.sentAt || b.createdAt).localeCompare(a.sentAt || a.createdAt)).slice(0, 120);
  const pend = all.filter(m => m.status === 'pending').length;
  const days = (DB.settings.reminderDays || []);
  return `<div class="toolbar">
    <div class="seg">${Object.entries(F).map(([k, t]) => `<button class="${state.msgFilter === k ? 'on' : ''}" data-mf="${k}">${t}<span class="c">${all.filter(m => m.status === k).length}</span></button>`).join('')}</div>
    <span class="spacer"></span>
    <span style="color:var(--muted);font-size:13px">${days.length ? `التذكير يوم ${days.join(' و ')} من كل شهر` : 'مفيش أيام تذكير متحددة'}</span>
    <button class="btn" data-go="settings">${ic('calendar')}أيام التذكير</button>
    ${pend ? `<button class="btn primary" data-act="msgNext">${ic('send')}ابعت اللي عليه الدور (${pend})</button>` : ''}
  </div>
  ${list.length ? `<div class="msg-grid">${list.map(msgCard).join('')}</div>`
    : `<div class="card"><div class="empty"><div class="big">${ic('message')}</div>${state.msgFilter === 'pending'
      ? `مفيش رسايل مستنية.<br>الرسايل بتتجهّز لوحدها بعد كل تحصيل، وفي أيام التذكير اللي بتختارها من الإعدادات.` : 'مفيش رسايل هنا'}</div></div>`}`;
}
function editMsg(m) {
  openModal(`<div class="m-head"><h2>تعديل الرسالة</h2><button class="x" data-act="closeModal">×</button></div>
    <div class="m-body"><div class="field"><textarea id="msgTxt" rows="12">${esc(msgText(m))}</textarea></div></div>
    <div class="m-foot"><button class="btn wa" id="msgSaveSend">${ic('send')}احفظ وابعت</button><button class="btn" id="msgSave">احفظ</button><button class="btn ghost" data-act="closeModal">إلغاء</button></div>`, 'sm');
  $('#msgSave').onclick = async () => { m.text = $('#msgTxt').value.trim(); await save(); closeModal(); render(); toast('الرسالة اتحفظت'); };
  $('#msgSaveSend').onclick = async () => { m.text = $('#msgTxt').value.trim(); closeModal(); await sendMsg(m); };
}

// ======================= Print =======================
function printContract(cid) {
  const c = DB.contracts.find(x => x.id === cid); const cu = custOf(c); const s = cStats(c);
  $('#printArea').className = '';
  $('#printArea').innerHTML = `
    <h1>${esc(DB.settings.shopName)} — كشف حساب أقساط</h1>
    <div class="pmeta">${DB.settings.shopPhone ? `ت: ${esc(DB.settings.shopPhone)} · ` : ''}تاريخ الطباعة: ${fmtD(todayStr())}</div>
    <table style="margin-bottom:14px"><tr><th>العميل</th><td>${esc(cu.name)}</td><th>الموبايل</th><td>${esc(cu.phone)}</td></tr>
    <tr><th>الرقم القومي</th><td>${esc(cu.nationalId || '—')}</td><th>العنوان</th><td>${esc(cu.address || '—')}</td></tr>
    <tr><th>الجهاز</th><td>${esc(c.device)}</td><th>IMEI</th><td>${esc(c.imei || '—')}</td></tr>
    <tr><th>تاريخ العقد</th><td>${fmtD(c.date)}</td><th>سعر التقسيط</th><td>${money(c.totalPrice)} ${esc(cur())}</td></tr>
    <tr><th>المقدم</th><td>${money(c.downPayment)}</td><th>المتبقي</th><td>${money(s.remaining)} ${esc(cur())}</td></tr>
    ${cu.guarantorName ? `<tr><th>الضامن</th><td>${esc(cu.guarantorName)}</td><th>موبايل الضامن</th><td>${esc(cu.guarantorPhone || '—')}</td></tr>` : ''}</table>
    <table><thead><tr><th>#</th><th>الميعاد</th><th>القسط</th><th>المدفوع</th><th>تاريخ السداد</th><th>الحالة</th></tr></thead><tbody>
    ${c.installments.map(i => `<tr><td>${i.n}</td><td>${fmtD(i.due)}</td><td>${money(i.amount)}</td><td>${money(i.paid)}</td><td>${i.paidAt ? fmtD(i.paidAt) : ''}</td><td>${PILL[instState(i)][1]}</td></tr>`).join('')}
    </tbody></table>
    <div class="sig"><span>توقيع العميل: ................................</span><span>توقيع المحل: ................................</span></div>`;
  window.api.print();
}

// ======================= CSV export =======================
const csvRow = (a) => a.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
function exportCsv(name, head, rows) { window.api.exportCsv(name, [csvRow(head), ...rows.map(csvRow)].join('\r\n')).then(ok => ok && toast('اتصدّر')); }

// ======================= Notifications =======================
function checkReminders(force) {
  const items = dueItems();
  const over = items.filter(x => x.st === 'over'), today = items.filter(x => x.st === 'today'), soon = items.filter(x => x.st === 'soon');
  updateBadge();
  let key = 'nouby-notified';
  let last = null; try { last = localStorage.getItem(key); } catch {}
  if (!force && last === todayStr()) return;
  const pm = pendingMsgs().length;
  if (!over.length && !today.length && !soon.length && !pm) return;
  const parts = [];
  if (pm) parts.push(`${pm} رسالة جاهزة تتبعت`);
  if (today.length) parts.push(`${today.length} قسط النهارده`);
  if (over.length) parts.push(`${over.length} متأخر`);
  if (soon.length) parts.push(`${soon.length} قرّب ميعاده`);
  const names = [...today, ...over].slice(0, 3).map(x => x.cu.name).join('، ');
  window.api.notify('تنبيه الأقساط | ' + DB.settings.shopName, parts.join(' · ') + (names ? `\n${names}` : ''));
  try { localStorage.setItem(key, todayStr()); } catch {}
}

// ======================= Events =======================
document.addEventListener('click', async (e) => {
  const nav = e.target.closest('#nav button'); if (nav) return go(nav.dataset.page);
  const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
  const df = e.target.closest('[data-due]'); if (df) { state.dueFilter = df.dataset.due; return render(); }
  const cf = e.target.closest('[data-cf2]'); if (cf) { state.contractFilter = cf.dataset.cf2; return render(); }
  const mf = e.target.closest('[data-mf]'); if (mf) { state.msgFilter = mf.dataset.mf; return render(); }
  if (e.target.id === 'modalBack') return closeModal();
  if (e.target.id === 'drawerBack') return closeDrawer();
  const sr = e.target.closest('.sr'); if (sr) { $('#searchResults').classList.remove('open'); $('#globalSearch').value = ''; state.drawerCust = sr.dataset.id; return openCustomer(sr.dataset.id); }
  if (!e.target.closest('.search')) $('#searchResults').classList.remove('open');

  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (['pay', 'wa', 'print', 'delContract', 'undoPay', 'editCust', 'delCust', 'newContract', 'receiptAgain', 'portalLink'].includes(act)) e.stopPropagation();
  const c = a.dataset.cid && DB.contracts.find(x => x.id === a.dataset.cid);
  switch (act) {
    case 'cust': state.drawerCust = a.dataset.id; return openCustomer(a.dataset.id);
    case 'closeDrawer': return closeDrawer();
    case 'closeModal': return closeModal();
    case 'newCust': return customerForm();
    case 'editCust': return customerForm(DB.customers.find(x => x.id === a.dataset.id));
    case 'newContract': return contractForm(a.dataset.cust);
    case 'pay': return payForm(a.dataset.cid);
    case 'wa': return openWhatsApp(c);
    case 'print': return printContract(a.dataset.cid);
    case 'undoPay':
      if (await confirmBox('إلغاء دفعة', 'متأكد إنك عايز تلغي الدفعة دي؟ المبلغ هيرجع على الأقساط تاني.', 'إلغاء الدفعة')) { undoPayment(c, a.dataset.pid); await save(); refresh(); toast('الدفعة اتلغت'); }
      return;
    case 'delContract':
      if (await confirmBox('حذف عقد', `هيتحذف عقد <b>${esc(c.device)}</b> وكل أقساطه ومدفوعاته. مينفعش ترجّعه غير من نسخة احتياطية.`, 'احذف')) {
        DB.contracts = DB.contracts.filter(x => x.id !== c.id); await save(); refresh(); toast('العقد اتحذف');
      }
      return;
    case 'delCust': {
      const cu = DB.customers.find(x => x.id === a.dataset.id); const n = contractsOf(cu.id).length;
      if (await confirmBox('حذف عميل', `هيتحذف <b>${esc(cu.name)}</b>${n ? ` ومعاه <b>${n} عقد</b>` : ''}. متأكد؟`, 'احذف')) {
        DB.contracts = DB.contracts.filter(x => x.customerId !== cu.id); DB.customers = DB.customers.filter(x => x.id !== cu.id);
        await save(); closeDrawer(); render(); updateBadge(); toast('العميل اتحذف');
      }
      return;
    }
    case 'backup': return window.api.exportBackup(DB).then(ok => ok && toast('النسخة اتحفظت'));
    case 'restore':
      try {
        const nd = await window.api.importBackup(); if (!nd) return;
        if (await confirmBox('استرجاع نسخة', `النسخة فيها ${nd.customers.length} عميل و ${nd.contracts.length} عقد. البيانات الحالية هتتبدّل بيها.`, 'استرجع')) {
          DB = nd; DB.settings ||= {}; await save(); render(); toast('البيانات اترجعت');
        }
      } catch (err) { toast('الملف ده مش نسخة صالحة', 'bad'); }
      return;
    case 'dataFolder': return window.api.openDataFolder();
    case 'msgSend': { const m = DB.messages.find(x => x.id === a.dataset.id); return m && sendMsg(m); }
    case 'msgNext': { const m = pendingMsgs().sort((x, y) => x.createdAt.localeCompare(y.createdAt))[0]; return m && sendMsg(m); }
    case 'msgEdit': { const m = DB.messages.find(x => x.id === a.dataset.id); return m && editMsg(m); }
    case 'msgSkip': { const m = DB.messages.find(x => x.id === a.dataset.id); if (m) { m.status = 'skipped'; await save(); render(); } return; }
    case 'tplReset': {
      e.preventDefault(); const k = a.dataset.k; DB.settings.tpl ||= {}; delete DB.settings.tpl[k];
      $(`[data-tpl="${k}"]`).value = DEF_TPL[k]; await save(); toast('رجعت للرسالة الأصلية'); return;
    }
    case 'receiptAgain': { const p = c.payments.find(x => x.id === a.dataset.pid); return p && showReceipt(c, p, null); }
    case 'portalLink': return sendPortalLink(DB.customers.find(x => x.id === a.dataset.id));
    case 'cloudTest': {
      $$('[data-set]').forEach(el => { if (['cloudUrl', 'cloudAnon', 'syncKey', 'portalUrl'].includes(el.dataset.set)) DB.settings[el.dataset.set] = el.value.trim(); });
      await save();
      $('#cloudStatus').innerHTML = 'بيجرّب الاتصال…';
      const r = await window.api.syncTest(DB.settings);
      if (r.ok) { $('#cloudStatus').innerHTML = `<span style="color:var(--mint)">●</span> الاتصال تمام. على السحابة ${r.customers} عميل`; toast('الاتصال تمام'); window.api.syncNow(); }
      else { $('#cloudStatus').innerHTML = `<span style="color:var(--coral)">●</span> ${esc(r.error)}`; toast(r.error, 'bad'); }
      return;
    }
    case 'cloudSync': return window.api.syncNow();
    case 'cloudPull':
      try {
        const nd = await window.api.syncPull();
        if (await confirmBox('استرجاع من السحابة', `على السحابة ${nd.customers.length} عميل و ${nd.contracts.length} عقد${nd.synced_at ? ` (آخر رفع ${timeAgo(nd.synced_at)})` : ''}.<br>البيانات اللي على الجهاز ده هتتبدّل بيهم.`, 'استرجع')) {
          DB.customers = nd.customers; DB.contracts = nd.contracts;
          if (nd.shop && nd.shop.name) { DB.settings.shopName = nd.shop.name; DB.settings.shopPhone = nd.shop.phone || ''; DB.settings.currency = nd.shop.currency || DB.settings.currency; }
          await save(); render(); toast('البيانات اترجعت من السحابة');
        }
      } catch (err) { toast(String(err.message || err).replace(/^Error invoking remote method 'sync:pull': (Error: )?/, ''), 'bad'); }
      return;
    case 'exportDue': {
      const list = dueItems();
      return exportCsv('أقساط-مستحقة-' + todayStr(), ['العميل', 'الموبايل', 'الجهاز', 'رقم القسط', 'الميعاد', 'المطلوب', 'الحالة'],
        list.map(x => [x.cu.name, x.cu.phone, x.c.device, `${x.i.n}/${x.c.installments.length}`, x.i.due, x.left, PILL[x.st][1]]));
    }
    case 'exportCust':
      return exportCsv('العملاء-' + todayStr(), ['الاسم', 'الموبايل', 'موبايل تاني', 'الرقم القومي', 'العنوان', 'الضامن', 'موبايل الضامن', 'عدد العقود', 'المتبقي'],
        DB.customers.map(cu => [cu.name, cu.phone, cu.phone2, cu.nationalId, cu.address, cu.guarantorName, cu.guarantorPhone, contractsOf(cu.id).length, contractsOf(cu.id).reduce((s, c) => s + cStats(c).remaining, 0)]));
    case 'exportContracts':
      return exportCsv('العقود-' + todayStr(), ['العميل', 'الموبايل', 'الجهاز', 'IMEI', 'تاريخ العقد', 'سعر الكاش', 'سعر التقسيط', 'المقدم', 'عدد الشهور', 'القسط', 'المدفوع', 'المتبقي', 'متأخر'],
        DB.contracts.map(c => { const s = cStats(c); const cu = custOf(c); return [cu.name, cu.phone, c.device, c.imei, c.date, c.cashPrice, c.totalPrice, c.downPayment, c.installments.length, c.installments[0]?.amount, s.collected, s.remaining, s.overAmt]; }));
    case 'exportPays':
      return exportCsv('التحصيل-' + state.reportMonth, ['التاريخ', 'العميل', 'الجهاز', 'البيان', 'المبلغ'], (state._pays || []).map(p => [p.date, p.cu.name, p.c.device, p.note, p.amount]));
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'custSearch') {
    state.custFilter = e.target.value; const pos = e.target.selectionStart; render();
    const i = $('#custSearch'); i.focus(); i.setSelectionRange(pos, pos);
  }
  if (e.target.id === 'globalSearch') {
    const q = e.target.value.trim(); const box = $('#searchResults');
    if (!q) return box.classList.remove('open');
    const res = DB.customers.filter(cu => cu.name.includes(q) || (telDigits(q) && telDigits(cu.phone).includes(telDigits(q)))).slice(0, 8);
    box.innerHTML = res.map(cu => `<div class="sr" data-id="${cu.id}"><b>${esc(cu.name)}</b><span dir="ltr" style="color:var(--muted)">${esc(cu.phone)}</span></div>`).join('') || `<div class="sr" style="cursor:default;color:var(--muted)">مفيش نتايج</div>`;
    box.classList.add('open');
  }
});
document.addEventListener('change', (e) => { if (e.target.id === 'repMonth') { state.reportMonth = e.target.value; render(); } });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if ($('#modalBack').classList.contains('open')) closeModal(); else closeDrawer(); }
  if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); $('#globalSearch').focus(); }
  if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); contractForm(); }
});
$('#quickContract').onclick = () => contractForm();
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('#themeBtn').innerHTML = `${ic(t === 'light' ? 'moon' : 'sun')}<span>${t === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>`;
  window.api.theme && window.api.theme(t);
}
$('#themeBtn').onclick = () => {
  const nt = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(nt); try { localStorage.setItem('nouby-theme', nt); } catch {}
};

// ======================= Boot =======================
(async function boot() {
  $$('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  let th = 'dark'; try { th = localStorage.getItem('nouby-theme') || 'dark'; } catch {}
  applyTheme(th);
  DB = await window.api.load();
  DB.messages ||= [];
  if (generateReminders()) await save();
  const d = new Date();
  $('#todayLbl').textContent = `${DAYS[d.getDay()]}، ${fmtD(todayStr())}`;
  render(); updateBadge();
  window.api.onSync(showSync);
  showSync(await window.api.syncStatus());
  setInterval(() => state.sync && showSync(state.sync), 60 * 1000);
  setTimeout(() => checkReminders(), 1500);
  setInterval(async () => {
    $('#todayLbl').textContent = `${DAYS[new Date().getDay()]}، ${fmtD(todayStr())}`;
    if (generateReminders()) await save();
    checkReminders(); updateBadge();
    if (['dashboard', 'due', 'messages'].includes(state.page) && !$('#modalBack').classList.contains('open')) render();
  }, 30 * 60 * 1000);
})();
