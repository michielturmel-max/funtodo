"use client";

import { useActionState } from "react";
import { changePasswordAction, type AuthState } from "@/server/actions/auth";

const initial: AuthState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="currentPassword" className="block text-sm font-semibold">
            Huidig wachtwoord
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="block text-sm font-semibold">
            Nieuw wachtwoord
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="field"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold">
            Nog een keer
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="field"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Bezig…" : "Wachtwoord wijzigen"}
        </button>
        {state.error && <p className="text-sm text-ember">{state.error}</p>}
        {state.ok && <p className="text-sm text-moss-deep">{state.message}</p>}
      </div>

      <p className="text-xs text-ink-soft">Minstens 8 tekens. Je blijft ingelogd op dit apparaat.</p>
    </form>
  );
}
