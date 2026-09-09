"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  Segmented,
  Checkbox,
  ProgressBar,
  SelectableCard,
  SelectionBar,
  ConfirmModal,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cacheGet, cacheSet, writeOrQueue } from "@/lib/offline/sync";
import {
  awardPoints,
  revokeLatestPoints,
  setHabitCheckin,
  syncHabitStreakBonus,
  HABIT_POINTS,
  GOAL_POINTS,
  WALKAWAY_POINTS,
} from "@/lib/points";
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
  points: number;
};

const TASK_POINT_OPTIONS = [5, 50, 100] as const;

// Local calendar day (no shifted cutoff, unlike Fitness's 4am gymDay/
// Calories' 2am nutritionDay) -- habits weren't given a stated boundary.
function habitDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

// Goal completion is a one-time 50pt award, not tied to a checkbox -- checks
// each goal's current/target (same logic the render uses, including the
// habit-linked case) against whatever's already been awarded, so a goal that
// crosses its target only ever pays out once, and re-crossing later (e.g. a
// habit-linked goal after its weekly count resets) doesn't re-pay it.
async function awardNewlyCompletedGoals(goalsData: Goal[], habitsData: Habit[]) {
  const completed = goalsData.filter((g) => {
    let current = g.current_value;
    let target = g.target_value;
    if (g.metric_kind === "habit" && g.habit_id) {
      const h = habitsData.find((x) => x.id === g.habit_id);
      if (h) {
        current = h.done_this_week;
        target = h.target_per_week;
      }
    }
    return target > 0 && current >= target;
  });
  if (!completed.length) return;

  // One query for every completed goal's award status instead of one query
  // per goal -- the old version was a sequential round-trip per goal on
  // every single Growth page load.
  const supabase = createClient();
  const { data } = await supabase
    .from("point_events")
    .select("source_id")
    .eq("source", "goal")
    .in("source_id", completed.map((g) => g.id));
  const alreadyAwarded = new Set((data ?? []).map((r) => r.source_id as string));

  for (const g of completed) {
    if (!alreadyAwarded.has(g.id)) await awardPoints("goal", g.id, GOAL_POINTS, g.title);
  }
}

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
  const [newTaskPoints, setNewTaskPoints] = useState<(typeof TASK_POINT_OPTIONS)[number]>(5);

  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitDays, setNewHabitDays] = useState<7 | 5 | 3 | 1>(7);

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalNote, setNewGoalNote] = useState("");
  const [newGoalKind, setNewGoalKind] = useState<"count" | "habit">("count");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalUnit, setNewGoalUnit] = useState("");
  const [newGoalHabitId, setNewGoalHabitId] = useState("");

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const enterSelectMode = (id: string) => {
    setSelectMode(true);
    setSelected(new Set([id]));
  };
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  };
  const cancelSelection = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  useEffect(() => {
    async function load() {
      if (!navigator.onLine) {
        const [cTasks, cHabits, cGoals, cProjects, cWalk] = await Promise.all([
          cacheGet<Task[]>("tasks"),
          cacheGet<Habit[]>("habits"),
          cacheGet<Goal[]>("goals"),
          cacheGet<Project[]>("projects"),
          cacheGet<number>("walkawayCount"),
        ]);
        if (cTasks) setTasks(cTasks);
        if (cHabits) setHabits(cHabits);
        if (cGoals) setGoals(cGoals);
        if (cProjects) setProjects(cProjects);
        if (cWalk) setWalkAwayCount(cWalk);
        setLoading(false);
        return;
      }

      const [tasksRes, habitsRes, goalsRes, projectsRes, walkawaysRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("habits").select("*").order("sort_order"),
        supabase.from("goals").select("*"),
        supabase.from("projects").select("*, project_phases(*)"),
        supabase.from("walkaways").select("*", { count: "exact", head: true }),
      ]);
      if (tasksRes.data) {
        setTasks(tasksRes.data as Task[]);
        cacheSet("tasks", tasksRes.data);
      }
      if (habitsRes.data) {
        setHabits(habitsRes.data as Habit[]);
        cacheSet("habits", habitsRes.data);
      }
      if (goalsRes.data) {
        const goalsData = goalsRes.data as Goal[];
        setGoals(goalsData);
        cacheSet("goals", goalsData);
        if (habitsRes.data) {
          awardNewlyCompletedGoals(goalsData, habitsRes.data as Habit[]);
        }
      }
      if (projectsRes.data) {
        const sorted = (projectsRes.data as Project[]).map((p) => ({
          ...p,
          project_phases: [...p.project_phases].sort((a, b) => a.sort_order - b.sort_order),
        }));
        setProjects(sorted);
        cacheSet("projects", sorted);
      }
      if (typeof walkawaysRes.count === "number") {
        setWalkAwayCount(walkawaysRes.count);
        cacheSet("walkawayCount", walkawaysRes.count);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logWalkAway = async () => {
    const next = walkAwayCount + 1;
    setWalkAwayCount(next);
    cacheSet("walkawayCount", next);
    await writeOrQueue({ table: "walkaways", op: "insert", payload: { id: crypto.randomUUID() } });
    await awardPoints("walkaway", null, WALKAWAY_POINTS, "Chose Something Better");
  };

  const toggleTask = async (task: Task) => {
    const done = !task.done;
    const updated = tasks.map((t) => (t.id === task.id ? { ...t, done } : t));
    setTasks(updated);
    cacheSet("tasks", updated);
    await writeOrQueue({ table: "tasks", op: "update", payload: { done }, match: { id: task.id } });
    if (done) await awardPoints("task", task.id, task.points, task.title);
    else await revokeLatestPoints("task", task.id);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      next_action: null,
      entity: newTaskEntity,
      priority: "medium",
      due: "Today",
      done: false,
      points: newTaskPoints,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    cacheSet("tasks", updated);
    setNewTaskTitle("");
    await writeOrQueue({ table: "tasks", op: "insert", payload: newTask });
  };

  const addHabit = async () => {
    if (!newHabitLabel.trim()) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      label: newHabitLabel.trim(),
      cadence: newHabitDays === 7 ? "Daily" : `${newHabitDays}x/week`,
      target_per_week: newHabitDays,
      done_this_week: 0,
    };
    const updated = [...habits, habit];
    setHabits(updated);
    cacheSet("habits", updated);
    setNewHabitLabel("");
    await writeOrQueue({ table: "habits", op: "insert", payload: { ...habit, sort_order: habits.length } });
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    if (newGoalKind === "habit" && !newGoalHabitId) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newGoalTitle.trim(),
      note: newGoalNote.trim() || null,
      metric_kind: newGoalKind,
      current_value: 0,
      target_value: newGoalKind === "count" ? Number(newGoalTarget) || 1 : 1,
      unit: newGoalKind === "count" ? newGoalUnit.trim() || null : null,
      habit_id: newGoalKind === "habit" ? newGoalHabitId : null,
    };
    setGoals((prev) => [...prev, goal]);
    setNewGoalTitle("");
    setNewGoalNote("");
    setNewGoalTarget("");
    setNewGoalUnit("");
    setNewGoalHabitId("");
    await supabase.from("goals").insert(goal);
  };

  const toggleHabitToday = async (habit: Habit) => {
    const wasFull = habit.done_this_week >= habit.target_per_week;
    const next = wasFull
      ? Math.max(0, habit.done_this_week - 1)
      : Math.min(habit.target_per_week, habit.done_this_week + 1);
    const updated = habits.map((h) => (h.id === habit.id ? { ...h, done_this_week: next } : h));
    setHabits(updated);
    cacheSet("habits", updated);
    await writeOrQueue({ table: "habits", op: "update", payload: { done_this_week: next }, match: { id: habit.id } });

    const today = habitDay();
    if (!wasFull) {
      await awardPoints("habit", habit.id, HABIT_POINTS, habit.label);
      await setHabitCheckin(habit.id, today, true);
    } else {
      await revokeLatestPoints("habit", habit.id);
      await setHabitCheckin(habit.id, today, false);
    }
    // Recompute regardless of direction -- completing today's last habit
    // pays the streak bonus, undoing one that already qualified claws it back.
    await syncHabitStreakBonus(updated.map((h) => h.id), today);
  };

  const changeTab = (next: "todo" | "habits" | "goals") => {
    cancelSelection();
    setTab(next);
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };
  const deleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await supabase.from("habits").delete().eq("id", id);
  };
  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    setBulkConfirmOpen(false);
    if (tab === "todo") {
      setTasks((prev) => prev.filter((t) => !selected.has(t.id)));
      await supabase.from("tasks").delete().in("id", ids);
    } else if (tab === "habits") {
      setHabits((prev) => prev.filter((h) => !selected.has(h.id)));
      await supabase.from("habits").delete().in("id", ids);
    } else {
      setGoals((prev) => prev.filter((g) => !selected.has(g.id)));
      await supabase.from("goals").delete().in("id", ids);
    }
    cancelSelection();
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

      <SelectionBar count={selectMode ? selected.size : 0} onDelete={() => setBulkConfirmOpen(true)} onCancel={cancelSelection} />
      <ConfirmModal
        open={bulkConfirmOpen}
        title={`Delete ${selected.size} item${selected.size === 1 ? "" : "s"}?`}
        onCancel={() => setBulkConfirmOpen(false)}
        onConfirm={deleteSelected}
      />

      <div className="px-5 pb-5">
        <Segmented
          value={tab}
          onChange={changeTab}
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
              <div className="mt-2.5">
                <Segmented
                  value={String(newTaskPoints)}
                  onChange={(v) => setNewTaskPoints(Number(v) as (typeof TASK_POINT_OPTIONS)[number])}
                  options={TASK_POINT_OPTIONS.map((p) => ({ value: String(p), label: `${p} pts` }))}
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
                    <SelectableCard
                      key={t.id}
                      accent={ENTITY_CARD_TONE[t.entity]}
                      selectMode={selectMode}
                      selected={selected.has(t.id)}
                      onToggleSelect={() => toggleSelect(t.id)}
                      onLongPress={() => enterSelectMode(t.id)}
                      onDelete={() => deleteTask(t.id)}
                      deleteTitle={`Delete "${t.title}"?`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox checked={t.done} onChange={() => !selectMode && toggleTask(t)} />
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
                            <Pill tone="accent">{t.points} pts</Pill>
                          </div>
                        </div>
                      </div>
                    </SelectableCard>
                  ))}
                </div>
              </Section>
            );
          })}
        </>
      )}

      {tab === "habits" && (
        <>
          <Section title="Add a habit">
            <Card accent="none">
              <div className="flex gap-2">
                <input
                  value={newHabitLabel}
                  onChange={(e) => setNewHabitLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  placeholder="What habit are you building?"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                />
                <button onClick={addHabit} className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface">
                  Add
                </button>
              </div>
              <div className="mt-2.5">
                <Segmented
                  value={String(newHabitDays)}
                  onChange={(v) => setNewHabitDays(Number(v) as 7 | 5 | 3 | 1)}
                  options={[
                    { value: "7", label: "Daily" },
                    { value: "5", label: "5x/week" },
                    { value: "3", label: "3x/week" },
                    { value: "1", label: "1x/week" },
                  ]}
                />
              </div>
            </Card>
          </Section>

          <Section title="Check-off, not streak-guilt">
          <div className="flex flex-col gap-2.5">
            {habits.map((h) => (
              <SelectableCard
                key={h.id}
                selectMode={selectMode}
                selected={selected.has(h.id)}
                onToggleSelect={() => toggleSelect(h.id)}
                onLongPress={() => enterSelectMode(h.id)}
                onDelete={() => deleteHabit(h.id)}
                deleteTitle={`Delete "${h.label}"?`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{h.label}</p>
                    <p className="text-[12px] text-ink-soft">{h.cadence}</p>
                  </div>
                  <Checkbox
                    checked={h.done_this_week >= h.target_per_week}
                    onChange={() => !selectMode && toggleHabitToday(h)}
                  />
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <ProgressBar
                    current={h.done_this_week}
                    target={h.target_per_week}
                    label={`${h.done_this_week}/${h.target_per_week} this week`}
                  />
                </div>
              </SelectableCard>
            ))}
            </div>
          </Section>
        </>
      )}

      {tab === "goals" && (
        <>
          <Section title="Add a goal">
            <Card accent="none">
              <div className="flex flex-col gap-2">
                <input
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="What are you trying to accomplish?"
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                />
                <input
                  value={newGoalNote}
                  onChange={(e) => setNewGoalNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                />
                <Segmented
                  value={newGoalKind}
                  onChange={setNewGoalKind}
                  options={[
                    { value: "count", label: "Count toward a number" },
                    { value: "habit", label: "Tied to a habit" },
                  ]}
                />
                {newGoalKind === "count" ? (
                  <div className="flex gap-2">
                    <input
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="Target"
                      inputMode="numeric"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                    />
                    <input
                      value={newGoalUnit}
                      onChange={(e) => setNewGoalUnit(e.target.value)}
                      placeholder="Unit (optional)"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
                    />
                  </div>
                ) : (
                  <select
                    value={newGoalHabitId}
                    onChange={(e) => setNewGoalHabitId(e.target.value)}
                    className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
                  >
                    <option value="">Pick a habit…</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                )}
                <button onClick={addGoal} className="rounded-lg bg-accent py-2 text-[13px] font-medium text-surface">
                  Add goal
                </button>
              </div>
            </Card>
          </Section>

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
                  <SelectableCard
                    key={g.id}
                    accent="warm"
                    selectMode={selectMode}
                    selected={selected.has(g.id)}
                    onToggleSelect={() => toggleSelect(g.id)}
                    onLongPress={() => enterSelectMode(g.id)}
                    onDelete={() => deleteGoal(g.id)}
                    deleteTitle={`Delete "${g.title}"?`}
                  >
                    <p className="text-[14.5px] font-medium">{g.title}</p>
                    {g.note && <p className="mt-1 text-[12.5px] text-ink-soft">{g.note}</p>}
                    <div className="mt-3 border-t border-line pt-3">
                      <ProgressBar current={current} target={target} label={label} tone="warm" />
                    </div>
                  </SelectableCard>
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
