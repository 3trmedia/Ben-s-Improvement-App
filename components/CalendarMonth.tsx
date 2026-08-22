"use client";

import { useState } from "react";
import type { CalEvent, EventColor } from "@/lib/mock-data";

const DOT_COLOR: Record<EventColor, string> = {
  accent: "bg-accent",
  warm: "bg-warm",
  danger: "bg-danger",
  info: "bg-info",
};

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarMonth({
  events,
  todayKey,
  onClose,
}: {
  events: CalEvent[];
  todayKey: string;
  onClose: () => void;
}) {
  const base = new Date(todayKey);
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [popupKey, setPopupKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const cells = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const eventsByDay = (key: string) => events.filter((e) => e.date === key);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const popupEvents = popupKey ? eventsByDay(popupKey) : [];
  const popupLabel = popupKey
    ? new Date(popupKey).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <div className="border-b border-line bg-surface px-5 pb-5 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-display text-[1.05rem] font-medium">{monthLabel}</p>
        <button
          onClick={() => changeMonth(1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <p key={i} className="font-mono text-[10.5px] uppercase tracking-wide text-ink-soft">
            {d}
          </p>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toKey(date);
          const isSelected = key === selectedKey;
          const dayEvents = eventsByDay(key);
          const colors = Array.from(new Set(dayEvents.map((e) => e.color))).slice(0, 3);
          return (
            <button
              key={i}
              onClick={() => {
                setSelectedKey(key);
                setPopupKey(key);
              }}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[13px] ${
                  isSelected
                    ? "border-cal-accent bg-cal-accent font-semibold text-surface"
                    : "border-cal-accent text-cal-accent"
                }`}
              >
                {date.getDate()}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {colors.map((c) => (
                  <span key={c} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[c]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="mx-auto mt-4 block font-mono text-[11px] uppercase tracking-widest text-ink-soft"
      >
        Collapse ↑
      </button>

      {popupKey && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setPopupKey(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl border border-line bg-surface p-5 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-[1.2rem] font-medium">{popupLabel}</p>
              <button
                onClick={() => setPopupKey(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink-soft"
              >
                ✕
              </button>
            </div>
            {popupEvents.length === 0 ? (
              <p className="text-[13.5px] text-ink-soft">No events.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {popupEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[e.color]}`} />
                    <div>
                      <p className="text-[14px] font-medium">{e.title}</p>
                      <p className="text-[12.5px] text-ink-soft">
                        {e.start} – {e.end}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setPopupKey(null)}
              className="mt-5 w-full rounded-lg border border-line py-2.5 text-[13px] font-medium text-ink-soft"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
