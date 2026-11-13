"use client";

import { useState } from "react";

type TokenSummary = {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

type Message = { tone: "ok" | "error"; text: string } | null;

function datum(value: string | null): string {
  if (!value) return "nooit gebruikt";
  return value.slice(0, 10);
}

export function PluginTokens({ initialTokens }: { initialTokens: TokenSummary[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [label, setLabel] = useState("Omarchy-balk");
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  async function maak(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/plugin/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        token?: string;
        tokenInfo?: TokenSummary;
      };
      if (!data.ok || !data.token || !data.tokenInfo) {
        setMessage({ tone: "error", text: "Een token maken lukte niet." });
        return;
      }
      setTokens((current) => [data.tokenInfo!, ...current]);
      setCreated(data.token);
      setMessage({ tone: "ok", text: "Token gemaakt. Kopieer hem nu; je ziet hem maar één keer." });
    } catch {
      setMessage({ tone: "error", text: "De server was niet bereikbaar." });
    } finally {
      setPending(false);
    }
  }

  async function verwijder(token: TokenSummary) {
    if (!window.confirm(`Token ${token.prefix}… intrekken? De balk stopt dan met werken.`)) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/plugin/tokens?id=${encodeURIComponent(token.id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean };
      if (!data.ok) {
        setMessage({ tone: "error", text: "Intrekken lukte niet." });
        return;
      }
      setTokens((current) => current.filter((row) => row.id !== token.id));
      setMessage({ tone: "ok", text: "Token ingetrokken." });
    } catch {
      setMessage({ tone: "error", text: "De server was niet bereikbaar." });
    } finally {
      setPending(false);
    }
  }

  async function kopieer() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setMessage({ tone: "ok", text: "Token gekopieerd." });
    } catch {
      setMessage({ tone: "error", text: "Kopiëren lukte niet; selecteer de tekst zelf." });
    }
  }

  return (
    <div className="rounded-xl border border-line bg-paper/60 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky/15 text-sky-ink">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M3 20 12 5l9 15H3Z" strokeLinejoin="round" />
            <path d="M12 5V2" strokeLinecap="round" />
            <path d="M12 2l5 1.6L12 5.2Z" strokeLinejoin="round" />
            <path d="M9 20l3-7 3 7" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Omarchy-balk</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            Met een token leest de balk je quests en voegt hij er een toe. Elk token hoort bij jouw account;
            trek het in als je hem niet meer gebruikt.
          </p>

          <form onSubmit={maak} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1 space-y-1.5">
              <label htmlFor="plugin-label" className="block text-xs font-semibold">
                Naam
              </label>
              <input
                id="plugin-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={60}
                className="field !py-2 !text-sm"
              />
            </div>
            <button type="submit" className="btn btn-primary !px-3 !py-2 !text-xs" disabled={pending}>
              {pending ? "Bezig…" : "Token maken"}
            </button>
          </form>

          {created && (
            <div className="mt-3 rounded-xl border border-gold/50 bg-gold/10 p-3">
              <p className="text-xs font-semibold">Nieuw token</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-paper px-2 py-1.5 text-xs">
                  {created}
                </code>
                <button type="button" className="btn btn-ghost !px-2.5 !py-1.5 !text-xs" onClick={kopieer}>
                  Kopieer
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                In de terminal: <code className="rounded bg-paper px-1">funtodo login</code> en plak dit token.
                Of zet hem in <code className="rounded bg-paper px-1">~/.config/funtodo/plugin.json</code>.
              </p>
            </div>
          )}

          {message && (
            <p
              className={`mt-2 text-xs ${message.tone === "ok" ? "text-moss-deep" : "text-ember"}`}
              role="status"
            >
              {message.text}
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {tokens.length === 0 ? (
              <li className="text-xs text-ink-soft">Nog geen tokens. Maak er een voor je Omarchy-balk.</li>
            ) : (
              tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper/70 px-3 py-2"
                >
                  <code className="text-xs">{token.prefix}…</code>
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                    {token.label} · gemaakt {datum(token.createdAt)} · {datum(token.lastUsedAt)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost !px-2 !py-1 !text-[11px]"
                    onClick={() => verwijder(token)}
                    disabled={pending}
                  >
                    Intrekken
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
