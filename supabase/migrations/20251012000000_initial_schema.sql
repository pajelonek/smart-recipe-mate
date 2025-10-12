create schema if not exists smart_recipe_mate;

create table smart_recipe_mate.user_onboarding (
  user_id uuid not null references auth.users(id) on delete cascade,
  current_step smallint not null default 1,
  completed_at timestamptz,
  completed_version text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id),
  constraint valid_step check (current_step between 1 and 5),
  constraint completed_check check (completed_at is null or current_step = 5)
);

create table smart_recipe_mate.user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_type text not null,
  preferred_ingredients text not null default '',
  preferred_cuisines text not null default '',
  allergens text not null default '',
  notes text,
  is_complete boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (user_id)
);

create table smart_recipe_mate.recipes (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  ingredients text not null,
  preparation text not null,
  origin text not null default 'manual',
  ai_session_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  primary key (id)
);

create table smart_recipe_mate.tags (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (id),
  unique (owner_id, name)
);

create table smart_recipe_mate.recipe_tags (
  recipe_id uuid not null references smart_recipe_mate.recipes(id) on delete cascade,
  tag_id uuid not null references smart_recipe_mate.tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (recipe_id, tag_id)
);

create table smart_recipe_mate.ai_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null default 'recipe_generation',
  model text not null,
  status text not null default 'pending',
  input_payload jsonb not null,
  response_payload jsonb,
  error_message text,
  recipe_id uuid,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  duration_ms integer,
  primary key (id)
);

create table smart_recipe_mate.ai_messages (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null references smart_recipe_mate.ai_sessions(id) on delete cascade,
  message_index integer not null,
  role text not null,
  content jsonb not null,
  token_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  primary key (id),
  constraint valid_role check (role in ('user', 'assistant', 'system')),
  unique (session_id, message_index)
);

create table smart_recipe_mate.ai_logs (
  id uuid not null default gen_random_uuid(),
  session_id uuid references smart_recipe_mate.ai_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  model text,
  request_payload jsonb,
  response_payload jsonb,
  status_code integer,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  primary key (id)
);

create table smart_recipe_mate.activity_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (id)
);

alter table smart_recipe_mate.recipes
  add constraint recipes_ai_session_fkey
  foreign key (ai_session_id)
  references smart_recipe_mate.ai_sessions(id)
  on delete set null;

alter table smart_recipe_mate.ai_sessions
  add constraint ai_sessions_recipe_fkey
  foreign key (recipe_id)
  references smart_recipe_mate.recipes(id)
  on delete set null;
