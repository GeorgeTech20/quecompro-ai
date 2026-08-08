import "server-only";

import { Portal, PortalError, type ChannelHandle } from "@portalsdk/core";
import jwt from "jsonwebtoken";

import { channels, type CartEvent, type ChatEvent, type InboxEvent } from "./channels";

/**
 * Publicación en canales Portal **desde el servidor**.
 *
 * El truco de la hackathon: la IA no le contesta solo a quien preguntó, publica
 * en el canal como un participante más. Por eso el servidor necesita su propia
 * identidad ("assistant") y su propio socket.
 *
 * Node 26 trae `WebSocket` global, así que `@portalsdk/core` (que corre sobre
 * partysocket) funciona igual en servidor que en navegador — sin polyfill.
 */

// --- Tipado de canal → evento --------------------------------------------
// Los ids los construye `channels.*`; estos template types evitan publicar un
// ChatEvent en cart:update por error.
type CartUpdateChannel = `cart:update:${string}`;
type CartChatChannel = `cart:chat:${string}`;
type UserInboxChannel = `user:${string}`;
type WhatsappChannel = `whatsapp:bridge:${string}`;

type AnyEvent = CartEvent | ChatEvent | InboxEvent;

export type PublishOptions = {
  /** Señales transitorias (spinners, "pensando"): no ensucian el historial. */
  ephemeral?: boolean;
};

export type PublishResult =
  | { ok: true; id: string; timestamp: number }
  | { ok: false; reason: string };

// --- Cliente de servidor (singleton) --------------------------------------

let portal: Portal | undefined;
/** Una vez que Portal rechaza la key no tiene sentido reintentar en cada request. */
let disabled = false;
let cachedToken: { value: string; expiresAt: number } | undefined;

const TOKEN_TTL_SECONDS = 3600;
/** Ninguna API route puede quedarse colgada esperando al socket. */
const SEND_TIMEOUT_MS = 4000;

function portalApiKey(): string | undefined {
  // .env.example reserva PORTAL_SECRET_KEY para publicar desde API routes; si no
  // está, la publishable + el token del bot alcanzan.
  return process.env.PORTAL_SECRET_KEY || process.env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY || undefined;
}

/**
 * Token de sesión del bot, firmado con el mismo secreto que usa /api/portal-token
 * para los humanos. `sub: "assistant"` es la identidad que verán las dos pantallas.
 */
function botToken(): string {
  const secret = process.env.PORTAL_TOKEN_SECRET;
  if (!secret) throw new Error("PORTAL_TOKEN_SECRET ausente");

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - now > 60) return cachedToken.value;

  const value = jwt.sign(
    { sub: "assistant", name: "Despensero", bot: true },
    secret,
    { algorithm: "HS256", expiresIn: TOKEN_TTL_SECONDS },
  );
  cachedToken = { value, expiresAt: now + TOKEN_TTL_SECONDS };
  return value;
}

function serverPortal(): Portal | undefined {
  if (disabled) return undefined;
  if (portal) return portal;

  const apiKey = portalApiKey();
  if (!apiKey || !process.env.PORTAL_TOKEN_SECRET) {
    disabled = true;
    console.warn("[server-publish] Portal sin configurar; la IA responde solo por HTTP.");
    return undefined;
  }

  portal = new Portal({ apiKey, token: async () => botToken() });
  return portal;
}

/**
 * Los handles se reutilizan: `acquire()` abre la conexión y el refcount del SDK
 * la mantiene viva. Soltarlo en cada publicación reconectaría por cada item.
 */
const handles = new Map<string, ChannelHandle<AnyEvent>>();

function handleFor(client: Portal, channelId: string): ChannelHandle<AnyEvent> {
  const existing = handles.get(channelId);
  if (existing) return existing;

  const handle = client.channel<AnyEvent>(channelId, { history: "none" });
  handle.acquire();
  handles.set(channelId, handle);
  return handle;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

// --- API pública ----------------------------------------------------------

export function publishToChannel(
  channelId: CartUpdateChannel,
  content: CartEvent,
  options?: PublishOptions,
): Promise<PublishResult>;
export function publishToChannel(
  channelId: CartChatChannel,
  content: ChatEvent,
  options?: PublishOptions,
): Promise<PublishResult>;
export function publishToChannel(
  channelId: UserInboxChannel,
  content: InboxEvent,
  options?: PublishOptions,
): Promise<PublishResult>;
export function publishToChannel(
  channelId: WhatsappChannel,
  content: CartEvent,
  options?: PublishOptions,
): Promise<PublishResult>;
/**
 * Publica en el canal y **nunca lanza**: si Portal no está configurado, si el
 * token falla o si el socket se cae, devuelve `{ ok: false }` y la API route
 * sigue su curso. El payload viaja igual en la respuesta HTTP, así que el
 * cliente puede republicarlo él mismo como respaldo.
 */
export async function publishToChannel(
  channelId: string,
  content: AnyEvent,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const client = serverPortal();
  if (!client) return { ok: false, reason: "portal-not-configured" };

  try {
    const handle = handleFor(client, channelId);
    const ack = await withTimeout(
      options.ephemeral
        ? handle.send({ ephemeral: true, content })
        : handle.send({ content }),
      SEND_TIMEOUT_MS,
    );
    return { ok: true, id: ack.id, timestamp: ack.timestamp };
  } catch (error) {
    // Key inválida o baneo: es terminal, apagamos el publisher para no castigar
    // cada request con un round-trip que ya sabemos que falla.
    if (error instanceof PortalError && (error.code === "invalid_api_key" || error.code === "blocked")) {
      disabled = true;
      handles.clear();
    }
    const reason = error instanceof Error ? error.message : "unknown";
    console.warn(`[server-publish] no se pudo publicar en ${channelId}: ${reason}`);
    return { ok: false, reason };
  }
}

/** Marca de actividad ("pensando", "escribiendo") para el canal de chat. */
export function publishActivity(householdId: string, kind: string): void {
  const client = serverPortal();
  if (!client) return;
  try {
    handleFor(client, channels.cartChat(householdId)).sendActivity(kind);
  } catch {
    // La actividad es decorativa: si falla, no pasa nada.
  }
}

// --- Atajos por canal -----------------------------------------------------
// `channels.*` devuelve `string` (TS no infiere template literal types en el
// cuerpo de una función), así que el estrechamiento se hace aquí, una sola vez,
// y el resto del código publica con el evento correcto por construcción.

export function publishCartEvent(
  householdId: string,
  content: CartEvent,
  options?: PublishOptions,
): Promise<PublishResult> {
  return publishToChannel(channels.cartUpdate(householdId) as CartUpdateChannel, content, options);
}

export function publishChatEvent(
  householdId: string,
  content: ChatEvent,
  options?: PublishOptions,
): Promise<PublishResult> {
  return publishToChannel(channels.cartChat(householdId) as CartChatChannel, content, options);
}

export function publishInboxEvent(
  userId: string,
  content: InboxEvent,
  options?: PublishOptions,
): Promise<PublishResult> {
  return publishToChannel(channels.userInbox(userId) as UserInboxChannel, content, options);
}
