import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad.
 *
 * `frame-ancestors` es la que importa aquí y no es teórica: sin ella, un sitio
 * cualquiera puede meter `/app/collab` en un iframe transparente sobre un
 * señuelo. La víctima ya tiene sesión de Clerk, y como el clic ocurre dentro
 * del origen real, la comprobación de `Origin` que hacen los server actions no
 * lo detiene: dos clics guiados y le sacaron un roomie de su casa.
 *
 * `X-Frame-Options` va junto con `frame-ancestors` porque no todos los
 * navegadores en uso entienden la segunda.
 *
 * Falta una CSP completa con `script-src`: Clerk y Portal inyectan scripts y
 * eso necesita nonces por petición, que es otro trabajo. `frame-ancestors`
 * sola cierra el agujero grave y no rompe nada.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Los enlaces de invitación son `/invite/{token}` y el token ES la
  // credencial. Sin política, algunos navegadores mandan la URL completa en el
  // `Referer` al salir a un tercero, y ahí se va la invitación.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // `camera=(self)` a propósito: la evidencia de compra se toma con la cámara.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  // Vercel manda HSTS sin `includeSubDomains`, así que un subdominio sin TLS
  // deja colar una cookie al dominio padre.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // No hace falta anunciar con qué está hecho.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Fotos de hasta 8 MB más el overhead de multipart/form-data.
      bodySizeLimit: "9mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
