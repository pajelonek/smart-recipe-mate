# AI Generations API - Przykłady curl dla Postman

## Konfiguracja

**Base URL:** `http://localhost:3001`  
**Test User ID:** `00000000-0000-0000-0000-000000000000`

## Wymagania wstępne

### 1. Upewnij się, że użytkownik ma preferencje (onboarding completed)

```bash
curl -X POST http://localhost:3001/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables, pasta",
      "preferred_cuisines": "Italian, Asian, American",
      "allergens": "peanuts, shellfish",
      "notes": "I prefer quick meals under 30 minutes"
    }
  }'
```

**Oczekiwany status:** `200 OK`

---

## AI Generations API - Testowanie

### 🤖 POST /api/ai/generate-recipe - Generuj przepis AI

#### Test 1: Podstawowe generowanie przepisu (SUCCESS)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil", "soy sauce"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes"
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "recipe": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts (400g), 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, 2 tbsp soy sauce, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan over medium-high heat. 3. Cook chicken 6-7 minutes per side until golden and cooked through. 4. Remove chicken and set aside. 5. In the same pan, sauté garlic for 30 seconds. 6. Add broccoli and cook 5-6 minutes until tender-crisp. 7. Add soy sauce and toss. 8. Slice chicken and serve with broccoli."
  },
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil", "soy sauce"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables, pasta",
      "preferred_cuisines": "Italian, Asian, American",
      "allergens": "peanuts, shellfish"
    }
  },
  "created_at": "2025-10-12T20:15:30Z"
}
```

---

#### Test 2: Minimalna ilość składników

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["eggs", "tomatoes", "onion"]
  }'
```

**Oczekiwany status:** `200 OK` lub `422 Unprocessable Entity` (jeśli AI uzna, że za mało składników)

---

#### Test 3: Maksymalna ilość składników (20)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": [
      "chicken breast", "rice", "broccoli", "carrots", "bell peppers",
      "onion", "garlic", "ginger", "soy sauce", "olive oil",
      "tomatoes", "mushrooms", "spinach", "cheese", "eggs",
      "milk", "butter", "flour", "salt", "pepper"
    ],
    "dietary_goals": "balanced meal with vegetables",
    "additional_context": "Family dinner for 4 people"
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 4: Z konkretnymi celami dietetycznymi

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["salmon", "asparagus", "lemon", "butter", "dill"],
    "dietary_goals": "keto diet, high fat, very low carb, omega-3 rich",
    "additional_context": "Elegant dinner party main course"
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 5: Tylko składniki, bez dodatkowego kontekstu

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["pasta", "tomatoes", "basil", "mozzarella", "olive oil"]
  }'
```

**Oczekiwany status:** `200 OK`

---

### ❌ Testy błędów walidacji (400 Bad Request)

#### Test 6: Brak składników (validation error)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": []
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "At least one ingredient is required",
  "details": {
    "fields": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "array",
        "inclusive": true,
        "exact": false,
        "message": "At least one ingredient is required",
        "path": ["available_ingredients"]
      }
    ]
  }
}
```

---

#### Test 7: Za długa nazwa składnika (>100 znaków)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["This is an extremely long ingredient name that exceeds the maximum allowed length of one hundred characters and should be rejected by validation"]
  }'
```

**Oczekiwany status:** `400 Bad Request`

---

#### Test 8: Za dużo składników (>20)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": [
      "ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5",
      "ingredient6", "ingredient7", "ingredient8", "ingredient9", "ingredient10",
      "ingredient11", "ingredient12", "ingredient13", "ingredient14", "ingredient15",
      "ingredient16", "ingredient17", "ingredient18", "ingredient19", "ingredient20",
      "ingredient21"
    ]
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "Maximum 20 ingredients allowed",
  "details": {
    "fields": [...]
  }
}
```

---

#### Test 9: Za długie cele dietetyczne (>500 znaków)

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["chicken"],
    "dietary_goals": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam."
  }'
```

**Oczekiwany status:** `400 Bad Request`

---

#### Test 10: Nieprawidłowy JSON

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{ "available_ingredients": ["chicken" }'
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

### 🚫 Test braku preferencji (404 Not Found)

#### Test 11: Generowanie bez ukończonego onboardingu

> **Uwaga:** Ten test zadziała tylko jeśli użytkownik nie ma zapisanych preferencji.
> Aby go przetestować, usuń preferencje z bazy lub użyj innego user_id.

```bash
# Usuń preferencje (opcjonalnie - jeśli masz dostęp do Supabase)
# DELETE FROM user_preferences WHERE user_id = '00000000-0000-0000-0000-000000000000';

curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["chicken", "rice"]
  }'
