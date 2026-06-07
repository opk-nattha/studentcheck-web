// ============================================================
//  ui.js — สร้างและอัพเดต DOM (UI สไตล์ indexU)
//  Layout: Header (logo + clock + count pills + buttons)
//          Top 3 section
//          Student Grid (responsive cards)
// ============================================================

import { STUDENTS, CLASS_INFO } from './config.js';
// BUG FIX: ลบ STATUS_COLORS ออก — ไม่ได้ใช้ใน ui.js
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
  const displayName = s.realName ? s.realName : `เลขที่ ${s.id}`;
  return `
    <div class="student-card s-unchecked" data-student-id="${s.id}" id="card-${s.id}">
      <div class="card-inner">
        <div class="card-avatar-wrap">
          ${createStudentSVG('ไม่ได้เช็ค')}
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

// ─── PERFORMANCE FIX: อัปเดตเฉพาะ card ที่เปลี่ยน + badge ทั้งหมด ───
// เดิม: วน loop 40 คนทุกครั้ง แม้จะเปลี่ยนแค่คนเดียว
// ใหม่: เปลี่ยนแค่คนที่ changedId ชี้, แล้วอัปเดต badge ทุกคน (order อาจเลื่อน)
function updateAllCards(changedId) {
  const presentList = _manager.getSortedPresent();
  const ordersMap   = {};
  presentList.forEach((s, i) => ordersMap[s.id] = i + 1);

  if (changedId) {
    // อัปเดตเฉพาะ card ที่เปลี่ยน
    const s = STUDENTS.find(st => st.id === changedId);
    if (s) _updateCard(s, ordersMap);
    // อัปเดต badge ทุกคน เพราะลำดับการมาอาจเลื่อน
    STUDENTS.forEach(st => _updateOrderBadge(st.id, ordersMap));
  } else {
    // กรณี reset หรือ init: อัปเดตทั้งหมด
    STUDENTS.forEach(s => _updateCard(s, ordersMap));
  }
}

function _updateCard(s, ordersMap) {
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

  // Avatar SVG (replace only the svg element)
  const avatarWrap = card.querySelector('.card-avatar-wrap');
  const oldSVG     = avatarWrap?.querySelector('svg');
  if (oldSVG) {
    const tmp = document.createElement('div');
    tmp.innerHTML = createStudentSVG(rec.status);
    const newSVG = tmp.firstElementChild;
    if (newSVG) avatarWrap.replaceChild(newSVG, oldSVG);
  }

  // Order badge
  _updateOrderBadge(s.id, ordersMap);

  // Status buttons
  card.querySelectorAll('.btn-status').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === rec.status);
  });

  // Note input visibility
  const noteWrap  = card.querySelector('.card-note-wrap');
  const noteInput = card.querySelector('.card-note');
  if (noteWrap) noteWrap.classList.toggle('hidden', rec.status === 'ไม่ได้เช็ค');
  if (noteInput && rec.reason !== undefined && noteInput.value !== rec.reason) {
    noteInput.value = rec.reason || '';
  }
}

function _updateOrderBadge(id, ordersMap) {
  const badge = document.getElementById(`badge-${id}`);
  if (!badge) return;
  if (ordersMap[id]) {
    badge.textContent = ordersMap[id];
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ─── Flash animation on card change ───
function flashCard(card) {
  card.classList.remove('flash');
  void card.offsetWidth; // force reflow
  card.classList.add('flash');
}

// ─── Clock ───
// BUG FIX: เดิม setInterval 30000ms ทำให้นาฬิกาแสดงเวลาล้าหลังสูงสุด 30 วินาที
// แก้เป็น tick ทุก 60 วินาที และ sync ตาม boundary ของนาที
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
  // Sync กับขอบเขตนาที: รอให้ถึงวินาทีที่ 0 ของนาทีถัดไปก่อน แล้วค่อย setInterval 60s
  const now  = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    tick();
    setInterval(tick, 60000);
  }, msToNextMinute);
}
