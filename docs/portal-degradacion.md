# Portal — degradación sin key (estado hoy)

Verificado el 2026-08-08 contra `.env.local`: la app **no crashea** con Portal sin
configurar, ni antes ni después del login. La capa realtime degrada limpio en las
cuatro capas por donde podría reventar:

1. **Constructor** — `getPortalClient()` hace `new Portal({ apiKey: "" })`. El
   constructor del SDK es pasivo (guarda config, cero red, cero validación): no
   lanza con la key vacía.
2. **Provider** — `<PortalProvider>` solo publica el cliente en contexto; no abre
   socket ni resuelve token al montar. Montar `RealtimeProvider` tras login es
   inofensivo.
3. **Cliente** — al montar un hook, `acquire()` intenta conectar; con publishable
   vacía el SDK va a `status: "blocked"` (terminal, sin loop de reconexión). Los
   consumidores leen `status` y `presence?` de forma defensiva (discriminando por
   `presence.kind`, `presence?.count ?? 0`), y `PortalBoundary` es la red de
   seguridad ante cualquier throw de render. Resultado: pantallas usables, sin
   updates en vivo entre pestañas.
4. **Servidor** — `server-publish.ts` calcula `PORTAL_SECRET_KEY ||
   NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY`; ambas vacías ⇒ `serverPortal()` se
   auto-desactiva (`disabled = true`) y `publishToChannel` devuelve
   `{ ok: false, reason: "portal-not-configured" }` sin lanzar. La IA y el chequeo
   de precios responden por HTTP (rama `publishedToChannel === false`).

## Qué key falta para que el portal muestre funciones vivas

- **`NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY` (vacía hoy)** es la única bloqueante: sin
  ella el cliente del navegador queda en `blocked` y no hay presencia ni carrito
  vivo entre pestañas. Ponla (`pk_portal_…`) y el criterio de dos pestañas pasa.
- `PORTAL_SECRET_KEY` (vacía) es opcional: el publisher del servidor cae a la
  publishable. `PORTAL_TOKEN_SECRET` ya está seteada, así que `/api/portal-token`
  emite JWT válido.

## Activación segura (sin descargas, sin procesos peligrosos)

Para validar configuración de Portal **solo en local** (sin llamar red, sin instalar
nada), corre:

```bash
pnpm portal:doctor
```

Ese chequeo:

- solo lee `.env.local`,
- no imprime valores sensibles,
- no ejecuta scrapers ni sockets,
- y falla con exit code 1 si falta la variable bloqueante.
