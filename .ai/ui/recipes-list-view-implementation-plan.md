# Plan implementacji widoku Lista przepisów

## 1. Przegląd

Widok Lista przepisów (`/recipes`) umożliwia użytkownikom przeglądanie i wyszukiwanie wszystkich swoich przepisów. Kluczowe funkcje obejmują:

- Wyświetlanie przepisów w formie tabeli z sortowaniem
- Wyszukiwanie przepisów po tytule z debounce 300ms
- Paginacja dla dużej liczby przepisów (>50)
- Empty state dla braku przepisów
- Nawigacja do szczegółów przepisu przez kliknięcie

Widok wykorzystuje istniejący endpoint API `/api/recipes`, który wymaga autentykacji i zwraca listę przepisów użytkownika.

## 2. Routing widoku

**Ścieżka:** `/recipes`

**Lokalizacja pliku:** `src/pages/recipes/index.astro`

**Layout:** Używa `AuthLayout.astro` (wymaga logowania)

**Middleware:** Sprawdzenie autentykacji w Astro, przekierowanie do `/login` jeśli brak sesji

## 3. Struktura komponentów

```
RecipesListView (src/pages/recipes/index.astro)
├── AuthLayout
└── RecipesListContent (React client component)
    ├── RecipesSearchBar (input z debounce)
    ├── RecipesTable (tabela z przepisami)
    │   ├── TableHeader (nagłówek kolumn)
    │   ├── TableBody (rzędy przepisów)
    │   └── TableRow (pojedynczy przepis)
    ├── PaginationControls (kontrolki paginacji)
    ├── LoadingState (skeleton loader)
    └── EmptyState (brak przepisów)
```

## 4. Szczegóły komponentów

### RecipesListContent (główny kontener)

**Opis:** React component zarządzający logiką widoku listy przepisów

- Połączenie z API i pobieranie danych
- Zarządzanie stanem wyszukiwania, paginacji i ładowania
- Obsługa błędów i empty state
- Integracja z custom hookiem `useRecipesList`

**Główne elementy:**

- Hook `useRecipesList` do zarządzania stanem i API
- Conditional rendering dla różnych stanów (loading, empty, error, success)
- Search input wrapper
- Tabela z przepisami

**Obsługiwane zdarzenia:**

- handleSearch - obsługa zmiany wyszukiwarki z debounce
- handlePageChange - zmiana strony paginacji
- handleRowClick - przejście do szczegółów przepisu
- handleDelete - usunięcie przepisu
- handleEdit - edycja przepisu (opcjonalnie w dropdown menu)

**Obsługiwana walidacja:**

- Sprawdzenie czy użytkownik jest zalogowany (po stronie SSR)
- Sprawdzenie czy użytkownik posiada preferencje (redirect do onboarding)
- Walidacja parametrów paginacji (str >= 1, size > 0)
- Walidacja długości wyszukiwarki (opcjonalnie max 255 znaków)

**Typy:**

- Recipe[] - lista przepisów
- RecipesListState - stan komponentu (recipes, searchQuery, currentPage, isLoading, error)
- RecipesListProps - nie przyjmuje żadnych props (wszystko pobiera przez API)

**Props:**

- Brak (komponent pobiera dane bezpośrednio przez API i hook)

### RecipesSearchBar

**Opis:** Input field z debounce do wyszukiwania przepisów

- Input component z ikoną wyszukiwania
- Debounce 300ms na wpisanie
- Obsługa klawisza Escape do wyczyszczenia
- URL param persistence (search query w URL)

**Główne elementy:**

- Input component z Shadcn UI
- Icon (Search, X) z lucide-react
- useEffect z debounce timer

**Obsługiwane zdarzenia:**

- onChange - zmiana wartości inputa
- onKeyDown (Escape) - wyczyszczenie wyszukiwania
- onClick (X button) - wyczyszczenie wyszukiwania

**Obsługiwana walidacja:**

- Max length 255 znaków (opcjonalna)
- Trim whitespace na końcach

**Typy:**

- RecipesSearchBarProps: { value: string, onChange: (value: string) => void, placeholder?: string }

**Props:**

