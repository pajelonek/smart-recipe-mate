# Plan implementacji widoku Szczegóły przepisu

## 1. Przegląd

Widok szczegółów przepisu (`/recipes/[id]`) umożliwia użytkownikowi przeglądanie pełnych informacji o przepisie, edycję oraz usuwanie przepisów z aplikacji. Widok prezentuje informacje w czytelnej formie z możliwością expandowania sekcji przy użyciu komponentu Accordion, a także oferuje funkcjonalność edycji (PUT/PATCH) i usuwania (soft delete) przepisów z odpowiednimi potwierdzeniami.

Widok realizuje następujące user stories:

- **US-011**: Ręczna edycja przepisu z walidacją i potwierdzeniem sukcesu
- **US-012**: Usunięcie przepisu z modalem potwierdzenia i soft delete

## 2. Routing widoku

**Ścieżka**: `/recipes/[id]`

- **Typ routingu**: Dynamic routing w Astro
- **Wymagania autoryzacji**: Tylko dla zalogowanych użytkowników
- **Middleware**: Przekierowanie do logowania, jeśli użytkownik nie jest zalogowany
- **Parametr**: `id` - UUID przepisu

## 3. Struktura komponentów

```
src/pages/recipes/[id].astro
  └─ AuthLayout
      ├─ RecipeDetailContent (React Client Component)
          ├─ RecipeHeader (Recipe title, metadata)
          ├─ RecipeSummary (Accordion item)
          ├─ RecipeIngredients (Accordion item)
          ├─ RecipePreparation (Accordion item)
          ├─ RecipeActions (Edit/Delete buttons)
          ├─ EditRecipeDialog (Modal with form)
          └─ DeleteRecipeDialog (Modal with confirmation)

src/components/recipes/RecipeDetailContent.tsx
src/components/recipes/RecipeHeader.tsx
src/components/recipes/RecipeAccordionSection.tsx
src/components/recipes/RecipeActions.tsx
src/components/recipes/EditRecipeDialog.tsx
src/components/recipes/DeleteRecipeDialog.tsx
```

## 4. Szczegóły komponentów

### RecipeDetailPage (Astro)

**Opis**: Główna strona Astro do wyświetlania szczegółów przepisu. Fetchuje przepis po stronie serwera i renderuje React komponentu zarządzającego stanem po stronie klienta.

**Główne elementy**:

- Wykorzystuje `AuthLayout.astro` dla układu strony
- Fetchuje przepis z API po stronie serwera
- Sprawdza uprawnienia użytkownika (ownership)
- Przekazuje dane do `RecipeDetailContent` jako props initialRecipe
- Obsługuje errors 404, 403 poprzez redirect

**Props/Interface**:

```typescript
interface RecipeDetailPageProps {
  id: string; // UUID przepisu
}
```

### RecipeDetailContent

**Opis**: Główny komponent React zarządzający stanem widoku szczegółów przepisu. Wyświetla wszystkie informacje o przepisie, zarządza otwieraniem/zamykaniem dialogów edycji i usuwania, oraz obsługuje wywołania API.

**Główne elementy**:

- Stan `recipe`: Przechowuje aktualne dane przepisu
- Stan `isLoading`: Wskaźnik ładowania danych
- Stan `error`: Obsługa błędów ładowania
- Stan `isEditDialogOpen`: Zarządzanie modalem edycji
- Stan `isDeleteDialogOpen`: Zarządzanie modalem potwierdzenia usunięcia
- Funkcja `fetchRecipe()`: Pobiera przepis z `/api/recipes/:id`
- Funkcja `handleEdit()`: Otwiera modal edycji
- Funkcja `handleDeleteConfirm()`: Wywołuje DELETE API
- Funkcja `handleUpdateSuccess()`: Po udanej edycji zamyka modal i odświeża dane

**Obsługiwane interakcje**:

1. Ładowanie przepisu przy inicjalizacji komponentu
2. Otwieranie modala edycji przy kliknięciu "Edytuj"
3. Otwieranie modala potwierdzenia przy kliknięciu "Usuń"
4. Zapisywanie zmian po edycji
5. Potwierdzanie usunięcia
6. Anulowanie akcji w modalach

