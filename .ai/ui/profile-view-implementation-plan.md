# Plan implementacji widoku Profil

## 1. Przegląd

Widok Profil (`/profile`) umożliwia przegląd i edycję preferencji żywieniowych użytkownika. Zgodnie z PRD, dostęp do widoku odbywa się przez kliknięcie ikony avatara w prawym górnym rogu nawigacji i wybranie opcji "Konto" z rozwijanego menu. Widok prezentuje aktualne preferencje w trybie read-only oraz umożliwia ich edycję w dedykowanym modalu edycyjnym.

Kluczowe funkcjonalności:
- Wyświetlanie aktualnych preferencji w formie kart
- Pokazanie daty ostatniej modyfikacji
- Edycja preferencji w modalu dialogowym
- Walidacja danych zgodnie z API
- Optymistyczne aktualizacje z rollbackiem przy błędach
- Wyświetlanie powiadomień (snackbar) dla sukcesów i błędów

## 2. Routing widoku

**Ścieżka**: `/profile`

**Middleware**: Widok wymaga autentykacji użytkownika, ale nie wymaga onboardingu (użytkownik może mieć preferencje już zapisane lub nie). Jeśli użytkownik nie jest zalogowany, middleware powinien przekierować do `/login`.

**Layout**: Widok korzysta z `AuthLayout` (zawiera nawigację z logo, imieniem użytkownika i przyciskami wylogowania).

**Nawigacja**: Dostęp z nawigacji głównej przez dropdown menu użytkownika (ikona avatara → "Konto").

## 3. Struktura komponentów

Widok składa się z następujących komponentów:

```
ProfileView
├── ProfileContent (główny kontener)
    ├── ProfileHeader (tytuł i przycisk edycji)
    ├── ProfileInfo (karty z informacjami o preferencjach)
    │   ├── DietTypeCard
    │   ├── PreferredIngredientsCard
    │   ├── PreferredCuisinesCard
    │   ├── AllergensCard
    │   └── NotesCard
    ├── LastModifiedDate (data ostatniej modyfikacji)
    └── EditPreferencesDialog (modal edycji)
        ├── EditPreferencesForm
        │   ├── DietTypeField (Select)
        │   ├── PreferredIngredientsField (Textarea)
        │   ├── PreferredCuisinesField (Textarea)
        │   ├── AllergensField (Textarea)
        │   └── NotesField (Textarea)
        └── FormActions (Zapisz / Anuluj)
```

**Hierarchia**:
- Komponent główny: `ProfileView` (renderowany w `src/pages/profile.astro`)
- Komponent kontenerowy: `ProfileContent` (przyjmuje preferencje i token)
- Komponenty prezentacyjne: `ProfileHeader`, `ProfileInfo` (z kartami)
- Komponenty formularza: `EditPreferencesDialog` z `EditPreferencesForm`
- Komponenty pomocnicze: `DietTypeCard`, `PreferredIngredientsCard`, itd.

## 4. Szczegóły komponentów

### ProfileContent

**Opis**: Główny komponent widoku profilu, zarządza stanem preferencji i otwieraniem modala edycji. Wyświetla preferencje w trybie read-only oraz obsługuje edycję.

**Główne elementy**:
- Div kontener z `max-w-4xl mx-auto p-6`
- ProfileHeader
- ProfileInfo z kartami preferencji
- LastModifiedDate
- EditPreferencesDialog (kondycyjnie renderowany)
- Loading state (skeleton loader podczas pobierania danych)
- Error state (komunikat błędu z przyciskiem retry)
- Empty state (brak preferencji → redirect do /onboarding lub komunikat)

**Obsługiwane interakcje**:
1. Przed aktualizacja danych → Pobiera preferencje z API przy montowaniu komponentu
2. Kliknięcie "Edytuj" → Otwiera modal dialogowy
3. Zapisz w modalu → PATCH do API → Zamknięcie modala → Odświeżenie danych
4. Anuluj w modalu → Zamknięcie bez zapisywania
5. Kliknięcie "Odśwież" (jeśli błąd) → Ponowne pobranie danych

