"use client";

import { IconLogout, IconUserMinus } from "@tabler/icons-react";
import { useChannel } from "@portalsdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { CopyIcon, UsersIcon, WhatsappIcon } from "@/components/shell/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  cn,
  EmptyState,
  Input,
  LiveDot,
  Modal,
  useToast,
} from "@/components/ui";
import { channels, type CartEvent } from "@/lib/realtime/channels";

import { ensureInviteLink, leaveCurrentHousehold, removeRoomie } from "./actions";

export type RoomieView = {
  /** Id del perfil (uuid). */
  id: string;
  /** Id de Clerk: es el que llega por presencia. */
  clerkId: string | null;
  name: string;
  avatarUrl: string | null;
  role: "owner" | "member";
  whatsapp: string | null;
  joinedAt: string;
};

/**
 * Lista de roomies con presencia en vivo.
 *
 * La presencia llega del canal `cart:presence:{casa}` y viene identificada por
 * el id de Clerk (el `sub` del token de Portal), no por el uuid del perfil: por
 * eso el cruce se hace contra `clerkId`.
 */
export function RoomiesList({
  householdId,
  householdName,
  members,
  currentClerkId,
  displayName,
  avatarUrl,
  initialToken,
}: {
  householdId: string;
  householdName: string;
  members: RoomieView[];
  currentClerkId: string;
  displayName: string;
  avatarUrl: string | null;
  initialToken: string | null;
}) {
  const { presence } = useChannel<CartEvent>({
    channelId: channels.cartPresence(householdId),
    history: "none",
    metadata: { name: displayName, avatarUrl },
  });

  // `presence` es una unión: en modo agregado solo hay un contador, sin ids.
  const onlineIds =
    presence?.kind === "detailed"
      ? new Set(presence.participants.map((participant) => participant.id))
      : null;
  const onlineCount = presence?.count ?? 0;

  const router = useRouter();
  const { toast } = useToast();
  const [toRemove, setToRemove] = useState<RoomieView | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const you = members.find((member) => member.clerkId === currentClerkId);
  const youAreOwner = you?.role === "owner";
  const others = members.filter((member) => member.clerkId !== currentClerkId);

  // Quien creó la casa no puede irse mientras quede gente: se quedaría sin
  // dueño. El servidor lo vuelve a comprobar; esto solo evita ofrecerlo.
  const canLeave = Boolean(you) && (!youAreOwner || others.length === 0);

  function confirmRemove(member: RoomieView) {
    startTransition(async () => {
      const result = await removeRoomie(member.id);
      if (result.ok) {
        setToRemove(null);
        toast({ title: `${member.name} ya no está en la casa`, tone: "success" });
        router.refresh();
      } else {
        toast({ title: "No se pudo sacar", description: result.error, tone: "critical" });
      }
    });
  }

  function confirmLeave() {
    startTransition(async () => {
      const result = await leaveCurrentHousehold();
      if (result.ok) {
        setLeaveOpen(false);
        // A `/app` a propósito y no a esta pantalla: la casa de la que acabas
        // de salir ya no se puede leer.
        router.replace("/app");
        router.refresh();
      } else {
        toast({ title: "No se pudo salir", description: result.error, tone: "critical" });
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader
          actions={
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <LiveDot active={onlineCount > 0} label="Presencia en vivo" />
              {onlineCount > 0 ? `${onlineCount} mirando` : "Nadie conectado"}
            </span>
          }
        >
          <CardTitle subtitle={`Quiénes viven en ${householdName}.`}>
            {members.length} {members.length === 1 ? "persona" : "personas"}
          </CardTitle>
        </CardHeader>

        <CardBody className="p-0">
          {members.length === 0 ? (
            <EmptyState
              size="sm"
              illustration={<UsersIcon className="size-6" />}
              title="Estás solo en esta casa"
              description="Invita a tu pareja o a tus roomies: el carrito se llena entre todos y se ve al toque en las dos pantallas."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {members.map((member) => {
                const online = onlineIds ? Boolean(member.clerkId && onlineIds.has(member.clerkId)) : false;
                const isYou = member.clerkId === currentClerkId;

                // Sacar a alguien solo lo puede quien creó la casa, nunca a
                // otro dueño y nunca a sí mismo — para eso está "salir".
                const removable = youAreOwner && !isYou && member.role !== "owner";

                return (
                  <li
                    key={member.id}
                    className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-sunken/40 sm:flex-nowrap sm:px-5"
                  >
                    <Avatar
                      size="md"
                      name={member.name}
                      src={member.avatarUrl}
                      id={member.clerkId ?? member.id}
                      live={online}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                        {member.name}
                        {isYou ? <span className="text-xs text-ink-faint">(tú)</span> : null}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {online ? "Mirando el carrito ahora" : "Desconectado"}
                        {member.whatsapp ? " · WhatsApp vinculado" : " · Sin WhatsApp"}
                      </p>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-end">
                      {member.whatsapp ? (
                        <WhatsappIcon
                          className="size-4 shrink-0 text-brand-600"
                          title="WhatsApp vinculado"
                        />
                      ) : null}

                      <Badge tone={member.role === "owner" ? "brand" : "neutral"} size="sm">
                        {member.role === "owner" ? "Dueña/o" : "Roomie"}
                      </Badge>

                      {removable ? (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setToRemove(member)}
                          iconLeft={<IconUserMinus className="size-4" />}
                          aria-label={`Sacar a ${member.name} de la casa`}
                          // En un dedo no hay hover, así que en celular el
                          // botón está siempre visible; en escritorio aparece
                          // al acercarse para no ensuciar la lista.
                          className="text-ink-faint hover:text-danger sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                        >
                          <span className="sr-only sm:not-sr-only">Sacar</span>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <InviteCard householdName={householdName} initialToken={initialToken} />

      <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Salir de {householdName}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {canLeave
              ? "Dejas de ver el carrito y el historial de esta casa. Lo ya comprado se queda con la casa."
              : "Creaste esta casa. Saca primero a los demás y después puedes salir."}
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          disabled={!canLeave || pending}
          onClick={() => setLeaveOpen(true)}
          iconLeft={<IconLogout className="size-4" />}
          className="w-full sm:w-auto"
        >
          Salir de la casa
        </Button>
      </Card>

      <Modal
        open={toRemove !== null}
        onClose={() => (pending ? undefined : setToRemove(null))}
        size="sm"
        title={toRemove ? `¿Sacar a ${toRemove.name}?` : ""}
        description="Deja de ver el carrito y el historial de la casa al instante. Puedes volver a invitarla con el enlace cuando quieras."
        footer={
          <>
            <Button variant="secondary" onClick={() => setToRemove(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => toRemove && confirmRemove(toRemove)}
              disabled={pending}
            >
              {pending ? "Sacando…" : "Sacar de la casa"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Lo que {toRemove?.name ?? "esa persona"} agregó o compró se queda en el historial: es de
          la casa, no de quien lo cargó.
        </p>
      </Modal>

      <Modal
        open={leaveOpen}
        onClose={() => (pending ? undefined : setLeaveOpen(false))}
        size="sm"
        title={`¿Salir de ${householdName}?`}
        description="Pierdes el acceso al carrito compartido y al historial de esta casa."
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeaveOpen(false)} disabled={pending}>
              Quedarme
            </Button>
            <Button variant="danger" onClick={confirmLeave} disabled={pending}>
              {pending ? "Saliendo…" : "Salir de la casa"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Para volver a entrar necesitas que alguien de adentro te pase el enlace de invitación.
        </p>
      </Modal>
    </>
  );
}

// --- Invitación ------------------------------------------------------------

function InviteCard({
  householdName,
  initialToken,
}: {
  householdName: string;
  initialToken: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [origin, setOrigin] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // El origen real solo se conoce en el navegador; en el servidor quedaría
  // hardcodeado y el link de la demo apuntaría a otro sitio.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = token && origin ? `${origin}/invite/${token}` : "";
  const whatsappText = `Oye, entra a nuestra lista de compras de ${householdName} en QuéComproo 👉 ${link}`;

  function openModal() {
    setOpen(true);
    if (token) return;

    startTransition(async () => {
      const result = await ensureInviteLink();
      if (result.ok) setToken(result.token);
      else toast({ title: "No se pudo crear el enlace", description: result.error, tone: "critical" });
    });
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, tone: "success" });
    } catch {
      toast({
        title: "No pudimos copiar",
        description: "Selecciona el texto y cópialo a mano.",
        tone: "warning",
      });
    }
  }

  return (
    <>
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Invitar a alguien más</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Un enlace y listo. Quien entre ve el mismo carrito, en vivo.
          </p>
        </div>
        <Button
          onClick={openModal}
          iconLeft={<UsersIcon className="size-4" />}
          className="w-full sm:w-auto"
          size="lg"
        >
          Invitar
        </Button>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Invitar a ${householdName}`}
        description="Comparte el enlace. Quien lo abra entra directo al carrito de la casa."
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {pending && !token ? (
            <p className="text-sm text-ink-muted">Creando el enlace…</p>
          ) : !token ? (
            <p className="text-sm text-danger">
              Todavía no hay enlace. Cierra y vuelve a intentar en un momento.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  label="Enlace de invitación"
                  value={link}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                  wrapperClassName="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={() => void copy(link, "Enlace")}
                  iconLeft={<CopyIcon className="size-4" />}
                  className="w-full sm:w-auto"
                >
                  Copiar
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink">Listo para WhatsApp</p>
                <p
                  className={cn(
                    "rounded-control border border-border-subtle bg-surface-sunken",
                    "px-3 py-2 text-sm leading-relaxed text-ink",
                  )}
                >
                  {whatsappText}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void copy(whatsappText, "Mensaje")}
                    iconLeft={<CopyIcon className="size-4" />}
                  >
                    Copiar mensaje
                  </Button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-control bg-brand-600 px-4",
                      "text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700",
                      "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none",
                    )}
                  >
                    <WhatsappIcon className="size-4" />
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
