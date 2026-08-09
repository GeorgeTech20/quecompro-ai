"use client";

import { IconCheck, IconCoffee, IconMoonStars, IconSoup } from "@tabler/icons-react";
import { useMemo, useState, useTransition } from "react";

import { saveMealPlanAction } from "@/app/(app)/app/actions";
import { Button, cn } from "@/components/ui";
import type { MealPlanRow, MealType } from "@/types/db";

const MEALS = [
  { key: "breakfast" as const, label: "Desayuno", Icon: IconCoffee },
  { key: "lunch" as const, label: "Almuerzo", Icon: IconSoup },
  { key: "dinner" as const, label: "Cena", Icon: IconMoonStars },
];

function shiftDate(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function MealPlanBoard({
  householdId,
  today,
  initial,
}: {
  householdId: string;
  today: string;
  initial: MealPlanRow[];
}) {
  const tomorrow = shiftDate(today, 1);
  const [date, setDate] = useState(today);
  const [plans, setPlans] = useState(initial);
  const [editing, setEditing] = useState<MealType | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const byMeal = useMemo(
    () => new Map(plans.filter((plan) => plan.plan_date === date).map((plan) => [plan.meal_type, plan])),
    [date, plans],
  );

  function edit(mealType: MealType) {
    setEditing(mealType);
    setDraft(byMeal.get(mealType)?.title ?? "");
    setError("");
  }

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const result = await saveMealPlanAction(householdId, {
        planDate: date,
        mealType: editing,
        title: draft,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlans(result.plans);
      setEditing(null);
      setDraft("");
    });
  }

  return (
    <section className="rounded-panel border border-border-subtle bg-sky-50 p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">¿Qué comemos?</h2>
          <p className="mt-1 text-sm text-ink-muted">Déjalo decidido antes de comprar.</p>
        </div>
        <div className="flex rounded-full border border-sky-200 bg-white p-1">
          {[
            { value: today, label: "Hoy" },
            { value: tomorrow, label: "Mañana" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { setDate(option.value); setEditing(null); setError(""); }}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-semibold transition",
                date === option.value ? "bg-[#142a3a] text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {MEALS.map(({ key, label, Icon }) => {
          const plan = byMeal.get(key);
          const isEditing = editing === key;
          return (
            <div key={key} className="rounded-card border border-sky-200 bg-white p-3.5">
              <button type="button" onClick={() => edit(key)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                <span className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <Icon className="size-4 text-brand-600" aria-hidden="true" /> {label}
                  {plan ? <IconCheck className="ml-auto size-4 text-grade-a" aria-hidden="true" /> : null}
                </span>
                <span className={cn("mt-3 block min-h-10 text-sm font-semibold leading-5", plan ? "text-ink" : "text-ink-faint")}>
                  {plan?.title ?? "Toca para decidir"}
                </span>
              </button>
              {isEditing ? (
                <div className="mt-3">
                  <input
                    autoFocus
                    value={draft}
                    maxLength={100}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") save(); }}
                    placeholder="Ej. tallarines con pollo"
                    className="w-full rounded-control border border-border-strong px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <Button size="sm" className="mt-2 w-full" loading={pending} onClick={save}>
                    {draft.trim() ? "Guardar" : "Dejar vacío"}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-danger" role="alert">{error}</p> : null}
    </section>
  );
}
