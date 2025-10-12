# API Endpoint Implementation Plan: Tags

## 1. Przegląd punktu końcowego

Endpoints API Tags umożliwiają użytkownikom zarządzanie tagami przepisów:

- Przeglądanie wszystkich tagów użytkownika z opcjonalnym wyszukiwaniem
- Dodawanie tagów do przepisów (z automatycznym tworzeniem nowych tagów)
- Usuwanie tagów z przepisów

Implementacja wzorowana jest na istniejącym endpointcie preferences, z logiką biznesową w warstwie service i walidacją Zod.

## 2. Szczegóły żądania

### Endpoint 1: GET /api/tags

**Metoda HTTP:** GET

**Struktura URL:** `/api/tags?search={searchTerm}`

**Parametry:**

- Opcjonalne:
  - `search` (string) - filtruje tagi po nazwie (częściowe dopasowanie, case-insensitive)

**Request Body:** Brak

---

### Endpoint 2: POST /api/recipes/:recipeId/tags

**Metoda HTTP:** POST

**Struktura URL:** `/api/recipes/{recipeId}/tags`

**Parametry:**

- Wymagane:
  - `recipeId` (uuid, path parameter) - ID przepisu

**Request Body:**

```json
{
  "tag_names": ["Italian", "Quick", "Vegetarian"]
}
```

**Walidacja:**

- `tag_names`: tablica stringów, min 1 element, max 10 elementów
- Każdy tag: 1-50 znaków, trimmed, non-empty
- Przepis nie może mieć więcej niż 10 tagów łącznie po dodaniu

---

### Endpoint 3: DELETE /api/recipes/:recipeId/tags/:tagId

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/recipes/{recipeId}/tags/{tagId}`

**Parametry:**

- Wymagane:
  - `recipeId` (uuid, path parameter) - ID przepisu
  - `tagId` (uuid, path parameter) - ID tagu

**Request Body:** Brak

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

```typescript
// Używane w odpowiedziach
export type Tag = Pick<TagEntity, "id" | "name" | "created_at">;

export type TagWithCount = Tag & {
  owner_id: string;
  recipe_count: number;
};

export interface TagListResponse {
  tags: TagWithCount[];
}

export interface AddTagsInput {
  tag_names: string[];
}

export interface AddTagsResponse {
  recipe_id: string;
  tags: Tag[];
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### Nowe typy do dodania w `src/lib/validation/tags.schemas.ts`:

```typescript
// Zod schemas
export const TagSearchQuerySchema = z.object({
  search: z.string().optional(),
});

export const AddTagsInputSchema = z.object({
  tag_names: z
    .array(z.string().trim().min(1, "Tag name cannot be empty").max(50, "Tag name must be at most 50 characters"))
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags can be added at once"),
});

export const UuidSchema = z.string().uuid("Invalid UUID format");
```

## 4. Szczegóły odpowiedzi

### GET /api/tags

**Sukces 200 OK:**

```json
{
  "tags": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Italian",
      "created_at": "2025-10-12T09:00:00Z",
      "recipe_count": 12
    }
  ]
}
```

**Błąd 500:**

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch tags. Please try again later."
}
```

---

### POST /api/recipes/:recipeId/tags

**Sukces 200 OK:**

```json
{
  "recipe_id": "uuid",
  "tags": [
    {
      "id": "uuid",
      "name": "Vegan",
      "created_at": "2025-10-12T14:00:00Z"
    }
  ],
  "message": "Tags added successfully"
}
```

**Błąd 400 Bad Request:**

```json
{
  "error": "Validation failed",
  "message": "Tag name cannot be empty",
  "details": { "fields": [...] }
}
```

**Błąd 404 Not Found:**

```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

**Błąd 422 Unprocessable Entity:**

```json
{
  "error": "Tag limit exceeded",
  "message": "Recipe already has 10 tags. Remove some tags before adding new ones."
}
```

