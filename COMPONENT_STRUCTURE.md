# Struktura komponentów i zależności - Smart Recipe Mate

```
src/components/
│
├── ai/                          # Komponenty generowania przepisów AI
│   ├── AIGenerateContent.tsx    # Główny kontener (orchestracja)
│   │   ├── → GenerationForm
│   │   ├── → LoadingSpinner
│   │   ├── → GeneratedRecipePreview
│   │   ├── → ErrorMessage
│   │   └── → useAIGeneration (hook)
│   │
│   ├── GenerationForm.tsx       # Formularz generowania
│   │   ├── → IngredientsInput
│   │   └── → ui: Button, Label, Textarea, Card
│   │
│   ├── IngredientsInput.tsx     # Input dla składników
│   │   └── → ui: Button, Input, Label
│   │
│   ├── GeneratedRecipePreview.tsx  # Podgląd wygenerowanego przepisu
│   │   ├── → AcceptRejectButtons
│   │   └── → ui: Card, Badge
│   │
│   ├── AcceptRejectButtons.tsx  # Przyciski akceptacji/odrzucenia
│   │   └── → ui: Button, CardFooter
│   │
│   ├── LoadingSpinner.tsx       # Spinner podczas generowania
│   │   └── → ui: Card
│   │
│   └── ErrorMessage.tsx         # Komunikat błędu
│       └── → ui: Button, Card
│
├── auth/                        # Komponenty autoryzacji
│   ├── LoginForm.tsx
│   │   └── → ui: Button, Input, Label, Card
│   │
│   ├── RegisterForm.tsx
│   │   └── → ui: Button, Input, Label, Card
│   │
│   ├── ResetPasswordForm.tsx
│   │   └── → ui: Button, Input, Label, Card
│   │
│   └── UpdatePasswordForm.tsx
│       └── → ui: Button, Input, Label, Card
│
├── common/                      # Komponenty wspólne
│   ├── UserMenu.tsx             # Menu użytkownika
│   │   └── → ui: Button, DropdownMenu
│   │
│   ├── LogoutButton.tsx         # Przycisk wylogowania
│   │   └── → ui: Button
│   │
│   └── ModeToggle.tsx           # Przełącznik trybu (dark/light)
│       └── → ui: Button
│
├── dashboard/                   # Komponenty dashboardu
│   ├── DashboardContent.tsx     # Główny kontener dashboardu
│   │   ├── → WelcomeSection
│   │   ├── → QuickActions
│   │   ├── → RecentRecipesList
│   │   └── → useDashboard (hook)
│   │
│   ├── WelcomeSection.tsx       # Sekcja powitalna
│   │   ├── → UserStats
│   │   └── → ui: Card
│   │
│   ├── UserStats.tsx            # Statystyki użytkownika
│   │   └── → StatCard
│   │
│   ├── QuickActions.tsx         # Szybkie akcje
│   │   └── → ui: Button
│   │
│   ├── RecentRecipesList.tsx    # Lista ostatnich przepisów
│   │   ├── → RecipeCard
│   │   ├── → RecipeListSkeleton
│   │   ├── → EmptyState
│   │   └── → ui: Button
│   │
│   ├── RecipeListSkeleton.tsx   # Skeleton loading
│   │   └── → RecipeCard
│   │
│   └── card/
│       ├── RecipeCard.tsx       # Karta przepisu
│       │   ├── → ui: Card, Button, DropdownMenu, AlertDialog
│       │   └── → lib/utils (text-formatter, date-formatter)
│       │
│       └── StatCard.tsx         # Karta statystyki
│           └── → ui: Card
│
│   └── utils/
│       └── EmptyState.tsx       # Stan pusty
│
├── onboarding/                  # Komponenty onboardingu
│   ├── OnboardingForm.tsx       # Główny formularz onboardingu
│   │   ├── → ProgressBar
│   │   ├── → DietTypeStep
│   │   ├── → PreferencesStep
│   │   ├── → ui: Card
│   │   └── → useOnboardingForm (hook)
│   │
│   ├── ProgressBar.tsx          # Pasek postępu
│   │   └── → ui: Progress
│   │
│   ├── DietTypeStep.tsx         # Krok wyboru typu diety
│   │   └── → ui: Button, Label, Select
│   │
│   ├── PreferencesStep.tsx      # Krok preferencji
│   │   └── → ui: Button, Input, Label, Textarea
│   │
│   └── types.ts                 # Typy dla onboardingu
│
├── profile/                     # Komponenty profilu
│   ├── ProfileContent.tsx       # Główny kontener profilu
│   │   ├── → ProfileHeader
│   │   ├── → ProfileInfo
│   │   ├── → LastModifiedDate
│   │   ├── → EditPreferencesDialog
│   │   └── → ui: Card, Button, Skeleton
│   │
│   ├── ProfileHeader.tsx        # Nagłówek profilu
│   │   └── → ui: Button
│   │
│   ├── ProfileInfo.tsx          # Informacje o profilu
│   │   └── → PreferenceCard
│   │
│   ├── PreferenceCard.tsx       # Karta preferencji
│   │   └── → ui: Card
│   │
│   ├── LastModifiedDate.tsx     # Data ostatniej modyfikacji
│   │
│   ├── EditPreferencesDialog.tsx  # Dialog edycji preferencji
│   │   ├── → EditPreferencesForm
│   │   └── → ui: Dialog
│   │
│   └── EditPreferencesForm.tsx  # Formularz edycji preferencji
│       └── → ui: Button, Textarea, Label, Select
│
├── recipes/                     # Komponenty przepisów
│   │
│   ├── DeleteRecipeDialog.tsx   # Dialog usuwania przepisu
│   │   └── → ui: AlertDialog
│   │
│   ├── view/                    # Komponenty widoku listy przepisów
│   │   ├── RecipesListContent.tsx  # Główny kontener listy
│   │   │   ├── → RecipesSearchBar
│   │   │   ├── → RecipesTable
│   │   │   ├── → PaginationControls
│   │   │   ├── → RecipeListSkeleton (dashboard)
│   │   │   ├── → EmptyState (dashboard)
│   │   │   ├── → ui: Button
│   │   │   └── → useRecipesList (hook)
│   │   │
│   │   ├── RecipesSearchBar.tsx  # Pasek wyszukiwania
│   │   │   └── → ui: Input
│   │   │
│   │   ├── RecipesTable.tsx     # Tabela przepisów
│   │   │   ├── → ui: Table, Button, AlertDialog
│   │   │
│   │   └── PaginationControls.tsx  # Kontrolki paginacji
│   │       └── → ui: Button
│   │
│   ├── edit/                    # Komponenty edycji przepisu
│   │   ├── RecipeDetailContent.tsx  # Główny kontener szczegółów
│   │   │   ├── → RecipeHeader
│   │   │   ├── → RecipeAccordionSection
│   │   │   ├── → RecipeActions
│   │   │   ├── → EditRecipeDialog
│   │   │   ├── → DeleteRecipeDialog
│   │   │   └── → ui: Button, Accordion
│   │   │
│   │   ├── RecipeHeader.tsx     # Nagłówek przepisu
│   │   │
│   │   ├── RecipeAccordionSection.tsx  # Sekcja accordion
│   │   │   └── → ui: Accordion
│   │   │
│   │   ├── RecipeActions.tsx    # Akcje na przepisie
│   │   │   └── → ui: Button
│   │   │
│   │   ├── EditRecipeDialog.tsx  # Dialog edycji przepisu
│   │   │   └── → ui: Dialog, Button, Input, Label, Textarea
│   │   │
│   │   └── DeleteRecipeDialog.tsx  # Dialog usuwania przepisu
│   │       └── → ui: AlertDialog
│   │
│   └── new/                     # Komponenty tworzenia przepisu
│       └── NewRecipeForm.tsx    # Formularz nowego przepisu
│           └── → ui: Button, Input, Label, Textarea, Card
│
└── ui/                          # Komponenty UI (Shadcn/ui)
    ├── accordion.tsx
    ├── alert-dialog.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── input.tsx
    ├── label.tsx
    ├── progress.tsx
    ├── select.tsx
    ├── skeleton.tsx
    ├── switch.tsx
    ├── table.tsx
    └── textarea.tsx
```

