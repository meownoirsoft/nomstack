-- nomstack Supabase schema migration
-- Creates multi-tenant meal planning tables scoped per authenticated user

create schema if not exists public;

create extension if not exists "pgcrypto" schema public;

-- Profiles mirror auth.users but hold app-specific fields
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now()
);

comment on table public.profiles is 'Application-specific profile information keyed to auth.users.id.';

-- Sources (cookbooks, blogs, etc.) owned by a user
create table if not exists public.sources (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    abbrev text,
    created_at timestamptz not null default now()
);

create index if not exists sources_user_idx on public.sources(user_id, name);

-- Categories per user
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    color text,
    sort_order int,
    created_at timestamptz not null default now()
);

create unique index if not exists categories_unique_name on public.categories(user_id, lower(name));

-- Meals owned by a user
create table if not exists public.meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    source_id uuid references public.sources(id) on delete set null,
    name text not null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists meals_user_idx on public.meals(user_id, lower(name));
create index if not exists meals_source_idx on public.meals(source_id);

-- Bridge table for meal/category many-to-many tagging
create table if not exists public.meal_categories (
    meal_id uuid not null references public.meals(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    primary key (meal_id, category_id)
);

-- Flexible meal flags (lunch/dinner/etc.) per meal
create table if not exists public.meal_flags (
    meal_id uuid not null references public.meals(id) on delete cascade,
    flag text not null,
    created_at timestamptz not null default now(),
    primary key (meal_id, flag),
    check (flag ~ '^[A-Za-z0-9_-]+$')
);

-- Current selections for plans (e.g., lunch, dinner)
create table if not exists public.meal_plan_selections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    plan_type text not null default 'all',
    meal_id uuid not null references public.meals(id) on delete cascade,
    position int,
    created_at timestamptz not null default now(),
    unique (user_id, plan_type, meal_id)
);

create index if not exists plan_selections_user_plan_idx on public.meal_plan_selections(user_id, plan_type, position);

-- Eat-out roulette entries
create table if not exists public.eat_out_roulette (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    notes text,
    weight int not null default 1 check (weight > 0),
    last_picked_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists roulette_user_idx on public.eat_out_roulette(user_id, name);

-- Trigger to keep meals.updated_at fresh
create or replace function public.touch_meals_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger meals_set_updated_at
  before update on public.meals
  for each row
  execute function public.touch_meals_updated_at();

-- Row level security -------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.categories enable row level security;
alter table public.meals enable row level security;
alter table public.meal_categories enable row level security;
alter table public.meal_flags enable row level security;
alter table public.meal_plan_selections enable row level security;
alter table public.eat_out_roulette enable row level security;

-- Profiles: users can see/update only their own row
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id);

-- Generic policy helper via user_id column
create policy sources_owner_all on public.sources
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy categories_owner_all on public.categories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy meals_owner_all on public.meals
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy meal_plan_owner_all on public.meal_plan_selections
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy roulette_owner_all on public.eat_out_roulette
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Junction tables inherit ownership via joined meal/category
create policy meal_categories_owner_all on public.meal_categories
  using (
    exists (
      select 1
      from public.meals m
      where m.id = meal_categories.meal_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.meals m
      where m.id = meal_categories.meal_id
        and m.user_id = auth.uid()
    )
  );

create policy meal_flags_owner_all on public.meal_flags
  using (
    exists (
      select 1
      from public.meals m
      where m.id = meal_flags.meal_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.meals m
      where m.id = meal_flags.meal_id
        and m.user_id = auth.uid()
    )
  );

-- Optional convenience: default profile row on sign-up (handled in Supabase Edge Functions or triggers)
