const CACHE = 'cinebase-landing-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './three-bg.js',
  './three-scan.js',
  './manifest.webmanifest',
  './img/logo.svg',
  './img/icon.jpg',
  './img/screen-home.jpg',
  './img/screen-editor.jpg',
  './img/screen-looks.jpg',
  './img/screen-render.jpg',
  './img/screen-result.jpg',
  './img/screen-library.jpg',
  './img/hero-banner.png',
  './img/demo-after.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
