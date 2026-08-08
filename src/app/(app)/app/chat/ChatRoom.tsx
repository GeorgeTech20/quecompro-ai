"use client";

import { useChannel } from "@portalsdk/react";
import type { Message } from "@portalsdk/core";
import { useEffect, useRef, useState } from "react";

import { formatTime } from "@/components/shell/format";
import { ClockIcon, FlameIcon, SendIcon, SparkIcon } from "@/components/shell/icons";
import { LinkButton } from "@/components/shell/LinkButton";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  cn,
  EmptyState,
  Money,
  Textarea,
} from "@/components/ui";
import { channels, type AssistantAction, type ChatEvent, type RecipeSuggestion } from "@/lib/realtime/channels";

/**
 * El hilo compartido de la casa.
 *
 * No es "un chatbot en una pestaña": el canal es uno solo, así que lo que
 * escribe tu roomie y lo que contesta el asistente aparecen en la misma
 * conversación para todos. Por eso el mensaje propio se publica en el canal
 * antes de llamar a la API — la otra pantalla no espera a que el modelo piense.
 */

const SUGGESTIONS = [
  "¿Qué cocino con lo que tengo en el carrito?",
  "Arma un plan para la semana con S/ 200",
  "¿Dónde está más barato el pollo?",
  "¿Cómo voy con el presupuesto del mes?",
];

