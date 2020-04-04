/**
 * @file ServiceWorker responsible for loading and caching files. It allows using the app offline
 * by serving files from the cache.
 */

const version = 22;
const cacheName = `${version}-offline`;
const preCachedFiles = [
    "index.html",
    "bundle.js",
    "style.css",
    "favicon.ico"
];

self.addEventListener("install", event => {
    console.log(`Serviceworker: install event. Version '${version}'`);

    // Pre-cache the configured files.
    event.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(preCachedFiles)));
});

self.addEventListener('activate', event => {
    console.log("Serviceworker: activate event")

    // Remove old caches.
    event.waitUntil(
        caches.keys().then(oldCacheNames => Promise.all(
            oldCacheNames.map(oldCacheName => {
                if (oldCacheName !== cacheName) {
                    return caches.delete(oldCacheName);
                }
            }))
        )
    );
});

self.addEventListener("fetch", event => {
    console.log(`Serviceworker: Fetch event for: '${event.request.url}'`);
    event.respondWith(
        // Serve either from cache or from network.
        caches.open(cacheName).then(cache => cache.match(event.request).then(cacheResponse => {
            if (cacheResponse) {
                console.log(`Serviceworker: serving '${event.request.url}' from cache.`);
                return cacheResponse;
            }
            console.log(`Serviceworker: fetching '${event.request.url}' from the network`);
            return fetch(event.request).then(networkResponse => {
                console.log(`Serviceworker: caching result of '${event.request.url}'`);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            }).catch(e => {
                console.error(`Serviceworker: failed to fetch '${event.request.url}' from the network`);
                throw e;
            });;
        }))
    );
});