## Zależności zewnętrzne

### Hooks (src/hooks/)
- `useAIGeneration` → używany przez: `AIGenerateContent`
- `useDashboard` → używany przez: `DashboardContent`
- `useOnboardingForm` → używany przez: `OnboardingForm`
- `useRecipesList` → używany przez: `RecipesListContent`

### Typy (src/types.ts)
- Używane przez wszystkie komponenty do typowania props i danych

### Biblioteki zewnętrzne
- `react-hook-form` → używane w formularzach
- `sonner` (toast) → używane do powiadomień
- `lucide-react` → ikony
- `@/lib/utils` → funkcje pomocnicze (formatowanie dat, tekstu)

## Hierarchia głównych komponentów

```
Strony (Astro) → Komponenty kontenerowe → Komponenty funkcjonalne → Komponenty UI

Przykład:
index.astro → DashboardContent → WelcomeSection → UserStats → StatCard → ui/Card
```

## Grupy funkcjonalne

1. **AI Generation** (ai/)
   - AIGenerateContent (orchestracja)
   - GenerationForm, IngredientsInput (formularz)
   - GeneratedRecipePreview, AcceptRejectButtons (wynik)

2. **Dashboard** (dashboard/)
   - DashboardContent (orchestracja)
   - WelcomeSection, UserStats (statystyki)
   - RecentRecipesList (lista)

3. **Profile** (profile/)
   - ProfileContent (orchestracja)
   - ProfileInfo, PreferenceCard (wyświetlanie)
   - EditPreferencesDialog, EditPreferencesForm (edycja)

4. **Recipes** (recipes/)
   - RecipesListContent (lista)
   - RecipeDetailContent (szczegóły)
   - NewRecipeForm (tworzenie)

5. **Onboarding** (onboarding/)
   - OnboardingForm (orchestracja)
   - DietTypeStep, PreferencesStep (kroki)

6. **Auth** (auth/)
   - LoginForm, RegisterForm, ResetPasswordForm, UpdatePasswordForm

7. **Common** (common/)
   - UserMenu, LogoutButton, ModeToggle

