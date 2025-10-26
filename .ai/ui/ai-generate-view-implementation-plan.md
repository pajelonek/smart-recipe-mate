# Plan implementacji widoku Generowanie AI

## 1. Przegląd

Widok generowania AI umożliwia użytkownikom tworzenie nowych przepisów na podstawie dostępnych składników z wykorzystaniem sztucznej inteligencji. System wykorzystuje preferencje użytkownika zapisane w profilu, aby generować spersonalizowane przepisy zgodne z ich wymaganiami dietetycznymi.

**Ścieżka**: `/ai/generate`

**Główne funkcje**:
- Wprowadzenie listy dostępnych składników
- Opcjonalne cele dietetyczne i dodatkowy kontekst
- Generowanie przepisu przez AI w czasie rzeczywistym
- Podgląd wygenerowanego przepisu
- Akceptacja (zapisanie w repozytorium) lub odrzucenie wygenerowanego przepisu
- Blokada równoległych żądań podczas generowania
- Obsługa błędów z sugestiami

## 2. Routing widoku

**Plik**: `src/pages/ai/generate.astro`

**Ścieżka URL**: `/ai/generate`

**Middleware**: Wymaga uwierzytelnienia (przez AuthLayout), weryfikuje czy użytkownik ma uzupełnione preferencje.

**Server-side data fetching**:
- Sprawdzenie uwierzytelnienia
- Weryfikacja czy użytkownik ma zapisane preferencje (GET /api/preferences)
- Przekazanie accessToken do komponentu React

## 3. Struktura komponentów

Hierarchia komponentów:

```
GenerateView.astro (Astro page)
└── AIGenerateContent.tsx (główny komponent React)
    ├── GenerationForm.tsx (formularz z polami)
    │   ├── IngredientsInput.tsx (pole listy składników)
    │   ├── DietaryGoalsInput.tsx (opcjonalne cele dietetyczne)
    │   ├── AdditionalContextInput.tsx (opcjonalny kontekst)
    │   └── GenerateButton.tsx (przycisk generowania)
    ├── LoadingSpinner.tsx (loading state podczas generowania)
    ├── GeneratedRecipePreview.tsx (preview wygenerowanego przepisu)
    │   ├── RecipeCard (tytuł, summary, ingredients, preparation)
    │   └── AcceptRejectButtons.tsx (akceptuj/odrzuć)
    └── ErrorMessage.tsx (komunikat błędu)
```

## 4. Szczegóły komponentów

### AIGenerateContent

- **Opis**: Główny komponent React zarządzający całym procesem generowania. Zarządza stanem formularza, generowania, wygenerowanego przepisu oraz błędów.
- **Główne elementy**: Fragment<> zawierający GenerationForm, warunkowe renderowanie LoadingSpinner, GeneratedRecipePreview lub ErrorMessage
- **Obsługiwane zdarzenia**: 
  - `onGenerate(formData)` - wywoływane przy submit formularza
  - `onAccept(generatedRecipe)` - wywoływane przy akceptacji przepisu
  - `onReject()` - wywoływane przy odrzuceniu przepisu
- **Typy**: Korzysta z `AIGenerateRecipeInput`, `AIGeneratedRecipe`, `ApiError`
- **Props**: 
  ```typescript
  interface AIGenerateContentProps {
    accessToken: string;
  }
  ```
- **Zarządzanie stanem**: Korzysta z custom hook `useAIGeneration` do zarządzania stanem formularza, loading, generatedRecipe i error states

### GenerationForm

- **Opis**: Formularz wprowadzania danych do generowania (składniki, cele dietetyczne, kontekst). Używa react-hook-form z walidacją Zod.
- **Główne elementy**: Card (Shadcn/ui), CardHeader, CardTitle, CardDescription, CardContent z polami formularza, CardFooter z przyciskami
- **Obsługiwane zdarzenia**: 
  - `onSubmit(data)` - walidacja i wysłanie danych do API
  - Wewnętrzne: wprowadzanie składników, cele dietetyczne, kontekst
- **Obsługiwana walidacja**: 
  - `available_ingredients`: array, min 1 element, max 20, każdy element 1-100 znaków
  - `dietary_goals`: string, max 500 znaków, opcjonalne
  - `additional_context`: string, max 1000 znaków, opcjonalne
