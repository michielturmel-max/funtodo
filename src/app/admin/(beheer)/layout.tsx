import Link from "next/link";
import { adminLogoutAction } from "@/server/actions/auth";
import { requireAdminSession } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminSession();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-ink bg-ink text-chalk">
        <div className="mx-auto flex min-h-16 w-full max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link href="/admin" className="inline-flex items-baseline gap-2" aria-label="Funtodo beheer">
            <span className="font-display text-xl font-semibold tracking-tight">Funtodo</span>
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
              Beheer
            </span>
          </Link>

          <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm font-semibold">
            <Link href="/admin" className="rounded-full px-3 py-2 text-chalk/80 hover:bg-chalk/10 hover:text-chalk">
              Gebruikers
            </Link>
            <Link href="/admin/status" className="rounded-full px-3 py-2 text-chalk/80 hover:bg-chalk/10 hover:text-chalk">
              Status
            </Link>
            <Link href="/vandaag" className="hidden rounded-full px-3 py-2 text-chalk/80 hover:bg-chalk/10 hover:text-chalk sm:inline-block">
              Naar de app
            </Link>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="rounded-full border border-chalk/20 px-3 py-2 text-xs font-semibold text-chalk/80 hover:border-chalk/40 hover:text-chalk"
              >
                Uitloggen
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:pt-8">
        <p className="mb-4 text-xs text-ink-soft">
          Ingelogd als <span className="font-semibold">@{admin.username}</span>
        </p>
        {children}
      </div>
    </div>
  );
}
