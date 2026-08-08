-- ===========================================================================
-- 0002_rls.sql — QuéCompro.app
--
-- MODELO DE SEGURIDAD (léelo antes de tocar una policy)
-- ---------------------------------------------------------------------------
-- Esta app NO usa Supabase Auth. Autentica con **Clerk** y todo el acceso a
-- datos ocurre en el servidor (API routes / server actions) con la
-- SUPABASE_SERVICE_ROLE_KEY. El rol `service_role` **salta RLS por completo**,
-- así que las policies de este archivo no lo afectan: quien filtra por casa es
-- `src/lib/data/*`, que siempre recibe el householdId ya verificado contra la
-- membresía del usuario de Clerk.
--
-- Entonces, ¿para qué RLS? Defensa en profundidad. La anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY) sí viaja al navegador. Si mañana alguien
-- llama a la API REST de Supabase con esa clave, RLS es lo único que decide
-- qué ve. Por eso:
--
--   1. RLS ENABLED en TODAS las tablas, sin excepción.
--   2. `anon` / `authenticated` solo pueden **leer** el catálogo público:
--      products, nutrition, recipes, recipe_ingredients. Nada de escritura.
--   3. Las tablas con datos de la casa — households, profiles, memberships,
--      cart_items, transactions, price_snapshots — NO tienen ninguna policy
--      permisiva. Sin policy + RLS on = cero filas para cualquier rol que no
--      sea service_role. Es intencional.
--
-- Regla dura: una policy `using (true)` sobre cart_items, transactions,
-- profiles, households o memberships expone el carrito y el gasto de todas las
-- casas a cualquiera que tenga la anon key. No la escribas. Si necesitas que
-- el navegador lea datos privados, hazlo pasar por una API route.
--
-- price_snapshots queda del lado privado a propósito: es el resultado del
-- agente de precios (posible scraping) y no queremos publicarlo crudo.
--
-- Al final del archivo quedan, COMENTADAS, las policies equivalentes basadas
-- en `auth.jwt() ->> 'sub'` para el día en que se migre a Supabase Auth o a
-- JWT de terceros (Clerk como third-party auth provider). Se activan quitando
-- el comentario; no requieren cambios de esquema porque `profiles.clerk_id`
-- ya guarda el `sub`.
-- ===========================================================================

set search_path = public;

-- --------------------------------------------------------------------------
-- 1. RLS habilitado en todas las tablas
-- --------------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.profiles          enable row level security;
alter table public.memberships       enable row level security;
alter table public.products          enable row level security;
alter table public.nutrition         enable row level security;
alter table public.cart_items        enable row level security;
alter table public.transactions      enable row level security;
alter table public.recipes           enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.price_snapshots   enable row level security;

-- Aunque RLS ya bloquea, revocamos el privilegio de escritura de los roles
-- públicos sobre el catálogo: cinturón y tirantes.
revoke insert, update, delete on public.products           from anon, authenticated;
revoke insert, update, delete on public.nutrition          from anon, authenticated;
revoke insert, update, delete on public.recipes            from anon, authenticated;
revoke insert, update, delete on public.recipe_ingredients from anon, authenticated;

-- Y les quitamos todo sobre las tablas privadas, para que ni siquiera puedan
-- intentarlo (el error será de permisos, no un 200 con cero filas).
revoke all on public.households   from anon, authenticated;
revoke all on public.profiles     from anon, authenticated;
revoke all on public.memberships  from anon, authenticated;
revoke all on public.cart_items   from anon, authenticated;
revoke all on public.transactions from anon, authenticated;
revoke all on public.price_snapshots from anon, authenticated;

-- --------------------------------------------------------------------------
-- 2. Catálogo público: SOLO lectura, SOLO estas cuatro tablas
-- --------------------------------------------------------------------------
drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists nutrition_public_read on public.nutrition;
create policy nutrition_public_read
  on public.nutrition
  for select
  to anon, authenticated
  using (true);

drop policy if exists recipes_public_read on public.recipes;
create policy recipes_public_read
  on public.recipes
  for select
  to anon, authenticated
  using (true);

