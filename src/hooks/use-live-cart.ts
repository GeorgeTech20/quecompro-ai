"use client";

import type { ChannelStatus, DetailedPresence, AggregatePresence } from "@portalsdk/core";
import { useChannel } from "@portalsdk/react";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  addItemAction,
  recordMarketPriceAction,
  removeItemAction,
  setQtyAction,
  setNoteAction,
  setPurchasedAction,
  swapItemAction,
  type AddItemInput,
  type RecordMarketPriceInput,
} from "@/app/(app)/app/cart/actions";
import { useToast } from "@/components/ui";
import { prepareImageUpload } from "@/lib/images/prepare-upload";
import {
  channels,
  type CartEvent,
  type CartItemPayload,
  type PriceQuote,
} from "@/lib/realtime/channels";

/**
 * El motor del carrito vivo.
 *
 * Tres fuentes escriben sobre el mismo estado: el snapshot del servidor, las
 * acciones optimistas de esta pestaña y los eventos que llegan por Portal. La
 * regla que las concilia es que **todos los eventos del canal son absolutos**
 * (nunca deltas) y que cada uno se puede aplicar N veces sin cambiar el
 * resultado. Con eso, una reconexión que reenvía las últimas 50 cosas no
 * duplica items ni retrocede cantidades.
 */

type AiVerdictEvent = Extract<CartEvent, { type: "ai-verdict" }>;

/** El veredicto de la IA sin el discriminante: así lo consume la UI. */
export type CartVerdict = Omit<AiVerdictEvent, "type">;

/** Item del snapshot inicial: trae los sellos de tiempo reales de la fila. */
export type LiveCartSeedItem = CartItemPayload & {
  /** ms de `created_at`. Ancla el guardia de `cart-cleared`. */
  createdAt: number;
  /** ms de `updated_at`. Evita que el backfill revierta una cantidad. */
  updatedAt: number;
  /** Clave canónica del catálogo; la necesita `/api/price-check`. */
  productKey?: string;
};

export type LiveCartStatus = ChannelStatus;

export type PurchaseFeedEntry = {
  /** id del item comprado; una entrada por item, la última acción gana. */
  itemId: string;
  title: string;
  /** ISO string. */
  at: string;
  by?: { id: string; name: string; avatarUrl?: string | null };
  photoUrl?: string;
};

export type UseLiveCartResult = {
  items: CartItemPayload[];
  /** Recalculado desde los items, siempre. Nunca se copia del evento. */
  total: number;
  itemCount: number;
  verdicts: Record<string, CartVerdict>;
  /** El último veredicto que llegó: es el que la tarjeta de IA muestra. */
  latestVerdictItemId: string | null;
  quotes: Record<string, PriceQuote[]>;
  /** Items con una verificación de precios en vuelo, en cualquier pantalla. */
  pricePending: Record<string, boolean>;
  purchasePending: Record<string, boolean>;
  /**
   * Última actividad de compra por item, en orden cronológico inverso: el
   * "chat de equipo" de quién compró qué, con foto cuando hay evidencia.
   */
  purchaseFeed: PurchaseFeedEntry[];
  /** El `total` del evento no cuadró con el nuestro: falta algo por llegar. */
  outOfSync: boolean;
  status: LiveCartStatus;
  presence: DetailedPresence | AggregatePresence | undefined;
  addItem: (input: AddItemDraft) => Promise<void>;
  removeItem: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  setNote: (itemId: string, note: string) => Promise<void>;
  setPurchased: (itemId: string, purchased: boolean, photo?: File) => Promise<void>;
  requestPrices: (itemId: string) => Promise<void>;
  recordMarketPrice: (input: Omit<RecordMarketPriceInput, "householdId">) => Promise<void>;
  swapItem: (itemId: string, cheaper: NonNullable<CartVerdict["cheaper"]>) => Promise<void>;
};

export type AddItemDraft = {
  productId?: string;
  title: string;
  price: number;
  qty?: number;
  unit?: string;
  store?: string;
  category?: string;
  productKey?: string;
};

// --- estado ---------------------------------------------------------------

type Stamps = {
  qty: Record<string, number>;
  add: Record<string, number>;
  verdict: Record<string, number>;
  quote: Record<string, number>;
};

type CartState = {
  items: CartItemPayload[];
  verdicts: Record<string, CartVerdict>;
  latestVerdictItemId: string | null;
  quotes: Record<string, PriceQuote[]>;
  pricePending: Record<string, boolean>;
  purchasePending: Record<string, boolean>;
  purchaseFeed: PurchaseFeedEntry[];
  productKeys: Record<string, string>;
  /** itemId → ms del borrado. Impide que un alta vieja resucite el item. */
  tombstones: Record<string, number>;
  clearedAt: number;
  stamps: Stamps;
  /** Último `total` que anunció el canal; solo sirve de pista. */
  hintedTotal: number | null;
};