**Obsługiwana walidacja**: Brak bezpośredniej walidacji w tym komponencie (logika w EditPreferencesDialog)

**Typy**:
- `UserPreferences` - typ preferencji z API
- Props: `initialPreferences?: UserPreferences | null`, `accessToken: string`, `userName: string`

**Props**:
```typescript
interface ProfileContentProps {
  readonly initialPreferences: UserPreferences | null;
  readonly accessToken: string;
  readonly userName: string;
}
```

### ProfileHeader

**Opis**: Nagłówek widoku z tytułem i przyciskiem edycji.

**Główne elementy**:
- Tytuł: "Profil użytkownika" lub "Moje preferencje"
- Przycisk "Edytuj" (Button) z ikoną Edit (lucide-react)
- Opcjonalnie: Podtytuł z imieniem użytkownika

**Obsługiwane interakcje**:
1. Kliknięcie "Edytuj" → Wywołuje callback `onEdit` przekazany przez parenta

**Obsługiwana walidacja**: Brak

**Typy**: Brak

**Props**:
```typescript
interface ProfileHeaderProps {
  onEdit: () => void;
  userName: string;
}
```

### ProfileInfo

**Opis**: Sekcja z kartami preferencji wyświetlanych w trybie read-only.

**Główne elementy**:
- Grid layout (grid-cols-1 md:grid-cols-2 gap-4)
- Karty preferencji dla każdej kategorii:
  - DietTypeCard
  - PreferredIngredientsCard
  - PreferredCuisinesCard
  - AllergensCard
  - NotesCard
- Każda karta zawiera: tytuł, wartość (lub "Nie podano" jeśli puste), ikonę opcjonalnie

**Obsługiwane interakcje**: Brak (tylko prezentacja)

**Obsługiwana walidacja**: Brak

**Typy**:
- Wykorzystuje `UserPreferences` do wyświetlenia danych

**Props**:
```typescript
interface ProfileInfoProps {
  preferences: UserPreferences;
}
```

### DietTypeCard, PreferredIngredientsCard, PreferredCuisinesCard, AllergensCard, NotesCard

**Opis**: Karty wyświetlające poszczególne kategorie preferencji.

**Główne elementy** (dla każdej karty):
- Shadcn Card komponent
- Tytuł karty (np. "Typ diety")
- Wartość lub fallback text ("Nie podano")
- Opcjonalnie ikona reprezentująca kategorię

**Obsługiwane interakcje**: Brak

**Obsługiwana walidacja**: Brak

**Typy**: Wykorzystują pola z `UserPreferences`

**Props** (dla każdej karty):
```typescript
interface PreferenceCardProps {
  label: string;
  value: string | null | undefined;
  icon?: ReactNode;
}
```

### LastModifiedDate

**Opis**: Komponent wyświetlający datę ostatniej modyfikacji preferencji.

**Główne elementy**:
- Text z ikoną Calendar (lucide-react)
- Sformatowana data (np. "Ostatnia modyfikacja: 12 stycznia 2025")

**Obsługiwane interakcje**: Brak

**Obsługiwana walidacja**: Brak

**Typy**: Wykorzystuje `updated_at` z `UserPreferences`

**Props**:
```typescript
interface LastModifiedDateProps {
  updatedAt: string;
}
```

### EditPreferencesDialog

**Opis**: Modal dialogowy do edycji preferencji z pełnym formularzem.

**Główne elementy**:
- Shadcn Dialog z overlay
- DialogHeader (tytuł i opis)
- EditPreferencesForm w środku
- DialogFooter z przyciskami akcji

**Obsługiwane interakcje**:
1. Zamknięcie przez backdrop → Wywołuje `onOpenChange(false)`
2. Zamknięcie przez Esc → Wywołuje `onOpenChange(false)`
3. Kliknięcie "Zapisz" → Walidacja → PUT/PATCH do API → Zamknięcie przy sukcesie
4. Kliknięcie "Anuluj" → Zamknięcie bez zapisywania

**Obsługiwana walidacja**: Pełna walidacja zgodnie z `PreferencesInputSchema` lub `PreferencesPartialInputSchema`

