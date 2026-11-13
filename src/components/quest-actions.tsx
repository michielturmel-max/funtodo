"use client";

import { useState, useTransition } from "react";
import {
  completeQuestAction,
  deferQuestAction,
  deleteQuestAction,
  scheduleQuestAction,
  startQuestAction,
  uncompleteQuestAction,
} from "@/server/actions/quests";
import { enqueueCompletion } from "@/lib/offline-queue";
import { takeElapsedMinutes } from "@/lib/quest-timer";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckIcon, ClockIcon, SwordsIcon, UndoIcon } from "./icons";

type Props = {
  questId: string;
  status: string;
  isMain: boolean;
  bossHp: number;
  scheduledDate: string | null;
  today: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

export function QuestActions({ questId, status, isMain, bossHp, scheduledDate, today }: Props) {
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [queued, setQueued] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const done = status === "done";

  function complete() {
    const minutes = takeElapsedMinutes(questId);
    startTransition(async () => {
      try {
        const result = await withTimeout(
          completeQuestAction(questId, minutes >= 1 ? minutes : null),
          6000,
        );
        if (result.ok) {
          setXp(result.xp);
          window.setTimeout(() => setXp(null), 1200);
        } else {
          setMessage(result.error);
          window.setTimeout(() => setMessage(null), 2600);
        }
      } catch {
        try {
          await enqueueCompletion(questId);
          setQueued(true);
        } catch {
          setMessage("Opslaan lukte niet. Probeer het opnieuw.");
        }
      }
    });
  }

  function undo() {
    startTransition(async () => {
      try {
        await uncompleteQuestAction(questId);
      } catch {
        setMessage("Terugdraaien lukte niet.");
      }
    });
  }

  function start() {
    setMenuOpen(false);
    startTransition(async () => {
      try {
        await startQuestAction(questId);
      } catch {
        setMessage("Kon niet starten.");
      }
    });
  }

  function planToday() {
    setMenuOpen(false);
    startTransition(async () => {
      try {
        await scheduleQuestAction(questId, today);
      } catch {
        setMessage("Kon niet plannen.");
      }
    });
  }

  function defer() {
    setMenuOpen(false);
    startTransition(async () => {
      try {
        const result = await deferQuestAction(questId);
        if (result.becameBoss) {
          setMessage("Dit is nu een baas. Verdeel hem in stappen.");
          window.setTimeout(() => setMessage(null), 3500);
        }
      } catch {
        setMessage("Kon niet uitstellen.");
      }
    });
  }

  function remove() {
    setMenuOpen(false);
    if (!window.confirm("Deze quest verwijderen?")) return;
    startTransition(async () => {
      try {
        await deleteQuestAction(questId);
      } catch {
        setMessage("Verwijderen lukte niet.");
      }
    });
  }

  return (
    <div className="relative flex shrink-0 items-center gap-1.5">
      {message && (
        <span className="absolute right-0 top-full z-20 mt-2 w-52 rounded-lg border border-line bg-chalk px-3 py-2 text-xs shadow-lg">
          {message}
        </span>
      )}

      {!done ? (
        <>
          <button
            type="button"
            onClick={complete}
            disabled={pending}
            aria-label="Quest afronden"
            className={cn(
              "relative grid place-items-center rounded-full border-2 transition-colors",
              isMain ? "size-14" : "size-12",
              queued
                ? "border-gold bg-gold/15 text-gold"
                : "border-ink/20 bg-chalk hover:border-ember hover:bg-ember hover:text-chalk",
              pending && "opacity-60",
            )}
          >
            {queued ? <ClockIcon className="size-5" /> : <CheckIcon className={isMain ? "size-6" : "size-5"} />}
            {xp !== null && (
              <span className="animate-xp pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-lg font-semibold text-ember">
                +{xp} XP
              </span>
            )}
          </button>

          <div>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Meer opties"
              aria-expanded={menuOpen}
              className="grid size-9 place-items-center rounded-full border border-line bg-chalk text-ink-soft"
            >
              <span className="tracking-[0.15em]">···</span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Menu sluiten"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="panel absolute right-0 z-40 mt-2 w-48 overflow-hidden p-1 text-sm">
                  {!scheduledDate && status === "planned" && (
                    <button
                      type="button"
                      onClick={planToday}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-paper"
                    >
                      <CalendarIcon className="size-4" />
                      Vandaag plannen
                    </button>
                  )}
                  {status === "planned" && (
                    <button
                      type="button"
                      onClick={start}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-paper"
                    >
                      <SwordsIcon className="size-4" />
                      Begin nu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={defer}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-paper"
                  >
                    <ClockIcon className="size-4" />
                    Naar morgen
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-ember hover:bg-ember/10"
                  >
                    Verwijderen
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={undo}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-chalk"
        >
          <UndoIcon className="size-3.5" />
          Terug
        </button>
      )}

      {bossHp > 0 && !done && (
        <span className="hidden" aria-hidden="true" data-boss={bossHp} />
      )}
    </div>
  );
}
