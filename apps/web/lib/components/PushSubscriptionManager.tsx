"use client";

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscribeToPush } from '../queries/notifications';

export function PushSubscriptionManager() {
  const { user } = useAuth();
  const { mutate: subscribe } = useSubscribeToPush();

  useEffect(() => {
    if (!user) return;

    const registerAndSubscribe = async () => {
      try {
        // 1. Check if service worker is supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('Push notifications are not supported in this browser.');
          return;
        }

        // 2. Register and update Service Worker immediately
        const registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();
        console.log('Service Worker registered and updated:', registration);

        // 3. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission denied.');
          return;
        }

        // 4. Subscribe to Push
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey || publicVapidKey.length < 50 || publicVapidKey.startsWith('abcxyz')) {
          console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set or is a placeholder. Web Push subscription skipped.');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // 5. Send to backend
        subscribe(subscription.toJSON());
        console.log('User successfully subscribed to Push Notifications.');
      } catch (error) {
        console.error('Error during push subscription:', error);
      }
    };

    registerAndSubscribe();
  }, [user, subscribe]);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
