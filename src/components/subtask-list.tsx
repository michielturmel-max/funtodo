"use client";

import { useState, useTransition } from "react";
import { toggleSubtaskAction } from "@/server/actions/quests";
import { cn } from "@/lib/utils";
import { CheckIcon } from "./icons";

type Subtask = { id: string; title: string; done: number };

export function SubtaskList({ subtasks, tone = "light" }: { subtasks: Subtask[]; tone?: "light" | "dark" }) {
  const [local, setLocal] = useState(subtasks);
  const [, startTransition] = useTransition();

  if (local.length === 0) return null;

  function toggle(id: string, done: boolean) {
    setLocal((items) => items.map((item) => (item.id === id ? { ...item, done: done ? 1 : 0 } : item)));
    startTransition(async () => {
      try {
        await toggleSubtaskAction(id, done);
      } catch {
        setLocal((items) => items.map((item) => (item.id === id ? { ...item, done: done ? 0 : 1 } : item)));
      }
    });
  }

  return (
    <ul
      className={cn(
        "mt-3 space-y-1.5 border-t pt-3",
        tone === "dark" ? "border-chalk/15" : "border-line-soft",
      )}
    >
      {local.map((item) => (
        <li key={item.id}>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                item.done
                  ? "border-moss-deep bg-moss-deep text-chalk"
                  : tone === "dark"
                    ? "border-chalk/30 bg-chalk/10"
                    : "border-line bg-white/60",
              )}
            >
              {item.done ? <CheckIcon className="size-3" /> : null}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={item.done === 1}
              onChange={(event) => toggle(item.id, event.target.checked)}
            />
            <span
              className={cn(
                item.done
                  ? tone === "dark"
                    ? "text-chalk/50 line-through"
                    : "text-ink-soft line-through"
                  : tone === "dark"
                    ? "text-chalk/85"
                    : "text-ink",
              )}
            >
              {item.title}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
