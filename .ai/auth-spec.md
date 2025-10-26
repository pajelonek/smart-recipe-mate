# Specyfikacja Architektury Modułu Autentykacji - Smart Recipe Mate

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura Nawigacji i Layoutów

#### Tryb Niezalogowany (Public Layout)

- **Layout publiczny**: `src/layouts/PublicLayout.astro`
  - Dziedziczy podstawowe style z `Layout.astro`
  - Nie zawiera elementów nawigacji użytkownika
  - Przechowuje informacje marketingowe o aplikacji (landing page)
  - Wyświetla przycisk "Zaloguj się" w prawym górnym rogu
  - Design zoptymalizowany dla przeglądarek desktopowych

#### Tryb Zalogowany (Authenticated Layout)

- **Rozszerzony Layout główny**: `src/layouts/Layout.astro`
  - Dodanie komponentu nawigacyjnego w prawym górnym rogu
  - Implementacja dropdown menu z opcjami:
    - "Konto" - przekierowanie do profilu preferencji
    - "Wyloguj się" - wywołanie funkcji wylogowania
  - Dynamiczne wyświetlanie nazwy użytkownika lub email

### 1.2 Strony Autentykacji

#### Strona Główna (Landing Page / Dashboard) - `src/pages/index.astro`

- **Dla niezalogowanych użytkowników** (Landing Page):
  - Minimalistyczna strona marketingowa ("pusta reklamowa strona" z PRD)
  - Hero section z opisem aplikacji i jej głównych funkcjonalności
  - Przycisk "Zaloguj się" przekierowujący do `/login`
  - Brak dostępu do funkcjonalności aplikacji
- **Dla zalogowanych użytkowników** (Dashboard):
  - Dashboard z komponentem `DashboardContent` zawierający:
    - Przegląd statystyk użytkownika
    - Lista ostatnich przepisów (repozytorium przepisów)
    - Szybkie akcje (generowanie przepisu, dodanie przepisu)
  - Wymagane sprawdzenie ukończenia onboardingu przed wyświetleniem dashboardu

#### Strona Logowania - `src/pages/login.astro`

- **Komponent główny**: `AuthLayout` (Astro)
- **Formularz logowania**: `LoginForm` (React, client-side)
- **Elementy**:
  - Pole email z walidacją formatu
  - Pole hasła z opcją pokazywania/ukrywania
  - Przycisk "Zaloguj się"
  - Link do strony rejestracji
  - Link do odzyskiwania hasła
- **Layout**: Formularz wyśrodkowany, maksymalna szerokość 400px

#### Strona Rejestracji - `src/pages/register.astro`

- **Komponent główny**: `AuthLayout` (Astro)
- **Formularz rejestracji**: `RegisterForm` (React, client-side)
- **Elementy**:
  - Pole email z walidacją formatu i unikalności
  - Pole hasła z walidacją siły (min. 8 znaków, wielkie/małe litery, cyfry)
  - Pole potwierdzenia hasła z walidacją zgodności
  - Przycisk "Zarejestruj się"
  - Link do strony logowania
- **Layout**: Formularz wyśrodkowany, maksymalna szerokość 400px

#### Strona Odzyskiwania Hasła - `src/pages/reset-password.astro`

- **Komponent główny**: `AuthLayout` (Astro)
- **Formularz resetowania**: `ResetPasswordForm` (React, client-side)
- **Elementy**:
  - Pole email z walidacją formatu
  - Przycisk "Wyślij link resetujący"
  - Link powrotny do logowania
- **Layout**: Formularz wyśrodkowany, maksymalna szerokość 400px

#### Strona Aktualizacji Hasła - `src/pages/auth/update-password.astro`

- **Komponent główny**: `AuthLayout` (Astro)
- **Formularz aktualizacji**: `UpdatePasswordForm` (React, client-side)
- **Elementy**:
  - Pole nowego hasła z walidacją siły
  - Pole potwierdzenia hasła
  - Przycisk "Zmień hasło"
- **Layout**: Formularz wyśrodkowany, maksymalna szerokość 400px
- **Obsługa tokenu**: Token z URL jest automatycznie przechwytywany przez Supabase

