/**
 * Smoke test de Portal: publica de verdad en un canal y espera el ack.
 *
 * Usa el mismo contrato que la app en producción — publishable key en el
 * socket, token acuñado por Portal con la secret key — así que si esto pasa,
 * el realtime del navegador también puede conectar.
 *
 * Uso: node scripts/portal-smoke-test.mjs [.env.production]
 */
import fs from "node:fs";
import path from "node:path";

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
const publishable = env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY;
const secret = env.PORTAL_SECRET_KEY;

if (!publishable || !secret) {
  console.error(
    `Faltan NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY o PORTAL_SECRET_KEY en ${envFile}.`,
  );
  process.exit(2);
}

/**
 * El token lo acuña Portal. Firmarlo aquí con la secret key da un JWT que se
 * ve correcto y que el edge rechaza con `signature verification failed`.
 */
async function mintToken(userId) {
  const response = await fetch(`${API_URL}/v1/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify({ userId, claims: { name: "Smoke test" }, ttl: "5m" }),
  });
  if (!response.ok) {
    const code = response.headers.get("x-portal-error") ?? `http_${response.status}`;
    const { reason } = await response.json().catch(() => ({}));
    throw new Error(`no se pudo acuñar el token: ${code}${reason ? ` — ${reason}` : ""}`);
  }
  const { token } = await response.json();
  return token;
}

try {
  const { Portal } = await import("@portalsdk/core");
  const token = await mintToken("smoke_test");
  const portal = new Portal({ apiKey: publishable, token });

  const channelId = `smoke:healthcheck:${Date.now()}`;
  console.log(`publishable ${publishable.slice(0, 8)}…  canal ${channelId}`);

  const handle = portal.channel(channelId, { history: "none" });
  handle.acquire();

  const ack = await Promise.race([
    handle.send({ ephemeral: true, content: { ping: "hello" } }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout 5000ms")), 5000)),
  ]);

  console.log("ack:", ack);
  console.log("Smoke test OK: Portal aceptó el mensaje.");
  process.exit(0);
} catch (error) {
  console.error("Smoke test falló:", error instanceof Error ? error.message : String(error));
  if (error?.code) console.error("code:", error.code);
  process.exit(1);
}
