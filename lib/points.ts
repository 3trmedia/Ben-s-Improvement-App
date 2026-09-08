import { createClient } from "@/lib/supabase/client";

export type PointSource =
  | "task"
  | "habit"
  | "goal"
  | "workout_set"
  | "body_log"
  | "meal"
  | "walkaway"
  | "redemption";

export const HABIT_POINTS = 3;
export const GOAL_POINTS = 50;
export const WORKOUT_SET_POINTS = 1;
export const BODY_LOG_POINTS = 2;
export const MEAL_POINTS = 1;
export const WALKAWAY_POINTS = 5;

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

export async function getPointBalance(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.rpc("point_balance");
  return typeof data === "number" ? data : 0;
}