#### Strona Callback - `src/pages/auth/callback.astro`

- **Funkcja**: Obsługa callback z Supabase po weryfikacji email
- **Logika**:
  - Przetworzenie tokenu z URL
  - Ustanowienie sesji użytkownika
  - Sprawdzenie preferencji
  - Przekierowanie do `/onboarding` lub `/`
- **Brak UI**: Automatyczne przekierowanie bez wyświetlania treści

### 1.3 Komponenty React (Client-Side)

#### LoginForm (`src/components/auth/LoginForm.tsx`)

- **Stan komponentu**: email, password, isLoading, errors
- **Walidacja**:
  - Email: format email, wymagane pole
  - Password: wymagane pole, minimum 1 znak
- **Obsługa błędów**:
  - "Nieprawidłowy email lub hasło" - ogólny komunikat dla błędów autentykacji
  - "Wprowadź prawidłowy adres email"
  - "Hasło jest wymagane"
- **Akcje**:
  - onSubmit: wywołanie API logowania przez Supabase Auth
  - onSuccess: przekierowanie do dashboardu lub strony docelowej
  - onError: wyświetlenie komunikatu błędu

#### RegisterForm (`src/components/auth/RegisterForm.tsx`)

- **Stan komponentu**: email, password, confirmPassword, isLoading, errors
- **Walidacja**:
  - Email: format email, unikalność, wymagane
  - Password: min. 8 znaków, wielkie/małe litery, cyfry, wymagane
  - ConfirmPassword: zgodność z password, wymagane
- **Obsługa błędów**:
  - "Użytkownik o podanym adresie email już istnieje"
  - "Hasło musi mieć co najmniej 8 znaków"
  - "Hasło musi zawierać wielkie i małe litery oraz cyfry"
  - "Hasła nie są identyczne"
- **Akcje**:
  - onSubmit: wywołanie API rejestracji przez Supabase Auth
  - onSuccess: przekierowanie do strony logowania z komunikatem potwierdzającym rejestrację
  - onError: wyświetlenie komunikatu błędu
- **Uwagi**:
  - Email weryfikacyjny jest wysyłany, ale NIE jest wymagany do pierwszego logowania
  - Użytkownik może zalogować się natychmiast po rejestracji

#### ResetPasswordForm (`src/components/auth/ResetPasswordForm.tsx`)

- **Stan komponentu**: email, isLoading, errors, isSuccess
- **Walidacja**:
  - Email: format email, wymagane
- **Obsługa błędów**:
  - "Wprowadź prawidłowy adres email"
  - "Nie znaleziono użytkownika o podanym adresie email"
- **Akcje**:
  - onSubmit: wywołanie API resetowania hasła przez Supabase Auth
  - onSuccess: wyświetlenie komunikatu o wysłaniu linku resetującego
  - onError: wyświetlenie komunikatu błędu

#### UpdatePasswordForm (`src/components/auth/UpdatePasswordForm.tsx`)

- **Stan komponentu**: password, confirmPassword, isLoading, errors
- **Walidacja**:
  - Password: min. 8 znaków, wielkie/małe litery, cyfry, wymagane
  - ConfirmPassword: zgodność z password, wymagane
- **Obsługa błędów**:
  - "Hasło musi mieć co najmniej 8 znaków"
  - "Hasło musi zawierać wielkie i małe litery oraz cyfry"
  - "Hasła nie są identyczne"
  - "Link resetowania hasła wygasł"
- **Akcje**:
  - onSubmit: wywołanie API aktualizacji hasła `/api/auth/update-password`
  - onSuccess: automatyczne zalogowanie i przekierowanie do dashboardu
  - onError: wyświetlenie komunikatu błędu

#### AuthLayout (`src/components/auth/AuthLayout.astro`)

- **Statyczny komponent Astro**: `src/components/auth/AuthLayout.astro`
- **Elementy**:
  - Logo aplikacji
  - Tytuł strony (parametryzowany)
  - Kontener na formularz
  - Linki nawigacyjne między stronami autentykacji

### 1.4 Obsługa Scenariuszy

#### Scenariusz: Pierwszy dostęp użytkownika

