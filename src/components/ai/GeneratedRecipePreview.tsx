import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIGeneratedRecipe } from "@/types";
import { AcceptRejectButtons } from "./AcceptRejectButtons";

interface GeneratedRecipePreviewProps {
  readonly recipe: AIGeneratedRecipe;
  readonly onAccept: () => Promise<void>;
  readonly onReject: () => void;
  readonly isSaving: boolean;
}

export function GeneratedRecipePreview({ recipe, onAccept, onReject, isSaving }: GeneratedRecipePreviewProps) {
  const { title, summary, ingredients, preparation } = recipe;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <Badge variant="secondary">Wygenerowany przez AI</Badge>
        </div>
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="font-semibold text-lg">Składniki:</h3>
          <div className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-md">{ingredients}</div>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-lg">Sposób przygotowania:</h3>
          <div className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-md">{preparation}</div>
        </section>
      </CardContent>

      <AcceptRejectButtons onAccept={onAccept} onReject={onReject} isSaving={isSaving} />
    </Card>
  );
}
