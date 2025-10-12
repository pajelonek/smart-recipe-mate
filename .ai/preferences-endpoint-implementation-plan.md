# API Endpoint Implementation Plan: User Preferences

## 1. Przegląd punktu końcowego

Endpoint User Preferences składa się z trzech operacji RESTful:
- **GET /api/preferences** - pobieranie preferencji żywieniowych zalogowanego użytkownika
- **PUT /api/preferences** - pełna aktualizacja preferencji (wymaga wszystkich pól)
- **PATCH /api/preferences** - częściowa aktualizacja preferencji (aktualizuje tylko przesłane pola)

Wszystkie endpointy wymagają uwierzytelnienia. Operują na tabeli `smart_recipe_mate.user_preferences`, która przechowuje preferencje żywieniowe użytkownika (typ diety, preferowane składniki, kuchnie, alergeny, notatki).

**Cel biznesowy:**
Umożliwienie użytkownikom zapisywania i zarządzania swoimi preferencjami żywieniowymi, które będą wykorzystywane przez system AI do personalizacji przepisów. Jest to kluczowy element dla osiągnięcia celu MVP - 90% użytkowników z wypełnionymi preferencjami.

---

## 2. Szczegóły żądania

### GET /api/preferences

**Metoda HTTP:** GET  
**Struktura URL:** `/api/preferences`  
**Uwierzytelnianie:** Wymagane (Supabase session)  
**Parametry:**
- Query parameters: Brak
- Request body: Brak

---

### PUT /api/preferences

**Metoda HTTP:** PUT  
**Struktura URL:** `/api/preferences`  
**Uwierzytelnianie:** Wymagane (Supabase session)  
**Parametry:**
- Wymagane:
  - `diet_type` (string) - typ diety użytkownika
- Opcjonalne:
  - `preferred_ingredients` (string, default: '') - lista preferowanych składników (separowane przecinkami)
  - `preferred_cuisines` (string, default: '') - lista preferowanych kuchni
  - `allergens` (string, default: '') - lista alergenów
  - `notes` (string | null) - dodatkowe notatki użytkownika

**Request Body:**
```json
{
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts",
  "notes": "High protein meals preferred"
}
```

---

### PATCH /api/preferences

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/preferences`  
**Uwierzytelnianie:** Wymagane (Supabase session)  
**Parametry:**
- Co najmniej jedno pole spośród:
  - `diet_type` (string)
  - `preferred_ingredients` (string)
  - `preferred_cuisines` (string)
  - `allergens` (string)
  - `notes` (string | null)

**Request Body:**
```json
{
  "allergens": "peanuts, tree nuts, soy"
}
```

---

## 3. Wykorzystywane typy

### DTOs (Response)

```typescript
// src/types.ts

