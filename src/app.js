// app.js

/* ─── Constants ─── */
const STATUS = { PRESENT: 'present', LEAVE: 'leave', ABSENT: 'absent', UNCHECKED: 'unchecked' };
const STATUS_COLORS = {
  [STATUS.PRESENT]:   '#00BF63',
  [STATUS.LEAVE]:     '#FFB000',
  [STATUS.ABSENT]:    '#FF4F4F',
  [STATUS.UNCHECKED]: '#94A3B8',
};
const STATUS_LABELS = {
  [STATUS.PRESENT]:   'มา',
  [STATUS.LEAVE]:     'ลา',
  [STATUS.ABSENT]:    'ขาด',
  [STATUS.UNCHECKED]: 'ไม่เช็ค',
};
const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

/* ─── App State ─── */
const state = {
  students: STUDENTS_DATA.map(s => ({
    ...s,
    status: STATUS.UNCHECKED,
    note: '',
    checkTime: null,
  }))
};

/* --- ฟังก์ชันช่วยเหลือต่างๆ (นำมาจากโค้ดเดิม) --- */
function studentSVG(color) { /* ... โค้ดเดิม ... */ 
  const c = color;
  const dark = shadeColor(color, -30);
  return `<svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="14" r="12" fill="${c}"/>
    <path d="M8 12 Q8 2 20 2 Q32 2 32 12" fill="${dark}"/>
    <circle cx="15.5" cy="13" r="2.2" fill="rgba(255,255,255,0.92)"/>
    <circle cx="24.5" cy="13" r="2.2" fill="rgba(255,255,255,0.92)"/>
    <path d="M14.5 18.5 Q20 22 25.5 18.5" stroke="rgba(255,255,255,0.88)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M5 34 C5 27 12 25 20 25 C28 25 35 27 35 34 L36 51 Q36 52 34 52 L6 52 Q4 52 4 51 Z" fill="${c}"/>
    <path d="M17 25 L20 29.5 L23 25" fill="rgba(255,255,255,0.28)"/>
  </svg>`;
}
function shadeColor(hex, pct) { /* ... โค้ดเดิม ... */ 
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + pct));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + pct));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + pct));
  return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}
function getNow() { return new Date(); }
function formatDate(d) { return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
function formatTime(d) { return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} น.`; }

/* --- โค้ดเรนเดอร์และการทำงานต่างๆ (นำมาจากโค้ดเดิมทั้งหมด) --- */
function renderCard(student) { /* ... โค้ดเดิม ... */ }
function getPresentSorted() { /* ... โค้ดเดิม ... */ }
function renderGrid() { 
  const grid = document.getElementById('student-grid');
  grid.innerHTML = state.students.map(s => renderCard(s)).join('');
}
function setStatus(id, newStatus) { /* ... โค้ดเดิม ... */ }
function setNote(id, text) { /* ... โค้ดเดิม ... */ }
function updateCard(student) { /* ... โค้ดเดิม ... */ }
function updateAllOrderBadges() { /* ... โค้ดเดิม ... */ }
function updateCountSummary() { /* ... โค้ดเดิม ... */ }
function updateTop3() { /* ... โค้ดเดิม ... */ }
function updateClock() { /* ... โค้ดเดิม ... */ }
function resetAll() { /* ... โค้ดเดิม ... */ }
let toastTimer = null;
function showToast(msg) { /* ... โค้ดเดิม ... */ }
function buildCapturePanel() { /* ... โค้ดเดิม ... */ }

/* ─── แก้ไขฟังก์ชันบันทึกรูปภาพ (FIXED) ─── */
async function captureAsPNG() {
  showToast('⏳ กำลังสร้างภาพ...');
  buildCapturePanel();

  const panel = document.getElementById('capture-panel');
  
  // นำ Panel กลับเข้ามาในจอ แต่ซ่อนไว้ข้างหลังแอปพลิเคชัน (แก้ปัญหาบัคภาพขาว)
  panel.style.position = 'absolute';
  panel.style.left  = '0';
  panel.style.top   = '0';
  panel.style.zIndex = '-100'; // ดันไปอยู่เลเยอร์ล่างสุด
  panel.style.visibility = 'visible'; // ต้องเป็น visible เท่านั้น html2canvas ถึงจะวาดได้

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 200)); // ให้เวลา DOM เรนเดอร์เล็กน้อย

  try {
    const canvas = await html2canvas(panel, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: panel.scrollWidth,
      height: panel.scrollHeight,
      windowWidth: panel.scrollWidth,
    });

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = getNow();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}_${String(now.getMonth()+1).padStart(2,'0')}_${now.getFullYear()}`;
      a.href = url;
      a.download = `เช็คชื่อเข้าแถววันที่_${dateStr}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ บันทึกเรียบร้อย!');
    }, 'image/png');

  } catch (err) {
    console.error('Capture error:', err);
    showToast('❌ บันทึกไม่สำเร็จ');
  } finally {
    // นำ Panel กลับไปซ่อนไว้นอกหน้าจอเหมือนเดิม
    panel.style.left       = '-9999px';
    panel.style.zIndex     = '-1';
  }
}

/* ─── Initialise ─── */
function init() {
  renderGrid();
  updateCountSummary();
  updateTop3();
  updateClock();
  setInterval(updateClock, 30000);
}

document.addEventListener('DOMContentLoaded', init);