**Obsługiwana walidacja**:

- Na poziomie API: Sprawdzenie czy użytkownik jest właścicielem przepisu (403 Forbidden)
- Na poziomie widoku: Sprawdzenie czy przepis istnieje (404 Not Found)

**Typy**:

- `Recipe` - typ przepisu z `/types`
- `RecipeUpdateInput` - dla pełnej edycji (PUT)
- `RecipePartialUpdateInput` - dla częściowej edycji (PATCH)

**Props**:

```typescript
interface RecipeDetailContentProps {
  recipeId: string;
  initialRecipe: Recipe;
  accessToken: string;
}
```

### RecipeHeader

**Opis**: Komponent wyświetlający nagłówek przepisu z tytułem i metadanymi (daty utworzenia i ostatniej edycji).

**Główne elementy**:

- Wyświetla tytuł przepisu w znaczniku h1
- Wyświetla datę utworzenia i ostatniej edycji
- Małe, subtelne ikonki dla dat (calendar icon z lucide-react)

**Obsługiwane interakcje**:

- Brak interakcji (tylko wyświetlanie)

**Typy**:

- Wykorzystuje `Recipe` type
- Wykorzystuje narzędzie `formatDate` z `/lib/utils/date-formatter`

**Props**:

```typescript
interface RecipeHeaderProps {
  recipe: Recipe;
}
```

### RecipeAccordionSection

**Opis**: Reusable komponent wyświetlający sekcję przepisu w Accordion. Używany dla summary, ingredients, i preparation.

**Główne elementy**:

- Wykorzystuje komponent Accordion z shadcn/ui
- Tytuł sekcji na podstawie `title` prop
- Zawartość sekcji na podstawie `content` prop
- Formatowanie tekstu z podziałem na linie dla lepszej czytelności

**Obsługiwane interakcje**:

- Rozwijanie i zwijanie sekcji Accordion

**Typy**:

- Wykorzystuje tekst jako string
- Wykorzystuje komponenty z `@/components/ui/accordion`

**Props**:

```typescript
interface RecipeAccordionSectionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}
```

### RecipeActions

**Opis**: Komponent wyświetlający przyciski akcji dla przepisu (Edycja, Usuń).

**Główne elementy**:

- Przycisk "Edytuj" z ikoną Edit
- Przycisk "Usuń" z ikoną Trash (variant destructive)
- Sekcja przycisków umieszczona na dole strony
- Komponenty przycisków z shadcn/ui

**Obsługiwane interakcje**:

1. Kliknięcie "Edytuj" → wywołuje callback `onEdit`
2. Kliknięcie "Usuń" → wywołuje callback `onDelete`

**Typy**:

- Wykorzystuje `Button` z `@/components/ui/button`

**Props**:

```typescript
interface RecipeActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}
```

### EditRecipeDialog

**Opis**: Modal edycji przepisu z formularzem wykorzystującym react-hook-form i Zod resolver.

**Główne elementy**:

- Komponenty dialogowe z shadcn/ui (Dialog)
- Formularz z polami: title, summary, ingredients, preparation
- Walidacja po stronie frontendu (Zod schemas)
- Przycisk "Zapisz" z wskaźnikiem ładowania
- Przycisk "Anuluj" zamykający modal
- Wyświetlanie błędów walidacji pod każdym polem

**Obsługiwane interakcje**:

1. Zmiana wartości pól → walidacja w czasie rzeczywistym
2. Wysłanie formularza → PUT/PATCH request do API
3. Sukces → zamknięcie modala i odświeżenie danych
4. Błąd → wyświetlenie komunikatu błędu
5. Anulowanie → zamknięcie modala bez zapisywania

**Obsługiwana walidacja**:

- **Dla PUT**: Wszystkie pola wymagane (title, ingredients, preparation), summary opcjonalne
  - title: 1-200 znaków
  - summary: max 500 znaków
  - ingredients: 10-5000 znaków
  - preparation: 10-10000 znaków