```

**Oczekiwany status:** `404 Not Found`

**Przykładowa odpowiedź:**

```json
{
  "error": "Preferences not found",
  "message": "User has not completed onboarding. Please complete your profile first."
}
```

---

### ⚠️ Test AI nie może wygenerować przepisu (422 Unprocessable Entity)

#### Test 12: Za mało składników lub konflikt z preferencjami

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["salt"],
    "dietary_goals": "Complete meal with protein, carbs, and vegetables"
  }'
```

**Oczekiwany status:** `422 Unprocessable Entity`

**Przykładowa odpowiedź:**

```json
{
  "error": "No recipe generated",
  "message": "Unable to generate a recipe with the provided ingredients and preferences. Try adding more ingredients or adjusting dietary requirements.",
  "generation_id": "660e8400-e29b-41d4-a716-446655440001",
  "suggestions": [
    "Add more ingredients (at least 3-4 for a complete meal)",
    "Add a protein source (meat, tofu, eggs, beans)",
    "Include a carbohydrate (rice, pasta, potatoes)"
  ]
}
```

---

## 📋 GET /api/ai/generations - Lista generacji

### Test 13: Wszystkie generacje (domyślnie)

```bash
curl http://localhost:3001/api/ai/generations
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "generations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "00000000-0000-0000-0000-000000000000",
      "input_payload": {
        "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil"],
        "dietary_goals": "high protein, low carb",
        "user_preferences": {...}
      },
      "output_payload": {
        "title": "Garlic Chicken with Broccoli",
        "summary": "A quick and healthy high-protein dinner",
        "ingredients": "...",
        "preparation": "..."
      },
      "error_message": null,
      "created_at": "2025-10-12T20:15:30Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "00000000-0000-0000-0000-000000000000",
      "input_payload": {
        "available_ingredients": ["salt"]
      },
      "output_payload": null,
      "error_message": "Insufficient ingredients to create a complete meal",
      "created_at": "2025-10-12T19:00:00Z"
    }
  ]
}
```

---

### Test 14: Tylko udane generacje (status=success)

```bash
curl "http://localhost:3001/api/ai/generations?status=success"
```

**Oczekiwany status:** `200 OK`

**Wynik:** Lista tylko tych generacji, które mają `output_payload` (nie NULL)

---

### Test 15: Tylko nieudane generacje (status=error)

```bash
curl "http://localhost:3001/api/ai/generations?status=error"
```

**Oczekiwany status:** `200 OK`

**Wynik:** Lista tylko tych generacji, które mają `error_message` (nie NULL)

---

### Test 16: Nieprawidłowy status filter

```bash
curl "http://localhost:3001/api/ai/generations?status=invalid"
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Invalid query parameters",
  "message": "Invalid enum value...",
  "details": {
    "fields": [...]
  }
}
```

---

## 🔍 GET /api/ai/generations/:id - Szczegóły generacji

### Test 17: Pobranie konkretnej generacji (SUCCESS)

```bash
# Zamień {generationId} na prawdziwy UUID z poprzednich requestów
curl http://localhost:3001/api/ai/generations/{generationId}
```

**Przykład:**

```bash
curl http://localhost:3001/api/ai/generations/550e8400-e29b-41d4-a716-446655440000
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "input_payload": {
    "available_ingredients": ["chicken breast", "broccoli", "garlic", "olive oil", "soy sauce"],
    "dietary_goals": "high protein, low carb",
    "additional_context": "Quick weeknight dinner under 30 minutes",
    "user_preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables, pasta",
      "preferred_cuisines": "Italian, Asian, American",
      "allergens": "peanuts, shellfish"
    }
  },
  "output_payload": {
    "title": "Garlic Chicken with Broccoli",
    "summary": "A quick and healthy high-protein dinner ready in 25 minutes",
    "ingredients": "2 chicken breasts (400g), 2 cups broccoli florets, 3 cloves garlic minced, 2 tbsp olive oil, 2 tbsp soy sauce, salt and pepper to taste",
    "preparation": "1. Season chicken with salt and pepper. 2. Heat olive oil in a pan..."
  },
  "error_message": null,
  "created_at": "2025-10-12T20:15:30Z"
}
```

---

### Test 18: Nieprawidłowy UUID format

```bash
curl http://localhost:3001/api/ai/generations/invalid-uuid-format
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Invalid ID",
  "message": "Generation ID must be a valid UUID"
}
```

---

### Test 19: Generacja nie istnieje (404)

```bash
curl http://localhost:3001/api/ai/generations/00000000-0000-0000-0000-000000000001
```

**Oczekiwany status:** `404 Not Found`

**Przykładowa odpowiedź:**

```json
{
  "error": "Generation not found",
  "message": "AI generation record does not exist"
}
```

---

### Test 20: Próba dostępu do cudzej generacji (403)

> **Uwaga:** Ten test wymaga dwóch różnych użytkowników.
> W MVP z test user ID nie jest to możliwe, ale po dodaniu auth będzie działać.

