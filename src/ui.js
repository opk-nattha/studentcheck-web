// ============================================================
//  ui.js — สร้างและอัพเดต DOM (UI สไตล์ indexU)
//  Layout: Header (logo + clock + count pills + buttons)
//          Top 3 section
//          Student Grid (responsive cards)
//          Capture Panel (off-screen PNG)
// ============================================================

import { STUDENTS, CLASS_INFO, STATUS_COLORS } from './config.js';
import { createStudentSVG } from './icons.js';

let _manager = null;

// ─── STATUS labels (Thai) ───
const STATUS_LABELS = {
  'มา':         'มา',
  'ลา':         'ลา',
  'ขาด':        'ขาด',
  'ไม่ได้เช็ค': 'ไม่เช็ค',
};

const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

// ─── Init ───
export function initUI(manager) {
  _manager = manager;
  buildHeader();
  buildTop3();
  buildStudentGrid();
  startClock();
}

// ─── Full update ───
export function updateUI(changedId) {
  updateCountPills();
  updateTop3();
  updateAllCards(changedId);
}

// ═══════════════════════════════════════
// Builder functions
// ═══════════════════════════════════════

function buildHeader() {
  const header = document.getElementById('app-header');
  const total  = STUDENTS.length;
  header.innerHTML = `
    <img src="assets/icons/icon.svg" alt="Logo" class="header-logo">
    <div class="header-datetime">
      <span class="header-day"  id="hdr-day"></span>
      <span class="header-date" id="hdr-date"></span>
    </div>
    <div class="header-spacer"></div>
    <div class="count-pills">
      <div class="count-pill cp-present"><span class="pill-num" id="cnt-present">0</span>มา</div>
      <div class="count-pill cp-leave"  ><span class="pill-num" id="cnt-leave">0</span>ลา</div>
      <div class="count-pill cp-absent" ><span class="pill-num" id="cnt-absent">0</span>ขาด</div>
      <div class="count-pill cp-none"   ><span class="pill-num" id="cnt-unchecked">${total}</span>ไม่เช็ค</div>
    </div>
    <button class="btn-reset" id="btn-reset" title="รีเซ็ตทั้งหมด">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
    </button>
    <button class="btn-capture" id="btn-save">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>บันทึก PNG</span>
    </button>
  `;
}

function buildTop3() {
  const section = document.getElementById('top3-section');
  section.innerHTML = `
    <div class="top3-label">มาก่อน</div>
    <div class="top3-list" id="top3-list">
      <div class="top3-item" id="rank-1"><span class="rank-badge">🥇</span><span class="rank-name top3-empty">รอผู้ท้าชิง</span></div>
      <div class="top3-item" id="rank-2"><span class="rank-badge">🥈</span><span class="rank-name top3-empty">รอผู้ท้าชิง</span></div>
      <div class="top3-item" id="rank-3"><span class="rank-badge">🥉</span><span class="rank-name top3-empty">รอผู้ท้าชิง</span></div>
    </div>
  `;
}

function buildStudentGrid() {
  const grid = document.getElementById('student-grid');
  grid.innerHTML = STUDENTS.map(s => buildCardHTML(s)).join('');

  // Delegate: status buttons
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-status');
    if (!btn) return;
    const card = btn.closest('.student-card');
    if (!card) return;
    const id     = card.dataset.studentId;
    const status = btn.dataset.status;
    _manager.setStatus(id, status);
    flashCard(card);
  });

  // Delegate: note input
  grid.addEventListener('input', e => {
    const input = e.target.closest('.card-note');
    if (!input) return;
    const card = input.closest('.student-card');
    if (!card) return;
    _manager.setReason(card.dataset.studentId, input.value);
  });
}