**Typy**:
- `PreferencesInput` dla pełnej edycji (PUT)
- `PreferencesPartialUpdateInput` dla częściowej edycji (PATCH)

**Props**:
```typescript
interface EditPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: UserPreferences | null;
  onSuccess: () => void;
}
```

### EditPreferencesForm

**Opis**: Formularz edycji preferencji z polami dla wszystkich kategorii.

**Główne elementy**:
- react-hook-form z walidacją Zod
- DietTypeField (Select z opcjami)
- PreferredIngredientsField (Textarea, opcjonalne)
- PreferredCuisinesField (Textarea, opcjonalne)
- AllergensField (Textarea, opcjonalne)
- NotesField (Textarea, opcjonalne)
- Przycisk "Zapisz" z wskaźnikiem ładowania
- Przycisk "Anuluj"

**Obsługiwane interakcje**:
1. Zmiana wartości pól → Walidacja w czasie rzeczywistym
2. Wysłanie formularza → PUT/PATCH request do API
3. Sukces → Wywołanie `onSuccess`, wyświetlenie toast
4. Błąd → Wyświetlenie komunikatu błędu pod odpowiednim polem lub ogólny komunikat
5. Anulowanie → Reset formularza i zamknięcie

**Obsługiwana walidacja**:
- **diet_type**: Wymagane, min 1 znak, max 50 znaków
- **preferred_ingredients**: Opcjonalne, max 1000 znaków
- **preferred_cuisines**: Opcjonalne, max 500 znaków
- **allergens**: Opcjonalne, max 500 znaków
- **notes**: Opcjonalne, max 2000 znaków
- Dla PATCH: przynajmniej jedno pole musi być wypełnione

**Typy**:
- `PreferencesInput` - dla pełnej edycji
- `PreferencesPartialUpdateInput` - dla częściowej edycji
- Wykorzystuje `UseFormReturn<PreferencesInput | PreferencesPartialUpdateInput>`

**Props**: Brak (props odziedziczone z Dialog)

## 5. Typy

### Istniejące typy (z `src/types.ts`):

