<architecture_analysis>

## Analiza Architektury UI dla Modułu Autentykacji

### Komponenty zidentyfikowane w specyfikacji:

**Strony publiczne (Public Layout):**

- Landing Page (`/`) - marketingowa strona główna dla niezalogowanych
- Login Page (`/login`) - strona logowania z LoginForm
- Register Page (`/register`) - strona rejestracji z RegisterForm
- Reset Password Page (`/reset-password`) - strona resetowania hasła z ResetPasswordForm
- Auth Callback (`/auth/callback`) - automatyczne przekierowanie po weryfikacji email
- Update Password (`/auth/update-password`) - strona zmiany hasła z UpdatePasswordForm

**Strony chronione (Authenticated Layout):**

- Dashboard (`/`) - główna strona z DashboardContent zawierająca repozytorium przepisów
- Onboarding (`/onboarding`) - obowiązkowy kreator preferencji

**Wspólne komponenty:**

- AuthLayout - wspólny layout dla stron autentykacji
- Layout - główny layout aplikacji z nawigacją użytkownika
- ModeToggle - przełącznik motywu jasny/ciemny

**Komponenty React (client-side):**

- LoginForm - formularz logowania z walidacją
- RegisterForm - formularz rejestracji z walidacją siły hasła
- ResetPasswordForm - formularz resetowania hasła
- UpdatePasswordForm - formularz zmiany hasła
- DashboardContent - główny komponent dashboardu z statystykami i przepisami

### Główny przepływ danych:

1. Użytkownik niezalogowany → Public Layout → Landing Page
2. Próba dostępu do chronionych tras → Middleware → Przekierowanie do /login
3. Logowanie/Rejestracja → AuthLayout + Formularze → Supabase Auth
4. Po logowaniu → Middleware sprawdza preferencje → Dashboard lub Onboarding
5. Dashboard → DashboardContent → Komponenty statystyk i przepisów

### Zależności między komponentami:

- AuthLayout używany przez wszystkie strony autentykacji
- Layout rozszerzony o dropdown menu dla zalogowanych użytkowników
- DashboardContent wymaga danych użytkownika i sesji
- Wszystkie formularze używają wspólnych schematów walidacji Zod
- Middleware kontroluje dostęp do wszystkich komponentów

### Komponenty wymagające aktualizacji:

- Layout.astro - dodanie nawigacji użytkownika
- index.astro - warunkowe renderowanie Landing/Dashboard
- Middleware - pełna implementacja kontroli dostępu (obecnie tymczasowo wyłączona)
  </architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
    %% Publiczne strony i komponenty
    subgraph "Publiczne Strony (PublicLayout)"
        A["Landing Page<br/>/"] --> B["AuthLayout"]
        C["Login Page<br/>/login"] --> B
        D["Register Page<br/>/register"] --> B
        E["Reset Password<br/>/reset-password"] --> B
        F["Auth Callback<br/>/auth/callback"] --> G["Auto Redirect"]
        H["Update Password<br/>/auth/update-password"] --> B
    end

    %% Formularze autentykacji
    subgraph "Formularze React (Client-side)"
        I["LoginForm"] --> J["Walidacja Zod"]
        K["RegisterForm"] --> J
        L["ResetPasswordForm"] --> J
        M["UpdatePasswordForm"] --> J
    end

    %% Chronione strony
    subgraph "Chronione Strony (Layout)"
        N["Dashboard<br/>/"] --> O["DashboardContent"]
        P["Onboarding<br/>/onboarding"] --> Q["Kreator Preferencji"]
    end

    %% Komponenty dashboardu
    subgraph "Komponenty Dashboard"
        O --> R["UserStats"]
        O --> S["RecentRecipesList"]
        O --> T["QuickActions"]
        O --> U["WelcomeSection"]
    end

    %% Wspólne komponenty
    subgraph "Wspólne Komponenty"
        V["ModeToggle"] --> W["Theme Management"]
        X["Toaster<br/>(Sonner)"] --> Y["Notifications"]
    end

    %% Middleware i kontrola dostępu
    subgraph "Middleware & Kontrola"
        Z["Astro Middleware"] --> AA["Sprawdzenie Sesji"]
        AA --> BB["Sprawdzenie Onboardingu"]
        Z --> CC["Routing Decyzje"]
    end

    %% Przepływy danych
    B --> I
    B --> K
    B --> L
    B --> M
    Z --> CC
    CC -.->|"Publiczne trasy"| A
    CC -.->|"Chronione trasy"| N
    AA -.->|"Brak sesji"| C
    BB -.->|"Brak preferencji"| P
    BB -.->|"Preferencje OK"| N

    %% Stylizacja
    classDef public fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef protected fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef shared fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef middleware fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class A,C,D,E,F,H public
    class N,P protected
    class V,X,W,Y shared
    class Z,AA,BB,CC middleware
```

</mermaid_diagram>
