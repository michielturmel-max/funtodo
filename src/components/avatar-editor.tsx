"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AVATAR_GROUPS,
  avatarUnlockLabel,
  isAvatarOptionUnlocked,
  type AvatarConfig,
  type AvatarGroup,
  type AvatarOption,
} from "@/lib/avatar";
import { buyAvatarItemAction, saveAvatarAction } from "@/server/actions/avatar";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { LockIcon } from "./icons";

type Props = {
  displayName: string;
  initialConfig: AvatarConfig;
  initialOwned: string[];
  initialCoins: number;
  level: number;
  longestStreak: number;
};

export function AvatarEditor({
  displayName,
  initialConfig,
  initialOwned,
  initialCoins,
  level,
  longestStreak,
}: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [owned, setOwned] = useState(initialOwned);
  const [coins, setCoins] = useState(initialCoins);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, startTransition] = useTransition();
  const revision = useRef(0);

  const context = { level, longestStreak, owned };
  const unlockedCount = AVATAR_GROUPS.flatMap((group) => group.options).filter((option) =>
    isAvatarOptionUnlocked(option, context),
  ).length;
  const totalCount = AVATAR_GROUPS.reduce((sum, group) => sum + group.options.length, 0);

  useEffect(() => {
    if (!dirty) return;

    const timer = window.setTimeout(() => {
      const current = revision.current;
      startTransition(async () => {
        try {
          await saveAvatarAction(config);
          if (revision.current === current) setDirty(false);
        } catch {
          setMessage("Opslaan lukte niet. Probeer het nog eens.");
        }
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [config, dirty]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  function update(next: AvatarConfig) {
    revision.current += 1;
    setConfig(next);
    setDirty(true);
  }

  function choose(group: AvatarGroup, option: AvatarOption) {
    if (isAvatarOptionUnlocked(option, context)) {
      update({ ...config, [group.key]: option.id });
      return;
    }

    if (option.unlock.kind === "coins") {
      const { price } = option.unlock;
      if (!window.confirm(`${option.label} vrijspelen voor ${price} munten? Je hebt er ${coins}.`)) return;

      startTransition(async () => {
        try {
          const result = await buyAvatarItemAction(option.id);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setOwned(result.owned);
          setCoins(result.coins);
          update({ ...config, [group.key]: option.id });
          setMessage(`${option.label} is van jou.`);
        } catch {
          setMessage("Vrijspelen lukte niet. Probeer het nog eens.");
        }
      });
      return;
    }

    setMessage(`Nog niet vrij: ${avatarUnlockLabel(option.unlock)}.`);
  }

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-5 p-5">
          <Avatar config={config} title={`Avatar van ${displayName}`} className="size-28 shrink-0 sm:size-32" />
          <div className="min-w-0">
            <p className="eyebrow">Je avatar</p>
            <h2 className="mt-1 truncate text-2xl">{displayName}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="chip">Level {level}</span>
              <span className="chip">
                <span className="size-2 rounded-full bg-gold" />
                {coins} munten
              </span>
              <span className="chip">
                {unlockedCount}/{totalCount} vrij
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-soft" role="status">
              {saving ? "Bezig met opslaan…" : dirty ? "Nog niet opgeslagen" : "Opgeslagen"}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold" role="status">
          {message}
        </p>
      )}

      <p className="text-sm text-ink-soft">
        Munten verdien je met afgeronde quests. Sommige kapsels en kleren gaan open met je level of je vuurreeks.
        Wat je koopt, blijft van jou.
      </p>

      <section className="panel divide-y divide-line-soft">
        {AVATAR_GROUPS.map((group) => (
          <div key={group.key} className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold">{group.label}</h3>
              <span className="text-[11px] text-ink-soft">
                {group.options.filter((option) => isAvatarOptionUnlocked(option, context)).length} van{" "}
                {group.options.length}
              </span>
            </div>

            {group.kind === "color" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const unlocked = isAvatarOptionUnlocked(option, context);
                  const selected = config[group.key] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => choose(group, option)}
                      aria-pressed={selected}
                      aria-label={`${option.label}${unlocked ? "" : `, ${avatarUnlockLabel(option.unlock)}`}`}
                      className={cn(
                        "flex w-16 flex-col items-center gap-1.5 rounded-xl border px-2 py-2 transition-colors",
                        selected ? "border-ember bg-ember/10" : "border-line bg-paper/40 hover:bg-chalk",
                        !unlocked && "opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-full border-2",
                          selected ? "border-ember" : "border-white/70",
                        )}
                        style={{ backgroundColor: option.color }}
                      >
                        {!unlocked && <LockIcon className="size-4 text-chalk" />}
                      </span>
                      <span className="text-[11px] font-semibold leading-none">{option.label}</span>
                      {!unlocked && (
                        <span className="text-[9px] leading-none text-ink-soft">
                          {avatarUnlockLabel(option.unlock)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {group.options.map((option) => {
                  const unlocked = isAvatarOptionUnlocked(option, context);
                  const selected = config[group.key] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => choose(group, option)}
                      aria-pressed={selected}
                      aria-label={`${option.label}${unlocked ? "" : `, ${avatarUnlockLabel(option.unlock)}`}`}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors",
                        selected ? "border-ember bg-ember/10" : "border-line bg-paper/40 hover:bg-chalk",
                        !unlocked && "opacity-70",
                      )}
                    >
                      <Avatar
                        config={{ ...config, [group.key]: option.id }}
                        className="size-14"
                      />
                      <span className="text-[10px] font-semibold leading-none">{option.label}</span>
                      {!unlocked && (
                        <span className="rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-chalk">
                          {avatarUnlockLabel(option.unlock)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