- **Typy**: `AIGenerateRecipeInput` (z types.ts), używa `AIGenerateRecipeInputSchema` do walidacji
- **Props**: 
  ```typescript
  interface GenerationFormProps {
    onSubmit: (data: AIGenerateRecipeInput) => Promise<void>;
    isGenerating: boolean;
    error: string | null;
  }
  ```

### IngredientsInput

- **Opis**: Komponent do wprowadzania listy składników. Umożliwia dodawanie/usuwanie składników dynamicznie z walidacją każdego pola.
- **Główne elementy**: Label, Input (dla pojedynczego składnika), Button (Add ingredient), lista InputFields dla każdego składnika z przyciskiem remove
- **Obsługiwane zdarzenia**: 
  - `onAdd()` - dodaje nowe pole składnika
  - `onRemove(index)` - usuwa składnik z listy
  - `onChange(index, value)` - aktualizuje wartość składnika
- **Obsługiwana walidacja**: 
  - Każdy składnik: 1-100 znaków (required)
  - Min 1 składnik, max 20 składników
  - Wyświetlanie błędów pod każdym polem Input
- **Typy**: 
  - Stan: `ingredients: string[]`
  - Zewnętrzne: `AIGenerateRecipeInput` (część formularza)
- **Props**: 
  ```typescript
  interface IngredientsInputProps {
    register: UseFormRegister<AIGenerateRecipeInput>;
    watch: UseFormWatch<AIGenerateRecipeInput>;
    setValue: UseFormSetValue<AIGenerateRecipeInput>;
    errors: FieldErrors<AIGenerateRecipeInput>;
    disabled: boolean;
  }
  ```

### DietaryGoalsInput

- **Opis**: Opcjonalne pole do wprowadzania celów dietetycznych (np. "high protein, low carb")
- **Główne elementy**: Label, Textarea (Shadcn/ui)
- **Obsługiwane zdarzenia**: Wprowadzanie tekstu, aktualizacja formData
- **Obsługiwana walidacja**: Max 500 znaków, opcjonalne (brak błędu jeśli puste)
- **Typy**: string | undefined (część AIGenerateRecipeInput)
- **Props**: 
  ```typescript
  interface DietaryGoalsInputProps {
    register: UseFormRegister<AIGenerateRecipeInput>;
    errors: FieldErrors<AIGenerateRecipeInput>;
    disabled: boolean;
  }
  ```

### AdditionalContextInput

- **Opis**: Opcjonalne pole do wprowadzania dodatkowego kontekstu (np. "Quick weeknight dinner")
- **Główne elementy**: Label, Textarea (Shadcn/ui)
- **Obsługiwane zdarzenia**: Wprowadzanie tekstu, aktualizacja formData
- **Obsługiwana walidacja**: Max 1000 znaków, opcjonalne (brak błędu jeśli puste)
- **Typy**: string | undefined (część AIGenerateRecipeInput)
- **Props**: 
  ```typescript
  interface AdditionalContextInputProps {
    register: UseFormRegister<AIGenerateRecipeInput>;
    errors: FieldErrors<AIGenerateRecipeInput>;
    disabled: boolean;
  }
  ```

### GenerateButton

- **Opis**: Przycisk wysyłania formularza z wskaźnikiem ładowania i stany disabled
- **Główne elementy**: Button (Shadcn/ui) z ikoną Loader2 podczas generowania
- **Obsługiwane zdarzenia**: Kliknięcie (submit formularza)
- **Obsługiwana walidacja**: Disabled jeśli: isGenerating=true lub formularz niepoprawny (isValid=false)
- **Typy**: 
  - Props: `isGenerating: boolean`, `isValid: boolean`
  - Stan: `isSubmitting` z react-hook-form
- **Props**: 
  ```typescript
  interface GenerateButtonProps {
    isGenerating: boolean;
    isValid: boolean;
  }
  ```

### LoadingSpinner

- **Opis**: Wskaźnik ładowania wyświetlany podczas generowania przepisu przez AI
- **Główne elementy**: Card z CardContent, Loader2 icon (Lucide), tekst "Generowanie przepisu..."
- **Typy**: Brak (komponent prezentacyjny bez props)
- **Warunek wyświetlania**: `isGenerating === true`