export interface UserPreferencesDTO {
  user_id: string;
  diet_type: string;
  preferred_ingredients: string;
  preferred_cuisines: string;
  allergens: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponseDTO {
  error: string;
  message: string;
}
```

### Command Models (Request - Validation Schemas)

```typescript
// src/types.ts

import { z } from 'zod';

export const UpdatePreferencesCommandSchema = z.object({
  diet_type: z.string().min(1, 'diet_type is required').max(100),
  preferred_ingredients: z.string().max(500).default(''),
  preferred_cuisines: z.string().max(500).default(''),
  allergens: z.string().max(500).default(''),
  notes: z.string().max(2000).nullable().optional(),
});

export type UpdatePreferencesCommand = z.infer<typeof UpdatePreferencesCommandSchema>;

export const PatchPreferencesCommandSchema = z.object({
  diet_type: z.string().min(1).max(100).optional(),
  preferred_ingredients: z.string().max(500).optional(),
  preferred_cuisines: z.string().max(500).optional(),
  allergens: z.string().max(500).optional(),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export type PatchPreferencesCommand = z.infer<typeof PatchPreferencesCommandSchema>;
```

### Database Types

Należy zaktualizować `src/db/database.types.ts` po wdrożeniu migracji bazy danych. Typy zostaną wygenerowane automatycznie przez Supabase CLI:

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

---

## 4. Szczegóły odpowiedzi

### GET /api/preferences

**Success Response (200 OK):**
```json
{
  "user_id": "uuid",
  "diet_type": "vegetarian",
  "preferred_ingredients": "tomatoes, basil, cheese",
  "preferred_cuisines": "Italian, Mediterranean",
  "allergens": "peanuts, shellfish",
  "notes": "I prefer quick recipes under 30 minutes",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:15:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Preferences not found",
  "message": "User has not completed onboarding"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

### PUT /api/preferences

**Success Response (200 OK):**
```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts",
  "notes": "High protein meals preferred",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T11:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "message": "diet_type is required"
}
```

---

### PATCH /api/preferences

**Success Response (200 OK):**
```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "preferred_ingredients": "tofu, quinoa, kale",
  "preferred_cuisines": "Asian, Middle Eastern",
  "allergens": "peanuts, tree nuts, soy",
  "notes": "High protein meals preferred",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T11:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "message": "At least one field must be provided"
}
```

---

## 5. Przepływ danych

### GET /api/preferences - Przepływ

```
1. Request → /api/preferences (GET)
2. Middleware → Inject Supabase client to context.locals
3. Endpoint Handler:
   a. Pobierz Supabase client z context.locals
   b. Sprawdź sesję użytkownika (getSession)
   c. Jeśli brak sesji → return 401
   d. Wywołaj PreferencesService.getPreferences(userId)
4. PreferencesService:
   a. Query do smart_recipe_mate.user_preferences WHERE user_id = userId
   b. Jeśli nie znaleziono → return null
   c. Jeśli znaleziono → return UserPreferencesDTO
5. Endpoint Handler:
   a. Jeśli null → return 404
   b. Jeśli dane → return 200 z UserPreferencesDTO
```

### PUT /api/preferences - Przepływ

```
1. Request → /api/preferences (PUT) + request body
2. Middleware → Inject Supabase client to context.locals
3. Endpoint Handler:
   a. Pobierz Supabase client z context.locals
   b. Sprawdź sesję użytkownika
   c. Jeśli brak sesji → return 401
   d. Parse request body
   e. Walidacja przez UpdatePreferencesCommandSchema
   f. Jeśli walidacja failed → return 400 z błędami
   g. Wywołaj PreferencesService.upsertPreferences(userId, command)
4. PreferencesService:
   a. UPSERT do smart_recipe_mate.user_preferences
   b. Ustaw updated_at = now()
   c. Return zaktualizowane UserPreferencesDTO
5. Endpoint Handler:
   a. Return 200 z UserPreferencesDTO
```

### PATCH /api/preferences - Przepływ

```
1. Request → /api/preferences (PATCH) + request body
2. Middleware → Inject Supabase client to context.locals
3. Endpoint Handler:
   a. Pobierz Supabase client z context.locals
   b. Sprawdź sesję użytkownika
   c. Jeśli brak sesji → return 401
   d. Parse request body
   e. Walidacja przez PatchPreferencesCommandSchema
   f. Jeśli walidacja failed → return 400
   g. Wywołaj PreferencesService.patchPreferences(userId, command)
4. PreferencesService:
   a. Sprawdź czy preferencje istnieją
   b. Jeśli nie → return null
   c. UPDATE tylko przesłane pola
   d. Ustaw updated_at = now()
   e. Return zaktualizowane UserPreferencesDTO
5. Endpoint Handler:
   a. Jeśli null → return 404
   b. Jeśli dane → return 200 z UserPreferencesDTO
```

### Interakcje z bazą danych

**Tabela:** `smart_recipe_mate.user_preferences`

**Kolumny:**
- `user_id` (uuid, PK, FK do auth.users)
- `diet_type` (text, NOT NULL)
- `preferred_ingredients` (text, NOT NULL, default '')
- `preferred_cuisines` (text, NOT NULL, default '')
- `allergens` (text, NOT NULL, default '')
- `notes` (text, nullable)
- `created_at` (timestamptz, NOT NULL)
- `updated_at` (timestamptz, NOT NULL)

**Operacje:**
- GET: `SELECT * FROM smart_recipe_mate.user_preferences WHERE user_id = $1`
- PUT: `INSERT INTO smart_recipe_mate.user_preferences (...) VALUES (...) ON CONFLICT (user_id) DO UPDATE SET ...`
- PATCH: `UPDATE smart_recipe_mate.user_preferences SET ... WHERE user_id = $1 RETURNING *`

**RLS (Row Level Security):**
Należy włączyć RLS na tabeli `user_preferences` z polityką:
```sql
ALTER TABLE smart_recipe_mate.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
ON smart_recipe_mate.user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

1. **Session Verification:**
   - Każdy endpoint musi sprawdzić obecność aktywnej sesji Supabase
   - Użyj `supabase.auth.getSession()` z context.locals
   - Return 401 jeśli brak sesji lub sesja wygasła

2. **User ID Extraction:**
   - Pobierz user_id z sesji: `session.user.id`
   - NIGDY nie ufaj user_id przesłanemu w request body
   - Zawsze używaj user_id z zweryfikowanej sesji

### Autoryzacja

1. **Row Level Security:**
   - RLS policies zapewniają, że użytkownik ma dostęp tylko do własnych preferencji
   - Polityka `auth.uid() = user_id` jest wymuszana na poziomie bazy danych

2. **Endpoint Level:**
   - Dodatkowa walidacja na poziomie endpointu nie jest wymagana dzięki RLS
   - Service layer operuje w kontekście uwierzytelnionego użytkownika

### Walidacja danych

1. **Input Validation:**
   - Wszystkie dane wejściowe walidowane przez Zod schemas
   - Limity długości stringów: 
     - `diet_type`: max 100 znaków
     - `preferred_ingredients`, `preferred_cuisines`, `allergens`: max 500 znaków
     - `notes`: max 2000 znaków

2. **Sanitization:**
   - Zod automatycznie konwertuje typy
   - Brak potrzeby dodatkowej sanityzacji dla SQL injection (Supabase client używa prepared statements)
   - Przy wyświetlaniu danych w frontend należy zastosować HTML escaping

### Potencjalne zagrożenia i mitigacja

1. **SQL Injection:**
   - Mitigacja: Supabase client używa prepared statements
   - Dodatkowa ochrona: Walidacja przez Zod

2. **XSS (Cross-Site Scripting):**
   - Mitigacja: React automatycznie escapuje wartości w JSX
   - Uwaga: Jeśli używane dangerouslySetInnerHTML, wymagana sanityzacja

3. **Mass Assignment:**
   - Mitigacja: Zod schemas definiują dokładnie jakie pola są akceptowane
   - Nieprzewidziane pola są ignorowane

4. **Session Hijacking:**
   - Mitigacja: Supabase zarządza sesjami z automatycznym odświeżaniem tokenów
   - HTTPS wymaga na produkcji

5. **Rate Limiting:**
   - Rekomendacja: Implementacja rate limiting na poziomie API Gateway lub middleware
   - Zapobieganie abuse (np. 100 requests/min na użytkownika)

---

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Scenariusz | Kod | Error | Message | Akcja |
|------------|-----|-------|---------|-------|
| Brak sesji | 401 | Unauthorized | Authentication required | Sprawdź `getSession()` |
| Preferencje nie znalezione (GET) | 404 | Preferences not found | User has not completed onboarding | Query zwróciło null |
| Preferencje nie znalezione (PATCH) | 404 | Preferences not found | Cannot update non-existent preferences | Query zwróciło null |
| Brak diet_type (PUT) | 400 | Validation failed | diet_type is required | Zod validation error |
| Brak pól (PATCH) | 400 | Validation failed | At least one field must be provided | Zod validation error |
| Pole za długie | 400 | Validation failed | Field exceeds maximum length | Zod validation error |
| Nieprawidłowy format JSON | 400 | Invalid request | Request body must be valid JSON | JSON.parse error |
| Błąd bazy danych | 500 | Internal server error | An unexpected error occurred | Database error |
| Nieprzewidziany błąd | 500 | Internal server error | An unexpected error occurred | Catch-all |

### Struktura odpowiedzi błędu

Wszystkie odpowiedzi błędów powinny mieć spójną strukturę:

```typescript
interface ErrorResponse {
  error: string;      // Krótki, techniczny opis błędu
  message: string;    // User-friendly komunikat
}
```

### Logowanie błędów

1. **Client Errors (4xx):**
   - Loguj na poziomie `console.warn`
   - Zawieraj: timestamp, endpoint, user_id (jeśli dostępny), error message

2. **Server Errors (5xx):**
   - Loguj na poziomie `console.error`
   - Zawieraj: timestamp, endpoint, user_id, full error stack, request details
   - Format: `[ERROR] [timestamp] [endpoint] [user_id] - Error message - Stack trace`

3. **Przykład logowania:**
```typescript
console.error(
  `[ERROR] [${new Date().toISOString()}] [GET /api/preferences] [${userId}]`,
  error.message,
  error.stack
);
```

### Error Handling w Service Layer

```typescript
// Przykład try-catch w service
try {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
} catch (error) {
  console.error('[PreferencesService] getPreferences error:', error);
  throw error; // Re-throw dla endpoint handler
}
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Database Query Performance:**
   - Preferencje są pobierane po `user_id` (primary key)
   - Operacje są bardzo szybkie (index scan)
   - Brak potrzeby dodatkowych indeksów

2. **Network Latency:**
   - Komunikacja z Supabase przez Internet
   - Mitigacja: Hosting aplikacji w tym samym regionie co baza danych

3. **Request Size:**
   - Małe payloady (< 5KB typowo)
   - Brak problemu z transferem

### Strategie optymalizacji

1. **Caching:**
   - **Nie zalecane** dla preferencji użytkownika
   - Dane często się zmieniają i muszą być zawsze aktualne
   - Jeśli konieczne, cache na poziomie sesji z TTL 5 minut

2. **Connection Pooling:**
   - Supabase automatycznie zarządza connection pooling
   - Brak potrzeby własnej implementacji

3. **Response Compression:**
   - Włącz gzip/brotli compression na poziomie serwera HTTP
   - Astro obsługuje to automatycznie w production build

4. **Query Optimization:**
   - Używaj `.single()` dla GET (oczekujemy 1 rekord)
   - Używaj `.select('*')` tylko gdy wszystkie pola są potrzebne
   - Dla PATCH, używaj `RETURNING *` by uniknąć dodatkowego SELECT

5. **Error Early Return:**
   - Sprawdzaj uwierzytelnianie przed walidacją
   - Sprawdzaj walidację przed database calls
   - Minimalizuje niepotrzebne operacje

### Monitoring i metryki

1. **Response Time:**
   - Target: < 200ms dla GET
   - Target: < 300ms dla PUT/PATCH

2. **Error Rate:**
   - Target: < 1% dla 5xx errors
   - Monitor 4xx dla podejrzanej aktywności

3. **Database Connection Pool:**
   - Monitor wykorzystanie połączeń w Supabase dashboard

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska

1.1. Upewnij się, że migracja bazy danych jest zastosowana:
```bash
npx supabase db push
```

1.2. Wygeneruj aktualne typy bazy danych:
```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

1.3. Dodaj RLS policies do tabeli `user_preferences`:
```sql
-- Utwórz nową migrację
npx supabase migration new add_user_preferences_rls

-- W pliku migracji dodaj:
ALTER TABLE smart_recipe_mate.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
ON smart_recipe_mate.user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

### Krok 2: Definicja typów i schematów walidacji

2.1. Utwórz/zaktualizuj `src/types.ts`:
```typescript
import { z } from 'zod';

// DTOs
export interface UserPreferencesDTO {
  user_id: string;
  diet_type: string;
  preferred_ingredients: string;
  preferred_cuisines: string;
  allergens: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponseDTO {
  error: string;
  message: string;
}

// Validation Schemas
export const UpdatePreferencesCommandSchema = z.object({
  diet_type: z.string().min(1, 'diet_type is required').max(100),
  preferred_ingredients: z.string().max(500).default(''),
  preferred_cuisines: z.string().max(500).default(''),
  allergens: z.string().max(500).default(''),
  notes: z.string().max(2000).nullable().optional(),
});

export type UpdatePreferencesCommand = z.infer<typeof UpdatePreferencesCommandSchema>;

export const PatchPreferencesCommandSchema = z.object({
  diet_type: z.string().min(1).max(100).optional(),
  preferred_ingredients: z.string().max(500).optional(),
  preferred_cuisines: z.string().max(500).optional(),
  allergens: z.string().max(500).optional(),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export type PatchPreferencesCommand = z.infer<typeof PatchPreferencesCommandSchema>;
```

---

### Krok 3: Implementacja Service Layer

3.1. Utwórz folder dla services:
```bash
mkdir -p src/lib/services
```

3.2. Utwórz `src/lib/services/preferences.service.ts`:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  UserPreferencesDTO,
  UpdatePreferencesCommand,
  PatchPreferencesCommand,
} from '../../types';

export class PreferencesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getPreferences(userId: string): Promise<UserPreferencesDTO | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Not found error is expected
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as UserPreferencesDTO;
    } catch (error) {
      console.error('[PreferencesService] getPreferences error:', error);
      throw error;
    }
  }

