# API Endpoint Implementation Plan: AI Recipe Generation

## 1. Przegląd punktu końcowego

Endpointy AI Recipe Generation umożliwiają użytkownikom generowanie nowych przepisów kulinarnych przy użyciu sztucznej inteligencji na podstawie dostępnych składników i osobistych preferencji żywieniowych. System zapisuje wszystkie próby generowania (zarówno udane jak i nieudane) w celach diagnostycznych i analitycznych.

**Funkcjonalności:**

- Generowanie przepisów AI na podstawie składników i preferencji użytkownika
- Przeglądanie historii generacji AI
- Wyświetlanie szczegółów konkretnej generacji
- Obsługa błędów z sugestiami dla użytkownika

**Zasoby bazy danych:**

- Tabela: `ai_generations` (odczyt i zapis)
- Tabela: `user_preferences` (odczyt)
- Zewnętrzna usługa: OpenRouter API

---

## 2. Szczegóły żądań

### 2.1 POST /api/ai/generate-recipe

Generuje nowy przepis używając AI.

**Metoda HTTP:** POST

**Struktura URL:** `/api/ai/generate-recipe`

**Parametry:**

- **Wymagane w body:**
  - `available_ingredients` (string[]): Lista dostępnych składników, min 1, max 20 elementów, każdy 1-100 znaków
- **Opcjonalne w body:**
  - `dietary_goals` (string): Cele dietetyczne (np. "high protein, low carb"), max 500 znaków
  - `additional_context` (string): Dodatkowy kontekst (np. "Quick weeknight dinner"), max 1000 znaków

**Request Body (przykład):**

```json
{
  "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
  "dietary_goals": "high protein, low carb",
  "additional_context": "Quick weeknight dinner under 30 minutes"
}
```

**Automatycznie dodawane:**

- Preferencje użytkownika z tabeli `user_preferences`

---

### 2.2 GET /api/ai/generations

Pobiera historię generacji AI dla zalogowanego użytkownika.

**Metoda HTTP:** GET

**Struktura URL:** `/api/ai/generations`

**Query Parameters:**

- **Opcjonalne:**
  - `status` (string): Filtrowanie według statusu: "success", "error", "all" (domyślnie: "all")

**Przykłady URL:**

- `/api/ai/generations` - wszystkie generacje
- `/api/ai/generations?status=success` - tylko udane
- `/api/ai/generations?status=error` - tylko nieudane

---

### 2.3 GET /api/ai/generations/:id

Pobiera szczegóły konkretnej generacji AI.

**Metoda HTTP:** GET

**Struktura URL:** `/api/ai/generations/:id`

**Path Parameters:**

- **Wymagane:**
  - `id` (uuid): Identyfikator generacji

**Przykład URL:**

- `/api/ai/generations/550e8400-e29b-41d4-a716-446655440000`

---

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

Z pliku `src/types.ts`:

```typescript
// Input dla generowania przepisu
export interface AIGenerateRecipeInput {
  available_ingredients: string[];
  dietary_goals?: string;
  additional_context?: string;
}

// Wygenerowany przepis
export interface AIGeneratedRecipe {
  title: string;
  summary: string;
  ingredients: string;
  preparation: string;
}

// Pełny payload z preferencjami użytkownika
export type AIInputPayload = AIGenerateRecipeInput & {
  user_preferences: PreferencesInput;
};

// Odpowiedź sukcesu
export interface AIGenerateRecipeResponse {
  generation_id: string;
  recipe: AIGeneratedRecipe;
  input_payload: AIInputPayload;
  created_at: string;
}

// Odpowiedź błędu z sugestiami
export interface AIGenerateRecipeErrorResponse {
  error: string;
  message: string;
  generation_id: string;
  suggestions: string[];
}

// Encja generacji z bazy
export type AIGeneration = AIGenerationEntity;

// Lista generacji
export interface AIGenerationListResponse {
  generations: AIGeneration[];
}
```

### 3.2 Validation Schemas

Nowy plik `src/lib/validation/ai-generation.schemas.ts`:

```typescript
import { z } from "zod";

/**
 * Validation schema dla generowania przepisu
 */
export const AIGenerateRecipeInputSchema = z.object({
  available_ingredients: z
    .array(
      z
        .string()
        .min(1, "Ingredient name cannot be empty")
        .max(100, "Ingredient name must be at most 100 characters")
        .trim()
    )
    .min(1, "At least one ingredient is required")
    .max(20, "Maximum 20 ingredients allowed"),
  dietary_goals: z.string().max(500, "Dietary goals must be at most 500 characters").trim().optional(),
  additional_context: z.string().max(1000, "Additional context must be at most 1000 characters").trim().optional(),
});

/**
 * Validation schema dla query parameters historii generacji
 */
export const AIGenerationsQuerySchema = z.object({
  status: z.enum(["success", "error", "all"]).optional().default("all"),
});
```

