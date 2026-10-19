// Dienst Journaal — service worker
// Bewaart GEEN kopie van de app meer. Elke keer dat de app wordt geopend, haalt hij de nieuwste
// versie rechtstreeks van de server. Dit voorkomt dat een oude versie uit de cache wordt getoond
// (waardoor inloggen pas lukte na Ctrl+F5).
const SW_VERSIE = '2026-10-07.20';

self.addEventListener('install', function () {
  self.skipWaiting(); // nieuwe versie meteen actief
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    // Alle oude caches weggooien
    const sleutels = await caches.keys();
    await Promise.all(sleutels.map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
    // Open vensters één keer verversen, zodat ze meteen de nieuwste versie tonen
    const vensters = await self.clients.matchAll({ type: 'window' });
    vensters.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
  })());
});

self.addEventListener('fetch', function (event) {
  // Alleen het openen van een pagina: altijd vers van de server (geen browsercache)
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
  }
  // Al het andere (SharePoint, Microsoft-login, scripts) gaat gewoon rechtstreeks naar het netwerk
});
