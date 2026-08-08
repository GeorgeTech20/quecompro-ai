"use client";

import { useCallback, useState, useSyncExternalStore, useTransition } from "react";

import { Card, Modal, Money, Toggle, useToast } from "@/components/ui";

import { PantryCabinet } from "./PantryCabinet";
import { PantryDetail, PantryDetailPlaceholder } from "./PantryDetail";
import { PantryList } from "./PantryList";
import { PantryStyles } from "./PantryStyles";
import { RecipeStrip } from "./RecipeStrip";
import type { PantryItem, PantrySnapshot } from "./types";

/**
 * Orquestador de la despensa: elige mueble o lista, mantiene qué producto está
 * abierto y conecta «cocinar con esto» con la fila de recetas.
 */

export type PantryViewProps = {
  snapshot: PantrySnapshot;
  /** Server action de «volver a comprar». La pantalla no habla con la base. */
  onRebuy: (productId: string) => Promise<{ ok: true; title: string } | { ok: false; error: string }>;
};

/** `false` en el servidor: el panel lateral ya se resuelve por CSS. */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function PantryView({ snapshot, onRebuy }: PantryViewProps) {
  const [asList, setAsList] = useState(false);
  const [selected, setSelected] = useState<PantryItem | null>(null);
  const [highlight, setHighlight] = useState<PantryItem | null>(null);
  const [rebuying, startRebuy] = useTransition();
  const { toast } = useToast();

  const wide = useMediaQuery("(min-width: 1024px)");

  function recipesFor(item: PantryItem | null): number {
    const productId = item?.productId;
    if (!productId) return 0;
    return snapshot.recipes.filter((recipe) => recipe.usesProductIds.includes(productId)).length;
  }

  function handleCook(item: PantryItem) {
    setHighlight(item);
    setSelected(null);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("despensa-recetas")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleRebuy(item: PantryItem) {
    if (!item.productId) return;
    const productId = item.productId;

    startRebuy(async () => {
      const result = await onRebuy(productId);
      if (!result.ok) {
        toast({ title: "No se pudo agregar", description: result.error, tone: "critical" });
        return;
      }
      toast({
        title: `${result.title} al carrito`,
        description: "Ya le apareció a los demás en su pantalla.",
        tone: "success",
      });
    });
  }

  const detail =
    selected === null ? null : (
      <PantryDetail
        item={selected}
        recipeCount={recipesFor(selected)}
        rebuying={rebuying}
        onCook={handleCook}
        onRebuy={handleRebuy}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <PantryStyles />

      <RecipeStrip
        recipes={snapshot.recipes}
        highlightProductId={highlight?.productId ?? null}
        highlightName={highlight?.name ?? null}
        onClearHighlight={() => setHighlight(null)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PantrySummary snapshot={snapshot} />
        <Toggle
          checked={asList}
          onChange={setAsList}
          label="Ver como lista"
          size="sm"
          wrapperClassName="items-center"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {asList ? (
            <PantryList
              shelves={snapshot.shelves}
              selectedKey={selected?.key ?? null}
              onSelect={setSelected}
            />
          ) : (
            <PantryCabinet
              shelves={snapshot.shelves}
              selectedKey={selected?.key ?? null}
              onSelect={setSelected}
            />
          )}
        </div>

        <aside className="hidden lg:block">
          <Card padding="md" className="sticky top-20">
            {detail ?? <PantryDetailPlaceholder />}
          </Card>
        </aside>
      </div>

      {/* En pantallas angostas el detalle es un modal del design system. */}
      <Modal
        open={!wide && selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        size="md"
      >
        {detail}
      </Modal>
    </div>
  );
}

function PantrySummary({ snapshot }: { snapshot: PantrySnapshot }) {
  const graded = snapshot.gradeCount.A + snapshot.gradeCount.B + snapshot.gradeCount.C + snapshot.gradeCount.D;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="text-sm text-ink-muted">
        <strong className="font-semibold text-ink">{snapshot.itemCount}</strong>{" "}
        {snapshot.itemCount === 1 ? "producto" : "productos"} adentro ·{" "}
        <Money value={snapshot.spent} className="font-semibold text-ink" />
      </p>

      {graded > 0 ? (
        <div className="flex items-center gap-2">
          <span
            className="flex h-1.5 w-40 overflow-hidden rounded-full bg-surface-sunken"
            role="img"
            aria-label={`Salud de la despensa: ${snapshot.gradeCount.A} A, ${snapshot.gradeCount.B} B, ${snapshot.gradeCount.C} C, ${snapshot.gradeCount.D} D`}
          >
            {(["A", "B", "C", "D"] as const).map((grade) => (
              <span
                key={grade}
                className={
                  grade === "A"
                    ? "bg-grade-a"
                    : grade === "B"
                      ? "bg-grade-b"
                      : grade === "C"
                        ? "bg-grade-c"
                        : "bg-grade-d"
                }
                style={{ width: `${(snapshot.gradeCount[grade] / graded) * 100}%` }}
              />
            ))}
          </span>
          <span className="text-xs text-ink-faint">
            {snapshot.gradeCount.A + snapshot.gradeCount.B} de {graded} con buena nota
          </span>
        </div>
      ) : null}
    </div>
  );
}
