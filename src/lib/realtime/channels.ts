/**
 * Contrato de canales y eventos realtime (Portal).
 *
 * Todo lo que viaja por Portal pasa por aquí. Si un evento no está en
 * `CartEvent` o `ChatEvent`, no existe: así el cliente, las API routes y el
 * asistente hablan el mismo idioma sin adivinar shapes.
 */

export const channels = {
  /** Altas, bajas y cambios de cantidad del carrito + reacciones de la IA. */
  cartUpdate: (householdId: string) => `cart:update:${householdId}`,
  /** Quién está mirando el carrito ahora mismo. */
  cartPresence: (householdId: string) => `cart:presence:${householdId}`,
  /** Conversación humanos + asistente. Todos la ven. */
  cartChat: (householdId: string) => `cart:chat:${householdId}`,
  /** Bandeja personal: alertas de presupuesto, avisos de roomies. */
  userInbox: (userId: string) => `user:${userId}`,
  /** Puente WhatsApp (modo demo). */
  whatsappBridge: (householdId: string) => `whatsapp:bridge:${householdId}`,
} as const;

// --- Tipos de dominio compartidos -----------------------------------------

export type HealthGrade = "A" | "B" | "C" | "D";

export type CartItemPayload = {
  id: string;
  title: string;
  price: number;
  qty: number;
  unit?: string;
  store?: string;
  category?: string;
  healthGrade?: HealthGrade;
  /** Id de catálogo, si el item salió del catálogo y no de texto libre. */
  productId?: string | null;
  /**
   * Clave canónica del producto ("pollo-entero"), compartida entre tiendas.
   * Viaja en el evento porque quien recibe el alta necesita poder pedir
   * precios sin volver a la base: sin esto, la otra pantalla solo tiene el
   * título y tendría que adivinar la clave a partir del texto.
   */
  productKey?: string | null;
  addedBy?: { id: string; name: string; avatarUrl?: string | null };
};

export type PriceQuote = {
  store: string;
  price: number;
  unit: string;
  /** ISO string. Marca si vino de scrape real o del dataset. */
  fetchedAt: string;
  source: "live" | "dataset";
};

// --- Eventos del canal cart:update ----------------------------------------

export type CartEvent =
  | { type: "item-added"; item: CartItemPayload; total: number }
  | { type: "item-removed"; itemId: string; title: string; total: number }
  | { type: "item-qty"; itemId: string; qty: number; total: number }
  | { type: "cart-cleared"; total: number }
  /** La IA evaluó un item recién agregado. */
  | {
      type: "ai-verdict";
      itemId: string;
      healthGrade: HealthGrade;
      reason: string;
      /**
       * `productId` va incluido para que aceptar el swap sea una escritura
       * directa: buscarlo por nombre + tienda falla justo cuando el catálogo
       * tiene el mismo producto repetido en varias cadenas.
       */
      cheaper?: {
        productId?: string | null;
        title: string;
        store: string;
        price: number;
        savings: number;
      };
      budgetAlert?: { spent: number; budget: number; projected: number };
    }
  /** Precios frescos de tiendas para un producto. */
  | { type: "price-snapshot"; itemId: string; productKey: string; quotes: PriceQuote[] }
  /** Alguien pidió verificar precios; la UI muestra el spinner en vivo. */
  | { type: "price-request"; itemId: string; productKey: string; by: string }
  /** Un roomie mandó su compra por WhatsApp. */
  | { type: "whatsapp-sync"; from: string; items: CartItemPayload[]; total: number };

// --- Eventos del canal cart:chat ------------------------------------------

export type ChatEvent =
  | { type: "user-message"; text: string; author: { id: string; name: string; avatarUrl?: string | null } }
  | { type: "assistant-message"; text: string; actions?: AssistantAction[] }
  | { type: "assistant-thinking"; hint: string }
  | { type: "recipe-suggestion"; recipe: RecipeSuggestion };

export type AssistantAction =
  | { kind: "add-item"; title: string; price: number; qty: number; productId?: string }
  | { kind: "swap-item"; itemId: string; toProductId: string; toTitle: string; savings: number }
  | { kind: "set-budget"; monthly: number }
  | { kind: "accept-recipe"; recipeSlug: string };

export type RecipeSuggestion = {
  slug: string;
  title: string;
  timeMin: number;
  difficulty: "facil" | "media" | "dificil";
  kcalPerServing: number;
  servings: number;
  ingredients: { name: string; qty: number; unit: string; inCart: boolean }[];
  steps: string[];
};

// --- Eventos del canal user:{id} ------------------------------------------

export type InboxEvent = {
  type: "notification";
  kind: "budget" | "roomie" | "ai" | "reminder";
  title: string;
  body: string;
  href?: string;
};
