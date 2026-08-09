"use client";

import { useChannel } from "@portalsdk/react";
import type { ChannelStatus, Message } from "@portalsdk/core";
import { useEffect, useRef, useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";

import {
  AgentComposer,
  InlineCitations,
  ReasoningPanel,
  StreamingText,
  WebSearchSources,
  type Citation,
} from "@/components/ai";
import { formatTime } from "@/components/shell/format";
import { ClockIcon, FlameIcon, SparkIcon } from "@/components/shell/icons";
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

/**
 * Aviso suave según el estado del socket. El chat no bloquea nunca: tu mensaje
 * va al hilo (canal) y al asistente (HTTP) pase lo que pase; esto solo avisa que
 * lo de los demás puede tardar o no verse en vivo. `null` = no molestar.
 */
function connectionNotice(status: ChannelStatus): string | null {
  switch (status) {
    case "degraded-http":
    case "reconnecting":
      return "Conexión inestable: puedes seguir escribiendo, los mensajes de los demás pueden tardar.";
    case "blocked":
      return "Sin tiempo real. Puedes seguir escribiendo: tu mensaje se guarda y el asistente responde igual, pero lo de los demás no se verá en vivo hasta recargar.";
    default:
      return null;
  }
}

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

  const notice = connectionNotice(status);

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
  const thinkingStage =
    thinkingMessage && thinkingMessage.content.type === "assistant-thinking"
      ? thinkingMessage.content.stage
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
      {notice ? (
        <p className="rounded-control border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          {notice}
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

        {thinkingHint ? <ThinkingBubble hint={thinkingHint} stage={thinkingStage} /> : null}
        {!thinkingHint && sending ? (
          <ThinkingBubble hint="Enviando tu consulta…" stage="context" />
        ) : null}

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

      <AgentComposer
        value={draft}
        onChange={setDraft}
        onTyping={sendTyping}
        pending={sending}
        onSubmit={() => void submit(draft)}
      />
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
    const sources: Citation[] = (event.actions ?? []).flatMap((action) =>
      action.kind === "price-check"
        ? action.quotes.flatMap((quote) =>
            quote.url
              ? [{ label: quote.store, href: quote.url, detail: `S/ ${quote.price.toFixed(2)}` }]
              : [],
          )
        : [],
    );
    const visibleActions = (event.actions ?? []).filter((action) => action.kind !== "price-check");
    return (
      <div className="flex items-start gap-2.5">
        <AssistantAvatar />
        <div className="flex min-w-0 max-w-[92%] flex-col gap-1.5 sm:max-w-[85%]">
          <p className="text-xs text-ink-faint">Despensero · {at}</p>
          <div className="animate-rise rounded-card border border-border-subtle bg-surface px-3.5 py-3 shadow-sm sm:px-4">
            <WebSearchSources sources={sources} />
            <StreamingText text={event.text} />
            <InlineCitations sources={sources} />
            {visibleActions.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {visibleActions.map((action, index) => (
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

function ThinkingBubble({
  hint,
  stage = "answer",
}: {
  hint: string;
  stage?: "context" | "sources" | "answer";
}) {
  const stageLabel = {
    context: "Entendiendo tu pedido",
    sources: "Verificando fuentes",
    answer: "Preparando respuesta",
  }[stage];

  return (
    <div className="flex items-start gap-2.5" role="status" aria-live="polite">
      <AssistantAvatar />
      <ReasoningPanel label={stageLabel} hint={hint} />
    </div>
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
    case "price-check":
      return (
        <div className="w-full min-w-[16rem] rounded-control border border-border-subtle bg-white p-2.5">
          <p className="mb-2 text-xs font-semibold text-ink">Precios y enlaces de tienda</p>
          <div className="flex flex-wrap gap-1.5">
            {action.quotes.length > 0 ? (
              action.quotes.map((quote) => (
                quote.url ? (
                  <a
                    key={`${quote.store}-${quote.price}`}
                    href={quote.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
                  >
                    {quote.store} <Money value={quote.price} />
                    <IconExternalLink aria-hidden="true" className="size-3" />
                  </a>
                ) : (
                  <Chip key={`${quote.store}-${quote.price}`} size="sm" tone="neutral">
                    {quote.store} <Money value={quote.price} className="ml-1" />
                  </Chip>
                )
              ))
            ) : (
              <span className="text-xs text-ink-muted">No hubo precios verificables ahora.</span>
            )}
          </div>
        </div>
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