---

### DELETE /api/recipes/:recipeId/tags/:tagId

**Sukces 204 No Content:**
Empty response body

**Błąd 404 Not Found:**

```json
{
  "error": "Association not found",
  "message": "Tag is not associated with this recipe"
}
```

**Błąd 400 Bad Request:**

```json
{
  "error": "Invalid UUID",
  "message": "Invalid UUID format"
}
```

## 5. Przepływ danych

### GET /api/tags

1. API route odbiera żądanie z opcjonalnym parametrem `search`
2. Walidacja query params (Zod schema)
3. Wywołanie `getUserTags(testUserId, supabase, search)`
4. Service wykonuje query:
   - SELECT z `tags` WHERE `owner_id = userId`
   - LEFT JOIN z `recipe_tags` dla zliczenia przepisów
   - GROUP BY dla `recipe_count`
   - Opcjonalnie filtruje po nazwie (ILIKE)
   - ORDER BY `name` ASC
5. Zwrócenie `TagListResponse`

### POST /api/recipes/:recipeId/tags

1. API route waliduje `recipeId` (UUID)
2. Parse i walidacja request body (Zod schema)
3. Wywołanie `addTagsToRecipe(testUserId, recipeId, tag_names, supabase)`
4. Service flow:
   - Sprawdź czy przepis istnieje i należy do użytkownika
   - Pobierz aktualną liczbę tagów przepisu
   - Waliduj czy po dodaniu nie przekroczy 10 tagów
   - Dla każdej nazwy tagu:
     - Sprawdź czy tag istnieje (case-insensitive, LOWER(name))
     - Jeśli nie, utwórz nowy tag
   - Utwórz powiązania `recipe_tags` (ON CONFLICT DO NOTHING dla idempotentności)
   - Pobierz wszystkie tagi przepisu i zwróć
5. Zwrócenie `AddTagsResponse`

### DELETE /api/recipes/:recipeId/tags/:tagId

1. API route waliduje `recipeId` i `tagId` (UUID)
2. Wywołanie `removeTagFromRecipe(testUserId, recipeId, tagId, supabase)`
3. Service flow:
   - Sprawdź czy przepis istnieje i należy do użytkownika
   - Usuń powiązanie z `recipe_tags` WHERE `recipe_id` AND `tag_id`
   - Jeśli affected_rows = 0, zwróć 404
4. Zwrócenie 204 No Content

## 6. Względy bezpieczeństwa

**Uwaga:** Zgodnie z wymaganiami użytkownika, na ten moment **nie implementujemy autoryzacji**. Używamy test user ID jak w preferences endpoint.

### Obecne zabezpieczenia:

1. **Walidacja UUID:** Wszystkie parametry path zawierające UUID są walidowane przez Zod
2. **Walidacja danych wejściowych:** Zod schemas zapobiegają SQL injection przez typowanie
3. **Sprawdzanie właściciela:** Service layer weryfikuje `owner_id` przed operacjami
4. **Trimming:** Nazwy tagów są trimowane, zapobiegając whitespace exploitation
5. **Limity:** Max 10 tagów per przepis, max 50 znaków per tag

### Przyszłe zabezpieczenia (po dodaniu auth):

1. **JWT Authentication:** Weryfikacja tokena w middleware
2. **RLS Policies:** Row Level Security w Supabase (zdefiniowane w db-plan.md):

   ```sql
   -- tags table
   CREATE POLICY tags_select ON tags FOR SELECT USING (owner_id = auth.uid());
   CREATE POLICY tags_insert ON tags FOR INSERT WITH CHECK (owner_id = auth.uid());

   -- recipe_tags table
   CREATE POLICY recipe_tags_all ON recipe_tags FOR ALL
   USING (EXISTS (
     SELECT 1 FROM recipes WHERE id = recipe_id AND owner_id = auth.uid()
   ));
   ```

