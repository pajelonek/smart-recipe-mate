import { useRecipesList } from "@/hooks/useRecipesList";
import { RecipesSearchBar } from "./RecipesSearchBar";
import { RecipesTable } from "./RecipesTable";
import { PaginationControls } from "./PaginationControls";
import { RecipeListSkeleton } from "../../dashboard/RecipeListSkeleton";
import { EmptyState } from "../../dashboard/utils/EmptyState";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/types";

interface RecipesListContentProps {
  readonly accessToken: string;
  readonly initialRecipes?: Recipe[];
}

export function RecipesListContent({ accessToken, initialRecipes = [] }: Readonly<RecipesListContentProps>) {
  const {
    recipes,
    isLoading,
    error,
    searchQuery,
    currentPage,
    totalPages,
    setSearchQuery,
    setCurrentPage,
    deleteRecipe,
  } = useRecipesList({
    accessToken,
    initialRecipes,
  });

  const handleView = (recipeId: string) => {
    globalThis.location.href = `/recipes/${recipeId}`;
  };

  const handleAddRecipe = () => {
    globalThis.location.href = "/recipes/new";
  };

  const handleGenerateAI = () => {
    globalThis.location.href = "/ai/generate";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <RecipesSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <RecipeListSkeleton count={10} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <RecipesSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => globalThis.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    const isEmptyFromSearch = searchQuery.trim().length > 0;

    return (
      <div className="space-y-4">
        {isEmptyFromSearch && (
          <div className="flex justify-end">
            <RecipesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}
        {isEmptyFromSearch ? (
          <EmptyState
            title="No recipes found"
            description={`No recipes found matching "${searchQuery}". Try a different search term.`}
            action={
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No recipes yet"
            description="Get started by creating your first recipe or generating one with AI."
            action={
              <div className="flex gap-4">
                <Button onClick={handleAddRecipe}>Add Recipe</Button>
                <Button variant="outline" onClick={handleGenerateAI}>
                  Generate with AI
                </Button>
              </div>
            }
          />
        )}
      </div>
    );
  }

  // Success state with recipes
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex justify-end">
        <RecipesSearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Recipes table */}
      <RecipesTable recipes={recipes} isLoading={isLoading} onDelete={deleteRecipe} onView={handleView} />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
