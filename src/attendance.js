// ============================================================
//  attendance.js — จัดการสถานะการเช็คชื่อ
//  Port มาจาก AttendanceManager.cs + ButtonCheck.cs
// ============================================================

// [BUG FIX] เพิ่ม RANK_PHRASES เข้า import
// เดิม import เฉพาะ STUDENTS ทำให้ getTopN() ที่ใช้ RANK_PHRASES
// throw ReferenceError: RANK_PHRASES is not defined ทันทีที่ถูกเรียก
import { STUDENTS, RANK_PHRASES } from './config.js';

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
        time: null,   // DateTime.MaxValue equivalent = null (late)
        studentRef: s,
      };
    });
  }

  // ===== ตั้งสถานะ (จาก ButtonCheck.SetStatus) =====
  setStatus(id, status) {
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
    rec.reason = reason;
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

  // ===== นักเรียนที่มา เรียงตาม lastActionTime ก่อน (UpdateAllScreens logic) =====
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

  // ===== Top N (ตัดเป็น 3 จาก 6 ตาม spec) =====
  // [BUG FIX] ก่อนหน้า RANK_PHRASES ไม่ได้ import → ReferenceError
  // ตอนนี้ import ถูกต้องแล้วด้านบน
  getTopN(n = 3) {
    const present = this.getSortedPresent();
    return present.slice(0, n).map((s, i) => {
      const displayName = s.realName || `เลขที่ ${s.id}`;
      const phrase = RANK_PHRASES[i] || '{name}';
      return phrase.replace('{name}', displayName);
    });
  }

  // ===== getReasonText (จาก ButtonCheck.GetReasonText + อัปเดตข้อความ) =====
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
    this.listeners.forEach(fn => fn(id));
  }
}
