import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Beheer · inloggen" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role === "admin") redirect("/admin");

  const params = await searchParams;

  return (
    <div className="min-h-dvh bg-ink text-chalk">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="rounded-3xl border border-chalk/15 bg-chalk/[0.06] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur sm:p-8">
          <div className="flex items-center justify-between">
            <Logo href="/admin/inloggen" />
            <span className="rounded-full border border-gold/40 px-2.5 py-1 text-[11px] font-semibold text-gold">
              Beheer
            </span>
          </div>

          <h1 className="mt-7 font-display text-3xl font-semibold">De commandopost</h1>
          <p className="mt-1 text-sm text-chalk/70">
            Log in met een beheerdersaccount om gebruikers en wachtwoorden te beheren.
          </p>

          {params.error === "role" && (
            <p className="mt-4 rounded-xl border border-ember/40 bg-ember/15 px-3 py-2 text-sm text-chalk">
              Dit account is geen beheerder. Log in met een beheerdersaccount.
            </p>
          )}

          {user && user.role !== "admin" && (
            <p className="mt-4 rounded-xl border border-chalk/20 bg-chalk/10 px-3 py-2 text-xs text-chalk/80">
              Je bent nu ingelogd als @{user.username}. Inloggen als beheerder vervangt die sessie.
            </p>
          )}

          <div className="mt-6 [&_.field]:border-chalk/20 [&_.field]:bg-chalk/10 [&_.field]:text-chalk [&_.field::placeholder]:text-chalk/40 [&_label]:text-chalk/80 [&_p]:text-chalk/50">
            <AdminLoginForm />
          </div>
        </div>

        <Link href="/" className="mt-6 text-center text-xs font-semibold text-chalk/60 hover:text-chalk">
          ← Terug naar Funtodo
        </Link>
      </div>
    </div>
  );
}