### 3.3 Database Types

Z pliku `src/db/database.types.ts` - tabela `ai_generations`:

```typescript
ai_generations: {
  Row: {
    created_at: string;
    error_message: string | null;
    id: string;
    input_payload: Json;
    output_payload: Json | null;
    user_id: string;
  };
  Insert: {
    created_at?: string;
    error_message?: string | null;
    id?: string;
    input_payload: Json;
    output_payload?: Json | null;
    user_id: string;
  };
  Update: {
    created_at?: string;
    error_message?: string | null;
    id?: string;
    input_payload?: Json;
    output_payload?: Json | null;
    user_id?: string;
  };
}
```

---

## 4. Szczegóły odpowiedzi

### 4.1 POST /api/ai/generate-recipe

**Response 200 OK (Sukces):**

```json
{
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "recipe": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts, 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan over medium-high heat. 3. Cook chicken 6-7 minutes per side until golden and cooked through. 4. Remove chicken and set aside. 5. In the same pan, sauté garlic for 30 seconds. 6. Add broccoli and cook 5-6 minutes until tender-crisp. 7. Slice chicken and serve with broccoli."
  },
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables",
      "preferred_cuisines": "American, Asian",
      "allergens": "peanuts, shellfish"
    }
  },
  "created_at": "2025-10-12T15:00:00Z"
}
```

**Response 422 Unprocessable Entity (AI nie może wygenerować przepisu):**

```json
{
  "error": "No recipe generated",
  "message": "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "suggestions": [
    "Add a protein source (meat, tofu, eggs)",
    "Include a carbohydrate (rice, pasta, potatoes)",
    "Relax dietary restrictions"
  ]
}
```

**Response 404 Not Found (brak preferencji):**

```json
{
  "error": "Preferences not found",
  "message": "User has not completed onboarding. Please complete your profile first."
}
```

**Response 400 Bad Request:**

```json
{
  "error": "Validation failed",
  "message": "At least one ingredient is required",
  "details": {
    "fields": [...]
  }
}
```

**Response 500 Internal Server Error:**

```json
{
  "error": "AI service error",
  "message": "Failed to generate recipe. The error has been logged.",
  "generation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4.2 GET /api/ai/generations

**Response 200 OK:**

```json
{
  "generations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "00000000-0000-0000-0000-000000000000",
      "input_payload": {
        "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
        "dietary_goals": "high protein, low carb"
      },
      "output_payload": {
        "title": "Garlic Chicken with Broccoli",
        "summary": "A quick and healthy high-protein dinner",
        "ingredients": "...",
        "preparation": "..."
      },
      "error_message": null,
      "created_at": "2025-10-12T15:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "00000000-0000-0000-0000-000000000000",
      "input_payload": {
        "available_ingredients": ["tomato", "cheese"]
      },
      "output_payload": null,
      "error_message": "Insufficient ingredients to create a complete meal",
      "created_at": "2025-10-12T14:00:00Z"
    }
  ]
}
```

---

### 4.3 GET /api/ai/generations/:id

**Response 200 OK:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables",
      "preferred_cuisines": "American, Asian",
      "allergens": "peanuts, shellfish"
    }
  },
  "output_payload": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts, 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan..."
  },
  "error_message": null,
  "created_at": "2025-10-12T15:00:00Z"
}
```

**Response 404 Not Found:**

```json
{
  "error": "Generation not found",
  "message": "AI generation record does not exist"
}
```

**Response 403 Forbidden:**

```json
{
  "error": "Access denied",
  "message": "You can only access your own AI generations"
}
```

---

## 5. Przepływ danych

### 5.1 POST /api/ai/generate-recipe - Przepływ

```
1. Żądanie HTTP → API Route Handler
   ↓
2. Walidacja JSON body (Zod Schema)
   ↓
3. Pobranie preferencji użytkownika z bazy (user_preferences)
   ↓ (jeśli brak → 404 Not Found)
4. Utworzenie rekordu ai_generations (status: pending)
   ↓
5. Przygotowanie pełnego payloadu (składniki + preferencje + kontekst)
   ↓
6. Wywołanie OpenRouter API z prompem
   ↓
7a. SUKCES:
    - Parsowanie odpowiedzi AI
    - Update rekordu ai_generations (output_payload)
    - Zwrócenie 200 OK z przepisem
   ↓
7b. BŁĄD AI (brak przepisu):
    - Update rekordu ai_generations (error_message)
    - Generowanie sugestii dla użytkownika
    - Zwrócenie 422 Unprocessable Entity
   ↓
7c. BŁĄD TECHNICZNY:
    - Update rekordu ai_generations (error_message)
    - Logowanie błędu
    - Zwrócenie 500 Internal Server Error
```