  async upsertPreferences(
    userId: string,
    command: UpdatePreferencesCommand
  ): Promise<UserPreferencesDTO> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            diet_type: command.diet_type,
            preferred_ingredients: command.preferred_ingredients || '',
            preferred_cuisines: command.preferred_cuisines || '',
            allergens: command.allergens || '',
            notes: command.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single();

      if (error) throw error;

      return data as UserPreferencesDTO;
    } catch (error) {
      console.error('[PreferencesService] upsertPreferences error:', error);
      throw error;
    }
  }

  async patchPreferences(
    userId: string,
    command: PatchPreferencesCommand
  ): Promise<UserPreferencesDTO | null> {
    try {
      // First check if preferences exist
      const existing = await this.getPreferences(userId);
      if (!existing) {
        return null;
      }

      // Build update object with only provided fields
      const updateData: Partial<UpdatePreferencesCommand> & {
        updated_at: string;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (command.diet_type !== undefined) {
        updateData.diet_type = command.diet_type;
      }
      if (command.preferred_ingredients !== undefined) {
        updateData.preferred_ingredients = command.preferred_ingredients;
      }
      if (command.preferred_cuisines !== undefined) {
        updateData.preferred_cuisines = command.preferred_cuisines;
      }
      if (command.allergens !== undefined) {
        updateData.allergens = command.allergens;
      }
      if (command.notes !== undefined) {
        updateData.notes = command.notes;
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data as UserPreferencesDTO;
    } catch (error) {
      console.error('[PreferencesService] patchPreferences error:', error);
      throw error;
    }
  }
}
```

---

### Krok 4: Implementacja Endpoint Handlers

4.1. Utwórz `src/pages/api/preferences.ts`:
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  UpdatePreferencesCommandSchema,
  PatchPreferencesCommandSchema,
} from '../../types';
import { PreferencesService } from '../../lib/services/preferences.service';

export const prerender = false;

// GET /api/preferences
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // Get preferences
    const service = new PreferencesService(locals.supabase);
    const preferences = await service.getPreferences(userId);

    if (!preferences) {
      return new Response(
        JSON.stringify({
          error: 'Preferences not found',
          message: 'User has not completed onboarding',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] [GET /api/preferences]`,
      error
    );

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT /api/preferences
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request body
    const validation = UpdatePreferencesCommandSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: firstError.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Upsert preferences
    const service = new PreferencesService(locals.supabase);
    const preferences = await service.upsertPreferences(
      userId,
      validation.data
    );

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] [PUT /api/preferences]`,
      error
    );

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PATCH /api/preferences
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = session.user.id;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request body
    const validation = PatchPreferencesCommandSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: firstError.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Patch preferences
    const service = new PreferencesService(locals.supabase);
    const preferences = await service.patchPreferences(
      userId,
      validation.data
    );

    if (!preferences) {
      return new Response(
        JSON.stringify({
          error: 'Preferences not found',
          message: 'Cannot update non-existent preferences',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] [PATCH /api/preferences]`,
      error
    );

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