### GeneratedRecipePreview

- **Opis**: Preview wygenerowanego przepisu z opcją akceptacji lub odrzucenia
- **Główne elementy**: Card, CardHeader z tytułem, CardContent z sekcjami (summary, ingredients, preparation), CardFooter z przyciskami Accept/Reject
- **Obsługiwane zdarzenia**: 
  - `onAccept(recipe)` - zapisuje przepis
  - `onReject()` - odrzuca przepis
- **Typy**: `AIGeneratedRecipe` z types.ts
- **Props**: 
  ```typescript
  interface GeneratedRecipePreviewProps {
    recipe: AIGeneratedRecipe;
    onAccept: () => Promise<void>;
    onReject: () => void;
    isSaving: boolean;
  }
  ```

### AcceptRejectButtons

- **Opis**: Przyciski akceptacji i odrzucenia wygenerowanego przepisu
- **Główne elementy**: Button (Shadcn/ui) dla Accept (primary) i Reject (outline)
- **Obsługiwane zdarzenia**: 
  - `onAccept()` - wywołuje akceptację i zapis przepisu
  - `onReject()` - odrzuca przepis i wraca do formularza
- **Typy**: 
  - Props: `onAccept: () => void`, `onReject: () => void`, `isSaving: boolean`
- **Props**: 
  ```typescript
  interface AcceptRejectButtonsProps {
    onAccept: () => Promise<void>;
    onReject: () => void;
    isSaving: boolean;
  }
  ```

### ErrorMessage

- **Opis**: Komunikat błędu z sugestiami i możliwością ponowienia próby
- **Główne elementy**: Card z CardContent, ikona AlertCircle (Lucide), tekst błędu, lista suggestions, Button do ponowienia
- **Obsługiwane zdarzenia**: Kliknięcie przycisku ponowienia (resetuje stan i wraca do formularza)
- **Typy**: 
  - Props: `error: AIGenerateRecipeErrorResponse | ApiError`, `onRetry: () => void`
- **Props**: 
  ```typescript
  interface ErrorMessageProps {
    error: AIGenerateRecipeErrorResponse | ApiError;
    onRetry: () => void;
  }
  ```

## 5. Typy

### DTO z types.ts

- **AIGenerateRecipeInput**: DTO dla żądania API, zawiera:
  - `available_ingredients`: string[] (min 1, max 20 elementów)
  - `dietary_goals?`: string (max 500 chars)
  - `additional_context?`: string (max 1000 chars)

- **AIGenerateRecipeResponse**: DTO dla sukcesu API, zawiera:
  - `generation_id`: string
  - `recipe`: AIGeneratedRecipe
  - `input_payload`: AIInputPayload
  - `created_at`: string

- **AIGenerateRecipeErrorResponse**: DTO dla błędu braku rekomendacji (422), zawiera:
  - `error`: string
  - `message`: string
  - `generation_id`: string
  - `suggestions`: string[]

- **AIGeneratedRecipe**: Typ przepisu wygenerowanego przez AI, zawiera:
  - `title`: string
  - `summary`: string
  - `ingredients`: string
  - `preparation`: string

- **ApiError**: DTO dla błędów API, zawiera:
  - `error`: string
  - `message`: string
  - `details?`: Record<string, unknown> | unknown[]

### ViewModel (nowe typy)

- **AIGenerationState**: Stan zarządzany przez custom hook, zawiera:
  - `isGenerating`: boolean
  - `generatedRecipe`: AIGeneratedRecipe | null
  - `error`: AIGenerateRecipeErrorResponse | ApiError | null
  - `isSaving`: boolean (podczas zapisu przepisu)

- **RateLimitInfo**: Informacje o rate limicie z 429, zawiera:
  - `retryAfter`: number (sekundy)
  - `message`: string

## 6. Zarządzanie stanem

Stan zarządzany przez custom hook `useAIGeneration` w `src/hooks/useAIGeneration.ts`:

**Stan formularza**:
- Zarządzanie przez `react-hook-form` z `useForm<AIGenerateRecipeInput>()` z resolver `zodResolver(AIGenerateRecipeInputSchema)`
- Walidacja w trybie `onChange` (walidacja przy każdej zmianie)

