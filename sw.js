const VERSAO = 'v2';
const CACHE_ESTATICO = `carimbo-estatico-${VERSAO}`;
const CACHE_FONTES = `carimbo-fontes-${VERSAO}`;
const APP_SHELL = [
  './',
  './index.html',
  './nova.html',
  './album.html',
  './detalhe.html',
  './config.html',
  './css/style.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/db.js',
  './js/memorias.js',
];


self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_ESTATICO).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});


self.addEventListener('activate', event => {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(
        chaves
          .filter(c => c !== CACHE_ESTATICO && c !== CACHE_FONTES)
          .map(c => caches.delete(c))
      )
    )
  );
  self.clients.claim();
});


self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);


  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, CACHE_FONTES));
    return;
  }


  if (url.origin === location.origin) {
   
    if (req.mode === 'navigate') {
      event.respondWith(networkFirst(req));
      return;
    }
  
    event.respondWith(cacheFirst(req, CACHE_ESTATICO));
  }
});

async function cacheFirst(req, nomeCache) {
  const cache = await caches.open(nomeCache);
  const guardado = await cache.match(req);
  if (guardado) return guardado;
  try {
    const resposta = await fetch(req);
    if (resposta.ok || resposta.type === 'opaque') cache.put(req, resposta.clone());
    return resposta;
  } catch (e) {
    return guardado || Response.error();
  }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_ESTATICO);
  try {
    const resposta = await fetch(req);
    cache.put(req, resposta.clone());
    return resposta;
  } catch (e) {
  
    return (await cache.match(req, { ignoreSearch: true })) ||
           (await cache.match('./index.html'));
  }
}