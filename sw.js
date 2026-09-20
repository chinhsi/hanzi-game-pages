// Service Worker：音檔 cache-first 永久快取 + 背景預抓。改音檔內容時要一併升 CACHE 版本（或換檔名）
const CACHE = 'hanzi-audio-v2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (!u.includes('/audio/') || !u.endsWith('.mp3')) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request); if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) e.waitUntil(c.put(e.request, r.clone())); // 寫入要撐到完成
    return r;
  }));
});
self.addEventListener('message', e => {
  if (e.data?.type !== 'precache') return;
  const urls = e.data.urls.slice();
  e.waitUntil(caches.open(CACHE).then(async c => {
    const worker = async () => { while (urls.length) { const u = urls.shift(); if (await c.match(u)) continue; try { const r = await fetch(u); if (r.ok) await c.put(u, r); } catch {} } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }));
});
