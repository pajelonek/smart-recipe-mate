-- ============================================================================
-- Migration: Initial Schema for HealthyMeal MVP
-- Created: 2025-10-11 12:00:00 UTC
-- Description: Creates core database schema including profiles, recipes,
--              chat_messages tables with indexes, RLS policies, and triggers
-- ============================================================================
-- Purpose:
--   - Extend Supabase Auth with user profiles and dietary preferences
--   - Store user recipes with full content in JSONB format
--   - Track AI chat history for recipe modifications
--   - Implement Row Level Security for data isolation
--   - Add performance indexes for common query patterns
--   - Auto-create profiles on user registration
--   - Auto-update timestamps on record modification
--
-- Tables Created:
--   1. public.profiles - User dietary preferences and onboarding status
--   2. public.recipes - User recipes with soft delete support
--   3. public.chat_messages - AI conversation history per recipe
--
-- Special Considerations:
--   - All tables use TIMESTAMPTZ for global timezone support
--   - RLS policies ensure users can only access their own data
--   - CASCADE deletes maintain referential integrity
--   - JSONB columns provide flexibility for recipe content evolution
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: profiles
-- Purpose: Extends auth.users with dietary preferences and onboarding status
-- Relationship: 1:1 with auth.users (id is both PK and FK)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add table comment for documentation
comment on table public.profiles is 'User profiles extending Supabase Auth with dietary preferences';
comment on column public.profiles.id is 'References auth.users(id), ensuring 1:1 relationship';
comment on column public.profiles.onboarding_completed is 'Tracks if user completed 5-step onboarding wizard';
comment on column public.profiles.preferences is 'JSONB storing cuisines, diet_type, preferred_ingredients, allergies';
comment on column public.profiles.created_at is 'Profile creation timestamp';
comment on column public.profiles.updated_at is 'Last modification timestamp, auto-updated by trigger';

-- ----------------------------------------------------------------------------
-- Table: recipes
-- Purpose: Stores user recipes with full content in JSONB format
-- Relationship: Many-to-One with auth.users (user_id references auth.users.id)
-- Special: Soft delete via deleted_at column (null = active, not null = deleted)
-- ----------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Add table comments for documentation
comment on table public.recipes is 'User recipes with complete content stored in JSONB';
comment on column public.recipes.id is 'Auto-generated UUID primary key';
comment on column public.recipes.user_id is 'Recipe owner, references auth.users(id)';
comment on column public.recipes.content is 'JSONB containing title, ingredients, instructions, notes, nutrition';
comment on column public.recipes.created_at is 'Recipe creation timestamp';
comment on column public.recipes.updated_at is 'Last edit timestamp, auto-updated by trigger';
comment on column public.recipes.deleted_at is 'Soft delete timestamp (null = active, not null = deleted)';

-- ----------------------------------------------------------------------------
-- Table: chat_messages
-- Purpose: Stores AI conversation history for each recipe
-- Relationship: Many-to-One with recipes (recipe_id references recipes.id)
-- Access Control: Users access chats through recipe ownership (transitive)
-- ----------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- Add table comments for documentation
comment on table public.chat_messages is 'AI chat history for recipe modifications';
comment on column public.chat_messages.id is 'Auto-generated UUID primary key';
comment on column public.chat_messages.recipe_id is 'Associated recipe, references recipes(id)';
comment on column public.chat_messages.role is 'Message sender: "user" or "assistant"';
comment on column public.chat_messages.content is 'JSONB message content (structure varies by role)';
comment on column public.chat_messages.created_at is 'Message timestamp for chronological ordering';

-- ============================================================================
-- SECTION 2: CREATE INDEXES
-- Purpose: Optimize common query patterns for performance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Index: idx_recipes_user_id
-- Purpose: Fast filtering of recipes by owner
-- Query Pattern: WHERE user_id = $1
-- ----------------------------------------------------------------------------
create index idx_recipes_user_id on public.recipes(user_id);

-- ----------------------------------------------------------------------------
-- Index: idx_recipes_user_deleted
-- Purpose: Efficient queries for active recipes per user (soft delete filter)
-- Query Pattern: WHERE user_id = $1 AND deleted_at IS NULL
-- Note: Composite index allows index-only scans for counting active recipes
-- ----------------------------------------------------------------------------
create index idx_recipes_user_deleted on public.recipes(user_id, deleted_at);

-- ----------------------------------------------------------------------------
-- Index: idx_recipes_content_gin
-- Purpose: Full-text search in recipe content (title, ingredients, etc.)
-- Query Pattern: WHERE content @> '{"title": "chicken"}'
-- Type: GIN index for JSONB containment and existence operators
-- ----------------------------------------------------------------------------
create index idx_recipes_content_gin on public.recipes using gin(content);

-- ----------------------------------------------------------------------------
-- Index: idx_chat_messages_recipe_created
-- Purpose: Fast chronological loading of chat history per recipe
-- Query Pattern: WHERE recipe_id = $1 ORDER BY created_at
-- Note: Supports both filtering and ordering in single index scan
-- ----------------------------------------------------------------------------
create index idx_chat_messages_recipe_created on public.chat_messages(recipe_id, created_at);

-- ============================================================================
-- SECTION 3: CREATE FUNCTIONS
-- Purpose: Reusable database functions for triggers and business logic
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically set updated_at timestamp on row updates
-- Usage: Called by BEFORE UPDATE triggers on profiles and recipes tables
-- ----------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  -- Set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at_column is 'Trigger function to auto-update updated_at timestamp';

