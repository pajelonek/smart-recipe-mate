# Database Schema - HealthyMeal MVP

## Overview

This document defines the PostgreSQL database schema for HealthyMeal MVP, designed to work with Supabase as the Backend-as-a-Service. The schema consists of three main tables in the `public` schema that integrate with Supabase's `auth.users` table for authentication.

## Supabase Auth Integration

### auth.users Table (Managed by Supabase)

The `auth.users` table is **automatically managed by Supabase Auth** and is NOT part of our application schema. This table:

- Resides in the `auth` schema (not `public`)
- Handles user registration, login, and authentication
- Stores email, encrypted password, email confirmation status
- Manages password reset tokens and email verification tokens
- Is created and maintained by Supabase automatically

**We do NOT create or migrate this table** - it exists as part of Supabase's built-in authentication system.

### Our Application Tables

Our application extends Supabase Auth by creating three tables in the `public` schema:

1. **profiles** - extends user data with dietary preferences (1:1 with `auth.users`)
2. **recipes** - stores user recipes (N:1 with `auth.users`)
3. **chat_messages** - stores AI chat history (N:1 with `recipes`)

All our tables reference `auth.users(id)` via foreign keys, but we never directly modify the `auth.users` table.

---

## 1. Tables

### 1.1 profiles

Extends user data beyond Supabase Auth, storing dietary preferences and onboarding status.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Columns:**
- `id` (UUID, PK, FK): References `auth.users(id)`, 1:1 relationship
- `onboarding_completed` (BOOLEAN, NOT NULL): Tracks if user completed 5-step wizard
- `preferences` (JSONB, NULLABLE): Stores cuisines, diet_type, preferred_ingredients, allergies (null until onboarding complete)
- `created_at` (TIMESTAMPTZ, NOT NULL): Profile creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last modification timestamp

**Constraints:**
- Primary key on `id`
- Foreign key to `auth.users(id)` with CASCADE delete
- NOT NULL on `onboarding_completed`, `created_at`, `updated_at`
- Preferences nullable to allow incremental onboarding

---

### 1.2 recipes

Central entity storing user recipes with full content in JSONB format.

```sql
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

**Columns:**
- `id` (UUID, PK): Auto-generated unique identifier
- `user_id` (UUID, NOT NULL, FK): Owner of the recipe, references `auth.users(id)`
- `content` (JSONB, NOT NULL): All recipe data (title, ingredients, instructions, notes, nutrition)
- `created_at` (TIMESTAMPTZ, NOT NULL): Recipe creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last edit timestamp (user knows when they last modified)
- `deleted_at` (TIMESTAMPTZ, NULLABLE): Soft delete timestamp (NULL = active, NOT NULL = deleted)

**Constraints:**
- Primary key on `id`
- Foreign key to `auth.users(id)` with CASCADE delete
- NOT NULL on `user_id`, `content`, `created_at`, `updated_at`
- Soft delete via `deleted_at` column

**Design Note:**
No versioning table per PRD 3.5 - edits overwrite current version, only `updated_at` tracks changes.

---

### 1.3 chat_messages

Stores conversation history between user and AI for each recipe.

```sql
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Columns:**
- `id` (UUID, PK): Auto-generated unique identifier
- `recipe_id` (UUID, NOT NULL, FK): Associated recipe, references `recipes(id)`
- `role` (TEXT, NOT NULL): Message sender, either 'user' or 'assistant'
- `content` (JSONB, NOT NULL): Message content (text for user, structured response for AI)
- `created_at` (TIMESTAMPTZ, NOT NULL): Message timestamp

**Constraints:**
- Primary key on `id`
- Foreign key to `recipes(id)` with CASCADE delete (chat history deleted with recipe)
- CHECK constraint: `role IN ('user', 'assistant')`
- NOT NULL on all columns except `id` (auto-generated)

**Design Note:**
No direct relationship to `profiles.user_id` - access controlled through recipe ownership.

---

## 2. Relationships

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    |
    | 1:1
    |
profiles (id = user_id)

auth.users (Supabase Auth)
    |
    | 1:N
    |
recipes (user_id)
    |
    | 1:N
    |
