import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase de **navegador**. Usa la anon key, que es pública por
 * diseño (viaja en el bundle), y por eso solo alcanza lo que las policies de
 * `0002_rls.sql` dejan leer: el catálogo — products, nutrition, recipes,
 * recipe_ingredients.
 *
 * El carrito, el gasto y los perfiles NO se leen desde aquí: esas tablas no
 * tienen policy permisiva y devolverían cero filas. Van por API route, que es
 * donde vive la service role key y donde se verifica la membresía.
 *
 * Nunca importes `server.ts` desde un componente de cliente: este es su par.
 */
let browser: SupabaseClient | undefined;

export function supabaseBrowser(): SupabaseClient {
  if (!browser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env.local.",
      );
    }
    browser = createClient(url, key, {
      // Clerk maneja la sesión; Supabase aquí es solo lectura de catálogo.
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browser;
}
