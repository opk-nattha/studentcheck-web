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
      if (confirm('รีเซ็ตการเช็คชื่อทั้งหมดหรือไม่?')) {
        manager.reset();
        updateUI(null);
      }
    }
  });

  // ── PWA: Register Service Worker ─────────────────────────
  registerServiceWorker();

  // ── PWA: Android Add to Home Screen prompt ───────────────
  initInstallBanner();
});

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
  // เล็กน้อย delay เพื่อให้ CSS transition ทำงาน
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('pwa-banner--visible'));
  });
}

function hideBanner(el) {
  el.classList.remove('pwa-banner--visible');
  el.addEventListener('transitionend', () => { el.hidden = true; }, { once: true });
}
