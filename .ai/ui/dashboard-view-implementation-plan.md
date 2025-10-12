# Plan implementacji widoku Dashboard (Strona główna)

## 1. Przegląd

Dashboard jest główną stroną aplikacji po zalogowaniu użytkownika. Jego celem jest prezentacja podsumowania zasobów użytkownika wraz z szybkim dostępem do najważniejszych funkcji aplikacji: dodawania przepisów manualnie oraz generowania ich przez AI. Widok wyświetla ostatnio dodane lub edytowane przepisy (5-10 najnowszych), podstawowe statystyki (liczba przepisów, liczba generacji AI) oraz przyciski akcji Call-to-Action. Dashboard służy jako centralny punkt nawigacyjny aplikacji, z którego użytkownik może szybko przejść do szczegółów przepisu, dodać nowy przepis lub wygenerować przepis za pomocą AI.

## 2. Routing widoku

**Ścieżka**: `/`

**Plik**: `src/pages/index.astro`

**Wymagania autoryzacji**:
- Widok wymaga aktywnej sesji użytkownika (JWT token)
- Middleware weryfikuje token i pobiera dane użytkownika
- Jeśli użytkownik nie ma zapisanych preferencji (brak rekordu w `user_preferences`), następuje redirect do `/onboarding`
- Jeśli użytkownik nie jest zalogowany, redirect do `/login`

## 3. Struktura komponentów

```
DashboardPage (Astro)
├── Layout (Astro)
│   ├── Navigation/Sidebar (React)
│   └── DashboardContent (React)
│       ├── WelcomeSection (React)
│       │   ├── WelcomeMessage (React)
│       │   └── UserStats (React)
│       ├── QuickActions (React)
│       │   ├── Button - "Add Recipe" (Shadcn)
│       │   └── Button - "Generate with AI" (Shadcn)
│       └── RecentRecipesList (React)
│           ├── RecipeCard (React) [×5-10]
│           │   ├── RecipeTitle
│           │   ├── RecipeSummary
│           │   ├── RecipeMetadata (date, tags)
│           │   └── RecipeActions (view, edit, delete)
│           └── EmptyState (React) - gdy brak przepisów
```

## 4. Szczegóły komponentów

### 4.1 DashboardPage (Astro Component)

**Opis**: Główny komponent strony Dashboard odpowiedzialny za server-side rendering, pobieranie danych użytkownika i przepisów, walidację autoryzacji oraz przekazanie danych do interaktywnych komponentów React.

**Główne elementy**:
- Weryfikacja sesji użytkownika (middleware)
- Sprawdzenie statusu onboardingu (czy użytkownik ma preferencje)
- Pobranie listy przepisów za pomocą `getUserRecipes()`
- Pobranie statystyk użytkownika (liczba przepisów, liczba generacji AI)
- Renderowanie Layout z zagnieżdżonym DashboardContent

**Obsługiwane interakcje**: 
- N/A (server-side component)

**Obsługiwana walidacja**:
- Weryfikacja tokenu JWT w middleware
- Sprawdzenie istnienia user_preferences (redirect do /onboarding jeśli brak)
- Weryfikacja uprawnień użytkownika do zasobów

**Typy**:
- `User` (z Supabase Auth)
- `Recipe[]` (z types.ts)
- `DashboardData` (ViewModel)

**Propsy**: 
- N/A (root Astro page)

### 4.2 DashboardContent (React Component)

**Opis**: Główny kontener dla treści dashboardu. Zarządza layoutem i organizuje wszystkie sekcje widoku (powitanie, statystyki, quick actions, lista przepisów). Odpowiada za zarządzanie stanem ładowania i błędów.

**Główne elementy**:
```tsx
<div className="dashboard-content">
  <WelcomeSection user={user} stats={stats} />
  <QuickActions />
  <RecentRecipesList recipes={recipes} isLoading={isLoading} />
</div>
```

**Obsługiwane interakcje**:
- Odświeżanie listy przepisów po akcjach (dodanie, edycja, usunięcie)

**Obsługiwana walidacja**:
- N/A (delegowana do komponentów dzieci)

**Typy**:
- `DashboardContentProps`
- `Recipe[]`
- `UserStats`

**Propsy**:
```typescript
interface DashboardContentProps {
  initialRecipes: Recipe[];
  initialStats: UserStats;
  userName: string;
}
```

### 4.3 WelcomeSection (React Component)

**Opis**: Sekcja powitalna wyświetlająca spersonalizowaną wiadomość dla użytkownika oraz karty z podstawowymi statystykami (liczba przepisów, liczba generacji AI). Komponent wykorzystuje Card z Shadcn/ui.

**Główne elementy**:
```tsx
<section className="welcome-section">
  <Card>
    <CardHeader>
      <CardTitle>Welcome back, {userName}!</CardTitle>
      <CardDescription>Here's your recipe collection overview</CardDescription>
    </CardHeader>
    <CardContent>
      <UserStats stats={stats} />
    </CardContent>
  </Card>
</section>
```

**Obsługiwane interakcje**:
- N/A (komponent prezentacyjny)

**Obsługiwana walidacja**:
- N/A

**Typy**:
- `WelcomeSectionProps`
- `UserStats`

**Propsy**:
```typescript
interface WelcomeSectionProps {
  userName: string;
  stats: UserStats;
}
```

### 4.4 UserStats (React Component)