- value: string - aktualna wartość wyszukiwarki
- onChange: (value: string) => void - callback przy zmianie
- placeholder?: string - placeholder tekstu (domyślnie "Search recipes...")

### RecipesTable

**Opis:** Tabela przepisów z sortowaniem i akcjami

- Wyświetla tytuł, datę utworzenia, datę ostatniej edycji
- Każdy wiersz ma menu akcji (View, Edit, Delete)
- Kliknięcie w wiersz otwiera szczegóły
- Responsive design (overflow-x-auto dla mobile)

**Główne elementy:**

- Table component z Shadcn UI (musi zostać dodany)
- TableHeader z kolumnami
- TableBody z mapowaniem przepisów
- TableRow (klikalny) z menu akcji
- AlertDialog dla potwierdzenia usunięcia

**Obsługiwane zdarzenia:**

- onClick row - przejście do /recipes/{id}
- onClick View - przejście do /recipes/{id}
- onClick Edit - przejście do /recipes/{id}/edit
- onClick Delete - otwarcie dialogu potwierdzenia
- onConfirm Delete - wywołanie API DELETE

**Obsługiwana walidacja:**

- Sprawdzenie ownership przed usunięciem (po stronie API)
- Sprawdzenie czy przepis istnieje przed nawigacją

**Typy:**

- Recipe - typ przepisu
- RecipesTableProps: { recipes: Recipe[], isLoading: boolean, onDelete: (id: string) => void }

**Props:**

- recipes: Recipe[] - lista przepisów do wyświetlenia
- isLoading: boolean - stan ładowania
- onDelete: (id: string) => void - callback przy usunięciu
- onView: (id: string) => void - callback przy przejrzeniu (opcjonalne)

### PaginationControls

**Opis:** Kontrolki paginacji dla dużej liczby przepisów

- Wyświetlana tylko gdy totalPages > 1
- Previous/Next buttons
- Numeracja stron (jeśli <= 10 stron)
- Dots (...) dla większej liczby stron

**Główne elementy:**

- Button components (Previous, Next)
- Numeracja stron (1, 2, 3...) z aktywną stroną
- Dots (...) dla pominętych stron

**Obsługiwane zdarzenia:**

- onClick Previous/Next - zmiana strony
- onClick PageNumber - przeskok do strony

**Obsługiwana walidacja:**

- Disabled dla Previous na pierwszej stronie
- Disabled dla Next na ostatniej stronie
- Current page highlight

**Typy:**

- PaginationControlsProps: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }

**Props:**

- currentPage: number - aktualna strona
- totalPages: number - całkowita liczba stron
- onPageChange: (page: number) => void - callback przy zmianie strony

### LoadingState (RecipeListSkeleton)

**Opis:** Skeleton loader pokazywany podczas ładowania

- Już istnieje w projekcie jako `RecipeListSkeleton`
- Wyświetla 5-10 fake rows podczas ładowania

**Główne elementy:**

- Skeleton component z Shadcn UI
- Fake rows z placeholder content

### EmptyState

**Opis:** Komunikat dla braku przepisów

- Już istnieje w projekcie
- Wyświetla tytuł, opis i akcje (Add Recipe, Generate with AI)

**Główne elementy:**

- EmptyState component z dashboard utils
- Button components dla akcji

**Obsługiwane zdarzenia:**

- onClick Add Recipe - przejście do /recipes/new
- onClick Generate with AI - przejście do /ai/generate (futuro)

## 5. Typy

### Nowe typy do dodania

```typescript
// src/hooks/useRecipesList.ts
interface UseRecipesListProps {
  accessToken: string;
  initialRecipes?: Recipe[];
}

interface UseRecipesListReturn {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  refreshRecipes: () => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}
```

### Istniejące typy używane w widoku

```typescript
// src/types.ts (już istniejące)
interface Recipe {
  id: string;
  owner_id: string;
  title: string;
  summary?: string;
  ingredients: string;
  preparation: string;
  created_at: string;
  updated_at: string;
}

interface RecipeListResponse {
  recipes: Recipe[];
}
```

## 6. Zarządzanie stanem

**Custom Hook:** `useRecipesList` w pliku `src/hooks/useRecipesList.ts`

