# Onboarding API - Przykłady curl dla Postman

## Konfiguracja

**Base URL:** `http://localhost:4321`  
**Test User ID:** `00000000-0000-0000-0000-000000000000`

## Wymagania wstępne

### 1. Uruchom dev server

```bash
npm run dev
```

### 2. Upewnij się, że Supabase działa lokalnie

```bash
npx supabase start
```

---

## Onboarding API - Testowanie

### 📋 GET /api/onboarding - Pobierz status onboardingu

#### Test 1: Sprawdź status onboardingu (może być 404 jeśli nie rozpoczęto)

```bash
curl -X GET http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json"
```

**Oczekiwany status:**

- `200 OK` - jeśli onboarding istnieje
- `404 Not Found` - jeśli onboarding nie został rozpoczęty

**Przykładowa odpowiedź (200):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "current_step": 3,
  "is_completed": false,
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:05:00.000Z"
}
```

**Przykładowa odpowiedź (404):**

```json
{
  "error": "Onboarding not started",
  "message": "No onboarding record found for user"
}
```

---

### 🔄 PATCH /api/onboarding - Aktualizuj krok onboardingu

#### Test 2: Rozpocznij onboarding - krok 1

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 1
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "current_step": 1,
  "is_completed": false,
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### Test 3: Przejdź do kroku 2

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 2
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 4: Przejdź do kroku 3

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 3
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 5: Przejdź do kroku 4

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 4
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 6: Przejdź do kroku 5 (ostatni krok przed zakończeniem)

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 5
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 7: Walidacja - nieprawidłowy krok (za niski)

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 0
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "current_step must be at least 1",
  "details": {
    "fields": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "number",
        "inclusive": true,
        "exact": false,
        "message": "current_step must be at least 1",
        "path": ["current_step"]
      }
    ]
  }
}
```

---

#### Test 8: Walidacja - nieprawidłowy krok (za wysoki)

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 6
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "current_step must be at most 5",
  "details": {
    "fields": [
      {
        "code": "too_big",
        "maximum": 5,
        "type": "number",
        "inclusive": true,
        "exact": false,
        "message": "current_step must be at most 5",
        "path": ["current_step"]
      }
    ]
  }
}
```

---

#### Test 9: Walidacja - nieprawidłowy typ (string zamiast number)

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": "three"
  }'
```

**Oczekiwany status:** `400 Bad Request`

---

#### Test 10: Walidacja - brak wymaganego pola

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Oczekiwany status:** `400 Bad Request`

---

### ✅ POST /api/onboarding/complete - Zakończ onboarding

#### Test 11: Zakończ onboarding z pełnymi preferencjami (SUCCESS)

**⚠️ Wymagane:** Musisz być na kroku 5! Jeśli nie jesteś, najpierw użyj Testu 6.

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables, pasta, rice, tomatoes",
      "preferred_cuisines": "Italian, Asian, American, Mediterranean",
      "allergens": "peanuts, shellfish",
      "notes": "I prefer quick meals under 30 minutes. I love spicy food!"
    }
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "onboarding": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "current_step": 5,
    "is_completed": true,
    "created_at": "2025-10-12T10:00:00.000Z",
    "updated_at": "2025-10-12T10:10:00.000Z"
  },
  "preferences": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "diet_type": "omnivore",
    "preferred_ingredients": "chicken, vegetables, pasta, rice, tomatoes",
    "preferred_cuisines": "Italian, Asian, American, Mediterranean",
    "allergens": "peanuts, shellfish",
    "notes": "I prefer quick meals under 30 minutes. I love spicy food!",
    "created_at": "2025-10-12T10:10:00.000Z",
    "updated_at": "2025-10-12T10:10:00.000Z"
  }
}
```

---

#### Test 12: Zakończ onboarding z minimalnymi danymi (SUCCESS)

**⚠️ Wymagane:** Musisz być na kroku 5! Jeśli nie jesteś, najpierw użyj Testu 6.

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegetarian"
    }
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 13: Zakończ onboarding - dieta wegańska

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegan",
      "preferred_ingredients": "tofu, quinoa, chickpeas, leafy greens",
      "preferred_cuisines": "Indian, Thai, Mediterranean",
      "allergens": "soy",
      "notes": "Prefer organic ingredients when possible"
    }
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 14: Zakończ onboarding - dieta bezglutenowa

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "gluten-free",
      "preferred_ingredients": "rice, potatoes, corn, chicken, fish",
      "preferred_cuisines": "Asian, Latin American",
      "allergens": "gluten, wheat",
      "notes": "Celiac disease - strict gluten-free required"
    }
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 15: Zakończ onboarding - dieta ketogeniczna

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "keto",
      "preferred_ingredients": "bacon, eggs, avocado, cheese, salmon, spinach",
      "preferred_cuisines": "American, Mediterranean",
      "allergens": "none",
      "notes": "Low carb, high fat. Aiming for under 20g carbs per day"
    }
  }'
```

**Oczekiwany status:** `200 OK`

---

