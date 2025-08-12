// Bump on each deploy to bust old caches
const CACHE_NAME = 'site-cache-v3';

// Auto-detect the base path ('' for user site, '/<repo>' for project site)
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');

// List only files you actually have at those paths
const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/offline.html`,
  // add real assets as needed, e.g.:
  // `${BASE}/styles.css`,
  // `${BASE}/main.js`,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Robust precache: skip any missing/404 files instead of failing install
    for (const url of ASSETS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) await cache.put(url, res.clone());
        else console.warn('[SW] Skip precache (non-200):', url, res.status);
      } catch (err) {
        console.warn('[SW] Skip precache (error):', url, err);
      }
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k)));
  })());
  self.clients.claim();
});

// Network-first for HTML, cache-first for others, with offline fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match(`${BASE}/offline.html`);
      }
    })());
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try { return await fetch(req); } catch { return cached; }
    })());
  }
});

const CACHE="pepper-slayer-v2";
const ASSETS=["./","./index.html","./manifest.webmanifest","./service-worker.js","./assets/sprites/chef_placeholder_spritesheet.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})
