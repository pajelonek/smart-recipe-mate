# Analiza priorytetów testowania jednostkowego - Smart Recipe Mate

## 🎯 Wysoki priorytet (WRITE TESTS FIRST)

### 1. **Funkcje utility (`src/lib/utils/`)**
**Dlaczego:**
- Czyste funkcje bez side effects
- Proste do testowania (deterministyczne)
- Wysoka częstotliwość użycia w całej aplikacji
- Błędy mają duży wpływ na UX

**Przykłady:**

#### `date-formatter.ts`
```typescript
// Test cases:
- formatDate("2024-01-15", { format: "relative" }) → "Today"
- formatDate("2024-01-14", { format: "relative" }) → "Yesterday"
- formatDate("2024-01-08", { format: "relative" }) → "7 days ago"
- formatDate("2023-12-15", { format: "relative" }) → "4 weeks ago"
- formatDate("2023-01-15") → format z datą (bez opcji)
- Edge cases: nieprawidłowe daty, przyszłe daty
```

#### `text-formatter.ts`
```typescript
// Test cases:
- truncate("short", { length: 10 }) → "short"
- truncate("very long text", { length: 10 }) → "very long..."
- truncate("text", { length: 4, suffix: "..." }) → "text"
- truncate("1234567890", { length: 5, suffix: "..." }) → "12345..."
- Edge cases: pusty string, length = 0, ujemny length
```

---

### 2. **Schematy walidacji (`src/lib/validation/`)**
**Dlaczego:**
- Krytyczna logika biznesowa (ochrona przed nieprawidłowymi danymi)
- Wysoka częstotliwość użycia (wszystkie formularze)
- Łatwe do testowania (Zod schemas)
- Błędy mogą prowadzić do problemów bezpieczeństwa

**Przykłady:**

#### `ai-generation.schemas.ts`
```typescript
// Test cases dla AIGenerateRecipeInputSchema:
✓ Prawidłowe dane:
  - 1-20 składników, każdy 1-100 znaków
  - Opcjonalne dietary_goals (max 500 znaków)
  - Opcjonalne additional_context (max 1000 znaków)

✗ Nieprawidłowe dane:
  - Pusta tablica składników → błąd
  - > 20 składników → błąd
  - Składnik > 100 znaków → błąd
  - dietary_goals > 500 znaków → błąd
  - additional_context > 1000 znaków → błąd
  - Składnik tylko ze spacjami → trim i walidacja
  - null/undefined w wymaganych polach → błąd
```

#### `recipes.schemas.ts`, `auth.schemas.ts`, `preferences.schemas.ts`
- Analogiczne testy dla wszystkich schematów walidacji
- Szczególnie ważne dla danych użytkownika (bezpieczeństwo)

---

### 3. **Serwisy (`src/lib/services/`)**
**Dlaczego:**
- Logika biznesowa oddzielona od UI
- Łatwe do mockowania (Supabase client)
- Wysoki wpływ na funkcjonalność aplikacji
- Testowanie obsługi błędów

**Przykłady:**

#### `recipes.service.ts`
```typescript
// Test cases dla każdej funkcji:

getUserRecipes():
  ✓ Zwraca przepisy użytkownika
  ✓ Filtruje soft-deleted recipes
  ✓ Sortuje po created_at desc
  ✓ Obsługuje błędy Supabase
  ✓ Zwraca pustą tablicę gdy brak przepisów

getRecipeById():
  ✓ Zwraca przepis gdy istnieje i należy do użytkownika
  ✓ Zwraca null gdy nie istnieje (PGRST116)
  ✓ Zwraca null gdy należy do innego użytkownika
  ✓ Obsługuje błędy Supabase

createRecipe():
  ✓ Tworzy przepis z poprawnymi danymi
  ✓ Obsługuje opcjonalne summary
  ✓ Obsługuje błędy Supabase

updateRecipe():
  ✓ Aktualizuje przepis gdy należy do użytkownika
  ✓ Zwraca null gdy nie istnieje
  ✓ Aktualizuje updated_at
  ✓ Obsługuje błędy Supabase

patchRecipe():
  ✓ Aktualizuje tylko podane pola
  ✓ Zachowuje pozostałe pola
  ✓ Obsługuje opcjonalne pola
  ✓ Zwraca null gdy nie istnieje

deleteRecipe():
  ✓ Soft-delete przepis (ustawia deleted_at)
  ✓ Zwraca false gdy nie istnieje
  ✓ Obsługuje błędy Supabase
```

