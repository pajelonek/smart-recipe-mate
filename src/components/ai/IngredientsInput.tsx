import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AIGenerateRecipeInput } from "@/types";
import type { FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { useState, useEffect } from "react";

interface IngredientsInputProps {
  readonly watch: UseFormWatch<AIGenerateRecipeInput>;
  readonly setValue: UseFormSetValue<AIGenerateRecipeInput>;
  readonly errors: FieldErrors<AIGenerateRecipeInput>;
  readonly disabled: boolean;
}

/**
 * Dynamic ingredients input component
 * Allows adding/removing ingredient fields (1-20 items)
 * Validates each field in real-time
 */
export function IngredientsInput({ watch, setValue, errors, disabled }: IngredientsInputProps) {
  const ingredients = watch("available_ingredients") || [""];
  const isMaxIngredients = ingredients.length >= 20;
  const hasMinIngredients = ingredients.length >= 1;
  const ingredientsError = errors.available_ingredients;
  const [fieldIds, setFieldIds] = useState<string[]>([]);

  // Maintain stable IDs that persist across re-renders and value changes
  useEffect(() => {
    if (fieldIds.length < ingredients.length) {
      setFieldIds((prevIds) => {
        const newIds = [...prevIds];
        while (newIds.length < ingredients.length) {
          newIds.push(`ingredient-${Date.now()}-${Math.random()}`);
        }
        return newIds;
      });
    } else if (fieldIds.length > ingredients.length) {
      setFieldIds((prevIds) => prevIds.slice(0, ingredients.length));
    }
  }, [ingredients.length, fieldIds.length]);

  const handleAddIngredient = () => {
    if (!isMaxIngredients && !disabled) {
      setValue("available_ingredients", [...ingredients, ""]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    if (disabled) return;

    const newIngredients = ingredients.filter((_, i) => i !== index);

    // Ensure at least one field remains
    if (newIngredients.length === 0) {
      setValue("available_ingredients", [""]);
    } else {
      setValue("available_ingredients", newIngredients);
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setValue("available_ingredients", newIngredients, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="ingredients-0">Dostępne składniki *</Label>
        <p className="text-sm text-muted-foreground">{ingredients.length} / 20</p>
      </div>

      <div className="space-y-3">
        {ingredients.map((ingredient, index) => (
          <div key={fieldIds[index] || `placeholder-${index}`} className="flex gap-2">
            <div className="flex-1">
              <Input
                id={`ingredients-${index}`}
                placeholder={`Składnik ${index + 1}`}
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                disabled={disabled}
                aria-invalid={!!ingredientsError?.[index]}
                aria-required="true"
              />
              {ingredientsError?.[index] && (
                <p className="text-sm text-destructive mt-1">{ingredientsError[index]?.message}</p>
              )}
            </div>
            {ingredients.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveIngredient(index)}
                disabled={disabled}
                aria-label={`Usuń składnik ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {ingredientsError && !Array.isArray(ingredientsError.message) && ingredientsError.message && (
        <p className="text-sm text-destructive">{ingredientsError.message}</p>
      )}

      {!isMaxIngredients && hasMinIngredients && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddIngredient}
          disabled={disabled || isMaxIngredients}
          className="w-full"
        >
          Dodaj składnik
        </Button>
      )}
    </div>
  );
}