type RemoteEvent = { content: CartEvent; at: number };

type CartAction =
  | { kind: "remote"; events: RemoteEvent[] }
  | { kind: "local-add"; item: CartItemPayload; productKey?: string; at: number }
  | { kind: "local-swap-id"; tempId: string; item: CartItemPayload; productKey?: string; at: number }
  | { kind: "local-drop"; itemId: string }
  | { kind: "local-restore"; item: CartItemPayload; index: number }
  | { kind: "local-qty"; itemId: string; qty: number; at: number }
  | { kind: "local-verdict"; verdict: CartVerdict; at: number }
  | { kind: "price-pending"; itemId: string; pending: boolean }
  | { kind: "local-set-price"; item: CartItemPayload }
  | { kind: "local-note"; itemId: string; note: string }
  | {
      kind: "local-purchased";
      itemId: string;
      purchasedAt?: string;
      purchasedBy?: CartItemPayload["purchasedBy"];
      purchasePhotoUrl?: string;
      pending?: boolean;
    };

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const totalOf = (items: readonly CartItemPayload[]): number =>
  round2(items.reduce((acc, item) => acc + item.price * item.qty, 0));

/** "Pollo entero" → "pollo-entero": el fallback cuando no sabemos el product_key. */
export function slugifyKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const MAX_FEED = 30;

/** Una entrada por item: si ya existía, la última acción la reemplaza. */
function pushFeed(
  feed: readonly PurchaseFeedEntry[],
  entry: PurchaseFeedEntry,
): PurchaseFeedEntry[] {
  const rest = feed.filter((item) => item.itemId !== entry.itemId);
  return [entry, ...rest].slice(0, MAX_FEED);
}

function emptyStamps(): Stamps {
  return { qty: {}, add: {}, verdict: {}, quote: {} };
}

export function seedCartState(seed: readonly LiveCartSeedItem[]): CartState {
  const stamps = emptyStamps();
  const productKeys: Record<string, string> = {};
  const items: CartItemPayload[] = [];

  for (const entry of seed) {
    const { createdAt, updatedAt, productKey, ...item } = entry;
    items.push(item);
    // Sellar con la fila real es lo que hace inofensivo el backfill de Portal:
    // un `item-qty` del historial es más viejo que la fila y se descarta solo.
    stamps.add[item.id] = Number.isFinite(createdAt) ? createdAt : 0;
    stamps.qty[item.id] = Number.isFinite(updatedAt) ? updatedAt : 0;
    if (productKey) productKeys[item.id] = productKey;
  }

  return {
    items,
    verdicts: {},
    latestVerdictItemId: null,
    quotes: {},
    pricePending: {},
    purchasePending: {},
    purchaseFeed: [],
    productKeys,
    tombstones: {},
    clearedAt: 0,
    stamps,
    hintedTotal: null,
  };
}

/**
 * Alta o merge por id: un alta repetida actualiza, nunca duplica la línea.
 *
 * `keepQty` protege el caso incómodo: el eco de mi propio `item-added` (o el
 * backfill al reconectar) llega con la cantidad de cuando se envió. Si desde
 * entonces alguien ya la cambió, el alta vieja no puede revertirla.
 */
function upsertItem(
  items: CartItemPayload[],
  incoming: CartItemPayload,
  keepQty: boolean,
): CartItemPayload[] {
  const index = items.findIndex((item) => item.id === incoming.id);
  const existing = items[index];
  if (index === -1 || !existing) return [...items, incoming];

  const next = items.slice();
  next[index] = { ...existing, ...incoming, qty: keepQty ? existing.qty : incoming.qty };
  return next;
}

