const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC = path.join(__dirname, "..", "public");

const files = [
  "hero/food/opt/01.webp",
  "hero/food/opt/02.webp",
  "hero/food/opt/03.webp",
  "hero/food/opt/04.webp",
  "hero/food/opt/06.webp",
  "hero/food/opt/07.webp",
  "hero/food/opt/08.webp",
  "hero/food/opt/09.webp",
  "hero/food/opt/10.webp",
  "hero/onboarding-food.webp",
];

async function main() {
  const out = new Map();
  for (const f of files) {
    const p = path.join(PUBLIC, f);
    if (!fs.existsSync(p)) continue;
    const buf = await sharp(p).resize(20, 20, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
    out.set(f, `data:image/webp;base64,${buf.toString("base64")}`);
  }
  const code = `/* Generado por scripts/generate-blurs.cjs — no editar a mano. */
export const BLUR = ${JSON.stringify(Object.fromEntries(out), null, 2)} as const;
`;
  fs.writeFileSync(path.join(__dirname, "..", "src/components/landing/hero/blurs.ts"), code);
  console.log("blurs.ts escrito con", out.size, "placeholders");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});