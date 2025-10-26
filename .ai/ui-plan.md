# Architektura UI dla Smart Recipe Mate

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika dla Smart Recipe Mate opiera się na frameworku Astro 5 z komponentami React 19 dla interaktywnych elementów (islands). Używa Tailwind CSS 4 do stylizacji oraz biblioteki Shadcn/ui dla gotowych komponentów UI, zapewniając spójny i nowoczesny design w ciepłych tonach kulinarnych. Aplikacja jest zoptymalizowana pod desktop, z podstawową responsywnością na tablety. Nawigacja jest persistentna poprzez boczny panel (Sidebar), a stan aplikacji zarządzany za pomocą Zustand. Integracja z API odbywa się poprzez fetch z cachingiem (np. useSWR), walidacja formularzy z Zod, obsługa błędów poprzez snackbary (Sonner). Główne widoki obejmują onboarding, dashboard, profil, zarządzanie przepisami, generowanie AI i historię generacji. Przepływ użytkownika jest liniowy: od rejestracji przez onboarding do zarządzania zasobami, z naciskiem na prostotę i minimalizację kroków.

## 2. Lista widoków

### Widok: Dashboard (Strona główna)

- **Ścieżka widoku**: /
- **Główny cel**: Przedstawienie podsumowania zasobów użytkownika po zalogowaniu, z szybkimi akcjami do tworzenia nowych przepisów lub generowania AI.
- **Kluczowe informacje do wyświetlenia**: Ostatnio dodane/edytowane przepisy (lista 5-10), szybkie akcje (przyciski "Dodaj przepis", "Generuj AI"), statystyki (liczba przepisów, generacji).
- **Kluczowe komponenty widoku**: Sekcja powitalna (Hero/Card), lista recent recipes (Table lub Cards), przyciski CTA (Button z Shadcn), Sidebar nawigacyjny.
- **UX, dostępność i względy bezpieczeństwa**: Prosty onboarding post-login (jeśli brak preferencji, redirect do /onboarding); loading skeletons dla list; snackbar dla potwierdzeń; walidacja auth via middleware; ukrycie wrażliwych danych bez autoryzacji.

### Widok: Onboarding (Kreator preferencji)

- **Ścieżka widoku**: /onboarding
- **Główny cel**: Obowiązkowe zebranie preferencji żywieniowych po pierwszym logowaniu.
- **Kluczowe informacje do wyświetlenia**: Formularz wieloetapowy (typ diety, preferowane składniki, kuchnie, alergeny, notatki); progres bar.
- **Kluczowe komponenty widoku**: Multi-step Form (react-hook-form + Zod), Select/Combobox dla opcji (diet_type required), Button do następnego/kroku, walidacja client-side.
- **UX, dostępność i względy bezpieczeństwa**: Automatyczny redirect po logowaniu jeśli brak preferencji (sprawdzane via GET /api/preferences); przerwanie resetuje stan (localStorage cache); walidacja zgodna z API (diet_type required); ochrona przed duplikacją (409 z API).

### Widok: Profil

- **Ścieżka widoku**: /profile
- **Główny cel**: Wyświetlenie i edycja preferencji użytkownika.
- **Kluczowe informacje do wyświetlenia**: Aktualne preferencje (Card z polami), data ostatniej modyfikacji, przycisk edycji.
- **Kluczowe komponenty widoku**: Read-only Card, Edit Dialog/Modal (Form z PUT/PATCH /api/preferences), Alert dla potwierdzenia zmian.
- **UX, dostępność i względy bezpieczeństwa**: Edycja w modalu dla minimalnego zakłócenia; optimistic update z rollback na błąd; RLS w API zapewnia prywatność; snackbar dla błędów walidacji.

### Widok: Lista przepisów

- **Ścieżka widoku**: /recipes
- **Główny cel**: Przegląd i wyszukiwanie przepisów użytkownika.
- **Kluczowe informacje do wyświetlenia**: Tabela z tytułami, datami; pole wyszukiwania (tytuł).
- **Kluczowe komponenty widoku**: DataTable (Shadcn Table z debounce search), Pagination (jeśli >50), Empty State jeśli brak.
- **UX, dostępność i względy bezpieczeństwa**: Debounce na search (300ms), URL params dla search (persistencja); tylko własne przepisy (owner_id via auth); 404 empty state dla usuniętych.

### Widok: Szczegóły przepisu

- **Ścieżka widoku**: /recipes/[id]
- **Główny cel**: Wyświetlenie pełnych detali przepisu z opcjami edycji.
- **Kluczowe informacje do wyświetlenia**: Tytuł, summary, składniki, przygotowanie (Accordion), przyciski edycji/usuwania.
- **Kluczowe komponenty widoku**: Accordion dla sekcji, Edit Modal (Form z PUT/PATCH), Delete Confirmation Dialog.
- **UX, dostępność i względy bezpieczeństwa**: Ładowanie via GET /api/recipes/:id; 403 jeśli nie własny; modal potwierdzenia dla delete (soft delete).

### Widok: Nowy przepis

- **Ścieżka widoku**: /recipes/new
- **Główny cel**: Dodanie nowego przepisu ręcznie.
- **Kluczowe informacje do wyświetlenia**: Formularz z sekcjami (tytuł, summary, składniki, przygotowanie).
- **Kluczowe komponenty widoku**: Form (Zod + react-hook-form), Textarea dla sekcji, Submit Button.
- **UX, dostępność i względy bezpieczeństwa**: Walidacja required fields (tytuł, składniki, przygotowanie); POST /api/recipes; snackbar sukces/błąd; ochrona przed pustymi sekcjami.

