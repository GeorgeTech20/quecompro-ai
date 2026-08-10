-- ===========================================================================
-- 0008_invite_expiry.sql — QuéCompro.app
--
-- Caducidad del enlace de invitación.
--
-- El token tiene 72 bits de entropía, así que adivinarlo está descartado. El
-- problema es otro: no vencía nunca. Un enlace reenviado a un grupo de WhatsApp
-- seguía abriendo la casa meses después, y quien lo tuviera veía el carrito, el
-- presupuesto y el historial de gasto de la familia.
--
-- 7 días: alcanza para que el roomie lo abra cuando pueda, y no tanto como para
-- que sobreviva al reenvío. Quien lo necesite de nuevo lo genera en un clic.
--
-- Las casas que ya existen arrancan con la ventana contada desde ahora: sería
-- peor invalidarles el enlace de golpe sin avisar.
-- ===========================================================================

set search_path = public;

alter table households
  add column if not exists invite_expires_at timestamptz;

comment on column households.invite_expires_at is
  'Cuándo deja de valer invite_token. NULL = sin caducidad (datos previos a 0008).';

-- A las filas existentes se les da la ventana completa desde el despliegue.
update households
   set invite_expires_at = now() + interval '7 days'
 where invite_token is not null
   and invite_expires_at is null;

-- Buscar por token ya usa el índice único de invite_token; este acompaña al
-- filtro por vencimiento cuando haya que barrer los caducados.
create index if not exists households_invite_expires_idx
  on households (invite_expires_at)
  where invite_token is not null;
