import { readFile } from "node:fs/promises";

const [configSource, actionSource] = await Promise.all([
  readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/(app)/app/actions.ts", import.meta.url), "utf8"),
]);

const actionMatch = actionSource.match(
  /MAX_PHOTO_BYTES\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/,
);
if (!actionMatch) throw new Error("No se encontró MAX_PHOTO_BYTES.");

const actionLimit = Number(actionMatch[1]) * 1024 * 1024;
const configMatch = configSource.match(/bodySizeLimit:\s*["'](\d+(?:\.\d+)?)mb["']/i);
const serverLimit = configMatch ? Number(configMatch[1]) * 1024 * 1024 : 1024 * 1024;
const multipartMargin = 32 * 1024;

if (serverLimit < actionLimit + multipartMargin) {
  console.error(
    `FAIL: la UI acepta ${actionLimit} bytes, pero Server Actions solo acepta ${serverLimit} bytes.`,
  );
  process.exit(1);
}

console.log(`PASS: presupuesto de carga ${serverLimit} bytes para fotos de ${actionLimit} bytes.`);