---

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

5.1. Sprawdź `src/middleware/index.ts`:
```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  // Inject Supabase client
  context.locals.supabase = supabaseClient;
  return next();
});
```

5.2. Zaktualizuj `src/env.d.ts` jeśli nie zawiera typu SupabaseClient:
```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
  }
}
```

---

### Krok 6: Testowanie

6.1. **Test GET endpoint:**
```bash
# Najpierw uzyskaj session token (przez login)
# Następnie:
curl -X GET http://localhost:4321/api/preferences \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

6.2. **Test PUT endpoint:**
```bash
curl -X PUT http://localhost:4321/api/preferences \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "vegetarian",
    "preferred_ingredients": "tomatoes, basil",
    "preferred_cuisines": "Italian",
    "allergens": "peanuts",
    "notes": "Quick meals preferred"
  }'
```

6.3. **Test PATCH endpoint:**
```bash
curl -X PATCH http://localhost:4321/api/preferences \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allergens": "peanuts, shellfish"
  }'
```

6.4. **Test error scenarios:**
- Brak authentication header → 401
- GET gdy preferencje nie istnieją → 404
- PUT bez diet_type → 400
- PATCH z pustym body → 400
- Nieprawidłowy JSON → 400

---

### Krok 7: Linting i poprawa jakości kodu

7.1. Uruchom linter:
```bash
npm run lint
```

7.2. Popraw wszystkie błędy ESLint zgodnie z regułami projektu

7.3. Sprawdź TypeScript errors:
```bash
npx tsc --noEmit
```

---

### Krok 8: Dokumentacja i deployment

8.1. Zaktualizuj dokumentację API w `.ai/api-plan.md` jeśli potrzebne

8.2. Upewnij się, że wszystkie environment variables są ustawione:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

8.3. Zbuduj aplikację:
```bash
npm run build
```

8.4. Deploy zgodnie z procesem CI/CD projektu

---

## 10. Checklist wdrożenia

- [ ] Zastosowano migrację bazy danych
- [ ] Wygenerowano zaktualizowane typy database.types.ts
- [ ] Dodano RLS policies do user_preferences
- [ ] Utworzono DTOs i validation schemas w types.ts
- [ ] Zaimplementowano PreferencesService
- [ ] Zaimplementowano GET endpoint
- [ ] Zaimplementowano PUT endpoint
- [ ] Zaimplementowano PATCH endpoint
- [ ] Zaktualizowano middleware i env.d.ts
- [ ] Przetestowano wszystkie endpointy (success paths)
- [ ] Przetestowano scenariusze błędów
- [ ] Uruchomiono linter i poprawiono błędy
- [ ] Sprawdzono TypeScript errors
- [ ] Zaktualizowano dokumentację
- [ ] Zweryfikowano environment variables
- [ ] Wykonano build aplikacji
- [ ] Przeprowadzono code review
- [ ] Zadeploy owano na środowisko testowe

---

## 11. Potencjalne rozszerzenia (poza MVP)

- Dodanie walidacji dla predefiniowanej listy diet_type (enum)
- Implementacja tagów dla ingredients/cuisines zamiast plain text
- Dodanie pola language dla wielojęzyczności
- Historia zmian preferencji (audit log)
- Sugestie AI dla uzupełnienia preferencji
- Import preferencji z zewnętrznych źródeł
- Eksport preferencji do formatu JSON/PDF

---

## 12. Kontakt i wsparcie

W przypadku pytań lub problemów podczas implementacji:
1. Sprawdź dokumentację Supabase: https://supabase.com/docs
2. Sprawdź dokumentację Astro: https://docs.astro.build
3. Przejrzyj logi błędów w Supabase Dashboard
4. Skonsultuj z zespołem na Slacku/Teams

---

**Data utworzenia planu:** 2025-10-12  
**Wersja:** 1.0  
**Status:** Ready for implementation

