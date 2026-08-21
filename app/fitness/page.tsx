"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Segmented, Pill } from "@/components/ui";
import { workoutDays, lastLogged, bodyLog } from "@/lib/mock-data";

type LoggedSet = { reps: string; weight: string };

export default function FitnessPage() {
  const [dayId, setDayId] = useState(workoutDays[0].id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LoggedSet>>({});
  const [logged, setLogged] = useState<Record<string, LoggedSet & { date: string }>>({});

  const [weightInput, setWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [body, setBody] = useState(bodyLog);

  const day = workoutDays.find((d) => d.id === dayId)!;

  const saveSet = (exerciseId: string) => {
    const draft = drafts[exerciseId];
    if (!draft?.reps || !draft?.weight) return;
    setLogged((prev) => ({
      ...prev,
      [exerciseId]: { ...draft, date: "Today" },
    }));
    setOpenId(null);
  };

  const addBodyEntry = () => {
    if (!weightInput.trim()) return;
    setBody((prev) => [
      { id: `bl-${Date.now()}`, date: "Today", weight: weightInput.trim(), note: noteInput.trim() || "—" },
      ...prev,
    ]);
    setWeightInput("");
    setNoteInput("");
  };

  return (
    <>
      <PageHeader eyebrow="Log" title="Fitness" subtitle="What actually got done, not just what's planned." />

      <div className="px-5 pb-5">
        <Segmented
          value={dayId}
          onChange={setDayId}
          options={workoutDays.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <Section title={day.name}>
        <div className="flex flex-col gap-2.5">
          {day.exercises.map((ex) => {
            const last = lastLogged[ex.id];
            const done = logged[ex.id];
            const isOpen = openId === ex.id;
            return (
              <Card key={ex.id} accent={done ? "accent" : "none"}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14.5px] font-medium">{ex.name}</p>
                  {done ? (
                    <Pill tone="accent">logged today</Pill>
                  ) : (
                    <button
                      onClick={() => setOpenId(isOpen ? null : ex.id)}
                      className="font-mono text-[11px] uppercase tracking-widest text-accent"
                    >
                      {isOpen ? "Cancel" : "Log"}
                    </button>
                  )}
                </div>
                <p className="mt-1 font-mono text-[12.5px] tabular-nums text-ink-soft">
                  Target: {ex.targetSets} × {ex.targetReps} · {ex.targetWeight}
                </p>
                {last && !done && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-ink-soft">
                    Last ({last.date}): {last.actualReps} · {last.actualWeight}
                  </p>
                )}
                {done && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-accent">
                    Done: {done.reps} · {done.weight}
                  </p>
                )}
                {isOpen && (
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <input
                      placeholder="reps, e.g. 6,6,5"
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [ex.id]: { ...p[ex.id], reps: e.target.value } }))
                      }
                      className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                    />
                    <input
                      placeholder="weight"
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [ex.id]: { ...p[ex.id], weight: e.target.value } }))
                      }
                      className="w-24 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => saveSet(ex.id)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-surface"
                    >
                      Save
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Body log">
        <Card accent="none">
          <div className="flex gap-2">
            <input
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Weight, e.g. 182.0 lb"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <button
              onClick={addBodyEntry}
              className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface"
            >
              Add
            </button>
          </div>
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Note (optional) — measurements, recovery score..."
            className="mt-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] outline-none placeholder:text-ink-soft focus:border-accent"
          />
        </Card>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {body.map((b) => (
            <Card key={b.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[14px] tabular-nums font-medium">{b.weight}</p>
                <p className="text-[12px] text-ink-soft">{b.note}</p>
              </div>
              <p className="text-[12px] text-ink-soft">{b.date}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Coming next (v2)">
        <Card accent="warm">
          <p className="text-[13.5px] text-ink-soft">
            Google Health Connect pull-in (RingConn ring + Hume scale), calorie-app import if it exposes an API, and
            peptide/protocol log checked against goals. Tracked as its own project under Goals, not an extension of this log.
          </p>
        </Card>
      </Section>
    </>
  );
}
