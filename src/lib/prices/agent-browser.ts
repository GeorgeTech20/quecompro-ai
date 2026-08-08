import "server-only";

import { spawn } from "node:child_process";

/**
 * Envoltorio del CLI `agent-browser` (vercel-labs).
 *
 * Es un navegador de verdad manejado por proceso hijo, así que hay tres raíles
 * de seguridad que NO son opcionales:
 *
 * 1. `--allowed-domains`: el navegador solo puede visitar las cuatro cadenas
 *    peruanas de la lista. Si un producto o un prompt intentara llevarlo a otro
 *    host, el propio CLI lo corta. Sin esto, un título de producto manipulado se
 *    vuelve un SSRF con navegador completo.
 * 2. Nada de `shell: true`. Los argumentos van como array; una comilla en el
 *    nombre de un producto no puede convertirse en un comando.
 * 3. Timeout duro y `kill`: 12 s y el proceso muere. Una tienda lenta no puede
 *    dejar colgada una API route.
 */

export const ALLOWED_DOMAINS = ["tottus.com.pe", "plazavea.com.pe", "metro.pe", "wong.pe"] as const;

export type Store = (typeof ALLOWED_DOMAINS)[number];

/** Tope duro por consulta. Más que esto y la demo se siente muerta. */
export const QUERY_TIMEOUT_MS = 12_000;

const SESSION_NAME = "prices";
const PROBE_TIMEOUT_MS = 3_000;

type RunResult = { ok: true; stdout: string } | { ok: false; error: string };

function binaryCandidates(): string[] {
  const configured = process.env.AGENT_BROWSER_BIN;
  if (configured) return [configured];
  // En Windows el shim de npm es un .cmd; sin shell hay que nombrarlo.
  return process.platform === "win32" ? ["agent-browser.cmd", "agent-browser"] : ["agent-browser"];
}

function runOnce(binary: string, args: string[], timeoutMs: number): Promise<RunResult> {
  return new Promise<RunResult>((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(binary, args, { shell: false, windowsHide: true });
    } catch (error) {
      resolve({ ok: false, error: error instanceof Error ? error.message : "spawn falló" });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ ok: false, error: `timeout ${timeoutMs}ms` });
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      // Techo de memoria: una página larga no puede comerse el proceso.
      if (stdout.length < 400_000) stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < 8_000) stderr += chunk.toString("utf8");
    });

    child.on("error", (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, error: error.message });
    });

    child.on("close", (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve({ ok: true, stdout });
      else resolve({ ok: false, error: stderr.trim() || `exit ${code}` });
    });
  });
}

async function run(args: string[], timeoutMs: number): Promise<RunResult> {
  let lastError = "agent-browser no está instalado";
  for (const binary of binaryCandidates()) {
    const result = await runOnce(binary, args, timeoutMs);
    if (result.ok) return result;
    // ENOENT = ese nombre de binario no existe; se prueba el siguiente candidato.
    if (!/ENOENT|not recognized|no such file/i.test(result.error)) return result;
    lastError = result.error;
  }
  return { ok: false, error: lastError };
}

/** Flags comunes: sesión persistente (cookies, anti-bot) + raíl de dominios. */
function baseArgs(): string[] {
  return ["--session", SESSION_NAME, "--restore", "--allowed-domains", ALLOWED_DOMAINS.join(",")];
}

let availability: boolean | undefined;

/** Se prueba una vez por proceso: si no está el CLI, el flujo se va a dataset. */
export async function isAgentBrowserAvailable(): Promise<boolean> {
  if (availability !== undefined) return availability;
  if (process.env.DEMO_MODE === "1") {
    availability = false;
    return availability;
  }
  const result = await run(["--version"], PROBE_TIMEOUT_MS);
  availability = result.ok;
  if (!result.ok) {
    console.warn(`[prices] agent-browser no disponible (${result.error}); se usará el dataset.`);
  }
  return availability;
}

export async function open(url: string, timeoutMs = QUERY_TIMEOUT_MS): Promise<RunResult> {
  return run([...baseArgs(), "open", url], timeoutMs);
}

export async function read(timeoutMs = QUERY_TIMEOUT_MS): Promise<RunResult> {
  return run([...baseArgs(), "read"], timeoutMs);
}

export async function findText(text: string, timeoutMs = QUERY_TIMEOUT_MS): Promise<RunResult> {
  return run([...baseArgs(), "find", "text", text], timeoutMs);
}

// --- Búsqueda de precio ---------------------------------------------------

/** Solo lo que puede ir en una URL de búsqueda de supermercado. */
export function sanitizeQuery(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

const SEARCH_URL: Record<Store, (query: string) => string> = {
  "tottus.com.pe": (q) => `https://www.tottus.com.pe/search?Ntt=${encodeURIComponent(q)}`,
  "plazavea.com.pe": (q) => `https://www.plazavea.com.pe/search/?_query=${encodeURIComponent(q)}`,
  "metro.pe": (q) => `https://www.metro.pe/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  "wong.pe": (q) => `https://www.wong.pe/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
};

/** Precios peruanos: "S/ 12.90", "S/12,90", "S/. 12.90". */
const PRICE_RE = /S\/\.?\s*([0-9]{1,4}(?:[.,][0-9]{2})?)/g;

export function extractPrices(pageText: string): number[] {
  const found: number[] = [];
  for (const match of pageText.matchAll(PRICE_RE)) {
    const value = Number(match[1]?.replace(",", "."));
    // Bajo S/ 0.5 o sobre S/ 999 casi siempre es basura del layout, no un precio.
    if (Number.isFinite(value) && value >= 0.5 && value <= 999) found.push(value);
  }
  return found;
}

export type ScrapedPrice = { store: Store; price: number };

/**
 * Abre la búsqueda de una tienda y saca el precio más bajo visible. Devuelve
 * `null` ante cualquier problema (Cloudflare, layout cambiado, timeout): el
 * llamador se va al dataset y la demo sigue.
 */
export async function scrapeStorePrice(store: Store, query: string): Promise<ScrapedPrice | null> {
  const clean = sanitizeQuery(query);
  if (!clean) return null;

  const started = Date.now();
  const opened = await open(SEARCH_URL[store](clean), QUERY_TIMEOUT_MS);
  if (!opened.ok) return null;

  const remaining = QUERY_TIMEOUT_MS - (Date.now() - started);
  if (remaining <= 500) return null;

  const page = await read(remaining);
  if (!page.ok) return null;

  // Señal clásica de bloqueo: la página carga pero es un challenge.
  if (/just a moment|cloudflare|verificando que|captcha/i.test(page.stdout)) return null;

  const prices = extractPrices(page.stdout);
  if (prices.length === 0) return null;

  return { store, price: Math.min(...prices) };
}
