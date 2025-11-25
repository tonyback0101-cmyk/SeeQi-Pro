/**
 * Service Worker for SeeQi PWA
 * 提供基础的离线支持和缓存策略
 */

const CACHE_NAME = 'seeqi-v1';
const RUNTIME_CACHE = 'seeqi-runtime';

// 需要预缓存的资源
const PRECACHE_URLS = [
  '/',
  '/zh',
  '/en',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 安装事件：预缓存关键资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting(); // 立即激活新的 service worker
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 删除旧版本的缓存
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // 立即控制所有客户端
      })
      .catch((error) => {
        console.error('[SW] Activate failed:', error);
      })
  );
});

// 获取事件：网络优先，缓存兜底策略
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过跨域请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 克隆响应（因为响应只能使用一次）
        const responseToCache = response.clone();

        // 缓存成功的响应
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.error('[SW] Cache put failed:', error);
            });
        }

        return response;
      })
      .catch(() => {
        // 网络请求失败，尝试从缓存获取
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            // 如果缓存也没有，返回离线页面（如果需要）
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
      })
  );
});

