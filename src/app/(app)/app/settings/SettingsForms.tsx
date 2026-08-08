"use client";

import { useActionState, useEffect, useState } from "react";

import { ChipListField } from "@/components/shell/ChipListField";
import { ALLERGY_SUGGESTIONS, DIET_SUGGESTIONS } from "@/components/shell/preferences";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Toggle,
} from "@/components/ui";

import { saveHouseholdSettings, savePreferences } from "./actions";
import { IDLE_STATE, type SettingsState } from "./state";

// --- Casa ------------------------------------------------------------------

export function HouseholdSettingsForm({
  name,
  monthlyBudget,
  currency,
}: {
  name: string;
  monthlyBudget: number;
  currency: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveHouseholdSettings,
    IDLE_STATE,
  );

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle subtitle="Lo que ve todo el mundo en la casa.">La casa</CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          <Input
            name="name"
            label="Nombre de la casa"
            defaultValue={name}
            required
            maxLength={60}
            hint="Sale arriba a la izquierda y en las invitaciones."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="monthly_budget"
              label="Presupuesto del mes"
              type="number"
              min={0}
              step={10}
              defaultValue={monthlyBudget}
              prefix="S/"
              hint="La IA avisa cuando la proyección se pasa de acá."
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Moneda</span>
              <select
                name="currency"
                defaultValue={currency}
                className={cn(
                  "h-10 rounded-control border border-border-strong bg-surface px-3 text-sm text-ink",
                  "focus:border-brand-600 focus:ring-2 focus:ring-brand-600/35 focus:outline-none",
                )}
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </label>
          </div>

          <FormFeedback state={state} />
        </CardBody>

        <CardFooter>
          <Button type="submit" loading={pending}>
            Guardar
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// --- Persona ---------------------------------------------------------------

export function PreferencesForm({
  dietTags,
  allergies,
  whatsapp,
}: {
  dietTags: string[];
  allergies: string[];
  whatsapp: string | null;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    savePreferences,
    IDLE_STATE,
  );

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle subtitle="Solo tuyo. La IA lo usa para no sugerirte lo que no comes.">
            Tus preferencias
          </CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-5">
          <ChipListField
            name="diet_tags"
            label="Cómo comes"
            hint="Toca una sugerencia o escribe la tuya."
            suggestions={DIET_SUGGESTIONS}
            initial={dietTags}
          />

          <ChipListField
            name="allergies"
            label="Alergias"
            hint="Esto sí es en serio: la IA nunca te va a proponer algo con esto."
            suggestions={ALLERGY_SUGGESTIONS}
            initial={allergies}
          />

          <Input
            name="whatsapp_phone"
            label="WhatsApp"
            type="tel"
            defaultValue={whatsapp ?? ""}
            placeholder="+51 999 888 777"
            hint="Para agregar cosas al carrito escribiendo por WhatsApp (modo demo)."
          />

          <FormFeedback state={state} />
        </CardBody>

        <CardFooter>
          <Button type="submit" loading={pending}>
            Guardar
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// --- Avisos ----------------------------------------------------------------

type NoticePrefs = { budget: boolean; roomies: boolean; ai: boolean };

const STORAGE_KEY = "quecompro:avisos";
const DEFAULT_PREFS: NoticePrefs = { budget: true, roomies: true, ai: true };

/**
 * Preferencias de avisos.
 *
 * Van al navegador y no a la base: el esquema no tiene columna para esto y
 * prefiero un ajuste honesto ("en este dispositivo") antes que un interruptor
 * bonito que no guarda nada.
 */
export function NoticeSettings() {
  const [prefs, setPrefs] = useState<NoticePrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const value = parsed as Partial<NoticePrefs>;
          setPrefs({
            budget: value.budget ?? DEFAULT_PREFS.budget,
            roomies: value.roomies ?? DEFAULT_PREFS.roomies,
            ai: value.ai ?? DEFAULT_PREFS.ai,
          });
        }
      }
    } catch {
      // Un localStorage bloqueado no puede tumbar los ajustes.
    }
    setReady(true);
  }, []);

  function update(patch: Partial<NoticePrefs>) {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ídem.
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Se guardan en este navegador.">Avisos</CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        <Toggle
          checked={prefs.budget}
          disabled={!ready}
          onChange={(checked) => update({ budget: checked })}
          label="Alertas de presupuesto"
          description="Cuando la proyección del mes se pasa del techo."
        />
        <Toggle
          checked={prefs.roomies}
          disabled={!ready}
          onChange={(checked) => update({ roomies: checked })}
          label="Movimientos de la casa"
          description="Cuando alguien agrega o quita algo del carrito."
        />
        <Toggle
          checked={prefs.ai}
          disabled={!ready}
          onChange={(checked) => update({ ai: checked })}
          label="Sugerencias de la IA"
          description="Cambios más baratos y recetas con lo que ya tienes."
        />
      </CardBody>
    </Card>
  );
}

// --- Común -----------------------------------------------------------------

function FormFeedback({ state }: { state: SettingsState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      role="status"
      className={cn(
        "text-sm font-medium",
        state.status === "ok" ? "text-brand-700" : "text-danger",
      )}
    >
      {state.message}
    </p>
  );
}