**Stan generowania**:
- `isGenerating: boolean` - czy trwa generowanie przepisu
- `generatedRecipe: AIGeneratedRecipe | null` - wygenerowany przepis
- `error: AIGenerateRecipeErrorResponse | ApiError | null` - błąd generowania
- `isSaving: boolean` - czy trwa zapisywanie przepisu

**Obsługa równoległych żądań**:
- Blokada: `isGenerating` zapobiega wysłaniu kolejnego żądania
- Przycisk Generate disabled podczas `isGenerating === true`

**Cache/część stanu**:
- Brak localStorage (ustalane dynamicznie przy każdym użyciu)
- Reset stanu przy odrzuceniu przepisu (`generatedRecipe = null`, `error = null`)

## 7. Integracja API

### POST /api/ai/generate-recipe

**Typ żądania**: `POST`

**Headers**:
```typescript
{
  "Content-Type": "application/json",
  "Authorization": `Bearer ${accessToken}`
}
```

**Body**: `AIGenerateRecipeInput` jako JSON

**Response 200 OK**: `AIGenerateRecipeResponse`
```typescript
{
  generation_id: string,
  recipe: AIGeneratedRecipe,
  input_payload: AIInputPayload,
  created_at: string
}
```

**Response 400 Bad Request**: `ApiError` (błędna walidacja)

**Response 404 Not Found**: `ApiError` (brak preferencji użytkownika)

**Response 422 Unprocessable Entity**: `AIGenerateRecipeErrorResponse` (AI nie znalazł rozwiązania)
```typescript
{
  error: "No recipe generated",
  message: string,
  generation_id: string,
  suggestions: string[]
}
```

**Response 429 Too Many Requests**: `ApiError` z header `Retry-After`
```typescript
{
  error: "Rate limit exceeded",
  message: string,
  retry_after?: number
}
```

**Response 500 Internal Server Error**: `ApiError` (błąd serwera)

### POST /api/recipes

**Typ żądania**: `POST`

**Headers**:
```typescript
{
  "Content-Type": "application/json"
}
```

**Body**: `RecipeCreateInput` (z wygenerowanego przepisu)

**Response 201 Created**: `Recipe`

**Response 400/422**: `ApiError`

## 8. Interakcje użytkownika

### Wprowadzanie składników

**Akcja**: Użytkownik wprowadza składniki w polu `IngredientsInput`

**Rezultat**:
- Dynamiczne dodawanie/usuwanie pól Input dla składników
- Walidacja w czasie rzeczywistym: 1-100 znaków na składnik
- Błąd pod polem jeśli: puste pole, >100 znaków
- Przycisk "Add ingredient" dodaje nowe pole (max 20)
- Przycisk "Remove" usuwa składnik z listy

**Stan**: `watch('available_ingredients')` w react-hook-form

### Wypełnianie opcjonalnych pól

**Akcja**: Użytkownik wprowadza cele dietetyczne lub kontekst

**Rezultat**:
- Maksymalne długości: dietary_goals (500), additional_context (1000)
- Pole może pozostać puste
- Błąd tylko jeśli przekroczony limit

### Wysłanie formularza (Generate)

**Akcja**: Kliknięcie przycisku "Generate Recipe"

**Rezultat**:
1. Walidacja formularza (jeśli `isValid === false`, błąd walidacji wyświetlany)
2. Jeśli `isGenerating === true`, blokada (przycisk disabled)
3. Jeśli `isValid === true` i `isGenerating === false`:
   - Ustaw `isGenerating = true`
   - API call POST /api/ai/generate-recipe
   - Loading state: pokaż `LoadingSpinner`
   - Ukryj formularz

### Pomyślne generowanie

**Akcja**: API zwraca 200 OK z `AIGenerateRecipeResponse`

**Rezultat**:
1. `isGenerating = false`
2. `generatedRecipe = response.recipe`
3. Ukryj `LoadingSpinner`
4. Pokaż `GeneratedRecipePreview`

### Akceptacja przepisu

**Akcja**: Kliknięcie przycisku "Accept Recipe"

