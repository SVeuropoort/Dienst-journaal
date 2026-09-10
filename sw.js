// Minimale service worker voor Dienst Journaal.
//
// Doel: voldoen aan de PWA-installatie-eisen (o.a. nodig voor het verpakken als
// Android-app via PWABuilder) zonder het risico te lopen dat collega's een
// verouderde versie van de app of van de live data te zien krijgen.
//
// Daarom wordt hier BEWUST NIETS van index.html, materieel-garage.html,
// kpi-mt.html of de live SharePoint/Graph-verzoeken gecachet — alleen een
// handjevol statische bestanden (het manifest en de app-iconen) die zelden
// veranderen en waarvoor een korte cache geen enkel risico oplevert.

const CACHE_NAAM = 'dienst-journaal-static-v1';
const STATISCHE_BESTANDEN = [
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAAM).then(function (cache) {
      return cache.addAll(STATISCHE_BESTANDEN).catch(function () {
        // best effort — als een bestand nog niet bestaat, laat de rest gewoon werken
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(
        namen
          .filter(function (naam) { return naam !== CACHE_NAAM; })
          .map(function (naam) { return caches.delete(naam); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  var isEigenStatischBestand =
    url.origin === location.origin &&
    STATISCHE_BESTANDEN.some(function (naam) { return url.pathname.endsWith('/' + naam); });

  // Alles behalve die paar statische bestanden (dus: de app zelf, en elk verzoek naar
  // login.microsoftonline.com / graph.microsoft.com / SharePoint) gaat altijd gewoon
  // rechtstreeks over het netwerk — geen cache, geen kans op verouderde data.
  if (!isEigenStatischBestand) return;

  event.respondWith(
    fetch(event.request)
      .then(function (resp) {
        var kopie = resp.clone();
        caches.open(CACHE_NAAM).then(function (cache) { cache.put(event.request, kopie); });
        return resp;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
