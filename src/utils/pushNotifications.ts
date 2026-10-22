/**
 * SmartBiz Pocket – Native Device Push Notifications & Topbar App Badging Engine
 * Operates 100% offline via Service Worker, Local Web Notifications, and Badging APIs.
 */

import { AppNotification } from '../types';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the browser or PWA container supports local/push system notifications.
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if the device / OS supports the Web App Badging API.
 */
export function isBadgingSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

/**
 * Get current system notification permission state.
 */
export function getPushPermissionState(): PushPermissionStatus {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionStatus;
}

/**
 * Request notification permission from the user.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Update the application badge on the device (home screen icon, top status bar, taskbar).
 */
export function updateDeviceBadge(count: number): void {
  if (typeof window === 'undefined') return;

  // 1. Native Web App Badging API (Android Chrome PWA, Windows, Mac, iOS 16.4+)
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    } catch {
      // Ignore badging errors
    }
  }

  // 2. Broadcast message to service worker for background badge persistence
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: count > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
      count,
    });
  }

  // 3. Synchronize Document Title with unread count indicator
  try {
    const baseTitle = 'SmartBiz Pocket - Offline Business Manager';
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  } catch {
    // Ignore title updates
  }
}

/**
 * Trigger a real system push notification on the device.
 */
export async function sendPushNotification(options: {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const iconUrl = options.icon || '/pwa-192x192.png';
  const badgeUrl = options.badge || '/pwa-192x192.png';

  // Strategy A: Service Worker Registration showNotification (Preferred for Android / Mobile PWA topbar shades)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(options.title, {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: options.tag || 'smartbiz-alert',
          silent: false,
          data: options.data || { url: '/' },
        } as NotificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker notification failed, attempting window fallback:', swErr);
    }
  }

  // Strategy B: Standard Window Notification fallback
  try {
    new window.Notification(options.title, {
      body: options.body,
      icon: iconUrl,
      tag: options.tag,
    });
    return true;
  } catch (winErr) {
    console.error('Window notification error:', winErr);
    return false;
  }
}

const PUSH_HISTORY_KEY = 'smartbiz_pushed_notifications_v1';

/**
 * Synchronize system notifications:
 * 1. Sets device badge count.
 * 2. Fires real device push notifications for any un-pushed alerts without duplicate spamming.
 */
export function syncSystemNotificationsWithPush(notifications: AppNotification[]): void {
  if (typeof window === 'undefined') return;

  // Always keep device badge count in sync
  const activeCount = notifications.length;
  updateDeviceBadge(activeCount);

  if (activeCount === 0 || !isPushNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    let history: Record<string, number> = {};
    const stored = localStorage.getItem(PUSH_HISTORY_KEY);
    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch {
        history = {};
      }
    }

    const now = Date.now();
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

    notifications.forEach((notif) => {
      const lastPushed = history[notif.id];
      // Only push if never pushed or last pushed over 6 hours ago
      if (!lastPushed || now - lastPushed > SIX_HOURS_MS) {
        sendPushNotification({
          title: notif.title,
          body: notif.message,
          tag: notif.id,
          data: {
            id: notif.id,
            actionTab: notif.actionTab,
          },
        });
        history[notif.id] = now;
      }
    });

    localStorage.setItem(PUSH_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Error synchronizing push notifications:', err);
  }
}

/**
 * Fire an explicit test push notification to verify device delivery and topbar badge.
 */
export async function triggerTestPushNotification(): Promise<{ success: boolean; message: string }> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      message: 'Push notifications are not supported by this browser.',
    };
  }

  let permission = Notification.permission;
  if (permission !== 'granted') {
    const granted = await requestPushPermission();
    if (!granted) {
      return {
        success: false,
        message: 'Notification permission was denied. Please allow notifications in device settings.',
      };
    }
    permission = 'granted';
  }

  // Set device badge to 1
  updateDeviceBadge(1);

  // Dispatch push
  const sent = await sendPushNotification({
    title: 'SmartBiz Pocket – Push & Badge Active',
    body: 'System notifications and topbar badge are active 100% offline. Zero internet required!',
    tag: 'smartbiz-test-push',
    data: { test: true },
  });

  if (sent) {
    return {
      success: true,
      message: 'Push notification sent to device and topbar badge updated!',
    };
  }

  return {
    success: false,
    message: 'Could not deliver push notification to device.',
  };
}
