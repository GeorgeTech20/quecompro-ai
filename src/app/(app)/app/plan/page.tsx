import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  capitalize,
  formatDateShort,
  formatDayLong,
  isSameDay,
  startOfWeek,
} from "@/components/shell/format";
import { CalendarIcon, ClockIcon, FlameIcon, SparkIcon } from "@/components/shell/icons";
import { LinkButton } from "@/components/shell/LinkButton";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import {
  requireHouseholdViewer,
  safeLoad,
  suggestRecipesForCart,
} from "@/components/shell/server-data";
import { Badge, Card, Chip, cn, EmptyState } from "@/components/ui";
import type { RecipeSuggestion } from "@/lib/realtime/channels";

export const metadata: Metadata = { title: "Plan de la semana" };

/**
 * Plan semanal.
 *
 * Las recetas salen de lo que el carrito ya cubre: son propuestas, no un
 * calendario guardado. Mientras no exista una tabla de plan aceptado, la
 * pantalla es honesta al respecto en vez de fingir persistencia.
 */
export default async function PlanPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const recipes = await safeLoad<RecipeSuggestion[]>(
    () => suggestRecipesForCart(viewer.household.id, 7),
    [],
    "plan:recetas",
  );

  const today = new Date();
  const monday = startOfWeek(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { date, recipe: recipes[index] };
  });

  return (
    <PageShell>
      <PageHeader
        title="Plan de la semana"
        description="Lo que se puede cocinar con lo que ya está en el carrito, repartido de lunes a domingo."
        actions={
          <LinkButton href="/app/chat" iconLeft={<SparkIcon className="size-4" />}>
            Pedirle un plan a la IA
          </LinkButton>
        }
      />

      {recipes.length === 0 ? (
        <Card padding="md">
          <EmptyState
            illustration={<CalendarIcon className="size-7" />}
            title="Todavía no hay nada que cocinar"
            description="Con dos o tres cosas en el carrito ya se arma algo. Pon pollo, papa y cebolla y pídele al asistente «arma un plan para la semana con S/ 200»."
            action={
              <LinkButton href="/app/chat" size="sm">
                Pedirle un plan
              </LinkButton>
            }
            secondaryAction={
              <LinkButton href="/app/products" size="sm" variant="secondary">
                Ver productos
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {recipes.length} {recipes.length === 1 ? "propuesta" : "propuestas"} a partir de tu
            carrito. Cuando aceptes una en el chat, se queda fija en su día.
          </p>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {days.map(({ date, recipe }) => (
              <li key={date.toISOString()}>
                <DayCard date={date} today={isSameDay(date, today)} recipe={recipe} />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}

function DayCard({
  date,
  today,
  recipe,
}: {
  date: Date;
  today: boolean;
  recipe: RecipeSuggestion | undefined;
}) {
  return (
    <Card
      padding="md"
      className={cn(
        "flex h-full min-h-40 flex-col gap-3",
        today && "border-brand-300 ring-1 ring-brand-200 dark:border-brand-700 dark:ring-brand-800",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{capitalize(formatDayLong(date))}</p>
        <span className="text-xs text-ink-faint">{formatDateShort(date)}</span>
      </div>

      {recipe ? (
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium text-ink">{recipe.title}</p>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" /> {recipe.timeMin} min
            </span>
            <span className="inline-flex items-center gap-1">
              <FlameIcon className="size-3.5" /> {recipe.kcalPerServing} kcal
            </span>
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-1.5">
            <Badge tone={recipe.difficulty === "facil" ? "success" : "neutral"} size="sm">
              {recipe.difficulty === "facil" ? "Fácil" : recipe.difficulty === "media" ? "Media" : "Difícil"}
            </Badge>
            <Chip size="sm">
              {recipe.ingredients.filter((ingredient) => ingredient.inCart).length}/
              {recipe.ingredients.length} en el carrito
            </Chip>
          </div>
        </div>
      ) : (
        <p className="flex flex-1 items-center text-sm text-ink-faint">
          Libre. Agrega algo más al carrito y aparece una opción acá.
        </p>
      )}
    </Card>
  );
}