chat_messages (recipe_id)
```

### Detailed Relationships

1. **profiles ↔ auth.users**
   - Type: One-to-One
   - Foreign Key: `profiles.id → auth.users.id`
   - Delete Behavior: CASCADE (profile deleted when user account deleted)
   - Rationale: Extends Supabase Auth with application-specific user data

2. **recipes ↔ auth.users**
   - Type: Many-to-One (N:1)
   - Foreign Key: `recipes.user_id → auth.users.id`
   - Delete Behavior: CASCADE (all user recipes deleted when account deleted)
   - Rationale: Each recipe belongs to exactly one user; users can have multiple recipes

3. **chat_messages ↔ recipes**
   - Type: Many-to-One (N:1)
   - Foreign Key: `chat_messages.recipe_id → recipes.id`
   - Delete Behavior: CASCADE (chat history deleted when recipe deleted)
   - Rationale: Chat is contextual to recipe; deleting recipe should remove conversation

---

## 3. Indexes

### 3.1 Performance Indexes

```sql
-- Index for filtering recipes by user
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);

-- Composite index for user recipes with soft delete filtering
CREATE INDEX idx_recipes_user_deleted ON public.recipes(user_id, deleted_at);

-- GIN index for full-text search in recipe content
CREATE INDEX idx_recipes_content_gin ON public.recipes USING GIN(content);

-- Composite index for chronological chat loading
CREATE INDEX idx_chat_messages_recipe_created ON public.chat_messages(recipe_id, created_at);
```

### Index Rationale

| Index | Type | Purpose | Query Pattern |
|-------|------|---------|---------------|
| `idx_recipes_user_id` | B-tree | Fast recipe filtering by owner | `WHERE user_id = $1` |
| `idx_recipes_user_deleted` | B-tree (composite) | Efficient soft delete queries | `WHERE user_id = $1 AND deleted_at IS NULL` |
| `idx_recipes_content_gin` | GIN | Full-text search in title/ingredients | `WHERE content @> '{"title": "chicken"}'` |
| `idx_chat_messages_recipe_created` | B-tree (composite) | Chronological chat history | `WHERE recipe_id = $1 ORDER BY created_at` |

---

## 4. Row Level Security (RLS) Policies

### 4.1 Enable RLS

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
```

### 4.2 Profiles Policies

```sql
-- Users can read only their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles are created via trigger, not directly by users
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 4.3 Recipes Policies

```sql
-- Users can read only their own active (non-deleted) recipes
CREATE POLICY "Users can view own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert recipes for themselves
CREATE POLICY "Users can insert own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own recipes
CREATE POLICY "Users can update own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete (soft delete) only their own recipes
CREATE POLICY "Users can delete own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.4 Chat Messages Policies

```sql
-- Users can read chat messages for their own recipes
CREATE POLICY "Users can view own recipe chats"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = chat_messages.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Users can insert chat messages for their own recipes
CREATE POLICY "Users can insert own recipe chats"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = chat_messages.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );
```

**Security Note:** Chat messages are protected through recipe ownership - users can only access chats for recipes they own.

---

## 5. Triggers and Functions

### 5.1 Auto-update Timestamp Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to recipes table
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**Purpose:** Automatically sets `updated_at` timestamp on every UPDATE, ensuring accurate modification tracking.

---

### 5.2 Auto-create Profile Trigger

