// ============================================================
//  sw.js — Service Worker (PWA)
//  ⚠️  ต้องอยู่ที่ root เสมอ (scope = "/")
//      ย้ายเข้า subfolder จะทำให้ควบคุม index.html ไม่ได้
//
//  ⚠️  เมื่อ deploy เวอร์ชันใหม่: ต้องเปลี่ยน CACHE_NAME
//      เช่น studentcheck-v3, studentcheck-v4, ...
//      เพื่อให้ activate handler ลบ cache เก่าและ client
//      ได้รับไฟล์ใหม่แทนที่จะ serve จาก stale cache
// ============================================================

const CACHE_NAME = 'studentcheck-v2';

// ── ไฟล์ที่ cache ไว้ใช้งาน offline ──────────────────────────
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',

  // source
  './src/app.js',
  './src/attendance.js',
  './src/config.js',
  './src/icons.js',
  './src/screenshot.js',
  './src/style.css',
  './src/ui.js',

  // icons (PNG/ICO)
  './assets/icons/favicon.ico',
  './assets/icons/favicon-32x32.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',

  // brand images (SVG)
  './assets/icons/icon.svg',
  './assets/images/intro-logo.svg',

  // student status vectors (SVG)
  './assets/vectors/student-present.svg',
  './assets/vectors/student-absent.svg',
  './assets/vectors/student-leave.svg',
  './assets/vectors/student-unchecked.svg',
];

// ── Install: cache ไฟล์ทั้งหมด ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => {
        // [FIX] log error แทนที่จะ silent fail
        // ถ้า addAll ล้มเหลว (เช่น ไฟล์ไม่มี) Service Worker จะไม่ install
        console.error('[SW] Install failed:', err);
        throw err;
      })
  );
  self.skipWaiting();
});

// ── Activate: ลบ cache เวอร์ชันเก่า ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-First สำหรับ HTML, Cache-First สำหรับไฟล์อื่น ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Network-First สำหรับ HTML (index.html / root)
  const isHTML = url.pathname === '/' ||
                 url.pathname.endsWith('/index.html') ||
                 url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response?.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // offline fallback
    );
    return;
  }

  // Cache-First สำหรับไฟล์อื่น (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // cache ทั้ง same-origin ('basic') และ cross-origin ('cors') เช่น Google Fonts
        if (response?.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