**UserPreferences** (z database.types):
```typescript
{
  user_id: string;
  diet_type: string;
  preferred_ingredients: string | null;
  preferred_cuisines: string | null;
  allergens: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

**PreferencesInput** (z `src/components/onboarding/types.ts`):
```typescript
{
  diet_type: string;
  preferred_ingredients?: string;
  preferred_cuisines?: string;
  allergens?: string;
  notes?: string;
}
```

**PreferencesUpdateInput** = PreferencesInput
**PreferencesPartialUpdateInput** = Partial<PreferencesInput>

### Nowe typy (do utworzenia):

**ProfileViewProps** (dla strony Astro):
```typescript
interface ProfileViewProps {
  preferences: UserPreferences | null;
  accessToken: string;
  userName: string;
  userEmail: string;
}
```

**EditPreferencesDialogFormData**:
```typescript
interface EditPreferencesDialogFormData {
  diet_type: string;
  preferred_ingredients: string;
  preferred_cuisines: string;
  allergens: string;
  notes: string;
}
```

Ten typ jest aliasem do pełnej wersji `PreferencesInput` z domyślnymi wartościami dla pól opcjonalnych.

## 6. Zarządzanie stanem

### Stan w ProfileContent:

```typescript
const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
```

### Operacje stanu:

1. **refreshPreferences()**: Funkcja do ponownego pobrania preferencji z API
```typescript
const refreshPreferences = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await fetch("/api/preferences", {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch preferences");
    const data = await response.json();
    setPreferences(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setIsLoading(false);
  }
};
```

2. **handleEditSuccess()**: Callback po sukcesie edycji, odświeża dane i zamyka modal
```typescript
const handleEditSuccess = () => {
  refreshPreferences();
  setIsEditDialogOpen(false);
};
```

3. **handleEdit()**: Otwiera modal edycji
```typescript
const handleEdit = () => {
  setIsEditDialogOpen(true);
};
```

### Niestandardowe hooki:

**useProfile** (opcjonalnie, do abstrakcji logiki):
```typescript
interface UseProfileReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  refreshPreferences: () => Promise<void>;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
}
```

Jeśli logika stanie się zbyt skomplikowana, można wyodrębnić ją do hooka `useProfile.ts`.

## 7. Integracja API

### GET /api/preferences

**Cel**: Pobranie aktualnych preferencji użytkownika

**Typ żądania**: GET (bez body)

**Typ odpowiedzi**:
- 200 OK: `UserPreferences`
- 404 Not Found: `ApiError` (preferencje nie istnieją)
- 500 Internal Server Error: `ApiError`

**Wywołanie**: Przy montowaniu komponentu lub przy odświeżaniu (`refreshPreferences`)

**Obsługa błędów**:
- 404 → Pusta strona z komunikatem "Uzupełnij preferencje" + przycisk do `/onboarding`
- 500 → Toast error + przycisk retry
- Network error → Toast error + przycisk retry

### PUT /api/preferences

**Cel**: Pełna aktualizacja preferencji (full replacement)

**Typ żądania**: PUT z JSON body (`PreferencesInput`)

**Typ odpowiedzi**:
- 200 OK: `UserPreferences` (zaktualizowane dane)
- 400 Bad Request: `ApiError` (błąd walidacji)
- 401 Unauthorized: `ApiError` (niezalogowany)
- 500 Internal Server Error: `ApiError`

**Wywołanie**: W `EditPreferencesForm` przy submit pełnej edycji

**Obsługa błędów**:
- 400 → Wyświetlenie błędów walidacji pod polami
- 401 → Toast "Sesja wygasła" + redirect do `/login`
- 500 → Toast "Błąd serwera" + możliwość retry

### PATCH /api/preferences

**Cel**: Częściowa aktualizacja preferencji (partial update)

**Typ żądania**: PATCH z JSON body (`PreferencesPartialUpdateInput`)

**Typ odpowiedzi**:
- 200 OK: `UserPreferences` (zaktualizowane dane)
- 400 Bad Request: `ApiError` (błąd walidacji)
- 404 Not Found: `ApiError` (preferencje nie istnieją)
- 401 Unauthorized: `ApiError` (niezalogowany)
- 500 Internal Server Error: `ApiError`

**Wywołanie**: W `EditPreferencesForm` przy submit częściowej edycji

**Obsługa błędów**: Identyczna jak dla PUT

## 8. Interakcje użytkownika

### Przepływ główny - Przegląd profilu:

1. **Użytkownik otwiera `/profile`**:
   - System sprawdza autentykację (middleware)
   - Pobiera preferencje z API (GET /api/preferences)
   - Jeśli 404 → Pokazuje pustą stronę z przyciskiem do onboardingu
   - Jeśli sukces → Wyświetla karty z preferencjami

2. **Użytkownik przegląda preferencje**:
   - Widzi 5 kart z informacjami
   - Widzi datę ostatniej modyfikacji
   - Widzi przycisk "Edytuj"

### Przepływ edycji:

1. **Użytkownik klika "Edytuj"**:
   - Otwiera się modal z formularzem
   - Formularz wypełniony aktualnymi wartościami

2. **Użytkownik modyfikuje pola**:
   - Zmiana w Select (diet_type) → Natychmiastowa walidacja
   - Zmiana w Textarea → Natychmiastowa walidacja
   - Błędy wyświetlane pod polami w czasie rzeczywistym

3. **Użytkownik klika "Zapisz"**:
   - Walidacja wszystkich pól
   - Jeśli błędy → Wyświetlenie komunikatów
   - Jeśli OK → Wskaźnik ładowania na przycisku
   - Wysłanie PATCH /api/preferences
   - Sukces → Toast "Preferencje zaktualizowane", zamknięcie modala, odświeżenie danych
   - Błąd → Toast z komunikatem błędu, wyświetlenie błędów pod polami

4. **Użytkownik klika "Anuluj"**:
   - Reset formularza do początkowych wartości
   - Zamknięcie modala bez zapisywania

### Przepływ obsługi błędów:

1. **Błąd podczas pobierania preferencji**:
   - Toast z komunikatem błędem
   - Przycisk "Spróbuj ponownie"

2. **Błąd walidacji podczas edycji**:
   - Błędy wyświetlane pod polami
   - Toast z ogólnym komunikatem

3. **Błąd sieciowy podczas zapisywania**:
   - Toast "Brak połączenia z internetem"
   - Możliwość retry w modalu

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs:

**Frontend walidacja (w EditPreferencesForm)**:

1. **diet_type**:
   - Wymagane (nie może być pusty string)
   - Min 1 znak
   - Max 50 znaków
   - Sprawdzane przez react-hook-form + zod resolver
   - Komponent: DietTypeField (Select)
   - Błąd wyświetlany pod polem

2. **preferred_ingredients**:
   - Opcjonalne (może być puste)
   - Max 1000 znaków
   - Komponent: PreferredIngredientsField (Textarea)
   - Błąd wyświetlany pod polem

3. **preferred_cuisines**:
   - Opcjonalne (może być puste)
   - Max 500 znaków
   - Komponent: PreferredCuisinesField (Textarea)
   - Błąd wyświetlany pod polem

4. **allergens**:
   - Opcjonalne (może być puste)
   - Max 500 znaków
   - Komponent: AllergensField (Textarea)
   - Błąd wyświetlany pod polem

5. **notes**:
   - Opcjonalne (może być puste)
   - Max 2000 znaków
   - Komponent: NotesField (Textarea)
   - Błąd wyświetlany pod polem

**Wpływ walidacji na UI**:

- Przy błędach: Pola podświetlone na czerwono, komentarze błędów pod polami, przycisk "Zapisz" disabled (lub nie - zależnie od strategii)
- Przed zapisaniem: Walidacja całego formularza, jeśli błędy → blokada submita
- Podczas submit: Wskaźnik ładowania, przycisk disabled
- Po sukcesie: Toast, zamknięcie modala, odświeżenie danych

### Backend walidacja (API):

API wykonuje dokładnie taką samą walidację co frontend (identyczne schematy Zod). W przypadku rozbieżności (błąd 400), frontend wyświetla komunikat z backendu.

## 10. Obsługa błędów

### Scenariusze błędów i obsługa:

#### 1. Preferencje nie istnieją (404 GET /api/preferences):

**Przyczyna**: Użytkownik nie uzupełnił onboardingu lub preferencje zostały usunięte.

**Obsługa**:
- Pusta strona z komunikatem: "Nie skonfigurowałeś jeszcze swoich preferencji"
- Przycisk CTA: "Uzupełnij preferencje" (przekierowuje do `/onboarding`)

**Komponent**: EmptyProfileState (analogiczny do EmptyState)

#### 2. Błąd sieciowy podczas pobierania:

**Przyczyna**: Brak połączenia z internetem lub serwer niedostępny.

**Obsługa**:
- Toast: "Nie można połączyć się z serwerem"
- Przycisk "Spróbuj ponownie" w ProfileContent
- Przycisk retry wywołuje `refreshPreferences()`

#### 3. Błąd walidacji podczas edycji (400 PUT/PATCH):

**Przyczyna**: Dane nie spełniają warunków walidacji.

**Obsługa**:
- Błędy walidacji wyświetlane pod odpowiednimi polami
- Toast z ogólnym komunikatem: "Sprawdź błędy w formularzu"
- Stosujemy logic rollback (formularz pozostaje otwarty)

#### 4. Sesja wygasła (401 PUT/PATCH):

**Przyczyna**: Token autentykacji wygasł.

**Obsługa**:
- Toast: "Twoja sesja wygasła"
- Automatyczny redirect do `/login`

#### 5. Błąd serwera (500):

**Przyczyna**: Błąd po stronie serwera.

**Obsługa**:
- Toast: "Błąd serwera. Spróbuj ponownie później"
- Modal pozostaje otwarty z danymi użytkownika (brak rollback)
- Możliwość retry

#### 6. Brak zmian do zapisania:

**Przyczyna**: Użytkownik otworzył modal, ale nie wprowadził żadnych zmian lub cofnął zmiany.

**Obsługa**:
- Przycisk "Zapisz" może być disabled jeśli nie ma zmian
- Lub po prostu nie wysyłamy requesta (nie ma zmian)

### Optymistyczne aktualizacje:

**Strategia**: NIE stosujemy optymistycznych aktualizacji dla edycji preferencji, ponieważ:
1. Zmiany są stosunkowo rzadkie
2. Nie ma ryzyka konfliktów (tylko jeden użytkownik edytuje swoje preferencje)
3. Preferencje są krytycznymi danymi (wpływają na generowanie przepisów)

**Rollback**: Nie jest potrzebny, ponieważ nie modyfikujemy UI przed sukcesem API.

### Error boundary:

W przyszłości można dodać Error Boundary dla nieoczekiwanych błędów React, ale nie jest to wymagane dla MVP.

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Działania**:
1. Utwórz folder `src/components/profile/` (jeśli nie istnieje)
2. Utwórz następujące pliki:
   - `ProfileContent.tsx` (główny komponent)
   - `ProfileHeader.tsx`
   - `ProfileInfo.tsx`
   - `DietTypeCard.tsx`
   - `PreferredIngredientsCard.tsx`
   - `PreferredCuisinesCard.tsx`
   - `AllergensCard.tsx`
   - `NotesCard.tsx`
   - `LastModifiedDate.tsx`
   - `EditPreferencesDialog.tsx`
   - `EditPreferencesForm.tsx`

### Krok 2: Implementacja komponentów kart (prezentacyjne)

**Działania**:
1. Zaimplementuj `DietTypeCard`, `PreferredIngredientsCard`, `PreferredCuisinesCard`, `AllergensCard`, `NotesCard`
2. Każda karta to prosty komponent przyjmujący `label` i `value`
3. Użyj Shadcn Card component
4. Dodaj ikony z lucide-react dla każdej kategorii
5. Fallback text: "Nie podano" gdy wartość jest null/undefined/pusta

**Pliki do utworzenia**:
- `src/components/profile/DietTypeCard.tsx` i pozostałe karty

### Krok 3: Implementacja komponentów nagłówka i daty

**Działania**:
1. Zaimplementuj `ProfileHeader` z przyciskiem edycji
2. Zaimplementuj `LastModifiedDate` z formatowaniem daty
3. Użyj komponentów Button i lucide-react icons

**Pliki do utworzenia**:
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/LastModifiedDate.tsx`

