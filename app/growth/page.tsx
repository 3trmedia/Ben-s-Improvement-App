"use client";

import { useEffect, useState } from "react";
import { PageHeader, Section, Card, Pill, Segmented, Checkbox, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Entity } from "@/lib/mock-data";

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

type Task = {
  id: string;
  title: string;
  next_action: string | null;
  entity: Entity;
  priority: "low" | "medium" | "high";
  due: string;
  done: boolean;
};

type Habit = {
  id: string;
  label: string;
  cadence: string;
  target_per_week: number;
  done_this_week: number;
};

type Goal = {
  id: string;
  title: string;
  note: string | null;
  metric_kind: "count" | "pr" | "habit";
  current_value: number;
  target_value: number;
  unit: string | null;
  habit_id: string | null;
};

type ProjectPhase = { id: string; name: string; status: string; sort_order: number };
type Project = { id: string; title: string; note: string | null; project_phases: ProjectPhase[] };

export default function GrowthPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"todo" | "habits" | "goals">("todo");
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [walkAwayCount, setWalkAwayCount] = useState(0);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEntity, setNewTaskEntity] = useState<Entity>("Personal");

  useEffect(() => {
    async function load() {
      const [tasksRes, habitsRes, goalsRes, projectsRes, walkawaysRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("habits").select("*").order("sort_order"),
        supabase.from("goals").select("*"),
        supabase.from("projects").select("*, project_phases(*)"),
        supabase.from("walkaways").select("*", { count: "exact", head: true }),
      ]);
      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (habitsRes.data) setHabits(habitsRes.data as Habit[]);
      if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
      if (projectsRes.data) {
        setProjects(
          (projectsRes.data as Project[]).map((p) => ({
            ...p,
            project_phases: [...p.project_phases].sort((a, b) => a.sort_order - b.sort_order),
          }))
        );
      }
      if (typeof walkawaysRes.count === "number") setWalkAwayCount(walkawaysRes.count);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logWalkAway = async () => {
    setWalkAwayCount((c) => c + 1);
    await supabase.from("walkaways").insert({});
  };

  const toggleTask = async (task: Task) => {
    const done = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done } : t)));
    await supabase.from("tasks").update({ done }).eq("id", task.id);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const { data } = await supabase
      .from("tasks")
      .insert({ title: newTaskTitle.trim(), entity: newTaskEntity, priority: "medium", due: "Today" })
      .select()
      .single();
    if (data) setTasks((prev) => [...prev, data as Task]);
    setNewTaskTitle("");
  };

  const toggleHabitToday = async (habit: Habit) => {
    const wasFull = habit.done_this_week >= habit.target_per_week;
    const next = wasFull
      ? Math.max(0, habit.done_this_week - 1)
      : Math.min(habit.target_per_week, habit.done_this_week + 1);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, done_this_week: next } : h)));
    await supabase.from("habits").update({ done_this_week: next }).eq("id", habit.id);
  };

  const groups = ["Today", "This week"] as const;

  if (loading) {
    return <PageHeader eyebrow="Track" title="Growth" subtitle="Loading…" />;
  }

  return (
    <>
      <PageHeader eyebrow="Track" title="Growth" subtitle="3TR, Blackout, and Personal — one list, tagged." />

      <Section title="Chose Something Better">
        <Card accent="none" className="flex items-center justify-between">
          <p className="font-mono text-[28px] font-semibold tabular-nums">{walkAwayCount}</p>
          <button
            onClick={logWalkAway}
            className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-surface"
          >
            Chose Something Better
          </button>
        </Card>
      </Section>

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

      {tab === "todo" && (
        <>
          <Section title="Add a task">
            <Card accent="none">
              <div className="flex gap-2">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="What needs doing?"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                />
                <button onClick={addTask} className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface">
                  Add
                </button>
              </div>
              <div className="mt-2.5">
                <Segmented
                  value={newTaskEntity}
                  onChange={setNewTaskEntity}
                  options={[
                    { value: "3TR", label: "3TR" },
                    { value: "Blackout", label: "Blackout" },
                    { value: "Personal", label: "Personal" },
                  ]}
                />
              </div>
            </Card>
          </Section>

          {groups.map((group) => {
            const items = tasks.filter((t) => t.due === group);
            if (!items.length) return null;
            return (
              <Section key={group} title={group}>
                <div className="flex flex-col gap-2.5">
                  {items.map((t) => (
                    <Card key={t.id} accent={ENTITY_CARD_TONE[t.entity]}>
                      <div className="flex items-start gap-3">
                        <Checkbox checked={t.done} onChange={() => toggleTask(t)} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[14.5px] font-medium ${
                              t.done ? "text-ink-soft line-through" : "text-ink"
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.next_action && (
                            <p className="mt-0.5 text-[12.5px] text-ink-soft">Next: {t.next_action}</p>
                          )}
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
        </>
      )}

      {tab === "habits" && (
        <Section title="Check-off, not streak-guilt">
          <div className="flex flex-col gap-2.5">
            {habits.map((h) => (
              <Card key={h.id} accent="none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{h.label}</p>
                    <p className="text-[12px] text-ink-soft">{h.cadence}</p>
                  </div>
                  <Checkbox checked={h.done_this_week >= h.target_per_week} onChange={() => toggleHabitToday(h)} />
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <ProgressBar
                    current={h.done_this_week}
                    target={h.target_per_week}
                    label={`${h.done_this_week}/${h.target_per_week} this week`}
                  />
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {tab === "goals" && (
        <>
          <Section title="This quarter">
            <div className="flex flex-col gap-2.5">
              {goals.map((g) => {
                let current = g.current_value;
                let target = g.target_value;
                let label = `${g.current_value}/${g.target_value} ${g.unit ?? ""}`.trim();
                if (g.metric_kind === "habit" && g.habit_id) {
                  const habit = habits.find((h) => h.id === g.habit_id);
                  if (habit) {
                    current = habit.done_this_week;
                    target = habit.target_per_week;
                    label = `${current}/${target} this week`;
                  }
                }
                return (
                  <Card key={g.id} accent="warm">
                    <p className="text-[14.5px] font-medium">{g.title}</p>
                    {g.note && <p className="mt-1 text-[12.5px] text-ink-soft">{g.note}</p>}
                    <div className="mt-3 border-t border-line pt-3">
                      <ProgressBar current={current} target={target} label={label} tone="warm" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
          <Section title="Projects">
            <div className="flex flex-col gap-2.5">
              {projects.map((p) => {
                const done = p.project_phases.filter((ph) => ph.status === "Live").length;
                return (
                  <Card key={p.id} accent="none">
                    <p className="text-[14.5px] font-medium">{p.title}</p>
                    {p.note && <p className="mt-1 text-[12.5px] text-ink-soft">{p.note}</p>}
                    <div className="mt-3 border-t border-line pt-3">
                      <ProgressBar
                        current={done}
                        target={p.project_phases.length}
                        label={`${done}/${p.project_phases.length} phases live`}
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                      {p.project_phases.map((phase) => (
                        <div key={phase.id} className="flex items-center justify-between">
                          <span className="text-[13.5px]">{phase.name}</span>
                          <Pill tone={STATUS_TONE[phase.status]}>{phase.status}</Pill>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        </>
      )}
    </>
  );
}