export function ChatRoom({
  householdId,
  userId,
  displayName,
  avatarUrl,
}: {
  householdId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, send, sendTyping, typing, status, me } = useChannel<ChatEvent>({
    channelId: channels.cartChat(householdId),
    history: 50,
    metadata: { name: displayName, avatarUrl },
  });

  // El hilo siempre se lee desde abajo, como cualquier chat.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length]);

  const visible = messages.filter((message) => message.content.type !== "assistant-thinking");

  // "Pensando…" se muestra solo si es más nuevo que la última respuesta: si no,
  // el indicador quedaría colgado para siempre cuando el modelo ya contestó.
  const lastReply = messages.findLastIndex(
    (message) =>
      message.content.type === "assistant-message" ||
      message.content.type === "recipe-suggestion",
  );
  const lastThinking = messages.findLastIndex(
    (message) => message.content.type === "assistant-thinking",
  );
  const thinkingMessage = lastThinking > lastReply ? messages[lastThinking] : undefined;
  const thinkingHint =
    thinkingMessage && thinkingMessage.content.type === "assistant-thinking"
      ? thinkingMessage.content.hint
      : undefined;

  async function submit(text: string) {
    const clean = text.trim();
    if (clean.length === 0 || sending) return;

    setSending(true);
    setFailed(null);
    setDraft("");

    // 1) Al canal, para que los demás lo vean ya mismo.
    try {
      await send({
        content: {
          type: "user-message",
          text: clean,
          author: { id: userId, name: displayName, avatarUrl },
        },
      });
    } catch {
      setFailed("Tu mensaje no llegó al canal, pero el asistente sí lo recibió.");
    }

    // 2) Al asistente. La respuesta vuelve por el canal, no por este fetch.
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId, message: clean }),
      });
      if (!response.ok) {
        setFailed("El asistente no pudo responder. Inténtalo otra vez en un momento.");
      }
    } catch {
      setFailed("Sin conexión con el asistente. Tu mensaje quedó en el hilo igual.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {status === "degraded-http" || status === "reconnecting" ? (
        <p className="rounded-control border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          Conexión inestable: puedes seguir escribiendo, los mensajes de los demás pueden tardar.
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
        {visible.length === 0 ? (
          <Card padding="md">
            <EmptyState
              illustration={<SparkIcon className="size-7" />}
              title="Pregúntale lo que le preguntarías a alguien que cocina"
              description="El asistente ve tu carrito, tus precios y lo que llevas gastado del mes. Y todos en la casa leen la misma conversación."
            />
          </Card>
        ) : (
          visible.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              own={me?.id === message.sender.id}
              onAsk={submit}
            />
          ))
        )}

        {thinkingHint ? <ThinkingBubble hint={thinkingHint} /> : null}
        {!thinkingHint && sending ? <ThinkingBubble hint="Mandando tu mensaje…" /> : null}

        <div ref={bottomRef} />
      </div>

      {typing.length > 0 ? (
        <p className="text-xs text-ink-faint">
          {typing.length === 1 ? "Alguien está escribiendo…" : "Varios están escribiendo…"}
        </p>
      ) : null}

      {failed ? <p className="text-xs font-medium text-danger">{failed}</p> : null}

      {visible.length === 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void submit(suggestion)}
              className={cn(
                "shrink-0 rounded-full border border-border-subtle bg-surface-sunken px-3 py-1.5",
                "text-[13px] text-ink transition-colors duration-150 hover:border-border-strong",
                "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2 border-t border-border-subtle bg-canvas pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            sendTyping();
          }}
          onKeyDown={(event) => {
            // Enter manda, Shift+Enter salta de línea: como cualquier chat.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit(draft);
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Escribe aquí… todos en la casa lo van a ver"
          aria-label="Mensaje para el asistente y para la casa"
          wrapperClassName="flex-1"
          className="max-h-32"
        />
        <Button
          type="submit"
          loading={sending}
          disabled={draft.trim().length === 0}
          iconLeft={<SendIcon className="size-4" />}
          aria-label="Enviar mensaje"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}

// --- Burbujas --------------------------------------------------------------

function ChatBubble({
  message,
  own,
  onAsk,
}: {
  message: Message<ChatEvent>;
  own: boolean;
  onAsk: (text: string) => Promise<void>;
}) {
  const event = message.content;
  const at = formatTime(new Date(message.timestamp));

  if (event.type === "user-message") {
    return (
      <div className={cn("flex items-start gap-2.5", own && "flex-row-reverse")}>
        <Avatar size="sm" name={event.author.name} src={event.author.avatarUrl} id={event.author.id} />
        <div className={cn("flex min-w-0 max-w-[80%] flex-col gap-1", own && "items-end")}>
          <p className="text-xs text-ink-faint">
            {own ? "Tú" : event.author.name} · {at}
          </p>
          <p
            className={cn(
              "animate-rise rounded-card px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
              own
                ? "bg-brand-600 text-white"
                : "border border-border-subtle bg-surface text-ink",
            )}
          >
            {event.text}
          </p>
        </div>
      </div>
    );
  }

  if (event.type === "assistant-message") {
    return (
      <div className="flex items-start gap-2.5">
        <AssistantAvatar />
        <div className="flex min-w-0 max-w-[85%] flex-col gap-1.5">
          <p className="text-xs text-ink-faint">Despensero · {at}</p>
          <div className="animate-rise rounded-card border border-brand-200 bg-brand-50 px-3.5 py-2.5 dark:border-brand-800 dark:bg-brand-900/30">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{event.text}</p>
            {event.actions && event.actions.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {event.actions.map((action, index) => (
                  <li key={`${action.kind}-${index}`}>
                    <ActionChip action={action} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === "recipe-suggestion") {
    return (
      <div className="flex items-start gap-2.5">
        <AssistantAvatar />
        <div className="min-w-0 max-w-[85%] flex-1">
          <p className="mb-1.5 text-xs text-ink-faint">Despensero · {at}</p>
          <RecipeCard recipe={event.recipe} onAsk={onAsk} />
        </div>
      </div>
    );
  }

  return null;
}

function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-700 text-white"
    >
      <SparkIcon className="size-4.5" />
    </span>
  );
}

function ThinkingBubble({ hint }: { hint: string }) {
  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <AssistantAvatar />
      <span className="animate-rise inline-flex items-center gap-2 rounded-card border border-border-subtle bg-surface px-3.5 py-2 text-sm text-ink-muted">
        <span aria-hidden="true" className="flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="160ms" />
          <Dot delay="320ms" />
        </span>
        {hint}
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      style={{ animationDelay: delay }}
      className="animate-live-dot size-1.5 rounded-full bg-brand-500"
    />
  );
}

function ActionChip({ action }: { action: AssistantAction }) {
  switch (action.kind) {
    case "add-item":
      return (
        <Chip tone="brand" size="sm">
          Agregó {action.title} × {action.qty}
        </Chip>
      );
    case "swap-item":
      return (
        <Chip tone="accent" size="sm">
          Cambió por {action.toTitle} · ahorras <Money value={action.savings} />
        </Chip>
      );
    case "accept-recipe":
      return (
        <Chip tone="brand" size="sm">
          Receta guardada
        </Chip>
      );
    case "set-budget":
      return (
        <LinkButton href="/app/settings" size="sm" variant="secondary">
          Poner presupuesto en <Money value={action.monthly} round className="ml-1" />
        </LinkButton>
      );
  }
}

// --- Tarjeta de receta -----------------------------------------------------

function RecipeCard({
  recipe,
  onAsk,
}: {
  recipe: RecipeSuggestion;
  onAsk: (text: string) => Promise<void>;
}) {
  const missing = recipe.ingredients.filter((ingredient) => !ingredient.inCart);

  return (
    <Card padding="md" className="animate-rise flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{recipe.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" /> {recipe.timeMin} min
            </span>
            <span className="inline-flex items-center gap-1">
              <FlameIcon className="size-3.5" /> {recipe.kcalPerServing} kcal por porción
            </span>
            <span>{recipe.servings} porciones</span>
          </p>
        </div>
        <Badge tone={recipe.difficulty === "facil" ? "success" : "neutral"}>
          {recipe.difficulty === "facil"
            ? "Fácil"
            : recipe.difficulty === "media"
              ? "Media"
              : "Difícil"}
        </Badge>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.name}>
            <Chip size="sm" tone={ingredient.inCart ? "brand" : "neutral"}>
              {ingredient.inCart ? "✓ " : ""}
              {ingredient.name}
            </Chip>
          </li>
        ))}
      </ul>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none">
          <span className="group-open:hidden">Ver los {recipe.steps.length} pasos</span>
          <span className="hidden group-open:inline">Ocultar los pasos</span>
        </summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
          {recipe.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-faint">
          {missing.length === 0
            ? "Tienes todo lo que pide."
            : `Te faltan ${missing.length}: ${missing.map((item) => item.name).join(", ")}.`}
        </p>
        <CookThisButton recipe={recipe} missingCount={missing.length} onAsk={onAsk} />
      </div>
    </Card>
  );
}

/**
 * "Cocinar esto" no escribe en el carrito por su cuenta: le pide al asistente
 * que complete lo que falta. Así queda en el hilo, lo ven los dos, y el alta la
 * hace la misma ruta que ya sabe publicar en el canal.
 */
function CookThisButton({
  recipe,
  missingCount,
  onAsk,
}: {
  recipe: RecipeSuggestion;
  missingCount: number;
  onAsk: (text: string) => Promise<void>;
}) {
  const [sending, setSending] = useState(false);

  async function cook() {
    if (sending) return;
    setSending(true);
    try {
      await onAsk(
        missingCount > 0
          ? `Vamos a cocinar ${recipe.title}. Agrega al carrito los ingredientes que me faltan.`
          : `Vamos a cocinar ${recipe.title}. Pásame los pasos resumidos.`,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Button size="sm" loading={sending} onClick={() => void cook()}>
      Cocinar esto
    </Button>
  );
}