drop policy if exists recipe_ingredients_public_read on public.recipe_ingredients;
create policy recipe_ingredients_public_read
  on public.recipe_ingredients
  for select
  to anon, authenticated
  using (true);

-- --------------------------------------------------------------------------
-- 3. Tablas privadas: SIN policies permisivas.
--
-- households, profiles, memberships, cart_items, transactions y
-- price_snapshots quedan con RLS habilitado y cero policies. Efecto: ningún
-- rol salvo service_role (y el owner de la base) ve una sola fila.
--
-- No agregues policies aquí sin leer la sección 4.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 4. FUTURO — policies por JWT (Clerk como third-party auth de Supabase,
--    o migración a Supabase Auth).
--
--    Supuesto: el JWT trae en `sub` el mismo identificador que guardamos en
--    `profiles.clerk_id`. Con eso, `current_profile_id()` traduce el token a
--    un id de perfil y `is_member_of()` resuelve la pertenencia a la casa.
--
--    Para activarlas: descomenta el bloque completo y, en el mismo despliegue,
--    devuelve a anon/authenticated los GRANT que revocamos arriba
--    (select/insert/update/delete según la tabla). Sin GRANT, las policies no
--    hacen nada.
-- --------------------------------------------------------------------------

-- create or replace function public.current_profile_id()
-- returns uuid
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select p.id
--   from public.profiles p
--   where p.clerk_id = (auth.jwt() ->> 'sub')
--   limit 1;
-- $$;
--
-- create or replace function public.is_member_of(target_household uuid)
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select exists (
--     select 1
--     from public.memberships m
--     where m.household_id = target_household
--       and m.user_id = public.current_profile_id()
--   );
-- $$;
--
-- -- profiles: cada quien ve y edita el suyo.
-- create policy profiles_self_read on public.profiles
--   for select to authenticated
--   using (clerk_id = (auth.jwt() ->> 'sub'));
--
-- create policy profiles_self_write on public.profiles
--   for update to authenticated
--   using (clerk_id = (auth.jwt() ->> 'sub'))
--   with check (clerk_id = (auth.jwt() ->> 'sub'));
--
-- -- households: solo las casas donde soy miembro.
-- create policy households_member_read on public.households
--   for select to authenticated
--   using (public.is_member_of(id));
--
-- -- Solo el owner cambia presupuesto/nombre/token de invitación.
-- create policy households_owner_write on public.households
--   for update to authenticated
--   using (exists (
--     select 1 from public.memberships m
--     where m.household_id = households.id
--       and m.user_id = public.current_profile_id()
--       and m.role = 'owner'
--   ))
--   with check (true);
--
-- -- memberships: veo a mis roomies de las casas donde estoy.
-- create policy memberships_member_read on public.memberships
--   for select to authenticated
--   using (public.is_member_of(household_id));
--
-- -- cart_items: leer y escribir solo en mi casa.
-- create policy cart_items_member_read on public.cart_items
--   for select to authenticated
--   using (public.is_member_of(household_id));
--
-- create policy cart_items_member_insert on public.cart_items
--   for insert to authenticated
--   with check (public.is_member_of(household_id));
--
-- create policy cart_items_member_update on public.cart_items
--   for update to authenticated
--   using (public.is_member_of(household_id))
--   with check (public.is_member_of(household_id));
--
-- create policy cart_items_member_delete on public.cart_items
--   for delete to authenticated
--   using (public.is_member_of(household_id));
--
-- -- transactions: lectura e inserción por miembros; nunca update/delete
-- -- (el historial de gasto no se reescribe).
-- create policy transactions_member_read on public.transactions
--   for select to authenticated
--   using (public.is_member_of(household_id));
--
-- create policy transactions_member_insert on public.transactions
--   for insert to authenticated
--   with check (public.is_member_of(household_id));
--
-- -- price_snapshots: lectura para cualquier sesión autenticada; la escritura
-- -- se queda en el servidor (el agente de precios usa service_role).
-- create policy price_snapshots_read on public.price_snapshots
--   for select to authenticated
--   using (true);