### Widok: Generowanie AI

- **Ścieżka widoku**: /generate
- **Główny cel**: Wprowadzenie składników i generowanie przepisu via AI.
- **Kluczowe informacje do wyświetlenia**: Formularz (składniki lista, cele dietetyczne, kontekst), preview Card po generacji, przyciski Accept/Reject.
- **Kluczowe komponenty widoku**: Form (array inputs dla składników), Loading Spinner, Generated Recipe Card, Accept Button (POST /api/recipes), Reject (zamknij).
- **UX, dostępność i względy bezpieczeństwa**: POST /api/ai/generate-recipe z preferencjami z cache; blokada równoległych requestów; 429 countdown w snackbarze; logi błędów w API.

### Widok: Historia generacji AI

- **Ścieżka widoku**: /ai/generations
- **Główny cel**: Przegląd historii generacji AI z filtrami.
- **Kluczowe informacje do wyświetlenia**: Tabela z datami, statusem (success/error), input summary; filtr statusu.
- **Kluczowe komponenty widoku**: DataTable z filtrami (status), Linki do detali, Empty State.
- **UX, dostępność i względy bezpieczeństwa**: GET /api/ai/generations z ?status; pagination; tylko własne generacje; error state z retry.

### Widok: Szczegóły generacji AI

- **Ścieżka widoku**: /ai/generations/[id]
- **Główny cel**: Szczegółowy przegląd input/output generacji.
- **Kluczowe informacje do wyświetlenia**: Tabs (Input, Output, Error jeśli jest), sformatowany JSON/tekst.
- **Kluczowe komponenty widoku**: Tabs (Shadcn), JSON Viewer lub Accordion dla payloads, Recipe Card jeśli success.
- **UX, dostępność i względy bezpieczeństwa**: GET /api/ai/generations/:id; 403 jeśli nie własny; fallback na error message.

### Widoki autentykacji

- **Ścieżka widoku**: /login, /register, /reset-password
- **Główny cel**: Obsługa rejestracji, logowania, resetu hasła.
- **Kluczowe informacje do wyświetlenia**: Formularze z email/hasło, linki do alternatyw.
- **Kluczowe komponenty widoku**: Auth Form (Supabase SDK), Email verification notice.
- **UX, dostępność i względy bezpieczeństwa**: Supabase Auth flows; redirect po success; secure token storage (localStorage); generic error messages.

## 3. Mapa podróży użytkownika

1. **Rejestracja nowego użytkownika**: /register → Email verification (external) → /login.
2. **Pierwsze logowanie**: /login → Check onboarding (GET /api/preferences) → Jeśli 404, redirect do /onboarding → Wypełnij formularz → POST /api/onboarding/complete → Redirect do / (dashboard).
3. **Dostęp do zasobów**: Zalogowany → Sidebar nawigacja do /profile (edycja preferencji), /recipes (lista, search/filter, click do /recipes/[id] dla detali/edycji), /recipes/new (dodaj).
4. **Generowanie AI**: /generate → Wypełnij form → POST /api/ai/generate-recipe → Preview → Accept → POST /api/recipes → Snackbar success → Powrót do /recipes.
5. **Historia AI**: /ai/generations → Filter → Click do /ai/generations/[id] dla detali.
6. **Wylogowanie**: Sidebar → Unieważnij sesję → Redirect do /login.
7. **Edge flows**: Błąd API → Snackbar z message/retry; Brak przepisów → Empty state z CTA do generate/add; Rate limit → Snackbar z countdown.

Główny przypadek użycia (dodanie przepisu via AI): Login → /generate → Input → Generate → Review → Save → /recipes (widoczny nowy).

## 4. Układ i struktura nawigacji

- **Persistent Sidebar**: Lewy panel z logo, linkami (Profile, Przepisy, Generuj AI, Historia generacji, Wyloguj); dynamiczny – ukryty pre-onboarding (tylko Login/Onboarding).
- **Top Bar**: Opcjonalny search globalny lub user avatar z menu (profil, logout).
- **Routing**: Astro pages z dynamicznymi routes (/recipes/[id], /ai/generations/[id]); middleware redirect dla unauth/onboarding.
- **Przejścia**: Smooth transitions via Astro; URL params dla search (np. /recipes?search=pasta).
- **Quick Actions**: W dashboard – przyciski do /recipes/new i /generate.

## 5. Kluczowe komponenty

- **Auth Components**: Login/Register Forms – integracja Supabase SDK, obsługa email verification i resetu.
- **Forms**: Reusable Form z react-hook-form + Zod – walidacja mirroring API schemas, multi-step dla onboarding.
- **Tables/DataTable**: Shadcn Table z sorting, filtering, pagination – dla list przepisów i generacji.
- **Modals/Dialogs**: Shadcn Dialog – dla edycji, usuwania (potwierdzenie).
- **Cards/Accordion**: Wyświetlanie detali przepisów/generacji – collapsible sekcje.
- **Combobox/Select**: Dla diet_type (predefiniowane opcje).
- **Toasts/Snackbars**: Sonner – dla sukcesów, błędów, rate limits (z countdown).
- **Loading States**: Skeleton loaders dla list/forms; Spinner dla API calls.
- **Error Boundary**: React Error Boundary – fallback UI z retry.
- **JSON Viewer**: Prosty komponent dla AI payloads (Tabs z formatted text/JSON).