**Stan zarządzany przez hook:**

- `recipes: Recipe[]` - lista przepisów (filtrowana)
- `allRecipes: Recipe[]` - pełna lista z API (przed filtrowaniem)
- `isLoading: boolean` - stan ładowania
- `error: string | null` - błędy API
- `searchQuery: string` - fraza wyszukiwania
- `currentPage: number` - aktualna strona paginacji
- `pageSize: number` - liczba przepisów na stronę (domyślnie 50)

**Logika hooka:**

1. Pobieranie danych z `/api/recipes` przy inicjalizacji
2. Filtrowanie przepisów po `title` (case-insensitive, zawiera)
3. Paginacja przefiltrowanych wyników
4. Debounce search query (300ms)
5. URL params sync (search, page)
6. Refresh recipes po delete
7. Error handling z toast notifications

**Zarządzanie stanem:**

- Wszystko zlokalizowane w custom hooku
- Bezpośrednio zintegrowane z API
- Optimistic updates dla delete
- Rollback przy błędach API

## 7. Integracja API

**Endpoint:** `GET /api/recipes`

**Autentykacja:** Wymagana (session cookie lub Authorization header)

**Typ żądania:** GET request bez body

**Headers:**

```typescript
{
  'Content-Type': 'application/json',
  // Authorization przez session cookie w Astro
}
```

**Typ odpowiedzi:**

```typescript
interface RecipeListResponse {
  recipes: Recipe[];
}

interface Recipe {
  id: string;
  owner_id: string;
  title: string;
  summary?: string;
  ingredients: string;
  preparation: string;
  created_at: string;
  updated_at: string;
}
```

**Implementacja w hooku:**

```typescript
const response = await fetch("/api/recipes", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});
```

**Akcje po otrzymaniu odpowiedzi:**

- Aktualizacja stanu recipes
- Filtrowanie po searchQuery
- Paginacja
- Sync z URL params

**Błędy API:**

- 401 Unauthorized - redirect do login
- 500 Internal Server Error - wyświetlenie błędu
- Network errors - wyświetlenie błędu z opcją retry

**Usuwanie przepisów:**

- Endpoint: `DELETE /api/recipes/{id}`
- Optimistic update
- Rollback przy błędzie
- Toast notification

## 8. Interakcje użytkownika

### Wyszukiwanie przepisów

1. Użytkownik wpisuje tekst w search bar
2. Debounce 300ms przed wykonaniem wyszukiwania
3. Aktualizacja URL param `?search={query}`
4. Filtrowanie przepisów po tytule
5. Reset paginacji do strony 1
6. Aktualizacja wyświetlanych wyników

### Zmiana strony paginacji

1. Użytkownik klika Previous/Next lub numer strony
2. Aktualizacja URL param `?page={number}`
3. Scroll do góry tabeli
4. Wyświetlenie nowej strony wyników

### Przejście do szczegółów

1. Kliknięcie w wiersz tabeli lub przycisk View
2. Nawigacja do `/recipes/{id}`
3. Otwarcie widoku szczegółowego przepisu

### Usunięcie przepisu

1. Kliknięcie Delete w menu akcji
2. Otwarcie AlertDialog z potwierdzeniem
3. Kliknięcie "Delete" w dialogu
4. Optimistic update UI
5. Wywołanie API DELETE
6. Toast success/error
7. Rollback przy błędzie
8. Aktualizacja listy przepisów

### Edycja przepisu

1. Kliknięcie Edit w menu akcji (opcjonalne)
2. Nawigacja do `/recipes/{id}/edit`

### Refetch przepisów

1. Przycisk Refresh (opcjonalny)
2. Ręczne odświeżenie danych z API
3. Aktualizacja listy
4. Toast notification

## 9. Warunki i walidacja

### Warunki autoryzacji

- Użytkownik musi być zalogowany (sprawdzenie w Astro SSR)
- Owner_id musi się zgadzać z zalogowanym użytkownikiem (po stronie API)
- Walidacja w `src/pages/recipes/index.astro` przed renderowaniem

### Warunki stronicowania

- `currentPage >= 1` (validacja po stronie frontend)
- `currentPage <= totalPages`
- `pageSize > 0` (domyślnie 50)

