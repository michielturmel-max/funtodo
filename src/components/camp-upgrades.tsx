"use client";

import { useState } from "react";
import { CAMP_ITEMS } from "@/lib/camp";
import { buyCampItemAction } from "@/server/actions/camp";
import { CampItemIcon } from "./camp-item-icon";
import { CheckIcon } from "./icons";

type Message = { tone: "ok" | "error"; text: string } | null;

export function CampUpgrades({
  initialCoins,
  initialItems,
}: {
  initialCoins: number;
  initialItems: string[];
}) {
  const [coins, setCoins] = useState(initialCoins);
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  async function buy(id: string, price: number) {
    setPendingId(id);
    setMessage(null);
    try {
      const result = await buyCampItemAction(id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setCoins(result.coins);
      setItems(result.items);
      setMessage({
        tone: "ok",
        text: `Toegevoegd aan je kamp. ${price} munten uitgegeven.`,
      });
    } catch {
      setMessage({ tone: "error", text: "Kopen lukte niet. Probeer het opnieuw." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl">Kampupgrades</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <span className="size-2 rounded-full bg-gold" />
          {coins} munten
        </span>
      </div>
      <p className="text-sm text-ink-soft">
        Geef je munten uit aan je kamp zelf. Elk stuk blijft staan, ook als je even niet speelt.
      </p>

      {message && (
        <p
          role="status"
          className={`text-xs ${message.tone === "ok" ? "text-moss-deep" : "text-ember"}`}
        >
          {message.text}
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {CAMP_ITEMS.map((item) => {
          const owned = items.includes(item.id);
          const missing = Math.max(0, item.price - coins);
          const pending = pendingId === item.id;

          return (
            <li key={item.id} className="panel flex items-start gap-3 px-4 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-moss/10 text-moss-deep">
                <CampItemIcon id={item.id} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  {owned ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-moss-deep">
                      <CheckIcon className="size-3.5" />
                      In je kamp
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] font-semibold text-ink-soft">{item.price} munten</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{item.description}</p>

                {!owned && (
                  <button
                    type="button"
                    className="btn btn-ghost mt-2 !px-3 !py-1.5 !text-xs"
                    onClick={() => buy(item.id, item.price)}
                    disabled={pending || missing > 0}
                  >
                    {pending
                      ? "Bezig…"
                      : missing > 0
                        ? `Nog ${missing} munten`
                        : "Koop en zet in je kamp"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
