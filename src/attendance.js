// ============================================================
//  attendance.js — จัดการสถานะการเช็คชื่อ
//  Port มาจาก AttendanceManager.cs + ButtonCheck.cs
// ============================================================

import { STUDENTS, RANK_PHRASES } from './config.js';

// [VALIDATION] ค่าสถานะที่ถูกต้อง — ป้องกัน arbitrary string เข้ามาใน records
const VALID_STATUSES = new Set(['มา', 'ขาด', 'ลา', 'ไม่ได้เช็ค']);

export class AttendanceManager {
  constructor() {
    // records: { '01': { status, reason, time } }
    this.records = {};
    this.listeners = [];

    // Initialize ทุกคน = ไม่ได้เช็ค
    STUDENTS.forEach(s => {
      this.records[s.id] = {
        status: 'ไม่ได้เช็ค',
        reason: '',
        time: null,
        studentRef: s,
      };
    });
  }

  // ===== ตั้งสถานะ (จาก ButtonCheck.SetStatus) =====
  setStatus(id, status) {
    // [BUG FIX] ตรวจสอบว่า status เป็นค่าที่ถูกต้อง
    // เดิม: รับ string ใดก็ได้ → UI แตกเมื่อ statusClass ไม่ตรงกับ CSS class
    if (!VALID_STATUSES.has(status)) {
      console.warn(`[AttendanceManager] Invalid status: "${status}"`);
      return;
    }

    const rec = this.records[id];
    if (!rec) return;

    rec.status = status;
    rec.time = (status === 'ไม่ได้เช็ค') ? null : new Date();

    this._notify(id);
  }

  // ===== ตั้งเหตุผล (จาก ButtonCheck.ช่องกิจกรรม) =====
  setReason(id, reason) {
    const rec = this.records[id];
    if (!rec) return;

    // [VALIDATION] จำกัดความยาว reason ให้สอดคล้องกับ maxlength="40" ใน HTML
    rec.reason = String(reason).slice(0, 40);
    this._notify(id);
  }

  // ===== ดึงข้อมูลนักเรียน =====
  getRecord(id) {
    return this.records[id];
  }

  // ===== สรุปยอด (UpdateCountSummary) =====
  getCounts() {
    const counts = { มา: 0, ขาด: 0, ลา: 0, ไม่ได้เช็ค: 0 };
    Object.values(this.records).forEach(r => counts[r.status]++);
    return counts;
  }

  // ===== นักเรียนที่มา เรียงตาม lastActionTime ก่อน =====
  getSortedPresent() {
    return STUDENTS
      .filter(s => this.records[s.id].status === 'มา')
      .sort((a, b) => {
        const ta = this.records[a.id].time?.getTime() ?? Infinity;
        const tb = this.records[b.id].time?.getTime() ?? Infinity;
        return ta - tb;
      });
  }

  // ===== นักเรียนที่ไม่ได้มา เรียงตาม index เดิม =====
  getNonPresent() {
    return STUDENTS.filter(s => this.records[s.id].status !== 'มา');
  }

  // ===== Top N (ตัดเป็น 3 ตาม spec) =====
  getTopN(n = 3) {
    const present = this.getSortedPresent();
    return present.slice(0, n).map((s, i) => {
      const displayName = s.realName || `เลขที่ ${s.id}`;
      const phrase = RANK_PHRASES[i] || '{name}';
      return phrase.replace('{name}', displayName);
    });
  }

  // ===== getReasonText =====
  getDisplayText(id) {
    const rec = this.records[id];
    if (!rec || rec.status === 'ไม่ได้เช็ค') return '';
    if (!rec.reason) return rec.status;
    return `${rec.status} (${rec.reason})`;
  }

  // ===== Reset ทั้งหมด =====
  reset() {
    STUDENTS.forEach(s => {
      this.records[s.id] = {
        status: 'ไม่ได้เช็ค',
        reason: '',
        time: null,
        studentRef: s,
      };
    });
    this._notify(null);
  }

  // ===== Event system =====
  onChange(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  _notify(id) {
    // สำเนา listeners ก่อน iterate เพื่อป้องกัน re-entrant mutation
    [...this.listeners].forEach(fn => fn(id));
  }
}
