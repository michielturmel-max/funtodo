"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { addFocusAction } from "@/server/actions/quests";
import {
  elapsedMinutes,
  elapsedOf,
  getServerTimerSnapshot,
  getTimerSnapshot,
  pauseTimer,
  resetTimer,
  startTimer,
  subscribeTimers,
} from "@/lib/quest-timer";
import { cn } from "@/lib/utils";
import { PauseIcon, PlayIcon, StopIcon } from "./icons";

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}

export function QuestTimer({ questId, tone = "light" }: { questId: string; tone?: "dark" | "light" }) {
  const snapshot = useSyncExternalStore(
    subscribeTimers,
    () => getTimerSnapshot(questId),
    getServerTimerSnapshot,
  );
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  const running = snapshot.runningSince !== null;
  const elapsed = elapsedOf(snapshot, now);
  const hasTime = elapsed >= 1000;
  const dark = tone === "dark";

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  function stop() {
    if (running) pauseTimer(questId);
    const minutes = elapsedMinutes(questId);
    if (minutes < 1) {
      resetTimer(questId);
      return;
    }

    startTransition(async () => {
      try {
        await addFocusAction(questId, minutes);
        resetTimer(questId);
        setFlash(`${minutes} min opgeslagen`);
      } catch {
        setFlash("Kon tijd niet opslaan");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => (running ? pauseTimer(questId) : startTimer(questId))}
        aria-label={running ? "Timer pauzeren" : hasTime ? "Timer hervatten" : "Timer starten"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors",
          running
            ? dark
              ? "border-gold/50 bg-gold/15 text-gold"
              : "border-ember/40 bg-ember/10 text-ember"
            : dark
              ? "border-chalk/25 text-chalk/80 hover:bg-chalk/10"
              : "border-line text-ink-soft hover:bg-paper",
        )}
      >
        {running ? (
          <>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-current" />
            </span>
            {formatClock(elapsed)}
            <PauseIcon className="size-3.5" />
          </>
        ) : (
          <>
            <PlayIcon className="size-3.5" />
            {hasTime ? formatClock(elapsed) : "Timer starten"}
          </>
        )}
      </button>

      {(running || hasTime) && (
        <button
          type="button"
          onClick={stop}
          disabled={saving}
          aria-label="Tijd opslaan"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
            dark ? "text-chalk/60 hover:bg-chalk/10" : "text-ink-soft hover:bg-paper",
            saving && "opacity-60",
          )}
        >
          <StopIcon className="size-3.5" />
          {running ? "Stoppen" : "Opslaan"}
        </button>
      )}

      {flash && (
        <span
          className={cn(
            "text-[11px] font-semibold",
            dark ? "text-gold" : "text-ember",
          )}
          role="status"
        >
          {flash}
        </span>
      )}
    </div>
  );
}