function applyEvent(state: CartState, event: CartEvent, at: number): CartState {
  switch (event.type) {
    case "item-added": {
      const tomb = state.tombstones[event.item.id];
      // Ya lo borraron después de esta alta, o el carrito se vació después:
      // el alta llegó tarde y no manda.
      if ((tomb !== undefined && tomb >= at) || at < state.clearedAt) return state;

      const stale = at < (state.stamps.qty[event.item.id] ?? 0);
      return {
        ...state,
        items: upsertItem(state.items, event.item, stale),
        hintedTotal: event.total,
        stamps: {
          ...state.stamps,
          add: { ...state.stamps.add, [event.item.id]: at },
          qty: stale ? state.stamps.qty : { ...state.stamps.qty, [event.item.id]: at },
        },
      };
    }

    case "item-removed": {
      const previous = state.tombstones[event.itemId] ?? 0;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== event.itemId),
        tombstones: { ...state.tombstones, [event.itemId]: Math.max(previous, at) },
        hintedTotal: event.total,
      };
    }

    case "item-qty": {
      const known = state.items.some((item) => item.id === event.itemId);
      // Sin el item no hay nada que ajustar (o ya se borró): no lo revivimos.
      if (!known) return state;
      if (at < (state.stamps.qty[event.itemId] ?? 0)) return state;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === event.itemId ? { ...item, qty: event.qty } : item,
        ),
        stamps: { ...state.stamps, qty: { ...state.stamps.qty, [event.itemId]: at } },
        hintedTotal: event.total,
      };
    }

    case "item-note": {
      if (!state.items.some((item) => item.id === event.itemId)) return state;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === event.itemId ? { ...item, note: event.note || undefined } : item,
        ),
      };
    }

    case "item-purchased": {
      if (!state.items.some((item) => item.id === event.itemId)) return state;
      const purchasePending = { ...state.purchasePending };
      delete purchasePending[event.itemId];
      const bought = state.items.find((item) => item.id === event.itemId);
      const entry: PurchaseFeedEntry = {
        itemId: event.itemId,
        title: bought?.title ?? "Un producto",
        at: event.purchasedAt ?? new Date().toISOString(),
        by: event.purchasedBy,
        photoUrl: event.purchasePhotoUrl,
      };
      return {
        ...state,
        purchasePending,
        purchaseFeed: event.purchasedAt ? pushFeed(state.purchaseFeed, entry) : state.purchaseFeed,
        items: state.items.map((item) =>
          item.id === event.itemId
            ? {
                ...item,
                purchasedAt: event.purchasedAt,
                purchasedBy: event.purchasedBy ?? item.purchasedBy,
                purchasePhotoUrl: event.purchasedAt
                  ? (event.purchasePhotoUrl ?? item.purchasePhotoUrl)
                  : undefined,
              }
            : item,
        ),
      };
    }

    case "cart-cleared": {
      // Solo se lleva lo que ya existía cuando se vació: un item agregado
      // después no puede desaparecer por un `cart-cleared` que llegó tarde.
      return {
        ...state,
        items: state.items.filter((item) => (state.stamps.add[item.id] ?? 0) > at),
        clearedAt: Math.max(state.clearedAt, at),
        hintedTotal: event.total,
      };
    }

    case "ai-verdict": {
      if (at < (state.stamps.verdict[event.itemId] ?? 0)) return state;
      const { type: _type, ...verdict } = event;
      return {
        ...state,
        verdicts: { ...state.verdicts, [event.itemId]: verdict },
        latestVerdictItemId: event.itemId,
        stamps: { ...state.stamps, verdict: { ...state.stamps.verdict, [event.itemId]: at } },
      };
    }

    case "price-request": {
      return { ...state, pricePending: { ...state.pricePending, [event.itemId]: true } };
    }

    case "price-snapshot": {
      if (at < (state.stamps.quote[event.itemId] ?? 0)) return state;
      const pricePending = { ...state.pricePending };
      delete pricePending[event.itemId];
      return {
        ...state,
        quotes: { ...state.quotes, [event.itemId]: event.quotes },
        productKeys: { ...state.productKeys, [event.itemId]: event.productKey },
        pricePending,
        stamps: { ...state.stamps, quote: { ...state.stamps.quote, [event.itemId]: at } },
      };
    }

    case "item-price-registered": {
      const known = state.items.some((entry) => entry.id === event.item.id);
      // Un precio no revive ni crea filas: solo ajusta la que ya existe.
      if (!known) return state;
      if (at < (state.stamps.add[event.item.id] ?? 0)) return state;
      return {
        ...state,
        items: state.items.map((entry) =>
          entry.id === event.item.id ? event.item : entry,
        ),
        hintedTotal: event.total,
      };
    }

    case "whatsapp-sync": {
      let items = state.items;
      const add = { ...state.stamps.add };
      const qty = { ...state.stamps.qty };
      for (const item of event.items) {
        const tomb = state.tombstones[item.id];
        if ((tomb !== undefined && tomb >= at) || at < state.clearedAt) continue;
        const stale = at < (qty[item.id] ?? 0);
        items = upsertItem(items, item, stale);
        add[item.id] = at;
        if (!stale) qty[item.id] = at;
      }
      return { ...state, items, hintedTotal: event.total, stamps: { ...state.stamps, add, qty } };
    }

    default:
      return state;
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.kind) {
    case "remote":
      return action.events.reduce(
        (acc, event) => applyEvent(acc, event.content, event.at),
        state,
      );

    case "local-add":
      return {
        ...state,
        items: upsertItem(state.items, action.item, false),
        productKeys: action.productKey
          ? { ...state.productKeys, [action.item.id]: action.productKey }
          : state.productKeys,
        stamps: {
          ...state.stamps,
          add: { ...state.stamps.add, [action.item.id]: action.at },
          qty: { ...state.stamps.qty, [action.item.id]: action.at },
        },
      };

    case "local-swap-id": {
      // La fila optimista pasa a ser la fila real: se cambia el id en su sitio
      // para que la lista no salte mientras el servidor responde.
      const index = state.items.findIndex((item) => item.id === action.tempId);
      const items = state.items.slice();
      if (index === -1) items.push(action.item);
      else items[index] = action.item;

      const stamps = { ...state.stamps, add: { ...state.stamps.add }, qty: { ...state.stamps.qty } };
      delete stamps.add[action.tempId];
      delete stamps.qty[action.tempId];
      stamps.add[action.item.id] = action.at;
      stamps.qty[action.item.id] = action.at;

      const productKeys = { ...state.productKeys };
      delete productKeys[action.tempId];
      if (action.productKey) productKeys[action.item.id] = action.productKey;

      return { ...state, items, stamps, productKeys };
    }

    case "local-drop":
      return { ...state, items: state.items.filter((item) => item.id !== action.itemId) };

    case "local-restore": {
      if (state.items.some((item) => item.id === action.item.id)) return state;
      const items = state.items.slice();
      items.splice(Math.min(action.index, items.length), 0, action.item);
      return { ...state, items };
    }

    case "local-qty":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, qty: action.qty } : item,
        ),
        stamps: { ...state.stamps, qty: { ...state.stamps.qty, [action.itemId]: action.at } },
      };

    case "local-verdict":
      return {
        ...state,
        verdicts: { ...state.verdicts, [action.verdict.itemId]: action.verdict },
        latestVerdictItemId: action.verdict.itemId,
        stamps: {
          ...state.stamps,
          verdict: { ...state.stamps.verdict, [action.verdict.itemId]: action.at },
        },
      };

    case "price-pending": {
      const pricePending = { ...state.pricePending };
      if (action.pending) pricePending[action.itemId] = true;
      else delete pricePending[action.itemId];
      return { ...state, pricePending };
    }

    case "local-set-price":
      // Reemplazo en su sitio; el item completo viene del llamador.
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.item.id ? action.item : item,
        ),
      };

    case "local-note":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, note: action.note || undefined } : item,
        ),
      };

    case "local-purchased": {
      const purchasePending = { ...state.purchasePending };
      if (action.pending) purchasePending[action.itemId] = true;
      else delete purchasePending[action.itemId];
      const bought = state.items.find((item) => item.id === action.itemId);
      const entry: PurchaseFeedEntry = {
        itemId: action.itemId,
        title: bought?.title ?? "Un producto",
        at: action.purchasedAt ?? new Date().toISOString(),
        by: action.purchasedBy,
        photoUrl: action.purchasePhotoUrl,
      };
      return {
        ...state,
        purchasePending,
        purchaseFeed: action.purchasedAt
          ? pushFeed(state.purchaseFeed, entry)
          : state.purchaseFeed,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? {
                ...item,
                purchasedAt: action.purchasedAt,
                purchasedBy: action.purchasedBy ?? item.purchasedBy,
                purchasePhotoUrl: action.purchasedAt
                  ? (action.purchasePhotoUrl ?? item.purchasePhotoUrl)
                  : undefined,
              }
            : item,
        ),
      };
    }

    default:
      return state;
  }
}

