// ============================================================
//  screenshot.js — บันทึกสรุปเป็น PNG
//  Port มาจาก Screenshot.cs (ใช้ Canvas แทน NativeGallery)
//  เรียงคนที่มาก่อนอยู่ลำดับแรก ตรงกับ UpdateAllScreens
// ============================================================

import { STUDENTS, CLASS_INFO, STATUS_COLORS } from './config.js';
import { createStudentSVG } from './icons.js';

export async function captureAndDownload(manager) {
  const statusEl = document.getElementById('save-status');
  statusEl.textContent = 'กำลังบันทึก...';
  statusEl.className = 'save-status visible';

  try {
    const canvas = await buildSummaryCanvas(manager);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);

    // สร้าง filename ตาม pattern เดิมจาก Unity
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const filename = `เช็คชื่อเข้าแถววันที่_${dd}_${mm}_${yyyy}.png`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    statusEl.textContent = 'บันทึกแล้ว ✓';
    statusEl.className = 'save-status visible success';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'บันทึกไม่สำเร็จ ✗';
    statusEl.className = 'save-status visible error';
  }

  setTimeout(() => {
    statusEl.className = 'save-status';
  }, 3000);
}

// ===== วาด Canvas สรุป =====
async function buildSummaryCanvas(manager) {
  // Layout: 2340×1080 (landscape summary)
  const W = 2340, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, 120);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Sarabun", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(CLASS_INFO.subtitle + ' — ' + CLASS_INFO.name, 40, 60);

  // Date + Time
  const now = new Date();
  const dateStr = formatThaiDate(now);
  ctx.font = '36px "Sarabun", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 40, 60);
  ctx.textAlign = 'left';

  // Summary counts bar
  const counts = manager.getCounts();
  drawCountBar(ctx, counts, 0, 120, W, 80);

  // Top 3
  const top3 = manager.getTopN(3);
  drawTopRanks(ctx, top3, 40, 230);

  // Student grid
  const present = manager.getSortedPresent();
  const nonPresent = manager.getNonPresent();
  const allSorted = [...present, ...nonPresent];

  await drawStudentGrid(ctx, allSorted, manager, 40, 350, W - 80, H - 380);

  return canvas;
}

function drawCountBar(ctx, counts, x, y, w, h) {
  const items = [
    { label: 'มา', key: 'มา', color: STATUS_COLORS['มา'] },
    { label: 'ลา', key: 'ลา', color: STATUS_COLORS['ลา'] },
    { label: 'ขาด', key: 'ขาด', color: STATUS_COLORS['ขาด'] },
    { label: 'ไม่ได้เช็ค', key: 'ไม่ได้เช็ค', color: STATUS_COLORS['ไม่ได้เช็ค'] },
  ];
  const segW = w / items.length;
  items.forEach((item, i) => {
    ctx.fillStyle = item.color + '22';
    ctx.fillRect(x + i * segW, y, segW, h);

    ctx.fillStyle = item.color;
    ctx.font = 'bold 38px "Sarabun", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.label}: ${counts[item.key]}`, x + i * segW + segW / 2, y + h / 2);
  });
  ctx.textAlign = 'left';
}

function drawTopRanks(ctx, top3, x, y) {
  ctx.font = 'bold 30px "Sarabun", sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textBaseline = 'top';
  ctx.fillText('🏆 อันดับที่มาก่อน:', x, y);

  top3.forEach((txt, i) => {
    ctx.font = i === 0 ? 'bold 28px "Sarabun"' : '26px "Sarabun"';
    ctx.fillStyle = i === 0 ? STATUS_COLORS['มา'] : '#444';
    ctx.fillText(txt, x + 20, y + 38 + i * 36);
  });
}

async function drawStudentGrid(ctx, students, manager, x, y, w, h) {
  const COLS = 10;
  const ROWS = Math.ceil(students.length / COLS);
  const cellW = w / COLS;
  const cellH = h / ROWS;

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const rec = manager.getRecord(s.id);
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = x + col * cellW;
    const cy = y + row * cellH;

    // Cell background
    ctx.fillStyle = rec.status === 'ไม่ได้เช็ค' ? '#f5f5f5' : STATUS_COLORS[rec.status] + '18';
    roundRect(ctx, cx + 2, cy + 2, cellW - 4, cellH - 4, 10);
    ctx.fill();

    // Status color top bar
    ctx.fillStyle = STATUS_COLORS[rec.status];
    roundRect(ctx, cx + 2, cy + 2, cellW - 4, 8, [4, 4, 0, 0]);
    ctx.fill();

    // Student number
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(s.id, cx + cellW / 2, cy + 16);

    // Status text
    ctx.font = '18px "Sarabun", sans-serif';
    ctx.fillStyle = STATUS_COLORS[rec.status];
    ctx.fillText(rec.status, cx + cellW / 2, cy + 40);

    // Arrival order (if มา)
    const presentList = manager.getSortedPresent();
    const order = presentList.findIndex(p => p.id === s.id);
    if (order >= 0) {
      ctx.font = 'bold 20px "Chakra Petch", sans-serif';
      ctx.fillStyle = STATUS_COLORS['มา'];
      ctx.fillText(`#${order + 1}`, cx + cellW / 2, cy + 62);
    }

    // Reason
    if (rec.reason) {
      ctx.font = '15px "Sarabun", sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText(rec.reason.substring(0, 8), cx + cellW / 2, cy + 84);
    }

    ctx.textAlign = 'left';
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + radii[0], y);
  ctx.lineTo(x + w - radii[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1]);
  ctx.lineTo(x + w, y + h - radii[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h);
  ctx.lineTo(x + radii[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3]);
  ctx.lineTo(x, y + radii[0]);
  ctx.quadraticCurveTo(x, y, x + radii[0], y);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function formatThaiDate(date) {
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  return `วัน${days[date.getDay()]} ${d}/${m}/${y}  ${hh}:${mm} น.`;
}