### Warunki wyszukiwania

- `searchQuery.length <= 255` (opcjonalna walidacja)
- Trim whitespace przed filtrowaniem
- Filtrowanie case-insensitive

### Warunki usuwania

- Potwierdzenie przez dialog
- Walidacja ownership po stronie API
- Sprawdzenie czy przepis nie jest już usunięty

### Warunki empty state

- `recipes.length === 0` po wyszukiwaniu
- Ukryj empty state podczas ładowania
- Pokaż po zakończeniu ładowania

### Warunki paginacji UI

- Ukryj jeśli `totalPages <= 1`
- Disable Previous jeśli `currentPage === 1`
- Disable Next jeśli `currentPage === totalPages`
- Show dots (...) dla `totalPages > 10`

## 10. Obsługa błędów

### Błędy API /api/recipes

**Scenariusz:** Błąd pobierania przepisów

- Obsługa: Toast error message
- UI: Wyświetlenie komunikatu błędu z przyciskiem Retry
- Fallback: Empty state z opcją odświeżenia

**Scenariusz:** Timeout połączenia

- Obsługa: Toast timeout error
- UI: Komunikat "Request timed out" z przyciskiem Retry
- Fallback: Możliwość kontynuacji offline (cache)

### Błędy DELETE /api/recipes/{id}

**Scenariusz:** Niepowodzenie usunięcia

- Obsługa: Toast error message
- UI: Rollback optimistic update
- Fallback: Przepis pozostaje w liście

**Scenariusz:** Przepis już usunięty

- Obsługa: Toast informacyjny
- UI: Usunięcie przepisu z listy mimo błędu

### Scenariusze brzegowe

**Brak przepisów:**

- Empty state z akcjami
- Komunikat "No recipes found"

**Brak wyników wyszukiwania:**

- Komunikat "No recipes found matching '{query}'"
- Przycisk Clear Search
- Sugestia zmiany zapytania

**Network offline:**

- Toast "You're offline"
- Wyświetlenie cache'owanych danych
- Przycisk Retry gdy online

**Session expired:**

- Redirect do /login
- Toast "Session expired"
- Powrót do listy po zalogowaniu

## 11. Kroki implementacji

### Krok 1: Dodanie komponentu Table do Shadcn UI

1.1. Wygenerować komponent Table za pomocą CLI lub manualnie

```bash
npx shadcn@latest add table
```

1.2. Lokalizacja: `src/components/ui/table.tsx`
1.3. Sprawdzenie czy komponent został poprawnie dodany

### Krok 2: Utworzenie custom hooka useRecipesList

2.1. Utworzyć plik `src/hooks/useRecipesList.ts`
2.2. Zaimportować potrzebne typy z `src/types.ts`
2.3. Zaimplementować logikę:

- Fetch z `/api/recipes`
- State management (recipes, loading, error, search, page)
- Filtrowanie przepisów
- Paginacja
- Debounce search
- Delete recipe
- URL params sync
  2.4. Zwrócić wszystkie potrzebne wartości i funkcje
  2.5. Przetestować hook

### Krok 3: Utworzenie komponentu RecipesSearchBar

3.1. Utworzyć plik `src/components/recipes/RecipesSearchBar.tsx`
3.2. Zaimportować Input z `src/components/ui/input.tsx`
3.3. Zaimportować ikony z lucide-react
3.4. Zaimplementować:

- Input z ikoną search
- Przycisk X do czyszczenia
- Debounce logic (300ms)
- Obsługa Escape key
  3.5. Wyeksportować komponent

### Krok 4: Utworzenie komponentu RecipesTable

4.1. Utworzyć plik `src/components/recipes/RecipesTable.tsx`
4.2. Zaimportować Table components z Shadcn UI
4.3. Zaimportować DropdownMenu, AlertDialog z UI
4.4. Zaimportować formatDate z utils
4.5. Zaimplementować:

- TableHeader (Tytuł, Data utworzenia, Data edycji, Akcje)
- TableBody z mapowaniem recipes
- TableRow (klikalny)
- Menu akcji (View, Edit, Delete)
- AlertDialog dla confirmacji delete
  4.6. Obsługa onClick events
  4.7. Wyeksportować komponent

