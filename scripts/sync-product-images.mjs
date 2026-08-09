import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  return fs.readFile(file, "utf8").then((text) => {
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, "");
    }
  });
}

// Cada entrada se valida de forma individual: una foto contiene un solo producto.
const imageSources = {
  "huevos-pardos": {
    url: "https://i.pinimg.com/736x/08/62/45/086245f82b9e52f46f5558c8a2ff7be8.jpg",
    sourcePin: "https://es.pinterest.com/pin/1120129738547063567/",
  },
  "pan-molde-bimbo": {
    url: "https://i.pinimg.com/736x/d0/6a/25/d06a25d589ba74815c0513af31d09b96.jpg",
    sourcePin: "https://es.pinterest.com/pin/507217976802407591/",
  },
  "pollo-entero": {
    url: "https://i.pinimg.com/736x/1a/6a/24/1a6a24fd802275c89a9e5b804336bdd8.jpg",
    sourcePin: "https://www.pinterest.com/pin/9992430418208198/",
  },
};

await loadEnv(path.resolve(".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const bucket = "product-images";
const bucketResult = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: "5MB" });
if (bucketResult.error && !/already exists/i.test(bucketResult.error.message)) throw bucketResult.error;

// Revierte las asignaciones masivas anteriores: un collage de categoria no identifica un producto.
const staleCategoryUrls = ["frutas", "carnes", "verduras"].map(
  (category) => supabase.storage.from(bucket).getPublicUrl(`categories/${category}.png`).data.publicUrl,
);
const cleanup = await supabase.from("products").update({ image_url: null }).in("image_url", staleCategoryUrls);
if (cleanup.error) throw cleanup.error;
console.log(JSON.stringify({ removedCategoryFallbacks: staleCategoryUrls.length }));

for (const [productKey, source] of Object.entries(imageSources)) {
  const response = await fetch(source.url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${productKey}: descarga HTTP ${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`${productKey}: el recurso no es una imagen (${contentType})`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const objectPath = `products/${productKey}.jpg`;
  const upload = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (upload.error) throw upload.error;

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
  const update = await supabase.from("products").update({ image_url: publicUrl }).eq("product_key", productKey);
  if (update.error) throw update.error;
  console.log(JSON.stringify({ productKey, publicUrl, sourcePin: source.sourcePin, bytes: bytes.length }));
}

console.log("Sincronizacion de imagenes completada.");
