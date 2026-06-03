// ============================================================
//  sw.js — Service Worker สำหรับ PWA
//  ทำให้แอปติดตั้งได้บน Android และรองรับ offline
// ============================================================

const CACHE_NAME = 'studentcheck-v1';

// ไฟล์ที่ต้องการ cache ไว้ใช้งาน offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/attendance.js',
  './src/config.js',
  './src/icons.js',
  './src/screenshot.js',
  './src/style.css',
  './src/ui.js',
  './assets/art/icon/logo.svg',
  './assets/art/icon/intro-logo.svg',
  './assets/art/icon/apple-touch-icon.png',
  './assets/art/icon/favicon-32x32.png',
  './assets/art/vector/student-absent.svg',
  './assets/art/vector/student-leave.svg',
  './assets/art/vector/student-present.svg',
  './assets/art/vector/student-unchecked.svg',
];

// ติดตั้ง SW — cache ไฟล์ทั้งหมด
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — ลบ cache เก่าออก
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — ดึงจาก cache ก่อน ถ้าไม่มีค่อยไป network
self.addEventListener('fetch', event => {
  // ข้ามคำขอที่ไม่ใช่ GET หรือไม่ใช่ http/https
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // cache เฉพาะ response ที่ ok
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
