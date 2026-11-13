"use client";

import { useState, useTransition } from "react";
import { setShareActivityAction } from "@/server/actions/sharing";
import { cn } from "@/lib/utils";

export function ShareToggle({ initial }: { initial: boolean }) {
  const [shared, setShared] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !shared;
    setShared(next);
    startTransition(async () => {
      try {
        await setShareActivityAction(next);
      } catch {
        setShared(!next);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={shared}
      onClick={toggle}
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3 text-left"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          shared ? "bg-moss-deep" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-chalk shadow transition-all",
            shared ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          {shared ? "Je deelt mee aan de expeditie" : "Je expeditie is privé"}
        </span>
        <span className="block text-xs text-ink-soft">
          {shared
            ? "Je naam, minuten en afgeronde quests tellen mee voor de berg en de yeti."
            : "Je ziet de expeditie wel, maar jouw minuten en quests blijven van jou."}
        </span>
      </span>
    </button>
  );
}
