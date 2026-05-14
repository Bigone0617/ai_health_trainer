const REST_END_TAG = "nextset-rest-end";

export function restNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** 사용자 제스처 직후 호출하는 것이 권한 요청에 유리함 */
export function requestRestNotificationPermissionIfDefault(): void {
  if (!restNotificationsSupported()) return;
  if (Notification.permission !== "default") return;
  void Notification.requestPermission();
}

export async function registerRestTimerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await reg.update();
    return reg;
  } catch {
    return null;
  }
}

export function scheduleRestEndInServiceWorker(endsAt: number): void {
  void (async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      reg?.active?.postMessage({ type: "REST_START", endsAt });
    } catch {
      /* ignore */
    }
  })();
}

export function cancelRestEndInServiceWorker(): void {
  void (async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      reg?.active?.postMessage({ type: "REST_CANCEL" });
    } catch {
      /* ignore */
    }
  })();
}

export async function showRestEndedNotification(): Promise<void> {
  if (!restNotificationsSupported() || Notification.permission !== "granted") {
    return;
  }
  const title = "휴식 끝";
  const options: NotificationOptions = {
    body: "쉬는 시간이 끝났어요.",
    tag: REST_END_TAG,
  };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}