### Krok 4: Implementacja ProfileInfo

**Działania**:
1. Stwórz grid layout dla kart preferencji
2. Użyj mapowania preferencji do komponentów kart
3. Layout responsywny (grid-cols-1 md:grid-cols-2)

**Pliki do utworzenia**:
- `src/components/profile/ProfileInfo.tsx`

### Krok 5: Implementacja EditPreferencesDialog

**Działania**:
1. Stwórz modal z Shadcn Dialog
2. Dodaj DialogHeader, DialogContent, DialogFooter
3. Implementuj logikę otwierania/zamykania
4. Dodaj prop `onSuccess` callback
5. Przygotuj miejsce dla formularza (następny krok)

**Pliki do utworzenia**:
- `src/components/profile/EditPreferencesDialog.tsx`

### Krok 6: Implementacja EditPreferencesForm

**Działania**:
1. Zainicjalizuj react-hook-form z `useForm`
2. Dodaj resolver `zodResolver` z `PreferencesPartialInputSchema`
3. Utwórz pola formularza:
   - DietTypeField: Select z opcjami (użyj listy z DietTypeStep)
   - PreferredIngredientsField: Textarea
   - PreferredCuisinesField: Textarea
   - AllergensField: Textarea
   - NotesField: Textarea
4. Dodaj wyświetlanie błędów pod polami
5. Implementuj onSubmit z wywołaniem PATCH /api/preferences
6. Dodaj obsługę błędów z wyświetlaniem w formularzu
7. Dodaj toast dla sukcesu i błędów (sonner)

