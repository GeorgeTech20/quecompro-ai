"use client";

import type { Message } from "@portalsdk/core";
import { useChannel, useInbox } from "@portalsdk/react";
import Link from "next/link";

import { capitalize, formatDateLong, formatTime, isSameDay } from "@/components/shell/format";
import { BellIcon, CartIcon, SparkIcon, UsersIcon } from "@/components/shell/icons";
import { Badge, Button, Card, CardBody, cn, EmptyState } from "@/components/ui";
import { channels, type InboxEvent } from "@/lib/realtime/channels";

/**
 * Bandeja de avisos.
 *
 * Dos fuentes, a propósito:
 *  * `useInbox` para el contador global y el "marcar todo como leído", que es
 *    estado del usuario y no de una pantalla.
 *  * `useChannel` sobre `user:{id}` para el contenido, porque los avisos se
 *    publican como mensajes del canal personal y ahí es donde viven.
 */
export function NotificationsInbox({ userId }: { userId: string }) {
  const channelId = channels.userInbox(userId);

  const { messages, status, markAsRead } = useChannel<InboxEvent>({
    channelId,
    history: 50,
    readOn: "visible",
  });

  const { unseen, markAllRead } = useInbox<InboxEvent>({ channelId });

  const groups = groupByDay(messages);
  const pending = messages.filter((message) => message.unread).length + unseen;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {pending > 0
            ? `${pending} sin leer`
            : status === "ready"
              ? "Todo al día"
              : "Conectando con tus avisos…"}
        </p>

        <Button
          variant="secondary"
          size="sm"
          disabled={pending === 0}
          onClick={() => {
            markAllRead();
            markAsRead();
          }}
        >
          Marcar todo como leído
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card padding="md">
          <EmptyState
            illustration={<BellIcon className="size-7" />}
            title="Sin avisos por ahora"
            description="Acá te van a llegar las alertas de presupuesto, lo que agreguen tus roomies y lo que note la IA en el carrito."
          />
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2">
            <h2 className="px-1 text-xs font-semibold tracking-wide text-ink-faint uppercase">
              {group.label}
            </h2>

            <Card>
              <CardBody className="p-0">
                <ul className="divide-y divide-border-subtle">
                  {group.messages.map((message) => (
                    <li key={message.id}>
                      <NotificationRow message={message} />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}

const KIND_META: Record<
  InboxEvent["kind"],
  { icon: React.ReactNode; tone: "critical" | "success" | "brand" | "neutral"; label: string }
> = {
  budget: { icon: <BellIcon className="size-4" />, tone: "critical", label: "Presupuesto" },
  roomie: { icon: <UsersIcon className="size-4" />, tone: "success", label: "Roomie" },
  ai: { icon: <SparkIcon className="size-4" />, tone: "brand", label: "IA" },
  reminder: { icon: <CartIcon className="size-4" />, tone: "neutral", label: "Recordatorio" },
};

function NotificationRow({ message }: { message: Message<InboxEvent> }) {
  const event = message.content;
  const meta = KIND_META[event.kind] ?? KIND_META.reminder;
  const at = formatTime(new Date(message.timestamp));

  const body = (
    <div className={cn("flex items-start gap-3 px-5 py-3.5", message.unread && "bg-brand-50/60 dark:bg-brand-900/20")}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-muted">
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          {event.title}
          <Badge tone={meta.tone} size="sm">
            {meta.label}
          </Badge>
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{event.body}</p>
      </div>

      <span className="shrink-0 text-xs text-ink-faint tabular-nums">{at}</span>
    </div>
  );

  if (!event.href) return body;

  return (
    <Link
      href={event.href}
      className="block transition-colors duration-150 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}

// --- Agrupación por día ----------------------------------------------------

type DayGroup = { key: string; label: string; messages: Message<InboxEvent>[] };

function groupByDay(messages: readonly Message<InboxEvent>[]): DayGroup[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const buckets = new Map<string, Message<InboxEvent>[]>();

  // Del más nuevo al más viejo: una bandeja se lee de arriba hacia abajo.
  for (const message of [...messages].sort((a, b) => b.timestamp - a.timestamp)) {
    const date = new Date(message.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(message);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()].map(([key, group]) => {
    const date = new Date(group[0].timestamp);
    const label = isSameDay(date, now)
      ? "Hoy"
      : isSameDay(date, yesterday)
        ? "Ayer"
        : capitalize(formatDateLong(date));

    return { key, label, messages: group };
  });
}