#### `ai-generation.service.ts`
```typescript
// Test cases:
createAIGeneration():
  ✓ Tworzy rekord w bazie
  ✓ Zwraca ID nowego rekordu
  ✓ Obsługuje błędy Supabase

updateAIGenerationSuccess():
  ✓ Aktualizuje output_payload
  ✓ Zwraca zaktualizowany rekord
  ✓ Obsługuje błędy Supabase

updateAIGenerationError():
  ✓ Aktualizuje error_message
  ✓ Obsługuje błędy Supabase

getUserGenerations():
  ✓ Zwraca wszystkie generacje gdy statusFilter = "all"
  ✓ Filtruje tylko sukcesy gdy statusFilter = "success"
  ✓ Filtruje tylko błędy gdy statusFilter = "error"
  ✓ Sortuje po created_at desc

getGenerationById():
  ✓ Zwraca generację gdy istnieje
  ✓ Zwraca null gdy nie istnieje (PGRST116)
  ✓ Obsługuje błędy Supabase
```

---

## 🟡 Średni priorytet (TEST AFTER IMPLEMENTATION)

### 4. **Custom Hooks (`src/hooks/`)**
**Dlaczego:**
- Zawierają logikę biznesową i stan
- Testowanie wymaga mockowania fetch API
- Wysoka częstotliwość użycia
- Problemy mogą wpływać na wiele komponentów

**Przykłady:**

#### `useAIGeneration.ts`
```typescript
// Test cases:
✓ Inicjalizacja formularza z domyślnymi wartościami
✓ Walidacja formularza (react-hook-form + Zod)
✓ generateRecipe():
  - Ustawia isGenerating = true podczas generowania
  - Wywołuje fetch z poprawnymi danymi
  - Obsługuje sukces (200) → ustawia generatedRecipe
  - Obsługuje błędy:
    * 422 → ustawia error z AIGenerateRecipeErrorResponse
    * 404 → redirect do /profile + toast
    * 429 → toast z Retry-After
    * 400 → toast z błędem
    * 500 → toast z błędem serwera
  - Obsługuje network errors
  - Zawsze resetuje isGenerating w finally

✓ acceptRecipe():
  - Zapisuje przepis do API
  - Obsługuje sukces → redirect do /
  - Obsługuje błędy → toast
  - Nie wykonuje gdy isSaving = true
  - Nie wykonuje gdy brak generatedRecipe

✓ rejectRecipe():
  - Resetuje generatedRecipe i error

✓ resetError():
  - Resetuje error state
```

#### `useDashboard.ts`, `useRecipesList.ts`, `useOnboardingForm.ts`
- Analogiczne testy dla każdego hooka
- Szczególnie ważne: obsługa błędów, loading states, edge cases

---

### 5. **Funkcje pomocnicze w serwisach**
**Dlaczego:**
- Funkcje pomocnicze (np. `mapToRecipe`)
- Czysta logika transformacji
- Łatwe do testowania

**Przykład:**
```typescript
// recipes.service.ts - mapToRecipe()
✓ Mapuje wszystkie pola poprawnie
✓ Obsługuje null/undefined w opcjonalnych polach
✓ Zachowuje typy danych
```

---

## 🟢 Niski priorytet (TEST WITH INTEGRATION TESTS)

