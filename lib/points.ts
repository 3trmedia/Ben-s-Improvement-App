import { createClient } from "@/lib/supabase/client";

export type PointSource =
  | "task"
  | "habit"
  | "habit_streak"
  | "goal"
  | "workout_set"
  | "body_log"
  | "meal"
  | "walkaway"
  | "redemption";

export const HABIT_POINTS = 5;
export const GOAL_POINTS = 50;
export const WORKOUT_SET_POINTS = 1;
export const BODY_LOG_POINTS = 2;
export const MEAL_POINTS = 1;
export const WALKAWAY_POINTS = 5;
export const HABIT_STREAK_LENGTH = 5;
export const HABIT_STREAK_BONUS = 250;

export async function awardPoints(source: PointSource, sourceId: string | null, points: number, label?: string) {
  const supabase = createClient();
  await supabase.from("point_events").insert({ source, source_id: sourceId, points, label: label ?? null });
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
  const supabase = createClient();
  await supabase.from("point_events").delete().eq("source", source).eq("source_id", sourceId);
}

export async function getPointBalance(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.rpc("point_balance");
  return typeof data === "number" ? data : 0;
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

// Length of the consecutive-day streak ending on `day` where every habit in
// `habitIds` has a checkin. Walks backward one day at a time until a day
// fails the all-habits-done test (capped at a year as a sanity bound).
export async function computeHabitStreak(habitIds: string[], day: string): Promise<number> {
  if (habitIds.length === 0) return 0;
  const supabase = createClient();
  let streak = 0;
  let cursor = day;
  for (let i = 0; i < 366; i++) {
    const { data } = await supabase.from("habit_checkins").select("habit_id").eq("checked_on", cursor);
    const doneIds = new Set((data ?? []).map((r) => r.habit_id as string));
    if (!habitIds.every((id) => doneIds.has(id))) break;
    streak++;
    const [y, m, d] = cursor.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    cursor = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
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
