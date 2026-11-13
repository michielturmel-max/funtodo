import { DOMAINS, DOMAIN_KEYS, levelForXp, type Domain } from "@/lib/game";
import { cn } from "@/lib/utils";

export function StatBars({ byDomain }: { byDomain: Record<Domain, number> }) {
  return (
    <div className="space-y-3">
      {DOMAIN_KEYS.map((key) => {
        const xp = byDomain[key];
        const level = levelForXp(xp);
        const domain = DOMAINS[key];
        return (
          <div key={key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: domain.color }} />
                {domain.label}
              </span>
              <span className="text-xs text-ink-soft">
                level {level.level} · {xp} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.max(3, Math.round(level.progress * 100))}%`,
                  background: domain.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrailProgress({ total, done }: { total: number; done: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="panel flex items-center gap-4 px-4 py-3">
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">
            {done} van {total} {total === 1 ? "stop" : "stops"}
          </p>
          <p className="text-xs text-ink-soft">{pct}%</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line-soft">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700",
              pct === 100 ? "bg-moss-deep" : "bg-ember",
            )}
            style={{ width: `${Math.max(total > 0 ? 4 : 0, pct)}%` }}
          />
        </div>
      </div>
      <div className="hidden gap-1 sm:flex">
        {Array.from({ length: Math.min(total, 4) }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "grid size-6 place-items-center rounded-full border text-[10px] font-bold",
              index < done ? "border-moss-deep bg-moss-deep text-chalk" : "border-line text-ink-soft",
            )}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
