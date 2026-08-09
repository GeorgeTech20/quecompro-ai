-- Core de producto: notas compartidas, perfil de onboarding y racha saludable.

set search_path = public;

alter table public.cart_items
  add column if not exists note text;

alter table public.profiles
  add column if not exists occupation text,
  add column if not exists shopping_goals text[] not null default '{}';

create table if not exists public.meal_logs (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  meal_date    date not null default current_date,
  meal_type    text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  health_grade text not null default 'A' check (health_grade in ('A', 'B', 'C', 'D')),
  title        text not null,
  components   text[] not null default '{}',
  evidence_type text not null default 'photo' check (evidence_type in ('photo')),
  evidence_path text not null,
  verified_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (profile_id, meal_date, meal_type)
);

create index if not exists idx_meal_logs_household_date
  on public.meal_logs (household_id, meal_date desc);

create index if not exists idx_meal_logs_profile_date
  on public.meal_logs (profile_id, meal_date desc);

drop trigger if exists trg_meal_logs_updated_at on public.meal_logs;
create trigger trg_meal_logs_updated_at
  before update on public.meal_logs
  for each row execute function public.set_updated_at();

alter table public.meal_logs enable row level security;
revoke insert, update, delete on public.meal_logs from anon, authenticated;

-- Evidencia privada de la comida. La aplicación escribe con service role y
-- nunca expone una URL pública del archivo original.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-evidence',
  'meal-evidence',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
