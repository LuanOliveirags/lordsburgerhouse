/* ============================================================
   LORD'S BURGER HOUSE — Service Worker  (sw.js)
   Versão: 1.0  |  Estratégias: Cache First / Network First / SWR
   ============================================================

   ESTRATÉGIAS POR TIPO DE RECURSO
   ─────────────────────────────────────────────────────────────
   HTML (navegação)        → Network First  + fallback offline.html
   CSS / JS locais         → Stale While Revalidate (sempre fresco sem bloquear)
   Imagens locais (logos)  → Cache First   (estáticas, raramente mudam)
   Firebase Storage imgs   → Cache First   (produto, TTL 7d)
   Hero (Unsplash)         → Cache First   (TTL 7d, evita re-download)
   Google Fonts CSS        → Stale While Revalidate
   Google Fonts arquivos   → Cache First   (URLs versionadas, seguro)
   Firebase SDK (gstatic)  → Stale While Revalidate
   Firebase APIs           → NUNCA interceptar (Firestore, Auth, Functions)
   ────────────────────────────────────────────────────────────── */

const CACHE_VERSION = 'v5';
const STATIC_CACHE  = `lords-static-${CACHE_VERSION}`;
const PAGES_CACHE   = `lords-pages-${CACHE_VERSION}`;
const IMAGES_CACHE  = `lords-images-${CACHE_VERSION}`;
const FONTS_CACHE   = `lords-fonts-${CACHE_VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE, FONTS_CACHE];

/* URLs relativas ao escopo do SW — resolvidas em tempo de instalação */
const PRECACHE_ASSETS = [
  './',
  './offline.html',
  './manifest.json',
  './assets/css/theme.css',
  './assets/css/style.css',
  './assets/css/panel.css',
  './assets/js/firebase-config.js',
  './assets/js/firebase-store.js',
  './assets/js/app.js',
  './assets/js/shared/constants.js',
  './assets/js/shared/sanitizer.js',
  './assets/js/shared/formatters.js',
  './assets/js/shared/toast.js',
  './assets/js/shared/sidebar.js',
  './assets/js/shared/settings.js',
  './assets/js/shared/loyalty.js',
  './assets/images/logos/logo.png',
  './assets/images/logos/icon-192.png',
  './assets/images/logos/icon-512.png',
  './assets/images/logos/icon-maskable-192.png',
  './assets/images/logos/icon-maskable-512.png',
  './pages/auth/login.html',
  './pages/auth/register.html',
  './pages/admin/dashboard.html',
  './pages/admin/orders.html',
  './pages/admin/products.html',
  './pages/admin/users.html',
  './pages/admin/analytics.html',
  './pages/admin/settings.html',
  './pages/admin/loyalty.html',
  './pages/attendant/dashboard.html',
  './pages/customer/orders.html',
  './pages/checkout.html',
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Precache error:', err))
  );
});

/* ── ACTIVATE ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ROUTING ───────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* 1. Nunca interceptar APIs do Firebase */
  if (isFirebaseApi(url)) return;

  /* 2. Firebase Storage (imagens de produtos) → Cache First */
  if (url.hostname === 'firebasestorage.googleapis.com') {
    event.respondWith(cacheFirst(req, IMAGES_CACHE));
    return;
  }

  /* 3. Unsplash / hero externo → Cache First */
  if (url.hostname.includes('unsplash.com')) {
    event.respondWith(cacheFirst(req, IMAGES_CACHE));
    return;
  }

  /* 4. Google Fonts CSS → Stale While Revalidate */
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(req, FONTS_CACHE));
    return;
  }

  /* 5. Google Fonts arquivos (woff2) → Cache First (URLs versionadas) */
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, FONTS_CACHE));
    return;
  }

  /* 6. Firebase SDK CDN (gstatic) → Stale While Revalidate */
  if (url.hostname === 'www.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    return;
  }

  /* 7. Navegação (HTML) → Network First + fallback offline */
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(req));
    return;
  }

  /* 8. CSS / JS locais → Stale While Revalidate */
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    return;
  }

  /* 9. Imagens locais → Cache First */
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/)) {
    event.respondWith(cacheFirst(req, IMAGES_CACHE));
    return;
  }

  /* 10. Todo o restante → Stale While Revalidate */
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});

/* ── HELPERS: DETECÇÃO FIREBASE API ─────────────────────── */
function isFirebaseApi(url) {
  const skipHostnames = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebase.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'fcmregistrations.googleapis.com',
  ];
  if (skipHostnames.some(h => url.hostname === h)) return true;
  /* Cloud Functions regionais: us-central1-PROJECT.cloudfunctions.net */
  if (url.hostname.endsWith('.cloudfunctions.net')) return true;
  return false;
}

/* ── ESTRATÉGIA: CACHE FIRST ─────────────────────────────
   Serve do cache; busca na rede se não encontrar.
   Ideal para recursos raramente alterados (imagens, fontes).  */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/* ── ESTRATÉGIA: STALE WHILE REVALIDATE ─────────────────
   Responde do cache (instantâneo) e revalida em background.
   Ideal para CSS, JS e fontes que mudam ocasionalmente.       */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await networkFetch) ?? new Response('', { status: 408 });
}

/* ── ESTRATÉGIA: NETWORK FIRST + OFFLINE FALLBACK ────────
   Tenta a rede; se falhar, tenta cache; se falhar, offline.html.
   Ideal para HTML — garante conteúdo sempre atualizado.        */
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Tenta o cache de páginas primeiro */
    const cachedPage = await caches.match(request, { cacheName: PAGES_CACHE });
    if (cachedPage) return cachedPage;

    /* Tenta o cache estático (pré-instalado) */
    const staticPage = await caches.match(request, { cacheName: STATIC_CACHE });
    if (staticPage) return staticPage;

    /* Fallback: página offline */
    const offlinePage = await caches.match('./offline.html') ??
                        await caches.match(new URL('./offline.html', self.location.href).href);
    if (offlinePage) return offlinePage;

    return new Response('<h1>Sem conexão</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