- **Dla PATCH**: Przynajmniej jedno pole musi być wypełnione
  - Każde pole opcjonalne, ale po wypełnieniu musi spełniać limity

**Typy**:

- `RecipeUpdateInput` - dla pełnej edycji (PUT)
- `RecipePartialUpdateInput` - dla częściowej edycji (PATCH)
- Wykorzystuje react-hook-form: `UseFormReturn<RecipeUpdateInput>`

**Props**:

```typescript
interface EditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
  onSuccess: () => void;
}
```

### DeleteRecipeDialog

**Opis**: Modal potwierdzenia usunięcia przepisu z informacją o konsekwencjach.

**Główne elementy**:

- Tytuł: "Czy na pewno chcesz usunąć ten przepis?"
- Opis: "Ta operacja jest nieodwracalna. Przepis zostanie usunięty z Twojej kolekcji."
- Nazwa przepisu wyświetlona w opisie
- Przycisk "Anuluj" zamykający modal
- Przycisk "Usuń" wywołujący DELETE API
- Wskaźnik ładowania podczas operacji usuwania

**Obsługiwane interakcje**:

1. Wysłanie formularza → DELETE request do `/api/recipes/:id`
2. Sukces → zamknięcie modala i redirect do `/recipes`
3. Błąd → wyświetlenie komunikatu błędu
4. Anulowanie → zamknięcie modala bez usuwania

**Obsługiwana walidacja**:

- Sprawdzenie czy przepis istnieje (404)
- Sprawdzenie uprawnień (403)

**Typy**:

- Wykorzystuje `Recipe` type
- Wykorzystuje AlertDialog z shadcn/ui

**Props**:

```typescript
interface DeleteRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
  onConfirm: () => Promise<void>;
}
```

## 5. Typy

### Typy istniejące w projekcie

```typescript
// src/types.ts
export type Recipe = Omit<RecipeEntity, "deleted_at">;

export interface RecipeUpdateInput {
  title: string;
  summary?: string;
  ingredients: string;
  preparation: string;
}

export type RecipePartialUpdateInput = Partial<RecipeCreateInput>;
```

### Nowe typy wymagane dla widoku

```typescript
// src/components/recipes/RecipeDetailContent.tsx

interface RecipeDetailContentState {
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
}

interface FetchRecipeResponse {
  success: boolean;
  data?: Recipe;
  error?: {
    status: number;
    message: string;
  };
}
```

### Schematy walidacji (używane przez Zod)

```typescript
// src/lib/validation/recipes.schemas.ts

// Pełna edycja (PUT) - wszystkie pola wymagane
export const RecipeUpdateInputSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  ingredients: z.string().min(10).max(5000),
  preparation: z.string().min(10).max(10000),
});

// Częściowa edycja (PATCH) - wszystkie pola opcjonalne
export const RecipePartialUpdateInputSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    summary: z.string().max(500).optional(),
    ingredients: z.string().min(10).max(5000).optional(),
    preparation: z.string().min(10).max(10000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Przynajmniej jedno pole musi być wypełnione",
  });
```

## 6. Zarządzanie stanem

Widok wykorzystuje kombinację stanu React (useState) oraz react-hook-form dla formularzy. Nie jest wymagany niestandardowy hook, ponieważ logika zarządzania stanem jest relatywnie prosta.

**Stan React**:

```typescript
const [recipe, setRecipe] = useState<Recipe | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
```

**Logika zarządzania stanem**:

1. **Inicjalizacja**: Komponent otrzymuje `initialRecipe` jako prop i ustawia go jako początkowy stan
2. **Odświeżanie po edycji**: Po udanej edycji, stan `recipe` jest aktualizowany poprzez ponowne pobranie z API
3. **Obsługa błędów**: Błędy API są zapisywane w stanie `error` i wyświetlane użytkownikowi
4. **Toggle dialogów**: Funkcje `setIsEditDialogOpen` i `setIsDeleteDialogOpen` zarządzają widocznością modali

