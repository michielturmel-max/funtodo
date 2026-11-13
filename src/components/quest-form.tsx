"use client";

import { useActionState, useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { createQuestStateAction, type NewQuestState } from "@/server/actions/quests";
import { DIFFICULTIES, DOMAINS, DOMAIN_KEYS, IMPORTANCES } from "@/lib/game";
import { ArrowRightIcon, ChevronRightIcon } from "./icons";

const DRAFT_KEY = "funtodo:quest-draft";

type Draft = {
  title: string;
  nextAction: string;
  domain: string;
  difficulty: string;
  importance: string;
  estimateMin: string;
  scheduledDate: string;
  scheduledTime: string;
  isMain: boolean;
  subtasks: string;
};

function emptyDraft(today: string): Draft {
  return {
    title: "",
    nextAction: "",
    domain: "craft",
    difficulty: "2",
    importance: "2",
    estimateMin: "25",
    scheduledDate: today,
    scheduledTime: "",
    isMain: false,
    subtasks: "",
  };
}

export function QuestForm({ today, hasMain }: { today: string; hasMain: boolean }) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(today));
  const [state, formAction, pending] = useActionState(createQuestStateAction, {} as NewQuestState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        setDraft({ ...emptyDraft(today), ...parsed, scheduledDate: parsed.scheduledDate ?? today });
      }
    } catch {
      // A broken draft is not worth blocking the form.
    }
    setReady(true);
  }, [today]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage can be full or blocked; the form still works.
    }
  }, [draft, ready]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function blockEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.preventDefault();
  }

  const error = state.error;

  return (
    <form
      action={formAction}
      onSubmit={() => {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // Ignored.
        }
      }}
      className="panel space-y-5 p-5 sm:p-6"
    >
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-semibold">
          De quest
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
          onKeyDown={blockEnter}
          placeholder="Rapport afmaken"
          className="field !text-lg"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nextAction" className="text-sm font-semibold">
          De eerste fysieke stap
        </label>
        <input
          id="nextAction"
          name="nextAction"
          required
          maxLength={200}
          value={draft.nextAction}
          onChange={(event) => update("nextAction", event.target.value)}
          onKeyDown={blockEnter}
          placeholder="Open het document en schrijf de inleiding"
          className="field"
        />
        <p className="text-xs text-ink-soft">Geen stap die je nu kunt doen? Maak de quest kleiner.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="domain" className="text-sm font-semibold">
            Welk deel van je leven
          </label>
          <select
            id="domain"
            name="domain"
            value={draft.domain}
            onChange={(event) => update("domain", event.target.value)}
            className="field"
          >
            {DOMAIN_KEYS.map((key) => (
              <option key={key} value={key}>
                {DOMAINS[key].label} — {DOMAINS[key].blurb}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="estimateMin" className="text-sm font-semibold">
            Schatting
          </label>
          <select
            id="estimateMin"
            name="estimateMin"
            value={draft.estimateMin}
            onChange={(event) => update("estimateMin", event.target.value)}
            className="field"
          >
            <option value="10">10 minuten</option>
            <option value="15">15 minuten</option>
            <option value="25">25 minuten</option>
            <option value="45">45 minuten</option>
            <option value="60">1 uur</option>
            <option value="90">1,5 uur</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="difficulty" className="text-sm font-semibold">
            Hoe zwaar
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={draft.difficulty}
            onChange={(event) => update("difficulty", event.target.value)}
            className="field"
          >
            {[1, 2, 3].map((value) => (
              <option key={value} value={value}>
                {DIFFICULTIES[value as 1 | 2 | 3].label} — {DIFFICULTIES[value as 1 | 2 | 3].hint}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="importance" className="text-sm font-semibold">
            Hoeveel telt het
          </label>
          <select
            id="importance"
            name="importance"
            value={draft.importance}
            onChange={(event) => update("importance", event.target.value)}
            className="field"
          >
            {[1, 2, 3].map((value) => (
              <option key={value} value={value}>
                {IMPORTANCES[value as 1 | 2 | 3].label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="scheduledDate" className="text-sm font-semibold">
            Wanneer
          </label>
          <select
            id="scheduledDate"
            name="scheduledDate"
            value={draft.scheduledDate}
            onChange={(event) => update("scheduledDate", event.target.value)}
            className="field"
          >
            <option value={today}>Vandaag</option>
            <option value="">Inbox — nog geen datum</option>
          </select>
        </div>

        {draft.scheduledDate && (
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="scheduledTime" className="text-sm font-semibold">
              Wekker (optioneel)
            </label>
            <input
              id="scheduledTime"
              name="scheduledTime"
              type="time"
              value={draft.scheduledTime}
              onChange={(event) => update("scheduledTime", event.target.value)}
              className="field max-w-40"
            />
            <p className="text-xs text-ink-soft">
              Laat leeg als je geen wekker wilt. Op dat moment krijg je een melding en een piep zolang de app
              openstaat.
            </p>
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line bg-white/40 p-3">
        <input
          type="checkbox"
          name="isMain"
          checked={draft.isMain && !hasMain}
          disabled={hasMain}
          onChange={(event) => update("isMain", event.target.checked)}
          className="mt-1 size-4 accent-[var(--color-ember)]"
        />
        <span className="text-sm">
          <span className="font-semibold">Hoofdquest</span>
          <span className="block text-xs text-ink-soft">
            {hasMain
              ? "Deze dag heeft al een hoofdquest."
              : "Eén per dag. Dit is de stop die het meest telt."}
          </span>
        </span>
      </label>

      <div className="space-y-1.5">
        <label htmlFor="subtasks" className="text-sm font-semibold">
          Stappen (optioneel)
        </label>
        <textarea
          id="subtasks"
          name="subtasks"
          rows={4}
          value={draft.subtasks}
          onChange={(event) => update("subtasks", event.target.value)}
          className="field"
          placeholder={"Outline maken\nEerste alinea schrijven\nFeedback vragen"}
        />
        <p className="text-xs text-ink-soft">Eén stap per regel. Handig als een quest een baas wordt.</p>
      </div>

      {error && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={pending} className="btn btn-primary flex-1">
          {pending ? "Opslaan…" : "Op de kaart zetten"}
          {!pending && <ArrowRightIcon className="size-4" />}
        </button>
        <Link href="/vandaag" className="btn btn-ghost sm:w-auto">
          Annuleren
        </Link>
      </div>
    </form>
  );
}
