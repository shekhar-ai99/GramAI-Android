// GramAI service worker: makes the app load and work offline.
// App shell + content: cache first, refreshed in the background. news.json: network first, cache as fallback.
const V = 'gramai-v3';
const SHELL = ['./', 'index.html', 'app.js', 'art.js', 'logic.js', 'summary.js', 'llm.js', 'app.css', 'i18n.json', 'icon.svg', 'manifest.webmanifest',
  'data/advisory.json', 'data/livestock.json', 'data/climate.json', 'data/harvest.json', 'data/news.json',
  '../languages/domain_config.json', '../languages/en/tips.json', '../languages/en/calendar.json', '../languages/en/schemes.json', '../languages/en/shop.json',
  '../languages/or/tips.json', '../languages/or/calendar.json', '../recommendations/recommendations.json', '../languages/or/recommendations.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;            // weather API etc. go straight to the network
  if (url.pathname.endsWith('/data/news.json')) {                                 // network first
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {                                 // cache first, refresh in background
    const net = fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
