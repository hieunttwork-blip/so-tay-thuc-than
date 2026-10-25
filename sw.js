// Service worker: lưu game vào bộ nhớ đệm để chơi được khi không có mạng. Đổi VERSION mỗi khi phát hành bản mới.
const VERSION = 'v3-7';
const CACHE = `sttt-${VERSION}`;
self.addEventListener('install', (e) => {
  e.waitUntil(fetch('./cache-list.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : ['./', './index.html'])).catch(() => ['./', './index.html'])
    .then((list) => caches.open(CACHE).then((c) => c.addAll(list))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('sttt-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
