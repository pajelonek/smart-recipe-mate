import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientsInput } from "./IngredientsInput";
import type { AIGenerateRecipeInput } from "@/types";
import type { FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

interface GenerationFormProps {
  readonly watch: UseFormWatch<AIGenerateRecipeInput>;
  readonly setValue: UseFormSetValue<AIGenerateRecipeInput>;
  readonly errors: FieldErrors<AIGenerateRecipeInput>;
  readonly isValid: boolean;
  readonly isGenerating: boolean;
  readonly onGenerate: () => Promise<void>;
}

/**
 * Form component for AI recipe generation input
 * Allows users to specify:
 * - Available ingredients (1-20 items)
 * - Dietary goals (optional)
 * - Additional context (optional)
 * Validates input in real-time and submits to generate recipe
 */
export function GenerationForm({ watch, setValue, errors, isValid, isGenerating, onGenerate }: GenerationFormProps) {
  const dietaryGoals = watch("dietary_goals");
  const additionalContext = watch("additional_context");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isGenerating) {
      await onGenerate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generuj przepis z AI
        </CardTitle>
        <CardDescription>
          Wprowadź dostępne składniki, a AI wygeneruje dla Ciebie spersonalizowany przepis
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <IngredientsInput watch={watch} setValue={setValue} errors={errors} disabled={isGenerating} />

          <div className="space-y-2">
            <Label htmlFor="dietary_goals">Cele dietetyczne (opcjonalne)</Label>
            <Textarea
              id="dietary_goals"
              placeholder="np. wysokobiałkowe, niskowęglowodanowe, wegańskie"
              rows={3}
              value={dietaryGoals || ""}
              onChange={(e) => setValue("dietary_goals", e.target.value, { shouldValidate: true })}
              disabled={isGenerating}
              aria-invalid={!!errors.dietary_goals}
            />
            {errors.dietary_goals && <p className="text-sm text-destructive">{errors.dietary_goals.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_context">Dodatkowy kontekst (opcjonalne)</Label>
            <Textarea
              id="additional_context"
              placeholder="np. Szybki obiad w tygodniu, Świąteczne danie, Przepis na 30 minut"
              rows={3}
              value={additionalContext || ""}
              onChange={(e) => setValue("additional_context", e.target.value, { shouldValidate: true })}
              disabled={isGenerating}
              aria-invalid={!!errors.additional_context}
            />
            {errors.additional_context && (
              <p className="text-sm text-destructive">{errors.additional_context.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isGenerating || !isValid}>
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Generowanie...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generuj przepis
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
