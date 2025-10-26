import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AIGenerateRecipeErrorResponse, ApiError } from "@/types";

interface ErrorMessageProps {
  readonly error: AIGenerateRecipeErrorResponse | ApiError;
  readonly onRetry: () => void;
}

function isAIGenerateRecipeErrorResponse(
  error: AIGenerateRecipeErrorResponse | ApiError
): error is AIGenerateRecipeErrorResponse {
  return "suggestions" in error;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const hasSuggestions = isAIGenerateRecipeErrorResponse(error);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive">Błąd generowania przepisu</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>

        {hasSuggestions && error.suggestions && error.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Sugestie:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {error.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="outline" onClick={onRetry} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  );
}
