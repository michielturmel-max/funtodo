"use client";

import { useActionState } from "react";
import { adminLoginAction, type AuthState } from "@/server/actions/auth";
import { ArrowRightIcon } from "./icons";

const initial: AuthState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="admin-username" className="block text-sm font-semibold">
          Gebruikersnaam
        </label>
        <input
          id="admin-username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="gebruikersnaam"
          className="field !min-h-12"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="admin-password" className="block text-sm font-semibold">
          Wachtwoord
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Je beheerderswachtwoord"
          className="field !min-h-12"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-ember w-full !min-h-12">
        {pending ? "Even geduld…" : "Inloggen als beheerder"}
        {!pending && <ArrowRightIcon className="size-4" />}
      </button>

      {state.error && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        Alleen accounts met de rol beheerder komen hier binnen. Reizigers loggen in via de app.
      </p>
    </form>
  );
}