```sql
-- Function to create profile after user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, onboarding_completed, preferences)
  VALUES (NEW.id, false, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Purpose:** Automatically creates a profile record when a new user registers, ensuring 1:1 relationship integrity.

**Security:** `SECURITY DEFINER` allows the trigger to insert into `profiles` table regardless of RLS policies.

---

## 6. JSONB Structures

### 6.1 profiles.preferences

Stores user dietary preferences collected during 5-step onboarding wizard.

```typescript
{
  "cuisines": string[],           // e.g., ["Italian", "Mexican", "Asian"]
  "diet_type": string,            // e.g., "vegetarian", "vegan", "keto", "paleo", "none"
  "preferred_ingredients": string[], // e.g., ["chicken", "broccoli", "olive oil"]
  "allergies": string[]           // e.g., ["peanuts", "shellfish", "dairy"]
}
```

**Example:**
```json
{
  "cuisines": ["Mediterranean", "Italian"],
  "diet_type": "vegetarian",
  "preferred_ingredients": ["tomatoes", "basil", "mozzarella", "olive oil"],
  "allergies": ["shellfish", "tree nuts"]
}
```

**Validation:** Application-level validation ensures all required fields are present when `onboarding_completed = true`.

---

### 6.2 recipes.content

Complete recipe data following the required template structure (PRD US-007).

```typescript
{
  "title": string,                // Recipe name
  "ingredients": string,          // Full text list of ingredients
  "instructions": string,         // Step-by-step cooking instructions
  "notes": string,                // Optional cooking notes, tips, variations
  "nutrition": {                  // Optional nutritional information
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "servings": number
  }
}
```

**Example:**
```json
{
  "title": "Mediterranean Quinoa Bowl",
  "ingredients": "1 cup quinoa\n2 cups water\n1 cucumber, diced\n1 cup cherry tomatoes, halved\n1/4 cup feta cheese\n2 tbsp olive oil\n1 lemon, juiced\nSalt and pepper to taste",
  "instructions": "1. Rinse quinoa under cold water.\n2. Bring water to boil, add quinoa, reduce heat and simmer for 15 minutes.\n3. Let quinoa cool.\n4. Combine quinoa with cucumber, tomatoes, and feta.\n5. Drizzle with olive oil and lemon juice.\n6. Season with salt and pepper.",
  "notes": "Can substitute feta with vegan cheese. Add chickpeas for extra protein.",
  "nutrition": {
    "calories": 350,
    "protein": 12,
    "carbs": 45,
    "fat": 15,
    "servings": 2
  }
}
```

**Required Fields:** `title`, `ingredients`, `instructions` (minimum for US-007)

**Optional Fields:** `notes`, `nutrition`

---

### 6.3 chat_messages.content

Structure varies by role - simple text for user, structured response for AI.

#### User Messages

```typescript
{
  "text": string  // User's question or instruction
}
```

**Example:**
```json
{
  "text": "Can you make this recipe higher in protein and lower in carbs?"
}
```

#### Assistant (AI) Messages

```typescript
{
  "summary": string,              // Brief overview of changes
  "suggested_changes": string[],  // Bullet list of modifications
  "updated_recipe": {             // Full modified recipe in same format as recipes.content
    "title": string,
    "ingredients": string,
    "instructions": string,
    "notes": string,
    "nutrition": object
  },
  "additional_tips": string       // Optional extra recommendations
}
```

**Example:**
```json
{
  "summary": "Increased protein by adding grilled chicken and Greek yogurt, reduced carbs by halving quinoa portion.",
  "suggested_changes": [
    "Reduced quinoa from 1 cup to 1/2 cup",
    "Added 6 oz grilled chicken breast",
    "Added 1/4 cup Greek yogurt as dressing",
    "Removed bread croutons"
  ],
  "updated_recipe": {
    "title": "High-Protein Mediterranean Bowl",
    "ingredients": "1/2 cup quinoa\n1 cup water\n6 oz grilled chicken breast, sliced\n1 cucumber, diced\n1 cup cherry tomatoes, halved\n1/4 cup Greek yogurt\n2 tbsp olive oil\n1 lemon, juiced",
    "instructions": "1. Rinse quinoa and cook in 1 cup water for 15 minutes.\n2. Grill chicken breast until internal temp reaches 165°F.\n3. Combine quinoa, sliced chicken, cucumber, and tomatoes.\n4. Mix Greek yogurt with lemon juice for dressing.\n5. Drizzle with olive oil and yogurt dressing.",
    "notes": "High protein content supports muscle recovery. Greek yogurt adds creaminess and extra protein.",
    "nutrition": {
      "calories": 420,
      "protein": 38,
      "carbs": 28,
      "fat": 16,
      "servings": 1
    }
  },
  "additional_tips": "You can meal prep the quinoa and chicken in advance. Store separately and assemble when ready to eat."
}
```

#### No Viable Modification (PRD US-012)

When AI cannot provide recommendations:

```json
{
  "summary": "No viable modification found",
  "message": "Unable to meet the specified requirements while maintaining recipe integrity. Consider relaxing dietary constraints or consulting a nutritionist for personalized advice.",
  "suggested_actions": [
    "Adjust your dietary goals",
    "Try a different base recipe",
    "Consult a nutrition professional"
  ]
}
```

---

## 7. Design Decisions and Rationale

### 7.1 JSONB for Preferences and Recipe Content

**Decision:** Use JSONB instead of normalized tables for preferences and recipe sections.

**Rationale:**
- **Flexibility:** Recipe templates may evolve; JSONB allows schema changes without migrations
- **Simplicity:** Eliminates multiple JOINs for displaying full recipe
- **Performance:** Single query retrieves complete recipe; GIN index enables fast search
- **MVP Speed:** Faster development without complex normalization
- **Supabase Compatibility:** JSONB is well-supported in PostgreSQL and Supabase SDK

**Trade-offs:** Less referential integrity, requires application-level validation

---

### 7.2 No Recipe Versioning

**Decision:** Single `recipes` table without version history (PRD 3.5).

**Rationale:**
- **PRD Requirement:** "Każda zmiana przepisu powoduje nadpisanie obecnej wersji"
- **MVP Scope:** Version history adds complexity not required for initial release
- **Storage Efficiency:** Reduces database size and query complexity
- **User Tracking:** `updated_at` timestamp provides "last edited" information
- **Chat History:** AI conversation history in `chat_messages` serves as informal audit trail

**Future Consideration:** Can add `recipe_versions` table post-MVP if user demand exists.

---

### 7.3 Soft Delete for Recipes

**Decision:** Use `deleted_at` column instead of hard DELETE.

**Rationale:**
- **Data Recovery:** Users can recover accidentally deleted recipes
- **Audit Trail:** Maintains record of what existed
- **Referential Integrity:** Preserves chat history even for deleted recipes (if needed)
- **Performance:** UPDATE is faster than DELETE with CASCADE in large tables
- **Analytics:** Can analyze deleted recipes to understand user behavior

**Implementation:** Application filters `WHERE deleted_at IS NULL` by default; admin tools can access soft-deleted records.

---

### 7.4 Chat Messages Without applied_to_recipe Flag

**Decision:** No column tracking which AI responses were saved as recipe versions.

**Rationale:**
- **Session Notes Decision:** "Usunięto wymaganie US-014 dotyczące oznaczania, które wiadomości AI zostały zapisane jako wersje przepisu"
- **Simplified Schema:** Reduces complexity and potential inconsistencies
- **No Versioning:** Without version history, tracking "which message became version 3" is meaningless
- **Chat as Context:** Chat serves as conversational history, not version control

**Alternative Approach:** Users can see chat history and understand context without explicit markers.

---

### 7.5 Automatic Profile Creation via Trigger

**Decision:** Auto-create profile when user registers in Supabase Auth.

**Rationale:**
- **Data Consistency:** Guarantees 1:1 relationship between `auth.users` and `profiles`
- **No Orphan Users:** Every authenticated user has a profile record
- **Simplified Logic:** Application doesn't need to check/create profile on first login
- **Atomic Operation:** Trigger ensures profile creation is part of registration transaction

**Implementation:** `handle_new_user()` trigger with `SECURITY DEFINER` to bypass RLS during creation.

---

### 7.6 RLS Through Recipe Ownership (Chat Messages)

**Decision:** Chat messages don't have direct `user_id` FK; access controlled via recipe ownership.

**Rationale:**
- **Normalized Design:** Chat belongs to recipe, recipe belongs to user (transitive relationship)
- **Automatic Authorization:** If user owns recipe, they own all chats for that recipe
- **Simplified Queries:** No need to duplicate `user_id` in child tables
- **CASCADE Delete:** Deleting recipe automatically removes all chats (single point of control)

**RLS Implementation:** Policy uses EXISTS subquery to check recipe ownership.

---

### 7.7 Supabase Auth for Tokens

**Decision:** No custom tables for email verification or password reset tokens.

**Rationale:**
- **Built-in Functionality:** Supabase Auth handles token generation, expiration, and validation
- **Security:** Leverages battle-tested authentication system
- **Less Code:** No need to implement token lifecycle management
- **Email Templates:** Configured in Supabase Dashboard, not database
- **PRD Compliance:** Meets US-001 (email verification) and US-003 (password reset) requirements

**Configuration:** Email templates customized in Supabase project settings.

---

### 7.8 Dynamic Allergen Warnings

**Decision:** No `allergen_warnings` table; warnings generated at runtime.

**Rationale:**
- **Always Current:** Reflects latest user allergies even if changed after recipe creation
- **Flexible Logic:** Can improve allergen detection algorithm without schema changes
- **Storage Efficiency:** Avoids redundant data storage
- **Simple Implementation:** Application compares `recipes.content.ingredients` with `profiles.preferences.allergies`

**Implementation:** Frontend/API logic parses ingredients text and checks against user's allergen list.

---

### 7.9 Timestamptz for All Timestamps

**Decision:** Use `TIMESTAMPTZ` (timestamp with time zone) for all temporal columns.

**Rationale:**
- **Best Practice:** PostgreSQL and Supabase recommendation
- **Global Users:** Handles users in different time zones correctly
- **Consistency:** All timestamps stored in UTC, converted to local time in application
- **Future-Proof:** Easier to add international features later

**Note:** Supabase client libraries automatically handle timezone conversions.

---

## 8. Security Considerations

### 8.1 Row Level Security (RLS)

All tables enforce RLS to ensure users can only access their own data. Policies use `auth.uid()` to match against user identifiers.

### 8.2 Data Isolation

- Users cannot query other users' profiles, recipes, or chat messages
- RLS policies enforced at database level, not just application level
- Prevents data leaks even if application code has vulnerabilities

### 8.3 CASCADE Deletes

- Deleting user account removes profile, all recipes, and all chat messages
- Deleting recipe removes all associated chat messages
- Prevents orphaned records and complies with data privacy requirements

### 8.4 Input Validation

While database enforces structure (CHECK constraints, NOT NULL, foreign keys), application must validate:
- JSONB schema compliance (preferences, recipe content)
- Text length limits (prevent storage abuse)
- Allergen list validity (recognized ingredients)

---

## 9. Performance Considerations

### 9.1 Query Patterns

**Most Frequent Queries:**
1. Get user's active recipes: Uses `idx_recipes_user_deleted`
2. Search recipes by title: Uses `idx_recipes_content_gin`
3. Load chat history: Uses `idx_chat_messages_recipe_created`
4. Get user profile: Direct PK lookup (fast)

### 9.2 JSONB Indexing

GIN index on `recipes.content` enables:
- Fast searches: `content @> '{"title": "chicken"}'`
- Existence checks: `content ? 'nutrition'`
- Path queries: `content #> '{nutrition,calories}'`

