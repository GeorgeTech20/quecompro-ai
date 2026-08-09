"use client";

import {
  IconCamera,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCoffee,
  IconLeaf,
  IconMoonStars,
  IconShieldCheck,
  IconSoup,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Lottie from "lottie-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";

import {
  recordHealthyMealAction,
  removeHealthyMealAction,
} from "@/app/(app)/app/actions";
import { Button, Input, Modal, cn } from "@/components/ui";
import type { MealStreakSnapshot } from "@/lib/data";
import { prepareImageUpload } from "@/lib/images/prepare-upload";
import type { MealComponent, MealType } from "@/types/db";

import animationData from "./streak-celebration.json";

const MEALS: Array<{
  key: MealType;
  label: string;
  Icon: typeof IconCoffee;
}> = [
  { key: "breakfast", label: "Desayuno", Icon: IconCoffee },
  { key: "lunch", label: "Almuerzo", Icon: IconSoup },
  { key: "dinner", label: "Cena", Icon: IconMoonStars },
];

const COMPONENT_OPTIONS: Array<{
  key: MealComponent;
  label: string;
  example: string;
}> = [
  { key: "produce", label: "Fruta o verdura", example: "ensalada, palta, fruta" },
  { key: "protein", label: "Proteína", example: "huevo, pollo, menestras" },
  { key: "carbs", label: "Cereal o tubérculo", example: "arroz, pan, papa" },
];

function AnimatedFlame({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.span
      aria-hidden="true"
      animate={reduced ? undefined : { y: [0, -1.5, 0], scale: [1, 1.025, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      className="grid size-14 place-items-center overflow-hidden rounded-[18px] bg-[#fff7e8] ring-1 ring-[#f5c36a]/25"
    >
      <Lottie
        animationData={animationData}
        autoplay={!reduced}
        loop={!reduced}
        className="size-14"
      />
    </motion.span>
  );
}

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function MonthlyStreakCalendar({
  today,
  history,
  target,
}: Pick<MealStreakSnapshot, "today" | "history" | "target">) {
  const currentMonth = today.slice(0, 7);
  const firstMonth = shiftMonth(currentMonth, -11);
  const [visibleMonth, setVisibleMonth] = useState(currentMonth);
  const [year, monthNumber] = visibleMonth.split("-").map(Number);
  const firstDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const mondayOffset = (firstDate.getUTCDay() + 6) % 7;
  const historyByDate = new Map(history.map((day) => [day.date, day]));
  const monthLabel = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(firstDate);
  const cells: Array<string | null> = [
    ...Array.from<null>({ length: mondayOffset }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => `${visibleMonth}-${String(index + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="mt-6 border-t border-border-subtle pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Calendario de la racha</p>
          <p className="mt-0.5 text-xs text-ink-muted">Cada cuadro verde oscuro es un día protegido.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            disabled={visibleMonth <= firstMonth}
            onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
            className="grid size-8 place-items-center rounded-button text-ink-muted hover:bg-surface-sunken disabled:opacity-30"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <p className="w-32 text-center text-sm font-medium capitalize text-ink">{monthLabel}</p>
          <button
            type="button"
            aria-label="Mes siguiente"
            disabled={visibleMonth >= currentMonth}
            onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
            className="grid size-8 place-items-center rounded-button text-ink-muted hover:bg-surface-sunken disabled:opacity-30"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5" role="grid" aria-label={`Racha de ${monthLabel}`}>
        {(["L", "M", "X", "J", "V", "S", "D"] as const).map((weekday) => (
          <span key={weekday} className="pb-1 text-center text-[10px] font-semibold text-ink-faint" aria-hidden="true">
            {weekday}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
          const day = historyByDate.get(date);
          const count = day?.healthyCount ?? 0;
          const isFuture = date > today;
          const isToday = date === today;
          return (
            <span
              key={date}
              role="gridcell"
              aria-label={`${date}: ${count} de ${target} comidas verificadas`}
              title={`${date} · ${count} de ${target} comidas verificadas`}
              className={cn(
                "grid aspect-square min-h-7 place-items-center rounded-[7px] text-[10px] font-medium tabular-nums",
                "transition-transform hover:scale-105",
                isFuture && "bg-surface-sunken/40 text-ink-faint/50",
                !isFuture && count === 0 && "bg-surface-sunken text-ink-faint",
                !isFuture && count === 1 && "bg-brand-100 text-brand-800",
                !isFuture && count >= target && "bg-brand-600 text-white",
                isToday && "ring-2 ring-brand-700 ring-offset-2 ring-offset-surface",
              )}
            >
              {Number(date.slice(-2))}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-ink-muted">
        <span>Sin registro</span>
        <span className="size-3 rounded-[4px] bg-surface-sunken" />
        <span className="size-3 rounded-[4px] bg-brand-100" />
        <span className="size-3 rounded-[4px] bg-brand-600" />
        <span>Protegido</span>
      </div>
    </div>
  );
}

export function MealStreakCard({
  householdId,
  initial,
}: {
  householdId: string;
  initial: MealStreakSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);
  const [title, setTitle] = useState("");
  const [components, setComponents] = useState<Set<MealComponent>>(() => new Set());
  const [photo, setPhoto] = useState<File | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const activeLog = activeMeal ? snapshot.meals[activeMeal] : undefined;
  const activeLabel = MEALS.find((meal) => meal.key === activeMeal)?.label ?? "Comida";

  function openMeal(mealType: MealType) {
    const log = snapshot.meals[mealType];
    setActiveMeal(mealType);
    setTitle(log?.title ?? "");
    setComponents(new Set(log?.components ?? []));
    setPhoto(null);
    setError("");
  }

  function closeModal() {
    if (pending) return;
    setActiveMeal(null);
    setError("");
  }

  function toggleComponent(component: MealComponent) {
    setComponents((current) => {
      const next = new Set(current);
      if (next.has(component)) next.delete(component);
      else next.add(component);
      return next;
    });
  }

  function saveMeal() {
    if (!activeMeal) return;
    const wasProtected = snapshot.protectedToday;
    setError("");

    const formData = new FormData();
    formData.set("mealType", activeMeal);
    formData.set("title", title);
    for (const component of components) formData.append("components", component);
    if (photo) formData.set("photo", photo);

    startTransition(async () => {
      const result = await recordHealthyMealAction(householdId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSnapshot(result.snapshot);
      setActiveMeal(null);
      if (!wasProtected && result.snapshot.protectedToday) {
        setCelebrate(true);
      }
    });
  }

  function removeMeal() {
    if (!activeMeal) return;
    setError("");
    startTransition(async () => {
      const result = await removeHealthyMealAction(householdId, activeMeal);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSnapshot(result.snapshot);
      setActiveMeal(null);
    });
  }

  return (
    <>
      <section className="relative rounded-panel border border-border-subtle bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <AnimatedFlame reduced={reduceMotion} />
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
                  Racha saludable
                </p>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <p className="text-3xl font-semibold tracking-[-0.045em] text-ink tabular-nums">
                    {snapshot.currentStreak} {snapshot.currentStreak === 1 ? "día" : "días"}
                  </p>
                  {snapshot.protectedToday ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      <IconShieldCheck className="size-4" /> protegido
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Registra {snapshot.target} comidas con foto y al menos 2 grupos nutricionales para
              proteger hoy. Una foto no prueba que comiste, pero deja una evidencia fechada y evita
              sumar la racha con un toque vacío.
            </p>

            <div className="mt-4 flex items-center gap-3" aria-label={`${snapshot.todayHealthyCount} de ${snapshot.target} comidas verificadas`}>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.min(100, (snapshot.todayHealthyCount / snapshot.target) * 100)}%` }}
                  className="h-full rounded-full bg-brand-600"
                />
              </div>
              <span className="text-sm font-semibold text-ink tabular-nums">
                {snapshot.todayHealthyCount}/{snapshot.target}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-[25rem]">
            {MEALS.map(({ key, label, Icon }) => {
              const log = snapshot.meals[key];
              const checked = Boolean(log);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openMeal(key)}
                  className={cn(
                    "group flex min-h-24 min-w-0 flex-col items-start justify-between rounded-card border p-3 text-left",
                    "transition-[transform,border-color,background-color] duration-200 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                    checked
                      ? "border-brand-200 bg-brand-50"
                      : "border-border-subtle bg-surface hover:border-brand-300 hover:bg-brand-50/40",
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <Icon className={cn("size-5", checked ? "text-brand-700" : "text-ink-muted")} strokeWidth={1.8} />
                    {checked ? (
                      <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                        <IconCheck className="size-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <IconCamera className="size-4 text-ink-faint transition-colors group-hover:text-brand-600" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-ink">{label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                      {log?.title ?? "Registrar"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <MonthlyStreakCalendar today={snapshot.today} history={snapshot.history} target={snapshot.target} />

        <AnimatePresence>
          {celebrate ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] grid min-h-[100dvh] place-items-center bg-[#102431]/96 px-5 py-10 text-center text-white backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label="Racha protegida"
              aria-live="polite"
              onClick={(event) => {
                if (event.target === event.currentTarget) setCelebrate(false);
              }}
            >
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="relative w-full max-w-md"
              >
                <button
                  type="button"
                  onClick={() => setCelebrate(false)}
                  aria-label="Cerrar celebración"
                  className="absolute top-0 right-0 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <IconX className="size-5" aria-hidden="true" />
                </button>
                <Lottie
                  animationData={animationData}
                  autoplay={!reduceMotion}
                  loop={!reduceMotion}
                  className="mx-auto size-56 sm:size-72"
                />
                <p className="text-4xl font-semibold tracking-tight">¡Día protegido!</p>
                <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-white/70">
                  Registraste dos comidas balanceadas con evidencia. Tu racha sigue viva.
                </p>
                <Button className="mt-7 min-w-40" onClick={() => setCelebrate(false)}>
                  Seguir
                </Button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <Modal
        open={Boolean(activeMeal)}
        onClose={closeModal}
        title={activeLog ? `${activeLabel} registrado` : `Registrar ${activeLabel.toLowerCase()}`}
        description={
          activeLog
            ? "Este registro ya cuenta para la racha de hoy."
            : "La foto queda privada y sirve como evidencia fechada de tu registro."
        }
        size="sm"
        footer={
          activeLog ? (
            <Button
              variant="danger"
              iconLeft={<IconTrash className="size-4" />}
              loading={pending}
              onClick={removeMeal}
            >
              Eliminar registro
            </Button>
          ) : (
            <>
              <Button variant="tertiary" disabled={pending} onClick={closeModal}>
                Cancelar
              </Button>
              <Button loading={pending || preparingPhoto} onClick={saveMeal}>
                Guardar comida
              </Button>
            </>
          )
        }
      >
        {activeLog ? (
          <div className="space-y-4">
            <div className="rounded-card bg-brand-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                <IconShieldCheck className="size-5" /> Evidencia guardada
              </div>
              <p className="mt-2 text-base font-semibold text-ink">{activeLog.title}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {activeLog.components.length} grupos nutricionales · foto privada
              </p>
            </div>
            {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-5">
            <Input
              label="¿Qué comiste?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. pollo con arroz y ensalada"
              maxLength={100}
              required
            />

            <fieldset>
              <legend className="text-sm font-medium text-ink">¿Qué grupos incluyó?</legend>
              <p className="mt-1 text-xs text-ink-muted">Elige al menos 2.</p>
              <div className="mt-3 grid gap-2">
                {COMPONENT_OPTIONS.map((option) => {
                  const selected = components.has(option.key);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleComponent(option.key)}
                      className={cn(
                        "flex items-center gap-3 rounded-button border px-3 py-2.5 text-left",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                        selected ? "border-brand-300 bg-brand-50" : "border-border-subtle hover:border-brand-200",
                      )}
                    >
                      <span className={cn("grid size-5 place-items-center rounded-full border", selected ? "border-brand-600 bg-brand-600 text-white" : "border-border-strong text-transparent")}>
                        <IconCheck className="size-3" strokeWidth={3} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{option.label}</span>
                        <span className="block text-xs text-ink-muted">{option.example}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <p className="text-sm font-medium text-ink">Foto de la comida</p>
              <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface-sunken/50 p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40">
                <span className="grid size-10 shrink-0 place-items-center rounded-button bg-surface text-brand-700 shadow-card">
                  {photo ? <IconCheck className="size-5" /> : <IconCamera className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {photo?.name ?? "Tomar o elegir foto"}
                  </span>
                  <span className="block text-xs text-ink-muted">JPG, PNG, WebP o HEIC · máximo 8 MB</span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    if (!selected) {
                      setPhoto(null);
                      return;
                    }
                    setPreparingPhoto(true);
                    void prepareImageUpload(selected)
                      .then(setPhoto)
                      .catch(() => setPhoto(selected))
                      .finally(() => setPreparingPhoto(false));
                  }}
                />
              </label>
            </div>

            <div className="flex gap-2 rounded-card bg-surface-sunken p-3 text-xs leading-relaxed text-ink-muted">
              <IconLeaf className="mt-0.5 size-4 shrink-0 text-brand-700" />
              La app valida el registro y su evidencia, no puede comprobar la ingestión física de la comida.
            </div>

            {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
          </div>
        )}
      </Modal>
    </>
  );
}
