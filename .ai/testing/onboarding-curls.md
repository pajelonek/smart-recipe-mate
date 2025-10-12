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

### 📋 Sprawdzanie statusu onboardingu

Status onboardingu jest określany przez obecność preferencji użytkownika. Użyj endpointu preferences:

```bash
curl -X GET http://localhost:4321/api/preferences \
  -H "Content-Type: application/json"
```

**Możliwe odpowiedzi:**

- `404 Not Found` - użytkownik NIE ukończył onboardingu (brak preferencji)
- `200 OK` - użytkownik UKOŃCZYŁ onboarding (preferencje istnieją)

---

### ✅ POST /api/onboarding/complete - Zakończ onboarding

#### Test 1: Zakończ onboarding z pełnymi preferencjami (SUCCESS)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegetarian",
      "preferred_ingredients": "tomatoes, basil, cheese",
      "preferred_cuisines": "Italian, Mediterranean",
      "allergens": "peanuts, shellfish",
      "notes": "I prefer quick recipes under 30 minutes"
    }
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "diet_type": "vegetarian",
  "preferred_ingredients": "tomatoes, basil, cheese",
  "preferred_cuisines": "Italian, Mediterranean",
  "allergens": "peanuts, shellfish",
  "notes": "I prefer quick recipes under 30 minutes",
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### Test 2: Zakończ onboarding tylko z diet_type (SUCCESS - minimalne dane)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "omnivore"
    }
  }'
```

**Oczekiwany status:** `200 OK`

**Przykładowa odpowiedź:**

```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "diet_type": "omnivore",
  "preferred_ingredients": "",
  "preferred_cuisines": "",
  "allergens": "",
  "notes": null,
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### Test 3: Próba ponownego zakończenia onboardingu (FAIL - 409)

Jeśli już wcześniej zakończyłeś onboarding, próba ponownego wywołania zwróci błąd:

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegan"
    }
  }'
```

**Oczekiwany status:** `409 Conflict`

**Przykładowa odpowiedź:**

```json
{
  "error": "Already onboarded",
  "message": "User preferences already exist. Use PUT /api/preferences to update."
}
```

---

#### Test 4: Brak diet_type (FAIL - 400)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "preferred_ingredients": "chicken, rice"
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
        "path": ["preferences", "diet_type"],
        "message": "diet_type is required"
      }
    ]
  }
}
```

---

#### Test 5: Pusty diet_type (FAIL - 400)

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

**Przykładowa odpowiedź:**

```json
{
  "error": "Validation failed",
  "message": "diet_type is required"
}
```

---

#### Test 6: Nieprawidłowy JSON (FAIL - 400)

```bash
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{invalid json'
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

## 🔄 Typowy przepływ onboardingu

### Scenariusz 1: Nowy użytkownik

```bash
# Krok 1: Sprawdź czy użytkownik ma preferencje
curl -X GET http://localhost:4321/api/preferences

# Odpowiedź: 404 Not Found → użytkownik NIE ma preferencji, pokaż onboarding

# Krok 2: Użytkownik wypełnia formularz onboardingu (frontend może być wieloetapowy)
# Frontend wysyła wszystkie dane naraz:
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegetarian",
      "preferred_ingredients": "tofu, vegetables, rice",
      "preferred_cuisines": "Asian, Mediterranean",
      "allergens": "peanuts",
      "notes": "Quick meals under 30 min"
    }
  }'

# Odpowiedź: 200 OK → onboarding zakończony, przekieruj do przepisów

# Krok 3: Sprawdź status ponownie
curl -X GET http://localhost:4321/api/preferences

# Odpowiedź: 200 OK → użytkownik ukończył onboarding
```

---

### Scenariusz 2: Próba ponownego onboardingu

```bash
# Użytkownik już ma preferencje
curl -X POST http://localhost:4321/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "diet_type": "vegan"
    }
  }'

# Odpowiedź: 409 Conflict
# Aby zaktualizować preferencje, użyj PUT /api/preferences
```

---

## 💡 Wskazówki

### Frontend - wieloetapowy UI

Frontend może zaimplementować onboarding jako 5-krokowy wizard, ale **cały stan jest zarządzany po stronie klienta**:

1. **Krok 1:** Ekran powitalny (tylko UI)
2. **Krok 2:** Wybór typu diety → zapisz w state
3. **Krok 3:** Preferowane składniki → zapisz w state
4. **Krok 4:** Kuchnie i alergeny → zapisz w state
5. **Krok 5:** Podsumowanie → wyślij wszystko przez `POST /api/onboarding/complete`

**Ważne:** Backend nie śledzi kroków. Frontend przechowuje stan w pamięci/localStorage.

---

### Reset onboardingu (dla testów)

Jeśli chcesz zacząć onboarding od nowa, usuń preferencje z bazy:

```sql
-- Połącz się z lokalną bazą Supabase
DELETE FROM user_preferences WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

Lub użyj endpointu DELETE (jeśli zostanie zaimplementowany):

```bash
curl -X DELETE http://localhost:4321/api/preferences
```

---

## 🔧 Troubleshooting

### Problem: 500 Internal Server Error

**Rozwiązanie:**

1. Sprawdź logi serwera (`npm run dev`)
2. Upewnij się, że Supabase działa: `npx supabase status`
3. Sprawdź czy tabela `user_preferences` istnieje w bazie

### Problem: CORS errors

**Rozwiązanie:**

- Upewnij się, że używasz `http://localhost:4321` (nie `127.0.0.1`)
- Sprawdź konfigurację CORS w Astro

---

## 📝 Uproszczenia w MVP

W porównaniu do wcześniejszej wersji:

- ❌ **Usunięto:** Tabelę `user_onboarding`
- ❌ **Usunięto:** `GET /api/onboarding` (sprawdzanie kroków)
- ❌ **Usunięto:** `PATCH /api/onboarding` (aktualizacja kroków)
- ✅ **Pozostało:** `POST /api/onboarding/complete` (jedyny endpoint)
- ✅ **Status:** Sprawdzany przez `GET /api/preferences` (404 = nie ukończono, 200 = ukończono)

**Korzyści:**

- Prostszy backend (1 endpoint zamiast 3)
- Mniej kodu do utrzymania
- Frontend ma pełną kontrolę nad UX (może być wieloetapowy lub jednoetapowy)
- Status onboardingu = czy istnieją preferencje (nie potrzeba osobnej tabeli)

---

**Powodzenia w testowaniu! 🚀**