**Opis**: Komponent wyświetlający karty ze statystykami użytkownika w formacie grid (liczba przepisów, liczba generacji AI). Każda statystyka wyświetlana jest w osobnej karcie z ikoną, wartością liczbową i opisem.

**Główne elementy**:
```tsx
<div className="stats-grid">
  <StatCard 
    icon={<ChefHat />} 
    value={stats.recipesCount} 
    label="Total Recipes" 
  />
  <StatCard 
    icon={<Sparkles />} 
    value={stats.generationsCount} 
    label="AI Generations" 
  />
</div>
```

**Obsługiwane interakcje**:
- Możliwy klik na karcie do przejścia do odpowiedniej sekcji (opcjonalne enhancement)

**Obsługiwana walidacja**:
- Walidacja czy stats są zdefiniowane (fallback do 0)

**Typy**:
- `UserStatsProps`
- `UserStats`

**Propsy**:
```typescript
interface UserStatsProps {
  stats: UserStats;
}
```

### 4.5 QuickActions (React Component)

**Opis**: Sekcja z głównymi przyciskami akcji (CTA) umożliwiającymi szybkie dodanie nowego przepisu ręcznie lub wygenerowanie przepisu przez AI. Wykorzystuje Button z Shadcn/ui.

**Główne elementy**:
```tsx
<div className="quick-actions">
  <Button 
    onClick={handleAddRecipe} 
    size="lg" 
    variant="default"
  >
    <PlusCircle className="mr-2" />
    Add Recipe
  </Button>
  <Button 
    onClick={handleGenerateAI} 
    size="lg" 
    variant="secondary"
  >
    <Sparkles className="mr-2" />
    Generate with AI
  </Button>
</div>
```

**Obsługiwane interakcje**:
- Klik na "Add Recipe" → przekierowanie do `/recipes/new`
- Klik na "Generate with AI" → przekierowanie do `/ai/generate`

**Obsługiwana walidacja**:
- N/A (przyciski zawsze aktywne dla zalogowanego użytkownika)

**Typy**:
- Brak specyficznych typów (komponent bezstanowy)

**Propsy**:
```typescript
interface QuickActionsProps {
  // Opcjonalnie można przekazać custom handlers
  onAddRecipe?: () => void;
  onGenerateAI?: () => void;
}
```

### 4.6 RecentRecipesList (React Component)

**Opis**: Lista ostatnio dodanych lub edytowanych przepisów (maksymalnie 10). Komponent wyświetla przepisy w formacie kart (RecipeCard) lub tabelarycznym w zależności od preferencji designu. Obsługuje stan ładowania (loading skeletons) oraz stan pusty (EmptyState) gdy użytkownik nie ma jeszcze przepisów.

**Główne elementy**:
```tsx
<section className="recent-recipes">
  <div className="section-header">
    <h2>Recent Recipes</h2>
    <Button variant="ghost" onClick={handleViewAll}>
      View All →
    </Button>
  </div>
  
  {isLoading ? (
    <RecipeListSkeleton count={5} />
  ) : recipes.length === 0 ? (
    <EmptyState 
      title="No recipes yet"
      description="Start by adding your first recipe or generate one with AI"
      action={<QuickActions />}
    />
  ) : (
    <div className="recipes-grid">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} />
      ))}
    </div>
  )}
</section>
```

**Obsługiwane interakcje**:
- Klik na RecipeCard → przekierowanie do `/recipes/{id}`
- Klik na "View All" → przekierowanie do `/recipes`
- Klik na delete w RecipeCard → wywołanie handleDelete

**Obsługiwana walidacja**:
- Sprawdzenie czy recipes jest zdefiniowane i jest tablicą
- Walidacja czy recipe.id istnieje dla każdego elementu (key prop)

**Typy**:
- `RecentRecipesListProps`
- `Recipe[]`

**Propsy**:
```typescript
interface RecentRecipesListProps {
  recipes: Recipe[];
  isLoading?: boolean;
  onDelete?: (recipeId: string) => Promise<void>;
}
```

### 4.7 RecipeCard (React Component)

**Opis**: Pojedyncza karta przepisu wyświetlająca podstawowe informacje: tytuł, streszczenie (jeśli istnieje), tagi, datę ostatniej edycji oraz akcje (zobacz, edytuj, usuń). Wykorzystuje Card z Shadcn/ui.

**Główne elementy**:
```tsx
<Card className="recipe-card">
  <CardHeader>
    <div className="flex justify-between items-start">
      <CardTitle>{recipe.title}</CardTitle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleView}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {recipe.summary && (
      <CardDescription>{truncate(recipe.summary, 100)}</CardDescription>
    )}
  </CardHeader>
  <CardContent>
    <div className="recipe-tags">
      {recipe.tags.slice(0, 3).map(tag => (
        <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
      ))}
      {recipe.tags.length > 3 && (
        <Badge variant="outline">+{recipe.tags.length - 3}</Badge>
      )}
    </div>
  </CardContent>
  <CardFooter>
    <span className="text-sm text-muted-foreground">
      Updated {formatDate(recipe.updated_at)}
    </span>
  </CardFooter>
</Card>
```

**Obsługiwane interakcje**:
- Klik na kartę → przekierowanie do `/recipes/{id}`
- Klik na "View" w menu → przekierowanie do `/recipes/{id}`
- Klik na "Edit" w menu → przekierowanie do `/recipes/{id}/edit`
- Klik na "Delete" w menu → wywołanie onDelete z potwierdzeniem (dialog)

