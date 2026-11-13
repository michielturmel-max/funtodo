export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

async function registration(timeoutMs = 10_000): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const ready = navigator.serviceWorker.ready;
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([ready, timeout]);
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  const ready = await registration();
  if (!ready) return null;
  return ready.pushManager.getSubscription();
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) {
    return { ok: false, error: "Deze browser ondersteunt geen pushmeldingen." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, error: "Meldingen zijn niet toegestaan in je browser." };
    }

    const ready = await registration();
    if (!ready) {
      return { ok: false, error: "De app is nog niet klaar. Probeer het zo opnieuw." };
    }

    const response = await fetch("/api/push/key");
    if (!response.ok) {
      return { ok: false, error: "De sleutel kon niet worden opgehaald." };
    }
    const data = (await response.json()) as { publicKey?: string };
    if (!data.publicKey) {
      return { ok: false, error: "Push is niet ingesteld op de server." };
    }

    let subscription = await ready.pushManager.getSubscription();
    if (!subscription) {
      subscription = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }

    const saved = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!saved.ok) {
      return { ok: false, error: "Het abonnement kon niet worden opgeslagen." };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Je browser weigert push. Sta meldingen toe en probeer het opnieuw.",
    };
  }
}

export async function disablePush(): Promise<{ ok: boolean; error?: string }> {
  const subscription = await getPushSubscription();
  if (!subscription) return { ok: true };

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => null);

  const removed = await subscription.unsubscribe().catch(() => false);
  return removed ? { ok: true } : { ok: false, error: "Uitzetten lukte niet." };
}
