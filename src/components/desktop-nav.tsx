"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/vandaag", label: "Vandaag" },
  { href: "/quests", label: "Quests" },
  { href: "/kamp", label: "Kamp" },
  { href: "/profiel", label: "Profiel" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
              active ? "bg-ink text-chalk" : "text-ink-soft hover:bg-chalk hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
