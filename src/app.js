// ============================================================
//  app.js — Entry point หลัก
//  เชื่อม AttendanceManager + UI + Screenshot + PWA
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
    // BUG FIX: เปลี่ยนจาก confirm() เป็น custom dialog
    // confirm() อาจถูก block ใน standalone PWA mode บางเบราว์เซอร์
    if (e.target.closest('#btn-reset')) {
      showConfirmDialog('รีเซ็ตการเช็คชื่อทั้งหมดหรือไม่?', () => {
        manager.reset();
        updateUI(null);
      });
    }
  });

  // ── PWA: Register Service Worker ─────────────────────────
  registerServiceWorker();

  // ── PWA: Android Add to Home Screen prompt ───────────────
  initInstallBanner();
});

// ─────────────────────────────────────────────────────────────
//  Custom Confirm Dialog (แทน window.confirm ที่ถูก block ใน PWA)
// ─────────────────────────────────────────────────────────────
function showConfirmDialog(message, onConfirm) {
  // ป้องกัน dialog ซ้อนกัน
  if (document.querySelector('.confirm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="confirm-btn-cancel">ยกเลิก</button>
        <button class="confirm-btn-ok">รีเซ็ต</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('confirm-overlay--visible'));

  function close() {
    overlay.classList.remove('confirm-overlay--visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  overlay.querySelector('.confirm-btn-cancel').addEventListener('click', close);
  overlay.querySelector('.confirm-btn-ok').addEventListener('click', () => {
    close();
    onConfirm();
  });
  // กด backdrop เพื่อปิด
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  // กด Escape เพื่อปิด
  const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// ─────────────────────────────────────────────────────────────
//  Service Worker
// ─────────────────────────────────────────────────────────────
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// ─────────────────────────────────────────────────────────────
//  Android Install Banner (beforeinstallprompt)
// ─────────────────────────────────────────────────────────────
function initInstallBanner() {
  const banner      = document.getElementById('pwa-install-banner');
  const installBtn  = document.getElementById('pwa-install-btn');
  const dismissBtn  = document.getElementById('pwa-dismiss-btn');

  if (!banner || !installBtn || !dismissBtn) return;

  // ไม่แสดง banner ถ้าผู้ใช้กด dismiss ไปแล้ว
  const DISMISS_KEY = 'pwa-install-dismissed';
  if (sessionStorage.getItem(DISMISS_KEY)) return;

  // ไม่แสดงถ้าเปิดในโหมด standalone (ติดตั้งแล้ว)
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return; // iOS

  let deferredPrompt = null;

  // Chrome/Android จะยิง event นี้เมื่อแอปผ่านเงื่อนไข PWA
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();           // ระงับ default mini-infobar
    deferredPrompt = e;
    showBanner(banner);
  });

  // กดปุ่ม "ติดตั้ง"
  installBtn.addEventListener('click', async () => {
    hideBanner(banner);
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      sessionStorage.setItem(DISMISS_KEY, '1');
    }
  });

  // กดปุ่ม "✕"
  dismissBtn.addEventListener('click', () => {
    hideBanner(banner);
    sessionStorage.setItem(DISMISS_KEY, '1');
  });

  // ซ่อน banner เมื่อติดตั้งสำเร็จ
  window.addEventListener('appinstalled', () => {
    hideBanner(banner);
    deferredPrompt = null;
  });
}

function showBanner(el) {
  el.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('pwa-banner--visible'));
  });
}

function hideBanner(el) {
  el.classList.remove('pwa-banner--visible');
  el.addEventListener('transitionend', () => { el.hidden = true; }, { once: true });
}
