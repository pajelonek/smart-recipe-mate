import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";
import type { Recipe } from "@/types";

interface RecipeHeaderProps {
  recipe: Recipe;
}

export function RecipeHeader({ recipe }: Readonly<RecipeHeaderProps>) {
  return (
    <div className="space-y-4 border-b pb-6">
      <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created {formatDate(recipe.created_at, { format: "absolute" })}</span>
        </div>

        {recipe.updated_at !== recipe.created_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Updated {formatDate(recipe.updated_at, { format: "absolute" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