**Obsługiwana walidacja**:
- Sprawdzenie czy recipe.title nie jest pusty (wymagane)
- Walidacja istnienia recipe.id przed nawigacją
- Sprawdzenie uprawnień użytkownika przed operacjami (edycja, usunięcie)

**Typy**:
- `RecipeCardProps`
- `Recipe`

**Propsy**:
```typescript
interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (recipeId: string) => Promise<void>;
  onEdit?: (recipeId: string) => void;
  onView?: (recipeId: string) => void;
}
```

### 4.8 EmptyState (React Component)

**Opis**: Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych przepisów. Zawiera ilustrację, tytuł, opis oraz przyciski akcji zachęcające do dodania pierwszego przepisu.

**Główne elementy**:
```tsx
<div className="empty-state">
  <div className="empty-state-icon">
    <ChefHat size={64} />
  </div>
  <h3>{title}</h3>
  <p>{description}</p>
  {action}
</div>
```

**Obsługiwane interakcje**:
- N/A (delegowane do komponentów przekazanych w action)

**Obsługiwana walidacja**:
- N/A

**Typy**:
- `EmptyStateProps`

**Propsy**:
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

### 4.9 RecipeListSkeleton (React Component)

**Opis**: Komponent wyświetlający animowane szkielety (skeletons) podczas ładowania listy przepisów. Poprawia UX przez pokazanie struktury treści zanim dane zostaną załadowane.

**Główne elementy**:
```tsx
<div className="recipes-grid">
  {Array.from({ length: count }).map((_, i) => (
    <Card key={i} className="recipe-card-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-32" />
      </CardFooter>
    </Card>
  ))}
</div>
```

**Obsługiwane interakcje**:
- N/A (komponent prezentacyjny)

**Obsługiwana walidacja**:
- N/A

**Typy**:
- `RecipeListSkeletonProps`

**Propsy**:
```typescript
interface RecipeListSkeletonProps {
  count?: number; // domyślnie 5
}
```

## 5. Typy

### 5.1 Istniejące typy (z types.ts)

```typescript
// Już zdefiniowane w types.ts
export type Recipe = Omit<RecipeEntity, "deleted_at"> & {
  tags: Tag[];
};

export type Tag = Pick<TagEntity, "id" | "name" | "created_at">;

export interface RecipeListResponse {
  recipes: Recipe[];
}
```

### 5.2 Nowe typy ViewModels

```typescript
// Nowy typ: DashboardData (src/types.ts lub dedykowany plik viewmodels)
export interface DashboardData {
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
  stats: UserStats;
  recentRecipes: Recipe[];
}

// Nowy typ: UserStats
export interface UserStats {
  recipesCount: number;
  generationsCount: number;
  // Opcjonalnie w przyszłości:
  // favoriteRecipesCount: number;
  // tagsCount: number;
}

// Props dla komponentów React

export interface DashboardContentProps {
  initialRecipes: Recipe[];
  initialStats: UserStats;
  userName: string;
}

export interface WelcomeSectionProps {
  userName: string;
  stats: UserStats;
}

export interface UserStatsProps {
  stats: UserStats;
}

export interface QuickActionsProps {
  onAddRecipe?: () => void;
  onGenerateAI?: () => void;
}

export interface RecentRecipesListProps {
  recipes: Recipe[];
  isLoading?: boolean;
  onDelete?: (recipeId: string) => Promise<void>;
}

export interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: (recipeId: string) => Promise<void>;
  onEdit?: (recipeId: string) => void;
  onView?: (recipeId: string) => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export interface RecipeListSkeletonProps {
  count?: number;
}

// Typ dla StatCard (używany w UserStats)
export interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick?: () => void;
}
```

### 5.3 Typy pomocnicze

```typescript
// Typy dla utility functions
export type DateFormatOptions = {
  format?: 'relative' | 'absolute';
  locale?: string;
};

export type TruncateOptions = {
  length: number;
  suffix?: string;
};
```

## 6. Zarządzanie stanem

### 6.1 Server-side state (Astro)

**Źródło danych**: 
- Dane pobierane podczas Server-Side Rendering w `src/pages/index.astro`
- Użycie `getUserRecipes()` z `recipes.service.ts`
- Pobranie statystyk użytkownika (count queries)

**Implementacja**:
```typescript
// W src/pages/index.astro
---
import { createServerSupabaseClient } from './db/supabase.client';
import { getUserRecipes } from './lib/services/recipes.service';

const supabase = createServerSupabaseClient(Astro);
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/login');
}

// Sprawdź onboarding
const { data: preferences } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (!preferences) {
  return Astro.redirect('/onboarding');
}

// Pobierz przepisy
const recipes = await getUserRecipes(user.id, supabase);
const recentRecipes = recipes.slice(0, 10);

// Pobierz statystyki
const { count: recipesCount } = await supabase
  .from('recipes')
  .select('*', { count: 'exact', head: true })
  .eq('owner_id', user.id)
  .is('deleted_at', null);

const { count: generationsCount } = await supabase
  .from('ai_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);

const stats: UserStats = {
  recipesCount: recipesCount || 0,
  generationsCount: generationsCount || 0,
};

const dashboardData: DashboardData = {
  user: {
    id: user.id,
    email: user.email!,
    displayName: user.user_metadata?.display_name,
  },
  stats,
  recentRecipes,
};
---
```

### 6.2 Client-side state (React)

**Custom Hook: `useDashboard`**