1. Użytkownik wchodzi na stronę główną `/`
2. Middleware wykrywa brak sesji
3. Przekierowanie na Landing Page dla niezalogowanych
4. Uzytkownik klika - Zaloguj sie
5. Po udanym logowaniu - sprawdzenie onboardingu
6. Jeśli brak preferencji → przekierowanie na `/onboarding`
7. Jeśli preferencje istnieją → dashboard

#### Scenariusz: Próba dostępu do API bez logowania

1. Użytkownik (lub kod klienta) próbuje wywołać chroniony endpoint API (np. `/api/recipes`)
2. Middleware wykrywa brak sesji
3. Zwrot statusu HTTP 401 Unauthorized
4. Frontend przekierowuje na `/login` z odpowiednim komunikatem

#### Scenariusz: Rejestracja nowego użytkownika

1. Użytkownik wypełnia formularz rejestracji
2. Walidacja po stronie klienta i serwera
3. Utworzenie konta w Supabase Auth
4. Wysłanie emaila weryfikacyjnego (opcjonalne dla użytkownika)
5. Przekierowanie na stronę logowania z komunikatem potwierdzającym
6. Użytkownik może zalogować się natychmiast bez weryfikacji email

#### Scenariusz: Odzyskiwanie hasła

1. Użytkownik wprowadza email na stronie `/reset-password`
2. Supabase wysyła link resetujący na email
3. Użytkownik klika link z emaila → przekierowanie do `/auth/update-password`
4. Użytkownik wprowadza nowe hasło z potwierdzeniem
5. Automatyczne zalogowanie i przekierowanie do dashboardu

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API

#### Endpointy Autentykacji (Publiczne)

Endpointy autentykacji są obsługiwane przez server-side API calls do Supabase Auth dla bezpieczeństwa:

- **POST `/api/auth/login`**: logowanie użytkownika (publiczny)
- **POST `/api/auth/register`**: rejestracja nowego użytkownika (publiczny)
- **POST `/api/auth/logout`**: wylogowanie użytkownika (wymaga autentykacji)
- **POST `/api/auth/reset-password`**: wysłanie linku resetującego hasło (publiczny)
- **POST `/api/auth/update-password`**: aktualizacja hasła po kliknięciu linku (wymaga tokenu z emaila)

#### Middleware Autentykacji - `src/middleware/index.ts`

- **PUBLIC_ROUTES**: `["/", "/login", "/register", "/reset-password", "/auth/callback", "/auth/update-password"]`
- **PUBLIC_API_ROUTES**: `["/api/auth/login", "/api/auth/register", "/api/auth/reset-password"]`
- **ONBOARDING_ROUTE**: `"/onboarding"`
- **Logika autentykacji**:
  - Dla publicznych ścieżek: tylko inicjalizacja Supabase client
  - Dla chronionych ścieżek: sprawdzenie sesji, przekierowanie do `/login` przy braku autentykacji
  - Dla ścieżki `/` gdy zalogowany: dodatkowe sprawdzenie ukończenia onboardingu
  - Dla wszystkich `/api/*` (oprócz publicznych): wymagana sesja, zwrot 401 przy braku autentykacji

#### Endpointy API Aplikacji (Wymagają Autentykacji)

- **GET/POST `/api/preferences`**: zarządzanie preferencjami użytkownika
- **GET/POST/PUT/DELETE `/api/recipes`**: zarządzanie przepisami
- **POST `/api/ai/generate-recipe`**: generowanie przepisów przez AI
- **GET `/api/ai/generations`**: historia generacji AI

### 2.2 Modele Danych i Walidacja

#### Schematy Zod - `src/lib/validation/auth.schemas.ts`

```typescript
// Schemat logowania
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Schemat rejestracji
export const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać wielkie i małe litery oraz cyfry"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

// Schemat resetowania hasła
export const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

// Schemat aktualizacji hasła
export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać wielkie i małe litery oraz cyfry"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });
```

#### Modele Typów TypeScript - `src/types/auth.ts`

```typescript
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

export interface AuthError {
  message: string;
  status?: number;
}
```

### 2.3 Obsługa Wyjątków

