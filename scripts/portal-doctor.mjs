import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    out[key] = value;
  }
  return out;
}

const env = parseEnv(envPath);

function state(key) {
  if (!(key in env)) return "MISSING";
  return env[key] ? "SET" : "EMPTY";
}

const required = ["NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY", "PORTAL_TOKEN_SECRET"];
const optional = ["PORTAL_SECRET_KEY"];

console.log("Portal doctor (local-only, sin red, sin descargas)");
console.log(`Archivo: ${envPath}`);
for (const key of required) console.log(`${key}: ${state(key)}`);
for (const key of optional) console.log(`${key}: ${state(key)} (opcional)`);

const missingRequired = required.some((key) => state(key) !== "SET");
if (missingRequired) {
  console.log(
    "Estado: INCOMPLETO. Portal realtime seguirá en modo degradado hasta completar variables requeridas.",
  );
  process.exit(1);
}

console.log("Estado: OK. Variables mínimas presentes para activar Portal en cliente + token.");
