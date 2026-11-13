"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "./icons";
import { disablePush, enablePush, getPushSubscription, pushSupported } from "@/lib/push-client";

type Status = "loading" | "unsupported" | "off" | "on";
type Message = { tone: "ok" | "error"; text: string } | null;

export function PushSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }

    let alive = true;
    getPushSubscription()
      .then((subscription) => {
        if (alive) setStatus(subscription ? "on" : "off");
      })
      .catch(() => {
        if (alive) setStatus("off");
      });

    return () => {
      alive = false;
    };
  }, []);

  async function turnOn() {
    setPending(true);
    setMessage(null);
    try {
      const result = await enablePush();
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error ?? "Aanzetten lukte niet." });
        return;
      }
      setStatus("on");
      setMessage({ tone: "ok", text: "Push staat aan. Je krijgt een melding als je wekker afgaat." });
    } catch {
      setMessage({ tone: "error", text: "Aanzetten lukte niet. Probeer het opnieuw." });
    } finally {
      setPending(false);
    }
  }

  async function turnOff() {
    setPending(true);
    setMessage(null);
    try {
      const result = await disablePush();
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error ?? "Uitzetten lukte niet." });
        return;
      }
      setStatus("off");
      setMessage({ tone: "ok", text: "Push staat uit. Je wekker blijft werken zolang de app open is." });
    } catch {
      setMessage({ tone: "error", text: "Uitzetten lukte niet. Probeer het opnieuw." });
    } finally {
      setPending(false);
    }
  }

  async function sendTest() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean };
      setMessage(
        data.ok
          ? { tone: "ok", text: "Proefmelding verstuurd. Kijk op je telefoon." }
          : { tone: "error", text: "Geen proefmelding verstuurd. Sta meldingen toe in je browser." },
      );
    } catch {
      setMessage({ tone: "error", text: "De server was niet bereikbaar." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-paper/60 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ember/10 text-ember">
          <BellIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Wekker op je telefoon</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            {status === "unsupported"
              ? "Deze browser kan geen pushmeldingen ontvangen. Op iPhone werkt het zodra Funtodo op je beginscherm staat."
              : status === "on"
                ? "Push staat aan. Je wekker komt ook binnen als Funtodo dicht is."
                : "Zet push aan zodat je wekker ook afgaat als de app dicht is."}
          </p>

          {status === "loading" ? (
            <p className="mt-3 text-xs text-ink-soft">Even kijken…</p>
          ) : status === "unsupported" ? null : (
            <div className="mt-3 flex flex-wrap gap-2">
              {status === "on" ? (
                <>
                  <button type="button" className="btn btn-ghost !px-3 !py-2 !text-xs" onClick={sendTest} disabled={pending}>
                    Stuur proefmelding
                  </button>
                  <button type="button" className="btn btn-ghost !px-3 !py-2 !text-xs" onClick={turnOff} disabled={pending}>
                    Zet uit
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-ember !px-3 !py-2 !text-xs" onClick={turnOn} disabled={pending}>
                  {pending ? "Bezig…" : "Zet push aan"}
                </button>
              )}
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
        </div>
      </div>
    </div>
  );
}