**Rezultat**:
1. `isSaving = true`
2. API call POST /api/recipes z danymi wygenerowanego przepisu
3. Jeśli sukces: 
   - `toast.success("Przepis został zapisany")`
   - Redirect do `globalThis.location.href = "/"`
4. Jeśli błąd:
   - `toast.error(errorMessage)`
5. `isSaving = false`

### Odrzucenie przepisu

**Akcja**: Kliknięcie przycisku "Reject"

**Rezultat**:
1. `generatedRecipe = null`
2. Ukryj `GeneratedRecipePreview`
3. Pokaż formularz
4. Reset pól formularza (opcjonalne) lub pozostaw dane do edycji

## 9. Warunki i walidacja

### Walidacja formularza (client-side)

**Pole: available_ingredients**
- Wymagane: array, min 1 element, max 20 elementów
- Każdy element: string, 1-100 znaków, trimmed
- Komunikat błędu: "At least one ingredient is required" (jeśli puste)
- Komunikat błędu: "Maximum 20 ingredients allowed" (jeśli >20)
- Komunikat błędu: "Ingredient name cannot be empty" (jeśli któregoś elementu puste)
- Komunikat błędu: "Ingredient name must be at most 100 characters" (jeśli któryś >100)

**Pole: dietary_goals**
- Opcjonalne: string, max 500 znaków, trimmed
- Komunikat błędu: "Dietary goals must be at most 500 characters" (jeśli >500)

**Pole: additional_context**
- Opcjonalne: string, max 1000 znaków, trimmed
- Komunikat błędu: "Additional context must be at most 1000 characters" (jeśli >1000)

**Komponent formularza**:
- `isValid` - czy formularz jest poprawny (przez react-hook-form)
- `isGenerating` - czy trwa generowanie (blokada równoległych żądań)
- `GenerateButton` disabled jeśli: `isGenerating === true` lub `isValid === false`

### Warunki wyświetlania komponentów

**Warunek: isGenerating === true**
- Komponenty: `LoadingSpinner` widoczny, `GenerationForm` ukryty, `GeneratedRecipePreview` ukryty
- UI: Card z loaderem i tekstem "Generowanie przepisu..."

**Warunek: generatedRecipe !== null i !isGenerating**
- Komponenty: `GeneratedRecipePreview` widoczny, `GenerationForm` ukryty, `LoadingSpinner` ukryty
- UI: Card z tytułem, summary, ingredients, preparation, przyciski Accept/Reject

**Warunek: error !== null i !isGenerating**
- Komponenty: `ErrorMessage` widoczny, `GenerationForm` widoczny, `LoadingSpinner` ukryty
- UI: Card z komunikatem błędu, suggestions (jeśli 422), przycisk "Try again"

**Warunek: !isGenerating i !generatedRecipe i !error**
- Komponenty: `GenerationForm` widoczny, `LoadingSpinner` ukryty, `GeneratedRecipePreview` ukryty, `ErrorMessage` ukryty
- UI: Formularz do wprowadzania danych

**Warunek: isSaving === true**
- Komponenty: `AcceptRejectButtons` disabled
- UI: Przycisk Accept z Loader2 icon i tekstem "Zapisywanie..."

### Warunki blokady równoległych żądań

**Warunek: isGenerating === true**
- Komponenty: `GenerateButton` disabled
- Komponenty: `GenerationForm` ukryty (nie można edytować podczas generowania)
- UI: Komunikat "Generowanie przepisu..." (wyświetlany w `LoadingSpinner`)

### Warunki błędów API

**Warunek: API 400 (błędna walidacja)**
- Response: `ApiError`
- Obsługa: wyświetlenie `error.message` w snackbar (toast.error)
- Akcja: użytkownik może poprawić formularz

**Warunek: API 404 (brak preferencji)**
- Response: `ApiError`
- Obsługa: toast.error("Musisz uzupełnić preferencje w profilu")
- Akcja: redirect do `/profile` lub `/onboarding` (jeśli nie uzupełnione)

**Warunek: API 422 (brak rozwiązania)**
- Response: `AIGenerateRecipeErrorResponse`
- Obsługa: wyświetlenie `error.message` oraz `error.suggestions` w komponencie `ErrorMessage`
- UI: Card z AlertCircle, lista suggestions, przycisk "Try again"
- Akcja: reset stanu i powrót do formularza

