import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Logo />
      <h1 className="mt-10 text-4xl">Geen bereik.</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Je bent offline. Wat je al had afgevinkt blijft bewaard en wordt verstuurd zodra je weer verbinding hebt.
        Deze pagina laadt zodra je online bent opnieuw.
      </p>
      <Link href="/vandaag" className="btn btn-ghost mt-6 w-full">
        Opnieuw proberen
      </Link>
    </div>
  );
}
