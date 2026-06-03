// ============================================================
//  sw.js — Service Worker (PWA)
//  ⚠️  ต้องอยู่ที่ root เสมอ (scope = "/")
//      ย้ายเข้า subfolder จะทำให้ควบคุม index.html ไม่ได้
// ============================================================

const CACHE_NAME = 'studentcheck-v1';

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
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
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

// ── Fetch: cache-first ──────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response?.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
