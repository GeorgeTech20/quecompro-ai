-- ===========================================================================
-- 0003_market_prices.sql — QuéCompro.app
--
-- PRECIOS DE MERCADO (registro manual)
--
-- Cuando la compra sale del catálogo (plaza, mercado, puesto propio), el ítem
-- del carrito llega SIN precio: la persona que fue a comprar lo pagó en el
-- momento y lo registra. Cada registro queda acá como historial persistente
-- (sin TTL, a diferencia de price_snapshots) para responder:
--
--   * ¿cuánto estaba este kilo de papa antes y ahora?
--   * ¿cómo varía el precio entre puestos o entre mercados?
--
-- La fila se une al producto por `product_key` cuando el ítem salió de un
-- catálogo; para texto libre se guarda el slug del título (`title`) como clave
-- canónica y la comparación es "mismo título".
-- ===========================================================================

set search_path = public;

create table if not exists public.market_prices (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  -- El ítem del carrito al que pertenecía el registro. Nullable: un registro
  -- puede existir después de borrar la línea.
  cart_item_id  uuid references public.cart_items(id) on delete set null,
  -- Clave canónica del catálogo, o slug del título para cosas fuera de catálogo.
  product_key   text not null,
  title         text not null,
  unit          text not null default 'und',
  price         numeric(10, 2) not null check (price >= 0),
  market        text,
  stall         text,
  note          text,
  recorded_by   uuid references public.profiles(id) on delete set null,
  recorded_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_market_prices_household_key
  on public.market_prices (household_id, product_key, recorded_at desc);

create index if not exists idx_market_prices_household_title
  on public.market_prices (household_id, title);

drop trigger if exists trg_market_prices_updated_at on public.market_prices;
create trigger trg_market_prices_updated_at
  before update on public.market_prices
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- RLS: misma política que las otras tablas privadas. Sin policies permisivas:
-- el único camino de lectura/escritura es el data layer (service role).
-- --------------------------------------------------------------------------
alter table public.market_prices enable row level security;
revoke all on public.market_prices from anon, authenticated;