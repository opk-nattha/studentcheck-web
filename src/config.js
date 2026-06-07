// ============================================================
//  config.js — ตั้งค่านักเรียนและข้อมูลต่างๆ
//  แก้ชื่อ realName ตรงนี้ได้เลย
// ============================================================

export const CLASS_INFO = {
  name: 'PKC 505',
  subtitle: 'เช็คชื่อเข้าแถว',
};

// สีสถานะ — ตรงกับ indexU / Unity เดิม
export const STATUS_COLORS = {
  'มา':         '#00BF63',
  'ขาด':        '#FF4F4F',
  'ลา':         '#FFB000',
  'ไม่ได้เช็ค': '#94A3B8',
};

// สี background ของแต่ละสถานะ
export const STATUS_BG = {
  'มา':         '#e8fdf1',
  'ลา':         '#fff8e6',
  'ขาด':        '#fff0f0',
  'ไม่ได้เช็ค': '#f1f5f9',
};

// label สั้นสำหรับแสดงผล
export const STATUS_LABELS = {
  'มา':         'มา',
  'ลา':         'ลา',
  'ขาด':        'ขาด',
  'ไม่ได้เช็ค': 'ไม่เช็ค',
};

// ชื่อวันภาษาไทย
export const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

// คำแซว/ชื่อเล่น อันดับ 1-3
export const RANK_PHRASES = [
  '{name} 🏆 MVP',
  '{name} 🥈',
  '{name} 🥉',
];

// ─── Shade utility ───────────────────────────────────────────
// [BUG FIX] เพิ่ม validation hex format ก่อน parseInt
// เดิม: ถ้า hex เป็น undefined หรือรูปแบบผิด → parseInt คืน NaN
//        → สีที่ได้เป็น '#NaNNaNNaN' → Canvas ไม่วาดสี silently
export function shadeColor(hex, pct) {
  const clean = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    console.warn(`[shadeColor] Invalid hex: "${hex}", using fallback`);
    return hex || '#94A3B8';
  }
  const n = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + pct));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0x00ff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0x0000ff) + pct));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// รายชื่อนักเรียน 40 คน — แก้ realName เพื่อแสดงชื่อจริง
export const STUDENTS = [
  { id: '01', realName: '' },
  { id: '02', realName: '' },
  { id: '03', realName: '' },
  { id: '04', realName: '' },
  { id: '05', realName: '' },
  { id: '06', realName: '' },
  { id: '07', realName: '' },
  { id: '08', realName: '' },
  { id: '09', realName: '' },
  { id: '10', realName: '' },
  { id: '11', realName: '' },
  { id: '12', realName: '' },
  { id: '13', realName: '' },
  { id: '14', realName: '' },
  { id: '15', realName: '' },
  { id: '16', realName: '' },
  { id: '17', realName: '' },
  { id: '18', realName: '' },
  { id: '19', realName: '' },
  { id: '20', realName: '' },
  { id: '21', realName: '' },
  { id: '22', realName: '' },
  { id: '23', realName: '' },
  { id: '24', realName: '' },
  { id: '25', realName: '' },
  { id: '26', realName: '' },
  { id: '27', realName: '' },
  { id: '28', realName: '' },
  { id: '29', realName: '' },
  { id: '30', realName: '' },
  { id: '31', realName: '' },
  { id: '32', realName: '' },
  { id: '33', realName: '' },
  { id: '34', realName: '' },
  { id: '35', realName: '' },
  { id: '36', realName: '' },
  { id: '37', realName: '' },
  { id: '38', realName: '' },
  { id: '39', realName: '' },
  { id: '40', realName: '' },
];
