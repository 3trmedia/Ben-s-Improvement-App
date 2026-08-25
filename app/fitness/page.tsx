"use client";

import { useEffect, useState } from "react";
import { PageHeader, Section, Card, Segmented, Pill } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Exercise = {
  id: string;
  name: string;
  target_sets: number;
  target_reps: string;
  target_weight: string;
};
type Workout = { id: string; name: string; exercises: Exercise[] };
type WorkoutLog = {
  id?: string;
  exercise_id: string;
  logged_on: string;
  set_number: number;
  actual_reps: string;
  actual_weight: string;
};
type BodyEntry = { id: string; logged_on: string; weight: string; note: string | null };
type SetDraft = { reps: string; weight: string };

const SET_COUNT = 3;
const today = new Date().toISOString().slice(0, 10);

function formatSets(sets: WorkoutLog[]) {
  return sets
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => `${s.actual_reps} @ ${s.actual_weight}`)
    .join(" · ");
}

export default function FitnessPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [dayId, setDayId] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({});
  const [lastLogged, setLastLogged] = useState<Record<string, WorkoutLog[]>>({});
  const [loggedToday, setLoggedToday] = useState<Record<string, WorkoutLog[]>>({});
  const [body, setBody] = useState<BodyEntry[]>([]);

  const [weightInput, setWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    async function load() {
      const [workoutsRes, logsRes, bodyRes] = await Promise.all([
        supabase
          .from("workouts")
          .select("*, exercises(*)")
          .order("sort_order")
          .order("sort_order", { referencedTable: "exercises" }),
        supabase.from("workout_logs").select("*").order("logged_on", { ascending: false }),
        supabase.from("body_log").select("*").order("logged_on", { ascending: false }),
      ]);

      if (workoutsRes.data) {
        setWorkouts(workoutsRes.data as Workout[]);
        setDayId(workoutsRes.data[0]?.id ?? "");
      }
      if (logsRes.data) {
        const byExercise: Record<string, WorkoutLog[]> = {};
        for (const log of logsRes.data as WorkoutLog[]) {
          (byExercise[log.exercise_id] ??= []).push(log);
        }
        const last: Record<string, WorkoutLog[]> = {};
        const doneToday: Record<string, WorkoutLog[]> = {};
        for (const [exId, logs] of Object.entries(byExercise)) {
          const todays = logs.filter((l) => l.logged_on === today);
          if (todays.length) doneToday[exId] = todays;
          const mostRecentOtherDay = logs.filter((l) => l.logged_on !== today).sort((a, b) => (a.logged_on < b.logged_on ? 1 : -1))[0]?.logged_on;
          if (mostRecentOtherDay) {
            last[exId] = logs.filter((l) => l.logged_on === mostRecentOtherDay);
          }
        }
        setLastLogged(last);
        setLoggedToday(doneToday);
      }
      if (bodyRes.data) setBody(bodyRes.data as BodyEntry[]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = workouts.find((d) => d.id === dayId);

  const setDraftField = (exerciseId: string, setIndex: number, field: "reps" | "weight", value: string) => {
    setDrafts((prev) => {
      const current = prev[exerciseId] ?? Array.from({ length: SET_COUNT }, () => ({ reps: "", weight: "" }));
      const next = current.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s));
      return { ...prev, [exerciseId]: next };
    });
  };

  const saveSets = async (exerciseId: string) => {
    const draftSets = drafts[exerciseId] ?? [];
    const rows = draftSets
      .map((d, i) => ({
        exercise_id: exerciseId,
        logged_on: today,
        set_number: i + 1,
        actual_reps: d.reps,
        actual_weight: d.weight,
      }))
      .filter((r) => r.actual_reps.trim() && r.actual_weight.trim());
    if (!rows.length) return;
    const { data } = await supabase.from("workout_logs").insert(rows).select();
    if (data) setLoggedToday((prev) => ({ ...prev, [exerciseId]: data as WorkoutLog[] }));
    setOpenId(null);
  };

  const addBodyEntry = async () => {
    if (!weightInput.trim()) return;
    const { data } = await supabase
      .from("body_log")
      .insert({ logged_on: today, weight: weightInput.trim(), note: noteInput.trim() || null })
      .select()
      .single();
    if (data) setBody((prev) => [data as BodyEntry, ...prev]);
    setWeightInput("");
    setNoteInput("");
  };

  if (loading || !day) {
    return <PageHeader eyebrow="Log" title="Fitness" subtitle="Loading…" />;
  }

  return (
    <>
      <PageHeader eyebrow="Log" title="Fitness" subtitle="What actually got done, not just what's planned." />

      <div className="px-5 pb-5">
        <Segmented value={dayId} onChange={setDayId} options={workouts.map((d) => ({ value: d.id, label: d.name }))} />
      </div>

      <Section title={day.name}>
        <div className="flex flex-col gap-2.5">
          {day.exercises.map((ex) => {
            const last = lastLogged[ex.id];
            const done = loggedToday[ex.id];
            const isOpen = openId === ex.id;
            const draftSets = drafts[ex.id] ?? Array.from({ length: SET_COUNT }, () => ({ reps: "", weight: "" }));
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
                  Target: {ex.target_sets} × {ex.target_reps} · {ex.target_weight}
                </p>
                {last && !done && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-ink-soft">
                    Last ({last[0].logged_on}): {formatSets(last)}
                  </p>
                )}
                {done && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-accent">Done: {formatSets(done)}</p>
                )}
                {isOpen && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                    {draftSets.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-11 shrink-0 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                          Set {i + 1}
                        </span>
                        <input
                          value={s.reps}
                          placeholder="reps"
                          onChange={(e) => setDraftField(ex.id, i, "reps", e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                        />
                        <input
                          value={s.weight}
                          placeholder="weight"
                          onChange={(e) => setDraftField(ex.id, i, "weight", e.target.value)}
                          className="w-24 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => saveSets(ex.id)}
                      className="mt-1 rounded-lg bg-accent py-1.5 text-[12.5px] font-medium text-surface"
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
            <button onClick={addBodyEntry} className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface">
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
              <p className="text-[12px] text-ink-soft">{b.logged_on}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Coming next (v2)">
        <Card accent="warm">
          <p className="text-[13.5px] text-ink-soft">
            Google Health Connect pull-in (RingConn ring + Hume scale), and a peptide/protocol log checked against
            goals. Tracked as its own project under Goals, not an extension of this log.
          </p>
        </Card>
      </Section>
    </>
  );
}