**Dlaczego nie custom hook?**
Logika jest relatywnie prosta i nie jest wielokrotnie używana w innych komponentach. Stan obejmuje tylko lokalne dane widoku (recipe, loading, error) oraz kontrolę modali, co nie wymaga abstrakcji do osobnego hooka.

## 7. Integracja API

### GET /api/recipes/:id

**Typ żądania**: GET
**Endpoint**: `/api/recipes/${recipeId}`
**Headers**: Brak dodatkowych headers (sesja zarządzana przez cookies)

**Typ odpowiedzi 200 OK**:

```typescript
{
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

**Typ odpowiedzi 404 Not Found**:

```typescript
{
  error: "Recipe not found";
  message: "Recipe does not exist or has been deleted";
}
```

**Typ odpowiedzi 403 Forbidden**:

```typescript
{
  error: "Access denied";
  message: "You do not have permission to access this recipe";
}
```

**Implementacja**:

```typescript
const fetchRecipe = async (recipeId: string): Promise<Recipe | null> => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/recipes/${recipeId}`);

    if (response.status === 404) {
      const errorData = await response.json();
      setError(errorData.message);
      return null;
    }

    if (response.status === 403) {
      const errorData = await response.json();
      setError(errorData.message);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Błąd podczas pobierania przepisu";
    setError(message);
    return null;
  } finally {
    setIsLoading(false);
  }
};
```

### PUT /api/recipes/:id (Pełna edycja)

**Typ żądania**: PUT
**Endpoint**: `/api/recipes/${recipeId}`
**Headers**: `Content-Type: application/json`
**Body**: Pełny obiekt `RecipeUpdateInput` ze wszystkimi polami wymaganymi

**Typ żądania**:

```typescript
{
  title: string;          // 1-200 znaków, wymagane
  summary?: string;       // max 500 znaków, opcjonalne
  ingredients: string;    // 10-5000 znaków, wymagane
  preparation: string;   // 10-10000 znaków, wymagane
}
```

**Typ odpowiedzi**: Takie same jak GET /api/recipes/:id

**Obsługa błędów**:

- 400: Błędny format danych (walidacja)
- 403: Brak uprawnień
- 404: Przepis nie istnieje
- 500: Błąd serwera

### PATCH /api/recipes/:id (Częściowa edycja)

**Typ żądania**: PATCH
**Endpoint**: `/api/recipes/${recipeId}`
**Headers**: `Content-Type: application/json`
**Body**: Częściowy obiekt `RecipePartialUpdateInput` z przynajmniej jednym polem

**Typ żądania**:

```typescript
{
  title?: string;
  summary?: string;
  ingredients?: string;
  preparation?: string;
}
// Przynajmniej jedno pole musi być podane
```

**Typ odpowiedzi**: Takie same jak GET /api/recipes/:id

### DELETE /api/recipes/:id

**Typ żądania**: DELETE
**Endpoint**: `/api/recipes/${recipeId}`
**Headers**: Brak dodatkowych headers

**Typ odpowiedzi 204 No Content**:

```
(Empty body)
```

**Typ odpowiedzi 404 Not Found**:

```typescript
{
  error: "Recipe not found";
  message: "Recipe does not exist or has already been deleted";
}
```

**Typ odpowiedzi 403 Forbidden**:

```typescript
{
  error: "Access denied";
  message: "You can only delete your own recipes";
}
```

**Uwaga**: DELETE wykonuje soft delete (ustawia `deleted_at` timestamp), więc przepis nie jest fizycznie usuwany z bazy danych.

## 8. Interakcje użytkownika

### Przepływ 1: Wyświetlanie szczegółów przepisu

1. Użytkownik klika na przepis w liście przepisów
2. Strona `/recipes/[id]` jest ładowana
3. Server-side: Astro fetchuje przepis z bazy danych
4. Server-side: Sprawdza czy użytkownik jest właścicielem przepisu
5. Jeśli tak: Renderuje `RecipeDetailContent` z danymi przepisu
6. Jeśli nie: Zwraca 403 Forbidden i redirect do `/recipes`
7. Komponent wyświetla tytuł, metadata oraz sekcje (summary, ingredients, preparation) w Accordion
8. Przyciski akcji (Edycja, Usuń) są widoczne na dole strony