3. **Rate Limiting:** Ograniczenie liczby requestów per user

## 7. Obsługa błędów

### Kategorie błędów:

**Walidacja (400 Bad Request):**

- Nieprawidłowy JSON w body
- Brak wymaganych pól
- Nieprawidłowy format UUID
- Pusta tablica `tag_names`
- Nazwa tagu za długa (>50 znaków) lub pusta po trim
- Za dużo tagów w żądaniu (>10)

**Przykład:**

```typescript
if (error instanceof z.ZodError) {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      message: error.errors[0].message,
      details: { fields: error.errors },
    }),
    { status: 400 }
  );
}
```

**Not Found (404):**

- Przepis nie istnieje lub został usunięty (soft delete)
- Przepis nie należy do użytkownika
- Tag nie jest powiązany z przepisem (DELETE endpoint)

**Business Rule Violation (422 Unprocessable Entity):**

- Przepis już ma 10 tagów (nie można dodać więcej)

**Przykład:**

```typescript
if (currentTagCount + newTagsCount > 10) {
  return new Response(
    JSON.stringify({
      error: "Tag limit exceeded",
      message: "Recipe already has 10 tags. Remove some tags before adding new ones.",
    }),
    { status: 422 }
  );
}
```

**Server Error (500):**

- Błędy Supabase/PostgreSQL
- Nieoczekiwane wyjątki

**Logowanie:**

```typescript
catch (error) {
  console.error(`Error adding tags to recipe ${recipeId}:`, error);
  return new Response(JSON.stringify({
    error: "Internal server error",
    message: "Failed to add tags. Please try again later."
  }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań:

1. **Indeksy (zalecane w db-plan.md):**
   - `tags(owner_id, name)` - dla unikalności i szybkiego wyszukiwania
   - `recipe_tags(tag_id)` - dla JOIN operations
   - `recipe_tags(recipe_id)` - dla zliczania tagów przepisu

2. **Agregacja w bazie:**
   - Zliczanie `recipe_count` za pomocą LEFT JOIN i GROUP BY w SQL, nie w aplikacji
   - Query dla GET /api/tags:

   ```sql
   SELECT t.*, COUNT(rt.recipe_id) as recipe_count
   FROM tags t
   LEFT JOIN recipe_tags rt ON t.id = rt.tag_id
   WHERE t.owner_id = $1
   GROUP BY t.id
   ORDER BY t.name ASC
   ```

3. **Batch Operations:**
   - Dodawanie wielu tagów w jednej transakcji
   - Użycie `ON CONFLICT DO NOTHING` dla idempotentności

4. **Caching (przyszłość):**
   - Cache listy tagów użytkownika (rzadko się zmieniają)
   - Invalidacja przy dodaniu/usunięciu tagu

### Potencjalne wąskie gardła:

1. **Case-insensitive search:** ILIKE może być wolne - rozważyć trigram index lub full-text search
2. **Sprawdzanie duplikatów:** LOWER(name) comparison dla każdego tagu - batching może pomóc

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod schemas ✓

**Plik:** `src/lib/validation/tags.schemas.ts`

Zaimplementowane:

- `TagSearchQuerySchema` - walidacja parametru search
- `AddTagsInputSchema` - walidacja tag_names array z trimming i limitami
- `UuidSchema` - walidacja UUID format

### Krok 2: Utworzenie Tags Service ✓

**Plik:** `src/lib/services/tags.service.ts`

Zaimplementowane funkcje:

- `getUserTags` - pobiera tagi użytkownika z recipe_count
- `addTagsToRecipe` - dodaje tagi do przepisu z walidacją limitu
- `removeTagFromRecipe` - usuwa tag z przepisu
- `getOrCreateSingleTag` - helper do tworzenia/pobierania pojedynczego tagu
- `findExistingTag` - helper do wyszukiwania istniejącego tagu
- `createNewTag` - helper do tworzenia nowego tagu z obsługą race conditions
- `validateRecipeOwnership` - helper do sprawdzania własności przepisu
- `getRecipeTagCount` - helper do liczenia tagów przepisu

### Krok 3: Implementacja GET /api/tags ✓

**Plik:** `src/pages/api/tags/index.ts`

Zaimplementowano:

- Walidacja query params
- Obsługa opcjonalnego parametru search
- Zwracanie TagListResponse z recipe_count
- Obsługa błędów (400, 500)

### Krok 4: Implementacja POST /api/recipes/[recipeId]/tags ✓

**Plik:** `src/pages/api/recipes/[recipeId]/tags/index.ts`

Zaimplementowano:

- Walidacja UUID dla recipeId
- Walidacja request body
- Obsługa błędów (400, 404, 422, 500)
- Zwracanie AddTagsResponse

### Krok 5: Implementacja DELETE /api/recipes/[recipeId]/tags/[tagId] ✓

**Plik:** `src/pages/api/recipes/[recipeId]/tags/[tagId].ts`

Zaimplementowano:

- Walidacja UUID dla recipeId i tagId
- Zwracanie 204 No Content przy sukcesie
- Obsługa błędów (400, 404, 500)

### Krok 6: Testowanie

**Testy manualne:**

1. **GET /api/tags:**
   - Pobierz wszystkie tagi: `GET /api/tags`
   - Wyszukiwanie: `GET /api/tags?search=italian`
   - Sprawdź recipe_count

2. **POST /api/recipes/:recipeId/tags:**
   - Dodaj nowe tagi do przepisu
   - Dodaj istniejące tagi (idempotentność)
   - Spróbuj dodać >10 tagów (powinno zwrócić 422)
   - Nieprawidłowy UUID (400)
   - Puste nazwy tagów (400)

3. **DELETE /api/recipes/:recipeId/tags/:tagId:**
   - Usuń tag z przepisu
   - Usuń nieistniejące powiązanie (404)
   - Nieprawidłowy UUID (400)

**Przykładowe requesty (curl):**

```bash
# GET all tags
curl http://localhost:4321/api/tags