function buildCardHTML(s) {
  const status    = 'ไม่ได้เช็ค';
  const displayName = s.realName ? s.realName : `เลขที่ ${s.id}`;
  return `
    <div class="student-card s-unchecked" data-student-id="${s.id}" id="card-${s.id}">
      <div class="card-inner">
        <div class="card-avatar-wrap">
          ${createStudentSVG(status)}
          <div class="order-badge hidden" id="badge-${s.id}"></div>
        </div>
        <div class="card-info">
          <div class="card-num">เลขที่ ${s.id}</div>
          <div class="card-name">${displayName}</div>
        </div>
        <div class="card-actions">
          <div class="card-btns">
            <button class="btn-status bs-present" data-status="มา">มา</button>
            <button class="btn-status bs-leave"   data-status="ลา">ลา</button>
            <button class="btn-status bs-absent"  data-status="ขาด">ขาด</button>
          </div>
          <div class="card-note-wrap hidden">
            <input class="card-note" id="note-${s.id}" type="text" maxlength="40"
              placeholder="หมายเหตุ (ไม่บังคับ)">
          </div>
        </div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════
// Updater functions
// ═══════════════════════════════════════

function updateCountPills() {
  const counts = _manager.getCounts();
  document.getElementById('cnt-present').textContent   = counts['มา']         || 0;
  document.getElementById('cnt-leave').textContent     = counts['ลา']         || 0;
  document.getElementById('cnt-absent').textContent    = counts['ขาด']        || 0;
  document.getElementById('cnt-unchecked').textContent = counts['ไม่ได้เช็ค'] || 0;
}

function updateTop3() {
  const presentSorted = _manager.getSortedPresent();
  const medals        = ['🥇','🥈','🥉'];
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`rank-${i + 1}`);
    if (!el) continue;
    if (i < presentSorted.length) {
      const s    = presentSorted[i];
      const name = s.realName || `เลขที่ ${s.id}`;
      const mvp  = i === 0 ? `<span class="rank-tag">MVP</span>` : '';
      el.innerHTML = `<span class="rank-badge">${medals[i]}</span>
        <span class="rank-name">${name}</span>${mvp}`;
      el.classList.add('filled');
    } else {
      el.innerHTML = `<span class="rank-badge">${medals[i]}</span>
        <span class="rank-name top3-empty">รอผู้ท้าชิง</span>`;
      el.classList.remove('filled');
    }
  }
}

function updateAllCards(changedId) {
  const presentList = _manager.getSortedPresent();
  const ordersMap   = {};
  presentList.forEach((s, i) => ordersMap[s.id] = i + 1);

  STUDENTS.forEach(s => {
    const rec  = _manager.getRecord(s.id);
    const card = document.getElementById(`card-${s.id}`);
    if (!card || !rec) return;

    // Status class
    const statusClass = {
      'มา':         's-present',
      'ลา':         's-leave',
      'ขาด':        's-absent',
      'ไม่ได้เช็ค': 's-unchecked',
    }[rec.status] || 's-unchecked';
    card.className = `student-card ${statusClass}`;

    // Avatar SVG
    const avatarWrap = card.querySelector('.card-avatar-wrap');
    const oldSVG     = avatarWrap.querySelector('svg');
    if (oldSVG) {
      const tmp = document.createElement('div');
      tmp.innerHTML = createStudentSVG(rec.status);
      avatarWrap.replaceChild(tmp.firstElementChild, oldSVG);
    }

    // Order badge
    const badge = document.getElementById(`badge-${s.id}`);
    if (badge) {
      if (ordersMap[s.id]) {
        badge.textContent = ordersMap[s.id];
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    // Status buttons
    card.querySelectorAll('.btn-status').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === rec.status);
    });

    // Note input visibility
    const noteWrap = card.querySelector('.card-note-wrap');
    const noteInput = card.querySelector('.card-note');
    if (noteWrap) noteWrap.classList.toggle('hidden', rec.status === 'ไม่ได้เช็ค');
    if (noteInput && rec.reason !== undefined && noteInput.value !== rec.reason) {
      noteInput.value = rec.reason || '';
    }
  });
}

// ─── Flash animation on card change ───
function flashCard(card) {
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
}

// ─── Clock ───
function startClock() {
  function tick() {
    const now = new Date();
    const dayEl  = document.getElementById('hdr-day');
    const dateEl = document.getElementById('hdr-date');
    if (!dayEl || !dateEl) return;

    const d  = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const y  = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    dayEl.textContent  = `วัน${THAI_DAYS[now.getDay()]}`;
    dateEl.textContent = `${d}/${mo}/${y}  ${hh}:${mm} น.`;
  }
  tick();
  setInterval(tick, 30000);
}

// ─── Build capture panel HTML (for PNG export) ───
export function buildCapturePanel(manager) {
  const now    = new Date();
  const counts = manager.getCounts();
  const presentSorted = manager.getSortedPresent();
  const medals = ['🥇','🥈','🥉'];

  const d  = String(now.getDate()).padStart(2,'0');
  const mo = String(now.getMonth()+1).padStart(2,'0');
  const y  = now.getFullYear();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const dateStr = `${d}/${mo}/${y}`;
  const dayStr  = `วัน${THAI_DAYS[now.getDay()]}  ${hh}:${mm} น.`;

  // Top 3 HTML
  let top3Html = '';
  for (let i = 0; i < 3; i++) {
    if (i < presentSorted.length) {
      const s    = presentSorted[i];
      const name = s.realName || `เลขที่ ${s.id}`;
      const mvp  = i === 0 ? `<div class="cp-rank-tag">MVP 🏆</div>` : '';
      top3Html += `<div class="cp-rank-item rank-filled">
        <div class="cp-rank-medal">${medals[i]}</div>
        <div><div class="cp-rank-name">${name}</div>${mvp}</div>
      </div>`;
    } else {
      top3Html += `<div class="cp-rank-item">
        <div class="cp-rank-medal">${medals[i]}</div>
        <div class="cp-rank-empty">รอผู้ท้าชิง</div>
      </div>`;
    }
  }

  // Student grid: present first (sorted), then rest in original order
  const nonPresent = STUDENTS.filter(s => manager.getRecord(s.id).status !== 'มา');
  const sorted     = [...presentSorted, ...nonPresent];

  let gridHtml = '';
  sorted.forEach((s, idx) => {
    const rec   = manager.getRecord(s.id);
    const color = STATUS_COLORS[rec.status] || '#94A3B8';
    const cls   = { 'มา':'sp', 'ลา':'sl', 'ขาด':'sa' }[rec.status] || '';
    const label = STATUS_LABELS[rec.status] || 'ไม่เช็ค';
    const note  = rec.reason ? `<div class="cp-slot-note">${rec.reason}</div>` : '';
    const orderBadge = rec.status === 'มา'
      ? `<div style="font-size:9px;color:#00994f;font-weight:700;">#${idx+1}</div>` : '';

    // use inline SVG from icons.js
    const { createStudentSVG: _svg } = { createStudentSVG };  // alias for clarity
    gridHtml += `<div class="cp-slot ${cls}">
      ${createStudentSVG(rec.status)}
      <div class="cp-slot-num">เลขที่ ${s.id}</div>
      <div class="cp-slot-status">${label}</div>
      ${orderBadge}${note}
    </div>`;
  });

  const panel = document.getElementById('capture-panel');
  panel.innerHTML = `
    <div class="cp-header">
      <div class="cp-header-left">
        <img src="assets/icons/icon.svg" class="cp-logo" alt="Logo">
        <div class="cp-title-block">
          <div class="cp-title">รายงานการเข้าแถว</div>
          <div class="cp-subtitle">${CLASS_INFO.name} — ${CLASS_INFO.subtitle}</div>
        </div>
      </div>
      <div class="cp-datetime">
        <div class="cp-date-big">${dateStr}</div>
        <div class="cp-day">${dayStr}</div>
      </div>
    </div>
    <div class="cp-counts">
      <div class="cp-count-item ccp"><div class="cp-count-num">${counts['มา']||0}</div><div class="cp-count-lbl">มา</div></div>
      <div class="cp-count-item ccl"><div class="cp-count-num">${counts['ลา']||0}</div><div class="cp-count-lbl">ลา</div></div>
      <div class="cp-count-item cca"><div class="cp-count-num">${counts['ขาด']||0}</div><div class="cp-count-lbl">ขาด</div></div>
      <div class="cp-count-item ccn"><div class="cp-count-num">${counts['ไม่ได้เช็ค']||0}</div><div class="cp-count-lbl">ไม่เช็ค</div></div>
    </div>
    <div class="cp-top3">${top3Html}</div>
    <div class="cp-section-title">รายชื่อนักเรียน (เรียงตามลำดับการมา)</div>
    <div class="cp-grid">${gridHtml}</div>
  `;
}
