# Tags API - Przykłady curl dla Postman

## Konfiguracja

**Base URL:** `http://localhost:4321`  
**Test User ID:** `00000000-0000-0000-0000-000000000000`

## Przygotowanie danych testowych

### 1. Utwórz przykładowy przepis #1

```bash
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spaghetti Carbonara",
    "summary": "Klasyczny włoski przepis na makaron",
    "ingredients": "- 400g spaghetti\n- 200g boczku\n- 4 jajka\n- 100g parmezanu\n- Sól, pieprz",
    "preparation": "1. Ugotuj makaron al dente\n2. Podsmaż boczek\n3. Wymieszaj jajka z parmezanem\n4. Połącz wszystko razem",
    "tag_names": ["Italian", "Pasta", "Quick"]
  }'
```

### 2. Utwórz przykładowy przepis #2

```bash
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pad Thai",
    "summary": "Tajski makaron z kurczakiem",
    "ingredients": "- 200g makaronu ryżowego\n- 300g kurczaka\n- 2 jajka\n- Kiełki fasoli\n- Orzeszki ziemne",
    "preparation": "1. Namocz makaron\n2. Podsmaż kurczaka\n3. Dodaj makaron i sos\n4. Posyp orzeszkami",
    "tag_names": ["Asian", "Quick", "Chicken"]
  }'
```

### 3. Utwórz przykładowy przepis #3 (bez tagów)

```bash
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Zupa pomidorowa",
    "summary": "Tradycyjna polska zupa",
    "ingredients": "- 1kg pomidorów\n- Bulion warzywny\n- Śmietana\n- Bazylia",
    "preparation": "1. Obierz i pokrój pomidory\n2. Gotuj w bulionie\n3. Zblenduj\n4. Dodaj śmietanę"
  }'
```

### 4. Pobierz listę przepisów (skopiuj UUID)

```bash
curl http://localhost:4321/api/recipes
```

**Skopiuj `id` z odpowiedzi - będzie potrzebny w kolejnych requestach!**

---

## Tags API - Testowanie

> **UWAGA:** Zamień `{recipeId}` i `{tagId}` na prawdziwe UUID z poprzednich requestów!

### 📋 GET /api/tags - Pobierz wszystkie tagi

#### Wszystkie tagi użytkownika

```bash
curl http://localhost:4321/api/tags
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "tags": [
    {
      "id": "uuid",
      "owner_id": "00000000-0000-0000-0000-000000000000",
      "name": "Asian",
      "created_at": "2025-10-12T10:00:00Z",
      "recipe_count": 1
    },
    {
      "id": "uuid",
      "owner_id": "00000000-0000-0000-0000-000000000000",
      "name": "Chicken",
      "created_at": "2025-10-12T10:00:00Z",
      "recipe_count": 1
    },
    {
      "id": "uuid",
      "owner_id": "00000000-0000-0000-0000-000000000000",
      "name": "Italian",
      "created_at": "2025-10-12T10:00:00Z",
      "recipe_count": 1
    }
  ]
}
```

#### Wyszukiwanie tagów (case-insensitive)

```bash
curl "http://localhost:4321/api/tags?search=italian"
```

```bash
curl "http://localhost:4321/api/tags?search=quick"
```

**Oczekiwany status:** `200 OK`  
**Oczekiwany wynik:** Tylko tagi zawierające "italian" lub "quick" w nazwie

---

### ➕ POST /api/recipes/:recipeId/tags - Dodaj tagi do przepisu

> **Zamień `{recipeId}` na UUID przepisu z wcześniejszego requesta!**

#### Dodaj nowe tagi do przepisu

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Vegetarian", "Healthy", "Summer"]
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "recipe_id": "uuid",
  "tags": [
    {
      "id": "uuid",
      "name": "Italian",
      "created_at": "2025-10-12T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Pasta",
      "created_at": "2025-10-12T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Quick",
      "created_at": "2025-10-12T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Vegetarian",
      "created_at": "2025-10-12T14:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Healthy",
      "created_at": "2025-10-12T14:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Summer",
      "created_at": "2025-10-12T14:00:00Z"
    }
  ],
  "message": "Tags added successfully"
}
```

#### Dodaj istniejące tagi (idempotentność)

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Italian", "Quick"]
  }'
```

**Oczekiwany status:** `200 OK`  
**Oczekiwane zachowanie:** Nie tworzy duplikatów, zwraca istniejące tagi

---

### ❌ Testy walidacji i błędów

#### Test 1: Nieprawidłowy UUID przepisu

```bash
curl -X POST http://localhost:4321/api/recipes/invalid-uuid/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Test"]
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Invalid UUID",
  "message": "Invalid recipe ID format"
}
```

#### Test 2: Puste nazwy tagów

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Valid", "", "  "]
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "Tag name cannot be empty",
  "details": { "fields": [...] }
}
```

#### Test 3: Za długa nazwa tagu (>50 znaków)

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["ThisIsAVeryLongTagNameThatExceedsFiftyCharactersLimit"]
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "Tag name must be at most 50 characters"
}
```

#### Test 4: Za dużo tagów na raz (>10)

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5", "Tag6", "Tag7", "Tag8", "Tag9", "Tag10", "Tag11"]
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "Maximum 10 tags can be added at once"
}
```

#### Test 5: Limit 10 tagów na przepis

Najpierw dodaj 10 tagów do przepisu:

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5", "Tag6", "Tag7"]
  }'
```

Następnie spróbuj dodać więcej:

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Tag8", "Tag9", "Tag10", "Tag11"]
  }'
