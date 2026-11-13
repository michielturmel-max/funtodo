"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/server/actions/auth";
import { ArrowRightIcon } from "./icons";

const initial: AuthState = {};

export function LoginForm({ initialError }: { initialError?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-semibold">
          Gebruikersnaam
        </label>
        <input
          id="username"
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
        <label htmlFor="password" className="block text-sm font-semibold">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Je wachtwoord"
          className="field !min-h-12"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full !min-h-12">
        {pending ? "Even geduld…" : "Naar je kamp"}
        {!pending && <ArrowRightIcon className="size-4" />}
      </button>

      {initialError && !state.error && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          Log opnieuw in om verder te gaan.
        </p>
      )}

      {state.error && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        Je account wordt door de beheerder aangemaakt. Je wachtwoord kun je later zelf wijzigen bij je profiel.
      </p>
    </form>
  );
}
