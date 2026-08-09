/**
 * QA de Portal: reproduce lo que hace el navegador y compara el flujo VIEJO
 * (JWT firmado por nosotros) contra el NUEVO (token acuñado por Portal).
 *
 * Monta el mismo `@portalsdk/core` que corre en el browser, con la misma
 * publishable key, los mismos ids de canal y las mismas opciones (`history`),
 * y registra las transiciones de `status` — que es literalmente lo que pinta
 * el ConnectionBadge ("Reconectando…" vs "En vivo").
 *
 * Uso: node scripts/portal-qa.mjs [.env.production]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { Portal } from "@portalsdk/core";

const envFile = process.argv[2] ?? ".env.production";
const API_URL = process.env.PORTAL_API_URL ?? "https://api.useportal.co";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8").replace(new RegExp("^\\ufeff"), "");
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const eq = raw.indexOf("=");
    if (eq < 0) continue;
    out[raw.slice(0, eq).trim()] = raw
      .slice(eq + 1)
      .replace(new RegExp("^\\ufeff"), "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim();
  }
  return out;
}

const env = loadEnv(path.resolve(process.cwd(), envFile));
const PK = env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY;
const SK = env.PORTAL_SECRET_KEY;
const ENV_ID = env.PORTAL_ENV_ID;

if (!PK || !SK) {
  console.error(`Faltan credenciales de Portal en ${envFile}.`);
  process.exit(2);
}

/** Id de prueba: nunca un id real de Clerk, esto se commitea. */
const USER_ID = "user_qa_portal";
const HOUSEHOLD = "qa-household";
/** Mismos ids que arma `channels.*` en la app. */
const CART_CHANNEL = `cart:update:${HOUSEHOLD}`;

const base64url = (input) => Buffer.from(input).toString("base64url");

/** El bug original: firmar el JWT nosotros mismos con la secret key. */
function selfSignedToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: ENV_ID }));
  const payload = base64url(
    JSON.stringify({ sub: USER_ID, name: "Jorge", iat: now, exp: now + 3600 }),
  );
  const signature = crypto
    .createHmac("sha256", SK)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/** El arreglo: pedirle el token a Portal. */
async function mintedToken() {
  const response = await fetch(`${API_URL}/v1/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SK}` },
    body: JSON.stringify({
      userId: USER_ID,
      claims: { name: "Jorge", avatarUrl: "https://img.clerk.com/qa" },
      ttl: "1h",
    }),
  });
  if (!response.ok) {
    const code = response.headers.get("x-portal-error") ?? `http_${response.status}`;
    throw new Error(`mint ${response.status} ${code}`);
  }
  const { token } = await response.json();
  return token;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Un escenario completo: abre canal + inbox como hace la app autenticada,
 * espera, y devuelve todo lo observado.
 */
async function runScenario(label, tokenProvider) {
  console.log(`\n──────── ${label} ────────`);

  const portal = new Portal({ apiKey: PK, token: tokenProvider });
  const statuses = [];
  const errors = [];
  const received = [];

  const channel = portal.channel(CART_CHANNEL, { history: 50 });
  channel.on("status", (status, error) => {
    statuses.push(status);
    if (error) errors.push(`${status}: ${error.code}`);
    console.log(`  canal → ${status}${error ? ` (${error.code})` : ""}`);
  });
  channel.on("message", (message) => received.push(message));
  channel.acquire();

  // El inbox no tiene `acquire()`: se conecta en la primera suscripción, que
  // es lo que hace `useInbox()` al montarse.
  const inbox = portal.inbox();
  const inboxStatuses = [];
  inbox.on("status", (status, error) => {
    inboxStatuses.push(status);
    if (error) errors.push(`inbox ${status}: ${error.code}`);
    console.log(`  inbox → ${status}${error ? ` (${error.code})` : ""}`);
  });
  const unsubscribeInbox = inbox.subscribe(() => {});

  // Ventana generosa: el SDK reintenta con backoff, así que un fallo real
  // deja rastro de más de un ciclo aquí dentro.
  await sleep(6000);

  let sendResult;
  try {
    const ack = await Promise.race([
      channel.send({ content: { type: "qa-ping", at: Date.now() } }),
      sleep(5000).then(() => Promise.reject(new Error("timeout 5000ms"))),
    ]);
    sendResult = `ok (${ack.id})`;
  } catch (error) {
    sendResult = `FALLÓ — ${error instanceof Error ? error.message : String(error)}`;
  }

  await sleep(1500);

  const result = {
    channelStatus: channel.status,
    inboxStatus: inbox.status,
    me: channel.me,
    statuses,
    inboxStatuses,
    errors,
    sendResult,
    received: received.length,
  };

  channel.release();
  unsubscribeInbox();

  return result;
}

