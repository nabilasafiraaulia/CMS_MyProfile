const CACHE_NAME = 'storycam-v1';
const ASSETS_TO_CACHE = [
    '/',
    './',
    './profile.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const asset of ASSETS_TO_CACHE) {
                try {
                    await cache.add(asset);
                } catch (err) {
                    console.warn('Gagal memuat asset ke cache:', asset, err);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((oldKey) => caches.delete(oldKey))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin) {
        return;
    }

    const isUpload = url.pathname.startsWith('/uploads/');
    const isImage = request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname);
    const cacheFirst = isUpload || isImage;

    if (cacheFirst) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(networkFirstStrategy(request));
    }
});

async function networkFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        if (request.mode === 'navigate') {
            return cache.match('./profile.html');
        }
        throw error;
    }
}

async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    const response = await fetch(request);
    if (response && response.status === 200) {
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('push', (event) => {
    let payload = {
        title: 'Notifikasi Baru',
        body: 'Ada pembaruan terbaru. Klik untuk melihat.',
        url: '/'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            payload = { ...payload, ...data };
        } catch (err) {
            console.warn('Push payload tidak bisa diurai:', err);
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body || payload.message,
        data: { url: payload.url },
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        tag: 'storycam-notification',
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
