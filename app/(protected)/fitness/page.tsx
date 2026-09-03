"use client";

import { useEffect, useState } from "react";
import { PageHeader, Section, Card, Segmented, Pill } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cacheGet, cacheSet, writeOrQueue } from "@/lib/offline/sync";

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

// Workout "days" run 4am-to-4am, not midnight-to-midnight — a late-night
// session after midnight still counts as the day that's ending, not a new one.
function gymDay(d = new Date()) {
  const shifted = new Date(d);
  shifted.setHours(shifted.getHours() - 4);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function deriveLogState(rawLogs: WorkoutLog[], today: string) {
  const byExercise: Record<string, WorkoutLog[]> = {};
  for (const log of rawLogs) {
    (byExercise[log.exercise_id] ??= []).push(log);
  }
  const last: Record<string, WorkoutLog[]> = {};
  const doneToday: Record<string, WorkoutLog[]> = {};
  for (const [exId, logs] of Object.entries(byExercise)) {
    const todays = logs.filter((l) => l.logged_on === today);
    if (todays.length) doneToday[exId] = todays;
    const mostRecentOtherDay = logs
      .filter((l) => l.logged_on !== today)
      .sort((a, b) => (a.logged_on < b.logged_on ? 1 : -1))[0]?.logged_on;
    if (mostRecentOtherDay) {
      last[exId] = logs.filter((l) => l.logged_on === mostRecentOtherDay);
    }
  }
  return { last, doneToday };
}

function formatSets(sets: WorkoutLog[]) {
  return sets
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => `${s.actual_reps} @ ${s.actual_weight}`)
    .join(" · ");
}

function parseTargetUpper(targetReps: string): number | null {
  const nums = targetReps.match(/\d+/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
}

function parseWeight(w: string): { value: number; unit: string } | null {
  const m = w.trim().match(/^([\d.]+)\s*(.*)$/);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: m[2].trim() };
}

function nextIncrement(weight: number) {
  if (weight <= 30) return 2.5;
  if (weight <= 100) return 5;
  return 10;
}

