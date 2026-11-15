"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { flushCompletions, pendingCompletions } from "@/lib/offline-queue";
import { WifiOffIcon } from "./icons";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getOfflineSnapshot() {
  return !navigator.onLine;
}

function getServerOfflineSnapshot() {
  return false;
}

export function OfflineBanner() {
  const offline = useSyncExternalStore(subscribeOnline, getOfflineSnapshot, getServerOfflineSnapshot);
  const [pending, setPending] = useState(0);
  const router = useRouter();

  const refreshPending = useCallback(async () => {
    try {
      setPending(await pendingCompletions());
    } catch {
      setPending(0);
    }
  }, []);

  const sync = useCallback(async () => {
    try {
      const result = await flushCompletions();
      if (result.synced > 0) router.refresh();
      await refreshPending();
    } catch {
      await refreshPending();
    }
  }, [refreshPending, router]);

  useEffect(() => {
    const first = window.setTimeout(() => void refreshPending(), 0);

    const onOnline = () => {
      void sync();
    };

    window.addEventListener("online", onOnline);
    const interval = window.setInterval(() => {
      void refreshPending();
    }, 15000);

    return () => {
      window.clearTimeout(first);
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
    };
  }, [refreshPending, sync]);

  if (!offline && pending === 0) return null;

  return (
    <div className="mx-auto mb-4 flex w-full max-w-5xl items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm">
      <WifiOffIcon className="size-4 shrink-0 text-ink-soft" />
      <p className="flex-1 text-ink-soft">
        {offline
          ? "Je bent offline. Afvinken wordt bewaard en later verstuurd."
          : `${pending} afgevinkte ${pending === 1 ? "quest wacht" : "quests wachten"} op sync.`}
      </p>
      {!offline && (
        <button type="button" onClick={() => void sync()} className="btn btn-ghost !min-h-9 !px-3 !text-xs">
          Nu syncen
        </button>
      )}
    </div>
  );
}
