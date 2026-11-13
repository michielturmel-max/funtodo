"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAction, type AuthState } from "@/server/actions/auth";

const initial: AuthState = {};

export function AdminCreateUser() {
  const [state, formAction, pending] = useActionState(createUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="new-username" className="block text-sm font-semibold">
            Gebruikersnaam
          </label>
          <input
            id="new-username"
            name="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="sanne"
            className="field"
          />
          <p className="text-xs text-ink-soft">Kleine letters, cijfers, punt, streepje of underscore.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-name" className="block text-sm font-semibold">
            Weergavenaam
          </label>
          <input id="new-name" name="name" required placeholder="Sanne" className="field" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-semibold">
            Tijdelijk wachtwoord
          </label>
          <input
            id="new-password"
            name="password"
            type="text"
            minLength={8}
            required
            placeholder="Minstens 8 tekens"
            className="field"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-role" className="block text-sm font-semibold">
            Rol
          </label>
          <select id="new-role" name="role" defaultValue="member" className="field">
            <option value="member">Reiziger</option>
            <option value="admin">Beheerder</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Aanmaken…" : "Gebruiker aanmaken"}
        </button>
        {state.error && <p className="text-sm text-ember">{state.error}</p>}
        {state.ok && <p className="text-sm text-moss-deep">{state.message}</p>}
      </div>

      <p className="text-xs text-ink-soft">
        Geef het tijdelijke wachtwoord door. De gebruiker kan het daarna zelf wijzigen bij het profiel.
      </p>
    </form>
  );
}
