import { GenerationForm } from "./GenerationForm";
import { LoadingSpinner } from "./LoadingSpinner";
import { GeneratedRecipePreview } from "./GeneratedRecipePreview";
import { ErrorMessage } from "./ErrorMessage";
import { useAIGeneration } from "@/hooks/useAIGeneration";

interface AIGenerateContentProps {
  readonly accessToken: string;
}

/**
 * Main container component for AI recipe generation view
 * Manages the overall state and conditionally renders:
 * - LoadingSpinner during generation
 * - ErrorMessage on errors
 * - GeneratedRecipePreview when recipe is ready
 * - GenerationForm for input
 *
 * @param accessToken - User's authentication token
 */
export function AIGenerateContent({ accessToken }: AIGenerateContentProps) {
  const {
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
  } = useAIGeneration();

  const handleGenerateRecipe = async () => {
    await generateRecipe(accessToken);
  };

  const handleAcceptRecipe = async () => {
    await acceptRecipe();
  };

  const handleRejectRecipe = () => {
    rejectRecipe();
  };

  const handleResetError = () => {
    resetError();
  };

  return (
    <div className="space-y-6">
      {isGenerating && <LoadingSpinner />}

      {error && !isGenerating && <ErrorMessage error={error} onRetry={handleResetError} />}

      {generatedRecipe && !isGenerating && (
        <GeneratedRecipePreview
          recipe={generatedRecipe}
          onAccept={handleAcceptRecipe}
          onReject={handleRejectRecipe}
          isSaving={isSaving}
        />
      )}

      {!isGenerating && !generatedRecipe && (
        <GenerationForm
          watch={watch}
          setValue={setValue}
          errors={errors}
          isValid={isValid}
          isGenerating={isGenerating}
          onGenerate={handleGenerateRecipe}
        />
      )}
    </div>
  );
}
