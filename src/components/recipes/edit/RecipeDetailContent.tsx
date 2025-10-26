import { useState } from "react";
import { RecipeHeader } from "./RecipeHeader";
import { RecipeAccordionSection } from "./RecipeAccordionSection";
import { RecipeActions } from "./RecipeActions";
import { EditRecipeDialog } from "./EditRecipeDialog";
import { DeleteRecipeDialog } from "./DeleteRecipeDialog";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import type { Recipe } from "@/types";

interface RecipeDetailContentProps {
  readonly recipeId: string;
  readonly initialRecipe: Recipe;
  readonly accessToken: string;
}

export function RecipeDetailContent({ recipeId, initialRecipe }: Readonly<RecipeDetailContentProps>) {
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchRecipe = async (): Promise<Recipe | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/recipes/${recipeId}`);

      if (response.status === 404) {
        const errorData = await response.json();
        setError(errorData.message);
        return null;
      }

      if (response.status === 403) {
        const errorData = await response.json();
        setError(errorData.message);
        return null;
      }

      if (!response.ok) {
        throw new Error("Błąd podczas pobierania przepisu");
      }

      const data = await response.json();
      setRecipe(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Błąd podczas pobierania przepisu";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateSuccess = async () => {
    await fetchRecipe();
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
        throw new Error("Nie udało się usunąć przepisu");
      }

      // Redirect to recipes list
      globalThis.location.href = "/recipes";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć przepisu";
      throw new Error(message);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive mb-2">Błąd</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => (globalThis.location.href = "/recipes")}>Wróć do listy przepisów</Button>
      </div>
    );
  }

  // Loading state
  if (isLoading || !recipe) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecipeHeader recipe={recipe} />

      <Accordion type="multiple" defaultValue={["summary", "ingredients", "preparation"]} className="w-full">
        {recipe.summary && <RecipeAccordionSection title="Podsumowanie" content={recipe.summary} value="summary" />}

        <RecipeAccordionSection title="Składniki" content={recipe.ingredients} value="ingredients" />

        <RecipeAccordionSection title="Sposób przygotowania" content={recipe.preparation} value="preparation" />
      </Accordion>

      <RecipeActions onEdit={handleEdit} onDelete={handleDelete} />

      {isEditDialogOpen && (
        <EditRecipeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          recipe={recipe}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && (
        <DeleteRecipeDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          recipe={recipe}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
