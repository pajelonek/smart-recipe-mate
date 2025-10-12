# 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

#### auth.users (tabela systemowa Supabase)
Columns:
- `id uuid` – klucz główny zarządzany przez Supabase Auth; wszystkie tabele użytkownika referencjonują tę kolumnę.

#### public.user_onboarding
Columns:
- `user_id uuid` – klucz główny, FK do `auth.users(id)` ON DELETE CASCADE.
- `current_step smallint` – NOT NULL DEFAULT 1, CHECK (current_step BETWEEN 1 AND 5).
- `completed_at timestamptz` – znacznik ukończenia kreatora, NULL dopóki kreator nie został ukończony.
- `completed_version text` – wersja kreatora, której dotyczy `completed_at`.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
Constraints:
- PRIMARY KEY (`user_id`).
- CHECK (`completed_at` IS NULL OR `current_step` = 5).

#### public.user_preferences
Columns:
- `user_id uuid` – klucz główny, FK do `auth.users(id)` ON DELETE CASCADE.
- `diet_type text` – NOT NULL, zawiera wybrany typ diety.
- `preferred_ingredients text` – NOT NULL DEFAULT '', lista składników preferowanych (separator ustala aplikacja).
- `preferred_cuisines text` – NOT NULL DEFAULT '', lista preferowanych kuchni.
- `allergens text` – NOT NULL DEFAULT '', lista alergenów zadeklarowanych przez użytkownika.
- `notes text` – dodatkowe informacje kontekstowe, opcjonalne.
- `is_complete boolean` – NOT NULL DEFAULT false.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_by uuid` – FK do `auth.users(id)` ON DELETE SET NULL, wskazuje autora ostatniej zmiany.
Constraints:
- PRIMARY KEY (`user_id`).

#### public.recipes
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `owner_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `title text` – NOT NULL, CHECK (char_length(title) > 0).
- `summary text` – streszczenie przepisu; dla wpisów ręcznych opcjonalne.
- `ingredients text` – NOT NULL.
- `preparation text` – NOT NULL.
- `origin text` – NOT NULL DEFAULT 'manual', CHECK (origin IN ('manual', 'ai')).
- `ai_session_id uuid` – FK do `ai_sessions(id)` ON DELETE SET NULL, łączy zaakceptowany przepis z generacją AI.
- `created_by uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `updated_by uuid` – FK do `auth.users(id)` ON DELETE SET NULL.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `deleted_at timestamptz` – znacznik miękkiego usunięcia.
- `deleted_by uuid` – FK do `auth.users(id)` ON DELETE SET NULL.
Constraints:
- PRIMARY KEY (`id`).
- CHECK (`deleted_at` IS NULL OR `deleted_by` IS NOT NULL).

#### public.tags
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `owner_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `name text` – NOT NULL.
- `description text` – opcjonalny opis tagu.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `updated_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
Constraints:
- PRIMARY KEY (`id`).
- UNIQUE (`owner_id`, `name`).

#### public.recipe_tags
Columns:
- `recipe_id uuid` – NOT NULL, FK do `recipes(id)` ON DELETE CASCADE.
- `tag_id uuid` – NOT NULL, FK do `tags(id)` ON DELETE CASCADE.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
Constraints:
- PRIMARY KEY (`recipe_id`, `tag_id`).

#### public.ai_sessions
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `user_id uuid` – NOT NULL, FK do `auth.users(id)` ON DELETE CASCADE.
- `purpose text` – NOT NULL DEFAULT 'recipe_generation'.
- `model text` – NOT NULL, nazwa modelu użytego do zapytania.
- `status text` – NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')).
- `input_payload jsonb` – NOT NULL, struktura zawierająca składniki, cele dietetyczne i dodatkowy kontekst.
- `response_payload jsonb` – odpowiedź AI, NULL dopóki nie nadejdzie.
- `error_message text` – komunikat błędu dla statusu 'failed'.
- `recipe_id uuid` – FK do `recipes(id)` ON DELETE SET NULL, wskazuje zapisany przepis.
- `started_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `completed_at timestamptz` – znacznik zakończenia interakcji.
- `duration_ms integer` – czas obsługi żądania, opcjonalny.
Constraints:
- PRIMARY KEY (`id`).

