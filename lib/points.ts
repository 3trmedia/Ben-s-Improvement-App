import { createClient } from "@/lib/supabase/client";
import { writeOrQueue } from "@/lib/offline/sync";

export type PointSource =
  | "task"
  | "habit"
  | "habit_streak"
  | "goal"
  | "workout_set"
  | "body_log"
  | "meal"
  | "nutrition_adjust"
  | "walkaway"
  | "redemption";

export const HABIT_POINTS = 5;
export const GOAL_POINTS = 50;
export const WORKOUT_SET_POINTS = 1;
export const BODY_LOG_POINTS = 2;
export const MEAL_POINTS = 1;
export const NUTRITION_ADJUST_POINTS = 1;
export const WALKAWAY_POINTS = 5;
export const HABIT_STREAK_LENGTH = 5;
export const HABIT_STREAK_BONUS = 250;

// Routed through writeOrQueue so a point earned while offline isn't lost --
// it queues in the same outbox as the triggering task/habit/meal write and
// replays on reconnect.
export async function awardPoints(source: PointSource, sourceId: string | null, points: number, label?: string) {
  await writeOrQueue({
    table: "point_events",
    op: "insert",
    payload: { source, source_id: sourceId, points, label: label ?? null },
  });
}

// Reverses the most recent award for this source/sourceId (LIFO) -- used
// when un-completing something that toggles back and forth (tasks, a
// habit's daily tick). Goals/fitness sets/body log/walkaways are one-way
// and never call this.
export async function revokeLatestPoints(source: PointSource, sourceId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("point_events")
    .select("id")
    .eq("source", source)
    .eq("source_id", sourceId)
    .gt("points", 0)
    .order("created_at", { ascending: false })
    .limit(1);
  if (data?.[0]) {
    await supabase.from("point_events").delete().eq("id", data[0].id);
  }
}

// Deletes every event for this exact source/sourceId (not just the latest) --
// used for the habit streak bonus, where source_id is a specific day and at
// most one bonus row should ever exist for it, and for undoing a redemption,
// where source_id is the reward id and there's exactly one spend event.
export async function revokeExactPoints(source: PointSource, sourceId: string) {
  await writeOrQueue({ table: "point_events", op: "delete", payload: {}, match: { source, source_id: sourceId } });
}

export async function getPointBalance(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.rpc("point_balance");
  return typeof data === "number" ? data : 0;
}

// Sum of points earned since a given instant -- used to show a live
// "points today" figure without waiting on the whole-history point_balance().
export async function getPointsSince(isoTimestamp: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.from("point_events").select("points").gte("created_at", isoTimestamp);
  return (data ?? []).reduce((sum, r) => sum + (r.points as number), 0);
}

// Marks (or unmarks) a single habit as done for a specific calendar day.
// Separate from habits.done_this_week (a weekly quota counter) -- this is
// only used to compute the "all habits done" streak below.
export async function setHabitCheckin(habitId: string, day: string, checked: boolean) {
  const supabase = createClient();
  if (checked) {
    await supabase.from("habit_checkins").upsert({ habit_id: habitId, checked_on: day }, { onConflict: "habit_id,checked_on" });
  } else {
    await supabase.from("habit_checkins").delete().eq("habit_id", habitId).eq("checked_on", day);
  }
}

function shiftDay(day: string, delta: number) {
  const [y, m, d] = day.split("-").map(Number);
  const shifted = new Date(y, m - 1, d + delta);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

// Length of the consecutive-day streak ending on `day` where every habit in
// `habitIds` has a checkin. Fetches one bounded window of history in a
// single query and walks it in memory -- the original version issued one
// network round-trip per day of the streak (sequentially!), so toggling a
// single habit checkbox on a 20-day streak meant 20+ awaited requests.
export async function computeHabitStreak(habitIds: string[], day: string): Promise<number> {
  if (habitIds.length === 0) return 0;
  const supabase = createClient();
  const windowStart = shiftDay(day, -366);
  const { data } = await supabase
    .from("habit_checkins")
    .select("habit_id, checked_on")
    .gte("checked_on", windowStart)
    .lte("checked_on", day);

  const doneByDay = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const key = row.checked_on as string;
    if (!doneByDay.has(key)) doneByDay.set(key, new Set());
    doneByDay.get(key)!.add(row.habit_id as string);
  }

  let streak = 0;
  let cursor = day;
  for (let i = 0; i < 366; i++) {
    const doneIds = doneByDay.get(cursor);
    if (!doneIds || !habitIds.every((id) => doneIds.has(id))) break;
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

// Call after any habit checkin changes for `day`. Awards a one-time 250pt
// bonus every time the consecutive streak (ending on `day`) hits a multiple
// of 5, and revokes today's bonus if a later undo drops the streak back
// below the threshold it was awarded at.
export async function syncHabitStreakBonus(habitIds: string[], day: string) {
  const streak = await computeHabitStreak(habitIds, day);
  if (streak > 0 && streak % HABIT_STREAK_LENGTH === 0) {
    const supabase = createClient();
    const { data } = await supabase.from("point_events").select("id").eq("source", "habit_streak").eq("source_id", day).limit(1);
    if (!data?.length) await awardPoints("habit_streak", day, HABIT_STREAK_BONUS, `${streak}-day habit streak`);
  } else {
    await revokeExactPoints("habit_streak", day);
  }
}
