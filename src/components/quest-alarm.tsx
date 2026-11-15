"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { enablePush } from "@/lib/push-client";
import { BellIcon } from "./icons";

export type QuestAlarmItem = {
  id: string;
  title: string;
  time: string;
  snoozeUntil: string | null;
};

const RING_WINDOW_MIN = 30;
const SNOOZE_MIN = 10;

function minutesNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function isoTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function effectiveTime(item: QuestAlarmItem, snoozes: Record<string, string>, date: string): string {
  const raw = snoozes[item.id] ?? item.snoozeUntil;
  if (!raw) return item.time;
  const until = new Date(raw);
  if (Number.isNaN(until.getTime())) return item.time;
  if (localDateKey(until) !== date) return item.time;
  return isoTime(until);
}

function playChime() {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const start = context.currentTime + 0.05;

    [0, 0.5, 1].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index % 2 === 0 ? 880 : 660;
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(0.22, start + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.35);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.4);
    });

    window.setTimeout(() => void context.close(), 2200);
  } catch {
    // Sound is best effort.
  }
}

function notify(item: QuestAlarmItem) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body: `Tijd voor: ${item.title}`,
    icon: "/icon-192.png",
    tag: `funtodo-${item.id}`,
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.showNotification("Wekker · Funtodo", options))
      .catch(() => {
        try {
          new Notification("Wekker · Funtodo", options);
        } catch {
          // Notifications are best effort.
        }
      });
    return;
  }

  try {
    new Notification("Wekker · Funtodo", options);
  } catch {
    // Notifications are best effort.
  }
}

function ringPhone() {
  void fetch("/api/alarm/ring", { method: "POST" }).catch(() => {
    // The phone ring is best effort.
  });
}

const subscribeNothing = () => () => {};

export function QuestAlarm({ date, alarms }: { date: string; alarms: QuestAlarmItem[] }) {
  const [active, setActive] = useState<QuestAlarmItem | null>(null);
  // De server kent de browser-API's niet; daar is dit altijd onwaar.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const [dismissedOn, setDismissedOn] = useState<string | null>(() =>
    typeof window !== "undefined" &&
    window.localStorage.getItem(`funtodo:alarm-prompt:${date}`) === "1"
      ? date
      : null,
  );
  const [snoozes, setSnoozes] = useState<Record<string, string>>({});
  const promptDismissed = dismissedOn === date;

  const check = useCallback(() => {
    const now = minutesNow();
    for (const item of alarms) {
      const time = effectiveTime(item, snoozes, date);
      const key = `funtodo:alarm:${date}:${item.id}:${time}`;
      if (window.localStorage.getItem(key)) continue;

      const target = toMinutes(time);

      if (now < target || now - target > RING_WINDOW_MIN) continue;

      window.localStorage.setItem(key, "1");
      const ringing = { ...item, time };
      setActive(ringing);
      playChime();
      notify(ringing);
      ringPhone();
      return;
    }
  }, [alarms, date, snoozes]);

  useEffect(() => {
    if (!mounted || alarms.length === 0) return;

    const first = window.setTimeout(check, 0);
    const interval = window.setInterval(check, 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [alarms.length, check, mounted]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      playChime();
      void enablePush().catch(() => null);
    }
  }

  function snooze(item: QuestAlarmItem) {
    const localUntil = new Date(Date.now() + SNOOZE_MIN * 60_000);
    setSnoozes((current) => ({ ...current, [item.id]: localUntil.toISOString() }));
    setActive(null);

    void fetch("/api/alarm/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, minutes: SNOOZE_MIN }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ok?: boolean; snoozeUntil?: string } | null) => {
        if (data?.ok && data.snoozeUntil) {
          setSnoozes((current) => ({ ...current, [item.id]: data.snoozeUntil as string }));
        }
      })
      .catch(() => {
        // The local snooze keeps the web app quiet even without the server.
      });
  }

  if (!mounted) return null;

  const showPrompt =
    alarms.length > 0 && permission === "default" && !promptDismissed && !active;

  return (
    <>
      {active && (
        <div
          role="alertdialog"
          aria-label={`Wekker: ${active.title}`}
          className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-gold/50 bg-chalk p-4 shadow-[0_24px_60px_-30px_rgba(22,36,29,0.8)] sm:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ember/15 text-ember">
              <BellIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Wekker · {active.time}
              </p>
              <p className="mt-0.5 truncate font-display text-lg font-semibold">{active.title}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/vandaag" className="btn btn-ember flex-1" onClick={() => setActive(null)}>
              Naar de quest
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => snooze(active)}>
              Nog 10 min
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Wekker sluiten"
              onClick={() => setActive(null)}
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {showPrompt && (
        <div className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-chalk px-4 py-3 shadow-lg sm:bottom-6">
          <BellIcon className="size-4 shrink-0 text-ember" />
          <p className="min-w-0 flex-1 text-xs text-ink-soft">
            Wil je een melding als je wekker afgaat?
          </p>
          <button type="button" className="btn btn-ember !px-3 !py-1.5 !text-xs" onClick={enableNotifications}>
            Aanzetten
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-ink-soft"
            aria-label="Niet meer vragen"
            onClick={() => {
              window.localStorage.setItem(`funtodo:alarm-prompt:${date}`, "1");
              setDismissedOn(date);
            }}
          >
            Nee
          </button>
        </div>
      )}
    </>
  );
}
