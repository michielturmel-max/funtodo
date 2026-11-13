import type { Metadata } from "next";
import Link from "next/link";
import { parseAvatar } from "@/lib/avatar";
import { logoutAction } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";
import { getPlayer, getStats } from "@/server/repositories/player";
import { listPluginTokens } from "@/server/repositories/plugin";
import { Avatar } from "@/components/avatar";
import { ChangePasswordForm } from "@/components/change-password";
import { PluginTokens } from "@/components/plugin-tokens";
import { PushSettings } from "@/components/push-settings";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Profiel" };

export default async function ProfilePage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const stats = await getStats(user.id);
  const pluginTokens = await listPluginTokens(user.id);
  const avatar = parseAvatar(player.avatar);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Je gegevens</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Profiel</h1>
      </header>

      <section className="panel p-5">
        <div className="flex items-center gap-4">
          <Avatar config={avatar} title="Jouw avatar" className="size-14 shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate text-xl">{player.displayName}</h2>
            <p className="truncate text-sm text-ink-soft">@{user.username}</p>
          </div>
          {user.role === "admin" && (
            <span className="ml-auto rounded-full border border-gold/50 bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
              Beheerder
            </span>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-paper/70 px-3 py-2.5">
            <dt className="text-xs text-ink-soft">Totaal XP</dt>
            <dd className="font-semibold">{stats.totalXp}</dd>
          </div>
          <div className="rounded-xl bg-paper/70 px-3 py-2.5">
            <dt className="text-xs text-ink-soft">Kampniveau</dt>
            <dd className="font-semibold">{player.campLevel}</dd>
          </div>
          <div className="rounded-xl bg-paper/70 px-3 py-2.5">
            <dt className="text-xs text-ink-soft">Reeks</dt>
            <dd className="font-semibold">{stats.streak} dagen</dd>
          </div>
          <div className="rounded-xl bg-paper/70 px-3 py-2.5">
            <dt className="text-xs text-ink-soft">Tijdzone</dt>
            <dd className="font-semibold">Europe/Amsterdam</dd>
          </div>
        </dl>

        <form action={logoutAction} className="mt-5">
          <button type="submit" className="btn btn-ghost">
            Uitloggen
          </button>
        </form>
      </section>

      <Link
        href="/profiel/avatar"
        className="panel flex items-center gap-4 px-5 py-4 transition-colors hover:bg-chalk"
      >
        <Avatar config={avatar} className="size-12 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Jouw reiziger</span>
          <span className="block text-xs text-ink-soft">
            Kies kapsel, kleren en accessoires. Verdien munten met quests.
          </span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-soft" />
      </Link>

      {user.role === "admin" && (
        <Link
          href="/admin"
          className="panel flex items-center gap-4 px-5 py-4 transition-colors hover:bg-chalk"
        >
          <span className="grid size-10 place-items-center rounded-full bg-ink text-chalk">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3 19c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6" strokeLinecap="round" />
              <path d="M17 7v6M14 10h6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Gebruikers beheren</span>
            <span className="block text-xs text-ink-soft">Open de commandopost om accounts en wachtwoorden te beheren.</span>
          </span>
          <ChevronRightIcon className="size-5 shrink-0 text-ink-soft" />
        </Link>
      )}

      <section className="panel p-5">
        <h2 className="text-xl">Wachtwoord</h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Kies iets wat je onthoudt. Er is geen herstelmail; de beheerder kan je wachtwoord opnieuw instellen.
        </p>
        <ChangePasswordForm />
      </section>

      <section className="panel p-5">
        <h2 className="text-xl">Op je telefoon</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Funtodo werkt in de browser en als app op je beginscherm. Zo voelt hij sneller en kun je hem offline
          openen.
        </p>
        <div className="mt-4">
          <PushSettings />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper/60 p-4">
            <p className="text-sm font-semibold">iPhone</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Open Funtodo in Safari, tik op het deel-icoon en kies “Zet op beginscherm”.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper/60 p-4">
            <p className="text-sm font-semibold">Android</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Open Funtodo in Chrome en kies “App installeren” of “Toevoegen aan startscherm”.
            </p>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-xl">Omarchy-balk</h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Laat je quests in de bovenbalk van je bureaublad staan. De plugin leest en schrijft via dezelfde app.
        </p>
        <PluginTokens initialTokens={pluginTokens} />
      </section>

      <section className="panel p-5">
        <h2 className="text-xl">Zo werkt het</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <span className="font-semibold">Eén hoofdquest per dag.</span>{" "}
            <span className="text-ink-soft">De stop die het meest telt krijgt voorrang.</span>
          </li>
          <li>
            <span className="font-semibold">Maximaal drie zijpaden.</span>{" "}
            <span className="text-ink-soft">Meer is geen plan, dat is een wenslijst.</span>
          </li>
          <li>
            <span className="font-semibold">Elke quest heeft een eerste stap.</span>{" "}
            <span className="text-ink-soft">Geen stap? Dan is de quest nog te groot.</span>
          </li>
          <li>
            <span className="font-semibold">Een gemiste dag dooft je vuur niet.</span>{" "}
            <span className="text-ink-soft">Je hebt één rustdag per maand.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
