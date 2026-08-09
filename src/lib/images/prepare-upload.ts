const DEFAULT_MAX_BYTES = 1_500_000;
const DEFAULT_MAX_EDGE = 1600;

/** Reduce fotografías decodificables antes de enviarlas. */
export async function prepareImageUpload(
  file: File,
  options: { maxBytes?: number; maxEdge?: number } = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;

  if (file.size <= maxBytes || !canCompress(file.type)) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (!blob) continue;
      if (blob.size <= maxBytes || quality === 0.52) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "evidencia";
        return new File([blob], `${baseName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
    return file;
  } finally {
    bitmap.close();
  }
}

function canCompress(type: string): boolean {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
