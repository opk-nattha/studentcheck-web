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

  // [SECURITY FIX] ใช้ textContent แทน innerHTML เพื่อป้องกัน XSS
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';

  const msg = document.createElement('p');
  msg.className = 'confirm-message';
  msg.textContent = message; // ← safe: ไม่ parse HTML

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'confirm-btn-cancel';
  cancelBtn.textContent = 'ยกเลิก';

  const okBtn = document.createElement('button');
  okBtn.className = 'confirm-btn-ok';
  okBtn.textContent = 'รีเซ็ต';

  actions.append(cancelBtn, okBtn);
  dialog.append(msg, actions);
  overlay.append(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('confirm-overlay--visible'));

  function close() {
    overlay.classList.remove('confirm-overlay--visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  // [BUG FIX] เดิม onKey listener ไม่ถูก removeEventListener
  // เมื่อกด cancelBtn / okBtn / backdrop → listener สะสมทุกครั้งที่เปิด dialog
  // แก้: เรียก removeEventListener ใน *ทุก* เส้นทางที่ปิด dialog
  const onKey = e => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  cancelBtn.addEventListener('click', () => {
    close();
    document.removeEventListener('keydown', onKey); // ← FIX: remove listener
  });

  okBtn.addEventListener('click', () => {
    close();
    document.removeEventListener('keydown', onKey); // ← FIX: remove listener
    onConfirm();
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      close();
      document.removeEventListener('keydown', onKey); // ← FIX: remove listener
    }
  });
}

// ─────────────────────────────────────────────────────────────
//  Service Worker
// ─────────────────────────────────────────────────────────────
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // [FIX] ถ้า document โหลดเสร็จแล้ว (readyState === 'complete') ให้ register ทันที
  // ป้องกันกรณี 'load' event ยิงก่อน listener นี้ถูกผูก (เช่นใน bfcache restore)
  if (document.readyState === 'complete') {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(err => console.warn('[SW] Registration failed:', err));
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .catch(err => console.warn('[SW] Registration failed:', err));
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  Android Install Banner (beforeinstallprompt)
// ─────────────────────────────────────────────────────────────
function initInstallBanner() {
  const banner     = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');

  if (!banner || !installBtn || !dismissBtn) return;

  const DISMISS_KEY = 'pwa-install-dismissed';
  if (sessionStorage.getItem(DISMISS_KEY)) return;

  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return; // iOS

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner(banner);
  });

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

  dismissBtn.addEventListener('click', () => {
    hideBanner(banner);
    sessionStorage.setItem(DISMISS_KEY, '1');
  });

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