# GET tags with search
curl "http://localhost:4321/api/tags?search=italian"

# POST add tags
curl -X POST http://localhost:4321/api/recipes/{uuid}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_names": ["Italian", "Quick", "Healthy"]}'

# DELETE tag from recipe
curl -X DELETE http://localhost:4321/api/recipes/{recipe-uuid}/tags/{tag-uuid}
```

---

## Podsumowanie plików do utworzenia/zmodyfikowania:

**Nowe pliki (utworzone):**

1. ✓ `src/lib/validation/tags.schemas.ts` - Zod schemas
2. ✓ `src/lib/services/tags.service.ts` - Business logic
3. ✓ `src/pages/api/tags/index.ts` - GET endpoint
4. ✓ `src/pages/api/recipes/[recipeId]/tags/index.ts` - POST endpoint
5. ✓ `src/pages/api/recipes/[recipeId]/tags/[tagId].ts` - DELETE endpoint

**Bez zmian:**

- `src/types.ts` - już zawiera wszystkie potrzebne typy
- `src/db/database.types.ts` - typy bazy danych

## Uwagi końcowe:

1. **Spójność z preferences endpoint:** Plan stosuje te same wzorce co istniejąca implementacja preferences
2. **Bez autoryzacji:** Używamy test user ID zgodnie z wymaganiami
3. **Error handling:** Szczegółowa obsługa błędów z odpowiednimi kodami HTTP
4. **Validation:** Walidacja na każdym poziomie (Zod, business rules, database constraints)
5. **Idempotentność:** POST endpoint z ON CONFLICT DO NOTHING zapewnia idempotentność
6. **Cognitive Complexity:** Kod został zrefaktorowany, aby zmniejszyć złożoność poznawczą poprzez wydzielenie pomocniczych funkcji
