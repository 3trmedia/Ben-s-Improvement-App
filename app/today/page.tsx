"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, Section, Card, Pill, Checkbox, useToggleSet } from "@/components/ui";
import { todos, productionPipeline, clients } from "@/lib/mock-data";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const dueTodos = todos.filter((t) => t.due === "Today");

const dueContent = [
  ...productionPipeline.Personal.map((c) => ({ ...c, owner: "Personal" })),
  ...productionPipeline.Blackout.map((c) => ({ ...c, owner: "Blackout" })),
  ...Object.entries(productionPipeline.Clients).flatMap(([client, items]) =>
    items.map((c) => ({ ...c, owner: client }))
  ),
].filter((c) => c.due === "Today");

const dueClients = clients.filter((c) => c.nextTouch === "Today");

export default function TodayPage() {
  const { set, toggle } = useToggleSet();
  const [capture, setCapture] = useState("");
  const [inbox, setInbox] = useState<string[]>([]);

  const submitCapture = () => {
    if (!capture.trim()) return;
    setInbox((prev) => [capture.trim(), ...prev]);
    setCapture("");
  };

  return (
    <>
      <PageHeader eyebrow={today} title="Today" subtitle="One query, across To-Do, Content, and Clients — no AI in the loop." />

      <Section title="Quick capture">
        <Card accent="none">
          <div className="flex gap-2">
            <input
              value={capture}
              onChange={(e) => setCapture(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCapture()}
              placeholder="Anything, uncategorized — sort it later"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <button
              onClick={submitCapture}
              className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface"
            >
              Add
            </button>
          </div>
          {inbox.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
              {inbox.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-soft">{item}</span>
                  <Pill tone="neutral">unprocessed</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>

      <Section title="Calendar">
        <Card accent="none" className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">Google Calendar</p>
            <p className="text-[12.5px] text-ink-soft">Not connected yet</p>
          </div>
          <button className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-surface">
            Connect
          </button>
        </Card>
      </Section>

      <Section title={`Due today (${dueTodos.length})`}>
        <div className="flex flex-col gap-2.5">
          {dueTodos.map((t) => (
            <Card key={t.id} accent={t.entity === "Personal" ? "warm" : "accent"}>
              <div className="flex items-start gap-3">
                <Checkbox checked={set.has(t.id)} onChange={() => toggle(t.id)} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[14.5px] font-medium ${
                      set.has(t.id) ? "text-ink-soft line-through" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">{t.nextAction}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Pill tone={t.entity === "Personal" ? "warm" : "accent"}>{t.entity}</Pill>
                    <Pill tone={t.priority === "high" ? "danger" : "neutral"}>{t.priority}</Pill>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {dueContent.length > 0 && (
        <Section title={`Content due today (${dueContent.length})`}>
          <div className="flex flex-col gap-2.5">
            {dueContent.map((c) => (
              <Card key={c.id} accent="none">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14.5px] font-medium">{c.title}</p>
                  <Pill tone="warm">{c.stage}</Pill>
                </div>
                <p className="mt-1 text-[12.5px] text-ink-soft">{c.owner} · {c.format}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {dueClients.length > 0 && (
        <Section title={`Client touchpoints today (${dueClients.length})`}>
          <div className="flex flex-col gap-2.5">
            {dueClients.map((c) => (
              <Card key={c.id} accent="none">
                <p className="text-[14.5px] font-medium">{c.name}</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">{c.type}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="Weekly review">
        <Link href="/todo">
          <Card accent="warm" className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">Top item, every section</p>
              <p className="text-[12.5px] text-ink-soft">One screen. Nothing quietly rots in a tab.</p>
            </div>
            <span className="text-ink-soft">→</span>
          </Card>
        </Link>
      </Section>
    </>
  );
}
