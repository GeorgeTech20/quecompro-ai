# QueCompro.ai — brief de producto y de diseño

Documento único de verdad para todo el equipo. Si el código y este brief se
contradicen, gana el código; si el código no dice nada, gana este brief.

## 1. Qué es

**La despensa viva de tu casa.** Un carrito de compras compartido en tiempo real
entre quienes viven juntos (pareja o roomies), con una IA que reacciona en el
mismo canal: puntúa la salud de lo que agregas, propone el cambio más barato y
avisa cuando el mes se va de presupuesto.

No es un chatbot en una pestaña aparte. La IA es un participante más del canal.

## 2. Por qué existe

Jóvenes que viven solos o en pareja en Perú:

- se olvidan qué comprar y compran dos veces lo mismo,
- pierden la boleta y no saben cuánto llevan gastado del mes,
- no saben si lo que compran es sano,
- no coordinan la compra con su pareja ni con los roomies.

## 3. El momento que gana la demo

Dos pantallas abiertas. En una, alguien agrega **pollo entero**. En la otra:

1. el item aparece sin recargar,
2. el total late al crecer,
3. la IA publica en el chat un chip **A/B/C** de salud y un swap más barato,
4. si el mes se pasa de presupuesto, sale la alerta con la proyección.

Todo eso en el mismo canal, delante de los dos usuarios. Eso es lo que se
evalúa: **qué tan viva se siente la experiencia**.

## 4. Realtime (Portal) — contrato

Los canales y todos los eventos están tipados en
`src/lib/realtime/channels.ts`. **Ningún evento nuevo sin declararlo ahí.**

| Canal | Para qué |
|---|---|
| `cart:update:{householdId}` | alta/baja/cantidad de items, veredictos de IA, precios |
| `cart:presence:{householdId}` | quién está mirando el carrito |
| `cart:chat:{householdId}` | mensajes humanos + respuestas del asistente |
| `user:{userId}` | bandeja personal (alertas de presupuesto, avisos) |
| `whatsapp:bridge:{householdId}` | puente WhatsApp (modo demo) |

API real del SDK (verificada contra los `.d.ts` instalados, no contra los docs):

```tsx
const { messages, send, presence, activity, typing, sendTyping,
        setMetadata, status, me } = useChannel<CartEvent>({
  channelId: channels.cartUpdate(householdId),
  history: 50,
  metadata: { name, avatarUrl },
  onMessage: (m) => { /* efectos vivos: pulso del total, toasts */ },
});

await send({ content: { type: "item-added", item, total } });
await send({ content: { type: "price-request", ... }, ephemeral: true });
```

- `presence` es `DetailedPresence | AggregatePresence` — **discrimina por
  `presence.kind`** antes de leer `participants`.
- `status` incluye `"degraded-http"`: el socket cayó pero publicar sigue
  funcionando. La UI debe seguir usable, no bloquearse.
- El contenido va en `content`, tope **2KB**. Nada de mandar el carrito entero.

## 5. Reglas duras

1. **Secretos**: `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `OPENAI_API_KEY`, `PORTAL_TOKEN_SECRET` viven solo en servidor. Si una clave
   necesita `NEXT_PUBLIC_`, es porque es pública por diseño (publishable/anon).
   Nunca se commitea `.env.local`.
2. **Nada de shadcn.** Design system propio en `src/components/ui/*`.
3. **Sin `any` suelto** y sin `@ts-ignore`. `pnpm build` tiene que pasar.
4. **Datos de demostración**: los precios del seed son aproximados de mercado
   peruano 2026 y el README lo dice explícitamente. No se presentan como
   precios oficiales de ninguna cadena.
5. **DEMO_MODE=1** debe dejar la app 100% funcional sin scrapear nada.

## 6. Diseño

Sistema propio inspirado en Polaris (Shopify): claro, ordenado, sin ruido.
Tokens en `src/app/globals.css` (Tailwind 4 es CSS-first: **no hay
`tailwind.config.ts`**, se usa `@theme`).

- Primario `brand-600` (verde árbol), acento `lime-accent`, fondo `canvas`
  `#FAFAF8`, tinta `ink` `#1B1F2A`.
- Inter. Titulares 32–48 semibold, cuerpo 14–16.
- Radios 8–12 (`rounded-control` / `rounded-card`).
- Micro-motion 150–200 ms. Clases ya definidas: `animate-total-pulse`,
  `animate-live-dot`, `animate-rise`, `animate-savings`. Respetan
  `prefers-reduced-motion`.
- Dark mode por clase (`<html class="dark">`), variante `dark:` ya registrada.

### Dirección visual del landing (referencias del cliente)

Cuatro referencias marcan el estilo del hero y de las secciones:

1. **Infografía "Costco's Global Presence"** — ilustración plana de un carrito
   visto en picado, con un *treemap* de bloques de datos dentro de la canasta.
   Números enormes en serif/display, paleta plana y contorno marcado.
2. **Góndola de productos ilustrada (fondo amarillo)** — dos repisas con
   productos dibujados en flat vector y, bajo cada uno, una **etiqueta de precio
   blanca** con badge (`Top 1`, `New!`, `Hot!`, `Best!`) y código de barras.
3. **"Supermarket sleep"** — estantería editorial en corte, filas de productos
   repetidos con etiquetas de precio amarillas, gente diminuta viviendo entre
   los estantes. Ilustración editorial, no render 3D.
4. **Tarjetas de nutrición** — bloques redondeados de colores cálidos con el
   alimento, macros en lista y el **número de kcal gigante**.

Traducción a la landing:

- **Hero**: canvas 2D con la silueta de un carrito visto en picado; dentro, los
  items caen como bloques tipo treemap (referencia 1) y cada uno lleva su
  etiqueta de precio flotante (referencia 2). Los bloques se reacomodan solos
  cuando "entra" un producto nuevo — el hero cuenta el producto sin explicarlo.
  Debe correr a 60 fps, pausarse fuera de viewport y degradar a una composición
  estática con `prefers-reduced-motion`.
- **Sección de features**: tarjetas cálidas redondeadas con un número gigante
  (referencia 4): salud, ahorro, presencia.
- **Sección "cómo funciona"**: fila de góndola con etiquetas de precio
  (referencia 2), cada etiqueta es un paso.
- Sin fotos de stock. Todo ilustración plana / canvas, coherente con la paleta.

## 7. Rutas

Públicas: `/`, `/login`, `/invite/[token]`.
Onboarding: `/onboarding/{welcome,household,budget,diet,whatsapp,done}`.
App: `/app`, `/app/{cart,products,chat,plan,history,collab,notifications,settings}`.

Prioridad de entrega: carrito live + IA > precios > landing > el resto.
