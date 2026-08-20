"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Segmented } from "@/components/ui";
import { workoutDays } from "@/lib/mock-data";

export default function FitnessPage() {
  const [dayId, setDayId] = useState(workoutDays[0].id);
  const day = workoutDays.find((d) => d.id === dayId)!;

  return (
    <>
      <PageHeader eyebrow="Reference" title="Fitness" subtitle="Your plan, edited over time — static v1." />

      <div className="px-5 pb-5">
        <Segmented
          value={dayId}
          onChange={setDayId}
          options={workoutDays.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <Section
        title={day.name}
        action={
          <button className="font-mono text-[11px] uppercase tracking-widest text-accent">
            + Add exercise
          </button>
        }
      >
        <div className="flex flex-col gap-2.5">
          {day.exercises.map((ex) => (
            <Card key={ex.id} accent="none" className="flex items-center justify-between">
              <p className="text-[14.5px] font-medium">{ex.name}</p>
              <p className="font-mono text-[13px] tabular-nums text-ink-soft">
                {ex.sets} × {ex.reps} · {ex.weight}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
