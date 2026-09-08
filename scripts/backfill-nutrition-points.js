// One-off correction: nutrition logging only started earning points partway
// through today, so today's already-logged calories/water/protein are
// under-counted (only whatever was tapped after the feature shipped got a
// point). Computes what today's total SHOULD be worth using the same 1
// point per step-size logic as the app (100 cal, 10g protein, 8oz water),
// then tops up the gap between that and what's already been recorded --
// not a blind add-on, so re-running this is safe and won't double-count.
// Run with: node scripts/backfill-nutrition-points.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const CALORIE_STEP = 100;
const PROTEIN_STEP = 10;
const WATER_STEP = 8;

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

// Matches nutritionDay()/dayBoundary() in app/(protected)/calories/page.tsx --
// "today" rolls over at 2am, not midnight.
function nutritionDay(d = new Date()) {
  const shifted = new Date(d);
  shifted.setHours(shifted.getHours() - 2);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}
function dayBoundary(d = new Date()) {
  const boundary = new Date(d);
  boundary.setHours(2, 0, 0, 0);
  if (d < boundary) boundary.setDate(boundary.getDate() - 1);
  return boundary;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  const today = nutritionDay();
  const boundaryIso = dayBoundary().toISOString();

  const [mealsRes, adjRes, eventsRes] = await Promise.all([
    supabase.from("meals_log").select("calories, protein").eq("logged_on", today),
    supabase.from("nutrition_adjustments").select("metric, amount").eq("logged_on", today),
    supabase.from("point_events").select("points").in("source", ["meal", "nutrition_adjust"]).gte("created_at", boundaryIso),
  ]);

  const sumAdj = (metric) => (adjRes.data ?? []).filter((a) => a.metric === metric).reduce((s, a) => s + Number(a.amount), 0);
  const mealCal = (mealsRes.data ?? []).reduce((s, m) => s + m.calories, 0);
  const mealProtein = (mealsRes.data ?? []).reduce((s, m) => s + m.protein, 0);

  const totalCalories = Math.max(0, mealCal + sumAdj("calories"));
  const totalProtein = Math.max(0, mealProtein + sumAdj("protein"));
  const totalWater = Math.max(0, sumAdj("water"));

  const targetPoints =
    Math.floor(totalCalories / CALORIE_STEP) + Math.floor(totalProtein / PROTEIN_STEP) + Math.floor(totalWater / WATER_STEP);
  const alreadyAwarded = (eventsRes.data ?? []).reduce((s, e) => s + e.points, 0);
  const backfill = Math.max(0, targetPoints - alreadyAwarded);

  console.log(`Today (${today}): ${totalCalories} cal, ${totalProtein}g protein, ${totalWater}oz water`);
  console.log(`Target points: ${targetPoints}, already awarded: ${alreadyAwarded}, backfilling: ${backfill}`);

  if (backfill > 0) {
    const { error } = await supabase.from("point_events").insert({
      source: "nutrition_adjust",
      source_id: "backfill",
      points: backfill,
      label: "Backfilled today's nutrition points",
    });
    if (error) console.error("Insert failed:", error.message);
    else console.log(`Added ${backfill} points.`);
  } else {
    console.log("Nothing to backfill.");
  }
}

main();
