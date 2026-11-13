"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, MapIcon, TentIcon, UserIcon } from "./icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/vandaag", label: "Vandaag", icon: CompassIcon },
  { href: "/quests", label: "Quests", icon: MapIcon },
  { href: "/kamp", label: "Kamp", icon: TentIcon },
  { href: "/profiel", label: "Profiel", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-chalk/95 backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors",
                active ? "text-ember" : "text-ink-soft hover:text-ink",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.1]")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