#### Klasy Błędów - `src/lib/errors/auth.errors.ts`

```typescript
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RegistrationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}
```

#### Middleware do obsługi błędów - rozszerzenie `src/middleware/index.ts`

- Przechwytywanie błędów autentykacji Supabase
- Mapowanie błędów na przyjazne komunikaty
- Logowanie błędów do systemu monitorowania
- Zwracanie odpowiednich kodów HTTP

### 2.4 Server-Side Rendering

#### Konfiguracja Astro - `astro.config.mjs`

- **Output**: `"server"` - utrzymanie SSR dla bezpieczeństwa sesji
- **Adapter**: `node({ mode: "standalone" })` - utrzymanie obecnej konfiguracji
- **Port**: `3000` - utrzymanie obecnego portu

#### Strategia Renderowania

- **Strony publiczne** (`/login`, `/register`, `/reset-password`): SSR dla optymalizacji SEO i wydajności
- **Strony chronione** (`/`, `/onboarding`): SSR z kontrolą dostępu przez middleware
- **API endpoints**: Brak prerenderingu (`export const prerender = false`)

## 3. SYSTEM AUTENTYKACJI

### 3.1 Integracja z Supabase Auth

#### Konfiguracja Klienta - `src/db/supabase.client.ts`

- **Utrzymanie obecnej konfiguracji** z PKCE flow dla bezpieczeństwa
- **Auto-refresh token**: włączony dla utrzymania sesji
- **Persist session**: włączony dla utrzymania logowania między sesjami przeglądarki

#### Serwis Autentykacji - `src/lib/services/auth.service.ts`

