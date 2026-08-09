/**
 * Portal doctor — comprueba de punta a punta que el realtime puede funcionar.
 *
 * 1. Formato de las variables (comillas, BOM, espacios: los tres clásicos al
 *    pegar valores en el panel de Vercel).
 * 2. `POST /v1/tokens` con la secret key — el único modo válido de obtener un
 *    token de usuario. Firmar un JWT a mano no sirve: Portal verifica la firma
 *    contra la clave del environment, que no es la secret key.
 * 3. Handshake real de WebSocket contra el edge, con la publishable key y el
 *    token recién acuñado, mandando el Origin de producción.
 *
 * Uso:
 *   node scripts/portal-doctor.mjs                  # .env.local
 *   node scripts/portal-doctor.mjs .env.production
 *   node scripts/portal-doctor.mjs .env.production --origin https://quecomproo.app
 *
 * Nunca imprime un secreto: solo prefijo, longitud y el veredicto.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const originFlag = args.indexOf("--origin");
const origin = originFlag >= 0 ? args[originFlag + 1] : "https://quecomproo.app";
const envFile = args.find((a) => !a.startsWith("--") && a !== origin) ?? ".env.local";

const API_URL = process.env.PORTAL_API_URL ?? "https://api.useportal.co";
const REALTIME_URL = process.env.PORTAL_REALTIME_URL ?? "https://realtime.useportal.co";

const REQUIRED = ["NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY", "PORTAL_SECRET_KEY"];
const OPTIONAL = ["PORTAL_ENV_ID"];
/** Ya no se usa: el token lo firma Portal, no nosotros. */
const OBSOLETE = ["PORTAL_TOKEN_SECRET", "PORTAL_JWT_SECRET", "PORTAL_SIGNING_SECRET"];

const CONTROL = new RegExp("[\\u0000-\\u001f\\u007f]");

function parseEnvFile(filePath) {
  const out = new Map();
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8").replace(new RegExp("^\\ufeff"), "");
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const eq = raw.indexOf("=");
    if (eq < 0) continue;
    out.set(raw.slice(0, eq).trim(), raw.slice(eq + 1));
  }
  return out;
}