/** Lo que mostraría el ConnectionBadge con ese estado. */
const BADGE = {
  idle: "Sin conectar",
  connecting: "Conectando…",
  ready: "En vivo",
  reconnecting: "Reconectando…",
  degraded: "En vivo",
  "degraded-http": "Reconectando…",
  blocked: "Sin tiempo real",
};

function report(label, result) {
  console.log(`\n  RESULTADO ${label}`);
  console.log(`    estado final canal : ${result.channelStatus}`);
  console.log(`    badge que se vería : "${BADGE[result.channelStatus] ?? result.channelStatus}"`);
  console.log(`    estado final inbox : ${result.inboxStatus}`);
  console.log(`    identidad (me)     : ${result.me ? `${result.me.id} anon=${result.me.anon}` : "sin identidad"}`);
  console.log(`    publicar           : ${result.sendResult}`);
  console.log(`    mensajes recibidos : ${result.received}`);
  console.log(`    errores            : ${result.errors.length ? result.errors.join(", ") : "ninguno"}`);
}

/**
 * Lo que de verdad importa para el usuario: que el cambio de un roomie llegue
 * al otro sin recargar. Dos clientes distintos, un canal, un mensaje.
 */
async function runFanOut() {
  console.log("\n──────── FAN-OUT — dos roomies en el mismo canal ────────");

  const channelId = `cart:update:${HOUSEHOLD}-fanout-${Date.now()}`;

  async function tokenFor(userId, name) {
    const response = await fetch(`${API_URL}/v1/tokens`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SK}` },
      body: JSON.stringify({ userId, claims: { name }, ttl: "1h" }),
    });
    const { token } = await response.json();
    return token;
  }

  const jorge = new Portal({ apiKey: PK, token: () => tokenFor("user_qa_jorge", "Jorge") });
  const ana = new Portal({ apiKey: PK, token: () => tokenFor("user_qa_ana", "Ana") });

  const chJorge = jorge.channel(channelId, { history: 50 });
  const chAna = ana.channel(channelId, { history: 50 });

  const anaRecibio = [];
  chAna.on("message", (message) => anaRecibio.push(message));

  chJorge.acquire();
  chAna.acquire();
  await sleep(4000);

  console.log(`  Jorge: ${chJorge.status} / Ana: ${chAna.status}`);

  const ack = await chJorge.send({
    content: { type: "item-added", name: "Pollo entero", price: 12.5 },
  });
  console.log(`  Jorge publica → ${ack.id}`);

  await sleep(3000);

  const presencia = chAna.presence;
  const online =
    presencia && "users" in presencia ? presencia.users.length : (presencia?.count ?? 0);

  console.log(`  Ana recibió    : ${anaRecibio.length} mensaje(s)`);
  console.log(`  contenido      : ${JSON.stringify(anaRecibio[0]?.content ?? null)}`);
  const sender = anaRecibio[0]?.sender;
  console.log(`  autor visto    : ${sender ? `${sender.id} anon=${sender.anon}` : "?"}`);
  console.log(`  presencia (Ana): ${online} usuario(s) en línea`);

  chJorge.release();
  chAna.release();

  return {
    ok: anaRecibio.length === 1 && chJorge.status === "ready" && chAna.status === "ready",
    online,
  };
}

const before = await runScenario("ANTES — JWT firmado por la app (código en producción)", () =>
  Promise.resolve(selfSignedToken()),
);
report("ANTES", before);

const after = await runScenario("DESPUÉS — token acuñado por Portal (código corregido)", mintedToken);
report("DESPUÉS", after);

const fanOut = await runFanOut();

console.log("\n════════ VEREDICTO ════════");
const fixed =
  after.channelStatus === "ready" &&
  after.inboxStatus === "ready" &&
  after.errors.length === 0 &&
  after.sendResult.startsWith("ok") &&
  after.me?.anon === false &&
  fanOut.ok;

console.log(`  antes    : badge "${BADGE[before.channelStatus]}", publicar ${before.sendResult}`);
console.log(`  después  : badge "${BADGE[after.channelStatus]}", publicar ${after.sendResult}`);
console.log(`  fan-out  : ${fanOut.ok ? "el otro roomie recibe el cambio" : "NO llega al otro roomie"}`);
console.log(fixed ? "  ✔ El arreglo elimina el estado de reconexión." : "  ✖ Sigue habiendo fallo.");
process.exit(fixed ? 0 : 1);
