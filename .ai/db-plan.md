# 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

#### auth.users (tabela systemowa Supabase)

Columns:

- `id uuid` – klucz główny zarządzany przez Supabase Auth; wszystkie tabele użytkownika referencjonują tę kolumnę.

#### smart_recipe_mate.user_preferences

Columns:

- `user_id uuid` – klucz główny, FK do `auth.users(id)` ON DELETE CASCADE.
- `diet_type text` – NOT NULL, zawiera wybrany typ diety.
- `preferred_ingredients text` – NOT NULL DEFAULT '', lista składników preferowanych (separator ustala aplikacja).
- `preferred_cuisines text` – NOT NULL DEFAULT '', lista preferowanych kuchni.
- `allergens text` – NOT NULL DEFAULT '', lista alergenów zadeklarowanych przez użytkownika.
- `notes text` – dodatkowe informacje kontekstowe, opcjonalne.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
  Constraints:
- PRIMARY KEY (`user_id`).

#### smart_recipe_mate.recipes

Columns:

- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `owner_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `title text` – NOT NULL, tytuł przepisu.
- `summary text` – streszczenie przepisu; opcjonalne.
- `ingredients text` – NOT NULL, lista składników.
- `preparation text` – NOT NULL, kroki przygotowania.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `deleted_at timestamptz` – znacznik miękkiego usunięcia.
  Constraints:
- PRIMARY KEY (`id`).

#### smart_recipe_mate.tags

Columns:

- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `owner_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `name text` – NOT NULL, nazwa tagu.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
  Constraints:
- PRIMARY KEY (`id`).
- UNIQUE (`owner_id`, `name`).

#### smart_recipe_mate.recipe_tags

Columns:

- `recipe_id uuid` – NOT NULL, FK do `smart_recipe_mate.recipes(id)` ON DELETE CASCADE.
- `tag_id uuid` – NOT NULL, FK do `smart_recipe_mate.tags(id)` ON DELETE CASCADE.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
  Constraints:
- PRIMARY KEY (`recipe_id`, `tag_id`).

#### smart_recipe_mate.ai_generations

Columns:

- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `user_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `input_payload jsonb` – NOT NULL, struktura zawierająca składniki, cele dietetyczne i dodatkowy kontekst przekazany do AI.
- `output_payload jsonb` – odpowiedź AI, NULL dopóki nie nadejdzie.
- `error_message text` – komunikat błędu w przypadku nieudanej generacji.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
  Constraints:
- PRIMARY KEY (`id`).

# 2. Relacje między tabelami

- `auth.users` (1) — (0..1) `smart_recipe_mate.user_preferences` poprzez wspólny klucz `user_id` (optional - user may not have completed onboarding).
- `auth.users` (1) — (N) `smart_recipe_mate.recipes` poprzez `owner_id`.
- `auth.users` (1) — (N) `smart_recipe_mate.tags` poprzez `owner_id`.
- `auth.users` (1) — (N) `smart_recipe_mate.ai_generations` poprzez `user_id`.
- `smart_recipe_mate.recipes` (N) — (N) `smart_recipe_mate.tags` poprzez tabelę łączącą `recipe_tags`.
- `smart_recipe_mate.recipe_tags` (N) — (1) `smart_recipe_mate.recipes` poprzez `recipe_id`.
- `smart_recipe_mate.recipe_tags` (N) — (1) `smart_recipe_mate.tags` poprzez `tag_id`.

# 3. Indeksy

Obecnie brak zdefiniowanych indeksów w migracji. Poniższe indeksy mogą zostać dodane w przyszłości dla optymalizacji wydajności:

- Indeks na `recipes(owner_id)` WHERE `deleted_at IS NULL` dla szybkiego filtrowania aktywnych przepisów użytkownika.
- Indeks na `recipe_tags(tag_id)` wspierający filtrowanie po tagach.
- Indeks na `tags(owner_id, name)` dla autouzupełniania i wymuszenia unikalności na poziomie właściciela (częściowo pokryte przez UNIQUE constraint).
- Indeks na `ai_generations(user_id, created_at DESC)` przydatny dla historii użytkownika.

# 4. Zasady PostgreSQL (RLS)

Obecnie brak zdefiniowanych zasad Row Level Security w migracji. Należy je dodać przed wdrożeniem produkcyjnym:

**Zalecane zasady RLS:**

- `smart_recipe_mate.recipes`
  - ENABLE ROW LEVEL SECURITY.
  - SELECT policy: `owner_id = auth.uid()` AND `deleted_at IS NULL`.
  - INSERT policy: `owner_id = auth.uid()`.
  - UPDATE policy: `owner_id = auth.uid()`.
  - DELETE policy: `owner_id = auth.uid()` (soft delete przez UPDATE `deleted_at`).

- `smart_recipe_mate.user_preferences`
  - ENABLE ROW LEVEL SECURITY.
  - SELECT/INSERT/UPDATE policy: `user_id = auth.uid()`.


- `smart_recipe_mate.tags`
  - ENABLE ROW LEVEL SECURITY.
  - SELECT/INSERT/UPDATE/DELETE policy: `owner_id = auth.uid()`.

- `smart_recipe_mate.recipe_tags`
  - ENABLE ROW LEVEL SECURITY.
  - Policy oparta na dostępie do powiązanego przepisu poprzez `recipe_id`.

- `smart_recipe_mate.ai_generations`
  - ENABLE ROW LEVEL SECURITY.
  - SELECT policy: `user_id = auth.uid()`.
  - INSERT policy: `user_id = auth.uid()`.
