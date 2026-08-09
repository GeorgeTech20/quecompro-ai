import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatPEN } from "@/components/ui";
import { pricePer100g, unitLabel } from "@/components/shell/format";
import { BasketIcon } from "@/components/shell/icons";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import {
  categoryLabel,
  findProducts,
  loadCategories,
  loadStores,
  requireHouseholdViewer,
  safeLoad,
} from "@/components/shell/server-data";
import { Badge, Card, EmptyState, HealthChip, Money } from "@/components/ui";
import type { ProductRow } from "@/types/db";

import { AddToCartButton } from "./AddToCartButton";
import { CatalogFilters } from "./CatalogFilters";

export const metadata: Metadata = { title: "Productos" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Catálogo. El filtro vive en la URL y la consulta la resuelve el servidor, así
 * que lo que ves acá es exactamente lo que ve la IA cuando busca un reemplazo.
 */
export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const params = await searchParams;
  const query = first(params.q).trim();
  const store = first(params.store);
  const category = first(params.cat);

  const [products, stores, categories] = await Promise.all([
    safeLoad<ProductRow[]>(
      () => findProducts(query, { store: store || undefined, category: category || undefined, limit: 48 }),
      [],
      "productos:busqueda",
    ),
    safeLoad<string[]>(() => loadStores(), [], "productos:tiendas"),
    safeLoad<string[]>(() => loadCategories(), [], "productos:categorias"),
  ]);

  const filtered = query.length > 0 || store !== "" || category !== "";

  return (
    <PageShell>
      <PageHeader
        title="Productos"
        description="Precios aproximados de mercado limeño 2026. Compara por 100 g antes de decidir: la misma marca cambia de precio entre tiendas."
      />

      <CatalogFilters
        stores={stores}
        categories={categories.map((key) => ({ key, label: categoryLabel(key) }))}
      />

      {products.length === 0 ? (
        <Card padding="md">
          <EmptyState
            illustration={<BasketIcon className="size-7" />}
            title={filtered ? "Nada calza con esa búsqueda" : "El catálogo está vacío"}
            description={
              filtered
                ? "Prueba con el nombre común del producto («pollo», «papa», «leche») o quita algún filtro de tienda."
                : "Todavía no hay productos cargados. Corre el seed de la base para tener el catálogo de demostración."
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {products.length} {products.length === 1 ? "resultado" : "resultados"}
            {store ? ` en ${store}` : ""}
            {category ? ` · ${categoryLabel(category)}` : ""}
          </p>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} householdId={viewer.household.id} />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}

function ProductCard({ product, householdId }: { product: ProductRow; householdId: string }) {
  const per100 = pricePer100g(product.price, product.unit);

  return (
    <Card padding="none" className="group flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-raised">
      <div className="relative aspect-square overflow-hidden bg-brand-50">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-8 pb-12 text-center text-ink-faint">
            <span className="grid size-14 place-items-center rounded-full bg-white">
              <BasketIcon className="size-6" />
            </span>
            <p className="line-clamp-2 text-sm font-medium text-ink-muted">{product.name}</p>
            <p className="text-xs">Imagen pendiente de verificar</p>
          </div>
        )}
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
          <Badge tone="neutral" className="border-white/50 bg-white/85 text-ink backdrop-blur">{product.store}</Badge>
          {product.health_grade ? <HealthChip grade={product.health_grade} size="sm" showLabel={false} /> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink" title={product.name}>
            {product.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {product.brand ? `${product.brand} · ` : ""}
            {categoryLabel(product.category)}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xl font-semibold tracking-tight text-ink">
            <Money value={product.price} />
            <span className="text-sm font-normal text-ink-muted">
              {" "}
              / {unitLabel(product.unit)}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {per100 !== null
              ? `${formatPEN(per100)} por 100 g`
              : "Se vende por unidad: no hay precio por 100 g"}
          </p>
        </div>
      </div>

      <div className="mt-auto flex justify-end pt-1">
        <AddToCartButton
          productId={product.id}
          householdId={householdId}
          title={product.name}
          price={product.price}
        />
      </div>
      </div>
    </Card>
  );
}
