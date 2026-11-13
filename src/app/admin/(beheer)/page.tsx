import type { Metadata } from "next";
import { requireAdminSession } from "@/server/auth/session";
import { listUsers } from "@/server/repositories/users";
import { formatShortDate } from "@/lib/dates";
import { AdminCreateUser } from "@/components/admin-create-user";
import { AdminResetPassword } from "@/components/admin-reset-password";

export const metadata: Metadata = { title: "Beheer · gebruikers" };

function lastSeen(value: string | null): string {
  if (!value) return "Nog niet ingelogd";
  return `Laatst gezien ${formatShortDate(value.slice(0, 10))}`;
}

export default async function AdminPage() {
  const admin = await requireAdminSession();
  const users = await listUsers();

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Beheerder</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Gebruikers</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Iedereen krijgt een eigen expeditie. Jij maakt de accounts en kunt elk wachtwoord opnieuw instellen.
        </p>
      </header>

      <section className="panel p-5">
        <h2 className="text-xl">Nieuwe gebruiker</h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Kies een tijdelijk wachtwoord en geef het door. Daarna kan de gebruiker het zelf wijzigen.
        </p>
        <AdminCreateUser />
      </section>

      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Iedereen</h2>
          <span className="text-xs text-ink-soft">
            {users.length} {users.length === 1 ? "gebruiker" : "gebruikers"}
          </span>
        </div>

        <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-chalk">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-sm font-bold text-ink-soft">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <span className="text-xs text-ink-soft">@{user.username}</span>
                    {user.role === "admin" && (
                      <span className="rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                        beheerder
                      </span>
                    )}
                    {user.id === admin.id && (
                      <span className="text-[10px] font-semibold text-ink-soft">(jij)</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {lastSeen(user.lastLoginAt)} · {user.questsCompleted} quests afgerond
                  </p>
                  <AdminResetPassword userId={user.id} username={user.username} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
