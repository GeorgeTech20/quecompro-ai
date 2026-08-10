import "server-only";

/**
 * Comprueba que un archivo sea de verdad la imagen que dice ser.
 *
 * El `Content-Type` de un `File` lo pone el navegador a partir de la extensión,
 * así que quien arma la petición a mano lo escribe como quiera: se podía subir
 * cualquier binario de 8 MB etiquetado `image/jpeg`. `prepareImageUpload`
 * decodifica de verdad, pero corre en el cliente y un atacante no la ejecuta.
 * Lo único que no se puede falsear son los primeros bytes.
 *
 * No es antivirus: es la comprobación mínima de que el bucket de evidencia de
 * compra guarda fotos y no almacenamiento gratis de terceros.
 */

export type SniffedType = "image/jpeg" | "image/png" | "image/webp" | "image/heic";

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/** Cuántos bytes hacen falta para decidir. El más largo es HEIC (`ftyp` + marca). */
export const SNIFF_BYTES = 16;

/**
 * Devuelve el tipo real, o `null` si no reconoce la firma.
 *
 * Se aceptan solo los cuatro formatos que el bucket admite. Cualquier otra cosa
 * — incluido un SVG, que es XML y puede llevar script — se rechaza.
 */
export function sniffImageType(bytes: Uint8Array): SniffedType | null {
  // JPEG: FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";

  // WebP: "RIFF" .... "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }

  // HEIC/HEIF: caja "ftyp" en el byte 4, y la marca justo después.
  // Las variantes que produce un iPhone son heic, heix, hevc, mif1 y msf1.
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"].includes(brand)) {
      return "image/heic";
    }
  }

  return null;
}

/**
 * Lee la cabecera del archivo y valida la firma.
 *
 * Devuelve el tipo real — que es el que hay que mandarle a Storage, no el que
 * declaró el navegador.
 */
export async function assertRealImage(
  file: File,
): Promise<{ ok: true; type: SniffedType } | { ok: false; error: string }> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const type = sniffImageType(head);
  if (!type) {
    return { ok: false, error: "Ese archivo no es una foto. Usa JPG, PNG, WebP o HEIC." };
  }
  return { ok: true, type };
}
