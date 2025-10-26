import { useState } from "react";
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AIGenerateRecipeInputSchema } from "@/lib/validation/ai-generation.schemas";
import type {
  AIGenerateRecipeInput,
  AIGeneratedRecipe,
  AIGenerateRecipeResponse,
  AIGenerateRecipeErrorResponse,
  ApiError,
} from "@/types";

export interface UseAIGenerationReturn {
  // Form state
  register: UseFormRegister<AIGenerateRecipeInput>;
  watch: UseFormWatch<AIGenerateRecipeInput>;
  setValue: UseFormSetValue<AIGenerateRecipeInput>;
  errors: FieldErrors<AIGenerateRecipeInput>;
  isValid: boolean;
  // Generation state
  isGenerating: boolean;
  generatedRecipe: AIGeneratedRecipe | null;
  error: AIGenerateRecipeErrorResponse | ApiError | null;
  isSaving: boolean;
  // Actions
  generateRecipe: (accessToken: string) => Promise<void>;
  acceptRecipe: () => Promise<void>;
  rejectRecipe: () => void;
  resetError: () => void;
}

/**
 * Custom hook for managing AI recipe generation state and actions
 *
 * Provides:
 * - Form state management (react-hook-form with Zod validation)
 * - Generation state (loading, success, error)
 * - Recipe saving state
 * - Actions for generating, accepting, and rejecting recipes
 *
 * @returns {UseAIGenerationReturn} Object containing form controls, state, and action handlers
 */
export function useAIGeneration(): UseAIGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<AIGeneratedRecipe | null>(null);
  const [error, setError] = useState<AIGenerateRecipeErrorResponse | ApiError | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<AIGenerateRecipeInput>({
    resolver: zodResolver(AIGenerateRecipeInputSchema),
    mode: "onChange",
    defaultValues: {
      available_ingredients: [""],
      dietary_goals: "",
      additional_context: "",
    },
  });

  /**
   * Generates a recipe using AI based on user input and preferences
   * Handles all error cases (400, 404, 422, 429, 500) and network errors
   *
   * @param accessToken - User's authentication token
   */
  const generateRecipe = async (accessToken: string) => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = getValues();

      const response = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 422) {
          setError(errorData as AIGenerateRecipeErrorResponse);
        } else if (response.status === 404) {
          toast.error("Musisz uzupełnić preferencje w profilu");
          globalThis.location.href = "/profile";
          return;
        } else if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const message = retryAfter
            ? `Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} sekund`
            : "Zbyt wiele prób. Spróbuj ponownie później";
          toast.error(message);
          setError(errorData as ApiError);
        } else if (response.status === 400) {
          toast.error(errorData.message || "Popraw błędy w formularzu");
        } else if (response.status === 500) {
          toast.error("Błąd serwera. Spróbuj ponownie później");
          setError(errorData as ApiError);
        } else {
          setError(errorData as ApiError);
        }

        return;
      }

      const data: AIGenerateRecipeResponse = await response.json();
      setGeneratedRecipe(data.recipe);
      toast.success("Przepis został wygenerowany pomyślnie");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Błąd połączenia. Sprawdź połączenie internetowe";
      toast.error(errorMessage);
      setError({
        error: "Network error",
        message: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Saves the generated recipe to the user's recipe collection
   * Redirects to home page on success
   */
  const acceptRecipe = async () => {
    if (!generatedRecipe || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: generatedRecipe.title,
          summary: generatedRecipe.summary,
          ingredients: generatedRecipe.ingredients,
          preparation: generatedRecipe.preparation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Błąd podczas zapisywania przepisu");
        return;
      }

      await response.json();
      toast.success("Przepis został zapisany");
      globalThis.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Błąd podczas zapisywania przepisu";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Rejects the generated recipe and resets the view to show the form
   */
  const rejectRecipe = () => {
    setGeneratedRecipe(null);
    setError(null);
  };

  /**
   * Resets the error state to allow retrying generation
   */
  const resetError = () => {
    setError(null);
  };

  return {
    register,
    watch,
    setValue,
    errors,
    isValid,
    isGenerating,
    generatedRecipe,
    error,
    isSaving,
    generateRecipe,
    acceptRecipe,
    rejectRecipe,
    resetError,
  };
}