```typescript
export class AuthService {
  // Metody instancyjne z dostępem do kontekstu Astro
  static async signIn(email: string, password: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  static async signUp(email: string, password: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${context.url.origin}/auth/callback`,
      },
    });
    return { data, error };
  }

  static async signOut(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async resetPassword(email: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${context.url.origin}/auth/update-password`,
    });
    return { error };
  }

  static async updatePassword(newPassword: string, context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  }

  static async getUser(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  }

  static async getSession(context: APIContext) {
    const supabase = createServerSupabaseClient(context);
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  }
}
```

### 3.2 Zarządzanie Sesją

#### Callback Endpoint - `src/pages/auth/callback.astro`

- **Przetwarzanie callback** z Supabase po weryfikacji email (opcjonalne)
- **Ustanawianie sesji** po kliknięciu linku weryfikacyjnego
- **Przekierowanie**:
  - Sprawdzenie czy użytkownik ma preferencje
  - Brak preferencji → `/onboarding`
  - Preferencje istnieją → `/` (dashboard)

#### Strona Aktualizacji Hasła - `src/pages/auth/update-password.astro`

- **Przetwarzanie tokenu** z linku resetowania hasła
- **Formularz nowego hasła** (`UpdatePasswordForm` React component):
  - Pole nowego hasła z walidacją siły
  - Pole potwierdzenia hasła
  - Przycisk "Zmień hasło"
- **Po pomyślnej zmianie**:
  - Automatyczne zalogowanie użytkownika
  - Przekierowanie do dashboardu `/`

### 3.3 Bezpieczeństwo

#### Middleware Bezpieczeństwa

- **Sprawdzanie sesji** dla wszystkich chronionych tras
- **CSRF protection** przez Supabase Auth
- **Rate limiting** dla endpointów autentykacji (do implementacji w przyszłości)
- **Logowanie podejrzanych aktywności** (nieprawidłowe próby logowania)

#### Polityka Haseł

- **Minimum 8 znaków**
- **Wymagane wielkie i małe litery**
- **Wymagane cyfry**
- **Opcjonalne znaki specjalne** (zalecane)

### 3.4 Integracja z Onboardingiem

#### Przepływ Po Zalogowaniu

1. **Sprawdzenie sesji** w middleware
2. **Pobranie preferencji** z tabeli `user_preferences`
3. **Warunkowe przekierowanie**:
   - Brak preferencji → `/onboarding` (obowiązkowy kreator)
   - Preferencje istnieją → `/` (dashboard z repozytorium przepisów)

#### Wymuszony Onboarding (US-005)

- **Blokada dostępu** do całej aplikacji bez ukończenia onboardingu
- **Użytkownik nie może wyłączyć kreatora** - brak możliwości ominięcia
- **Po zapisaniu preferencji**:
  - Przekierowanie do `/` (dashboard)
  - Dashboard wyświetla `DashboardContent` z listą przepisów i szybkimi akcjami
- **Edycja preferencji** później dostępna przez "Konto" w dropdown menu

### 3.5 Obsługa Błędów i Monitoring

#### Strategia Logowania

- **Błędy autentykacji**: logowanie do konsoli z poziomem WARN
- **Błędy rejestracji**: logowanie z poziomem INFO (normalne przypadki)
- **Podejrzane aktywności**: logowanie z poziomem ERROR
- **Statystyki**: zbieranie metryk o próbach logowania/rejestracji

#### Komunikaty Błędów dla Użytkownika

- **Ogólne podejście**: przyjazne komunikaty bez ujawniania szczegółów technicznych
- **Specyficzne przypadki**:
  - "Nieprawidłowy email lub hasło" - ogólny komunikat dla błędów logowania
  - "Link resetowania hasła wygasł" - gdy token jest nieważny
  - "Zbyt wiele prób logowania - spróbuj ponownie później" - rate limiting (przyszła implementacja)
  - "Użytkownik o podanym adresie email już istnieje" - duplikat przy rejestracji

---

## Podsumowanie Implementacyjne

### Kolejność Implementacji

1. **Faza 1**: Utworzenie schematów walidacji i modeli typów
2. **Faza 2**: Implementacja serwisów autentykacji
3. **Faza 3**: Utworzenie stron i komponentów UI
4. **Faza 4**: Aktualizacja middleware i layoutów
5. **Faza 5**: Implementacja callback endpoints
6. **Faza 6**: Testowanie integracji z onboardingiem

### Zależności Techniczne

- **Supabase Auth**: podstawowa funkcjonalność autentykacji
- **Zod**: walidacja danych
- **Tailwind CSS + shadcn/ui**: komponenty UI
- **TypeScript**: bezpieczeństwo typów
- **Astro middleware**: kontrola dostępu

### Punkty Integracyjne

- **Z onboardingiem**: sprawdzenie preferencji po logowaniu
- **Z dashboardem**: wyświetlanie danych użytkownika i repozytorium przepisów
- **Z profilem/kontem**: dostęp do edycji preferencji przez dropdown "Konto" → strona `/account` lub `/profile`
- **Z API endpoints**: przekazywanie kontekstu autentykacji
- **Z zewnętrznymi serwisami**: utrzymanie sesji dla wywołań API

### Wyjaśnienie Sprzeczności z PRD

#### Dashboard vs Repozytorium Przepisów

- **PRD sekcja 3.1** wskazuje przekierowanie do "strony dashboardu"
- **PRD US-005** wskazuje przekierowanie do "repozytorium przepisów"
- **Rozwiązanie**: Dashboard (`/`) zawiera komponent `DashboardContent`, który wyświetla:
  - Statystyki użytkownika
  - **Lista przepisów** (repozytorium przepisów)
  - Szybkie akcje
- Dashboard = główna strona aplikacji zawierająca repozytorium przepisów

#### Weryfikacja Email

- **PRD** wspomina o "dostawcy usług e-mail dla weryfikacji"
- **Implementacja**: Email weryfikacyjny jest wysyłany, ale:
  - NIE jest wymagany do logowania
  - Użytkownik może zalogować się natychmiast po rejestracji
  - Weryfikacja email jest opcjonalna dla użytkownika

#### Desktop-only

- Aplikacja jest zaprojektowana dla przeglądarek desktopowych
- Responsywność została zastąpiona przez "design zoptymalizowany dla desktop"
- Wszystkie wzmianki o responsywności zostały usunięte z tej specyfikacji

Specyfikacja została opracowana zgodnie z wymaganiami US-001 oraz stackiem technologicznym aplikacji Smart Recipe Mate, zachowując zgodność z istniejącą architekturą i nie naruszając działania innych modułów aplikacji.
