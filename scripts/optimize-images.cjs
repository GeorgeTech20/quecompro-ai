const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC = path.join(__dirname, "..", "public");

const targets = [
  { src: "hero/food/opt/01.png", out: "hero/food/opt/01.webp" },
  { src: "hero/food/opt/02.png", out: "hero/food/opt/02.webp" },
  { src: "hero/food/opt/03.png", out: "hero/food/opt/03.webp" },
  { src: "hero/food/opt/04.png", out: "hero/food/opt/04.webp" },
  { src: "hero/food/opt/06.png", out: "hero/food/opt/06.webp" },
  { src: "hero/food/opt/07.png", out: "hero/food/opt/07.webp" },
  { src: "hero/food/opt/08.png", out: "hero/food/opt/08.webp" },
  { src: "hero/food/opt/09.png", out: "hero/food/opt/09.webp" },
  { src: "hero/food/opt/10.png", out: "hero/food/opt/10.webp" },
  { src: "hero/onboarding-food.png", out: "hero/onboarding-food.webp" },
  { src: "hero/cart.png", out: "hero/cart.webp" },
];

async function main() {
  for (const t of targets) {
    const srcPath = path.join(PUBLIC, t.src);
    const outPath = path.join(PUBLIC, t.out);
    if (!fs.existsSync(srcPath)) {
      console.log(`SKIP (no existe): ${t.src}`);
      continue;
    }
    const inSize = fs.statSync(srcPath).size;
    const img = sharp(srcPath);
    const meta = await img.metadata();
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(meta.width, meta.height));
    const width = scale < 1 ? Math.round(meta.width * scale) : undefined;
    const height = scale < 1 ? Math.round(meta.height * scale) : undefined;
    let builder = img.resize(width, height, { fit: "inside", withoutEnlargement: true });
    await builder.webp({ quality: 80, effort: 4 }).toFile(outPath);
    const out = fs.statSync(outPath).size;
    console.log(
      `${t.src} -> ${t.out}  ${(inSize / 1024).toFixed(0)}KB -> ${(out / 1024).toFixed(0)}KB  (${meta.width}x${meta.height}${meta.hasAlpha ? " alpha" : ""})`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});