#### Test 16: Walidacja - brak diet_type (FAIL)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "preferred_ingredients": "chicken, vegetables"
    }
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "diet_type is required",
  "details": {
    "fields": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "string",
        "inclusive": true,
        "exact": false,
        "message": "diet_type is required",
        "path": ["preferences", "diet_type"]
      }
    ]
  }
}
```

---

#### Test 17: Walidacja - pusty diet_type (FAIL)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": ""
    }
  }'
```

**Oczekiwany status:** `400 Bad Request`

---

#### Test 18: Walidacja - diet_type za długi (FAIL)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "this-is-a-very-long-diet-type-name-that-exceeds-the-maximum-allowed-length-of-fifty-characters"
    }
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "diet_type must be at most 50 characters",
  "details": {
    "fields": [...]
  }
}
```

---

#### Test 19: Próba zakończenia bez bycia na kroku 5 (FAIL)

**Uwaga:** Najpierw ustaw krok na 3:

```bash
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 3
  }'
```

Potem spróbuj zakończyć:

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore"
    }
  }'
```

**Oczekiwany status:** `400 Bad Request`

**Przykładowa odpowiedź:**

```json
{
  "error": "Cannot complete",
  "message": "Must be on step 5 to complete onboarding"
}
```

---

#### Test 20: Próba zakończenia bez rozpoczętego onboardingu (FAIL)

**Uwaga:** Aby przetestować ten scenariusz, musisz mieć użytkownika bez rekorda onboarding w bazie. Możesz użyć innego user_id lub usunąć istniejący rekord z bazy.

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore"
    }
  }'
```

**Oczekiwany status (jeśli nie rozpoczęto):** `404 Not Found`

**Przykładowa odpowiedź:**

```json
{
  "error": "Onboarding not started",
  "message": "No onboarding record found. Start onboarding first."
}
```

---

## 🔄 Pełny przepływ onboardingu (Happy Path)

Oto kompletny przepływ od początku do końca:

```bash
# Krok 1: Rozpocznij onboarding
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 1}'

# Krok 2: Sprawdź status
curl -X GET http://localhost:4321/api/onboarding

# Krok 3: Przejdź do kroku 2
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 2}'

# Krok 4: Przejdź do kroku 3
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}'

# Krok 5: Przejdź do kroku 4
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 4}'

# Krok 6: Przejdź do kroku 5
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 5}'

# Krok 7: Zakończ onboarding z preferencjami
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore",
      "preferred_ingredients": "chicken, vegetables, pasta",
      "preferred_cuisines": "Italian, Asian",
      "allergens": "peanuts",
      "notes": "Quick meals preferred"
    }
  }'

# Krok 8: Sprawdź końcowy status
curl -X GET http://localhost:4321/api/onboarding
```

---

## 💡 Wskazówki

### Szybkie testy

**Start + Complete (minimalna wersja):**

```bash
# Ustaw krok 5
curl -X PATCH http://localhost:4321/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"current_step": 5}'

# Zakończ onboarding
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore"
    }
  }'
```

### Reset onboardingu

Jeśli chcesz zacząć od nowa, musisz usunąć rekordy z bazy danych:

```sql
-- Połącz się z Supabase
-- Usuń preferencje
DELETE FROM preferences WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Usuń onboarding
DELETE FROM onboarding WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

Lub użyj Supabase Studio: `http://127.0.0.1:54323`

---

## 📊 Macierz testów

| Test  | Endpoint                 | Metoda | Status  | Cel                     |
| ----- | ------------------------ | ------ | ------- | ----------------------- |
| 1     | /api/onboarding          | GET    | 200/404 | Sprawdź status          |
| 2     | /api/onboarding          | PATCH  | 200     | Rozpocznij (krok 1)     |
| 3-6   | /api/onboarding          | PATCH  | 200     | Przejdź przez kroki 2-5 |
| 7-10  | /api/onboarding          | PATCH  | 400     | Walidacja kroków        |
| 11-15 | /api/onboarding/complete | POST   | 200     | Zakończ (różne diety)   |
| 16-18 | /api/onboarding/complete | POST   | 400     | Walidacja preferencji   |
| 19    | /api/onboarding/complete | POST   | 400     | Błąd: nie na kroku 5    |
| 20    | /api/onboarding/complete | POST   | 404     | Błąd: nie rozpoczęto    |

---

## 🐛 Troubleshooting

### Problem: 500 Internal Server Error

**Rozwiązanie:**

1. Sprawdź czy Supabase działa: `npx supabase status`
2. Sprawdź logi serwera dev
3. Sprawdź czy tabele `onboarding` i `preferences` istnieją w bazie

### Problem: CORS errors

**Rozwiązanie:**

- Upewnij się, że używasz `http://localhost:4321` (nie `127.0.0.1`)
- Sprawdź konfigurację CORS w Astro

### Problem: Nie mogę zakończyć onboardingu

**Rozwiązanie:**

- Upewnij się, że jesteś na kroku 5: `curl http://localhost:4321/api/onboarding`
- Jeśli nie, użyj PATCH aby ustawić krok 5

---

**Powodzenia w testowaniu! 🚀**
