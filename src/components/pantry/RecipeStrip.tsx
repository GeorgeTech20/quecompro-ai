"use client";

import { useState } from "react";

import { ClockIcon, FlameIcon } from "@/components/shell/icons";
import { Badge, Button, Card, Chip, cn, Modal } from "@/components/ui";

import { DIFFICULTY_LABEL, type PantryRecipe } from "./types";

/**
 * Lo que se puede cocinar con lo que ya está adentro.
 *
 * Es el pago emocional de la pantalla: la despensa no solo dice qué compraste,
 * dice qué comes hoy sin volver a salir.
 */

function missingText(recipe: PantryRecipe): string {
  if (recipe.missing.length === 0) return "tienes todo lo necesario";
  if (recipe.missing.length === 1) return `te falta ${recipe.missing[0]}`;
  const head = recipe.missing.slice(0, -1).join(", ");
  const last = recipe.missing[recipe.missing.length - 1];
  return `te falta ${head} y ${last}`;
}

export type RecipeStripProps = {
  recipes: PantryRecipe[];
  /** Producto elegido en «cocinar con esto»: resalta las recetas que lo usan. */
  highlightProductId: string | null;
  highlightName: string | null;
  onClearHighlight: () => void;
};

export function RecipeStrip({
  recipes,
  highlightProductId,
  highlightName,
  onClearHighlight,
}: RecipeStripProps) {
  const [open, setOpen] = useState<PantryRecipe | null>(null);

  if (recipes.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm font-semibold text-ink">Todavía no sale ninguna receta</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Con dos ingredientes que coincidan ya aparece una propuesta acá. Compra un par de cosas
          más y la despensa empieza a sugerir qué cocinar.
        </p>
      </Card>
    );
  }

  const matches = highlightProductId
    ? recipes.filter((recipe) => recipe.usesProductIds.includes(highlightProductId))
    : recipes;

  return (
    <section aria-labelledby="despensa-recetas-titulo" id="despensa-recetas">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="despensa-recetas-titulo" className="text-sm font-semibold text-ink">
          Se puede cocinar ahora mismo
        </h2>
        {highlightProductId && highlightName ? (
          <Chip tone="brand" size="sm" onRemove={onClearHighlight} removeLabel="Quitar el filtro">
            {matches.length === 0 ? "Ninguna receta usa" : "Recetas con"} {highlightName}
          </Chip>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-ink-muted">
            Ninguna de las recetas posibles usa {highlightName}.{" "}
            <button
              type="button"
              onClick={onClearHighlight}
              className="font-medium text-brand-700 underline underline-offset-2"
            >
              Ver todas
            </button>
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((recipe) => (
            <li key={recipe.slug}>
              <RecipeCard recipe={recipe} onOpen={() => setOpen(recipe)} />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title}
        description={
          open ? `${open.timeMin} min · ${open.servings} porciones · ${DIFFICULTY_LABEL[open.difficulty]}` : undefined
        }
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setOpen(null)}>
            Cerrar
          </Button>
        }
      >
        {open ? <RecipeSteps recipe={open} /> : null}
      </Modal>
    </section>
  );
}

function RecipeCard({ recipe, onOpen }: { recipe: PantryRecipe; onOpen: () => void }) {
  const complete = recipe.missing.length === 0;

  return (
    <Card
      padding="none"
      className={cn(
        "h-full transition-colors duration-150",
        complete && "border-brand-300 dark:border-brand-700",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex h-full w-full flex-col gap-2 rounded-card px-4 py-3.5 text-left",
          "transition-colors duration-150 hover:bg-surface-sunken",
          "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{recipe.title}</span>
          <Badge tone={complete ? "success" : "neutral"} size="sm">
            {DIFFICULTY_LABEL[recipe.difficulty]}
          </Badge>
        </div>

        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" /> {recipe.timeMin} min
          </span>
          {recipe.kcalPerServing ? (
            <span className="inline-flex items-center gap-1">
              <FlameIcon className="size-3.5" /> {recipe.kcalPerServing} kcal
            </span>
          ) : null}
        </span>

        <span className="mt-auto text-xs leading-relaxed text-ink-muted">
          <strong className="font-semibold text-ink">
            {recipe.matched} de {recipe.required}
          </strong>{" "}
          — {missingText(recipe)}
        </span>
      </button>
    </Card>
  );
}

function RecipeSteps({ recipe }: { recipe: PantryRecipe }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          Ingredientes
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {recipe.have.map((name) => (
            <li key={`have-${name}`}>
              <Chip tone="accent" size="sm">
                {name}
              </Chip>
            </li>
          ))}
          {recipe.missing.map((name) => (
            <li key={`missing-${name}`}>
              <Chip size="sm">{name}</Chip>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">
          En verde lo que ya está en tu despensa; en gris lo que hay que comprar.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Pasos</h3>
        {recipe.steps.length === 0 ? (
          <p className="text-sm text-ink-faint">Esta receta todavía no tiene los pasos cargados.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
