import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { CampScene } from "@/components/camp-scene";
import { FlameIcon, SparkIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Funtodo — je dag als expeditie",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/vandaag");

  const params = await searchParams;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <svg
        className="pointer-events-none absolute -right-40 top-0 h-[720px] w-[900px] text-ink/[0.07]"
        viewBox="0 0 900 720"
        fill="none"
        aria-hidden="true"
      >
        {Array.from({ length: 9 }).map((_, index) => (
          <path
            key={index}
            d={`M${-40 + index * 8} ${120 + index * 46}C${180 + index * 14} ${40 + index * 42}, ${330 - index * 10} ${260 + index * 30}, ${520 + index * 6} ${200 + index * 38}S${860 - index * 4} ${120 + index * 40}, ${960} ${240 + index * 34}`}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <a href="#inloggen" className="btn btn-ghost !min-h-10 !px-4 !text-sm">
          Naar je kamp
        </a>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pt-12">
        <section>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-ember">
            <SparkIcon className="size-4" />
            Een todo-lijst met een kampvuur
          </p>
          <h1 className="mt-4 max-w-xl text-balance font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Je dag is een <span className="italic text-moss-deep">expeditie</span>.
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-ink-soft">
            Kies één hoofdquest, maximaal drie zijpaden en houd je vuur brandend. Funtodo maakt van je taken een
            route die je echt wilt aflopen.
          </p>

          <div id="inloggen" className="mt-7 max-w-md scroll-mt-24">
            <div className="panel p-5 sm:p-6">
              <h2 className="text-xl">Naar je kamp</h2>
              <p className="mb-4 mt-1 text-sm text-ink-soft">
                Log in met de gebruikersnaam en het wachtwoord die je van de beheerder kreeg.
              </p>
              <LoginForm initialError={params.error === "link"} />
            </div>
          </div>

          <dl className="mt-7 grid max-w-lg grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="font-semibold">Geen straf</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">Een gemiste dag dooft je vuur niet.</dd>
            </div>
            <div>
              <dt className="font-semibold">Geen ranglijst</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">Jij speelt tegen je eigen week.</dd>
            </div>
            <div>
              <dt className="font-semibold">Wel richting</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">Elke quest heeft een eerste stap.</dd>
            </div>
          </dl>
        </section>

        <section className="relative">
          <div className="panel overflow-hidden">
            <CampScene level={4} className="h-auto w-full" />
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-soft">Vandaag · 2 van 4 stops</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember">
                  <FlameIcon className="size-3.5" />
                  6 dagen
                </span>
              </div>

              <div className="rounded-xl bg-ink p-4 text-chalk">
                <p className="text-[11px] font-semibold text-chalk/60">Hoofdquest</p>
                <p className="mt-1 font-display text-xl font-semibold">Rapport afmaken</p>
                <p className="mt-1 text-xs text-chalk/70">Eerste stap: open het document en schrijf de inleiding</p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-chalk/60">± 45 min · Stevig</span>
                  <span className="font-bold text-gold">+54 XP</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-line bg-chalk px-4 py-3">
                <span className="size-2.5 rounded-full bg-moss" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Wandeling na de lunch</p>
                  <p className="text-xs text-ink-soft">Eerste stap: schoenen aan</p>
                </div>
                <span className="text-xs font-semibold text-ember">+20 XP</span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-ink-soft">
                <span className="size-2.5 rounded-full bg-line" />
                <p className="text-sm">Je volgende stop verschijnt hier</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Gebouwd rond aandacht, niet rond verslaving.</p>
          <p>Eén hoofdquest. Drie zijpaden. Eén vuur.</p>
        </div>
      </footer>
    </div>
  );
}
