// ============================================================
//  screenshot.js — วาด PNG สรุปด้วย Canvas API โดยตรง
//  ไม่พึ่ง html2canvas → ไม่มีปัญหา blank/white output
// ============================================================

import { STUDENTS, CLASS_INFO, STATUS_COLORS } from './config.js';

const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

// ─── Status labels / colors ───
const LABEL = {
  'มา':         'มา',
  'ลา':         'ลา',
  'ขาด':        'ขาด',
  'ไม่ได้เช็ค': 'ไม่เช็ค',
};
const BG = {
  'มา':         '#e8fdf1',
  'ลา':         '#fff8e6',
  'ขาด':        '#fff0f0',
  'ไม่ได้เช็ค': '#f1f5f9',
};

// ─── Toast ───
let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('status-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── Main export ───
export async function captureAndDownload(manager) {
  showToast('⏳ กำลังสร้างภาพ...');
  try {
    // รอ font โหลด
    await document.fonts.ready;

    const canvas = buildCanvas(manager);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      const now = new Date();
      const dd  = String(now.getDate()).padStart(2,'0');
      const mo  = String(now.getMonth()+1).padStart(2,'0');
      const y   = now.getFullYear();
      a.href     = url;
      a.download = `เช็คชื่อเข้าแถววันที่_${dd}_${mo}_${y}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ บันทึกเรียบร้อย!');
    }, 'image/png');
  } catch (err) {
    console.error('Capture error:', err);
    showToast('❌ บันทึกไม่สำเร็จ');
  }
}

// ─── Build canvas ───
function buildCanvas(manager) {
  const COLS     = 8;
  const CELL_W   = 120;
  const CELL_H   = 140;
  const PAD      = 40;
  const W        = 1080;
  const rows     = Math.ceil(STUDENTS.length / COLS);
  const GRID_W   = COLS * CELL_W;
  const GRID_X   = (W - GRID_W) / 2;

  // Heights
  const H_HDR    = 110;   // header
  const H_COUNTS = 100;   // count bar
  const H_TOP3   = 90;    // top 3
  const H_LABEL  = 50;    // section label
  const H_GRID   = rows * CELL_H + PAD;
  const H_FOOT   = 50;
  const H        = H_HDR + H_COUNTS + H_TOP3 + H_LABEL + H_GRID + H_FOOT;

  const canvas   = document.createElement('canvas');
  canvas.width   = W;
  canvas.height  = H;
  const ctx      = canvas.getContext('2d');

  // ── Background ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  let y = 0;

  // ── Header ──
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, y, W, H_HDR);
  // bottom border
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, y + H_HDR - 2, W, 2);

  ctx.fillStyle = '#1e293b';
  ctx.font      = 'bold 26px Prompt, Sarabun, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('รายงานการเข้าแถว', PAD, y + H_HDR / 2 - 12);
  ctx.font      = '18px Prompt, Sarabun, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${CLASS_INFO.name} — ${CLASS_INFO.subtitle}`, PAD, y + H_HDR / 2 + 16);

  // date right side
  const now     = new Date();
  const dd      = String(now.getDate()).padStart(2,'0');
  const mo      = String(now.getMonth()+1).padStart(2,'0');
  const yr      = now.getFullYear();
  const hh      = String(now.getHours()).padStart(2,'0');
  const mm      = String(now.getMinutes()).padStart(2,'0');
  const dateStr = `${dd}/${mo}/${yr}`;
  const dayStr  = `วัน${THAI_DAYS[now.getDay()]}  ${hh}:${mm} น.`;

  ctx.fillStyle   = '#1e293b';
  ctx.font        = 'bold 28px Prompt, Sarabun, sans-serif';
  ctx.textAlign   = 'right';
  ctx.fillText(dateStr, W - PAD, y + H_HDR / 2 - 12);
  ctx.font        = '16px Prompt, Sarabun, sans-serif';
  ctx.fillStyle   = '#64748b';
  ctx.fillText(dayStr, W - PAD, y + H_HDR / 2 + 16);
  ctx.textAlign   = 'left';
  y += H_HDR;

  // ── Count bar ──
  const counts   = manager.getCounts();
  const countItems = [
    { label:'มา',         val: counts['มา']         || 0, color: STATUS_COLORS['มา'],         bg:'#e8fdf1', lc:'#00994f' },
    { label:'ลา',         val: counts['ลา']         || 0, color: STATUS_COLORS['ลา'],         bg:'#fff8e6', lc:'#cc8d00' },
    { label:'ขาด',        val: counts['ขาด']        || 0, color: STATUS_COLORS['ขาด'],        bg:'#fff0f0', lc:'#cc3f3f' },
    { label:'ไม่เช็ค',   val: counts['ไม่ได้เช็ค'] || 0, color: '#64748b',                   bg:'#f1f5f9', lc:'#475569' },
  ];
  const segW = W / countItems.length;
  countItems.forEach((item, i) => {
    // bg
    ctx.fillStyle = item.bg;
    ctx.fillRect(i * segW, y, segW, H_COUNTS);
    // right border
    if (i < countItems.length - 1) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect((i + 1) * segW - 1, y, 1, H_COUNTS);
    }
    // number
    ctx.fillStyle   = item.color;
    ctx.font        = `bold 42px Prompt, Sarabun, sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(String(item.val), i * segW + segW / 2, y + H_COUNTS / 2 - 10);
    // label
    ctx.fillStyle   = item.lc;
    ctx.font        = `16px Prompt, Sarabun, sans-serif`;
    ctx.fillText(item.label, i * segW + segW / 2, y + H_COUNTS / 2 + 22);
  });
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  // bottom border
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, y + H_COUNTS - 1, W, 1);
  y += H_COUNTS;

  // ── Top 3 ──
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, y, W, H_TOP3);
  ctx.fillStyle   = '#64748b';
  ctx.font        = 'bold 14px Prompt, Sarabun, sans-serif';
  ctx.textBaseline= 'middle';
  ctx.fillText('มาก่อน', PAD, y + H_TOP3 / 2);

  const presentSorted = manager.getSortedPresent();
  const medals = ['🥇','🥈','🥉'];
  const rankW  = (W - PAD * 2 - 80) / 3;
  const rankX0 = PAD + 80;
  for (let i = 0; i < 3; i++) {
    const rx = rankX0 + i * (rankW + 10);
    // box
    ctx.fillStyle   = i < presentSorted.length ? '#e8fdf1' : '#f1f5f9';
    ctx.strokeStyle = i < presentSorted.length ? '#00BF63' : '#e2e8f0';
    ctx.lineWidth   = 1.5;
    roundRect(ctx, rx, y + 14, rankW, H_TOP3 - 28, 10);
    ctx.fill(); ctx.stroke();

    ctx.font        = '22px sans-serif';
    ctx.textBaseline= 'middle';
    ctx.fillText(medals[i], rx + 12, y + H_TOP3 / 2);

    if (i < presentSorted.length) {
      const s    = presentSorted[i];
      const name = s.realName || `เลขที่ ${s.id}`;
      ctx.fillStyle = '#1e293b';
      ctx.font      = `bold 16px Prompt, Sarabun, sans-serif`;
      ctx.fillText(clip(name, rankW - 70), rx + 44, y + H_TOP3 / 2);
      if (i === 0) {
        ctx.fillStyle = '#00BF63';
        ctx.font      = 'bold 12px Prompt, Sarabun, sans-serif';
        ctx.fillText('MVP', rx + rankW - 42, y + H_TOP3 / 2);
      }
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font      = `14px Prompt, Sarabun, sans-serif`;
      ctx.fillText('รอผู้ท้าชิง', rx + 44, y + H_TOP3 / 2);
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, y + H_TOP3 - 1, W, 1);
  y += H_TOP3;

  // ── Section label ──
  ctx.fillStyle   = '#64748b';
  ctx.font        = 'bold 13px Prompt, Sarabun, sans-serif';
  ctx.textBaseline= 'middle';
  ctx.fillText('รายชื่อนักเรียน (เรียงตามลำดับการมา)', GRID_X, y + H_LABEL / 2);
  ctx.textBaseline = 'alphabetic';
  y += H_LABEL;

  // ── Student grid ──
  const nonPresent = STUDENTS.filter(s => manager.getRecord(s.id).status !== 'มา');
  const sorted     = [...presentSorted, ...nonPresent];

  sorted.forEach((s, idx) => {
    const rec   = manager.getRecord(s.id);
    const col   = idx % COLS;
    const row   = Math.floor(idx / COLS);
    const cx    = GRID_X + col * CELL_W;
    const cy    = y + row * CELL_H;
    const color = STATUS_COLORS[rec.status] || '#94A3B8';
    const bg    = BG[rec.status] || '#f1f5f9';
    const label = LABEL[rec.status] || '?';

    // Cell background
    ctx.fillStyle   = bg;
    ctx.strokeStyle = color + '80';
    ctx.lineWidth   = 1;
    roundRect(ctx, cx + 4, cy + 4, CELL_W - 8, CELL_H - 8, 10);
    ctx.fill(); ctx.stroke();

    // Top color bar
    ctx.fillStyle = color;
    roundRect(ctx, cx + 4, cy + 4, CELL_W - 8, 6, [6, 6, 0, 0]);
    ctx.fill();

    // Draw student figure
    drawFigure(ctx, cx + CELL_W / 2, cy + 46, 20, color);

    // Arrival order badge (if present)
    if (rec.status === 'มา') {
      const order = presentSorted.findIndex(p => p.id === s.id) + 1;
      ctx.beginPath();
      ctx.arc(cx + CELL_W - 18, cy + 18, 11, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle   = 'white';
      ctx.font        = 'bold 11px sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'middle';
      ctx.fillText(String(order), cx + CELL_W - 18, cy + 18);
      ctx.textAlign   = 'left';
      ctx.textBaseline= 'alphabetic';
    }

    // Student number
    ctx.fillStyle   = '#64748b';
    ctx.font        = `bold 13px Prompt, Sarabun, sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(`เลขที่ ${s.id}`, cx + CELL_W / 2, cy + 80);

    // Status label
    ctx.fillStyle   = color;
    ctx.font        = `bold 13px Prompt, Sarabun, sans-serif`;
    ctx.fillText(label, cx + CELL_W / 2, cy + 100);

    // Reason (if any)
    if (rec.reason) {
      ctx.fillStyle = '#94A3B8';
      ctx.font      = `11px Prompt, Sarabun, sans-serif`;
      ctx.fillText(clip(rec.reason, CELL_W - 16), cx + CELL_W / 2, cy + 118);
    }

    ctx.textAlign   = 'left';
    ctx.textBaseline= 'alphabetic';
  });
  y += rows * CELL_H + PAD;

  // ── Footer ──
  ctx.fillStyle   = '#94A3B8';
  ctx.font        = '13px Prompt, Sarabun, sans-serif';
  ctx.textAlign   = 'center';
  ctx.fillText(`Student Check — ${CLASS_INFO.name}`, W / 2, y + 24);
  ctx.textAlign   = 'left';

  return canvas;
}

// ─── Draw simple student figure (head + body) ───
function drawFigure(ctx, cx, cy, r, color) {
  const dark = shadeHex(color, -30);

  // Body
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.75, cy + r * 2.4);
  ctx.bezierCurveTo(cx - r * 0.75, cy + r * 1.35, cx - r * 0.4, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx + r * 0.4, cy + r, cx + r * 0.75, cy + r * 1.35, cx + r * 0.75, cy + r * 2.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Hair
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy - r * 0.1);
  ctx.quadraticCurveTo(cx, cy - r * 1.2, cx + r * 0.6, cy - r * 0.1);
  ctx.fillStyle = dark;
  ctx.fill();

  // Eyes
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.05, r * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.35, cy - r * 0.05, r * 0.22, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.3, cy + r * 0.35);
  ctx.quadraticCurveTo(cx, cy + r * 0.65, cx + r * 0.3, cy + r * 0.35);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth   = r * 0.13;
  ctx.lineCap     = 'round';
  ctx.stroke();
}

// ─── Helpers ───
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

function shadeHex(hex, pct) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + pct));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
  return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

// clip text to max pixel width
function clip(text, maxPx) {
  return text.length > 10 ? text.substring(0, 9) + '…' : text;
}