// Simple progressive-overload heuristic: hit the top of the rep range on
// every set last time -> bump the weight; otherwise repeat it. Increment size
// scales with the weight itself so a 20 lb dumbbell doesn't jump the same
// amount as a 275 lb deadlift. This is a starting rule, not tuned per-lift.
function suggestNext(exercise: Exercise, lastSets: WorkoutLog[] | undefined): string | null {
  if (!lastSets?.length) return null;
  const targetUpper = parseTargetUpper(exercise.target_reps);
  if (targetUpper == null) return null;
  const parsed = lastSets.map((s) => parseWeight(s.actual_weight)).filter((w): w is { value: number; unit: string } => !!w);
  if (!parsed.length) return null;
  const { value, unit } = parsed[0];
  const allMetTarget = lastSets.every((s) => {
    const reps = parseInt(s.actual_reps, 10);
    return !Number.isNaN(reps) && reps >= targetUpper;
  });
  const nextValue = allMetTarget ? value + nextIncrement(value) : value;
  return unit ? `${nextValue} ${unit}` : `${nextValue}`;
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

  const today = gymDay();

  useEffect(() => {
    async function load() {
      if (!navigator.onLine) {
        const [cWorkouts, cLogs, cBody] = await Promise.all([
          cacheGet<Workout[]>("workouts"),
          cacheGet<WorkoutLog[]>("workoutLogsAll"),
          cacheGet<BodyEntry[]>("bodyLog"),
        ]);
        if (cWorkouts) {
          setWorkouts(cWorkouts);
          setDayId(cWorkouts[0]?.id ?? "");
        }
        if (cLogs) {
          const { last, doneToday } = deriveLogState(cLogs, today);
          setLastLogged(last);
          setLoggedToday(doneToday);
        }
        if (cBody) setBody(cBody);
        setLoading(false);
        return;
      }

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
        cacheSet("workouts", workoutsRes.data);
      }
      if (logsRes.data) {
        const raw = logsRes.data as WorkoutLog[];
        const { last, doneToday } = deriveLogState(raw, today);
        setLastLogged(last);
        setLoggedToday(doneToday);
        cacheSet("workoutLogsAll", raw);
      }
      if (bodyRes.data) {
        setBody(bodyRes.data as BodyEntry[]);
        cacheSet("bodyLog", bodyRes.data);
      }
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

  const openLogger = (exercise: Exercise) => {
    if (openId === exercise.id) {
      setOpenId(null);
      return;
    }
    const existing = loggedToday[exercise.id];
    const suggestion = suggestNext(exercise, lastLogged[exercise.id]);
    const initial: SetDraft[] = Array.from({ length: SET_COUNT }, (_, i) => {
      const row = existing?.find((r) => r.set_number === i + 1);
      if (row) return { reps: row.actual_reps, weight: row.actual_weight };
      return { reps: "", weight: suggestion ?? "" };
    });
    setDrafts((prev) => ({ ...prev, [exercise.id]: initial }));
    setOpenId(exercise.id);
  };

  const saveSets = async (exerciseId: string) => {
    const draftSets = drafts[exerciseId] ?? [];
    const existing = loggedToday[exerciseId] ?? [];
    const results: WorkoutLog[] = [];
    for (let i = 0; i < SET_COUNT; i++) {
      const d = draftSets[i];
      if (!d?.reps.trim() || !d?.weight.trim()) continue;
      const existingRow = existing.find((r) => r.set_number === i + 1);
      if (existingRow?.id) {
        const updated: WorkoutLog = { ...existingRow, actual_reps: d.reps, actual_weight: d.weight };
        results.push(updated);
        await writeOrQueue({
          table: "workout_logs",
          op: "update",
          payload: { actual_reps: d.reps, actual_weight: d.weight },
          match: { id: existingRow.id },
        });
      } else {
        const row: WorkoutLog = {
          id: crypto.randomUUID(),
          exercise_id: exerciseId,
          logged_on: today,
          set_number: i + 1,
          actual_reps: d.reps,
          actual_weight: d.weight,
        };
        results.push(row);
        await writeOrQueue({ table: "workout_logs", op: "insert", payload: row });
      }
    }
    if (results.length) {
      setLoggedToday((prev) => ({ ...prev, [exerciseId]: results }));
      const cached = (await cacheGet<WorkoutLog[]>("workoutLogsAll")) ?? [];
      const withoutOld = cached.filter((l) => !results.some((r) => r.id === l.id));
      cacheSet("workoutLogsAll", [...withoutOld, ...results]);
    }
    setOpenId(null);
  };

  const addBodyEntry = async () => {
    if (!weightInput.trim()) return;
    const entry: BodyEntry = {
      id: crypto.randomUUID(),
      logged_on: today,
      weight: weightInput.trim(),
      note: noteInput.trim() || null,
    };
    const updated = [entry, ...body];
    setBody(updated);
    cacheSet("bodyLog", updated);
    setWeightInput("");
    setNoteInput("");
    await writeOrQueue({ table: "body_log", op: "insert", payload: entry });
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
            const suggestion = !done ? suggestNext(ex, last) : null;
            const draftSets = drafts[ex.id] ?? Array.from({ length: SET_COUNT }, () => ({ reps: "", weight: "" }));
            return (
              <Card key={ex.id} accent={done ? "accent" : "none"}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14.5px] font-medium">{ex.name}</p>
                  <div className="flex items-center gap-2">
                    {done && <Pill tone="accent">logged today</Pill>}
                    <button
                      onClick={() => openLogger(ex)}
                      className="font-mono text-[11px] uppercase tracking-widest text-accent"
                    >
                      {isOpen ? "Cancel" : done ? "Edit" : "Log"}
                    </button>
                  </div>
                </div>
                <p className="mt-1 font-mono text-[12.5px] tabular-nums text-ink-soft">
                  Target: {ex.target_sets} × {ex.target_reps} · {ex.target_weight}
                </p>
                {last && !done && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-ink-soft">
                    Last ({last[0].logged_on}): {formatSets(last)}
                  </p>
                )}
                {suggestion && (
                  <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-accent">Suggested: {suggestion}</p>
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
