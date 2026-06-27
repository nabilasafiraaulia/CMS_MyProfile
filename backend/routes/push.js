const express = require('express');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const router = express.Router();
const storageDir = path.resolve(__dirname, '../data');
const subscriptionsFile = path.join(storageDir, 'pushSubscriptions.json');

if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

if (!fs.existsSync(subscriptionsFile)) {
    fs.writeFileSync(subscriptionsFile, JSON.stringify([], null, 2), 'utf-8');
}

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let vapidKeys = { publicKey: vapidPublicKey, privateKey: vapidPrivateKey };
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    vapidKeys = webpush.generateVAPIDKeys();
    console.warn('VAPID key tidak ditemukan. Menghasilkan VAPID key sementara. Simpan di .env untuk penggunaan jangka panjang.');
}

webpush.setVapidDetails('mailto:admin@unugha.ac.id', vapidKeys.publicKey, vapidKeys.privateKey);

function loadSubscriptions() {
    try {
        return JSON.parse(fs.readFileSync(subscriptionsFile, 'utf-8')) || [];
    } catch (error) {
        console.warn('Gagal memuat langganan push:', error);
        return [];
    }
}

function saveSubscriptions(subscriptions) {
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2), 'utf-8');
}

router.get('/vapidPublicKey', (req, res) => {
    res.send(vapidKeys.publicKey);
});

router.post('/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ status: 'error', message: 'Subscription invalid' });
    }

    const subscriptions = loadSubscriptions();
    const exists = subscriptions.find((item) => item.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
        saveSubscriptions(subscriptions);
    }

    res.json({ status: 'success', message: 'Subscription berhasil disimpan' });
});

router.post('/send', async (req, res) => {
    const { title, message, icon = '📬', badge = '🔔' } = req.body;

    if (!title || !message) {
        return res.status(400).json({ status: 'error', message: 'Title dan message harus diisi' });
    }

    const subscriptions = loadSubscriptions();
    if (subscriptions.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Tidak ada subscriber yang terdaftar' });
    }

    const payload = JSON.stringify({
        title,
        message,
        icon: icon || '📬',
        badge: badge || '🔔',
        tag: 'cms-notification',
        requireInteraction: true,
    });

    const results = {
        success: 0,
        failed: 0,
        errors: [],
    };

    for (const subscription of subscriptions) {
        try {
            await webpush.sendNotification(subscription, payload);
            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                error: error.message,
            });
            // Jika subscription sudah tidak valid, hapus dari storage
            if (error.statusCode === 410 || error.statusCode === 404) {
                const idx = subscriptions.indexOf(subscription);
                if (idx > -1) subscriptions.splice(idx, 1);
            }
        }
    }

    // Simpan kembali subscriptions yang masih valid
    saveSubscriptions(subscriptions);

    res.json({
        status: 'success',
        message: `Notifikasi dikirim ke ${results.success} subscriber`,
        results,
    });
});

module.exports = router;