// --- respuesta de /api/ai/evaluate-item -----------------------------------

type EvaluateResponse = { verdict?: CartVerdict; publishedToChannel?: boolean };

function readEvaluateResponse(raw: unknown): EvaluateResponse | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const published = typeof body.publishedToChannel === "boolean" ? body.publishedToChannel : undefined;

  const verdict = body.verdict;
  if (typeof verdict !== "object" || verdict === null) return { publishedToChannel: published };

  const candidate = verdict as Record<string, unknown>;
  if (typeof candidate.itemId !== "string" || typeof candidate.reason !== "string") {
    return { publishedToChannel: published };
  }
  const grade = candidate.healthGrade;
  if (grade !== "A" && grade !== "B" && grade !== "C" && grade !== "D") {
    return { publishedToChannel: published };
  }

  const { type: _type, ...rest } = candidate;
  return {
    publishedToChannel: published,
    verdict: rest as unknown as CartVerdict,
  };
}

// --- respuesta de /api/price-check ----------------------------------------

type PriceResponse = { quotes: PriceQuote[]; publishedToChannel?: boolean };

function readQuote(raw: unknown): PriceQuote | null {
  if (typeof raw !== "object" || raw === null) return null;
  const quote = raw as Record<string, unknown>;
  if (typeof quote.store !== "string" || typeof quote.price !== "number") return null;
  return {
    store: quote.store,
    price: quote.price,
    unit: typeof quote.unit === "string" ? quote.unit : "un",
    url: typeof quote.url === "string" && /^https:\/\//.test(quote.url) ? quote.url : undefined,
    fetchedAt: typeof quote.fetchedAt === "string" ? quote.fetchedAt : new Date().toISOString(),
    // El origen no se maquilla: si no viene, se asume dataset.
    source: quote.source === "live" ? "live" : "dataset",
  };
}

