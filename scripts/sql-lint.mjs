/**
 * Revisa las migraciones antes de pegarlas en el editor de Supabase.
 *
 * Existe por un error concreto: la 0007 añadió un argumento a
 * `bump_rate_limit` y el `revoke` de abajo se quedó con la firma vieja. Postgres
 * aborta el script entero por eso, y como el editor lo envuelve en una
 * transacción, la migración no aplica nada — ni la tabla, ni las funciones. El
 * mensaje que devuelve (`function ... does not exist`) señala al revoke, no a
 * la causa, así que es fácil perder un rato buscando en el sitio equivocado.
 *
 * Comprueba tres cosas:
 *   1. Cada `revoke`/`comment` sobre función apunta a una firma que se crea ahí.
 *   2. Cada tabla creada lleva su `revoke` (convención de 0002 y 0003: RLS
 *      decide qué filas, el grant decide si puede intentarlo siquiera).
 *   3. Cada tabla creada tiene RLS activado.
 *
 * Uso: node scripts/sql-lint.mjs [archivo.sql ...]   (por defecto, todas)
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "supabase/migrations";

const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : fs
        .readdirSync(DIR)
        .filter((f) => f.endsWith(".sql"))
        .map((f) => path.join(DIR, f));

const squash = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();

/** Los tipos de una lista de parámetros: `p_subject text` → `text`. */
const paramTypes = (raw) =>
  raw
    .split(",")
    .map((arg) => squash(arg).split(/\s+/).slice(1).join(" "))
    .filter(Boolean)
    .join(", ");

/** Los tipos de una lista de referencia: `text, text` → `text, text`. */
const refTypes = (raw) =>
  raw
    .split(",")
    .map(squash)
    .filter(Boolean)
    .join(", ");

let problemas = 0;

/**
 * Las tablas se miran contra TODAS las migraciones, no contra el archivo suelto.
 * En este repo la 0001 crea el esquema y la 0002 le pone RLS y los grants, así
 * que exigirlo por archivo marcaría diez falsos positivos y el linter dejaría
 * de leerse.
 */
const corpus = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(DIR, f), "utf8"))
  .join("\n");

for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  const nombre = path.basename(file);

  const funciones = new Map();
  for (const m of sql.matchAll(
    /create\s+(?:or\s+replace\s+)?function\s+([\w.]+)\s*\(([^)]*)\)/gi,
  )) {
    funciones.set(m[1].toLowerCase().replace(/^public\./, ""), paramTypes(m[2]));
  }

  const fallos = [];

  // 1. Firmas de revoke y comment.
  for (const [etiqueta, re] of [
    ["revoke", /revoke\s+[\w\s,]+\s+on\s+function\s+([\w.]+)\s*\(([^)]*)\)/gi],
    ["comment", /comment\s+on\s+function\s+([\w.]+)\s*\(([^)]*)\)/gi],
  ]) {
    for (const m of sql.matchAll(re)) {
      const fn = m[1].toLowerCase().replace(/^public\./, "");
      const usados = refTypes(m[2]);
      const creados = funciones.get(fn);
      if (creados === undefined) continue; // definida en otra migración: no opinamos
      if (creados !== usados) {
        fallos.push(
          `${etiqueta} sobre ${fn}: usa (${usados}) pero se crea como (${creados})`,
        );
      }
    }
  }

  // `comment on function` sin lista de argumentos falla si el nombre no es único.
  for (const m of sql.matchAll(/comment\s+on\s+function\s+([\w.]+)\s+is\b/gi)) {
    fallos.push(`comment on function ${m[1]} sin firma: añade la lista de argumentos`);
  }

  // 2 y 3. Tablas: revoke y RLS.
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w.]+)/gi)) {
    const tabla = m[1].toLowerCase().replace(/^public\./, "");
    const revoke = new RegExp(
      String.raw`revoke\s+[\w\s,]+\s+on\s+(?:table\s+)?(?:public\.)?` + tabla + String.raw`\b`,
      "i",
    );
    const rls = new RegExp(
      String.raw`alter\s+table\s+(?:public\.)?` + tabla + String.raw`\s+enable\s+row\s+level\s+security`,
      "i",
    );
    if (!revoke.test(corpus)) fallos.push(`la tabla ${tabla} no tiene revoke en ninguna migración`);
    if (!rls.test(corpus)) fallos.push(`la tabla ${tabla} no habilita RLS en ninguna migración`);
  }

  if (fallos.length === 0) {
    console.log(`ok   ${nombre}`);
  } else {
    console.log(`FALLA ${nombre}`);
    for (const f of fallos) console.log(`       ${f}`);
    problemas += fallos.length;
  }
}

console.log(problemas ? `\n${problemas} problema(s).` : "\nTodas las migraciones coherentes.");
process.exit(problemas ? 1 : 0);
