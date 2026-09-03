"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Section, Card, Ring, QuickAdjust } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { peptideLog as seedPeptides } from "@/lib/mock-data";

const NUTRITION_TARGETS = { calories: 2400, protein: 175, waterOz: 100 };
const WATER_STEP = 8;
const CALORIE_STEP = 100;
const PROTEIN_STEP = 10;

type Recipe = { id: string; name: string; calories: number; protein: number };
type Meal = { id: string; name: string; calories: number; protein: number; created_at: string };
type Adjustment = { id: string; metric: "water" | "calories" | "protein"; amount: number };

// "Today" runs 2am-to-2am, not midnight — matches when Ben actually goes to
// bed, same pattern as Fitness's 4am workout-day boundary.
function nutritionDay(d = new Date()) {
  const shifted = new Date(d);
  shifted.setHours(shifted.getHours() - 2);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CaloriesPage() {
  const supabase = createClient();
  const today = nutritionDay();

  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [peptides, setPeptides] = useState(seedPeptides);

  const [query, setQuery] = useState("");
  const [browseOpen, setBrowseOpen] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");

  const [recipeName, setRecipeName] = useState("");
  const [recipeCal, setRecipeCal] = useState("");
  const [recipeProtein, setRecipeProtein] = useState("");

  const [pepCompound, setPepCompound] = useState("");
  const [pepDose, setPepDose] = useState("");

  useEffect(() => {
    async function load() {
      const [recipesRes, mealsRes, adjRes] = await Promise.all([
        supabase.from("recipes").select("*").order("name"),
        supabase.from("meals_log").select("*").eq("logged_on", today).order("created_at"),
        supabase.from("nutrition_adjustments").select("*").eq("logged_on", today),
      ]);
      if (recipesRes.data) setRecipes(recipesRes.data as Recipe[]);
      if (mealsRes.data) setMeals(mealsRes.data as Meal[]);
      if (adjRes.data) setAdjustments(adjRes.data as Adjustment[]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sumAdj = (metric: Adjustment["metric"]) =>
    adjustments.filter((a) => a.metric === metric).reduce((s, a) => s + a.amount, 0);

  const water = Math.max(0, sumAdj("water"));
  const totalCalories = Math.max(0, meals.reduce((s, m) => s + m.calories, 0) + sumAdj("calories"));
  const totalProtein = Math.max(0, meals.reduce((s, m) => s + m.protein, 0) + sumAdj("protein"));

  // Decrements are clamped to the current total so it can't go negative
  // "in debt" — otherwise a later "+" would silently be absorbed paying
  // that debt down instead of visibly increasing the ring.
  const adjust = async (metric: Adjustment["metric"], delta: number, current: number) => {
    const amount = delta < 0 ? -Math.min(Math.abs(delta), current) : delta;
    if (amount === 0) return;
    const { data } = await supabase
      .from("nutrition_adjustments")
      .insert({ metric, amount, logged_on: today })
      .select()
      .single();
    if (data) setAdjustments((prev) => [...prev, data as Adjustment]);
  };

  const logMeal = async (name: string, calories: number, protein: number) => {
    const { data } = await supabase
      .from("meals_log")
      .insert({ name, calories, protein, logged_on: today })
      .select()
      .single();
    if (data) setMeals((prev) => [...prev, data as Meal]);
  };

  const removeMeal = async (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("meals_log").delete().eq("id", id);
  };

  const addCustomMeal = () => {
    const cal = Number(customCal);
    const protein = Number(customProtein) || 0;
    if (!customName.trim() || !cal) return;
    logMeal(customName.trim(), cal, protein);
    setCustomName("");
    setCustomCal("");
    setCustomProtein("");
  };

  const saveRecipe = async () => {
    const cal = Number(recipeCal);
    const protein = Number(recipeProtein) || 0;
    if (!recipeName.trim() || !cal) return;
    const { data } = await supabase
      .from("recipes")
      .insert({ name: recipeName.trim(), calories: cal, protein })
      .select()
      .single();
    if (data) setRecipes((prev) => [...prev, data as Recipe].sort((a, b) => a.name.localeCompare(b.name)));
    setRecipeName("");
    setRecipeCal("");
    setRecipeProtein("");
  };

  const addPeptide = () => {
    if (!pepCompound.trim() || !pepDose.trim()) return;
    setPeptides((prev) => [
      {
        id: `pep-${Date.now()}`,
        compound: pepCompound.trim(),
        dose: pepDose.trim(),
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
      ...prev,
    ]);
    setPepCompound("");
    setPepDose("");
  };

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, recipes]);

  if (loading) {
    return <PageHeader eyebrow="Nutrition" title="Calories" subtitle="Loading…" />;
  }

  return (
    <>
      <PageHeader eyebrow="Nutrition" title="Calories" subtitle="Meals, water, and peptides — logged, not guessed." />

      <Section title="Today">
        <div className="flex justify-around">
          <Ring value={totalCalories} target={NUTRITION_TARGETS.calories} label="Calories" unit="" tone="accent" />
          <Ring value={totalProtein} target={NUTRITION_TARGETS.protein} label="Protein" unit="g" tone="danger" />
          <Ring value={water} target={NUTRITION_TARGETS.waterOz} label="Water" unit="oz" tone="info" />
        </div>
      </Section>

      <Section title="Quick adjust">
        <div className="flex flex-col gap-2.5">
          <QuickAdjust
            label="Water"
            value={water}
            unit="oz"
            tone="info"
            onIncrement={() => adjust("water", WATER_STEP, water)}
            onDecrement={() => adjust("water", -WATER_STEP, water)}
          />
          <QuickAdjust
            label="Calories"
            value={totalCalories}
            unit="cal"
            tone="accent"
            onIncrement={() => adjust("calories", CALORIE_STEP, totalCalories)}
            onDecrement={() => adjust("calories", -CALORIE_STEP, totalCalories)}
          />
          <QuickAdjust
            label="Protein"
            value={totalProtein}
            unit="g"
            tone="danger"
            onIncrement={() => adjust("protein", PROTEIN_STEP, totalProtein)}
            onDecrement={() => adjust("protein", -PROTEIN_STEP, totalProtein)}
          />
        </div>
      </Section>

      <Section title={`Today's meals (${meals.length})`}>
        <div className="flex flex-col gap-2.5">
          {meals.map((m) => (
            <Card key={m.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{m.name}</p>
                <p className="font-mono text-[12px] tabular-nums text-ink-soft">
                  {m.calories} cal · {m.protein}g protein
                </p>
              </div>
              <button onClick={() => removeMeal(m.id)} className="text-[13px] text-ink-soft">
                ✕
              </button>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Find a meal">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your recipes…"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
        />

        {query.trim() ? (
          <div className="mt-2.5 flex flex-col gap-2.5">
            {searchResults.length === 0 ? (
              <p className="text-[13px] text-ink-soft">No recipes match &ldquo;{query}&rdquo;.</p>
            ) : (
              searchResults.map((r) => (
                <Card key={r.id} accent="none" className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{r.name}</p>
                    <p className="font-mono text-[12px] tabular-nums text-ink-soft">
                      {r.calories} cal · {r.protein}g protein
                    </p>
                  </div>
                  <button
                    onClick={() => logMeal(r.name, r.calories, r.protein)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[16px] font-medium text-surface"
                  >
                    +
                  </button>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="mt-2.5">
            <button
              onClick={() => setBrowseOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink-soft"
            >
              <span>Browse recipes for ideas</span>
              <span className="font-mono text-[11px]">{browseOpen ? "▲" : "▼"}</span>
            </button>
            {browseOpen && (
              <div className="mt-2.5 flex max-h-72 flex-col gap-2.5 overflow-y-auto">
                {recipes.map((r) => (
                  <Card key={r.id} accent="none" className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">{r.name}</p>
                      <p className="font-mono text-[12px] tabular-nums text-ink-soft">
                        {r.calories} cal · {r.protein}g protein
                      </p>
                    </div>
                    <button
                      onClick={() => logMeal(r.name, r.calories, r.protein)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[16px] font-medium text-surface"
                    >
                      +
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <Card accent="none" className="mt-2.5">
          <p className="mb-2.5 text-[12.5px] text-ink-soft">Save a new recipe to the library</p>
          <div className="flex flex-col gap-2">
            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <div className="flex gap-2">
              <input
                value={recipeCal}
                onChange={(e) => setRecipeCal(e.target.value)}
                placeholder="Calories"
                inputMode="numeric"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
              />
              <input
                value={recipeProtein}
                onChange={(e) => setRecipeProtein(e.target.value)}
                placeholder="Protein (g)"
                inputMode="numeric"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
              />
            </div>
            <button onClick={saveRecipe} className="rounded-lg bg-accent py-2 text-[13px] font-medium text-surface">
              Save recipe
            </button>
          </div>
        </Card>
      </Section>

      <Section title="Log a one-off meal">
        <Card accent="none">
          <div className="flex flex-col gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="What did you eat?"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <div className="flex gap-2">
              <input
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
                placeholder="Calories"
                inputMode="numeric"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
              />
              <input
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                placeholder="Protein (g)"
                inputMode="numeric"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
              />
              <button
                onClick={addCustomMeal}
                className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface"
              >
                Add
              </button>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Peptide log">
        <Card accent="none">
          <div className="flex gap-2">
            <input
              value={pepCompound}
              onChange={(e) => setPepCompound(e.target.value)}
              placeholder="Compound"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <input
              value={pepDose}
              onChange={(e) => setPepDose(e.target.value)}
              placeholder="Dose"
              className="w-24 rounded-lg border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-soft focus:border-accent"
            />
            <button onClick={addPeptide} className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface">
              Log
            </button>
          </div>
        </Card>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {peptides.map((p) => (
            <Card key={p.id} accent="none" className="flex items-center justify-between">
              <p className="text-[14px] font-medium">{p.compound}</p>
              <p className="font-mono text-[12.5px] tabular-nums text-ink-soft">
                {p.dose} · {p.time}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