### 9.3 Soft Delete Performance

Composite index on `(user_id, deleted_at)` optimizes:
```sql
WHERE user_id = $1 AND deleted_at IS NULL
```

PostgreSQL can use index-only scan for counting active recipes.

### 9.4 Connection Pooling

Supabase provides built-in connection pooling (PgBouncer), ensuring efficient database connection management for web application.

---

## 10. Migration Strategy

### 10.1 Initial Migration Order

1. Create `profiles` table with RLS policies
2. Create `recipes` table with indexes and RLS policies
3. Create `chat_messages` table with indexes and RLS policies
4. Create `update_updated_at_column()` function
5. Create triggers on `profiles` and `recipes`
6. Create `handle_new_user()` function and trigger on `auth.users`

### 10.2 Supabase CLI Usage

```bash
# Generate migration file
supabase migration new initial_schema

# Apply migrations locally
supabase db reset

# Push to remote
supabase db push
```

### 10.3 Type Generation

After migration, generate TypeScript types:

```bash
supabase gen types typescript --local > src/db/types.ts
```

Update `src/types.ts` with application-level DTOs based on generated database types.

---

## 11. Open Questions and Future Enhancements

### 11.1 Unresolved Issues (from Planning Session)

1. **Allergen Parsing Logic:** Exact implementation for identifying ingredients in text (string matching vs. NLP)
2. **Email Templates Content:** Copywriting for welcome and password reset emails
3. **AI Rate Limiting:** Whether to track usage limits in database (future `api_usage` table?)
4. **Recipe Template Validation:** Exact CHECK constraints for recipe content (minimum field lengths)
5. **Analytics/Metrics:** Whether to add event tracking table for KPIs (post-MVP)

### 11.2 Potential Future Tables

- `recipe_versions` - if users request version history post-MVP
- `api_usage` - track AI requests per user for rate limiting
- `shared_recipes` - if social features added
- `meal_plans` - if meal planning feature requested
- `analytics_events` - for product metrics instrumentation

---

## 12. Summary

This schema provides a solid foundation for HealthyMeal MVP:

- ✅ All PRD functional requirements supported (US-001 through US-015)
- ✅ Secure data isolation through RLS policies
- ✅ Performance-optimized with strategic indexes
- ✅ Flexible JSONB structures for rapid iteration
- ✅ Automated workflows via triggers
- ✅ Supabase Auth integration for authentication
- ✅ Soft delete for data recovery
- ✅ Ready for TypeScript type generation

The design balances simplicity (MVP speed), flexibility (JSONB), and best practices (RLS, indexes, triggers) while remaining aligned with the tech stack (PostgreSQL, Supabase, TypeScript).

