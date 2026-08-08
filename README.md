<h1 align="center">QueCompro.ai</h1>

<p align="center"><strong>La despensa viva de tu casa.</strong></p>

<p align="center">
Un carrito de compras compartido en tiempo real entre quienes viven juntos,<br/>
con una IA que reacciona <em>en el mismo canal</em>: puntúa lo que agregas,<br/>
busca el precio más barato y avisa antes de que el mes se te vaya.
</p>

<p align="center">
  <a href="https://github.com/GeorgeTech20/quecompro-ai/topics/the-realtime-hackathon"><img alt="The Realtime Hackathon by Portal" src="https://img.shields.io/badge/The%20Realtime%20Hackathon-by%20Portal-059669"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000">
  <img alt="Portal SDK" src="https://img.shields.io/badge/Portal%20SDK-realtime-10b981">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
</p>

---

## El problema

Vives con tu pareja o con roomies. Cada uno compra por su lado, se duplica el
arroz, se pierde la boleta, y a mitad de mes nadie sabe en qué se fue la plata.
Encima nadie mira si lo que entra a la casa es sano.

Las apps de lista de compras resuelven la lista. No resuelven que **la compra
es una decisión de dos o tres personas que casi nunca están en el mismo lugar
al mismo tiempo**.

## Qué hace QueCompro.ai

Un carrito que viven varias personas a la vez, y una IA que participa de esa
conversación en vivo en lugar de esperar a que le pregunten.

- **Carrito compartido en vivo.** Tu pareja agrega pollo desde el mercado y a ti
  te aparece en pantalla sin recargar. El total late cuando crece.
- **La IA reacciona al instante.** Cada item recibe un puntaje de salud A/B/C/D,
  una alternativa más barata con el ahorro calculado, y una alerta si la
  proyección del mes se pasa del presupuesto.
- **Recetas con lo que ya tienes.** Si el carrito cubre dos o más ingredientes
  de una receta peruana fácil, el asistente la publica completa —pasos, tiempo,
  kcal por plato— en el chat de la casa.
- **Presencia real.** "Sofi está viendo el carrito" no es un adorno: sale de la
  presencia del canal.
- **Precios de hoy.** Un agente de navegador sale a las tiendas peruanas a
  verificar precios y publica el resultado de vuelta al canal, en vivo.

## Por qué es *realtime* de verdad

El requisito de la hackathon es interacción realtime significativa, no un
websocket decorativo. Acá lo realtime **es el producto**: sin él, el carrito
compartido no existe.

Lo importante del diseño es que la IA **no responde solo a quien preguntó**.
Publica de vuelta en el canal, así que las dos pantallas ven el veredicto al
mismo tiempo. Humanos y agente son participantes del mismo canal, no un
cliente y un servidor.

```
Tú agregas "Pollo entero"
        │
        ├─► Supabase (persistencia)
        │
        ├─► publish → cart:update:{casa} ──► la pantalla de Sofi ya lo tiene
        │
        └─► POST /api/ai/evaluate-item
                 │  salud A/B/C/D (determinista, sin LLM → milisegundos)
                 │  alternativa más barata + ahorro
                 │  proyección del mes vs presupuesto
                 │  ¿el carrito arma una receta?
                 │
                 └─► publish → cart:update  +  cart:chat
                              │
                              └──► las DOS pantallas ven el veredicto a la vez
```

| Canal | Qué lleva |
|---|---|
| `cart:update:{casa}` | altas, bajas, cantidades, veredictos de IA, precios |
| `cart:presence:{casa}` | quién está mirando el carrito ahora |
| `cart:chat:{casa}` | mensajes de la gente **y** del asistente |
| `user:{usuario}` | bandeja personal: alertas de presupuesto, avisos |
| `whatsapp:bridge:{casa}` | un roomie manda su compra por WhatsApp y entra al carrito |

Todos los eventos están tipados en un único contrato,
[`src/lib/realtime/channels.ts`](src/lib/realtime/channels.ts). Cliente, API
routes y asistente hablan de ahí; no hay shapes adivinados por el camino.

## Decisiones que vale la pena contar

**El puntaje de salud no pasa por el LLM.** Se calcula con los macros por 100 g.
Es determinista, cuesta cero y responde en milisegundos — que es justo lo que
necesita algo que tiene que sentirse instantáneo. El modelo se reserva para lo
que sí requiere criterio: conversar, sugerir recetas y negociar el swap.

**La identidad la pone el servidor.** El token de Portal se firma en
`/api/portal-token` con el `sub` que viene de Clerk. Si el cliente pudiera
declarar quién es, cualquiera publicaría en el carrito de una casa ajena.

**Degradar antes que caerse.** Si Portal no responde, la API igual devuelve el
payload y el cliente lo pinta. Si falta la API key de OpenAI, el asistente pasa
a heurísticas. Si el scraper se topa con Cloudflare, los precios salen del
dataset **marcados como dataset**. Una demo que se cae en vivo no se recupera.

**Design system propio.** Sin shadcn ni Radix: componentes en
`src/components/ui` sobre tokens de Tailwind 4 (CSS-first, sin
`tailwind.config.ts`). Estilo Polaris: claro, ordenado, micro-motion de 150–200 ms
que respeta `prefers-reduced-motion`.

## Correrlo

Necesitas Node 20+ y pnpm 11.

```bash
git clone https://github.com/GeorgeTech20/quecompro-ai
cd quecompro-ai
pnpm install
cp .env.example .env.local     # rellena las claves
pnpm dev
```

Abre http://localhost:3000.

### Base de datos

Con el [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase db push               # aplica las migraciones de supabase/migrations
psql "$DATABASE_URL" -f supabase/seed.sql
```

El seed trae el catálogo peruano y las recetas. Es idempotente: puedes correrlo
dos veces sin ensuciar la base.

### Variables de entorno

Están todas en [`.env.example`](.env.example) con un comentario cada una. La
regla: **lo que lleva `NEXT_PUBLIC_` viaja al navegador**, así que ahí solo van
claves publicables (Clerk publishable, Supabase anon, Portal publishable). El
resto —`CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`,
`PORTAL_TOKEN_SECRET`— vive solo en el servidor y nunca se commitea.

### Modo demo

```bash
DEMO_MODE=1
```

Apaga el scraper de precios y sirve el dataset local. El flujo, los canales y la
UI son idénticos, así que la app se ve viva aunque las tiendas bloqueen el
tráfico. Los precios servidos así van marcados `source: "dataset"` — nunca se
presentan como verificados en vivo.

## Probar que está vivo

1. Abre la app en dos ventanas, con dos cuentas, en la misma casa.
2. Agrega un producto en una.
3. En la otra: aparece el item, el total late, baja el chip de salud de la IA y,
   si toca, el swap más barato con el ahorro.
4. Dale a **Verificar precios ahora** y mira cómo llegan las tiendas una por una.

## Datos de demostración

Los precios del catálogo son **promedios aproximados de mercado peruano** y los
valores nutricionales son estimaciones de tablas públicas. No son precios
oficiales de PlazaVea, Tottus, Metro ni Wong, y no deben usarse como referencia
de compra. Están ahí para que la demo tenga con qué comparar.

## Stack

Next.js 16 · React 19 · TypeScript estricto · Tailwind 4 ·
[Portal SDK](https://docs.useportal.co/) (realtime) · Clerk (auth) ·
Supabase Postgres con RLS (datos) · OpenAI (asistente) · `motion/react`.

## Licencia

MIT — ver [LICENSE](LICENSE).

<p align="center"><sub>Hecho en Lima para The Realtime Hackathon by Portal.</sub></p>