**Warunek: API 429 (rate limit)**
- Response: `ApiError` z `retry_after` w szczegółach
- Obsługa: toast.error z countdown timer w sekundach
- UI: Snackbar z tekstem "Zbyt wiele prób. Spróbuj ponownie za X sekund" z odliczaniem
- Akcja: użytkownik czeka i może spróbować ponownie po countdown

**Warunek: API 500 (błąd serwera)**
- Response: `ApiError`
- Obsługa: toast.error("Błąd serwera. Spróbuj ponownie później")
- Akcja: użytkownik może spróbować ponownie

## 10. Obsługa błędów

### Błąd: Formularz niepoprawny

**Gdy wystąpi**: Próba wysłania formularza z błędami walidacji

**Obsługa**:
- react-hook-form wyświetli komunikaty błędów pod każdym polem
- Przycisk "Generate Recipe" disabled
- Snackbar informujący: "Popraw błędy w formularzu"

### Błąd: Brak preferencji użytkownika (404)

**Gdy wystąpi**: User nie ma uzupełnionych preferencji

**Obsługa**:
- API zwraca 404 z `ApiError`
- Toast: "Musisz uzupełnić preferencje w profilu"
- Redirect: `globalThis.location.href = "/profile"`

### Błąd: AI nie znalazł rozwiązania (422)

**Gdy wystąpi**: AI nie może wygenerować przepisu na podstawie składników i preferencji

**Obsługa**:
- API zwraca 422 z `AIGenerateRecipeErrorResponse` zawierającym:
  - `error`: "No recipe generated"
  - `message`: string z opisem
  - `suggestions`: string[] z sugestiami
- Wyświetlenie `ErrorMessage` z:
  - AlertCircle ikoną
  - Tekstem błędu
  - Listą suggestions (bullets)
  - Przyciskiem "Try again"
- Przycisk "Try again" resetuje stan (`generatedRecipe = null`, `error = null`)

### Błąd: Rate limit (429)

**Gdy wystąpi**: Zbyt wiele żądań w krótkim czasie

**Obsługa**:
- API zwraca 429 z `ApiError`
- Sprawdzenie header `Retry-After` (jeśli dostępny)
- Toast z countdown timer
- Implementacja countdown w snackbar (np. "Spróbuj ponownie za 45:00")
- Przycisk Generate disabled podczas countdown

### Błąd: Błąd serwera (500)

**Gdy wystąpi**: Błąd generowania przepisu w AI service

**Obsługa**:
- API zwraca 500 z `ApiError`
- Toast: "Błąd podczas generowania przepisu. Spróbuj ponownie później"
- `error` state ustawiony dla późniejszego wyświetlenia
- Generacja zapisana w `ai_generations` z `error_message`

### Błąd: Network error

**Gdy wystąpi**: Brak połączenia z API

**Obsługa**:
- catch block w `onSubmit` handler
- Toast: "Błąd połączenia. Sprawdź połączenie internetowe"
- `error` state ustawiony

### Błąd: Zapis przepisu nieudany (POST /api/recipes)

**Gdy wystąpi**: Błąd przy akceptacji przepisu (zapisanie do repozytorium)

**Obsługa**:
- Wyświetlenie komunikatu błędu w toast
- Przepis pozostaje w widoku (możliwość ponowienia próby)
- `isSaving = false`

## 11. Kroki implementacji

### Krok 1: Utworzenie custom hook useAIGeneration

**Plik**: `src/hooks/useAIGeneration.ts`

**Implementacja**:
1. Import react-hook-form, zodResolver, AIGenerateRecipeInputSchema
2. Utworzenie useForm hook z resolver
3. Stan: isGenerating, generatedRecipe, error, isSaving
4. Funkcja generateRecipe() - POST /api/ai/generate-recipe
5. Funkcja saveRecipe() - POST /api/recipes
6. Funkcja rejectRecipe() - reset stanu
7. Obsługa błędów: 400, 404, 422, 429, 500

### Krok 2: Implementacja komponentu IngredientsInput

**Plik**: `src/components/ai/IngredientsInput.tsx`

