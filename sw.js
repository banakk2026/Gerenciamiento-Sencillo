/* Guardado del sitio para abrir sin señal. Con internet siempre carga la versión nueva. */
const V = 'gv-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'favicon.ico', 'favicon-48.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const netFirst = (req, ms) => new Promise((ok, no) => {
  const t = setTimeout(() => no(new Error('lento')), ms);
  fetch(req, { cache: 'no-store' }).then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); });
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {          // tipografías: guardar la primera vez
    e.respondWith(caches.open(V).then(c => c.match(req).then(m => {
      const f = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => m);
      return m || f;
    })));
    return;
  }
  if (u.origin !== location.origin) return;                            // el servicio de acceso nunca pasa por acá
  if (req.mode === 'navigate' || /\/index\.html$/.test(u.pathname)) {
    e.respondWith(netFirst(req, 4000).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put('index.html', cp)); }
      return r;
    }).catch(() => caches.match('index.html').then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(m => {
    const f = fetch(req).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; });
    return m || f;
  }));
});
