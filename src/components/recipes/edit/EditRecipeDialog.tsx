import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipePartialUpdateInputSchema } from "@/lib/validation/recipes.schemas";
import type { Recipe, RecipePartialUpdateInput } from "@/types";
import { toast } from "sonner";

interface EditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
  onSuccess: () => void;
}

export function EditRecipeDialog({ open, onOpenChange, recipe, onSuccess }: Readonly<EditRecipeDialogProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<RecipePartialUpdateInput>({
    resolver: zodResolver(RecipePartialUpdateInputSchema),
    mode: "onChange",
    defaultValues: {
      title: recipe.title,
      summary: recipe.summary || "",
      ingredients: recipe.ingredients,
      preparation: recipe.preparation,
    },
  });

  const handleFieldErrors = (errorData: {
    message?: string;
    details?: { fields?: { path?: string[]; message: string }[] };
  }) => {
    if (errorData.details && Array.isArray(errorData.details.fields)) {
      for (const fieldError of errorData.details.fields) {
        if (fieldError.path?.[0]) {
          const fieldName = fieldError.path[0] as keyof RecipePartialUpdateInput;
          setError(fieldName, {
            type: "manual",
            message: fieldError.message,
          });
        }
      }
      return errorData.message || "Sprawdź błędy walidacji w formularzu.";
    }
    return errorData.message;
  };

  const getStatusBasedError = (status: number) => {
    if (status === 401) return "Twoja sesja wygasła. Zaloguj się ponownie.";
    if (status === 403) return "Nie masz uprawnień do wykonania tej operacji.";
    if (status === 404) return "Przepis nie został znaleziony.";
    if (status === 500) return "Błąd serwera. Spróbuj ponownie później.";
    return "Wystąpił błąd podczas aktualizacji przepisu.";
  };

  const handleApiError = async (response: Response) => {
    let errorMessage = "Wystąpił błąd podczas aktualizacji przepisu.";

    try {
      const errorData = await response.json();
      errorMessage = handleFieldErrors(errorData) || errorMessage;
    } catch {
      errorMessage = getStatusBasedError(response.status);
    }

    setError("root", {
      type: "manual",
      message: errorMessage,
    });
    toast.error(errorMessage);
  };

  const onSubmit = async (data: RecipePartialUpdateInput) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      await response.json();
      toast.success("Przepis został zaktualizowany");
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji przepisu.";
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj przepis</DialogTitle>
          <DialogDescription>Wprowadź zmiany w przepisie i zapisz je</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {errors.root.message}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Tytuł przepisu</Label>
            <Input
              id="edit-title"
              placeholder="np. Spaghetti Carbonara"
              {...register("title")}
              disabled={isSubmitting}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Summary Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-summary">Podsumowanie (opcjonalne)</Label>
            <Textarea
              id="edit-summary"
              placeholder="Krótki opis przepisu..."
              rows={3}
              {...register("summary")}
              disabled={isSubmitting}
              aria-invalid={!!errors.summary}
            />
            {errors.summary && <p className="text-sm text-destructive">{errors.summary.message}</p>}
          </div>

          {/* Ingredients Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-ingredients">Składniki</Label>
            <Textarea
              id="edit-ingredients"
              placeholder="np.&#10;- 500g makaronu spaghetti&#10;- 200g boczku&#10;- 4 jajka&#10;- 100g parmezanu"
              rows={8}
              {...register("ingredients")}
              disabled={isSubmitting}
              aria-invalid={!!errors.ingredients}
            />
            {errors.ingredients && <p className="text-sm text-destructive">{errors.ingredients.message}</p>}
          </div>

          {/* Preparation Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-preparation">Sposób przygotowania</Label>
            <Textarea
              id="edit-preparation"
              placeholder="Szczegółowy opis kroków przygotowania przepisu..."
              rows={10}
              {...register("preparation")}
              disabled={isSubmitting}
              aria-invalid={!!errors.preparation}
            />
            {errors.preparation && <p className="text-sm text-destructive">{errors.preparation.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
