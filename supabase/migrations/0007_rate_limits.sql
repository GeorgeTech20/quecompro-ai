-- ===========================================================================
-- 0007_rate_limits.sql — QuéCompro.app
--
-- Límite de uso para las rutas que cuestan plata (las tres de IA).
--
-- POR QUÉ EN POSTGRES Y NO EN MEMORIA
-- ---------------------------------------------------------------------------
-- Un contador en un `Map` de Node no sirve en Vercel: cada invocación puede
-- caer en una lambda distinta, cada una con su propio mapa, así que el límite
-- se multiplica por el número de instancias vivas. Hace falta un contador
-- compartido, y la base ya está ahí — sin servicio nuevo, sin secreto nuevo.
--
-- POR QUÉ UNA FUNCIÓN Y NO SELECT + UPDATE
-- ---------------------------------------------------------------------------
-- Leer y después escribir deja una ventana entre ambas: dos peticiones
-- simultáneas leen 19, las dos deciden que pueden, las dos escriben 20. El
-- `insert ... on conflict do update` de abajo es una sola sentencia atómica, y
-- devuelve el contador ya incrementado.
--
-- VENTANAS FIJAS, NO DESLIZANTES
-- ---------------------------------------------------------------------------
-- La ventana se redondea a la hora y al día en curso. Es más tosco que una
-- ventana deslizante (permite un pico a caballo entre dos ventanas), pero cabe
-- en una fila y en una consulta. Para frenar un bucle de abuso alcanza.
-- ===========================================================================

set search_path = public;

create table if not exists rate_limits (
  -- A quién se le cuenta: un perfil o una casa. Va como texto para no atarlo a
  -- una FK — si se borra el perfil, el contador caduca solo con la ventana.
  subject      text        not null,
  -- Qué se está contando: "assistant", "price-check", "evaluate-item".
  bucket       text        not null,
  -- Inicio de la ventana, ya truncado (a la hora o al día).
  window_start timestamptz not null,
  hits         integer     not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (subject, bucket, window_start)
);

comment on table rate_limits is
  'Contadores de uso por ventana fija. Se limpian con delete_expired_rate_limits().';

-- Para el barrido de filas viejas.
create index if not exists rate_limits_window_idx on rate_limits (window_start);

-- ---------------------------------------------------------------------------
-- Incremento atómico
-- ---------------------------------------------------------------------------
-- Devuelve el número de hits DESPUÉS de contar este.
--
-- El límite entra como argumento y la decisión se toma DENTRO de la misma
-- sentencia. La razón: si el contador subiera también cuando se rechaza, cada
-- petición bloqueada empujaría la ventana hacia adelante y bastaría con seguir
-- reintentando para no salir nunca del bloqueo — un roomie dejaría al resto de
-- la casa sin asistente indefinidamente. Al topar en `p_limit`, el rechazado
-- deja de contar y la ventana vence cuando dijo que vencería.
--
-- `search_path` fijado y `security definer`: dejar el search_path abierto en
-- una función definer es la vía clásica de escalada — se planta una tabla
-- homónima en un esquema propio y la función ejecuta contra ella.
create or replace function bump_rate_limit(
  p_subject text,
  p_bucket  text,
  p_window  timestamptz,
  p_limit   integer
)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into rate_limits as rl (subject, bucket, window_start, hits, updated_at)
  values (p_subject, p_bucket, p_window, 1, now())
  on conflict (subject, bucket, window_start)
  do update set
    hits = case when rl.hits >= p_limit then rl.hits else rl.hits + 1 end,
    updated_at = now()
  returning hits;
$$;

comment on function bump_rate_limit(text, text, timestamptz, integer) is
  'Suma 1 al contador salvo que ya esté en el tope, y devuelve el total. Atómico.';

-- ---------------------------------------------------------------------------
-- Limpieza
-- ---------------------------------------------------------------------------
-- Sin esto la tabla crece para siempre. Se llama de forma oportunista desde la
-- app (1 de cada N peticiones) para no depender de un cron.
create or replace function delete_expired_rate_limits(p_before timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limits where window_start < p_before;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Igual que el resto: activado y sin ninguna policy permisiva. Solo
-- service_role toca esta tabla. Un contador que el cliente pueda leer o
-- escribir no es un contador.
alter table rate_limits enable row level security;

-- El `revoke` sobre la tabla va además del RLS, igual que en 0002 y 0003. RLS
-- decide qué filas ve un rol; el grant decide si puede siquiera intentarlo. Las
-- otras tablas privadas llevan los dos y esta no era excepción.
revoke all on public.rate_limits from anon, authenticated;

-- Las firmas tienen que coincidir exactamente con las de arriba, incluido el
-- `p_limit integer` que se añadió después: `revoke` sobre una firma que no
-- existe aborta el script entero y deja la migración sin aplicar.
revoke all on function bump_rate_limit(text, text, timestamptz, integer) from public, anon, authenticated;
revoke all on function delete_expired_rate_limits(timestamptz) from public, anon, authenticated;
