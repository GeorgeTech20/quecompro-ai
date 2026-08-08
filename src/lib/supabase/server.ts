import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase de servidor. Usa la service role key, así que **salta RLS**:
 * solo puede importarse desde API routes y server actions ("server-only" hace
 * fallar el build si alguien lo arrastra a un componente de cliente).
 *
 * Quien lo use es responsable de filtrar por household: la base ya no lo hace.
 */
let admin: SupabaseClient | undefined;

export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Copia .env.example a .env.local.",
      );
    }
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
