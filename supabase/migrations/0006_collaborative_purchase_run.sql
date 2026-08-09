-- Estado compartido de la compra física y evidencia opcional.

set search_path = public;

alter table public.cart_items
  add column if not exists purchased_at timestamptz,
  add column if not exists purchased_by uuid references public.profiles(id) on delete set null,
  add column if not exists purchase_photo_path text;

create index if not exists idx_cart_items_household_purchased
  on public.cart_items (household_id, purchased_at desc)
  where purchased_at is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'purchase-evidence',
  'purchase-evidence',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