```bash
# TODO: Po implementacji auth, zmień user_id w kodzie i próbuj pobrać generację innego użytkownika
curl http://localhost:3001/api/ai/generations/{otherUserGenerationId}
```

**Oczekiwany status:** `403 Forbidden`

**Przykładowa odpowiedź:**

```json
{
  "error": "Access denied",
  "message": "You can only access your own AI generations"
}
```

---

## 🔄 Kompleksowy scenariusz testowy

### Scenariusz: Pełny flow użytkownika

```bash
# 1. Complete onboarding
echo "=== 1. Complete onboarding ==="
curl -X POST http://localhost:3001/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegetarian",
      "preferred_ingredients": "vegetables, tofu, pasta",
      "preferred_cuisines": "Italian, Asian",
      "allergens": "nuts, dairy"
    }
  }'

echo -e "\n\n"

# 2. Generate first recipe (success)
echo "=== 2. Generate Recipe #1 ==="
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["tofu", "broccoli", "soy sauce", "rice", "ginger"],
    "dietary_goals": "high protein vegetarian",
    "additional_context": "Quick Asian-inspired dinner"
  }'

echo -e "\n\n"

# 3. Generate second recipe (success)
echo "=== 3. Generate Recipe #2 ==="
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["pasta", "tomatoes", "basil", "garlic", "olive oil"],
    "dietary_goals": "Italian vegetarian",
    "additional_context": "Classic Italian pasta"
  }'

echo -e "\n\n"

# 4. Try to generate with insufficient ingredients (422)
echo "=== 4. Generate Recipe #3 (should fail) ==="
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["salt"]
  }'

echo -e "\n\n"

# 5. Get all generations
echo "=== 5. Get all generations ==="
curl http://localhost:3001/api/ai/generations

echo -e "\n\n"

# 6. Get only successful generations
echo "=== 6. Get only successful generations ==="
curl "http://localhost:3001/api/ai/generations?status=success"

echo -e "\n\n"

# 7. Get only failed generations
echo "=== 7. Get only failed generations ==="
curl "http://localhost:3001/api/ai/generations?status=error"

echo -e "\n\n"

# 8. Get specific generation details (use ID from step 2 response)
echo "=== 8. Get specific generation details ==="
# Replace {generationId} with actual ID from step 2
# curl http://localhost:3001/api/ai/generations/{generationId}
```

---

## 📊 Expected Results Summary

| Test # | Endpoint              | Scenario          | Expected Status          | Notes                            |
| ------ | --------------------- | ----------------- | ------------------------ | -------------------------------- |
| 1-5    | POST /generate-recipe | Valid inputs      | 200 OK                   | Should return generated recipe   |
| 6-10   | POST /generate-recipe | Validation errors | 400 Bad Request          | Various validation failures      |
| 11     | POST /generate-recipe | No preferences    | 404 Not Found            | User hasn't completed onboarding |
| 12     | POST /generate-recipe | AI can't generate | 422 Unprocessable Entity | Insufficient ingredients         |
| 13-16  | GET /generations      | List with filters | 200 OK or 400            | Different filter options         |
| 17     | GET /generations/:id  | Valid ID          | 200 OK                   | Full generation details          |
| 18     | GET /generations/:id  | Invalid UUID      | 400 Bad Request          | Malformed ID                     |
| 19     | GET /generations/:id  | Non-existent      | 404 Not Found            | ID doesn't exist                 |
| 20     | GET /generations/:id  | Other user's      | 403 Forbidden            | Authorization check              |

---

## 🛠️ Narzędzia pomocnicze

### Wydobycie generation_id z odpowiedzi (jq)

```bash
curl -s -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["chicken", "rice", "vegetables"]
  }' | jq -r '.generation_id'
```

### Zapisanie odpowiedzi do pliku

```bash
curl -X POST http://localhost:3001/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "available_ingredients": ["salmon", "asparagus", "lemon"]
  }' > response.json

cat response.json | jq .
```

### Sprawdzenie liczby generacji w ostatniej godzinie

```bash
curl -s http://localhost:3001/api/ai/generations | jq '.generations | length'
```

---

## 📝 Notatki implementacyjne

1. **Test User ID:** `00000000-0000-0000-0000-000000000000` jest hardcoded w MVP
2. **Mock Implementation:** Obecnie używamy mocka zamiast prawdziwego OpenRouter API
3. **Simulated Latency:** Mock symuluje 1-3 sekundy opóźnienia
4. **Database Logging:** Wszystkie próby (sukces i błąd) są zapisywane w `ai_generations`
5. **Production Ready:** Zamień mock na prawdziwe OpenRouter API gdy będzie potrzebne

---

**Created:** 2025-10-12  
**Last Updated:** 2025-10-12  
**Version:** 1.0