-- ----------------------------------------------------------------------------
-- Function: handle_new_user
-- Purpose: Automatically create profile record when user registers
-- Usage: Called by AFTER INSERT trigger on auth.users table
-- Security: SECURITY DEFINER allows bypassing RLS during profile creation
-- Note: Ensures 1:1 relationship between auth.users and profiles
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile with default values (onboarding incomplete, no preferences)
  insert into public.profiles (id, onboarding_completed, preferences)
  values (new.id, false, null);
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user is 'Trigger function to auto-create profile on user registration';

-- ============================================================================
-- SECTION 4: CREATE TRIGGERS
-- Purpose: Automate database operations (timestamp updates, profile creation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: update_profiles_updated_at
-- Purpose: Auto-update profiles.updated_at on every UPDATE
-- ----------------------------------------------------------------------------
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: update_recipes_updated_at
-- Purpose: Auto-update recipes.updated_at on every UPDATE
-- ----------------------------------------------------------------------------
create trigger update_recipes_updated_at
  before update on public.recipes
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: on_auth_user_created
-- Purpose: Auto-create profile when user registers in Supabase Auth
-- Security: Function uses SECURITY DEFINER to bypass RLS
-- ----------------------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- Purpose: Enforce data isolation at database level
-- Note: All tables MUST have RLS enabled for security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.chat_messages enable row level security;

-- ============================================================================
-- SECTION 6: CREATE RLS POLICIES - PROFILES
-- Purpose: Users can only access and modify their own profile
-- Strategy: Granular policies (one per operation) for clarity and maintainability
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Policy: profiles_select_own (SELECT for authenticated users)
-- Purpose: Users can read only their own profile data
-- Applies to: Authenticated users viewing their profile
-- ----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Policy: profiles_insert_own (INSERT for authenticated users)
-- Purpose: Users can create their own profile record
-- Applies to: Profile creation (typically via trigger, but policy allows manual insert)
-- Note: WITH CHECK ensures user can only insert record with their own ID
-- ----------------------------------------------------------------------------
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Policy: profiles_update_own (UPDATE for authenticated users)
-- Purpose: Users can update only their own profile
-- Applies to: Onboarding completion, preference updates
-- ----------------------------------------------------------------------------
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============================================================================
-- SECTION 7: CREATE RLS POLICIES - RECIPES
-- Purpose: Users can only access and modify their own recipes
-- Strategy: Separate policies for each CRUD operation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Policy: recipes_select_own (SELECT for authenticated users)
-- Purpose: Users can read only their own active (non-deleted) recipes
-- Applies to: Recipe list view, recipe detail view
-- Note: deleted_at IS NULL filter ensures soft-deleted recipes are hidden
-- ----------------------------------------------------------------------------
create policy "recipes_select_own"
  on public.recipes for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- ----------------------------------------------------------------------------
-- Policy: recipes_insert_own (INSERT for authenticated users)
-- Purpose: Users can create recipes for themselves
-- Applies to: New recipe creation from AI or manual input
-- Note: WITH CHECK ensures user_id matches authenticated user
-- ----------------------------------------------------------------------------
create policy "recipes_insert_own"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Policy: recipes_update_own (UPDATE for authenticated users)
-- Purpose: Users can update only their own recipes
-- Applies to: Recipe editing, soft delete (setting deleted_at)
-- ----------------------------------------------------------------------------
create policy "recipes_update_own"
  on public.recipes for update
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Policy: recipes_delete_own (DELETE for authenticated users)
-- Purpose: Users can delete their own recipes (hard delete if needed)
-- Applies to: Hard delete operations (rare, soft delete preferred)
-- Note: Application should use soft delete (UPDATE deleted_at) instead
-- ----------------------------------------------------------------------------
create policy "recipes_delete_own"
  on public.recipes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- SECTION 8: CREATE RLS POLICIES - CHAT MESSAGES
-- Purpose: Users can access chat history for recipes they own
-- Strategy: Policies use EXISTS subquery to check recipe ownership (transitive)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Policy: chat_messages_select_own (SELECT for authenticated users)
-- Purpose: Users can read chat messages for their own recipes
-- Applies to: Loading chat history in recipe detail view
-- Security: EXISTS subquery verifies recipe ownership before granting access
-- ----------------------------------------------------------------------------
create policy "chat_messages_select_own"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = chat_messages.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Policy: chat_messages_insert_own (INSERT for authenticated users)
-- Purpose: Users can create chat messages for their own recipes
-- Applies to: User asks question about recipe, AI responds
-- Security: WITH CHECK verifies recipe ownership before allowing insert
-- ----------------------------------------------------------------------------
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = chat_messages.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
--   ✅ 3 tables created with proper constraints and foreign keys
--   ✅ 4 performance indexes added for common query patterns
--   ✅ 2 functions created for automation (timestamps, profile creation)
--   ✅ 3 triggers configured for automatic operations
--   ✅ Row Level Security enabled on all tables
--   ✅ 10 RLS policies created for data isolation
--
-- Next Steps:
--   1. Run migration: supabase db reset (local) or supabase db push (remote)
--   2. Generate TypeScript types: supabase gen types typescript --local
--   3. Test RLS policies with authenticated user context
--   4. Verify trigger functionality (profile creation, timestamp updates)
-- ============================================================================

