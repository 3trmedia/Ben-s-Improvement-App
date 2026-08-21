"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Pill, Segmented, Checkbox, useToggleSet } from "@/components/ui";
import { todos, habits, goals, projects, type Entity } from "@/lib/mock-data";

const STATUS_TONE: Record<string, "accent" | "warm" | "neutral"> = {
  Live: "accent",
  "In progress": "warm",
  Planned: "neutral",
};

const ENTITY_CARD_TONE: Record<Entity, "accent" | "warm" | "none"> = {
  "3TR": "accent",
  Blackout: "none",
  Personal: "warm",
};

const ENTITY_PILL_TONE: Record<Entity, "accent" | "warm" | "neutral"> = {
  "3TR": "accent",
  Blackout: "neutral",
  Personal: "warm",
};

export default function TodoPage() {
  const [tab, setTab] = useState<"todo" | "habits" | "goals">("todo");
  const { set: doneTasks, toggle: toggleTask } = useToggleSet();
  const { set: doneHabits, toggle: toggleHabit } = useToggleSet(["h1", "h4"]);

  const groups = ["Today", "This week"] as const;

  return (
    <>
      <PageHeader eyebrow="Master list" title="To-Do & Habits" subtitle="3TR, Blackout, and Personal — one list, tagged." />

      <div className="px-5 pb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "todo", label: "To-Do" },
            { value: "habits", label: "Habits" },
            { value: "goals", label: "Goals" },
          ]}
        />
      </div>

      {tab === "todo" &&
        groups.map((group) => {
          const items = todos.filter((t) => t.due === group);
          if (!items.length) return null;
          return (
            <Section key={group} title={group}>
              <div className="flex flex-col gap-2.5">
                {items.map((t) => (
                  <Card key={t.id} accent={ENTITY_CARD_TONE[t.entity]}>
                    <div className="flex items-start gap-3">
                      <Checkbox checked={doneTasks.has(t.id)} onChange={() => toggleTask(t.id)} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[14.5px] font-medium ${
                            doneTasks.has(t.id) ? "text-ink-soft line-through" : "text-ink"
                          }`}
                        >
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">Next: {t.nextAction}</p>
                        <div className="mt-2 flex gap-1.5">
                          <Pill tone={ENTITY_PILL_TONE[t.entity]}>{t.entity}</Pill>
                          <Pill tone={t.priority === "high" ? "danger" : "neutral"}>{t.priority}</Pill>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          );
        })}

      {tab === "habits" && (
        <Section title="Check-off, not streak-guilt">
          <div className="flex flex-col gap-2.5">
            {habits.map((h) => (
              <Card key={h.id} accent="none" className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium">{h.label}</p>
                  <p className="text-[12px] text-ink-soft">{h.cadence}</p>
                </div>
                <Checkbox checked={doneHabits.has(h.id)} onChange={() => toggleHabit(h.id)} />
              </Card>
            ))}
          </div>
        </Section>
      )}

      {tab === "goals" && (
        <>
          <Section title="This quarter">
            <div className="flex flex-col gap-2.5">
              {goals.map((g) => (
                <Card key={g.id} accent="warm">
                  <p className="text-[14.5px] font-medium">{g.title}</p>
                  <p className="mt-1 text-[12.5px] text-ink-soft">{g.note}</p>
                </Card>
              ))}
            </div>
          </Section>
          <Section title="Projects">
            <div className="flex flex-col gap-2.5">
              {projects.map((p) => (
                <Card key={p.id} accent="none">
                  <p className="text-[14.5px] font-medium">{p.title}</p>
                  <p className="mt-1 text-[12.5px] text-ink-soft">{p.note}</p>
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                    {p.phases.map((phase) => (
                      <div key={phase.id} className="flex items-center justify-between">
                        <span className="text-[13.5px]">{phase.name}</span>
                        <Pill tone={STATUS_TONE[phase.status]}>{phase.status}</Pill>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  );
}