### Przepływ 2: Edycja przepisu (PUT - pełna wymiana)

1. Użytkownik klika przycisk "Edytuj"
2. `RecipeActions` wywołuje callback `onEdit`
3. `RecipeDetailContent` ustawia `isEditDialogOpen = true`
4. Modal `EditRecipeDialog` jest otwierany z wypełnionymi danymi przepisu
5. Użytkownik modyfikuje dane w formularzu
6. Walidacja po stronie frontendu (react-hook-form + Zod) sprawdza poprawność danych w czasie rzeczywistym
7. Użytkownik klika "Zapisz"
8. Frontend waliduje wszystkie pola według `RecipeUpdateInputSchema`
9. Jeśli walidacja przechodzi: Wywołuje PUT request do `/api/recipes/:id`
10. Jeśli request udany (200):
    - Modal jest zamykany
    - Dane przepisu są odświeżane poprzez GET request
    - Toast notification "Przepis został zaktualizowany"
11. Jeśli request nieudany:
    - Wyświetla komunikat błędu pod odpowiednim polem lub globalnie
    - Toast notification z komunikatem błędu

### Przepływ 3: Edycja przepisu (PATCH - częściowa)

1. Użytkownik klika przycisk "Edytuj"
2. Modal się otwiera
3. Użytkownik modyfikuje tylko wybrane pola (np. tytuł)
4. Użytkownik klika "Zapisz"
5. Frontend waliduje wypełnione pola według `RecipePartialUpdateInputSchema`
6. Frontend sprawdza czy przynajmniej jedno pole jest wypełnione
7. Wywołuje PATCH request do `/api/recipes/:id` z tylko zmodyfikowanymi polami
8. Reszta jak w Przepływie 2

### Przepływ 4: Usunięcie przepisu

1. Użytkownik klika przycisk "Usuń"
2. `RecipeActions` wywołuje callback `onDelete`
3. `RecipeDetailContent` ustawia `isDeleteDialogOpen = true`
4. Modal `DeleteRecipeDialog` jest otwierany z informacją o konsekwencjach
5. Użytkownik potwierdza lub anuluje:
   - **Anulowanie**: Modal jest zamykany, przepis pozostaje nietknięty
   - **Potwierdzenie**: Wywołuje DELETE request do `/api/recipes/:id`
6. Jeśli request udany (204):
   - Modal jest zamykany
   - Redirect do `/recipes` (lista przepisów)
   - Toast notification "Przepis został usunięty"
7. Jeśli request nieudany:
   - Komunikat błędu jest wyświetlany w modalu
   - Toast notification z komunikatem błędu
   - Przepis pozostaje nietknięty

### Przepływ 5: Obsługa błędów ładowania

1. Strona `/recipes/[id]` jest ładowana z nieistniejącym ID lub przepisem użytkownika innego użytkownika
2. Server-side zwraca 404 lub 403
3. Astro redirectuje do `/recipes` z komunikatem błędu
4. Alternatywnie (client-side error): Komponent wyświetla komunikat błędu z przyciskiem "Wróć do listy"

## 9. Warunki i walidacja

### Walidacja na poziomie API

**GET request - Sprawdzenie uprawnień**:

- Sprawdzenie czy użytkownik jest zalogowany (sesja cookie)
- Sprawdzenie czy przepis istnieje i nie jest usunięty (deleted_at IS NULL)
- Sprawdzenie czy `owner_id` przepisu zgadza się z `user.id` z sesji
- Jeśli nie: 403 Forbidden lub 404 Not Found

**PUT/PATCH requests - Walidacja danych**:

- Walidacja UUID w parametrze ścieżki
- Walidacja JSON body
- Walidacja pól według odpowiedniego schematu (RecipeUpdateInputSchema lub RecipePartialUpdateInputSchema)
- Przynajmniej jedno pole dla PATCH
- Wszystkie pola wymagane dla PUT
- Sprawdzenie uprawnień (ownership)

**DELETE request - Walidacja uprawnień**:

- Walidacja UUID
- Sprawdzenie czy przepis istnieje
- Sprawdzenie ownership
- Wykonanie soft delete (UPDATE deleted_at)

### Walidacja na poziomie komponentów (frontend)

**RecipeDetailContent**:

- Sprawdzenie czy przepis jest dostępny (`recipe !== null`)
- Wyświetlanie komunikatu błędu jeśli ładowanie nie powiodło się
- Wyświetlanie skeleton loadera podczas ładowania

**EditRecipeDialog**:

- Walidacja title: min 1, max 200 znaków, wymagane dla PUT
- Walidacja summary: max 500 znaków, opcjonalne
- Walidacja ingredients: min 10, max 5000 znaków, wymagane dla PUT
- Walidacja preparation: min 10, max 10000 znaków, wymagane dla PUT
- Dla PATCH: przynajmniej jedno pole musi być wypełnione
- Wyświetlanie błędów walidacji pod odpowiednimi polami
- Blokowanie przycisku "Zapisz" jeśli formularz nie jest valid

**DeleteRecipeDialog**:

- Upewnienie się że użytkownik potwierdził akcję (double confirmation)
- Wyświetlanie nazwy przepisu w opisie

### Wpływ warunków na stan interfejsu

**Warunek: Przepis nie istnieje (404)**:

- Przepływ: Redirect do `/recipes` lub wyświetlenie komunikatu błędu w UI
- Stan: `error !== null` w RecipeDetailContent
- UI: Komunikat błędu + przycisk "Wróć do listy"

**Warunek: Brak uprawnień (403)**:

- Przepływ: Redirect do `/recipes` lub wyświetlenie komunikatu błędu
- Stan: `error !== null` z komunikatem "Nie masz uprawnień do tego przepisu"
- UI: Komunikat błędu + przycisk "Wróć do listy"

**Warunek: Błąd walidacji formularza (400)**:

- Przepływ: Wyświetlenie komunikatów błędów pod odpowiednimi polami
- Stan: `formState.errors` w react-hook-form
- UI: Czerwone ramki wokół pól z błędami, komunikaty błędów pod polami

**Warunek: Przepis jest w trakcie edycji/ładowania**:

- Stan: `isLoading === true`
- UI: Wskaźnik ładowania (skeleton loader lub spinner)

**Warunek: Przepis nie ma summary (opcjonalne pole)**:

- Stan: `recipe.summary === null || recipe.summary === undefined`
- UI: Sekcja Accordion dla summary nie jest wyświetlana (lub wyświetlana jako "Brak podsumowania")

## 10. Obsługa błędów

### Scenariusz 1: Przepis nie istnieje (404)

**Kiedy wystąpi**: GET `/api/recipes/:id` zwraca 404

**Obsługa**:

```typescript
const errorResponse: ApiError = {
  error: "Recipe not found",
  message: "Recipe does not exist or has been deleted",
};
```

**Frontend**:

- Server-side (Astro): Redirect do `/recipes` z query parameter `error=not_found`
- Client-side (React): Wyświetlenie komunikatu "Przepis nie został znaleziony" z przyciskiem "Wróć do listy"

**UI**:

```typescript
<div className="text-center py-12">
  <p className="text-lg text-destructive">Przepis nie został znaleziony</p>
  <p className="text-muted-foreground">Ten przepis nie istnieje lub został usunięty</p>
  <Button onClick={() => window.location.href = "/recipes"}>
    Wróć do listy przepisów
  </Button>
</div>
```

### Scenariusz 2: Brak uprawnień (403)

**Kiedy wystąpi**: Użytkownik próbuje otworzyć przepis innego użytkownika

**Obsługa**:

```typescript
const errorResponse: ApiError = {
  error: "Access denied",
  message: "You do not have permission to access this recipe",
};
```

**Frontend**:

- Server-side: Redirect do `/recipes` z query parameter `error=access_denied`
- Client-side: Wyświetlenie komunikatu "Brak uprawnień"

**UI**:

```typescript
<div className="text-center py-12">
  <p className="text-lg text-destructive">Brak uprawnień</p>
  <p className="text-muted-foreground">Nie masz uprawnień do tego przepisu</p>
  <Button onClick={() => window.location.href = "/recipes"}>
    Wróć do listy przepisów
  </Button>
</div>
```

### Scenariusz 3: Błąd serwera (500)

**Kiedy wystąpi**: Wewnętrzny błąd serwera podczas pobierania/edycji/usuwania przepisu

**Obsługa**:

```typescript
const errorResponse: ApiError = {
  error: "Internal server error",
  message: "Failed to process request. Please try again later.",
};
```

**Frontend**:

- Wyświetlenie komunikatu błędu w Toast notification
- Logowanie błędu do konsoli dla developmentu
- Przycisk "Spróbuj ponownie" dla pobierania przepisu

### Scenariusz 4: Błąd walidacji formularza (400)

**Kiedy wystąpi**: PUT/PATCH request z niepoprawnymi danymi

**Obsługa**:

```typescript
const errorResponse: ApiError = {
  error: "Validation failed",
  message: "title must be at most 200 characters",
  details: {
    fields: [{ path: ["title"], message: "title must be at most 200 characters" }],
  },
};
```

**Frontend**:

- Użycie `setError` z react-hook-form do przypisania błędu do odpowiedniego pola
- Wyświetlenie komunikatu błędu pod polem
- Toast notification "Sprawdź błędy walidacji w formularzu"

### Scenariusz 5: Przepis został już usunięty (404 przy DELETE)

**Kiedy wystąpi**: DELETE request dla przepisu który został już usunięty

**Obsługa**:

```typescript
const errorResponse: ApiError = {
  error: "Recipe not found",
  message: "Recipe does not exist or has already been deleted",
};
```

**Frontend**:

- Wyświetlenie komunikatu w modalu DeleteRecipeDialog
- Automatyczne zamknięcie modala
- Redirect do `/recipes` (przepis już nie istnieje)

### Scenariusz 6: Problem z połączeniem sieciowym

**Kiedy wystąpi**: Fetch request nie może połączyć się z serwerem

**Obsługa**:

- Wyświetlenie komunikatu "Brak połączenia z serwerem"
- Toast notification z opcją ponowienia (retry)
- Utrzymanie stanu aplikacji (nie resetowanie formularza)

**UI**:

```typescript
<div className="p-4 bg-destructive/10 text-destructive">
  <p>Nie udało się połączyć z serwerem</p>
  <Button onClick={fetchRecipe}>Spróbuj ponownie</Button>
</div>
```

## 11. Kroki implementacji

### Krok 1: Dodanie komponentu Accordion z shadcn/ui

```bash
npx shadcn@latest add accordion
```

Powinien zostać utworzony plik `src/components/ui/accordion.tsx`.

### Krok 2: Utworzenie komponentu RecipeHeader

**Plik**: `src/components/recipes/RecipeHeader.tsx`

- Import z lucide-react (calendar icon)
- Wyświetlanie tytułu przepisu
- Wyświetlanie dat utworzenia i ostatniej edycji
- Formatowanie dat z użyciem `formatDate`

### Krok 3: Utworzenie komponentu RecipeAccordionSection

**Plik**: `src/components/recipes/RecipeAccordionSection.tsx`

- Utilizacja Accordion z shadcn/ui
- Przyjmowanie props: title, content, defaultOpen
- Formatowanie tekstu z użyciem `pre-wrap` dla zachowania struktury

### Krok 4: Utworzenie komponentu RecipeActions

**Plik**: `src/components/recipes/RecipeActions.tsx`

- Przycisk "Edytuj" z ikoną Edit
- Przycisk "Usuń" z ikoną Trash (variant destructive)
- Funkcje callback: onEdit, onDelete

### Krok 5: Utworzenie komponentu EditRecipeDialog

**Plik**: `src/components/recipes/EditRecipeDialog.tsx`

- Utilizacja Dialog z shadcn/ui
- Formularz z react-hook-form
- Pola: title (Input), summary (Textarea), ingredients (Textarea), preparation (Textarea)
- Walidacja z użyciem RecipeUpdateInputSchema dla PUT lub RecipePartialUpdateInputSchema dla PATCH
- Przyciski: "Zapisz" (z ładowaniem), "Anuluj"
- Obsługa błędów API
- Wyświetlanie komunikatów błędów walidacji