Zarządzanie stanem po stronie klienta będzie ograniczone, gdyż większość danych pochodzi z SSR. Hook będzie obsługiwał:
- Odświeżanie listy przepisów po akcjach
- Stan ładowania dla operacji async
- Obsługę błędów
- Optymistyczne aktualizacje UI

**Implementacja**:
```typescript
// src/hooks/useDashboard.ts
import { useState, useCallback } from 'react';
import type { Recipe, UserStats } from '../types';

export function useDashboard(
  initialRecipes: Recipe[],
  initialStats: UserStats
) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const data: RecipeListResponse = await response.json();
      setRecipes(data.recipes.slice(0, 10));
      
      // Aktualizuj statystyki
      setStats(prev => ({
        ...prev,
        recipesCount: data.recipes.length,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    // Optymistyczna aktualizacja
    const previousRecipes = recipes;
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    setStats(prev => ({
      ...prev,
      recipesCount: Math.max(0, prev.recipesCount - 1),
    }));

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
    } catch (err) {
      // Rollback przy błędzie
      setRecipes(previousRecipes);
      setStats(prev => ({
        ...prev,
        recipesCount: prev.recipesCount + 1,
      }));
      throw err;
    }
  }, [recipes]);

  return {
    recipes,
    stats,
    isLoading,
    error,
    refreshRecipes,
    deleteRecipe,
  };
}
```

## 7. Integracja API

### 7.1 Endpoint: GET /api/recipes

**Użycie**: Pobranie listy przepisów użytkownika (używane w SSR i opcjonalnie do odświeżania)

**Request**:
- Metoda: `GET`
- Headers: `Authorization: Bearer {jwt_token}` (automatycznie przez Supabase client)
- Query params: Brak (dla dashboardu pobieramy wszystkie, filtrujemy po stronie klienta do 10)

**Response**:
```typescript
// Success 200
{
  recipes: Recipe[] // typ z types.ts
}

// Error 401
{
  error: "Unauthorized",
  message: "Authentication required"
}

// Error 500
{
  error: "Internal Server Error",
  message: "Failed to fetch recipes"
}
```

**Implementacja wywołania**:
```typescript
// Server-side (Astro)
const recipes = await getUserRecipes(user.id, supabase);

// Client-side (React)
const response = await fetch('/api/recipes', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
const data: RecipeListResponse = await response.json();
```

### 7.2 Endpoint: DELETE /api/recipes/:id

**Użycie**: Soft delete przepisu (opcjonalna akcja dostępna z RecipeCard)

**Request**:
- Metoda: `DELETE`
- Headers: `Authorization: Bearer {jwt_token}`
- Path params: `id` (string, UUID)

**Response**:
```typescript
// Success 204
// Brak body

// Error 404
{
  error: "Recipe not found",
  message: "Recipe does not exist or has already been deleted"
}

// Error 403
{
  error: "Access denied",
  message: "You can only delete your own recipes"
}
```

**Implementacja wywołania**:
```typescript
// Client-side (React)
const response = await fetch(`/api/recipes/${recipeId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}
```

### 7.3 Pobieranie statystyk (Custom queries)

**Użycie**: Pobranie liczby przepisów i generacji AI (tylko SSR)

**Implementacja**:
```typescript
// Server-side (Astro)
const { count: recipesCount } = await supabase
  .from('recipes')
  .select('*', { count: 'exact', head: true })
  .eq('owner_id', user.id)
  .is('deleted_at', null);