```

**Oczekiwany status:** `422 Unprocessable Entity`

**Przykładowa odpowiedź:**

```json
{
  "error": "Tag limit exceeded",
  "message": "Recipe already has 10 tags. Remove some tags before adding new ones."
}
```

#### Test 6: Nieistniejący przepis

```bash
curl -X POST http://localhost:4321/api/recipes/00000000-0000-0000-0000-999999999999/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Test"]
  }'
```

**Oczekiwany status:** `404 Not Found`

**Przykładowa odpowiedź:**

```json
{
  "error": "Recipe not found",
  "message": "Recipe does not exist or has been deleted"
}
```

#### Test 7: Nieprawidłowy JSON

```bash
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON"
}
```

---

### 🗑️ DELETE /api/recipes/:recipeId/tags/:tagId - Usuń tag z przepisu

> **Zamień `{recipeId}` i `{tagId}` na prawdziwe UUID!**

#### Usuń tag z przepisu

Najpierw pobierz listę tagów przepisu:

```bash
curl http://localhost:4321/api/recipes/{recipeId}
```

Skopiuj `id` tagu, który chcesz usunąć, następnie:

```bash
curl -X DELETE http://localhost:4321/api/recipes/{recipeId}/tags/{tagId}
```

**Oczekiwany status:** `204 No Content`  
**Oczekiwana odpowiedź:** Pusta (brak body)

#### Test: Usuń nieistniejące powiązanie

```bash
curl -X DELETE http://localhost:4321/api/recipes/{recipeId}/tags/00000000-0000-0000-0000-999999999999
```

**Oczekiwany status:** `404 Not Found`

**Przykładowa odpowiedź:**

```json
{
  "error": "Association not found",
  "message": "Tag is not associated with this recipe"
}
```

#### Test: Nieprawidłowy UUID tagu

```bash
curl -X DELETE http://localhost:4321/api/recipes/{recipeId}/tags/invalid-uuid
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Invalid UUID",
  "message": "Invalid recipe ID or tag ID format"
}
```

---

## 🔄 Kompletny workflow testowy

### Scenariusz 1: Happy path

```bash
# 1. Utwórz przepis z tagami
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "ingredients": "Test ingredients",
    "preparation": "Test preparation",
    "tag_names": ["Test1", "Test2"]
  }'

# Skopiuj recipeId z odpowiedzi

# 2. Pobierz wszystkie tagi - sprawdź czy Test1 i Test2 istnieją
curl http://localhost:4321/api/tags

# 3. Dodaj więcej tagów do przepisu
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_names": ["Test3", "Test4"]
  }'

# 4. Wyszukaj tagi
curl "http://localhost:4321/api/tags?search=test"

# 5. Pobierz przepis - sprawdź czy ma wszystkie 4 tagi
curl http://localhost:4321/api/recipes/{recipeId}

# 6. Usuń jeden tag z przepisu (skopiuj tagId z poprzedniego requesta)
curl -X DELETE http://localhost:4321/api/recipes/{recipeId}/tags/{tagId}

# 7. Sprawdź czy tag został usunięty
curl http://localhost:4321/api/recipes/{recipeId}

# 8. Sprawdź recipe_count dla tagów
curl http://localhost:4321/api/tags
```

### Scenariusz 2: Case-insensitive uniqueness

```bash
# 1. Dodaj tag "italian"
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_names": ["italian"]}'

# 2. Spróbuj dodać "ITALIAN" - powinno użyć istniejącego tagu
curl -X POST http://localhost:4321/api/recipes/{recipeId}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_names": ["ITALIAN"]}'

# 3. Sprawdź tagi - powinien być tylko jeden "italian"
curl http://localhost:4321/api/tags
```

### Scenariusz 3: Recipe count verification

```bash
# 1. Utwórz 3 przepisy z tym samym tagiem "Popular"
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Recipe 1", "ingredients": "...", "preparation": "...", "tag_names": ["Popular"]}'

curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Recipe 2", "ingredients": "...", "preparation": "...", "tag_names": ["Popular"]}'

curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Recipe 3", "ingredients": "...", "preparation": "...", "tag_names": ["Popular"]}'

# 2. Sprawdź recipe_count dla "Popular" - powinien być 3
curl http://localhost:4321/api/tags
```

---

## 📝 Notatki

- Wszystkie requesty używają test user ID: `00000000-0000-0000-0000-000000000000`
- Nazwy tagów są case-insensitive (italian = ITALIAN)
- Maksymalnie 10 tagów na przepis
- Maksymalnie 50 znaków na nazwę tagu
- Dodawanie istniejących tagów jest idempotentne (nie tworzy duplikatów)
- `recipe_count` pokazuje liczbę przepisów z danym tagiem
- Usunięcie tagu z przepisu nie usuwa tagu z bazy - tylko powiązanie

---

## Import do Postman

1. Utwórz nową kolekcję "Smart Recipe Mate - Tags API"
2. Dodaj zmienną środowiskową:
   - `base_url`: `http://localhost:4321`
   - `recipe_id`: (ustaw po utworzeniu przepisu)
   - `tag_id`: (ustaw po pobraniu tagów)
3. W curl'ach zamień:
   - `http://localhost:4321` → `{{base_url}}`
   - `{recipeId}` → `{{recipe_id}}`
   - `{tagId}` → `{{tag_id}}`

Możesz też zaimportować curl'e bezpośrednio do Postman używając funkcji "Import" → "Raw text" → wklej curl.
