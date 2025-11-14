const CACHE_VERSION = "seeqi-v1";
const REPORT_CACHE = `${CACHE_VERSION}-reports`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const ASSET_PATTERNS = ["/icons/", "/images/", "/fonts/"];
const REPORT_PATHS = ["/api/analyze", "/api/result"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) =>
      cache.addAll(["/", "/zh", "/en", "/manifest.json"].filter(Boolean)),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (ASSET_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (REPORT_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(networkFirst(request, REPORT_CACHE));
    return;
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });
  return cached ? Promise.resolve(cached) : networkFetch;
}

