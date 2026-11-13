import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Funtodo">
      <span className="relative grid size-9 place-items-center rounded-full border border-line bg-chalk">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M12 3.5c.9 3.2-1.8 4.2-1.8 6.4a1.8 1.8 0 0 0 3.6 0c0-.9 0-1.4-.4-2.3 2.2 1.4 4 3.7 4 6.4a5.4 5.4 0 0 1-10.8 0c0-3.7 2.7-5.6 5.4-10.5Z"
            fill="var(--color-ember)"
          />
          <path d="M8 20h8" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Funtodo</span>
    </Link>
  );
}
