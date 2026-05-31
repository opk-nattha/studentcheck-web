// ============================================================
//  app.js — Entry point หลัก
//  ต่อ AttendanceManager, UI, Screenshot เข้าด้วยกัน
// ============================================================

import { AttendanceManager } from './attendance.js';
import { initUI, updateUI } from './ui.js';
import { captureAndDownload } from './screenshot.js';

// ===== Init =====
const manager = new AttendanceManager();

// Subscribe to changes
manager.onChange(changedId => {
  updateUI(changedId);
});

// Build UI after splash (delay matches animation)
window.addEventListener('DOMContentLoaded', () => {
  initUI(manager);
  updateUI(null);

  // Wire up buttons
  document.addEventListener('click', e => {
    if (e.target.closest('#btn-save')) {
      captureAndDownload(manager);
    }
    if (e.target.closest('#btn-reset')) {
      if (confirm('รีเซ็ตการเช็คชื่อทั้งหมด?')) {
        manager.reset();
        updateUI(null);
      }
    }
  });
});