#### public.ai_messages
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `session_id uuid` – NOT NULL, FK do `ai_sessions(id)` ON DELETE CASCADE.
- `message_index integer` – NOT NULL, kolejność w ramach sesji.
- `role text` – NOT NULL, CHECK (role IN ('user', 'assistant', 'system')).
- `content jsonb` – NOT NULL, pełna treść wiadomości (prompt lub odpowiedź) w formacie API.
- `token_count integer` – liczba tokenów wykorzystanych przez wiadomość, opcjonalna.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `metadata jsonb` – dodatkowe informacje (np. temperaturę, koszt), opcjonalne.
Constraints:
- PRIMARY KEY (`id`).
- UNIQUE (`session_id`, `message_index`).

#### public.ai_logs
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `session_id uuid` – FK do `ai_sessions(id)` ON DELETE SET NULL.
- `user_id uuid` – FK do `auth.users(id)` ON DELETE SET NULL.
- `event_type text` – NOT NULL, np. 'request', 'response', 'error'.
- `model text` – model użyty podczas zdarzenia.
- `request_payload jsonb` – pełne żądanie przekazane do usługi AI.
- `response_payload jsonb` – odpowiedź otrzymana od AI.
- `status_code integer` – kod odpowiedzi usługi AI.
- `duration_ms integer` – czas trwania zapytania w milisekundach.
- `error_message text` – treść błędu dla zdarzeń nieudanych.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
- `metadata jsonb` – dodatkowe metryki lub nagłówki, opcjonalne.
Constraints:
- PRIMARY KEY (`id`).

#### public.activity_logs
Columns:
- `id uuid` – klucz główny DEFAULT gen_random_uuid().
- `user_id uuid` – FK do `auth.users(id)` ON DELETE SET NULL.
- `event_type text` – NOT NULL, np. 'recipe_created', 'recipe_updated', 'preferences_updated'.
- `entity_type text` – NOT NULL, identyfikacja typu encji (np. 'recipe', 'user_preferences').
- `entity_id uuid` – identyfikator encji, jeśli dotyczy.
- `metadata jsonb` – NOT NULL DEFAULT '{}'::jsonb, szczegóły zdarzenia.
- `created_at timestamptz` – NOT NULL DEFAULT timezone('utc', now()).
Constraints:
- PRIMARY KEY (`id`).

# 2. Relacje między tabelami
- `auth.users` (1) — (1) `user_preferences` poprzez wspólny klucz `user_id`.
- `auth.users` (1) — (1) `user_onboarding` poprzez `user_id`.
- `auth.users` (1) — (N) `recipes` poprzez `owner_id` oraz `created_by` / `updated_by` / `deleted_by`.
- `recipes` (1) — (N) `recipe_tags`; relacja wiele-do-wielu z `tags`.
- `tags` (1) — (N) `recipe_tags` poprzez `tag_id`; dodatkowo `tags` (N) — (1) `auth.users` poprzez `owner_id`.
- `auth.users` (1) — (N) `ai_sessions` poprzez `user_id`.
- `ai_sessions` (1) — (N) `ai_messages` poprzez `session_id`.
- `ai_sessions` (1) — (0..1) `recipes` poprzez `recipes.ai_session_id`; akceptacja przepisu wiąże sesję z rekordem przepisu.
- `ai_sessions` (0..1) — (N) `ai_logs` poprzez `session_id`; logi mogą również istnieć bez powiązanej sesji.
- `auth.users` (1) — (N) `ai_logs` oraz `activity_logs` poprzez `user_id` (opcjonalne wiersze bez użytkownika są dozwolone).

# 3. Indeksy
- `recipes_owner_active_idx` na `recipes(owner_id)` WHERE `deleted_at IS NULL` w celu szybkiego filtrowania aktywnych przepisów użytkownika.
- `recipes_ai_session_idx` na `recipes(ai_session_id)` dla powiązań z generacjami AI.
- `recipe_tags_tag_idx` na `recipe_tags(tag_id)` wspierający filtrowanie po tagach.
- `tags_owner_idx` na `tags(owner_id, name)` (wspiera autouzupełnianie i wymusza unikalność na poziomie właściciela).
- `ai_sessions_user_idx` na `ai_sessions(user_id, started_at DESC)` przydatny dla historii użytkownika.
- `ai_messages_session_idx` na `ai_messages(session_id, message_index)` dla odczytu konwersacji w zadanej kolejności.
- `ai_logs_created_idx` na `ai_logs(created_at DESC)` dla raportów operacyjnych.
- `activity_logs_user_idx` na `activity_logs(user_id, created_at DESC)` do raportowania aktywności użytkownika.

# 4. Zasady PostgreSQL (RLS)
- `recipes`
  - ENABLE ROW LEVEL SECURITY.
  - SELECT policy: `owner_id = auth.uid()` AND `deleted_at IS NULL`.
  - INSERT policy: `owner_id = auth.uid()` AND `