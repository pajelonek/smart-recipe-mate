import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeCreateInputSchema } from "@/lib/validation/recipes.schemas";
import type { RecipeCreateInput } from "@/types";
import { toast } from "sonner";

type NewRecipeFormData = RecipeCreateInput;

export function NewRecipeForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
    reset,
  } = useForm<NewRecipeFormData>({
    resolver: zodResolver(RecipeCreateInputSchema),
    mode: "onChange",
  });

  const handleFormReset = () => {
    reset();
  };

  const handleSuccess = () => {
    handleFormReset();
  };

  const handleFieldErrors = (errorData: {
    message?: string;
    details?: { fields?: { path?: string[]; message: string }[] };
  }) => {
    if (errorData.details && Array.isArray(errorData.details.fields)) {
      for (const fieldError of errorData.details.fields) {
        if (fieldError.path?.[0]) {
          const fieldName = fieldError.path[0] as keyof NewRecipeFormData;
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
    if (status === 500) return "Błąd serwera. Spróbuj ponownie później.";
    return "Wystąpił błąd podczas zapisywania przepisu.";
  };

  const handleApiError = async (response: Response) => {
    let errorMessage = "Wystąpił błąd podczas zapisywania przepisu.";

    try {
      const errorData = await response.json();
      errorMessage = handleFieldErrors(errorData) || errorMessage;
    } catch {
      errorMessage = getStatusBasedError(response.status);
    }

    setError("root.serverError", {
      type: "manual",
      message: errorMessage,
    });
    toast.error(errorMessage);
  };

  const onSubmit = async (data: NewRecipeFormData) => {
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
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
      handleSuccess();
      globalThis.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania przepisu.";
      setError("root.serverError", {
        type: "manual",
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Dodaj nowy przepis</CardTitle>
            <CardDescription>Wypełnij formularz, aby dodać nowy przepis do swojej kolekcji</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {errors.root?.serverError && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                  {errors.root.serverError.message}
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł przepisu *</Label>
                <Input
                  id="title"
                  placeholder="np. Spaghetti Carbonara"
                  {...register("title")}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.title}
                  aria-required="true"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              {/* Summary Field */}
              <div className="space-y-2">
                <Label htmlFor="summary">Podsumowanie (opcjonalne)</Label>
                <Textarea
                  id="summary"
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
                <Label htmlFor="ingredients">Składniki *</Label>
                <Textarea
                  id="ingredients"
                  placeholder="np.&#10;- 500g makaronu spaghetti&#10;- 200g boczku&#10;- 4 jajka&#10;- 100g parmezanu"
                  rows={8}
                  {...register("ingredients")}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.ingredients}
                  aria-required="true"
                />
                {errors.ingredients && <p className="text-sm text-destructive">{errors.ingredients.message}</p>}
              </div>

              {/* Preparation Field */}
              <div className="space-y-2">
                <Label htmlFor="preparation">Sposób przygotowania *</Label>
                <Textarea
                  id="preparation"
                  placeholder="Szczegółowy opis kroków przygotowania przepisu..."
                  rows={10}
                  {...register("preparation")}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.preparation}
                  aria-required="true"
                />
                {errors.preparation && <p className="text-sm text-destructive">{errors.preparation.message}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
                {(() => {
                  if (isSubmitting) {
                    return (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Zapisywanie...
                      </>
                    );
                  }
                  if (!isValid) {
                    return (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Sprawdź błędy w formularzu
                      </>
                    );
                  }
                  return "Zapisz przepis";
                })()}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  globalThis.location.href = "/";
                }}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>

              {!isValid && (
                <p className="text-xs text-center text-muted-foreground">
                  Wszystkie wymagane pola muszą być wypełnione poprawnie
                </p>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
