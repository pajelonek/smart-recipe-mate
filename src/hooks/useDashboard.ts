import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Recipe, UserStats, RecipeListResponse } from "../types";

export function useDashboard(initialRecipes: Recipe[], initialStats: UserStats, accessToken: string) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data: RecipeListResponse = await response.json();
      setRecipes(data.recipes.slice(0, 10));

      setStats((prev) => ({
        ...prev,
        recipesCount: data.recipes.length,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      const previousRecipes = recipes;
      const previousStats = stats;

      // Optimistic update
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setStats((prev) => ({
        ...prev,
        recipesCount: Math.max(0, prev.recipesCount - 1),
      }));

      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete recipe");
        }

        toast.success("Recipe deleted successfully");
        // Success - no rollback
      } catch (err) {
        // Rollback
        setRecipes(previousRecipes);
        setStats(previousStats);
        const message = err instanceof Error ? err.message : "Failed to delete recipe";
        toast.error(message);
        throw err;
      }
    },
    [recipes, stats, accessToken]
  );

  return {
    recipes,
    stats,
    isLoading,
    error,
    refreshRecipes,
    deleteRecipe,
  };
}
