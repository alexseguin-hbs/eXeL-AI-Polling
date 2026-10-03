/* After one online visit, Sensor Fusion can reload with no internet.
   Only Sensor Fusion addresses are answered from the saved copy. */
var CACHE = "sf-offline-v1";

function keep(url) {
  return url.indexOf("/sensor-fusion/") !== -1
    || url.indexOf("/SensorFusion-2525") !== -1
    || url.indexOf("cdn.jsdelivr.net/npm/@tensorflow/tfjs-") !== -1
    || url.indexOf("raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/") !== -1;
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  if (!keep(event.request.url)) return;
  event.respondWith(
    fetch(event.request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      }
      return response;
    }).catch(function () {
      return caches.open(CACHE).then(function (cache) { return cache.match(event.request); });
    })
  );
});
