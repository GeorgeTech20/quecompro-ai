-- ===========================================================================
-- 0001_schema.sql — QueCompro.ai
--
-- Esquema base: casas, perfiles (unidos a Clerk), catálogo de productos,
-- carrito compartido, historial de gasto, recetas y caché de precios.
--
-- Notas de diseño:
--  * gen_random_uuid() es core desde Postgres 13, no hace falta pgcrypto.
--  * Un perfil puede vivir en varias casas: la pertenencia está en
--    `memberships`. `profiles.active_household_id` solo recuerda cuál está
--    mirando ahora, no es la fuente de verdad de a qué casas pertenece.
--  * Las tablas se declaran en orden de dependencia: ninguna referencia
--    apunta hacia adelante.
--  * `category` usa claves sin tilde (lacteos, condimentos, ...) porque es una
--    clave de máquina; la UI se encarga de mostrar "Lácteos".
-- ===========================================================================

set search_path = public;

-- Toca updated_at en cada UPDATE. Se engancha por tabla más abajo.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- households — la casa: presupuesto, moneda y token de invitación
-- --------------------------------------------------------------------------
create table if not exists public.households (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(trim(name)) > 0),
  monthly_budget numeric(10, 2) not null default 1200 check (monthly_budget >= 0),
  currency       text not null default 'PEN' check (char_length(currency) = 3),
  -- Token de la ruta pública /invite/[token]. Nullable: una casa puede tener
  -- la invitación cerrada.
  invite_token   text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_households_updated_at on public.households;
create trigger trg_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- profiles — un usuario de Clerk. `clerk_id` es la unión con el proveedor.
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  clerk_id            text unique not null,
  email               text,
  full_name           text,
  avatar_url          text,
  whatsapp_phone      text,
  diet_tags           text[] not null default '{}',
  allergies           text[] not null default '{}',
  -- Casa que está mirando ahora. La pertenencia real vive en `memberships`.
  active_household_id uuid references public.households(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_profiles_active_household
  on public.profiles (active_household_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- memberships — quién vive en qué casa
-- --------------------------------------------------------------------------
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

-- "¿a qué casas pertenece este usuario?" se pregunta en cada request.
create index if not exists idx_memberships_user on public.memberships (user_id);
create index if not exists idx_memberships_household on public.memberships (household_id);

-- --------------------------------------------------------------------------
-- products — catálogo. El mismo producto puede existir en varias tiendas:
-- `product_key` es la identidad canónica y (product_key, store) la fila.
-- --------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  product_key  text not null,
  name         text not null,
  brand        text,
  store        text not null,
  price        numeric(10, 2) not null check (price >= 0),
  unit         text not null default 'und',
  category     text not null,
  image_url    text,
  health_grade text check (health_grade in ('A', 'B', 'C', 'D')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_key, store)
);

create index if not exists idx_products_name on public.products (name);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_product_key on public.products (product_key);
-- Búsqueda por texto libre sin extensiones: ilike sobre lower(name).
create index if not exists idx_products_name_lower on public.products (lower(name));

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- nutrition — macros por 100 g/ml. 1:1 con products.
-- --------------------------------------------------------------------------
create table if not exists public.nutrition (
  product_id uuid primary key references public.products(id) on delete cascade,
  per_grams  integer not null default 100 check (per_grams > 0),
  kcal       numeric(8, 2) not null default 0 check (kcal >= 0),
  protein_g  numeric(8, 2) not null default 0 check (protein_g >= 0),
  carbs_g    numeric(8, 2) not null default 0 check (carbs_g >= 0),
  fat_g      numeric(8, 2) not null default 0 check (fat_g >= 0),
  fiber_g    numeric(8, 2) not null default 0 check (fiber_g >= 0),
  sodium_mg  numeric(10, 2) not null default 0 check (sodium_mg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_nutrition_updated_at on public.nutrition;
create trigger trg_nutrition_updated_at
  before update on public.nutrition
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- cart_items — el carrito vivo de la casa.
-- Se copian title/price/unit/store del producto: si el catálogo cambia de
-- precio mañana, el carrito de hoy no se reescribe solo.
-- --------------------------------------------------------------------------
create table if not exists public.cart_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  title        text not null check (char_length(trim(title)) > 0),
  price        numeric(10, 2) not null check (price >= 0),
  qty          numeric(10, 3) not null default 1 check (qty > 0),
  unit         text not null default 'und',
  store        text,
  category     text,
  health_grade text check (health_grade in ('A', 'B', 'C', 'D')),
  added_by     uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_cart_items_household on public.cart_items (household_id);
create index if not exists idx_cart_items_household_created
  on public.cart_items (household_id, created_at desc);

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- transactions — compras cerradas. `items` guarda el detalle congelado.
-- --------------------------------------------------------------------------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by   uuid references public.profiles(id) on delete set null,
  total        numeric(10, 2) not null check (total >= 0),
  store        text,
  items        jsonb not null default '[]'::jsonb,
  note         text,
  created_at   timestamptz not null default now()
);

-- "gasto del mes de esta casa" = este índice.
create index if not exists idx_transactions_household_created
  on public.transactions (household_id, created_at desc);

-- --------------------------------------------------------------------------
-- recipes — recetas del recetario peruano
-- --------------------------------------------------------------------------
create table if not exists public.recipes (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  steps            text[] not null default '{}',
  time_min         integer not null check (time_min > 0),
  servings         integer not null default 2 check (servings > 0),
  difficulty       text not null default 'facil'
                     check (difficulty in ('facil', 'media', 'dificil')),
  tags             text[] not null default '{}',
  kcal_per_serving integer check (kcal_per_serving >= 0),
  image_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_recipes_difficulty on public.recipes (difficulty);

drop trigger if exists trg_recipes_updated_at on public.recipes;
create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- recipe_ingredients — puente receta ↔ catálogo.
-- `product_id` es nullable a propósito: hay ingredientes (huacatay, pecanas)
-- que no están en el catálogo y aun así deben figurar en la receta.
-- --------------------------------------------------------------------------
create table if not exists public.recipe_ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  qty         numeric(10, 3) not null default 1 check (qty > 0),
  unit        text not null default 'und',
  is_optional boolean not null default false,
  unique (recipe_id, name)
);

create index if not exists idx_recipe_ingredients_recipe
  on public.recipe_ingredients (recipe_id);
-- El match del carrito entra por aquí: "¿qué recetas usan estos productos?"
create index if not exists idx_recipe_ingredients_product
  on public.recipe_ingredients (product_id);

-- --------------------------------------------------------------------------
-- price_snapshots — caché de precios por tienda (TTL de 45 min en la app).
-- --------------------------------------------------------------------------
create table if not exists public.price_snapshots (
  id          uuid primary key default gen_random_uuid(),
  product_key text not null,
  store       text not null,
  price       numeric(10, 2) not null check (price >= 0),
  unit        text not null default 'und',
  source      text not null default 'dataset' check (source in ('live', 'dataset')),
  fetched_at  timestamptz not null default now()
);

-- Lectura típica: el precio más fresco de un producto por tienda.
create index if not exists idx_price_snapshots_lookup
  on public.price_snapshots (product_key, store, fetched_at desc);
