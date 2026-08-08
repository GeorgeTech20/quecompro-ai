"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { ChipListField } from "@/components/shell/ChipListField";
import { ArrowRightIcon } from "@/components/shell/icons";
import { ALLERGY_SUGGESTIONS, DIET_SUGGESTIONS } from "@/components/shell/preferences";
import { Button, cn, formatPEN, Input, Money } from "@/components/ui";

import {
  addFirstItemAction,
  createHouseholdAction,
  joinHouseholdAction,
  saveBudgetAction,
  saveDietAction,
  saveHouseName,
  saveWhatsappAction,
} from "./actions";
import { DEFAULT_BUDGET, IDLE, type OnboardingState } from "./state";

/** Mensaje de error de un paso. Siempre en el mismo sitio, siempre en rojo. */
function StepError({ state }: { state: OnboardingState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="text-sm font-medium text-danger">
      {state.message}
    </p>
  );
}

function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-ink-muted underline-offset-2",
        "transition-colors duration-150 hover:text-ink hover:underline",
        "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
      )}
    >
      {children}
    </Link>
  );
}

// --- 1. Bienvenida ---------------------------------------------------------

export function WelcomeForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveHouseName, IDLE);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">¿Cómo le decimos a tu casa?</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Es el nombre que van a ver tus roomies. «Depa de Miraflores», «Casa», lo que sea.
        </p>
      </div>

      <Input
        name="name"
        label="Nombre de la casa"
        defaultValue={defaultName}
        placeholder="Depa de Miraflores"
        maxLength={60}
        autoFocus
        required
        inputSize="lg"
      />

      <StepError state={state} />

      <Button type="submit" size="lg" fullWidth loading={pending} iconRight={<ArrowRightIcon className="size-4" />}>
        Seguir
      </Button>
    </form>
  );
}

// --- 2. Crear o unirse -----------------------------------------------------

export function HouseholdForm({ defaultName }: { defaultName: string }) {
  const [createState, createAction, creating] = useActionState<OnboardingState, FormData>(
    createHouseholdAction,
    IDLE,
  );
  const [joinState, joinAction, joining] = useActionState<OnboardingState, FormData>(
    joinHouseholdAction,
    IDLE,
  );
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">¿Casa nueva o ya hay una?</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Si tu pareja o tus roomies ya crearon la casa, únete con el enlace que te pasaron.
        </p>
      </div>

      <form action={createAction} className="flex flex-col gap-3">
        <input type="hidden" name="name" value={defaultName} />
        <Button type="submit" size="lg" fullWidth loading={creating}>
          Crear «{defaultName || "Mi casa"}»
        </Button>
        <StepError state={createState} />
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-ink-faint">o</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      {showJoin ? (
        <form action={joinAction} className="flex flex-col gap-3">
          <Input
            name="code"
            label="Código o enlace de invitación"
            placeholder="https://quecompro.ai/invite/abc123"
            autoFocus
            required
            hint="Pega el enlace completo, no hace falta recortarlo."
          />
          <StepError state={joinState} />
          <Button type="submit" variant="secondary" size="lg" fullWidth loading={joining}>
            Unirme a esa casa
          </Button>
        </form>
      ) : (
        <Button variant="secondary" size="lg" fullWidth onClick={() => setShowJoin(true)}>
          Tengo un código de invitación
        </Button>
      )}
    </div>
  );
}

// --- 3. Presupuesto --------------------------------------------------------

const BUDGET_MIN = 300;
const BUDGET_MAX = 4000;
const BUDGET_STEP = 50;

export function BudgetForm({ initial }: { initial: number }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveBudgetAction, IDLE);
  const [budget, setBudget] = useState(initial > 0 ? initial : DEFAULT_BUDGET);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          ¿Cuánto quieres gastar al mes?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Es un techo, no una regla. La IA te avisa cuando la proyección se pasa. Lo cambias cuando
          quieras.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-center text-4xl font-semibold tracking-tight text-ink">
          <Money value={budget} round />
        </p>

        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
          aria-label="Presupuesto mensual"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken accent-brand-600"
        />

        <div className="flex justify-between text-xs text-ink-faint">
          <span>{formatPEN(BUDGET_MIN, { round: true })}</span>
          <span>{formatPEN(BUDGET_MAX, { round: true })}</span>
        </div>

        <input type="hidden" name="monthly_budget" value={budget} />
      </div>

      <StepError state={state} />

      <div className="flex items-center justify-between gap-3">
        <SkipLink href="/onboarding/diet">Después lo veo</SkipLink>
        <Button type="submit" size="lg" loading={pending} iconRight={<ArrowRightIcon className="size-4" />}>
          Seguir
        </Button>
      </div>
    </form>
  );
}

// --- 4. Dieta --------------------------------------------------------------

export function DietForm({
  dietTags,
  allergies,
}: {
  dietTags: string[];
  allergies: string[];
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveDietAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">¿Algo que no comes?</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Con esto la IA deja de proponerte cosas que ibas a ignorar. Puedes saltarlo.
        </p>
      </div>

      <ChipListField
        name="diet_tags"
        label="Cómo comes"
        suggestions={DIET_SUGGESTIONS}
        initial={dietTags}
      />

      <ChipListField
        name="allergies"
        label="Alergias"
        hint="Esto nunca te lo va a sugerir."
        suggestions={ALLERGY_SUGGESTIONS}
        initial={allergies}
      />

      <StepError state={state} />

      <div className="flex items-center justify-between gap-3">
        <SkipLink href="/onboarding/whatsapp">Saltar</SkipLink>
        <Button type="submit" size="lg" loading={pending} iconRight={<ArrowRightIcon className="size-4" />}>
          Seguir
        </Button>
      </div>
    </form>
  );
}

// --- 5. WhatsApp -----------------------------------------------------------

export function WhatsappForm({ initial }: { initial: string | null }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    saveWhatsappAction,
    IDLE,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          ¿Agregamos cosas por WhatsApp?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Mandas «falta leche» al número de la casa y aparece en el carrito. Modo demostración: no
          se envía nada a tu número.
        </p>
      </div>

      <Input
        name="whatsapp_phone"
        label="Tu número"
        type="tel"
        defaultValue={initial ?? ""}
        placeholder="+51 999 888 777"
        inputSize="lg"
        autoComplete="tel"
      />

      <StepError state={state} />

      <div className="flex items-center justify-between gap-3">
        <SkipLink href="/onboarding/done">Saltar</SkipLink>
        <Button type="submit" size="lg" loading={pending} iconRight={<ArrowRightIcon className="size-4" />}>
          Vincular
        </Button>
      </div>
    </form>
  );
}

// --- 6. Listo --------------------------------------------------------------

export function FirstItemForm({
  productId,
  productName,
}: {
  productId: string | null;
  productName: string | null;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    addFirstItemAction,
    IDLE,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      <Button type="submit" size="lg" fullWidth loading={pending} iconRight={<ArrowRightIcon className="size-4" />}>
        {productId && productName ? `Agregar ${productName} y ver el carrito` : "Ir al carrito"}
      </Button>

      <StepError state={state} />

      {productId ? <SkipLink href="/app/cart">Ir al carrito vacío</SkipLink> : null}
    </form>
  );
}
