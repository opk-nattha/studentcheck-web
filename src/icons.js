// ============================================================
//  icons.js — SVG vector นักเรียน (สไตล์ indexU)
//  Vector ต้นฉบับอยู่ที่ assets/vectors/student-*.svg
//  ฟังก์ชันนี้ generate inline SVG ที่ปรับสีตามสถานะ
// ============================================================

// [REFACTOR] ใช้ shadeColor จาก config.js แทนการ duplicate ฟังก์ชัน
import { STATUS_COLORS, shadeColor } from './config.js';

// ─── Memoize SVG ตามสถานะ ───
// [PERFORMANCE FIX] เดิมสร้าง SVG string ใหม่ทุกครั้งที่เรียก
// แต่ค่าที่เป็นไปได้มีแค่ 4 สถานะ → cache ครั้งแรก แล้วคืนค่าเดิม
// ประหยัด string interpolation + DOM parse สำหรับ 40 cards × ทุก update
const _svgCache = {};

/**
 * สร้าง inline SVG นักเรียน
 * @param {string} status - 'มา' | 'ลา' | 'ขาด' | 'ไม่ได้เช็ค'
 * @returns {string} SVG HTML string
 */
export function createStudentSVG(status = 'ไม่ได้เช็ค') {
  if (_svgCache[status]) return _svgCache[status];   // cache hit

  const color = STATUS_COLORS[status] || STATUS_COLORS['ไม่ได้เช็ค'];
  const dark  = shadeColor(color, -30);

  const svg = `<svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
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

  _svgCache[status] = svg;
  return svg;
}
