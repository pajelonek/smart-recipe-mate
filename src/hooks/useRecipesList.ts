import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Recipe, RecipeListResponse, ApiError } from "../types";

interface UseRecipesListProps {
  accessToken: string;
  initialRecipes?: Recipe[];
}

interface UseRecipesListReturn {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  refreshRecipes: () => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

export function useRecipesList({ accessToken, initialRecipes = [] }: UseRecipesListProps): UseRecipesListReturn {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(initialRecipes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Fetch recipes from API
  const refreshRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || "Failed to fetch recipes");
      }

      const data: RecipeListResponse = await response.json();
      setAllRecipes(data.recipes);
      setCurrentPage(1); // Reset to first page after refresh
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Delete recipe with optimistic update
  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      const previousRecipes = allRecipes;

      // Optimistic update
      setAllRecipes((prev) => prev.filter((r) => r.id !== recipeId));

      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.message || "Failed to delete recipe");
        }

        toast.success("Recipe deleted successfully");
      } catch (err) {
        // Rollback
        setAllRecipes(previousRecipes);
        const message = err instanceof Error ? err.message : "Failed to delete recipe";
        toast.error(message);
        throw err;
      }
    },
    [allRecipes, accessToken]
  );

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allRecipes;
    }

    const query = searchQuery.toLowerCase().trim();
    return allRecipes.filter((recipe) => recipe.title.toLowerCase().includes(query));
  }, [allRecipes, searchQuery]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
  }, [filteredRecipes.length]);

  // Get paginated recipes
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRecipes.slice(startIndex, endIndex);
  }, [filteredRecipes, currentPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Adjust current page if it's out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Load recipes on mount if not provided
  useEffect(() => {
    if (initialRecipes.length === 0) {
      refreshRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    recipes: paginatedRecipes,
    isLoading,
    error,
    searchQuery,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setSearchQuery,
    setCurrentPage,
    refreshRecipes,
    deleteRecipe,
  };
}
