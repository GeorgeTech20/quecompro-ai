"use client";

import { useChannel } from "@portalsdk/react";
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

import { ensureInviteLink } from "./actions";

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

                return (
                  <li
                    key={member.id}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-sunken/40"
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

                    {member.whatsapp ? (
                      <WhatsappIcon
                        className="size-4 shrink-0 text-brand-600"
                        title="WhatsApp vinculado"
                      />
                    ) : null}

                    <Badge tone={member.role === "owner" ? "brand" : "neutral"} size="sm">
                      {member.role === "owner" ? "Dueña/o" : "Roomie"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <InviteCard householdName={householdName} initialToken={initialToken} />
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
