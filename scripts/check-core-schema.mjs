import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const values = {};
  const body = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    values[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
}

const env = loadLocalEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const probes = [
  ["base", () => supabase.from("households").select("id").limit(1)],
  ["onboarding", () => supabase.from("profiles").select("occupation, shopping_goals").limit(1)],
  ["notas", () => supabase.from("cart_items").select("note").limit(1)],
  [
    "rachas",
    () =>
      supabase
        .from("meal_logs")
        .select("id, title, components, evidence_type, evidence_path, verified_at")
        .limit(1),
  ],
];

let failed = false;
for (const [name, query] of probes) {
  const { error } = await query();
  if (error) {
    failed = true;
    console.log(`${name}: ERROR ${error.code ?? "?"} · ${error.message}`);
  } else {
    console.log(`${name}: OK`);
  }
}

process.exitCode = failed ? 1 : 0;
