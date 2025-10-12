-- Use public schema (exposed by Supabase API)
-- Tables for Smart Recipe Mate application

create table public.user_onboarding (
  user_id uuid not null references auth.users(id) on delete cascade,
  current_step smallint not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id),
  constraint valid_step check (current_step between 1 and 5),
  constraint completed_check check (completed_at is null or current_step = 5)
);

create table public.user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_type text not null,
  preferred_ingredients text not null default '',
  preferred_cuisines text not null default '',
  allergens text not null default '',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id)
);

create table public.recipes (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  ingredients text not null,
  preparation text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  primary key (id)
);

create table public.tags (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (id),
  unique (owner_id, name)
);

create table public.recipe_tags (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (recipe_id, tag_id)
);

create table public.ai_generations (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_payload jsonb not null,
  output_payload jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (id)
);
