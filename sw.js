const CACHE_NAME = 'film-app-v1';
const ASSETS = [
  '/imdb/',
  '/imdb/index8.html',
  '/imdb/manifest.json',
  '/imdb/icon-192.png',
  '/imdb/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // API çağrılarını cache'leme (TMDB, Groq, Tavily, Open-Meteo)
  const url = new URL(req.url);
  if (
    url.hostname.includes('api.themoviedb.org') ||
    url.hostname.includes('image.tmdb.org') ||
    url.hostname.includes('api.groq.com') ||
    url.hostname.includes('api.tavily.com') ||
    url.hostname.includes('open-meteo.com')
  ) {
    return; // ağa bırak
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index8.html'));
    })
  );
});
