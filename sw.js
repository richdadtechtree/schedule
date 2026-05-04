const CACHE_NAME = 'vibe-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 푸시 알림 수신 (Push API 서버 연동 시 사용)
self.addEventListener('push', event => {
    const data = event.data?.json() || {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'vibe. 알림', {
            body: data.body || '',
            icon: data.icon || '/icon.png',
            badge: '/icon.png',
            tag: data.tag || 'vibe',
            renotify: true,
            data: { url: data.url || '/' }
        })
    );
});

// 알림 탭 → 앱 포커스
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
        })
    );
});
