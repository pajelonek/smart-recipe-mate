# Plan implementacji widoku Onboarding (Kreator preferencji)

## 1. Przegląd

Widok Onboarding to obowiązkowy kreator preferencji żywieniowych, uruchamiany automatycznie po pierwszym logowaniu dla użytkowników bez zapisanych preferencji. Celem jest zebranie informacji o typie diety (wymaganym), preferowanych składnikach, kuchniach, alergenach i notatkach, a następnie zapisanie ich poprzez API i przekierowanie do dashboardu. Formularz jest wieloetapowy z paskiem postępu, zarządzany przez frontend z cache w localStorage.

## 2. Routing widoku

Widok dostępny pod ścieżką `/onboarding`. Routing obsługiwany przez Astro w pliku `./src/pages/onboarding.astro`. Automatyczny redirect z innych stron (np. po logowaniu) jeśli użytkownik nie ma preferencji (sprawdzane via GET /api/preferences).

## 3. Struktura komponentów

- **OnboardingPage** (główny widok Astro)
  - **OnboardingForm** (React komponent główny)
    - **ProgressBar** (Shadcn Progress)
    - **DietTypeStep** (krok 1, warunkowo renderowany)
      - **Select** (Shadcn Select dla diet_type)
      - **Button** (Next)
    - **PreferencesStep** (krok 2, warunkowo renderowany)
      - **Input** (preferred_ingredients)
      - **Input** (preferred_cuisines)
      - **Input** (allergens)
      - **Textarea** (notes)
      - **Button** (Prev)
      - **Button** (Submit)

## 4. Szczegóły komponentów

### OnboardingPage

- **Opis komponentu:** Główny widok Astro, zawiera layout AuthLayout, renderuje OnboardingForm. Sprawdzany jest status onboardingu via middleware lub hook.
- **Główne elementy:** `<OnboardingForm />`, progress bar, przyciski nawigacji.
- **Obsługiwane interakcje:** Render warunkowy kroków, obsługa submit i redirect.
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji, deleguje do OnboardingForm (diet_type required, inne opcjonalne).
- **Typy:** OnboardingFormData, ApiError.
- **Propsy:** Brak (komponent główny).

### OnboardingForm

- **Opis komponentu:** Główny komponent React zarządzający stanem formularza wieloetapowego przy użyciu react-hook-form i Zod.
- **Główne elementy:** Form z warunkowym renderowaniem kroków, ProgressBar, DietTypeStep/PreferencesStep.
- **Obsługiwane interakcje:** onNext (walidacja kroku i przejście), onPrev (powrót), onSubmit (API call i redirect).
- **Obsługiwana walidacja:** diet_type nie pusty string (Zod schema), inne pola opcjonalne; walidacja krok po kroku przed przejściem.
- **Typy:** OnboardingFormData (ViewModel), OnboardingStepState, OnboardingSubmitData (DTO).
- **Propsy:** Brak (samodzielny komponent).

### ProgressBar

- **Opis komponentu:** Shadcn Progress pokazujący postęp kroków (1/2).
- **Główne elementy:** `<Progress value={step * 50} />`.
- **Obsługiwane interakcje:** Brak (tylko wizualny).
- **Obsługiwana walidacja:** Brak.
- **Typy:** number (currentStep).
- **Propsy:** currentStep: number.

### DietTypeStep

- **Opis komponentu:** Krok 1 formularza, zbierający typ diety.
- **Główne elementy:** Label, Select z opcjami (np. "vegetarian", "vegan"), Button Next.
- **Obsługiwane interakcje:** Wybór opcji, klik Next -> walidacja i przejście do kroku 2.
- **Obsługiwana walidacja:** diet_type required (nie pusty string).
- **Typy:** string (diet_type).
- **Propsy:** formData: OnboardingFormData, onNext: () => void.

### PreferencesStep

- **Opis komponentu:** Krok 2 formularza, zbierający opcjonalne preferencje.
- **Główne elementy:** Input/Textarea dla preferred_ingredients, preferred_cuisines, allergens, notes, Button Prev/Submit.
- **Obsługiwane interakcje:** Wypełnienie pól, klik Prev -> powrót do kroku 1, klik Submit -> walidacja całego formularza, API call.
- **Obsługiwana walidacja:** Brak wymaganych pól, ale ogólna walidacja przed submit.
- **Typy:** OnboardingFormData.
- **Propsy:** formData: OnboardingFormData, onPrev: () => void, onSubmit: (data: OnboardingFormData) => void.

