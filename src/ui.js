// ============================================================
//  ui.js — สร้างและอัพเดต DOM
//  ฟังก์ชัน render / update ทั้งหมดอยู่ที่นี่
// ============================================================

import { STUDENTS, CLASS_INFO, STATUS_COLORS } from './config.js';
import { createStudentSVG } from './icons.js';

let _manager = null;

// ===== Init: สร้าง HTML ทั้งหมด =====
export function initUI(manager) {
  _manager = manager;
  buildHeader();
  buildSummaryBar();
  buildTopRanks();
  buildActionBar();
  buildStudentGrid();
  buildFooter();
  startClock();
}

// ===== Full re-render เมื่อมีการเปลี่ยนแปลง =====
export function updateUI(changedId) {
  updateSummaryBar();
  updateTopRanks();
  updateAllCards(changedId);
}

// =============================================
// ===== Builder Functions =====
// =============================================

function buildHeader() {
  const header = document.getElementById('app-header');
  header.innerHTML = `
    <img src="Asset/icon/logo.svg" alt="logo" class="header-logo">
    <div class="header-title">
      <h1>${CLASS_INFO.name}</h1>
      <p>${CLASS_INFO.subtitle}</p>
    </div>
    <div class="header-datetime" id="header-datetime"></div>
  `;
}

function buildSummaryBar() {
  const bar = document.getElementById('summary-bar');
  const items = [
    { status: 'มา',         icon: '✓' },
    { status: 'ลา',         icon: '!' },
    { status: 'ขาด',        icon: '✗' },
    { status: 'ไม่ได้เช็ค', icon: '?' },
  ];
  bar.innerHTML = items.map(item => `
    <div class="summary-item" data-status="${item.status}">
      <span class="summary-count" id="count-${encodeStatus(item.status)}">0</span>
      <span class="summary-label">${item.status}</span>
    </div>
  `).join('');
}

function buildTopRanks() {
  const section = document.getElementById('top-ranks');
  section.innerHTML = `
    <span class="top-ranks-label">🏆 มาก่อน:</span>
    <div class="top-rank-chips" id="rank-chips"></div>
  `;
}

function buildActionBar() {
  const bar = document.getElementById('action-bar');
  bar.innerHTML = `
    <button class="btn btn-save" id="btn-save">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/>
      </svg>
      บันทึก PNG
    </button>
    <button class="btn btn-reset" id="btn-reset">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path d="M4 4v5h5M20 20v-5h-5M4.583 14.5A9 9 0 1019.417 9.5"/>
      </svg>
      รีเซ็ต
    </button>
    <span class="save-status" id="save-status"></span>
  `;
}

function buildStudentGrid() {
  const grid = document.getElementById('students-grid');
  grid.innerHTML = STUDENTS.map(s => buildCardHTML(s, 'ไม่ได้เช็ค')).join('');

  // Delegate event listeners
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;
    const card = btn.closest('.student-card');
    const id = card.dataset.studentId;
    const status = btn.dataset.status;

    _manager.setStatus(id, status);
    flashCard(card);
  });

  grid.addEventListener('input', e => {
    const input = e.target.closest('.reason-input');
    if (!input) return;
    const card = input.closest('.student-card');
    _manager.setReason(card.dataset.studentId, input.value);
  });
}

function buildFooter() {
  const footer = document.getElementById('app-footer');
  footer.innerHTML = `Student Check — ${CLASS_INFO.name} &nbsp;|&nbsp; Built for GitHub Pages`;
}

function buildCardHTML(s, status) {
  return `
    <div class="student-card" data-student-id="${s.id}" data-status="${status}">
      <div class="card-icon-area">
        ${createStudentSVG(status)}
        <span class="arrival-badge hidden" id="badge-${s.id}"></span>
      </div>
      <div class="card-body">
        <div class="card-number">${s.realName ? s.realName : `เลขที่ ${s.id}`}</div>
        <div class="status-buttons">
          <button class="status-btn" data-status="มา">มา</button>
          <button class="status-btn" data-status="ลา">ลา</button>
          <button class="status-btn" data-status="ขาด">ขาด</button>
        </div>
        <input
          class="reason-input"
          type="text"
          placeholder="เหตุผล..."
          maxlength="30"
          id="reason-${s.id}"
        >
      </div>
    </div>
  `;
}

// =============================================
// ===== Updater Functions =====
// =============================================

function updateSummaryBar() {
  const counts = _manager.getCounts();
  ['มา','ลา','ขาด','ไม่ได้เช็ค'].forEach(s => {
    const el = document.getElementById(`count-${encodeStatus(s)}`);
    if (el) el.textContent = counts[s];
  });
}

function updateTopRanks() {
  const chips = document.getElementById('rank-chips');
  if (!chips) return;
  const top3 = _manager.getTopN(3);

  if (top3.length === 0) {
    chips.innerHTML = '<span style="font-size:12px;color:#aaa">รอเช็คชื่อ...</span>';
    return;
  }
  chips.innerHTML = top3.map(t => `<span class="rank-chip">${t}</span>`).join('');
}

function updateAllCards(changedId) {
  const presentList = _manager.getSortedPresent();
  const ordersMap = {};
  presentList.forEach((s, i) => ordersMap[s.id] = i + 1);

  STUDENTS.forEach(s => {
    const rec = _manager.getRecord(s.id);
    const card = document.querySelector(`.student-card[data-student-id="${s.id}"]`);
    if (!card) return;

    // Update status attr
    card.dataset.status = rec.status;

    // Update icon
    const iconArea = card.querySelector('.card-icon-area');
    const badge = iconArea.querySelector('.arrival-badge');
    // Replace SVG
    const oldSvg = iconArea.querySelector('svg');
    if (oldSvg) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = createStudentSVG(rec.status);
      const newSvg = wrapper.querySelector('svg');
      iconArea.replaceChild(newSvg, oldSvg);
    }

    // Arrival badge
    if (ordersMap[s.id]) {
      badge.textContent = ordersMap[s.id];
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    // Status buttons
    card.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === rec.status);
    });

    // Reason input visibility
    const input = card.querySelector('.reason-input');
    if (input) {
      input.classList.toggle('visible', rec.status !== 'ไม่ได้เช็ค');
      if (rec.reason !== input.value) input.value = rec.reason;
    }
  });
}

// ===== Flash animation on status change =====
function flashCard(card) {
  card.classList.remove('flash');
  void card.offsetWidth; // reflow
  card.classList.add('flash');
}

// ===== Clock =====
function startClock() {
  const el = document.getElementById('header-datetime');
  if (!el) return;

  function tick() {
    const now = new Date();
    const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    const day = days[now.getDay()];
    const d = String(now.getDate()).padStart(2,'0');
    const m = String(now.getMonth()+1).padStart(2,'0');
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    el.innerHTML = `วัน${day} ${d}/${m}/${y}<br>${hh}:${mm}:${ss} น.`;
  }
  tick();
  setInterval(tick, 1000);
}

// ===== Utility =====
function encodeStatus(s) {
  const map = { 'มา': 'ma', 'ลา': 'la', 'ขาด': 'khat', 'ไม่ได้เช็ค': 'unchecked' };
  return map[s] || s;
}
