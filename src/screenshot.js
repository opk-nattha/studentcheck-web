// ============================================================
//  screenshot.js — บันทึกสรุปเป็น PNG ด้วย html2canvas
//  Port จาก indexU captureAsPNG()
//  ใช้ capture-panel HTML จาก buildCapturePanel() ใน ui.js
// ============================================================

import { buildCapturePanel } from './ui.js';

const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

// ─── Toast helper ───
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

  // Build capture panel HTML
  buildCapturePanel(manager);

  const panel = document.getElementById('capture-panel');
  panel.style.left       = '0';
  panel.style.top        = '0';
  panel.style.zIndex     = '9998';
  panel.style.visibility = 'hidden';

  // Wait for fonts & layout
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 150));

  try {
    const canvas = await html2canvas(panel, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: panel.scrollWidth,
      height: panel.scrollHeight,
      windowWidth: panel.scrollWidth,
    });

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      const now = new Date();
      const dd  = String(now.getDate()).padStart(2, '0');
      const mo  = String(now.getMonth() + 1).padStart(2, '0');
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
  } finally {
    panel.style.left       = '-9999px';
    panel.style.top        = '0';
    panel.style.zIndex     = '-1';
    panel.style.visibility = 'visible';
  }
}