**Pliki do utworzenia**:
- `src/components/profile/EditPreferencesForm.tsx`

### Krok 7: Implementacja ProfileContent

**Działania**:
1. Stwórz komponent jako funkcję React
2. Dodaj stan dla `preferences`, `isLoading`, `error`, `isEditDialogOpen`
3. Zaimplementuj `refreshPreferences()` do pobierania danych
4. Zaimplementuj `handleEditSuccess()` callback
5. Zaimplementuj `handleEdit()` callback
6. Dodaj renderowanie loading state (skeleton)
7. Dodaj renderowanie error state (toast + retry button)
8. Dodaj renderowanie empty state (jeśli preferences === null)
9. Dodaj renderowanie normal state (ProfileHeader, ProfileInfo, LastModifiedDate)
10. Dodaj kondycyjne renderowanie EditPreferencesDialog

**Pliki do utworzenia**:
- `src/components/profile/ProfileContent.tsx`

### Krok 8: Stworzenie strony Astro /profile

**Działania**:
1. Utwórz `src/pages/profile.astro`
2. Importuj AuthLayout
3. Importuj ProfileContent
4. Wywołaj `createServerSupabaseClient`
5. Sprawdź autentykację (redirect do /login jeśli nie)
6. Pobierz preferencje użytkownika z API (używając direct service lub fetch)
7. Przygotuj userName z metadanych użytkownika
8. Renderuj ProfileContent z preferencjami, accessToken i userName
9. Renderuj w AuthLayout

