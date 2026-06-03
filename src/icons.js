// ============================================================
//  icons.js — SVG vector นักเรียน (สไตล์ indexU)
//  Vector ต้นฉบับอยู่ที่ assets/vectors/student-*.svg
//  ฟังก์ชันนี้ generate inline SVG ที่ปรับสีตามสถานะ
// ============================================================

import { STATUS_COLORS } from './config.js';

/**
 * Vector paths นักเรียน — ดึงจาก assets/vectors/student-*.svg
 * สไตล์: simple iconic character (head + body + collar)
 * viewBox: 0 0 40 52
 */

// ─── shade utility (ตาม indexU shadeColor) ───
function shadeColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + pct));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + pct));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + pct));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * สร้าง inline SVG นักเรียน
 * Vector base อ้างอิงจาก assets/vectors/student-unchecked.svg (รูปทรง)
 * สีปรับตามสถานะผ่าน STATUS_COLORS
 *
 * @param {string} status - 'มา' | 'ลา' | 'ขาด' | 'ไม่ได้เช็ค'
 * @returns {string} SVG HTML string
 */
export function createStudentSVG(status = 'ไม่ได้เช็ค') {
  const color = STATUS_COLORS[status] || STATUS_COLORS['ไม่ได้เช็ค'];
  const dark  = shadeColor(color, -30);  // สีผมเข้มกว่าตัว

  return `<svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
  <!-- Head -->
  <circle cx="20" cy="14" r="12" fill="${color}"/>
  <!-- Hair -->
  <path d="M8 12 Q8 2 20 2 Q32 2 32 12" fill="${dark}"/>
  <!-- Eyes -->
  <circle cx="15.5" cy="13" r="2.2" fill="rgba(255,255,255,0.92)"/>
  <circle cx="24.5" cy="13" r="2.2" fill="rgba(255,255,255,0.92)"/>
  <!-- Smile -->
  <path d="M14.5 18.5 Q20 22 25.5 18.5" stroke="rgba(255,255,255,0.88)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Body (uniform) -->
  <path d="M5 34 C5 27 12 25 20 25 C28 25 35 27 35 34 L36 51 Q36 52 34 52 L6 52 Q4 52 4 51 Z" fill="${color}"/>
  <!-- Collar -->
  <path d="M17 25 L20 29.5 L23 25" fill="rgba(255,255,255,0.28)"/>
</svg>`;
}
