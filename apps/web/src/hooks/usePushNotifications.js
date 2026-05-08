import { useState, useEffect } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';

const SW_PATH = '/sw.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'granted') {
      registerAndSubscribe(userId).then((ok) => setSubscribed(ok));
    }
  }, [userId]);

  async function registerAndSubscribe(uid) {
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH);
      await navigator.serviceWorker.ready;

      const { publicKey } = await apiServerClient.fetch('/push/vapid-public-key').then((r) => r.json());

      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiServerClient.fetch('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, subscription: sub.toJSON() }),
      });

      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted' && userId) {
      const ok = await registerAndSubscribe(userId);
      setSubscribed(ok);
    }
    return result;
  }

  return { permission, subscribed, requestPermission };
}
