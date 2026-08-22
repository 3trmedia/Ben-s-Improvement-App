"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Section, Card, Pill, Checkbox, useToggleSet } from "@/components/ui";
import CalendarMonth from "@/components/CalendarMonth";
import { todos, productionPipeline, clients, events, type EventColor } from "@/lib/mock-data";

const DOT_COLOR: Record<EventColor, string> = {
  accent: "bg-accent",
  warm: "bg-warm",
  danger: "bg-danger",
  info: "bg-info",
};

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const today = new Date(2026, 7, 21); // Aug 21, 2026 — matches the environment's current date
const todayKey = toKey(today);
const strip = Array.from({ length: 21 }, (_, i) => addDays(today, i - 7));

const dueTodos = todos.filter((t) => t.due === "Today");

const dueContent = [
  ...productionPipeline.Personal.map((c) => ({ ...c, owner: "Personal" })),
  ...productionPipeline.Blackout.map((c) => ({ ...c, owner: "Blackout" })),
  ...Object.entries(productionPipeline.Clients).flatMap(([client, items]) =>
    items.map((c) => ({ ...c, owner: client }))
  ),
].filter((c) => c.due === "Today");

const dueClients = clients.filter((c) => c.nextTouch === "Today");

export default function EventsPage() {
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [monthOpen, setMonthOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);

  const { set, toggle } = useToggleSet();
  const [capture, setCapture] = useState("");
  const [inbox, setInbox] = useState<string[]>([]);

  const submitCapture = () => {
    if (!capture.trim()) return;
    setInbox((prev) => [capture.trim(), ...prev]);
    setCapture("");
  };

  const selectedLabel = new Date(selectedKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const selectedIsToday = selectedKey === todayKey;
  const dayEvents = events.filter((e) => e.date === selectedKey);

  const onDragStart = (y: number) => {
    dragStartY.current = y;
  };
  const onDragMove = (y: number) => {
    if (dragStartY.current === null) return;
    if (y - dragStartY.current > 40 && !monthOpen) {
      setMonthOpen(true);
      dragStartY.current = null;
    }
  };
  const onDragEnd = () => {
    dragStartY.current = null;
  };

  return (
    <>
      <PageHeader eyebrow="Schedule" title="Events" subtitle="Scroll for the week, drag down for the month." />

      <div className="px-5 pb-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {strip.map((d) => {
            const key = toKey(d);
            const isSelected = key === selectedKey;
            const dayColors = Array.from(new Set(events.filter((e) => e.date === key).map((e) => e.color))).slice(0, 3);
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-2.5 py-2"
              >
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                  {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[14px] ${
                    isSelected
                      ? "border-cal-accent bg-cal-accent font-semibold text-surface"
                      : "border-ink-soft/35 text-ink"
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {dayColors.length === 0 ? (
                    <span className="h-1.5 w-1.5" />
                  ) : (
                    dayColors.map((c) => <span key={c} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[c]}`} />)
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mx-auto mb-1 h-1.5 w-10 cursor-grab touch-none rounded-full bg-line active:cursor-grabbing"
        onClick={() => setMonthOpen((v) => !v)}
        onPointerDown={(e) => onDragStart(e.clientY)}
        onPointerMove={(e) => onDragMove(e.clientY)}
        onPointerUp={onDragEnd}
        onPointerLeave={onDragEnd}
      />

      {monthOpen && (
        <CalendarMonth
          events={events}
          todayKey={todayKey}
          onClose={() => setMonthOpen(false)}
        />
      )}

      <Section title={selectedIsToday ? `Today · ${selectedLabel}` : selectedLabel}>
        {dayEvents.length === 0 ? (
          <Card accent="none">
            <p className="text-[13.5px] text-ink-soft">No events.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dayEvents.map((e) => (
              <Card key={e.id} accent="none">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[e.color]}`} />
                  <div>
                    <p className="text-[14.5px] font-medium">{e.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {e.start} – {e.end}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Google Calendar">
        <Card accent="none" className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">Not connected yet</p>
            <p className="text-[12.5px] text-ink-soft">Showing mock schedule for now</p>
          </div>
          <button className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-surface">
            Connect
          </button>
        </Card>
      </Section>

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