### 5.2 GET /api/ai/generations - Przepływ

```
1. Żądanie HTTP → API Route Handler
   ↓
2. Parsowanie query parameters (status filter)
   ↓
3. Pobranie generacji użytkownika z bazy
   - WHERE user_id = current_user
   - Filtrowanie według status (success/error) jeśli podano
   - ORDER BY created_at DESC
   ↓
4. Zwrócenie 200 OK z listą generacji
```

### 5.3 GET /api/ai/generations/:id - Przepływ

```
1. Żądanie HTTP → API Route Handler
   ↓
2. Walidacja UUID w parametrze :id
   ↓
3. Pobranie generacji z bazy
   ↓ (jeśli nie istnieje → 404 Not Found)
4. Sprawdzenie autoryzacji (generation.user_id === current_user_id)
   ↓ (jeśli nie → 403 Forbidden)
5. Zwrócenie 200 OK ze szczegółami generacji
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- **Mechanizm:** Supabase Auth JWT token
- **Implementacja:** Middleware weryfikuje token i dodaje `user_id` do `locals`
- **Wszystkie endpointy wymagają uwierzytelnienia**

### 6.2 Autoryzacja

- **Dostęp do danych:** Użytkownik może odczytywać tylko własne generacje
- **RLS (Row Level Security):** Zasady na poziomie bazy danych (`user_id = auth.uid()`)
- **GET /:id endpoint:** Dodatkowa weryfikacja właściciela w kodzie aplikacji

### 6.3 Walidacja danych wejściowych

**Zod schemas zapobiegają:**

- **Injection attacks:** Walidacja typów i długości stringów
- **DoS attacks:** Limit liczby składników (max 20), limit długości stringów
- **Invalid data:** Wymuszenie poprawnych typów i formatów

**Sanityzacja przed AI:**

- Trim białych znaków
- Walidacja długości
- Sprawdzenie czy składniki nie są puste

### 6.4 Ochrona kluczy API

**OpenRouter API Key:**

- Przechowywany w zmiennych środowiskowych (`OPENROUTER_API_KEY`)
- NIE eksponowany w kodzie klienta
- Używany tylko po stronie serwera (Astro API routes)

**Supabase credentials:**

- `SUPABASE_URL` i `SUPABASE_KEY` w zmiennych środowiskowych
- Service role key dla operacji administratorskich (jeśli potrzebny)

### 6.5 Zapobieganie Data Leakage

**Preferencje użytkownika:**

- Zawierają wrażliwe dane (alergeny, diety, notatki)
- Przekazywane do AI, ale nie eksponowane w publicznych endpointach
- Zwracane tylko właścicielowi w `input_payload`

**Izolacja użytkowników:**

- Wszystkie zapytania filtrują po `user_id`
- RLS na poziomie bazy danych jako dodatkowa warstwa

---

## 7. Obsługa błędów

### 7.1 Kategorie błędów

| Kod     | Kategoria             | Scenariusze                                                                                             | Obsługa                                                       |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **400** | Bad Request           | - Nieprawidłowy JSON<br>- Brak wymaganych pól<br>- Niewłaściwe typy<br>- Przekroczenie limitów długości | Zwróć szczegółowy komunikat walidacji Zod                     |
| **401** | Unauthorized          | - Brak JWT tokena<br>- Nieprawidłowy token<br>- Wygasła sesja                                           | "Unauthorized. Please log in."                                |
| **403** | Forbidden             | - Próba dostępu do cudzej generacji (GET /:id)                                                          | "Access denied. You can only access your own AI generations." |
| **404** | Not Found             | - Preferencje użytkownika nie istnieją<br>- Generacja o podanym ID nie istnieje                         | "Preferences not found" lub "Generation not found"            |
| **422** | Unprocessable Entity  | - AI nie może wygenerować przepisu<br>- Zbyt mało składników<br>- Konflikt z preferencjami              | Zwróć sugestie dla użytkownika                                |
| **500** | Internal Server Error | - Błąd komunikacji z OpenRouter<br>- Błąd bazy danych<br>- Nieoczekiwany błąd parsowania                | Zapisz w `error_message`, zwróć generic message               |

### 7.2 Szczegółowa obsługa błędów

#### POST /api/ai/generate-recipe

**Błąd walidacji (400):**

```typescript
try {
  validatedData = AIGenerateRecipeInputSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

**Brak preferencji (404):**

```typescript
const preferences = await getUserPreferences(userId, supabase);
if (!preferences) {
  return new Response(
    JSON.stringify({
      error: "Preferences not found",
      message: "User has not completed onboarding. Please complete your profile first.",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**AI nie wygenerował przepisu (422):**

```typescript
if (!aiResponse || !aiResponse.recipe) {
  await updateAIGenerationError(generationId, "Unable to generate recipe with provided ingredients", supabase);

  const suggestions = generateSuggestions(validatedData, preferences);

  return new Response(
    JSON.stringify({
      error: "No recipe generated",
      message:
        "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
      generation_id: generationId,
      suggestions,
    }),
    {
      status: 422,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Błąd AI service (500):**

```typescript
catch (error) {
  console.error("AI generation error:", error);

  // Zapisz błąd w bazie
  await updateAIGenerationError(
    generationId,
    error instanceof Error ? error.message : "Unknown error",
    supabase
  );

  return new Response(JSON.stringify({
    error: "AI service error",
    message: "Failed to generate recipe. The error has been logged.",
    generation_id: generationId
  }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

#### GET /api/ai/generations/:id

**Generacja nie istnieje (404):**

```typescript
const generation = await getGenerationById(generationId, supabase);
if (!generation) {
  return new Response(
    JSON.stringify({
      error: "Generation not found",
      message: "AI generation record does not exist",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Brak autoryzacji (403):**

```typescript
if (generation.user_id !== userId) {
  return new Response(
    JSON.stringify({
      error: "Access denied",
      message: "You can only access your own AI generations",
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### 7.3 Logowanie błędów

**Wszystkie błędy:**

- Logowane do konsoli z pełnym stack trace
- Zapisywane w tabeli `ai_generations.error_message` (dla błędów generacji)

**Struktura logów:**

```typescript
console.error("AI generation error:", {
  userId,
  generationId,
  input: validatedData,
  error: error instanceof Error ? error.message : "Unknown",
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**1. Wywołania AI (OpenRouter):**

- **Problem:** Latencja 2-10 sekund na request
- **Rozwiązanie (MVP):** Synchroniczne wywołanie z timeoutem
- **Rozwiązanie (future):** Asynchroniczne przetwarzanie z webhookiem lub polling

**2. Pobieranie preferencji:**

- **Problem:** Dodatkowe query do bazy
- **Rozwiązanie:** Single query z JOIN (niezbędne dla pełnego payloadu)
- **Optymalizacja:** Cache preferencji w sesji użytkownika (future)

### 8.2 Strategie optymalizacji

#### Indeksy bazy danych

```sql
-- Dla historii użytkownika
CREATE INDEX idx_ai_generations_user_created
ON ai_generations(user_id, created_at DESC);

-- Dla filtrowania według statusu
CREATE INDEX idx_ai_generations_user_status
ON ai_generations(user_id)
WHERE output_payload IS NOT NULL OR error_message IS NOT NULL;
```

#### Timeout dla AI requests

```typescript
const AI_REQUEST_TIMEOUT = 30000; // 30 sekund

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("AI request timeout")), AI_REQUEST_TIMEOUT);
});

const aiResponse = await Promise.race([generateRecipe(prompt, apiKey), timeoutPromise]);
```

#### Retry logic dla OpenRouter

```typescript
async function generateRecipeWithRetry(prompt: string, apiKey: string, maxRetries = 2): Promise<AIGeneratedRecipe> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateRecipe(prompt, apiKey);
    } catch (error) {
      lastError = error as Error;

      // Nie retry dla błędów walidacji (4xx)
      if (error instanceof Error && error.message.includes("400")) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError!;
}
```

#### Pagination dla historii (future enhancement)

```typescript
// Query parameters
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// W API route
const page = parseInt(searchParams.get("page") || "1");
const pageSize = Math.min(parseInt(searchParams.get("page_size") || String(DEFAULT_PAGE_SIZE)), MAX_PAGE_SIZE);

const offset = (page - 1) * pageSize;

// Supabase query
const { data, error, count } = await supabase
  .from("ai_generations")
  .select("*", { count: "exact" })
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .range(offset, offset + pageSize - 1);
```

### 8.3 Monitoring wydajności

**Metryki do śledzenia:**

- Średni czas odpowiedzi OpenRouter
- Liczba timeout'ów AI requests
- Liczba udanych vs nieudanych generacji
- Średnia liczba składników w requestach

**Implementacja (future):**

- Logging do zewnętrznego serwisu (np. Sentry, DataDog)
- Dashboard z metrykami

---

## 9. Kroki implementacji

### Krok 1: Utworzenie validation schemas

**Plik:** `src/lib/validation/ai-generation.schemas.ts`

**Zadanie:**

- Zdefiniować `AIGenerateRecipeInputSchema` z walidacją:
  - `available_ingredients`: array[1-20], każdy string[1-100]
  - `dietary_goals`: optional string[max 500]
  - `additional_context`: optional string[max 1000]
- Zdefiniować `AIGenerationsQuerySchema`:
  - `status`: enum["success", "error", "all"], default "all"
- Dodać testy jednostkowe dla schemas

**Przykład:**

```typescript
import { z } from "zod";

export const AIGenerateRecipeInputSchema = z.object({
  available_ingredients: z
    .array(
      z
        .string()
        .min(1, "Ingredient name cannot be empty")
        .max(100, "Ingredient name must be at most 100 characters")
        .trim()
    )
    .min(1, "At least one ingredient is required")
    .max(20, "Maximum 20 ingredients allowed"),
  dietary_goals: z.string().max(500, "Dietary goals must be at most 500 characters").trim().optional(),
  additional_context: z.string().max(1000, "Additional context must be at most 1000 characters").trim().optional(),
});

export const AIGenerationsQuerySchema = z.object({
  status: z.enum(["success", "error", "all"]).optional().default("all"),
});
```

---

### Krok 2: Utworzenie AI Generation Service

**Plik:** `src/lib/services/ai-generation.service.ts`

**Zadanie:**
Utworzyć funkcje do zarządzania generacjami w bazie danych:

1. **`createAIGeneration()`** - Tworzy nowy rekord generacji
   - Parametry: `userId`, `inputPayload`, `supabase`
   - Zwraca: `generationId`

2. **`updateAIGenerationSuccess()`** - Aktualizuje rekord po sukcesie
   - Parametry: `generationId`, `outputPayload`, `supabase`
   - Zwraca: `AIGeneration`

3. **`updateAIGenerationError()`** - Aktualizuje rekord po błędzie
   - Parametry: `generationId`, `errorMessage`, `supabase`
   - Zwraca: `void`

4. **`getUserGenerations()`** - Pobiera historię generacji użytkownika
   - Parametry: `userId`, `statusFilter`, `supabase`
   - Zwraca: `AIGeneration[]`

5. **`getGenerationById()`** - Pobiera konkretną generację
   - Parametry: `generationId`, `supabase`
   - Zwraca: `AIGeneration | null`

**Przykład:**

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { AIGeneration, AIInputPayload, AIGeneratedRecipe } from "../../types";

export async function createAIGeneration(
  userId: string,
  inputPayload: AIInputPayload,
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase
    .from("ai_generations")
    .insert({
      user_id: userId,
      input_payload: inputPayload as any,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateAIGenerationSuccess(
  generationId: string,
  outputPayload: AIGeneratedRecipe,
  supabase: SupabaseClient
): Promise<AIGeneration> {
  const { data, error } = await supabase
    .from("ai_generations")
    .update({
      output_payload: outputPayload as any,
    })
    .eq("id", generationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAIGenerationError(
  generationId: string,
  errorMessage: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("ai_generations")
    .update({
      error_message: errorMessage,
    })
    .eq("id", generationId);

  if (error) throw error;
}

export async function getUserGenerations(
  userId: string,
  statusFilter: "success" | "error" | "all",
  supabase: SupabaseClient
): Promise<AIGeneration[]> {
  let query = supabase
    .from("ai_generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (statusFilter === "success") {
    query = query.not("output_payload", "is", null);
  } else if (statusFilter === "error") {
    query = query.not("error_message", "is", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getGenerationById(generationId: string, supabase: SupabaseClient): Promise<AIGeneration | null> {
  const { data, error } = await supabase.from("ai_generations").select("*").eq("id", generationId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}
```

---

### Krok 3: Utworzenie OpenRouter Service

**Plik:** `src/lib/services/openrouter.service.ts`

**Zadanie:**
Utworzyć serwis z mockowaną implementacją AI (dla MVP):

1. **`generateRecipe()`** - Zwraca mockowany przepis
   - Parametry: `inputPayload`, `apiKey`
   - Zwraca: `AIGeneratedRecipe`
   - Symuluje latencję 1-3 sekundy
   - Personalizuje przepis na podstawie składników

2. **`generateSuggestions()`** - Helper do generowania sugestii
   - Parametry: `ingredients`, `preferences`
   - Zwraca: `string[]`

**Przykład:**

```typescript
import type { AIInputPayload, AIGeneratedRecipe } from "../../types";

/**
 * MOCK IMPLEMENTATION for MVP
 * Replace with real OpenRouter API when ready for production
 */

export async function generateRecipe(inputPayload: AIInputPayload, _apiKey: string): Promise<AIGeneratedRecipe> {
  // Simulate API latency (1-3 seconds)
  const delay = 1000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Get first few ingredients for personalization
  const mainIngredients = inputPayload.available_ingredients.slice(0, 3).join(", ");

  // Return mock recipe
  return {
    title: `Delicious ${mainIngredients} Recipe`,
    summary: `A quick and healthy recipe using ${mainIngredients}, tailored to your ${inputPayload.user_preferences.diet_type} diet preferences.`,
    ingredients: `
Main ingredients:
- ${inputPayload.available_ingredients.map((ing) => `${ing} (as needed)`).join("\n- ")}

Additional:
- 2 tbsp olive oil
- Salt and pepper to taste
- 1 tsp garlic powder
- Fresh herbs for garnish
    `.trim(),
    preparation: `
1. Prepare all ingredients: wash, peel, and chop as needed.
2. Heat olive oil in a large pan over medium-high heat.
3. Add your main ingredients (${mainIngredients}) and cook for 5-7 minutes.
4. Season with salt, pepper, and garlic powder to taste.
5. ${inputPayload.dietary_goals ? `Follow your dietary goals: ${inputPayload.dietary_goals}` : "Cook until tender."}
6. Garnish with fresh herbs and serve immediately.
    `.trim(),
  };
}

export function generateSuggestions(ingredients: string[], preferences: any): string[] {
  const suggestions: string[] = [];

  if (ingredients.length < 3) {
    suggestions.push("Add more ingredients (at least 3-4 for a complete meal)");
  }

  // Check if has protein
  const proteinKeywords = ["chicken", "beef", "pork", "fish", "tofu", "eggs", "beans"];
  const hasProtein = ingredients.some((ing) => proteinKeywords.some((p) => ing.toLowerCase().includes(p)));
  if (!hasProtein) {
    suggestions.push("Add a protein source (meat, tofu, eggs, beans)");
  }

  // Check if has carbs
  const carbKeywords = ["rice", "pasta", "potato", "bread", "quinoa"];
  const hasCarbs = ingredients.some((ing) => carbKeywords.some((c) => ing.toLowerCase().includes(c)));
  if (!hasCarbs) {
    suggestions.push("Include a carbohydrate (rice, pasta, potatoes)");
  }

  if (preferences.allergens && preferences.allergens.length > 50) {
    suggestions.push("Consider relaxing some dietary restrictions");
  }

  return suggestions;
}
```

---

### Krok 4: Implementacja POST /api/ai/generate-recipe endpoint

**Plik:** `src/pages/api/ai/generate-recipe.ts`

**Zadanie:**

1. Parsowanie i walidacja request body
2. Pobranie preferencji użytkownika
3. Utworzenie rekordu generacji
4. Wywołanie OpenRouter API
5. Aktualizacja rekordu i zwrócenie odpowiedzi
6. Obsługa wszystkich błędów

**Przykład:**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ApiError, AIGenerateRecipeResponse, AIGenerateRecipeErrorResponse } from "../../../types";
import { AIGenerateRecipeInputSchema } from "../../../lib/validation/ai-generation.schemas";
import {
  createAIGeneration,
  updateAIGenerationSuccess,
  updateAIGenerationError,
} from "../../../lib/services/ai-generation.service";
import { getUserPreferences } from "../../../lib/services/preferences.service";
import { generateRecipe, generateSuggestions } from "../../../lib/services/openrouter.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // TODO: Replace with real auth
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    const errorResponse: ApiError = {
      error: "Invalid JSON",
      message: "Request body must be valid JSON",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate input
  let validatedData;
  try {
    validatedData = AIGenerateRecipeInputSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Validation failed",
        message: error.errors[0].message,
        details: { fields: error.errors },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  try {
    // Get user preferences
    const preferences = await getUserPreferences(testUserId, locals.supabase);
    if (!preferences) {
      const errorResponse: ApiError = {
        error: "Preferences not found",
        message: "User has not completed onboarding. Please complete your profile first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build full input payload
    const inputPayload = {
      ...validatedData,
      user_preferences: {
        diet_type: preferences.diet_type,
        preferred_ingredients: preferences.preferred_ingredients,
        preferred_cuisines: preferences.preferred_cuisines,
        allergens: preferences.allergens,
        notes: preferences.notes || undefined,
      },
    };

    // Create generation record
    const generationId = await createAIGeneration(testUserId, inputPayload, locals.supabase);

    // Call AI service
    try {
      const apiKey = import.meta.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key not configured");
      }

      const recipe = await generateRecipe(inputPayload, apiKey);

      // Update generation with success
      await updateAIGenerationSuccess(generationId, recipe, locals.supabase);

      // Return success response
      const response: AIGenerateRecipeResponse = {
        generation_id: generationId,
        recipe,
        input_payload: inputPayload,
        created_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (aiError) {
      // AI generation failed
      const errorMessage = aiError instanceof Error ? aiError.message : "Unknown AI error";

      await updateAIGenerationError(generationId, errorMessage, locals.supabase);

      // Check if it's a "no recipe" situation (422) or technical error (500)
      if (errorMessage.includes("Insufficient") || errorMessage.includes("cannot generate")) {
        const suggestions = generateSuggestions(validatedData.available_ingredients, preferences);

        const errorResponse: AIGenerateRecipeErrorResponse = {
          error: "No recipe generated",
          message:
            "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
          generation_id: generationId,
          suggestions,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Technical error
      console.error("AI generation error:", {
        userId: testUserId,
        generationId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ApiError = {
        error: "AI service error",
        message: "Failed to generate recipe. The error has been logged.",
        details: { generation_id: generationId },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in generate-recipe endpoint:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to process request. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Krok 5: Implementacja GET /api/ai/generations endpoint

**Plik:** `src/pages/api/ai/generations/index.ts`

**Zadanie:**

1. Parsowanie query parameters
2. Pobranie historii generacji użytkownika z filtrowaniem
3. Zwrócenie listy generacji

**Przykład:**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ApiError, AIGenerationListResponse } from "../../../../types";
import { AIGenerationsQuerySchema } from "../../../../lib/validation/ai-generation.schemas";
import { getUserGenerations } from "../../../../lib/services/ai-generation.service";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  // TODO: Replace with real auth
  const testUserId = "00000000-0000-0000-0000-000000000000";

  // Parse query parameters
  let queryParams;
  try {
    queryParams = AIGenerationsQuerySchema.parse({
      status: url.searchParams.get("status") || "all",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiError = {
        error: "Invalid query parameters",
        message: error.errors[0].message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  try {
    const generations = await getUserGenerations(testUserId, queryParams.status, locals.supabase);

    const response: AIGenerationListResponse = {
      generations,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching generations:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch generations. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Krok 6: Implementacja GET /api/ai/generations/:id endpoint

**Plik:** `src/pages/api/ai/generations/[id].ts`

**Zadanie:**

1. Walidacja UUID w parametrze
2. Pobranie generacji z bazy
3. Sprawdzenie autoryzacji (owner)
4. Zwrócenie szczegółów generacji

**Przykład:**

```typescript
import type { APIRoute } from "astro";
import type { ApiError, AIGeneration } from "../../../../types";
import { getGenerationById } from "../../../../lib/services/ai-generation.service";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // TODO: Replace with real auth
  const testUserId = "00000000-0000-0000-0000-000000000000";

  const generationId = params.id;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!generationId || !uuidRegex.test(generationId)) {
    const errorResponse: ApiError = {
      error: "Invalid ID",
      message: "Generation ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const generation = await getGenerationById(generationId, locals.supabase);

    if (!generation) {
      const errorResponse: ApiError = {
        error: "Generation not found",
        message: "AI generation record does not exist",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authorization
    if (generation.user_id !== testUserId) {
      const errorResponse: ApiError = {
        error: "Access denied",
        message: "You can only access your own AI generations",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(generation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    const errorResponse: ApiError = {
      error: "Internal server error",
      message: "Failed to fetch generation. Please try again later.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Krok 7: Dodanie zmiennych środowiskowych

**Plik:** `.env` (local development)

**Zadanie:**
Dodać klucz API OpenRouter:

```env
OPENROUTER_API_KEY=sk-or-v1-...your-key-here...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

**Uwaga:**

- Nie commitować pliku `.env` do repozytorium
- Dodać do `.gitignore` jeśli jeszcze nie istnieje
- W produkcji ustawić w panelu hostingu (DigitalOcean, Vercel, etc.)

---

### Krok 8: Dodanie indeksów do bazy danych

**Plik:** `supabase/migrations/YYYYMMDDHHMMSS_add_ai_generations_indexes.sql`

**Zadanie:**
Utworzyć indeksy dla wydajności:

```sql
-- Index for rate limiting
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_created
ON ai_generations(user_id, created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_ai_generations_status
ON ai_generations(user_id)
WHERE output_payload IS NOT NULL OR error_message IS NOT NULL;
```

**Wykonanie:**

```bash
supabase db push
```

---

### Krok 9: Testowanie endpointów

**Zadanie:**
Przetestować wszystkie endpointy ręcznie lub za pomocą narzędzi (Postman, curl, REST Client):

**Test 1: POST /api/ai/generate-recipe (sukces)**

```bash
curl -X POST http://localhost:4321/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick dinner under 30 minutes"
  }'
```

**Oczekiwany wynik:** 200 OK z wygenerowanym przepisem

**Test 2: POST /api/ai/generate-recipe (walidacja)**

```bash
curl -X POST http://localhost:4321/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": []
  }'
```

**Oczekiwany wynik:** 400 Bad Request z błędem walidacji

**Test 3: GET /api/ai/generations**

```bash
curl http://localhost:4321/api/ai/generations
```

**Oczekiwany wynik:** 200 OK z listą generacji

**Test 4: GET /api/ai/generations?status=success**

```bash
curl http://localhost:4321/api/ai/generations?status=success
```

**Oczekiwany wynik:** 200 OK z tylko udanymi generacjami

**Test 5: GET /api/ai/generations/:id**

```bash
# Replace with actual generation ID
curl http://localhost:4321/api/ai/generations/550e8400-e29b-41d4-a716-446655440000
```

**Oczekiwany wynik:** 200 OK ze szczegółami generacji

**Test 6: GET /api/ai/generations/:id (not found)**

```bash
curl http://localhost:4321/api/ai/generations/00000000-0000-0000-0000-000000000001
```

**Oczekiwany wynik:** 404 Not Found

---

### Krok 10: Obsługa lintów i kod review

**Zadanie:**

1. Uruchomić linter i naprawić błędy:

   ```bash
   npm run lint
   ```

2. Sprawdzić TypeScript errors:

   ```bash
   npm run astro check
   ```

3. Code review checklist:
   - [ ] Wszystkie typy poprawnie zdefiniowane
   - [ ] Obsługa wszystkich błędów zgodnie ze specyfikacją
   - [ ] Walidacja Zod dla wszystkich inputów
   - [ ] Retry logic dla OpenRouter
   - [ ] Timeout dla AI requests
   - [ ] Logging błędów do konsoli i bazy
   - [ ] Brak hardcoded secrets
   - [ ] Konsekwentny format odpowiedzi błędów
   - [ ] Poprawne kody statusu HTTP

---

### Krok 11: Dokumentacja (opcjonalne)

**Zadanie:**
Zaktualizować README.md z informacjami o:

- Nowych zmiennych środowiskowych
- Konfiguracji OpenRouter
- Przykładach użycia API

---

## 10. Podsumowanie

### Utworzone pliki:

1. `src/lib/validation/ai-generation.schemas.ts` - Validation schemas
2. `src/lib/services/ai-generation.service.ts` - Service dla generacji
3. `src/lib/services/openrouter.service.ts` - Service dla OpenRouter API
4. `src/pages/api/ai/generate-recipe.ts` - POST endpoint
5. `src/pages/api/ai/generations/index.ts` - GET list endpoint
6. `src/pages/api/ai/generations/[id].ts` - GET single endpoint
7. `supabase/migrations/YYYYMMDDHHMMSS_add_ai_generations_indexes.sql` - Indeksy

### Zmodyfikowane pliki:

- `.env` - Dodanie OPENROUTER_API_KEY

### Kluczowe funkcjonalności:

- ✅ Generowanie przepisów AI z preferencjami użytkownika
- ✅ Historia generacji z filtrowaniem
- ✅ Szczegółowa obsługa błędów
- ✅ Retry logic i timeout dla AI
- ✅ Logging wszystkich generacji do bazy
- ✅ Sugestie dla użytkownika w przypadku błędów
- ✅ Walidacja wszystkich inputów

### Następne kroki (poza MVP):

- Implementacja prawdziwej autentykacji (auth.uid())
- Dodanie RLS policies do bazy danych
- Asynchroniczne przetwarzanie generacji (webhooks/polling)
- Cache dla preferencji użytkownika
- Pagination dla historii generacji
- Dashboard z metrykami i monitoring
- Testy jednostkowe i integracyjne
- Rate limiting na poziomie infrastruktury (reverse proxy, CDN)

---

**Koniec planu implementacji**