function clean(value) {
  if (value === undefined) return undefined;
  const v = value
    .replace(new RegExp("^\\ufeff"), "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  return v.length > 0 ? v : undefined;
}

const problems = [];
const warnings = [];
const say = (icon, line) => console.log(`${icon} ${line}`);

// --- 1. Formato ------------------------------------------------------------

const envPath = path.resolve(process.cwd(), envFile);
console.log(`Portal doctor — ${envPath}`);
console.log(`  control plane: ${API_URL}`);
console.log(`  realtime edge: ${REALTIME_URL}`);
console.log(`  origin de prueba: ${origin}\n`);

if (!fs.existsSync(envPath)) {
  say("x", `No existe ${envFile}.`);
  process.exit(1);
}

const raw = parseEnvFile(envPath);
const env = {};

for (const key of [...REQUIRED, ...OPTIONAL]) {
  const rawValue = raw.get(key);
  if (rawValue === undefined) {
    if (REQUIRED.includes(key)) {
      problems.push(`${key} falta`);
      say("x", `${key}: FALTA`);
    } else {
      say("-", `${key}: no definida (opcional)`);
    }
    continue;
  }
  const value = clean(rawValue);
  env[key] = value;

  const flags = [];
  if (/^["']|["']$/.test(rawValue.trim())) flags.push("comillas");
  if (rawValue !== rawValue.trim()) flags.push("espacios");
  if (CONTROL.test(rawValue)) flags.push("carácter de control");
  if (new RegExp("\\ufeff").test(rawValue)) flags.push("BOM");

  if (!value) {
    problems.push(`${key} está vacía`);
    say("x", `${key}: VACÍA`);
  } else if (flags.length) {
    warnings.push(`${key} tiene ${flags.join(" + ")} — quítalos también en Vercel`);
    say("!", `${key}: ${value.slice(0, 7)}… len=${value.length} — ${flags.join(" + ")}`);
  } else {
    say("v", `${key}: ${value.slice(0, 7)}… len=${value.length}`);
  }
}

for (const key of OBSOLETE) {
  if (raw.has(key)) {
    warnings.push(`${key} ya no se usa: el token lo acuña Portal. Bórrala aquí y en Vercel.`);
    say("!", `${key}: obsoleta, ya no se usa`);
  }
}

const publishable = env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY;
const secret = env.PORTAL_SECRET_KEY;
if (publishable && !publishable.startsWith("pk_")) {
  problems.push("NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY no empieza por pk_");
}
if (secret && !secret.startsWith("sk_")) {
  problems.push("PORTAL_SECRET_KEY no empieza por sk_");
}
if (secret && secret.startsWith("pk_")) {
  problems.push("PORTAL_SECRET_KEY tiene una publishable key: no puede acuñar tokens");
}

if (problems.length) {
  console.log("");
  for (const p of problems) say("x", p);
  process.exit(1);
}

// --- 2. Acuñar el token ----------------------------------------------------

console.log("\nAcuñando token de prueba…");

async function portalError(response) {
  const code = response.headers.get("x-portal-error") ?? `http_${response.status}`;
  let reason;
  try {
    ({ reason } = await response.json());
  } catch {
    // El borde puede responder sin JSON.
  }
  return `${code}${reason ? ` — ${reason}` : ""}`;
}

let token;
const mint = await fetch(`${API_URL}/v1/tokens`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
  body: JSON.stringify({ userId: "portal_doctor", claims: { name: "Doctor" }, ttl: "5m" }),
});

if (!mint.ok) {
  say("x", `POST /v1/tokens → ${mint.status} ${await portalError(mint)}`);
  if (mint.status === 401) {
    say("", "  La secret key es desconocida o está revocada. Genera una nueva en el dashboard.");
  }
  if (mint.status === 403) {
    say("", "  403 con secret key suele ser una petición con cabecera Origin (nunca desde el navegador).");
  }
  process.exit(1);
}

({ token } = await mint.json());
const kid = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8")).kid;
say("v", `token acuñado, environment ${kid}`);

if (env.PORTAL_ENV_ID && env.PORTAL_ENV_ID !== kid) {
  warnings.push(`PORTAL_ENV_ID (${env.PORTAL_ENV_ID}) no coincide con el environment del token (${kid})`);
  say("!", "PORTAL_ENV_ID no coincide con el environment de la secret key");
}

// --- 3. Handshake real -----------------------------------------------------

console.log("\nProbando el handshake de WebSocket…");

/**
 * `fetch` no puede pedir un upgrade, así que hablamos HTTP a mano sobre TLS.
 * Un GET normal a estas rutas devuelve 404 aunque existan: el edge solo
 * responde a peticiones con las cabeceras de upgrade.
 */
async function handshake(pathname) {
  const { connect } = await import("node:tls");
  const url = new URL(pathname, REALTIME_URL);
  url.searchParams.set("v", "1");
  url.searchParams.set("token", token);
  url.searchParams.set("key", publishable);

  return new Promise((resolve) => {
    const socket = connect({ host: url.hostname, port: 443, servername: url.hostname }, () => {
      socket.write(
        [
          `GET ${url.pathname}${url.search} HTTP/1.1`,
          `Host: ${url.hostname}`,
          "Connection: Upgrade",
          "Upgrade: websocket",
          "Sec-WebSocket-Version: 13",
          "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
          `Origin: ${origin}`,
          "",
          "",
        ].join("\r\n"),
      );
    });

    let buffer = "";
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(10_000, () => done({ status: 0, detail: "timeout" }));
    socket.on("error", (error) => done({ status: 0, detail: error.message }));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (!buffer.includes("\r\n\r\n")) return;
      const status = Number(/^HTTP\/1\.1 (\d+)/.exec(buffer)?.[1] ?? 0);
      const code = /x-portal-error:\s*(\S+)/i.exec(buffer)?.[1];
      const reason = /"reason":"([^"]*)"/.exec(buffer)?.[1];
      done({ status, detail: [code, reason].filter(Boolean).join(" — ") });
    });
  });
}

const targets = [
  ["inbox", "/inbox"],
  ["canal", `/v1/channels/${encodeURIComponent("portal:doctor")}`],
];

let handshakeFailed = false;
for (const [label, pathname] of targets) {
  const { status, detail } = await handshake(pathname);
  if (status === 101) {
    say("v", `${label}: 101 Switching Protocols`);
  } else {
    handshakeFailed = true;
    say("x", `${label}: ${status || "sin respuesta"} ${detail}`);
    if (detail.includes("invalid_api_key")) {
      say("", "  La publishable key es desconocida o revocada, o es de otro environment que la secret key.");
    }
    if (detail.includes("signature verification failed")) {
      say("", "  El token no lo acuñó Portal. /api/portal-token debe llamar a POST /v1/tokens.");
    }
  }
}

// --- Veredicto -------------------------------------------------------------

console.log("");
for (const w of warnings) say("!", w);

if (handshakeFailed) {
  say("x", "Realtime NO funcionaría con estas variables.");
  process.exit(1);
}

say("v", `Realtime OK: token válido y edge aceptando conexiones desde ${origin}.`);
process.exit(0);