const { count: generationsCount } = await supabase
  .from('ai_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);
```

## 8. Interakcje użytkownika

### 8.1 Nawigacja do dodawania przepisu

**Trigger**: Klik na przycisk "Add Recipe" w QuickActions

**Flow**:
1. Użytkownik klika przycisk "Add Recipe"
2. Następuje nawigacja do `/recipes/new` (Astro.navigate lub link)
3. Użytkownik widzi formularz dodawania nowego przepisu

**Implementacja**:
```typescript
const handleAddRecipe = () => {
  window.location.href = '/recipes/new';
};
```

### 8.2 Nawigacja do generowania AI

**Trigger**: Klik na przycisk "Generate with AI" w QuickActions

**Flow**:
1. Użytkownik klika przycisk "Generate with AI"
2. Następuje nawigacja do `/ai/generate`
3. Użytkownik widzi formularz generowania przepisu AI

**Implementacja**:
```typescript
const handleGenerateAI = () => {
  window.location.href = '/ai/generate';
};
```

### 8.3 Wyświetlenie szczegółów przepisu

**Trigger**: Klik na RecipeCard lub opcję "View" w menu

**Flow**:
1. Użytkownik klika na kartę przepisu lub wybiera "View" z menu
2. Następuje nawigacja do `/recipes/{id}`
3. Użytkownik widzi pełne szczegóły przepisu

**Implementacja**:
```typescript
const handleViewRecipe = (recipeId: string) => {
  window.location.href = `/recipes/${recipeId}`;
};
```

### 8.4 Edycja przepisu

**Trigger**: Klik na opcję "Edit" w menu RecipeCard

**Flow**:
1. Użytkownik wybiera "Edit" z menu dropdown
2. Następuje nawigacja do `/recipes/{id}/edit`
3. Użytkownik widzi formularz edycji przepisu

**Implementacja**:
```typescript
const handleEditRecipe = (recipeId: string) => {
  window.location.href = `/recipes/${recipeId}/edit`;
};
```

### 8.5 Usunięcie przepisu

**Trigger**: Klik na opcję "Delete" w menu RecipeCard

**Flow**:
1. Użytkownik wybiera "Delete" z menu dropdown
2. System wyświetla dialog potwierdzenia (AlertDialog z Shadcn)
   - Tytuł: "Delete Recipe?"
   - Opis: "Are you sure you want to delete '{recipe.title}'? This action cannot be undone."
   - Przyciski: "Cancel" i "Delete"
3. Po potwierdzeniu:
   - Wywołanie API DELETE /api/recipes/{id}
   - Optymistyczna aktualizacja UI (usunięcie karty z listy)
   - Wyświetlenie toast notification: "Recipe deleted successfully"
4. W przypadku błędu:
   - Rollback optymistycznej aktualizacji
   - Wyświetlenie toast error: "Failed to delete recipe: {error message}"

**Implementacja**:
```typescript
const handleDeleteRecipe = async (recipeId: string) => {
  const confirmed = await showDeleteDialog(recipe.title);
  
  if (!confirmed) return;
  
  try {
    await deleteRecipe(recipeId);
    showToast({
      title: 'Recipe deleted',
      description: 'Recipe deleted successfully',
      variant: 'success',
    });
  } catch (err) {
    showToast({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to delete recipe',
      variant: 'destructive',
    });
  }
};
```

### 8.6 Odświeżenie listy przepisów

**Trigger**: Powrót do dashboardu po dodaniu/edycji przepisu

**Flow**:
1. Użytkownik wraca do dashboardu po akcji na przepisie
2. System automatycznie odświeża stronę (standard Astro navigation)
3. SSR pobiera zaktualizowaną listę przepisów
4. Użytkownik widzi aktualny stan danych

**Uwaga**: W przypadku SPA-like behavior można użyć `refreshRecipes()` z hooka.

### 8.7 Nawigacja do pełnej listy przepisów

**Trigger**: Klik na przycisk "View All" w sekcji RecentRecipesList

**Flow**:
1. Użytkownik klika "View All →"
2. Następuje nawigacja do `/recipes`
3. Użytkownik widzi pełną listę przepisów z wyszukiwaniem i filtrowaniem

**Implementacja**:
```typescript
const handleViewAll = () => {
  window.location.href = '/recipes';
};
```

## 9. Warunki i walidacja

### 9.1 Warunki na poziomie strony (Astro middleware/page)

**Walidacja autoryzacji**:
```typescript
// Middleware: src/middleware/index.ts
const { data: { user } } = await supabase.auth.getUser();

if (!user && !isPublicRoute(pathname)) {
  return context.redirect('/login');
}
```

**Walidacja onboardingu**:
```typescript
// src/pages/index.astro
const { data: preferences } = await supabase
  .from('user_preferences')
  .select('user_id')
  .eq('user_id', user.id)
  .single();

if (!preferences && pathname === '/') {
  return Astro.redirect('/onboarding');
}
```

**Warunki wyświetlania**:
- Dashboard jest dostępny tylko dla zalogowanych użytkowników z ukończonym onboardingiem
- Jeśli użytkownik nie ma preferencji → redirect do `/onboarding`
- Jeśli użytkownik nie jest zalogowany → redirect do `/login`

### 9.2 Warunki na poziomie komponentów

**RecentRecipesList**:
- **Warunek**: `recipes.length === 0`
  - **Akcja**: Wyświetl EmptyState z komunikatem i przyciskami CTA
  - **Komponenty**: EmptyState
  
- **Warunek**: `isLoading === true`
  - **Akcja**: Wyświetl RecipeListSkeleton
  - **Komponenty**: RecipeListSkeleton
  
- **Warunek**: `recipes.length > 0`
  - **Akcja**: Wyświetl grid z RecipeCard dla każdego przepisu (max 10)
  - **Komponenty**: RecipeCard

**RecipeCard**:
- **Warunek**: `recipe.summary` istnieje
  - **Akcja**: Wyświetl CardDescription z skróconym tekstem (max 100 znaków)
  
- **Warunek**: `recipe.tags.length > 3`
  - **Akcja**: Wyświetl pierwsze 3 tagi + badge "+X" z pozostałymi
  
- **Warunek**: `recipe.tags.length === 0`
  - **Akcja**: Nie wyświetlaj sekcji tagów lub wyświetl "No tags"

**UserStats**:
- **Warunek**: `stats.recipesCount === undefined || stats.recipesCount === null`
  - **Akcja**: Wyświetl 0 jako fallback
  
- **Warunek**: `stats.generationsCount === undefined || stats.generationsCount === null`
  - **Akcja**: Wyświetl 0 jako fallback

### 9.3 Walidacja uprawnień

**Usuwanie przepisu**:
- **Warunek**: API sprawdza `recipe.owner_id === user.id` przed usunięciem
- **Frontend**: Powinien wyświetlać opcję delete tylko dla przepisów użytkownika (już gwarantowane przez API, które zwraca tylko przepisy użytkownika)

**Edycja przepisu**:
- **Warunek**: API sprawdza `recipe.owner_id === user.id` przed edycją
- **Frontend**: Opcja edit dostępna tylko dla przepisów użytkownika

### 9.4 Walidacja danych

**Recipe.title**:
- **Wymagane**: Tak
- **Min length**: 1
- **Max length**: 200
- **Warunek**: Zawsze wyświetlany, brak szczególnej walidacji na dashboardzie

**Recipe.updated_at**:
- **Wymagane**: Tak (generowane przez bazę)
- **Format**: ISO 8601 timestamp
- **Walidacja**: Formatowanie przy wyświetlaniu (`formatDate()` utility)

**Recipe.tags**:
- **Wymagane**: Nie
- **Max items**: 10
- **Walidacja**: Wyświetl max 3 tagi, resztę jako "+X"

## 10. Obsługa błędów

### 10.1 Błędy autoryzacji (401)

**Scenariusz**: Token JWT wygasł lub jest nieprawidłowy

**Obsługa**:
- Middleware wykrywa brak sesji
- Przekierowanie do `/login`
- Zapisanie intended route w session storage dla powrotu po zalogowaniu

**Implementacja**:
```typescript
// Middleware
if (!user) {
  // Zapisz current path dla redirect po loginie
  const intendedPath = new URL(request.url).pathname;
  // Redirect z parametrem
  return context.redirect(`/login?redirect=${encodeURIComponent(intendedPath)}`);
}
```

### 10.2 Błędy pobierania danych (500)

**Scenariusz**: Błąd połączenia z bazą danych lub Supabase

**Obsługa**:
- Wyświetlenie error boundary lub error page
- Komunikat: "Failed to load dashboard. Please try again."
- Przycisk "Retry" do przeładowania strony

**Implementacja**:
```typescript
// W src/pages/index.astro
try {
  const recipes = await getUserRecipes(user.id, supabase);
  // ... pozostałe dane
} catch (error) {
  console.error('Dashboard load error:', error);
  // Renderuj error state
  return Astro.render('error', {
    message: 'Failed to load dashboard',
    action: 'retry',
  });
}
```

### 10.3 Błędy usuwania przepisu (403, 404, 500)

**Scenariusz 1**: Przepis nie istnieje lub został już usunięty (404)

**Obsługa**:
- Rollback optymistycznej aktualizacji (przywróć kartę)
- Toast notification: "Recipe not found. It may have been already deleted."
- Opcjonalnie: automatyczne odświeżenie listy

**Scenariusz 2**: Brak uprawnień (403)

**Obsługa**:
- Rollback optymistycznej aktualizacji
- Toast notification: "You don't have permission to delete this recipe."
- Odświeżenie listy (przepis nie powinien być widoczny)

**Scenariusz 3**: Błąd serwera (500)

**Obsługa**:
- Rollback optymistycznej aktualizacji
- Toast notification: "Failed to delete recipe. Please try again."
- Przycisk "Retry" w toast (opcjonalnie)

**Implementacja**:
```typescript
const handleDeleteRecipe = async (recipeId: string) => {
  try {
    await deleteRecipe(recipeId);
    showToast({
      title: 'Success',
      description: 'Recipe deleted successfully',
      variant: 'success',
    });
  } catch (err) {
    let message = 'Failed to delete recipe';
    
    if (err instanceof Response) {
      if (err.status === 404) {
        message = 'Recipe not found. It may have been already deleted.';
      } else if (err.status === 403) {
        message = "You don't have permission to delete this recipe.";
      }
    }
    
    showToast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }
};
```

### 10.4 Obsługa braku przepisów (Empty State)

**Scenariusz**: Użytkownik nie ma jeszcze żadnych przepisów

**Obsługa**:
- Wyświetlenie EmptyState z przyjaznym komunikatem
- Przyciski CTA do dodania pierwszego przepisu
- Brak traktowania jako błędu (normalny stan dla nowych użytkowników)

**Implementacja**: Opisana w sekcji RecentRecipesList

### 10.5 Obsługa błędów ładowania statystyk

**Scenariusz**: Błąd podczas pobierania count queries

**Obsługa**:
- Fallback do wartości 0 dla wszystkich statystyk
- Logowanie błędu (console.error)
- Dashboard nadal się wyświetla, tylko statystyki pokazują 0

**Implementacja**:
```typescript
try {
  const { count: recipesCount } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .is('deleted_at', null);
  
  stats.recipesCount = recipesCount || 0;
} catch (error) {
  console.error('Failed to load recipes count:', error);
  stats.recipesCount = 0;
}
```

### 10.6 Obsługa błędów network (offline)

**Scenariusz**: Użytkownik traci połączenie internetowe podczas operacji

**Obsługa**:
- Wykrycie błędu network (catch block)
- Toast notification: "Network error. Please check your connection."
- Zachowanie stanu przed operacją (rollback)
- Możliwość ponowienia po przywróceniu połączenia

**Implementacja**:
```typescript
try {
  await deleteRecipe(recipeId);
} catch (err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    showToast({
      title: 'Network Error',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    });
  } else {
    // Inne błędy
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i struktur danych

**Działania**:
1. Dodaj nowe typy do `src/types.ts`:
   - `DashboardData`
   - `UserStats`
   - Wszystkie Props interfaces dla komponentów
2. Zweryfikuj poprawność importów typów z database (`Recipe`, `Tag`)
3. Utworzenie pliku `src/lib/utils/date-formatter.ts` dla formatowania dat
4. Utworzenie pliku `src/lib/utils/text-formatter.ts` dla truncate funkcji

**Pliki do utworzenia/modyfikacji**:
- `src/types.ts` (modyfikacja)
- `src/lib/utils/date-formatter.ts` (nowy)
- `src/lib/utils/text-formatter.ts` (nowy)

### Krok 2: Implementacja utility functions

**Działania**:
1. Zaimplementuj `formatDate()` do formatowania dat (relative: "2 days ago", absolute: "Oct 12, 2025")
2. Zaimplementuj `truncate()` do skracania tekstu z ellipsis
3. Dodaj testy jednostkowe dla utility functions (opcjonalnie)

**Przykład implementacji**:
```typescript
// src/lib/utils/date-formatter.ts
export function formatDate(
  dateString: string, 
  options: DateFormatOptions = {}
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (options.format === 'relative' || !options.format) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

### Krok 3: Stworzenie podstawowych komponentów prezentacyjnych

**Działania**:
1. Utworzenie `src/components/dashboard/EmptyState.tsx`
2. Utworzenie `src/components/dashboard/RecipeListSkeleton.tsx`
3. Utworzenie `src/components/dashboard/StatCard.tsx`
4. Instalacja wymaganych ikon: `lucide-react` (jeśli nie zainstalowane)

**Pliki do utworzenia**:
- `src/components/dashboard/EmptyState.tsx`
- `src/components/dashboard/RecipeListSkeleton.tsx`
- `src/components/dashboard/StatCard.tsx`

### Krok 4: Implementacja komponentów UI dla przepisów

**Działania**:
1. Utworzenie `src/components/dashboard/RecipeCard.tsx`
   - Implementacja layoutu karty z Card z Shadcn
   - Dodanie DropdownMenu dla akcji (view, edit, delete)
   - Implementacja wyświetlania tagów (max 3 + badge)
   - Formatowanie daty aktualizacji
2. Dodanie potrzebnych komponentów Shadcn (jeśli nie istnieją):
   - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
   - Badge
   - Skeleton

**Komendy**:
```bash
npx shadcn@latest add card
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add alert-dialog
```

**Pliki do utworzenia**:
- `src/components/dashboard/RecipeCard.tsx`

### Krok 5: Implementacja komponentu listy przepisów

**Działania**:
1. Utworzenie `src/components/dashboard/RecentRecipesList.tsx`
2. Implementacja logiki warunkowego renderowania:
   - Loading state → RecipeListSkeleton
   - Empty state → EmptyState
   - Success state → Grid z RecipeCard
3. Implementacja obsługi akcji delete (props callback)
4. Dodanie nagłówka sekcji z przyciskiem "View All"

**Pliki do utworzenia**:
- `src/components/dashboard/RecentRecipesList.tsx`

### Krok 6: Implementacja sekcji statystyk i powitalnej

**Działania**:
1. Utworzenie `src/components/dashboard/UserStats.tsx`
   - Grid layout dla StatCard
   - Przekazanie danych stats do StatCard
2. Utworzenie `src/components/dashboard/WelcomeSection.tsx`
   - Card z komunikatem powitalnym
   - Zagnieżdżenie UserStats
   - Personalizacja z userName

**Pliki do utworzenia**:
- `src/components/dashboard/UserStats.tsx`
- `src/components/dashboard/WelcomeSection.tsx`

### Krok 7: Implementacja Quick Actions

**Działania**:
1. Utworzenie `src/components/dashboard/QuickActions.tsx`
2. Dodanie dwóch Button z Shadcn
3. Implementacja nawigacji do `/recipes/new` i `/ai/generate`
4. Dodanie ikon z lucide-react

**Pliki do utworzenia**:
- `src/components/dashboard/QuickActions.tsx`

### Krok 8: Implementacja głównego kontenera Dashboard

**Działania**:
1. Utworzenie `src/components/dashboard/DashboardContent.tsx`
2. Kompozycja wszystkich sekcji:
   - WelcomeSection
   - QuickActions
   - RecentRecipesList
3. Implementacja custom hooka `useDashboard`
4. Przekazanie handlers do komponentów dzieci

**Pliki do utworzenia**:
- `src/components/dashboard/DashboardContent.tsx`
- `src/hooks/useDashboard.ts`

### Krok 9: Implementacja custom hooka useDashboard

**Działania**:
1. Utworzenie `src/hooks/useDashboard.ts`
2. Implementacja state management:
   - `recipes` state
   - `stats` state
   - `isLoading` state
   - `error` state
3. Implementacja funkcji:
   - `refreshRecipes()` - ponowne pobranie z API
   - `deleteRecipe()` - usunięcie z optymistycznym update
4. Error handling i rollback logic

**Pliki do utworzenia**:
- `src/hooks/useDashboard.ts`

### Krok 10: Dodanie komponentów Shadcn dla dialogs i toasts

**Działania**:
1. Instalacja AlertDialog dla potwierdzenia usunięcia
2. Instalacja Toast/Sonner dla notyfikacji
3. Dodanie ToastProvider do layoutu (jeśli nie istnieje)

**Komendy**:
```bash
npx shadcn@latest add alert-dialog
npx shadcn@latest add toast
# lub
npm install sonner
```

**Pliki do modyfikacji**:
- `src/layouts/Layout.astro` (dodanie Toaster)

### Krok 11: Implementacja strony Astro (SSR)

**Działania**:
1. Modyfikacja `src/pages/index.astro`
2. Implementacja server-side logic:
   - Weryfikacja użytkownika (auth)
   - Check onboarding status → redirect jeśli brak
   - Pobranie przepisów przez `getUserRecipes()`
   - Pobranie statystyk (count queries)
   - Przygotowanie `DashboardData`
3. Przekazanie danych do DashboardContent
4. Renderowanie w Layout

**Przykład implementacji**:
```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import DashboardContent from '../components/dashboard/DashboardContent';
import { createServerSupabaseClient } from '../db/supabase.client';
import { getUserRecipes } from '../lib/services/recipes.service';
import type { UserStats } from '../types';

const supabase = createServerSupabaseClient(Astro);
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/login');
}

// Check onboarding
const { data: preferences } = await supabase
  .from('user_preferences')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle();

if (!preferences) {
  return Astro.redirect('/onboarding');
}

// Fetch recipes
const recipes = await getUserRecipes(user.id, supabase);
const recentRecipes = recipes.slice(0, 10);

// Fetch stats
const { count: recipesCount } = await supabase
  .from('recipes')
  .select('*', { count: 'exact', head: true })
  .eq('owner_id', user.id)
  .is('deleted_at', null);

const { count: generationsCount } = await supabase
  .from('ai_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);

const stats: UserStats = {
  recipesCount: recipesCount || 0,
  generationsCount: generationsCount || 0,
};

const userName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
---

<Layout title="Dashboard - HealthyMeal">
  <DashboardContent 
    client:load
    initialRecipes={recentRecipes}
    initialStats={stats}
    userName={userName}
  />
</Layout>
```

**Pliki do modyfikacji**:
- `src/pages/index.astro`

### Krok 12: Implementacja middleware dla ochrony route

**Działania**:
1. Weryfikacja czy `src/middleware/index.ts` istnieje
2. Dodanie logiki sprawdzania autoryzacji dla `/` route
3. Redirect do login jeśli brak sesji
4. Sprawdzenie onboarding dla dashboardu

**Przykład middleware**:
```typescript
// src/middleware/index.ts
import { defineMiddleware } from 'astro:middleware';
import { createServerSupabaseClient } from '../db/supabase.client';

const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);
  
  // Skip auth for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return next();
  }
  
  const supabase = createServerSupabaseClient(context);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
  
  // Store user in locals for access in pages
  context.locals.user = user;
  context.locals.supabase = supabase;
  
  return next();
});
```

**Pliki do modyfikacji**:
- `src/middleware/index.ts`

### Krok 13: Stylowanie i responsywność

**Działania**:
1. Dodanie custom styles w `src/styles/global.css` jeśli potrzebne
2. Weryfikacja responsywności wszystkich komponentów
3. Testowanie na różnych rozmiarach ekranu:
   - Desktop: Grid 2-3 kolumny
   - Tablet: Grid 2 kolumny
   - Mobile: Single column
4. Dodanie Tailwind breakpoints gdzie potrzeba

**Przykład responsive grid**:
```tsx
<div className="recipes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Recipe cards */}
</div>
```

### Krok 14: Testowanie integracji

**Działania**:
1. Test flow autoryzacji:
   - Niezalogowany użytkownik → redirect do login
   - Zalogowany bez onboarding → redirect do onboarding
   - Zalogowany z onboardingiem → wyświetlenie dashboardu
2. Test wyświetlania:
   - Stan z przepisami (5-10 kart)
   - Stan pusty (EmptyState)
   - Stan ładowania (skeletons)
3. Test interakcji:
   - Klik na RecipeCard → nawigacja do szczegółów
   - Klik na "Add Recipe" → nawigacja do formularza
   - Klik na "Generate with AI" → nawigacja do generatora
   - Klik na "Delete" → dialog → usunięcie → toast
4. Test błędów:
   - Błąd API podczas usuwania
   - Błąd network
   - Wygasła sesja

### Krok 15: Optymalizacje i poprawki

**Działania**:
1. Dodanie loading states dla wszystkich async operacji
2. Implementacja proper error boundaries (opcjonalnie)
3. Optymalizacja zapytań do bazy (już zoptymalizowane w service)
4. Dodanie analytics events (opcjonalnie):
   - Dashboard viewed
   - Recipe clicked
   - Add recipe clicked
   - Generate AI clicked
5. Weryfikacja accessibility:
   - ARIA labels dla przycisków
   - Keyboard navigation
   - Screen reader support

### Krok 16: Dokumentacja i code review

**Działania**:
1. Dodanie JSDoc komentarzy do wszystkich komponentów
2. Dokumentacja Props interfaces
3. Aktualizacja README jeśli potrzebne
4. Code review według guidelines:
   - Early returns
   - Error handling
   - Type safety
   - Clean code practices
5. Commit zmian z opisowymi commit messages

### Krok 17: Deploy i monitoring

**Działania**:
1. Merge do głównej gałęzi
2. Deploy na środowisko produkcyjne
3. Monitorowanie błędów (Sentry, LogRocket, etc.)
4. Weryfikacja metryk wydajności (Lighthouse)
5. Zbieranie feedbacku użytkowników

---

## Podsumowanie

Plan implementacji widoku Dashboard obejmuje:
- **17 kroków** systematycznej implementacji od typów do deploymentu
- **13 komponentów React** (prezentacyjne i kontenerowe)
- **1 custom hook** do zarządzania stanem
- **1 strona Astro** z SSR dla początkowych danych
- **2 utility moduły** dla formatowania
- Integracja z **2 endpointami API** (GET /api/recipes, DELETE /api/recipes/:id)
- Kompleksowa **obsługa błędów** i walidacja
- **Responsywny design** z Tailwind i Shadcn/ui
- **Accessibility** zgodnie z best practices

Dashboard jest punktem wejścia do aplikacji po zalogowaniu i stanowi centrum nawigacyjne dla wszystkich głównych funkcji systemu.