**Implementacja**:
1. Props: register, watch, setValue, errors, disabled z react-hook-form
2. State: lista składników zarządzana przez setValue
3. Obsługa dodawania/usuwania pól
4. Walidacja każdego pola (w czasie rzeczywistym)
5. Wyświetlanie błędów pod każdym polem

### Krok 3: Implementacja komponentu GenerationForm

**Plik**: `src/components/ai/GenerationForm.tsx`

**Implementacja**:
1. Props: onSubmit, isGenerating, error z useAIGeneration
2. UseForm dla AIGenerateRecipeInput
3. Składniki komponentów: IngredientsInput, DietaryGoalsInput, AdditionalContextInput
4. GenerateButton z obsługą disabled states
5. Obsługa submit: walidacja, wywołanie onSubmit

### Krok 4: Implementacja komponentu GeneratedRecipePreview

**Plik**: `src/components/ai/GeneratedRecipePreview.tsx`

**Implementacja**:
1. Props: recipe (AIGeneratedRecipe), onAccept, onReject, isSaving
2. Card z CardHeader, CardContent (Summary, Ingredients, Preparation)
3. AcceptRejectButtons w CardFooter
4. Obsługa Accept: API call POST /api/recipes, redirect
5. Obsługa Reject: reset stanu

### Krok 5: Implementacja komponentu LoadingSpinner

**Plik**: `src/components/ai/LoadingSpinner.tsx`

**Implementacja**:
1. Card z CardContent
2. Loader2 icon (Lucide)
3. Tekst: "Generowanie przepisu przez AI..."

### Krok 6: Implementacja komponentu ErrorMessage

**Plik**: `src/components/ai/ErrorMessage.tsx`

**Implementacja**:
1. Props: error (AIGenerateRecipeErrorResponse | ApiError), onRetry
2. Wyświetlenie error.message
3. Warunkowe wyświetlenie suggestions (tylko dla 422)
4. Przycisk "Try again" resetujący stan

### Krok 7: Implementacja głównego komponentu AIGenerateContent

**Plik**: `src/components/ai/AIGenerateContent.tsx`

**Implementacja**:
1. Props: accessToken
2. Użycie useAIGeneration hook
3. Warunkowe renderowanie:
   - isGenerating → LoadingSpinner
   - generatedRecipe → GeneratedRecipePreview
   - error → ErrorMessage + GenerationForm
   - else → GenerationForm
4. Obsługa onAccept, onReject, onSubmit

### Krok 8: Utworzenie strony Astro generate.astro

**Plik**: `src/pages/ai/generate.astro`

**Implementacja**:
1. Import AuthLayout
2. Server-side auth check (locals.user)
3. Sprawdzenie preferencji (GET /api/preferences lub bezpośrednio z DB)
4. Redirect do /onboarding jeśli brak preferencji
5. Rendering AIGenerateContent z accessToken

### Krok 9: Dodanie nawigacji do widoku

**Modyfikacje**:
1. `src/components/dashboard/QuickActions.tsx`: dodać przycisk "Generate Recipe" → /ai/generate
2. `src/components/recipes/view/RecipesListContent.tsx`: dodać przycisk "Generate with AI" (jeśli lista pusta)
3. Sidebar/navbar: dodać link do generowania AI (jeśli istnieje)

### Krok 10: Testowanie

**Scenariusze testowe**:
1. Wprowadzenie składników i generowanie
2. Akceptacja przepisu (redirect do /)
3. Odrzucenie przepisu (powrót do formularza)
4. Błąd walidacji formularza
5. Błąd 422 (brak rozwiązania)
6. Błąd 429 (rate limit)
7. Błąd 500 (serwer)
8. Blokada równoległych żądań
9. Reset stanu po odrzuceniu

### Krok 11: Stylowanie i responsywność

**Działania**:
1. Sprawdzenie wyglądu na różnych rozdzielczościach
2. Użycie klas Tailwind dla responsywności
3. Spójność z resztą aplikacji (kolory, odstępy)
4. Dostępność (aria-labels, semantyczne HTML)

### Krok 12: Dokumentacja i cleanup

**Działania**:
1. Dodanie komentarzy w kodzie
2. Sprawdzenie TypeScript types
3. Usunięcie console.log
4. Commit do git

