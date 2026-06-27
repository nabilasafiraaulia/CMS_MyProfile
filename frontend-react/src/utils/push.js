const BACKEND_BASE = window.location.origin;
const VAPID_KEY_ENDPOINT = `${BACKEND_BASE}/api/push/vapidPublicKey`;
const SUBSCRIBE_ENDPOINT = `${BACKEND_BASE}/api/push/subscribe`;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerPushSubscription() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker tidak didukung pada browser ini.');
        return null;
    }

    if (!('PushManager' in window)) {
        console.warn('Push API tidak didukung pada browser ini.');
        return null;
    }

    if (!('Notification' in window)) {
        console.warn('Notification API tidak didukung pada browser ini.');
        return null;
    }

    if (Notification.permission === 'denied') {
        console.warn('Izin notifikasi telah ditolak.');
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('Pengguna tidak memberikan izin notifikasi.');
        return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const response = await fetch(VAPID_KEY_ENDPOINT);
    if (!response.ok) {
        throw new Error('Gagal mengambil VAPID public key');
    }

    const vapidPublicKey = await response.text();
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    });

    return subscription;
}