### Krok 5: Utworzenie komponentu PaginationControls

5.1. Utworzyć plik `src/components/recipes/PaginationControls.tsx`
5.2. Zaimportować Button z UI
5.3. Zaimplementować:

- Previous/Next buttons
- Numerację stron
- Dots (...) dla >10 stron
- Active page highlight
- Disabled states
  5.4. Wyeksportować komponent

### Krok 6: Utworzenie głównego komponentu RecipesListContent

6.1. Utworzyć plik `src/components/recipes/RecipesListContent.tsx`
6.2. Zaimportować hook `useRecipesList`
6.3. Zaimportować wszystkie podkomponenty
6.4. Zaimportować RecipeListSkeleton i EmptyState
6.5. Zaimplementować logikę:

- Wywołanie hooka
- Conditional rendering (loading, empty, error, success)
- Obsługa delete
- Obsługa page change
- Obsługa search
  6.6. Wyeksportować komponent

### Krok 7: Utworzenie strony Astro recipes/index.astro

7.1. Utworzyć plik `src/pages/recipes/index.astro`
7.2. Zaimportować AuthLayout
7.3. Zaimportować RecipesListContent
7.4. Utworzyć Supabase client
7.5. Sprawdzić autentykację użytkownika
7.6. Sprawdzić czy użytkownik ma preferencje (redirect do onboarding)
7.7. Pobrać initial recipes z API (opcjonalnie dla SSR)
7.8. Wygenerować access token
7.9. Renderować AuthLayout z RecipesListContent
7.10. Przekazać accessToken jako prop

### Krok 8: Implementacja URL params persistence

8.1. W hooku useRecipesList dodać logikę:

- Czytanie params z URL przy inicjalizacji
- Aktualizacja URL params przy zmianie search/page
- History replace state (nie dodawać do historii)
  8.2. Użyć Astro.request.url do odczytu params w SSR
  8.3. Przetestować nawigację w przeglądarce

### Krok 9: Integracja z istniejącymi komponentami

9.1. Upewnić się, że RecipeListSkeleton jest dostępny
9.2. Upewnić się, że EmptyState jest dostępny
9.3. Sprawdzić czy RecipeCard może być użyty jako alternatywa dla TableRow (opcjonalnie)

### Krok 10: Stylowanie i responsywność

10.1. Stylować komponenty zgodnie z Tailwind 4
10.2. Sprawdzić responsywność na mobile
10.3. Dodać overflow-x-auto dla tabeli na mobile
10.4. Dostosować grid dla różnych rozdzielczości
10.5. Sprawdzić dark mode

### Krok 11: Walidacja i testy

11.1. Przetestować wszystkie interakcje użytkownika
11.2. Przetestować scenariusze błędów
11.3. Przetestować paginację
11.4. Przetestować wyszukiwanie
11.5. Przetestować usuwanie przepisów
11.6. Sprawdzić linter errors
11.7. Sprawdzić TypeScript errors

### Krok 12: Optymalizacja i finalizacja

12.1. Sprawdzić performance (React DevTools)
12.2. Sprawdzić bundle size
12.3. Sprawdzić accessibility (a11y)
12.4. Sprawdzić SEO (meta tags)
12.5. Finalne poprawki i uwagi

## Dodatkowe notatki

- Przepisy w projekcie nie mają tagów (migration usunęła wsparcie dla tagów)
- Endpoint API zwraca strukturę z tagami, ale obecne typy TypeScript nie zawierają tagów
- Trzeba zdecydować: czy rozszerzyć typy o tagi (dla przyszłości) czy ignorować je w odpowiedzi
- Sugeruję ignorowanie tagów w odpowiedzi API dopóki nie zostanie dodana funkcjonalność tagów
- Komponent Table z Shadcn UI musi być dodany przed rozpoczęciem implementacji
- Istnieje już RecipeCard do wyświetlania przepisów - można rozważyć grid layout jako alternatywę dla tabeli
- Paginacja jest wymagana tylko dla >50 przepisów, ale można też rozważyć infinite scroll dla lepszego UX