**Przykładowa implementacja**:
```astro
---
import AuthLayout from "../layouts/AuthLayout.astro";
import { ProfileContent } from "../components/profile/ProfileContent";
import { createServerSupabaseClient } from "../db/supabase.client";
import { getUserPreferences } from "../lib/services/preferences.service";

const supabase = createServerSupabaseClient(Astro);
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect("/login");
}

const preferences = await getUserPreferences(user.id, supabase);
const userName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
const accessToken = (await supabase.auth.getSession()).data.session?.access_token || "";
---

<AuthLayout pageTitle="Profil" userName={userName}>
  <ProfileContent 
    initialPreferences={preferences} 
    accessToken={accessToken} 
    userName={userName}
    client:idle 
  />
</AuthLayout>
```

**Pliki do utworzenia**:
- `src/pages/profile.astro`

### Krok 9: Dodanie nawigacji do profilu

**Działania**:
1. Zmodyfikuj `src/layouts/AuthLayout.astro`
2. Dodaj dropdown menu dla użytkownika (Shadcn DropdownMenu)
3. Dodaj ikonę avatara użytkownika (lub tylko imię jako trigger)
4. W menu dropdown dodaj opcję "Konto" (link do /profile)
5. Użyj lucide-react icon dla avatara (UserCircle lub User)

**Przykładowa implementacja**:
```astro
---
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
---

<div class="flex items-center gap-4">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="gap-2">
        <UserCircle className="h-5 w-5" />
        <span class="text-sm">{userName}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <a href="/profile">Konto</a>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <a href="/logout">Wyloguj</a>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Pliki do modyfikacji**:
- `src/layouts/AuthLayout.astro`

### Krok 10: Testowanie i debugowanie

**Działania**:
1. Testuj pobieranie preferencji (czy wyświetlają się poprawnie)
2. Testuj edycję preferencji (czy zapisują się poprawnie)
3. Testuj walidację (czy błędy wyświetlają się pod polami)
4. Testuj obsługę błędów (404, 401, 500, network errors)
5. Testuj nawigację (czy dropdown działa poprawnie)
6. Testuj responsywność (mobile, tablet, desktop)
7. Testuj dark mode

**Narzędzia**:
- DevTools network tab
- React DevTools
- Lighthouse (opcjonalnie)

### Krok 11: Optymalizacja i poprawki

**Działania**:
1. Sprawdź linter errors
2. Upewnij się, że wszystkie komponenty mają właściwe typy TypeScript
3. Dodaj komentarze gdzie potrzebne
4. Przeprowadź code review (self-review)

**Komendy**:
```bash
npm run lint
npm run lint:fix
```