function readPriceResponse(raw: unknown): PriceResponse | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const list = Array.isArray(body.quotes) ? body.quotes : [];
  return {
    quotes: list.map(readQuote).filter((quote): quote is PriceQuote => quote !== null),
    publishedToChannel:
      typeof body.publishedToChannel === "boolean" ? body.publishedToChannel : undefined,
  };
}

// --- hook ------------------------------------------------------------------

/** Un borrado se puede deshacer durante 5 s; recién ahí se escribe en la base. */
export const UNDO_WINDOW_MS = 5000;
/** El stepper de cantidad dispara rápido; la escritura se agrupa. */
const QTY_WRITE_DEBOUNCE_MS = 300;
/** Tope del set de deduplicación por id de mensaje. */
const APPLIED_LIMIT = 400;

type PendingRemoval = { timer: number; item: CartItemPayload; index: number };

export function useLiveCart(
  householdId: string,
  seed: readonly LiveCartSeedItem[],
): UseLiveCartResult {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(cartReducer, seed, seedCartState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const { messages, send, presence, status } = useChannel<CartEvent>({
    channelId: channels.cartUpdate(householdId),
    history: 50,
  });

  // Se aplica desde `messages` y no desde `onMessage` a propósito: `messages` es
  // la ventana ordenada por seq que el SDK repara tras reconectar, así que
  // reprocesarla entera es lo correcto. El set de ids solo evita trabajo
  // repetido — la idempotencia real la dan los guardias de `applyEvent`.
  const appliedRef = useRef<Set<string>>(new Set());
  const appliedOrderRef = useRef<string[]>([]);

  useEffect(() => {
    const fresh: RemoteEvent[] = [];
    for (const message of messages) {
      if (message.status === "failed") continue;
      if (appliedRef.current.has(message.id)) continue;
      appliedRef.current.add(message.id);
      appliedOrderRef.current.push(message.id);
      fresh.push({ content: message.content, at: message.timestamp });
    }

    while (appliedOrderRef.current.length > APPLIED_LIMIT) {
      const oldest = appliedOrderRef.current.shift();
      if (oldest !== undefined) appliedRef.current.delete(oldest);
    }

    if (fresh.length > 0) dispatch({ kind: "remote", events: fresh });
  }, [messages]);

  /** Publicar nunca puede tumbar la acción: el dato ya está en Supabase. */
  const publish = useCallback(
    (content: CartEvent) => {
      void send({ content }).catch(() => undefined);
    },
    [send],
  );

  const total = useMemo(() => totalOf(state.items), [state.items]);

  const productKeyFor = useCallback((item: CartItemPayload): string => {
    return stateRef.current.productKeys[item.id] ?? slugifyKey(item.title);
  }, []);

  // --- alta ----------------------------------------------------------------

  const addItem = useCallback(
    async (draft: AddItemDraft) => {
      const qty = draft.qty ?? 1;
      const tempId = `temp-${crypto.randomUUID()}`;
      const at = Date.now();

      const optimistic: CartItemPayload = {
        id: tempId,
        title: draft.title,
        price: draft.price,
        qty,
        unit: draft.unit,
        store: draft.store,
        category: draft.category,
      };
      dispatch({ kind: "local-add", item: optimistic, productKey: draft.productKey, at });

      const input: AddItemInput = {
        householdId,
        productId: draft.productId,
        title: draft.title,
        price: draft.price,
        qty,
        unit: draft.unit,
        store: draft.store,
        category: draft.category,
      };

      const result = await addItemAction(input).catch(() => null);

      if (!result || !result.ok) {
        dispatch({ kind: "local-drop", itemId: tempId });
        toast({
          title: "No se pudo agregar",
          description: result?.ok === false ? result.error : "Intenta de nuevo en un momento.",
          tone: "critical",
        });
        return;
      }

      dispatch({
        kind: "local-swap-id",
        tempId,
        item: result.item,
        productKey: result.productKey ?? draft.productKey,
        at: Date.now(),
      });
      publish({ type: "item-added", item: result.item, total: result.total });

      // La IA contesta por el canal: no se bloquea la UI esperando su veredicto.
      void fetch("/api/ai/evaluate-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          itemId: result.item.id,
          productId: draft.productId,
          title: result.item.title,
          price: result.item.price,
          qty: result.item.qty,
        }),
      })
        .then(async (response) => {
          if (!response.ok) return;
          const parsed = readEvaluateResponse((await response.json()) as unknown);
          // Solo se pinta a mano si el servidor no llegó al canal; si llegó, el
          // veredicto entra por `messages` como cualquier otro evento.
          if (parsed?.verdict && parsed.publishedToChannel === false) {
            dispatch({ kind: "local-verdict", verdict: parsed.verdict, at: Date.now() });
          }
        })
        .catch(() => undefined);
    },
    [householdId, publish, toast],
  );

  // --- baja con deshacer ---------------------------------------------------

  const pendingRemovals = useRef<Map<string, PendingRemoval>>(new Map());

  const commitRemoval = useCallback(
    async (itemId: string) => {
      const pending = pendingRemovals.current.get(itemId);
      if (!pending) return;
      pendingRemovals.current.delete(itemId);
      window.clearTimeout(pending.timer);

      const result = await removeItemAction(householdId, itemId).catch(() => null);

      if (!result || !result.ok) {
        dispatch({ kind: "local-restore", item: pending.item, index: pending.index });
        toast({
          title: "No se pudo eliminar",
          description: result?.ok === false ? result.error : "El item sigue en el carrito.",
          tone: "critical",
        });
        return;
      }

      publish({ type: "item-removed", itemId, title: result.title, total: result.total });
    },
    [householdId, publish, toast],
  );

  const commitRemovalRef = useRef(commitRemoval);
  commitRemovalRef.current = commitRemoval;

  const undoRemoval = useCallback((itemId: string) => {
    const pending = pendingRemovals.current.get(itemId);
    if (!pending) return;
    pendingRemovals.current.delete(itemId);
    window.clearTimeout(pending.timer);
    // Nunca se escribió nada: deshacer es simplemente devolverlo a su sitio.
    dispatch({ kind: "local-restore", item: pending.item, index: pending.index });
  }, []);

  const removeItem = useCallback(
    (itemId: string) => {
      if (pendingRemovals.current.has(itemId)) return;
      const index = stateRef.current.items.findIndex((item) => item.id === itemId);
      const item = stateRef.current.items[index];
      if (!item) return;

      dispatch({ kind: "local-drop", itemId });

      const timer = window.setTimeout(() => {
        void commitRemovalRef.current(itemId);
      }, UNDO_WINDOW_MS);
      pendingRemovals.current.set(itemId, { timer, item, index });

      toast({
        title: `${item.title} salió del carrito`,
        duration: UNDO_WINDOW_MS,
        action: { label: "Deshacer", onClick: () => undoRemoval(itemId) },
      });
    },
    [toast, undoRemoval],
  );

  // Salir de la pantalla no cancela la intención: lo pendiente se confirma.
  useEffect(() => {
    const removals = pendingRemovals.current;
    const commit = commitRemovalRef;
    return () => {
      for (const itemId of [...removals.keys()]) void commit.current(itemId);
    };
  }, []);

  // --- cantidad ------------------------------------------------------------

  type PendingQty = { timer: number; qty: number; previousQty: number };
  const qtyWrites = useRef<Map<string, PendingQty>>(new Map());

  const writeQty = useCallback(
    async (itemId: string, qty: number, previousQty: number) => {
      const result = await setQtyAction(householdId, itemId, qty).catch(() => null);
      if (!result || !result.ok) {
        dispatch({ kind: "local-qty", itemId, qty: previousQty, at: Date.now() });
        toast({
          title: "No se pudo cambiar la cantidad",
          description: result?.ok === false ? result.error : "Volvimos al valor anterior.",
          tone: "critical",
        });
        return;
      }
      publish({ type: "item-qty", itemId, qty: result.qty, total: result.total });
    },
    [householdId, publish, toast],
  );

  const writeQtyRef = useRef(writeQty);
  writeQtyRef.current = writeQty;

  const setQty = useCallback(
    (itemId: string, qty: number) => {
      if (qty <= 0) {
        removeItem(itemId);
        return;
      }

      const current = stateRef.current.items.find((item) => item.id === itemId);
      if (!current || current.qty === qty) return;

      // El valor al que hay que volver es el de antes de tocar el stepper, no
      // el del clic anterior: por eso se conserva el de la tanda en curso.
      const pending = qtyWrites.current.get(itemId);
      const previousQty = pending?.previousQty ?? current.qty;
      if (pending) window.clearTimeout(pending.timer);

      dispatch({ kind: "local-qty", itemId, qty, at: Date.now() });

      const timer = window.setTimeout(() => {
        qtyWrites.current.delete(itemId);
        void writeQtyRef.current(itemId, qty, previousQty);
      }, QTY_WRITE_DEBOUNCE_MS);

      qtyWrites.current.set(itemId, { timer, qty, previousQty });
    },
    [removeItem],
  );

  // Cambiar de pantalla no puede tragarse la cantidad que quedó en el debounce.
  useEffect(() => {
    const writes = qtyWrites.current;
    const write = writeQtyRef;
    return () => {
      for (const [itemId, pending] of [...writes.entries()]) {
        window.clearTimeout(pending.timer);
        writes.delete(itemId);
        void write.current(itemId, pending.qty, pending.previousQty);
      }
    };
  }, []);

  // --- nota compartida -----------------------------------------------------

  const setNote = useCallback(
    async (itemId: string, note: string) => {
      const current = stateRef.current.items.find((item) => item.id === itemId);
      if (!current) return;

      const previous = current.note ?? "";
      const next = note.trim().slice(0, 280);
      dispatch({ kind: "local-note", itemId, note: next });

      const result = await setNoteAction(householdId, itemId, next).catch(() => null);
      if (!result || !result.ok) {
        dispatch({ kind: "local-note", itemId, note: previous });
        toast({
          title: "No se pudo guardar la nota",
          description: result?.ok === false ? result.error : "Volvimos a la nota anterior.",
          tone: "critical",
        });
        return;
      }

      publish({ type: "item-note", itemId, note: result.note });
    },
    [householdId, publish, toast],
  );

  // --- compra física compartida -------------------------------------------

  const setPurchased = useCallback(
    async (itemId: string, purchased: boolean, photo?: File) => {
      const current = stateRef.current.items.find((item) => item.id === itemId);
      if (!current) return;

      dispatch({
        kind: "local-purchased",
        itemId,
        purchasedAt: purchased ? (current.purchasedAt ?? new Date().toISOString()) : undefined,
        purchasedBy: current.purchasedBy,
        purchasePhotoUrl: current.purchasePhotoUrl,
        pending: true,
      });

      const preparedPhoto = photo ? await prepareImageUpload(photo).catch(() => photo) : undefined;
      const formData = preparedPhoto ? new FormData() : undefined;
      if (preparedPhoto && formData) formData.set("photo", preparedPhoto);
      const result = await setPurchasedAction(householdId, itemId, purchased, formData).catch(
        () => null,
      );

      if (!result || !result.ok) {
        dispatch({
          kind: "local-purchased",
          itemId,
          purchasedAt: current.purchasedAt,
          purchasedBy: current.purchasedBy,
          purchasePhotoUrl: current.purchasePhotoUrl,
          pending: false,
        });
        toast({
          title: "No se pudo actualizar la compra",
          description: result?.ok === false ? result.error : "Volvimos al estado anterior.",
          tone: "critical",
        });
        return;
      }

      const event: Extract<CartEvent, { type: "item-purchased" }> = {
        type: "item-purchased",
        itemId,
        purchasedAt: result.purchasedAt,
        purchasedBy: result.purchasedBy ?? current.purchasedBy,
        purchasePhotoUrl: result.purchasePhotoUrl ?? current.purchasePhotoUrl,
      };
      dispatch({
        kind: "local-purchased",
        itemId,
        purchasedAt: event.purchasedAt,
        purchasedBy: event.purchasedBy,
        purchasePhotoUrl: event.purchasePhotoUrl,
        pending: false,
      });
      publish(event);
    },
    [householdId, publish, toast],
  );

  // --- precios -------------------------------------------------------------

  const requestPrices = useCallback(
    async (itemId: string) => {
      const item = stateRef.current.items.find((entry) => entry.id === itemId);
      if (!item) return;

      // Marca local inmediata: la ruta también publica `price-request`, pero el
      // spinner propio no puede depender de que el socket esté vivo.
      dispatch({ kind: "price-pending", itemId, pending: true });

      const productKey = productKeyFor(item);

      try {
        const response = await fetch("/api/price-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ householdId, productKey, itemId }),
        });
        if (!response.ok) throw new Error(String(response.status));

        const parsed = readPriceResponse((await response.json()) as unknown);
        // Si el servidor no llegó al canal, el spinner se quedaría girando para
        // siempre: se pintan las quotes de la respuesta HTTP como respaldo.
        if (parsed && parsed.publishedToChannel === false) {
          dispatch({
            kind: "remote",
            events: [
              {
                content: { type: "price-snapshot", itemId, productKey, quotes: parsed.quotes },
                at: Date.now(),
              },
            ],
          });
        } else if (parsed && parsed.quotes.length === 0) {
          dispatch({ kind: "price-pending", itemId, pending: false });
          toast({
            title: "Sin precios para ese producto",
            description: "Ninguna tienda tenía dato fresco.",
            tone: "neutral",
          });
        }
      } catch {
        dispatch({ kind: "price-pending", itemId, pending: false });
        toast({
          title: "No se pudo consultar precios",
          description: "Las tiendas no respondieron. Vuelve a intentar.",
          tone: "warning",
        });
      }
    },
    [householdId, productKeyFor, toast],
  );

  // --- precio pagado en el mercado ------------------------------------------

  /**
   * Registra lo que de verdad se pagó en el puesto/plaza. Optimista: la fila
   * cambia al instante; si la escritura falla, se vuelve al precio anterior.
   */
  const recordMarketPrice = useCallback(
    async (input: Omit<RecordMarketPriceInput, "householdId">) => {
      const current = stateRef.current.items.find((entry) => entry.id === input.itemId);
      if (!current) return;

      dispatch({ kind: "local-set-price", item: { ...current, price: input.price } });

      const result = await recordMarketPriceAction({ ...input, householdId }).catch(
        () => null,
      );

      if (!result || !result.ok) {
        dispatch({ kind: "local-set-price", item: current });
        toast({
          title: "No se pudo registrar el precio",
          description: result?.ok === false ? result.error : "El item sigue con su precio anterior.",
          tone: "critical",
        });
        return;
      }

      // El evento lleva el item completo: quien esté mirando el carrito en
      // otra pantalla ve el precio real del puesto, no el de referencia.
      publish({ type: "item-price-registered", item: result.item, total: result.total });
    },
    [householdId, publish, toast],
  );

  // --- cambio por la alternativa barata ------------------------------------

  const swapItem = useCallback(
    async (itemId: string, cheaper: NonNullable<CartVerdict["cheaper"]>) => {
      const current = stateRef.current.items.find((entry) => entry.id === itemId);
      if (!current) return;

      const result = await swapItemAction(householdId, itemId, {
        title: cheaper.title,
        price: cheaper.price,
        store: cheaper.store,
        qty: current.qty,
      }).catch(() => null);

      if (!result || !result.ok) {
        toast({
          title: "No se pudo cambiar el producto",
          description: result?.ok === false ? result.error : "El carrito quedó como estaba.",
          tone: "critical",
        });
        return;
      }

      dispatch({ kind: "local-drop", itemId });
      dispatch({
        kind: "local-add",
        item: result.item,
        productKey: result.productKey,
        at: Date.now(),
      });

      publish({ type: "item-removed", itemId, title: current.title, total: result.total });
      publish({ type: "item-added", item: result.item, total: result.total });
    },
    [householdId, publish, toast],
  );

  // Con una fila optimista en vuelo el total local va por delante del que
  // anunció el canal: eso es normal, no un desfase.
  const settling = state.items.some((item) => item.id.startsWith("temp-"));
  const outOfSync =
    !settling && state.hintedTotal !== null && Math.abs(state.hintedTotal - total) > 0.01;

  return {
    items: state.items,
    total,
    itemCount: state.items.length,
    verdicts: state.verdicts,
    latestVerdictItemId: state.latestVerdictItemId,
    quotes: state.quotes,
    pricePending: state.pricePending,
    purchasePending: state.purchasePending,
    purchaseFeed: state.purchaseFeed,
    outOfSync,
    status,
    presence,
    addItem,
    removeItem,
    setQty,
    setNote,
    setPurchased,
    requestPrices,
    recordMarketPrice,
    swapItem,
  };
}
