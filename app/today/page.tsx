"use client";

import Link from "next/link";
import { PageHeader, Section, Card, Pill, Checkbox, useToggleSet } from "@/components/ui";
import { todos } from "@/lib/mock-data";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const dueToday = todos.filter((t) => t.due === "Today");

export default function TodayPage() {
  const { set, toggle } = useToggleSet();

  return (
    <>
      <PageHeader eyebrow={today} title="Today" subtitle="Everything due, wherever it lives." />

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

      <Section title={`Due today (${dueToday.length})`}>
        <div className="flex flex-col gap-2.5">
          {dueToday.map((t) => (
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
