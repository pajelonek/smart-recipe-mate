import React from "react";
import { Button } from "../ui/button";
import { RecipeCard } from "./card/RecipeCard";
import { RecipeListSkeleton } from "./RecipeListSkeleton";
import { EmptyState } from "./utils/EmptyState";
import type { Recipe } from "../../types";

interface RecentRecipesListProps {
  recipes: Recipe[];
  isLoading?: boolean;
  onDelete?: (recipeId: string) => Promise<void>;
}

const handleViewAll = () => {
  window.location.href = "/recipes";
};

export function RecentRecipesList({ recipes, isLoading = false, onDelete }: Readonly<RecentRecipesListProps>) {
  const handleDelete = async (recipeId: string) => {
    if (onDelete) {
      await onDelete(recipeId);
    }
  };

  if (isLoading) {
    return (
      <section className="recent-recipes">
        <RecipeListSkeleton count={5} />
      </section>
    );
  }

  if (recipes.length === 0) {
    return (
      <section className="recent-recipes">
        <EmptyState
          title="No recipes yet"
          description="Start by adding your first recipe or generate one with AI"
          action={
            <div className="flex gap-4">
              <Button onClick={() => (window.location.href = "/recipes/new")}>Add Recipe</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/ai/generate")}>
                Generate with AI
              </Button>
            </div>
          }
        />
      </section>
    );
  }

  return (
    <section className="recent-recipes">
      <div className="section-header flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Recent Recipes</h2>
        <Button variant="ghost" onClick={handleViewAll} className="text-sm">
          View All →
        </Button>
      </div>
      <div className="recipes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe: Recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onDelete={handleDelete}
            onEdit={() => (window.location.href = `/recipes/${recipe.id}/edit`)}
            onView={() => (window.location.href = `/recipes/${recipe.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
