// ============================================================
//  screenshot.js — บันทึกสรุปเป็น PNG ด้วย html2canvas
// ============================================================

import { buildCapturePanel } from './ui.js';

let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('status-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

export async function captureAndDownload(manager) {
  showToast('⏳ กำลังสร้างภาพ...');

  buildCapturePanel(manager);

  const panel = document.getElementById('capture-panel');

  // ─── ต้องให้ panel แสดงผลจริง (ไม่ใช่ visibility:hidden)
  //     ไม่เช่นนั้น html2canvas จะ render ได้แค่สีขาวเปล่า
  panel.style.position   = 'fixed';
  panel.style.left       = '0';
  panel.style.top        = '0';
  panel.style.zIndex     = '9998';
  panel.style.visibility = 'visible';  // ต้อง visible!
  panel.style.opacity    = '1';

  // รอ fonts + layout render
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 200));

  try {
    const canvas = await html2canvas(panel, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width:        panel.scrollWidth,
      height:       panel.scrollHeight,
      windowWidth:  panel.scrollWidth,
      windowHeight: panel.scrollHeight,
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
    // ซ่อนกลับหลัง capture เสร็จ
    panel.style.left       = '-9999px';
    panel.style.top        = '0';
    panel.style.zIndex     = '-1';
    panel.style.visibility = 'hidden';
    panel.style.opacity    = '0';
  }
}
