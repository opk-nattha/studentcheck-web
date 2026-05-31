// ============================================================
//  app.js — Entry point หลัก
//  เชื่อม AttendanceManager + UI + Screenshot
// ============================================================

import { AttendanceManager } from './attendance.js';
import { initUI, updateUI } from './ui.js';
import { captureAndDownload } from './screenshot.js';

const manager = new AttendanceManager();

manager.onChange(changedId => {
  updateUI(changedId);
});

window.addEventListener('DOMContentLoaded', () => {
  initUI(manager);
  updateUI(null);

  // Event delegation on header buttons (built dynamically by ui.js)
  document.addEventListener('click', e => {
    if (e.target.closest('#btn-save')) {
      captureAndDownload(manager);
    }
    if (e.target.closest('#btn-reset')) {
      if (confirm('รีเซ็ตการเช็คชื่อทั้งหมดหรือไม่?')) {
        manager.reset();
        updateUI(null);
      }
    }
  });
});
