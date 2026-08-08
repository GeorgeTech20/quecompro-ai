"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { searchCatalogAction, type CatalogHit } from "@/app/(app)/app/cart/actions";
import { Combobox, formatPEN, type ComboboxOption } from "@/components/ui";
import type { AddItemDraft } from "@/hooks/use-live-cart";

/**
 * Lo primero que se toca en la demo: escribir "pollo" y darle Enter.
 *
 * Sin confirmación, sin modal y sin esperar al servidor — el item aparece
 * mientras la escritura viaja. Si falla, el hook lo saca y avisa.
 */

export type AddItemBarProps = {
  householdId: string;
  onAdd: (draft: AddItemDraft) => Promise<void>;
  onTyping?: () => void;
  className?: string;
};

const DEBOUNCE_MS = 250;

export function AddItemBar({ householdId, onAdd, onTyping, className }: AddItemBarProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [loading, setLoading] = useState(false);

  const hitsRef = useRef<CatalogHit[]>([]);
  hitsRef.current = hits;

  // El Combobox del DS deja el índice activo en -1 hasta que se usan flechas.
  // Sin esto, el Enter de "escribo y agrego" no haría nada.
  const arrowUsedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      void searchCatalogAction(householdId, term)
        .then((result) => {
          // Llegó una respuesta vieja: la tanda actual manda.
          if (id !== requestIdRef.current) return;
          setHits(result.ok ? result.hits : []);
        })
        .catch(() => {
          if (id === requestIdRef.current) setHits([]);
        })
        .finally(() => {
          if (id === requestIdRef.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, householdId]);

  const add = useCallback(
    (hit: CatalogHit) => {
      setQuery("");
      setHits([]);
      arrowUsedRef.current = false;
      void onAdd({
        productId: hit.id,
        productKey: hit.productKey,
        title: hit.title,
        price: hit.price,
        qty: 1,
        unit: hit.unit,
        store: hit.store,
        category: hit.category,
      });
    },
    [onAdd],
  );

  const options: ComboboxOption[] = hits.map((hit) => ({
    id: hit.id,
    label: hit.title,
    sublabel: [hit.brand, hit.store].filter(Boolean).join(" · "),
    meta: formatPEN(hit.price),
  }));

  function handleKeyDownCapture(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      arrowUsedRef.current = true;
      return;
    }
    if (event.key !== "Enter") return;

    // Con flechas ya hay una opción marcada: que la elija el Combobox.
    if (arrowUsedRef.current) return;

    const first = hitsRef.current[0];
    if (!first) return;
    event.preventDefault();
    event.stopPropagation();
    add(first);
  }

  return (
    <div className={className} onKeyDownCapture={handleKeyDownCapture}>
      <Combobox
        value={query}
        onInputChange={(next) => {
          setQuery(next);
          arrowUsedRef.current = false;
          onTyping?.();
        }}
        options={options}
        loading={loading}
        keepQueryOnSelect
        placeholder="Pollo, leche, arroz… escribe y dale Enter"
        emptyMessage={query.trim().length < 2 ? "Escribe al menos 2 letras" : "Sin resultados"}
        onSelect={(option) => {
          const hit = hitsRef.current.find((candidate) => candidate.id === option.id);
          if (hit) add(hit);
        }}
      />
    </div>
  );
}
