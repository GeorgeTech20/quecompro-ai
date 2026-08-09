-- Plan diario compartido de la casa.

set search_path = public;

create table if not exists public.meal_plans (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by   uuid references public.profiles(id) on delete set null,
  plan_date    date not null,
  meal_type    text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  title        text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (household_id, plan_date, meal_type)
);

create index if not exists idx_meal_plans_household_date
  on public.meal_plans (household_id, plan_date);

drop trigger if exists trg_meal_plans_updated_at on public.meal_plans;
create trigger trg_meal_plans_updated_at
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

alter table public.meal_plans enable row level security;
revoke insert, update, delete on public.meal_plans from anon, authenticated;
