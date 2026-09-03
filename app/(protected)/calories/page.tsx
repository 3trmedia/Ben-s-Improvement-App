"use client";

import { useState } from "react";
import { PageHeader, Section, Card, Ring } from "@/components/ui";
import {
  nutritionTargets,
  savedRecipes,
  todayMeals,
  todayWaterOz,
  peptideLog,
  type MealEntry,
} from "@/lib/mock-data";

const WATER_STEP = 8;

export default function CaloriesPage() {
  const [meals, setMeals] = useState(todayMeals);
  const [library, setLibrary] = useState(savedRecipes);
  const [water, setWater] = useState(todayWaterOz);
  const [peptides, setPeptides] = useState(peptideLog);

  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");

  const [recipeName, setRecipeName] = useState("");
  const [recipeCal, setRecipeCal] = useState("");
  const [recipeProtein, setRecipeProtein] = useState("");

  const [pepCompound, setPepCompound] = useState("");
  const [pepDose, setPepDose] = useState("");

  const now = () =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);

  const addFromLibrary = (recipe: MealEntry) => {
    setMeals((prev) => [...prev, { ...recipe, id: `${recipe.id}-${Date.now()}`, time: now() }]);
  };

  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const addCustomMeal = () => {
    const cal = Number(customCal);
    const protein = Number(customProtein);
    if (!customName.trim() || !cal) return;
    setMeals((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: customName.trim(), calories: cal, protein: protein || 0, time: now() },
    ]);
    setCustomName("");
    setCustomCal("");
    setCustomProtein("");
  };

  const saveRecipe = () => {
    const cal = Number(recipeCal);
    const protein = Number(recipeProtein);
    if (!recipeName.trim() || !cal) return;
    setLibrary((prev) => [
      ...prev,
      { id: `saved-${Date.now()}`, name: recipeName.trim(), calories: cal, protein: protein || 0 },
    ]);
    setRecipeName("");
    setRecipeCal("");
    setRecipeProtein("");
  };

  const addPeptide = () => {
    if (!pepCompound.trim() || !pepDose.trim()) return;
    setPeptides((prev) => [
      { id: `pep-${Date.now()}`, compound: pepCompound.trim(), dose: pepDose.trim(), time: now() },
      ...prev,
    ]);
    setPepCompound("");
    setPepDose("");
  };

  return (
    <>
      <PageHeader eyebrow="Nutrition" title="Calories" subtitle="Meals, water, and peptides — logged, not guessed." />

      <Section title="Today">
        <div className="flex justify-around">
          <Ring value={totalCalories} target={nutritionTargets.calories} label="Calories" unit="" tone="accent" />
          <Ring value={totalProtein} target={nutritionTargets.protein} label="Protein" unit="g" tone="danger" />
          <Ring value={water} target={nutritionTargets.waterOz} label="Water" unit="oz" tone="info" />
        </div>
      </Section>

      <Section title="Water">
        <Card accent="none">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[18px] font-semibold tabular-nums">{water} oz</p>
              <p className="text-[12px] text-ink-soft">of {nutritionTargets.waterOz} oz target</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setWater((w) => Math.max(0, w - WATER_STEP))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-[16px] text-ink-soft"
              >
                –
              </button>
              <button
                onClick={() => setWater((w) => w + WATER_STEP)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-info text-[16px] font-medium text-surface"
              >
                +
              </button>
            </div>
          </div>
        </Card>
      </Section>

      <Section title={`Today's meals (${meals.length})`}>
        <div className="flex flex-col gap-2.5">
          {meals.map((m) => (
            <Card key={m.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{m.name}</p>
                <p className="font-mono text-[12px] tabular-nums text-ink-soft">
                  {m.calories} cal · {m.protein}g protein · {m.time}
                </p>
              </div>
              <button onClick={() => removeMeal(m.id)} className="text-[13px] text-ink-soft">
                ✕
              </button>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Recipe library">
        <div className="flex flex-col gap-2.5">
          {library.map((r) => (
            <Card key={r.id} accent="none" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{r.name}</p>
                <p className="font-mono text-[12px] tabular-nums text-ink-soft">
                  {r.calories} cal · {r.protein}g protein
                </p>
              </div>
              <button
                onClick={() => addFromLibrary(r)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[16px] font-medium text-surface"
              >
                +
              </button>
            </Card>
          ))}
        </div>

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
            <button
              onClick={saveRecipe}
              className="rounded-lg bg-accent py-2 text-[13px] font-medium text-surface"
            >
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
            <button
              onClick={addPeptide}
              className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-surface"
            >
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
