"use client";

import { useActionState, useState } from "react";
import { resetPasswordAction, type AuthState } from "@/server/actions/auth";

const initial: AuthState = {};

function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

export function AdminResetPassword({ userId, username }: { userId: string; username: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);
  const [password, setPassword] = useState("");

  return (
    <details className="mt-2 rounded-xl border border-line bg-paper/50 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
        Wachtwoord van @{username} opnieuw instellen
      </summary>
      <form action={formAction} className="mt-2.5 flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input
          name="password"
          type="text"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nieuw wachtwoord"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="field !min-h-10 !w-auto flex-1 !py-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setPassword(generatePassword())}
          className="btn btn-ghost !min-h-10 !px-3 !text-xs"
        >
          Genereer
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary !min-h-10 !px-3 !text-xs">
          {pending ? "Opslaan…" : "Opslaan"}
        </button>
      </form>
      <p className="mt-1.5 text-[11px] text-ink-soft">
        Geef het nieuwe wachtwoord door. De gebruiker kan het daarna zelf wijzigen bij het profiel.
      </p>
      {state.error && <p className="mt-1 text-xs text-ember">{state.error}</p>}
      {state.ok && <p className="mt-1 text-xs text-moss-deep">{state.message}</p>}
    </details>
  );
}