## 5. Typy

- **OnboardingFormData (ViewModel):** { diet_type: string; preferred_ingredients?: string; preferred_cuisines?: string; allergens?: string; notes?: string; } - Stan formularza, rozszerza PreferencesInput.
- **OnboardingStepState (ViewModel):** { currentStep: 1 | 2; isValid: boolean; } - Śledzenie postępu: currentStep (liczba 1 lub 2), isValid (boolean dla walidacji kroku).
- **OnboardingSubmitData (DTO):** { preferences: OnboardingFormData; } - Payload do API, zgodny z request body POST /api/onboarding/complete.
- **OnboardingStep:** 1 | 2 - Typ union dla kroków.
- **OnboardingFormState:** { step: OnboardingStep; data: OnboardingFormData; isSubmitting: boolean; } - Pełny stan formularza: step (OnboardingStep), data (OnboardingFormData), isSubmitting (boolean).

## 6. Zarządzanie stanem

Stan zarządzany przez custom hook useOnboardingForm w OnboardingForm. Hook używa useState dla currentStep, formData, isSubmitting. Integruje react-hook-form dla walidacji Zod (OnboardingCompleteInputSchema). Cache w localStorage: useEffect zapisuje formData przy zmianach, ładuje przy mount. Stan resetowany przy przerwaniu (brak obsługi persistencji między sesjami poza localStorage).

## 7. Integracja API

Integracja z POST /api/onboarding/complete. Request: OnboardingSubmitData jako JSON body. Response: 200 - UserPreferences (redirect do /), 400 - ApiError (pokaż błędy), 409 - ApiError (toast, nie powinno się zdarzyć). Sprawdzanie onboardingu via GET /api/preferences (w middleware lub hook).

## 8. Interakcje użytkownika

- **Po logowaniu:** Automatyczny redirect do /onboarding jeśli GET /api/preferences zwraca 404.
- **Krok 1:** Użytkownik wybiera diet_type z Select, klika Next -> walidacja (diet_type required), przejście do kroku 2 lub błąd.
- **Krok 2:** Wypełnia opcjonalne pola, klika Prev -> powrót do kroku 1, klika Submit -> walidacja całego formularza, API call, sukces: redirect do /, błąd: toast.
- **Przerwanie:** Dane cache'owane w localStorage, ale restart (np. odświeżenie) resetuje formularz.

## 9. Warunki i walidacja

- **diet_type:** Wymagany, nie pusty string - walidacja w DietTypeStep i całym formularzu przy pomocy Zod (OnboardingCompleteInputSchema).
- **Inne pola:** Opcjonalne, brak walidacji poza typami string.
- **Wpływ na UI:** Przy błędach walidacji pola podświetlone, przyciski disabled podczas submit. Formularz blokuje przejście do następnego kroku bez poprawnej walidacji.

## 10. Obsługa błędów

- **Walidacja client-side:** Błędy wyświetlane pod polami (react-hook-form errors).
- **API błędy:** 400 - toast z message z ApiError. 409 - toast, redirect do / (fallback). Network error - toast "Spróbuj ponownie", retry button.
- **Przypadki brzegowe:** Brak auth - redirect do login. Już onboarded - nie powinien wejść, ale obsługa 409.

## 11. Kroki implementacji

1. Utwórz `./src/pages/onboarding.astro` z layoutem AuthLayout i importem OnboardingForm.
2. Zaimplementuj useOnboardingForm hook z react-hook-form, Zod walidacją, localStorage cache.
3. Utwórz OnboardingForm.tsx z warunkowym renderowaniem kroków i obsługą zdarzeń.
4. Zaimplementuj ProgressBar, DietTypeStep, PreferencesStep z Shadcn komponentami.
5. Dodaj middleware do sprawdzania onboardingu (GET /api/preferences) i redirect.
6. Zintegruj API call w onSubmit z obsługą błędów i redirect.
7. Przetestuj walidację, interakcje i responsywność (Tailwind).
8. Dodaj toast notifications dla błędów (Shadcn Sonner).
