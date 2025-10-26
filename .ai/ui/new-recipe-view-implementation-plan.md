# Plan implementacji widoku Nowy przepis

## 1. Przegląd
Widok "Nowy przepis" umożliwia użytkownikom ręczne dodanie nowego przepisu w wymaganym formacie tekstowym. Głównym celem jest zebranie danych przepisu (tytuł, podsumowanie, składniki, przygotowanie, tagi) poprzez formularz z walidacją, a następnie zapisanie go w systemie poprzez wywołanie API. Widok jest częścią MVP aplikacji Smart Recipe Mate, skupiając się na prostym zarządzaniu przepisami tekstowymi po obowiązkowym onboardingu preferencji użytkownika.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/recipes/new`. Routing zostanie skonfigurowany w aplikacji Astro poprzez utworzenie nowej strony w katalogu `src/pages/recipes/new.astro`.

## 3. Struktura komponentów
Hierarchia komponentów:
- **NewRecipePage** (strona Astro): Główny wrapper strony, zawiera layout i komponent formularza.
  - **NewRecipeForm** (główny komponent React): Zarządza stanem formularza, walidacją i wywołaniami API.
    - **TitleField** (komponent Input z Shadcn/ui): Pole tekstowe dla tytułu.
    - **SummaryField** (komponent Textarea z Shadcn/ui): Pole tekstowe dla podsumowania (opcjonalne).
    - **IngredientsField** (komponent Textarea z Shadcn/ui): Pole tekstowe dla składników.
    - **PreparationField** (komponent Textarea z Shadcn/ui): Pole tekstowe dla przygotowania.
    - **TagsField** (komponent Combobox z Shadcn/ui): Pole wyboru tagów z autouzupełnianiem.
    - **SubmitButton** (komponent Button z Shadcn/ui): Przycisk wysyłania formularza.

## 4. Szczegóły komponentów
### NewRecipePage
- **Opis komponentu**: Strona Astro, która renderuje widok nowego przepisu. Odpowiada za routing, layout i przekazanie niezbędnych danych do komponentu formularza. Składa się z layoutu aplikacji i komponentu formularza.
- **Główne elementy**: Layout aplikacji (np. z nawigacją), nagłówek strony, komponent NewRecipeForm.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje do NewRecipeForm.
- **Obsługiwana walidacja**: Brak, walidacja odbywa się w NewRecipeForm.
- **Typy**: Brak własnych typów, używa standardowych typów Astro.
- **Propsy**: Brak, jako strona Astro nie przyjmuje propsów.

### NewRecipeForm
- **Opis komponentu**: Główny komponent formularza zbudowany w React z użyciem react-hook-form i Zod. Zarządza stanem formularza, walidacją, pobieraniem tagów i wysyłaniem danych do API. Składa się z pól formularza i przycisku submit.
- **Główne elementy**: Form z polami TitleField, SummaryField, IngredientsField, PreparationField, TagsField oraz SubmitButton. Używa biblioteki react-hook-form do zarządzania stanem i walidacją.
- **Obsługiwane interakcje**: Wypełnianie pól, wybór tagów, kliknięcie submit (wysyła POST /api/recipes), obsługa błędów i sukcesu poprzez snackbar.
- **Obsługiwana walidacja**: 
  - Tytuł wymagany, nie pusty.
  - Składniki wymagane, nie puste.
  - Przygotowanie wymagane, nie puste.
  - Tagi opcjonalne, maksymalnie 10.
  - Walidacja po stronie klienta przy pomocy Zod schema zgodnego z RecipeCreateInput.
- **Typy**: Używa RecipeCreateInput jako DTO dla danych formularza, NewRecipeFormData jako ViewModel (rozszerza RecipeCreateInput o stan walidacji).
- **Propsy**: Brak, komponent samodzielny.

### TitleField
- **Opis komponentu**: Pole tekstowe dla tytułu przepisu. Składa się z etykiety i inputa z Shadcn/ui.
- **Główne elementy**: Label i Input komponenty z Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, aktualizacja stanu formularza.
- **Obsługiwana walidacja**: Wymagane, nie puste; błąd wyświetlany jeśli puste.
- **Typy**: string (część NewRecipeFormData).
- **Propsy**: register (z react-hook-form), errors.

### SummaryField
- **Opis komponentu**: Pole tekstowe dla podsumowania (opcjonalne). Składa się z etykiety i textarea z Shadcn/ui.
- **Główne elementy**: Label i Textarea komponenty z Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, aktualizacja stanu formularza.
- **Obsługiwana walidacja**: Opcjonalne, brak walidacji.
- **Typy**: string | undefined (część NewRecipeFormData).
- **Propsy**: register (z react-hook-form), errors.

### IngredientsField
- **Opis komponentu**: Pole tekstowe dla składników. Składa się z etykiety i textarea z Shadcn/ui.
- **Główne elementy**: Label i Textarea komponenty z Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, aktualizacja stanu formularza.
- **Obsługiwana walidacja**: Wymagane, nie puste; błąd wyświetlany jeśli puste.
- **Typy**: string (część NewRecipeFormData).
- **Propsy**: register (z react-hook-form), errors.

### PreparationField
- **Opis komponentu**: Pole tekstowe dla przygotowania. Składa się z etykiety i textarea z Shadcn/ui.
- **Główne elementy**: Label i Textarea komponenty z Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, aktualizacja stanu formularza.
- **Obsługiwana walidacja**: Wymagane, nie puste; błąd wyświetlany jeśli puste.
- **Typy**: string (część NewRecipeFormData).
- **Propsy**: register (z react-hook-form), errors.

### TagsField
- **Opis komponentu**: Pole wyboru tagów z autouzupełnianiem. Składa się z Combobox z Shadcn/ui, który pobiera dane z GET /api/tags.
- **Główne elementy**: Label i Combobox komponenty z Shadcn/ui, lista opcji tagów.
- **Obsługiwane interakcje**: Wprowadzanie tekstu dla wyszukiwania, wybór tagów, aktualizacja listy wybranych tagów.
- **Obsługiwana walidacja**: Maksymalnie 10 tagów; błąd jeśli przekroczony limit.
- **Typy**: string[] (tag_names w NewRecipeFormData), Tag[] dla dostępnych tagów.
- **Propsy**: control (z react-hook-form), availableTags (z API).

### SubmitButton
- **Opis komponentu**: Przycisk wysyłania formularza. Składa się z Button z Shadcn/ui, który zmienia stan podczas wysyłania.
- **Główne elementy**: Button komponent z Shadcn/ui.
- **Obsługiwane interakcje**: Kliknięcie (wysyła formularz), stan loading podczas wysyłania.
- **Obsługiwana walidacja**: Przycisk disabled jeśli formularz niepoprawny.
- **Typy**: boolean (isSubmitting z react-hook-form).
- **Propsy**: isSubmitting, isValid.

## 5. Typy
Wymagane typy opierają się na istniejących definicjach w `src/types.ts`. Kluczowe typy:
- **RecipeCreateInput**: DTO dla żądania API, zawiera pola: title (string), summary (string | undefined), ingredients (string), preparation (string), tag_names (string[] | undefined).
- **Recipe**: DTO dla odpowiedzi API, zawiera pola: id (string), owner_id (string), title (string), summary (string | null), ingredients (string), preparation (string), created_at (string), updated_at (string), tags (Tag[]).
- **Tag**: Typ dla tagów, zawiera pola: id (string), name (string), created_at (string).
- **NewRecipeFormData**: ViewModel dla komponentu formularza, rozszerza RecipeCreateInput o dodatkowe pola stanu: isSubmitting (boolean), errors (obiekt błędów walidacji).
- **ApiError**: Dla błędów API, zawiera pola: error (string), message (string), details (Record<string, unknown> | unknown[] | undefined).

## 6. Zarządzanie stanem
Stan zarządzany jest poprzez react-hook-form w komponencie NewRecipeForm. Hook useForm zarządza wartościami pól, błędami walidacji i stanem wysyłania. Dodatkowo, customowy hook useTags (lub podobny) może być użyty do pobierania dostępnych tagów z GET /api/tags. Stan formularza jest lokalny, a po pomyślnym wysłaniu użytkownik zostaje przekierowany do listy przepisów.

## 7. Integracja API
Integracja odbywa się poprzez wywołania API w komponencie NewRecipeForm:
- **GET /api/tags**: Pobieranie dostępnych tagów dla autouzupełniania. Typ żądania: brak ciała, odpowiedź: TabListResponse (tablica TagWithCount). Wywołanie async przy montowaniu komponentu TagsField.
- **POST /api/recipes**: Wysyłanie danych formularza. Typ żądania: RecipeCreateInput w ciele JSON. Typ odpowiedzi: Recipe (201 Created) lub ApiError (400/422). Wywołanie przy submit formularza, obsługuje sukces (przekierowanie i snackbar) oraz błędy (wyświetlanie komunikatów).

## 8. Interakcje użytkownika
- **Wypełnianie pól**: Użytkownik wprowadza tekst w polach tytułu, podsumowania, składników i przygotowania. Pola aktualizują stan formularza w czasie rzeczywistym.
- **Wybór tagów**: Użytkownik wpisuje tekst w Combobox, który filtruje dostępne tagi. Wybór dodaje tag do listy, maksymalnie 10.
- **Wysyłanie formularza**: Kliknięcie przycisku submit waliduje formularz i wysyła dane do API. Przy sukcesie wyświetla się snackbar z potwierdzeniem i przekierowanie do listy przepisów. Przy błędzie wyświetla komunikat.
- **Obsługa błędów**: Jeśli walidacja nie powiedzie się, pola zaznaczane są jako błędne z komunikatami.

## 9. Warunki i walidacja
Warunki weryfikowane przez interfejs:
- **Tytuł**: Wymagany, nie pusty; komponent TitleField sprawdza i wyświetla błąd jeśli puste.
- **Składniki**: Wymagany, nie pusty; komponent IngredientsField sprawdza i wyświetla błąd jeśli puste.
- **Przygotowanie**: Wymagany, nie pusty; komponent PreparationField sprawdza i wyświetla błąd jeśli puste.
- **Tagi**: Maksymalnie 10; komponent TagsField blokuje dodanie więcej i wyświetla błąd.
Walidacja wpływa na stan przycisku submit (disabled jeśli nieprawidłowy) i wyświetlanie błędów pod polami.

## 10. Obsługa błędów
- **Błędy walidacji frontend**: Wyświetlane natychmiast pod polami formularza przy pomocy react-hook-form.
- **Błędy API**: Przy odpowiedzi 400/422 wyświetla się snackbar z komunikatem błędu (np. "title, ingredients, and preparation are required"). Przy błędach sieciowych ogólny komunikat.
- **Przypadki brzegowe**: Brak dostępnych tagów (lista pusta), przekroczenie limitu tagów, nieudane połączenie z API (retry lub komunikat).

## 11. Kroki implementacji
1. Utworzyć plik strony `src/pages/recipes/new.astro` z podstawowym layoutem i komponentem NewRecipeForm.
2. Zaimplementować komponent NewRecipeForm z react-hook-form i Zod schema dla walidacji.
3. Dodać pola formularza: TitleField, SummaryField, IngredientsField, PreparationField przy użyciu komponentów Shadcn/ui.
4. Zaimplementować TagsField z Combobox i wywołaniem GET /api/tags.
5. Dodać SubmitButton z obsługą stanu loading i walidacji.
6. Zintegrować wywołanie POST /api/recipes w funkcji submit formularza.
7. Dodać obsługę sukcesu (snackbar i przekierowanie) oraz błędów (wyświetlanie komunikatów).
8. Przetestować walidację, interakcje i integrację API.
9. Dostroić UI zgodnie z design systemem aplikacji (Tailwind + Shadcn/ui).