### 6. **Komponenty React (`src/components/`)**
**Dlaczego:**
- Testowanie wymaga renderowania, mockowania hooków
- Lepsze jako testy integracyjne (E2E)
- Większość logiki w hookach/serwisach

**Kiedy warto testować jednostkowo:**
- Komponenty prezentacyjne (pure components)
- Komponenty z prostą logiką warunkową
- Komponenty UI (Shadcn/ui) - już przetestowane przez bibliotekę

**Przykłady do testowania:**
```typescript
// Komponenty prezentacyjne:
- PreferenceCard → renderowanie z props
- StatCard → renderowanie z props
- LastModifiedDate → formatowanie daty

// Komponenty z prostą logiką:
- EmptyState → renderowanie z różnymi props
- ErrorMessage → renderowanie z błędem i callback
- LoadingSpinner → renderowanie spinnera
```

**NIE warto testować jednostkowo:**
- Komponenty kontenerowe (AIGenerateContent, DashboardContent)
- Komponenty z wieloma zależnościami
- Komponenty z hookami (testuj hook zamiast tego)

---

## 📊 Podsumowanie priorytetów

| Priorytet | Kategoria | Powód | Nakład pracy | ROI |
|-----------|-----------|-------|--------------|-----|
| 🔴 **WYSOKI** | Utility functions | Czyste funkcje, łatwe testy | Niski | Wysoki |
| 🔴 **WYSOKI** | Validation schemas | Krytyczna logika, bezpieczeństwo | Niski | Wysoki |
| 🔴 **WYSOKI** | Services | Logika biznesowa, łatwe do mockowania | Średni | Wysoki |
| 🟡 **ŚREDNI** | Custom Hooks | Logika stanu, wymaga mockowania API | Średni/Wysoki | Średni |
| 🟢 **NISKI** | React Components | Lepsze jako testy integracyjne | Wysoki | Niski |

---

## 🛠️ Rekomendowane narzędzia

### Framework testowy
- **Vitest** - szybki, kompatybilny z Vite, dobra integracja z TypeScript

### Biblioteki pomocnicze
- **@testing-library/react** - testowanie komponentów React
- **@testing-library/react-hooks** - testowanie hooków
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **msw (Mock Service Worker)** - mockowanie API calls

### Przykład konfiguracji
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**'],
      exclude: ['src/components/**', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
});
```

---

## 📝 Checklist implementacji testów

### Faza 1: Foundation (Wysoki priorytet)
- [ ] Setup Vitest + konfiguracja
- [ ] Testy dla `date-formatter.ts`
- [ ] Testy dla `text-formatter.ts`
- [ ] Testy dla wszystkich schematów walidacji
- [ ] Testy dla `recipes.service.ts`
- [ ] Testy dla `ai-generation.service.ts`

### Faza 2: Hooks (Średni priorytet)
- [ ] Testy dla `useAIGeneration.ts`
- [ ] Testy dla `useDashboard.ts`
- [ ] Testy dla `useRecipesList.ts`
- [ ] Testy dla `useOnboardingForm.ts`

### Faza 3: Components (Niski priorytet)
- [ ] Testy dla komponentów prezentacyjnych
- [ ] Testy integracyjne dla głównych flow

---

## 💡 Best Practices

1. **Testuj zachowanie, nie implementację**
   - Testuj co komponent robi, nie jak to robi

2. **Testuj edge cases**
   - Puste wartości, null, undefined, bardzo długie stringi

3. **Testuj obsługę błędów**
   - Szczególnie w serwisach i hookach

4. **Utrzymuj testy proste**
   - Jeden test = jeden przypadek użycia

5. **Używaj opisowych nazw testów**
   ```typescript
   // ❌ Złe
   test('test1', () => { ... });
   
   // ✓ Dobre
   test('should return "Today" when date is today', () => { ... });
   ```

6. **Mockuj zależności zewnętrzne**
   - Supabase client, fetch API, localStorage

7. **Testuj izolowanie**
   - Każdy test powinien być niezależny