### Krok 6: Utworzenie komponentu DeleteRecipeDialog

**Plik**: `src/components/recipes/DeleteRecipeDialog.tsx`

- Utilizacja AlertDialog z shadcn/ui
- Tytuł: "Czy na pewno chcesz usunąć ten przepis?"
- Opis z nazwą przepisu
- Przyciski: "Anuluj", "Usuń"
- Wskaźnik ładowania podczas operacji usuwania

### Krok 7: Utworzenie komponentu RecipeDetailContent

**Plik**: `src/components/recipes/RecipeDetailContent.tsx`

- Zarządzanie stanem: recipe, isLoading, error, isEditDialogOpen, isDeleteDialogOpen
- Funkcja fetchRecipe() do pobierania przepisu
- Funkcja handleEdit() do otwierania modala
- Funkcja handleDelete() do otwierania modala potwierdzenia
- Funkcja handleUpdateSuccess() do odświeżania danych po edycji
- Funkcja handleDeleteConfirm() do wywołania DELETE API
- Wyświetlanie stanów: loading (skeleton), error, success (zawartość)
- Renderowanie RecipeHeader, RecipeAccordionSection, RecipeActions

### Krok 8: Utworzenie strony Astro

**Plik**: `src/pages/recipes/[id].astro`

- Utilizacja AuthLayout
- Import z `createServerSupabaseClient` i `getRecipeById`
- Sprawdzenie sesji użytkownika
- Fetch przepisu z bazy danych
- Przekazanie danych do RecipeDetailContent
- Obsługa błędów (404, 403) poprzez redirect

### Krok 9: Testowanie

**Test 1: Wyświetlanie szczegółów przepisu**

- Sprawdzenie czy wszystkie sekcje są wyświetlane poprawnie
- Sprawdzenie formatowania dat
- Sprawdzenie Accordion (expand/collapse)

**Test 2: Edycja przepisu (PUT)**

- Sprawdzenie czy modal się otwiera
- Sprawdzenie czy dane są wypełnione
- Sprawdzenie walidacji (tytuł za długi, ingredients za krótkie, itp.)
- Sprawdzenie czy sukces odświeża dane
- Sprawdzenie obsługi błędów API

**Test 3: Częściowa edycja przepisu (PATCH)**

- Sprawdzenie czy można edytować tylko część pól
- Sprawdzenie walidacji (przynajmniej jedno pole)

**Test 4: Usunięcie przepisu**

- Sprawdzenie czy modal się otwiera
- Sprawdzenie czy przepis jest usuwany
- Sprawdzenie redirect do `/recipes`
- Sprawdzenie czy przepis znika z listy

**Test 5: Obsługa błędów**

- Sprawdzenie 404 (nieistniejące ID)
- Sprawdzenie 403 (przepis innego użytkownika)
- Sprawdzenie 500 (błąd serwera)
- Sprawdzenie błędu połączenia sieciowego

### Krok 10: Dostosowanie linków w innych komponentach

Aktualizacja linków do widoku szczegółów w:

- `src/components/dashboard/card/RecipeCard.tsx`
- `src/components/recipes/RecipesTable.tsx`

Zmiana:

```typescript
onView={() => window.location.href = `/recipes/${recipe.id}`}
```

### Krok 11: Dostosowanie walidacji i wyświetlania błędów

Zapewnienie spójności komunikatów błędów w całej aplikacji:

- Komunikaty po polsku
- Toast notifications dla wszystkich akcji użytkownika
- Komunikaty błędów w modalu odpowiednie dla kontekstu

### Krok 12: Dostosowanie dostępności (a11y)

- Dodanie aria-labels do przycisków
- Dodanie aria-expanded do Accordion
- Dodanie focus trap do modali
- Zapewnienie obsługi klawiatury (ESC do zamknięcia modali, Enter do potwierdzenia)
- Napisy dla czytników ekranowych
