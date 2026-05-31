// ============================================================
//  icons.js — SVG ไอคอนนักเรียน (เปลี่ยนสีตามสถานะ)
//  ไอคอนรูปแบบเดียวกันหมด เปลี่ยนแค่สี 3 สี + default
// ============================================================

import { STATUS_COLORS } from './config.js';

// ===== สร้าง SVG นักเรียน (uniform color ตามสถานะ) =====
export function createStudentSVG(status = 'ไม่ได้เช็ค') {
  const color = STATUS_COLORS[status] || STATUS_COLORS['ไม่ได้เช็ค'];

  // สีผิว/รายละเอียด
  const skin    = '#FFD6A5';
  const dark    = '#1a1a2e';
  const pants   = '#2d3a6e';
  const shoes   = '#111111';
  const white   = '#ffffff';
  const hair    = '#2c1810';

  // lighten/darken สีหลักสำหรับ shading
  const colorLight = lighten(color, 25);
  const colorDark  = darken(color, 20);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 80" fill="none">
  <!-- Shadow -->
  <ellipse cx="28" cy="78" rx="14" ry="3" fill="rgba(0,0,0,0.10)"/>

  <!-- Hair back -->
  <ellipse cx="28" cy="18" rx="13" ry="13.5" fill="${hair}"/>

  <!-- Neck -->
  <rect x="24" y="28" width="8" height="7" rx="2" fill="${skin}"/>

  <!-- Body / Uniform -->
  <path d="M10 62 C10 48 16 43 28 41 C40 43 46 48 46 62 Z" fill="${color}"/>

  <!-- Collar white -->
  <path d="M22 42 L28 52 L34 42" fill="${white}" stroke="${colorDark}" stroke-width="0.8"/>

  <!-- Uniform detail line -->
  <line x1="28" y1="50" x2="28" y2="62" stroke="${colorDark}" stroke-width="1" stroke-dasharray="2,2"/>

  <!-- Left arm -->
  <path d="M16 46 L8 61 Q11 64 14 63 L20 50 Z" fill="${colorLight}" stroke="${colorDark}" stroke-width="0.8"/>
  <!-- Right arm -->
  <path d="M40 46 L48 61 Q45 64 42 63 L36 50 Z" fill="${colorLight}" stroke="${colorDark}" stroke-width="0.8"/>

  <!-- Left hand -->
  <ellipse cx="10.5" cy="64" rx="3.5" ry="3" fill="${skin}"/>
  <!-- Right hand -->
  <ellipse cx="45.5" cy="64" rx="3.5" ry="3" fill="${skin}"/>

  <!-- Pants -->
  <path d="M16 62 L17 74 Q22 76 26 74 L28 66 L30 74 Q34 76 39 74 L40 62 Z" fill="${pants}"/>

  <!-- Shoes -->
  <ellipse cx="21" cy="76" rx="6" ry="3.5" fill="${shoes}"/>
  <ellipse cx="35" cy="76" rx="6" ry="3.5" fill="${shoes}"/>

  <!-- Head -->
  <circle cx="28" cy="19" r="13" fill="${skin}" stroke="${dark}" stroke-width="1"/>

  <!-- Eyes -->
  <ellipse cx="23" cy="18" rx="2" ry="2.5" fill="${dark}"/>
  <ellipse cx="33" cy="18" rx="2" ry="2.5" fill="${dark}"/>
  <!-- Eye shine -->
  <circle cx="23.8" cy="17" r="0.7" fill="${white}"/>
  <circle cx="33.8" cy="17" r="0.7" fill="${white}"/>

  <!-- Smile -->
  <path d="M23 23 Q28 27 33 23" fill="none" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Hair front / cap brim -->
  <path d="M15 15 Q28 5 41 15 Q40 8 28 6 Q16 8 15 15 Z" fill="${hair}"/>

  <!-- Uniform body outline -->
  <path d="M10 62 C10 48 16 43 28 41 C40 43 46 48 46 62" fill="none" stroke="${colorDark}" stroke-width="1.2"/>

  ${getStatusOverlay(status, color)}
</svg>`;
}

// ===== Overlay สัญลักษณ์ตามสถานะ =====
function getStatusOverlay(status, color) {
  switch (status) {
    case 'มา':
      return `<!-- Check badge -->
  <circle cx="44" cy="10" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
  <path d="M40 10 L43 13 L48 7" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    case 'ขาด':
      return `<!-- X badge -->
  <circle cx="44" cy="10" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
  <path d="M41 7 L47 13 M47 7 L41 13" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>`;

    case 'ลา':
      return `<!-- ! badge -->
  <circle cx="44" cy="10" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
  <text x="44" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="sans-serif">!</text>`;

    default:
      return `<!-- Question mark badge -->
  <circle cx="44" cy="10" r="8" fill="#AAAAAA" stroke="white" stroke-width="1.5"/>
  <text x="44" y="14" text-anchor="middle" font-size="9" font-weight="bold" fill="white" font-family="sans-serif">?</text>`;
  }
}

// ===== Color utility =====
function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darken(hex, amount) {
  return lighten(hex, -amount);
}
